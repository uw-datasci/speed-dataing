import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/auth/supabase-server";

/**
 * Clears the shared uwdatascience.ca session cookie. Because the session
 * is shared across club apps, this also signs the user out of the main
 * site and any sibling apps.
 */
export async function POST() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
