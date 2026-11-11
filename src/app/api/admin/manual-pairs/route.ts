import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

type ManualPair = {
  id: string;
  person1_id: string;
  person2_id: string;
  created_at: string;
  person1: { email: string; name: string };
  person2: { email: string; name: string };
};

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

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { data: pairs, error: pairsError } = await supabase
    .from("manual_match_pairs")
    .select("id, person1_id, person2_id, created_at")
    .order("created_at", { ascending: true });

  if (pairsError) {
    console.error("[Admin Manual Pairs API] Failed to fetch manual pairs:", pairsError);
    return NextResponse.json({ error: "Failed to fetch manual pairs" }, { status: 500 });
  }

  const participantIds = Array.from(
    new Set((pairs ?? []).flatMap((pair) => [pair.person1_id, pair.person2_id]))
  );
  let participantsById = new Map<string, { email: string; name: string }>();

  if (participantIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from("form_responses")
      .select("id, email, name")
      .in("id", participantIds);

    if (participantsError) {
      console.error("[Admin Manual Pairs API] Failed to fetch paired participants:", participantsError);
      return NextResponse.json({ error: "Failed to fetch paired participants" }, { status: 500 });
    }

    participantsById = new Map(
      (participants ?? []).map((participant) => [
        participant.id,
        { email: participant.email, name: participant.name },
      ])
    );
  }

  const result: ManualPair[] = (pairs ?? []).map((pair) => ({
    ...pair,
    person1: participantsById.get(pair.person1_id) ?? { email: "", name: "Unknown participant" },
    person2: participantsById.get(pair.person2_id) ?? { email: "", name: "Unknown participant" },
  }));

  return NextResponse.json({ pairs: result });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const pairingWindowError = await ensurePairingWindow();
  if (pairingWindowError) return pairingWindowError;

  let body: { email1?: unknown; email2?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Two email addresses are required" }, { status: 400 });
  }

  if (typeof body.email1 !== "string" || typeof body.email2 !== "string") {
    return NextResponse.json({ error: "Two email addresses are required" }, { status: 400 });
  }

  const email1 = body.email1.trim().toLowerCase();
  const email2 = body.email2.trim().toLowerCase();
  if (!email1 || !email2 || email1 === email2) {
    return NextResponse.json({ error: "Enter two different email addresses" }, { status: 400 });
  }

  const findParticipant = (email: string) =>
    supabase
      .from("form_responses")
      .select("id, email, name")
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();

  const [firstResult, secondResult] = await Promise.all([
    findParticipant(email1),
    findParticipant(email2),
  ]);

  if (firstResult.error || secondResult.error) {
    console.error("[Admin Manual Pairs API] Failed to look up participants:", {
      firstError: firstResult.error,
      secondError: secondResult.error,
    });
    return NextResponse.json({ error: "Failed to look up form responses" }, { status: 500 });
  }

  if (!firstResult.data || !secondResult.data) {
    const missingEmails = [
      !firstResult.data ? email1 : null,
      !secondResult.data ? email2 : null,
    ].filter((email): email is string => email !== null);
    return NextResponse.json(
      {
        error: "Both people must have submitted the form before they can be paired",
        missingEmails,
      },
      { status: 404 }
    );
  }

  const participantIds = [firstResult.data.id, secondResult.data.id].sort();
  const { data: existingPairs, error: existingPairsError } = await supabase
    .from("manual_match_pairs")
    .select("person1_id, person2_id")
    .or(`person1_id.in.(${participantIds.join(",")}),person2_id.in.(${participantIds.join(",")})`);

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
    .insert({ person1_id: participantIds[0], person2_id: participantIds[1] })
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

  const participantsById = new Map([
    [firstResult.data.id, firstResult.data],
    [secondResult.data.id, secondResult.data],
  ]);
  const person1 = participantsById.get(pair.person1_id)!;
  const person2 = participantsById.get(pair.person2_id)!;

  return NextResponse.json(
    {
      pair: {
        ...pair,
        person1: { email: person1.email, name: person1.name },
        person2: { email: person2.email, name: person2.name },
      },
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const pairingWindowError = await ensurePairingWindow();
  if (pairingWindowError) return pairingWindowError;

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
  }

  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("manual_match_pairs")
    .delete()
    .eq("id", body.id)
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
