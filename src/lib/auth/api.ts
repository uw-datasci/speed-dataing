import "server-only";

import { NextResponse } from "next/server";
import { getAuthenticatedUser, type AuthenticatedUser } from "./session";

/**
 * Route-handler guard. Returns the authenticated user, or a 401 response
 * to return directly:
 *
 *   const auth = await requireSessionApi();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireSessionApi(): Promise<
  AuthenticatedUser | NextResponse
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return user;
}

/** Like requireSessionApi but returns 403 unless the role is exec or admin. */
export async function requireAdminApi(): Promise<
  AuthenticatedUser | NextResponse
> {
  const auth = await requireSessionApi();
  if (auth instanceof NextResponse) return auth;
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  return auth;
}
