import assert from "node:assert/strict";
import { test } from "node:test";
import { createConversationStarterGenerator } from "../src/lib/matchmaker/conversationStarters";
import { getFallbackConversationStarters, parseConversationStarters } from "../src/lib/matchmaker/conversationStarterData";

// All service URLs and credentials in this process are fake, including for imports.
process.env.SUPABASE_URL = "https://supabase.example";
process.env.SUPABASE_ANON_KEY = "test-supabase-key";
process.env.LLM_API_KEY = "test-anthropic-key";
delete process.env.OPENAI_API_KEY;
const { addConversationStarters } = await import("../src/lib/matchmaker/addConversationStarters");

const output = {
  first: { type: "commonality", text: "You both enjoy hiking." },
  second: { type: "question", text: "Which trail would you like to explore next?" },
};

function messageResponse(value: unknown = output, stopReason = "end_turn") {
  return new Response(JSON.stringify({
    id: "msg_test", type: "message", role: "assistant", model: "test-model",
    content: [{ type: "text", text: JSON.stringify(value) }],
    stop_reason: stopReason, stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
  }), { headers: { "content-type": "application/json" } });
}

test("generates two starters from filtered profiles and decoded choices without OpenAI", async () => {
  let calls = 0;
  const generate = createConversationStarterGenerator({
    apiKey: "test-anthropic-key",
    model: "test-model",
    fetch: async (_input, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "test-model");
      assert.equal(body.output_config.format.type, "json_schema");
      const profiles = JSON.parse(body.messages[0].content);
      assert.equal(profiles.person1.class_seat, "Sit in the back and play Clash Royale.");
      assert.equal(profiles.person1.fun.length, 500);
      assert.equal(profiles.person2.music, "Jazz");
      assert.equal(profiles.person2.caught_watching, undefined);
      for (const field of ["id", "name", "email", "social_media_links", "pronouns", "intention", "vector_embedding"]) {
        assert.equal(profiles.person1[field], undefined, `${field} must not be sent`);
      }
      return messageResponse();
    },
  });
  const person1 = {
    id: "private-id", name: "Private Name", email: "private@example.com",
    social_media_links: "https://private.example", pronouns: "private", intention: 1,
    vector_embedding: [1, 0], fun: "h".repeat(600), class_seat: "b",
  };
  const result = await generate(person1, { music: " Jazz ", caught_watching: "invalid" });
  assert.equal(calls, 1);
  assert.equal(result.usedFallback, false);
  assert.deepEqual(result.starters, [output.first, output.second]);
});

test("missing key, missing partner, empty profiles, and expired deadline never call Anthropic", async () => {
  let calls = 0;
  const fetch: typeof globalThis.fetch = async () => { calls++; throw new Error("Unexpected request"); };
  const missingKey = createConversationStarterGenerator({ apiKey: "", fetch });
  const generate = createConversationStarterGenerator({ apiKey: "test-key", fetch });
  const results = await Promise.all([
    missingKey({ fun: "hiking" }, { fun: "hiking" }),
    generate(null, { fun: "hiking" }),
    generate({}, { fun: null }),
    generate({ fun: "hiking" }, { fun: "hiking" }, AbortSignal.abort()),
  ]);
  for (const result of results) {
    assert.equal(result.usedFallback, true);
    assert.deepEqual(result.starters, getFallbackConversationStarters());
  }
  assert.equal(calls, 0);
});

test("unusable model output always falls back to two complete questions", async (t) => {
  const cases = [
    { name: "missing item", value: { first: output.first } },
    { name: "wrong type", value: { ...output, first: { type: "other", text: "Hello" } } },
    { name: "empty text", value: { ...output, first: { type: "question", text: "  " } } },
    { name: "long text", value: { ...output, first: { type: "question", text: "x".repeat(241) } } },
    { name: "duplicates", value: { first: output.first, second: { ...output.first, text: " YOU both enjoy hiking. " } } },
    { name: "null response", value: null },
    { name: "refusal", value: output, stopReason: "refusal" },
    { name: "truncated output", value: output, stopReason: "max_tokens" },
  ];
  for (const item of cases) {
    await t.test(item.name, async () => {
      const generate = createConversationStarterGenerator({
        apiKey: "test-key", fetch: async () => messageResponse(item.value, item.stopReason),
      });
      const result = await generate({ fun: "hiking" }, { fun: "hiking" });
      assert.equal(result.usedFallback, true);
      assert.deepEqual(result.starters, getFallbackConversationStarters());
    });
  }
});

test("malformed JSON and provider authentication errors use fallback questions", async () => {
  for (const response of [
    new Response(JSON.stringify({ content: [{ type: "text", text: "not JSON" }], stop_reason: "end_turn" }), { headers: { "content-type": "application/json" } }),
    new Response(JSON.stringify({ error: { type: "authentication_error", message: "test rejection" } }), { status: 401, headers: { "content-type": "application/json" } }),
  ]) {
    const generate = createConversationStarterGenerator({ apiKey: "test-key", fetch: async () => response });
    const result = await generate({ fun: "hiking" }, { fun: "hiking" });
    assert.equal(result.usedFallback, true);
  }
});

test("a transient rate limit is retried and can still produce starters", async () => {
  let calls = 0;
  const generate = createConversationStarterGenerator({
    apiKey: "test-key",
    fetch: async () => {
      calls++;
      return calls === 1
        ? new Response(JSON.stringify({ error: { type: "rate_limit_error", message: "test limit" } }), { status: 429, headers: { "content-type": "application/json", "retry-after-ms": "1" } })
        : messageResponse();
    },
  });
  const result = await generate({ fun: "hiking" }, { fun: "hiking" });
  assert.equal(calls, 2);
  assert.equal(result.usedFallback, false);
});

test("an in-flight shared deadline abort produces fallback questions", async () => {
  const controller = new AbortController();
  const generate = createConversationStarterGenerator({
    apiKey: "test-key",
    fetch: async (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      controller.abort();
    }),
  });
  const result = await generate({ fun: "hiking" }, { fun: "hiking" }, controller.signal);
  assert.equal(result.usedFallback, true);
});

test("legacy, malformed, and duplicate JSONB values are rejected safely", () => {
  for (const value of [null, undefined, {}, [], [output.first], [output.first, output.second, output.first], [null, output.second]]) {
    assert.equal(parseConversationStarters(value), null);
  }
  assert.deepEqual(parseConversationStarters([output.first, { ...output.second, text: "  What's   next? " }]), [output.first, { type: "question", text: "What's next?" }]);
});

test("round enrichment loads profiles once, limits concurrency, and keeps starters with their pair", async (t) => {
  let profileReads = 0;
  let active = 0;
  let peak = 0;
  const matches = Array.from({ length: 7 }, (_, index) => ({
    person1_id: `a-${index}`, person2_id: `b-${index}`, similarity_score: 0.8, emoji: "💖",
  }));
  const profiles = matches.flatMap((match, index) => [
    { id: match.person1_id, fun: `hobby ${index}` }, { id: match.person2_id, fun: `hobby ${index}` },
  ]);
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === "supabase.example") {
      profileReads++;
      const fields = url.searchParams.get("select")?.split(",") ?? [];
      assert.ok(fields.includes("fun"));
      assert.ok(!fields.includes("email"));
      return new Response(JSON.stringify(profiles), { headers: { "content-type": "application/json" } });
    }
    assert.equal(url.hostname, "api.anthropic.com");
    active++;
    peak = Math.max(peak, active);
    const body = JSON.parse(String(init?.body));
    const pair = JSON.parse(body.messages[0].content);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return messageResponse({
      first: { type: "commonality", text: `You both enjoy ${pair.person1.fun}.` }, second: output.second,
    });
  });
  const enriched = await addConversationStarters(matches);
  assert.equal(profileReads, 1);
  assert.equal(peak, 4);
  enriched.forEach((match, index) => {
    assert.equal(match.person1_id, matches[index].person1_id);
    assert.equal(match.conversation_starters?.[0].text, `You both enjoy hobby ${index}.`);
    assert.equal(matches[index].emoji, match.emoji);
  });
  assert.ok(!("conversation_starters" in matches[0]), "input matches are not mutated");
});

test("profile lookup failure preserves pairs with fallback questions", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    assert.equal(new URL(input instanceof Request ? input.url : String(input)).hostname, "supabase.example");
    return new Response(JSON.stringify({ message: "test failure" }), { status: 400, headers: { "content-type": "application/json" } });
  });
  const matches = [{ person1_id: "a", person2_id: "b", similarity_score: 0.8, emoji: "💖" }];
  const result = await addConversationStarters(matches);
  assert.deepEqual(result, [{ ...matches[0], conversation_starters: getFallbackConversationStarters() }]);
});

test("matching imports and cached embeddings work without an OpenAI key", async (t) => {
  // dotenv may load other settings on import, but this file intentionally has no OpenAI key.
  const { updateFormResponsesTableWithVectorEmbeddings } = await import("../src/lib/matchmaker/embeddings");
  delete process.env.OPENAI_API_KEY;
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    assert.equal(new URL(input instanceof Request ? input.url : String(input)).hostname, "supabase.example");
    calls++;
    return new Response(JSON.stringify([{ id: "cached", vector_embedding: [1, 0] }]), { headers: { "content-type": "application/json" } });
  });
  await updateFormResponsesTableWithVectorEmbeddings();
  assert.equal(calls, 1);
});

test("missing embeddings report a clear error without an OpenAI key", async (t) => {
  const { updateFormResponsesTableWithVectorEmbeddings } = await import("../src/lib/matchmaker/embeddings");
  delete process.env.OPENAI_API_KEY;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    assert.equal(new URL(input instanceof Request ? input.url : String(input)).hostname, "supabase.example");
    return new Response(JSON.stringify([{ id: "uncached", vector_embedding: null }]), { headers: { "content-type": "application/json" } });
  });
  await assert.rejects(updateFormResponsesTableWithVectorEmbeddings(), /OPENAI_API_KEY is required/);
});
