import { NextResponse, type NextRequest } from "next/server";
import { createAuthMiddlewareClient } from "@/lib/auth/supabase-middleware";

/**
 * Refresh-only middleware: rotates the shared uwdatascience.ca Supabase
 * session cookie when it is near expiry. Access control lives in the
 * server route-group layouts ((member)/layout.tsx, admin/layout.tsx) and
 * the API guards in src/lib/auth/api.ts.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  const supabase = createAuthMiddlewareClient(request, response);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
