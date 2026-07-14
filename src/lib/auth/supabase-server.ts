import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfig, getSharedCookieOptions } from "./config";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * Reads the session cookie set by the main club site at
 * `Domain=.uwdatascience.ca`. We never sign users in here — the main site
 * at www.uwdatascience.ca owns the login flow. Cookie writes are silently
 * swallowed inside Server Components because Next.js doesn't allow mutating
 * cookies during render; the middleware is what actually refreshes tokens.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    authConfig.supabaseUrl,
    authConfig.supabasePublishableKey,
    {
      cookieOptions: getSharedCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as CookieOptions);
            }
          } catch {
            // Called from a Server Component - middleware refreshes instead.
          }
        },
      },
    },
  );
}
