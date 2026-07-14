import "server-only";

import { redirect } from "next/navigation";
import { authConfig } from "./config";
import { createAuthServerClient } from "./supabase-server";

/** Roles from the main site that may access admin pages/APIs. */
export const ADMIN_ROLES = new Set(["admin", "exec"]);

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** Raw app_metadata.role from the club site: member | exec | admin. */
  role: string;
  isAdmin: boolean;
}

/**
 * Returns the authenticated user, or null. Calls `auth.getUser()` (which
 * revalidates the token server-side) instead of relying on the local
 * session, so we don't trust a stale cookie.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const role = (data.user.app_metadata?.role as string | undefined) ?? "member";
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role,
    isAdmin: ADMIN_ROLES.has(role),
  };
}

/**
 * Server-side guard: redirects to the main club site's login page when no
 * session is present. Returns the authenticated user on success.
 */
export async function requireSession(
  returnTo?: string,
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    const loginUrl = new URL("/login", authConfig.mainSiteUrl);
    if (returnTo) loginUrl.searchParams.set("redirect", returnTo);
    redirect(loginUrl.toString());
  }
  return user;
}

/**
 * Like requireSession but additionally requires an exec or admin role.
 * Redirects to /unauthorized otherwise.
 */
export async function requireAdmin(
  returnTo?: string,
): Promise<AuthenticatedUser> {
  const user = await requireSession(returnTo);
  if (!user.isAdmin) redirect("/unauthorized");
  return user;
}
