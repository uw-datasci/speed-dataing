import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/auth/api";

/** Typeahead results must reflect the latest submissions — never cache. */
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

/* PostgREST's or() syntax treats , . : ( ) as delimiters, so a query like
   "Zhang, C" would split the filter. Double-quoting the value makes them
   literal; backslash and quote are the only characters to escape inside. */
function quoteFilterValue(value: string) {
  return `"${value.replace(/["\\]/g, "\\$&")}"`;
}

/**
 * Admin-only participant search for the manual pairing picker. Matches name
 * or email only — a WatIAM id is the email's local part, so it matches too —
 * and selects just the four fields the picker shows, not the embedding.
 */
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const requested = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  if (!q) {
    return NextResponse.json({ success: true, participants: [] });
  }

  const pattern = quoteFilterValue(`%${q}%`);
  const { data, error } = await supabase
    .from("form_responses")
    .select("id, name, email, pronouns")
    .or(`name.ilike.${pattern},email.ilike.${pattern}`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[Participant Search API] Query failed:", error);
    return NextResponse.json(
      { error: "Failed to search participants" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, participants: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
