import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

/*
 * Admin manual pairing. The request and response shapes follow the contract
 * documented in src/lib/manual-pairs.ts, which the manual pairing UI calls.
 */

export const dynamic = "force-dynamic";

type Participant = { id: string; name: string; email: string; pronouns: string | null };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function toParticipant(row: { id: string; name: string | null; email: string | null; pronouns: string | null }): Participant {
  return {
    id: row.id,
    name: row.name || "(no name)",
    email: row.email ?? "",
    pronouns: row.pronouns || null,
  };
}

function unknownParticipant(id: string): Participant {
  return { id, name: "Unknown participant", email: "", pronouns: null };
}

/** Manual pairs can only change before matching starts, so the algorithm sees a fixed set. */
async function ensurePairingWindow() {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "session_state")
    .single();

  if (error) {
    console.error("[Admin Manual Pairs API] Failed to check session state:", error);
    return NextResponse.json({ error: "Failed to check session state" }, { status: 500 });
  }

  if (data.value !== "idle" && data.value !== "form_active") {
    return NextResponse.json(
      { error: "Manual pairs can only be changed before matching starts" },
      { status: 409 }
    );
  }

  return null;
}

async function fetchParticipants(ids: string[]) {
  const { data, error } = await supabase
    .from("form_responses")
    .select("id, name, email, pronouns")
    .in("id", ids);
  return {
    error,
    byId: new Map((data ?? []).map((row) => [row.id, toParticipant(row)])),
  };
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { data: pairs, error: pairsError } = await supabase
    .from("manual_match_pairs")
    .select("id, person1_id, person2_id, created_at")
    .order("created_at", { ascending: false });

  if (pairsError) {
    console.error("[Admin Manual Pairs API] Failed to fetch manual pairs:", pairsError);
    return NextResponse.json({ error: "Failed to fetch manual pairs" }, { status: 500 });
  }

  const ids = Array.from(new Set((pairs ?? []).flatMap((p) => [p.person1_id, p.person2_id])));
  let byId = new Map<string, Participant>();
  if (ids.length > 0) {
    const result = await fetchParticipants(ids);
    if (result.error) {
      console.error("[Admin Manual Pairs API] Failed to fetch paired participants:", result.error);
      return NextResponse.json({ error: "Failed to fetch paired participants" }, { status: 500 });
    }
    byId = result.byId;
  }

  return NextResponse.json(
    {
      success: true,
      pairs: (pairs ?? []).map((pair) => ({
        id: pair.id,
        created_at: pair.created_at,
        person1: byId.get(pair.person1_id) ?? unknownParticipant(pair.person1_id),
        person2: byId.get(pair.person2_id) ?? unknownParticipant(pair.person2_id),
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  let body: { person1_id?: unknown; person2_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Two participants are required" }, { status: 400 });
  }

  if (!isUuid(body.person1_id) || !isUuid(body.person2_id)) {
    return NextResponse.json({ error: "Two participants are required" }, { status: 400 });
  }
  if (body.person1_id === body.person2_id) {
    return NextResponse.json({ error: "Choose two different people" }, { status: 400 });
  }

  const pairingWindowError = await ensurePairingWindow();
  if (pairingWindowError) return pairingWindowError;

  // Stored in a fixed order so the unique index treats A+B and B+A as the same pair.
  const ids = [body.person1_id, body.person2_id].sort();

  const participants = await fetchParticipants(ids);
  if (participants.error) {
    console.error("[Admin Manual Pairs API] Failed to look up participants:", participants.error);
    return NextResponse.json({ error: "Failed to look up form responses" }, { status: 500 });
  }
  if (!participants.byId.has(ids[0]) || !participants.byId.has(ids[1])) {
    return NextResponse.json(
      { error: "Both people must have submitted the form before they can be paired" },
      { status: 404 }
    );
  }

  const { data: existingPairs, error: existingPairsError } = await supabase
    .from("manual_match_pairs")
    .select("id")
    .or(`person1_id.in.(${ids.join(",")}),person2_id.in.(${ids.join(",")})`);

  if (existingPairsError) {
    console.error("[Admin Manual Pairs API] Failed to check existing pair assignments:", existingPairsError);
    return NextResponse.json({ error: "Failed to check existing pair assignments" }, { status: 500 });
  }
  if (existingPairs?.length) {
    return NextResponse.json(
      { error: "One or both people are already assigned to a manual pair" },
      { status: 409 }
    );
  }

  const { data: pair, error: insertError } = await supabase
    .from("manual_match_pairs")
    .insert({ person1_id: ids[0], person2_id: ids[1] })
    .select("id, person1_id, person2_id, created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "One or both people are already assigned to a manual pair" },
        { status: 409 }
      );
    }
    console.error("[Admin Manual Pairs API] Failed to create manual pair:", insertError);
    return NextResponse.json({ error: "Failed to create manual pair" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    pair: {
      id: pair.id,
      created_at: pair.created_at,
      person1: participants.byId.get(pair.person1_id)!,
      person2: participants.byId.get(pair.person2_id)!,
    },
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
  }

  const pairingWindowError = await ensurePairingWindow();
  if (pairingWindowError) return pairingWindowError;

  const { data, error } = await supabase
    .from("manual_match_pairs")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[Admin Manual Pairs API] Failed to remove manual pair:", error);
    return NextResponse.json({ error: "Failed to remove manual pair" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Manual pair not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
