import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";
import { MEN_PRONOUN_PATTERN, WOMEN_PRONOUN_PATTERN } from "@/lib/gender";

/** Polled every few seconds by /admin/live-ratio — never cache it. */
export const dynamic = "force-dynamic";

/**
 * Counts matching rows server-side without transferring any of them.
 *
 * `head: true` means no row payload at all, which also sidesteps PostgREST's
 * row ceiling (1000 by default) — selecting the pronouns column and tallying
 * in JS would silently undercount once the table passes that limit.
 */
function countByPronouns(pattern: string) {
  return supabase
    .from("form_responses")
    .select("*", { count: "exact", head: true })
    .ilike("pronouns", pattern);
}

/** Admin-only — live count of submitted profiles by gender. */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const [menResult, womenResult] = await Promise.all([
    countByPronouns(MEN_PRONOUN_PATTERN),
    countByPronouns(WOMEN_PRONOUN_PATTERN),
  ]);

  const failure = menResult.error ?? womenResult.error;
  if (failure) {
    console.error("[Live Ratio API] Count query failed:", failure);
    return NextResponse.json(
      { error: "Failed to count participants" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      men: menResult.count ?? 0,
      women: womenResult.count ?? 0,
      lastUpdated: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
