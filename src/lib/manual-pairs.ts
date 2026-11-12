/**
 * Client-side API layer for admin manual pairing.
 *
 * Every network call the manual-pairing UI makes lives here, so the server
 * contract is in one place. Import the functions, never fetch() directly from
 * a component.
 *
 * ---------------------------------------------------------------------------
 * CONTRACT — endpoints owned by the matching/backend side of this feature.
 * All four are admin-only; guard them with requireAdminApi() from
 * src/lib/auth/api.ts, as src/app/api/admin/live-ratio/route.ts does.
 *
 *   GET /api/admin/manual-pairs
 *     200 { success: true, pairs: ManualPair[] }      // newest first
 *
 *   POST /api/admin/manual-pairs
 *     body { person1_id: string, person2_id: string } // form_responses.id
 *     200 { success: true, pair: ManualPair }
 *     400 { error } — missing field, or the same person twice
 *     404 { error } — one of the ids is not in form_responses
 *     409 { error } — either person is already in a manual pair, or matching
 *                     has started (pairs can only change while the round is
 *                     idle or the form is open)
 *
 *   DELETE /api/admin/manual-pairs?id=<pair id>
 *     200 { success: true }
 *     404 { error } — no such pair
 *     409 { error } — matching has started
 *
 *   GET /api/admin/participants/search?q=<text>&limit=<n>
 *     200 { success: true, participants: ParticipantSummary[] }
 *     Matches name or email only, sorted by name. Built — see
 *     src/app/api/admin/participants/search/route.ts.
 *
 * Errors are always { error: string } with a 4xx/5xx status.
 * ---------------------------------------------------------------------------
 */

/** The participant fields the pairing UI needs — never the vector embedding. */
export interface ParticipantSummary {
  id: string;
  name: string;
  email: string;
  pronouns: string | null;
}

/** One hand-made pair, as the list endpoint returns it. */
export interface ManualPair {
  id: string;
  person1: ParticipantSummary;
  person2: ParticipantSummary;
  created_at: string;
}

/**
 * A manual-pairing route that has not been implemented yet, as distinct from
 * a route that answered "not found". Next.js serves an HTML 404 page for an
 * unknown path, while a real handler always sends JSON, so the content type
 * tells the two apart — letting the UI say "not wired up yet" instead of
 * showing an admin a misleading failure.
 */
export class EndpointMissingError extends Error {
  constructor(path: string) {
    super(`${path} is not implemented yet`);
    this.name = "EndpointMissingError";
  }
}

/** Any error the server reported, carrying its status for the caller. */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Reads a JSON body, mapping transport and server errors onto the two classes above. */
async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");

  if (!isJson) {
    // An HTML body on 404/501 means the route itself is absent.
    if (res.status === 404 || res.status === 501) throw new EndpointMissingError(path);
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }

  const body = await res.json();
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

const SEARCH_LIMIT = 8;

/** Participants whose name or email (and so WatIAM id) matches `query`, for the picker. */
export async function searchParticipants(
  query: string,
  signal?: AbortSignal,
): Promise<ParticipantSummary[]> {
  const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });

  const body = await readJson<{ participants?: Array<Partial<ParticipantSummary>> }>(
    `/api/admin/participants/search?${params}`,
    { signal },
  );

  return (body.participants ?? []).map((row) => ({
    id: String(row.id),
    name: row.name || "(no name)",
    email: row.email ?? "",
    pronouns: row.pronouns || null,
  }));
}

/** Every manual pair currently locked in. */
export async function fetchManualPairs(signal?: AbortSignal): Promise<ManualPair[]> {
  const body = await readJson<{ pairs?: ManualPair[] }>("/api/admin/manual-pairs", {
    signal,
  });
  return body.pairs ?? [];
}

/** Locks two participants together, taking them out of the general algorithm. */
export async function createManualPair(
  person1Id: string,
  person2Id: string,
): Promise<ManualPair> {
  const body = await readJson<{ pair: ManualPair }>("/api/admin/manual-pairs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person1_id: person1Id, person2_id: person2Id }),
  });
  return body.pair;
}

/** Releases a manual pair back to the general algorithm. */
export async function deleteManualPair(pairId: string): Promise<void> {
  await readJson<{ success: true }>(
    `/api/admin/manual-pairs?id=${encodeURIComponent(pairId)}`,
    { method: "DELETE" },
  );
}
