import "server-only";

import { supabase } from "../supabase";
import { createConversationStarterGenerator, type ConversationProfile } from "./conversationStarters";
import { getFallbackConversationStarters } from "./conversationStarterData";
import type { Match } from "./types";

const GENERATION_BUDGET_MS = 45_000;
const CONCURRENCY = 4;

/** Enrich selected pairs once, before their shared match rows are inserted. */
export async function addConversationStarters(matches: Match[]): Promise<Match[]> {
  const enriched = matches.map((match) => ({
    ...match,
    conversation_starters: getFallbackConversationStarters(),
  }));
  if (!matches.length) return enriched;
  if (!process.env.LLM_API_KEY?.trim()) {
    console.warn("[Conversation Starters] LLM_API_KEY missing; using fallback questions.");
    return enriched;
  }

  // One shared deadline bounds retries and queued work for the entire round.
  const signal = AbortSignal.timeout(GENERATION_BUDGET_MS);
  const ids = [...new Set(matches.flatMap((match) => [match.person1_id, match.person2_id]))];
  let profiles: (ConversationProfile & { id: string })[];
  try {
    const { data, error } = await supabase
      .from("form_responses")
      .select("id, program, year, career, friend_traits, self_desc, goal, fun, music, class_seat, evil_hobby, most_likely_to, caught_watching")
      .in("id", ids)
      .abortSignal(signal);
    if (error || !data) {
      console.warn("[Conversation Starters] Could not load profiles; using fallback questions.");
      return enriched;
    }
    profiles = data;
  } catch {
    console.warn("[Conversation Starters] Could not load profiles; using fallback questions.");
    return enriched;
  }

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const generate = createConversationStarterGenerator();
  let nextIndex = 0;
  let fallbackCount = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, matches.length) }, async () => {
    while (nextIndex < matches.length) {
      const index = nextIndex++;
      const match = matches[index];
      const result = await generate(byId.get(match.person1_id), byId.get(match.person2_id), signal);
      enriched[index].conversation_starters = result.starters;
      if (result.usedFallback) fallbackCount++;
    }
  }));

  console.log(`[Conversation Starters] ${matches.length - fallbackCount} pairs generated; ${fallbackCount} pairs used fallback questions.`);
  return enriched;
}
