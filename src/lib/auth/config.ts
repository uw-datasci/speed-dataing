/**
 * Server-side auth configuration for the shared uwdatascience.ca Supabase
 * Auth project. This is a DIFFERENT Supabase project from the app's own
 * data store (src/lib/supabase.ts) — it is only used to read/verify the
 * session cookie set by the main club site.
 *
 * No "server-only" import here: the middleware (edge runtime) also needs
 * these values. Never import this from client components.
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const authConfig = {
  get supabaseUrl() {
    return requireEnv("AUTH_SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return requireEnv("AUTH_SUPABASE_PUBLISHABLE_KEY");
  },
  /** e.g. ".uwdatascience.ca" in prod; unset on localhost. */
  get cookieDomain() {
    return process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
  },
  get mainSiteUrl() {
    return requireEnv("NEXT_PUBLIC_MAIN_SITE_URL");
  },
};

/**
 * Cookie options matching the main site's (uwdsc-website-v3
 * packages/server/db/src/config/supabase.ts) so refreshed or cleared
 * cookies stay scoped to the parent domain instead of creating a
 * host-only shadow cookie on this subdomain.
 */
export function getSharedCookieOptions() {
  const domain = authConfig.cookieDomain;
  return domain
    ? { domain, sameSite: "lax" as const, secure: true, path: "/" }
    : undefined;
}
