import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { authConfig, getSharedCookieOptions } from "./config";

/**
 * Supabase client for Next.js middleware. Reads cookies from the incoming
 * request and writes refreshed cookies onto both the rewritten request and
 * the outgoing response (so the next handler sees the new token and the
 * browser stores it).
 */
export function createAuthMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    authConfig.supabaseUrl,
    authConfig.supabasePublishableKey,
    {
      cookieOptions: getSharedCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );
}
