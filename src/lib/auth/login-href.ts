import { headers } from "next/headers";
import { authConfig } from "./config";

/**
 * Absolute URL of the given path on this app, derived from the incoming
 * request headers (works behind proxies via x-forwarded-*).
 */
export async function buildCurrentUrl(path = "/"): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}${path}` : path;
}

/**
 * Main-site login URL that returns the user to `path` on this app after
 * signing in with their uwdatascience.ca account.
 */
export async function buildLoginHref(path = "/"): Promise<string> {
  const returnTo = await buildCurrentUrl(path);
  return `${authConfig.mainSiteUrl}/login?redirect=${encodeURIComponent(returnTo)}`;
}
