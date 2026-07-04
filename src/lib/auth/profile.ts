import "server-only";

import { createAuthServerClient } from "./supabase-server";

interface ProfileRow {
  first_name: string | null;
  last_name: string | null;
}

/**
 * Reads the user's display name from the main club site's `profiles` table.
 * Returns null if the profile doesn't exist or is incomplete (e.g. the user
 * hasn't finished onboarding on the main site yet).
 */
export async function getProfileName(userId: string): Promise<string | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) return null;
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return name || null;
}
