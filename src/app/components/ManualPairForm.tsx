"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaLink, FaSync, FaUnlink } from "react-icons/fa";
import ParticipantPicker from "@/app/components/ParticipantPicker";
import {
  createManualPair,
  deleteManualPair,
  fetchManualPairs,
  EndpointMissingError,
  type ManualPair,
  type ParticipantSummary,
} from "@/lib/manual-pairs";

/**
 * Admin manual pairing. Search two participants, lock them together, and
 * review or release the pairs already locked in. Creating a pair takes both
 * people out of the general matching algorithm.
 *
 * Access is enforced server-side by src/app/admin/layout.tsx.
 */
export default function ManualPairForm() {
  const [person1, setPerson1] = useState<ParticipantSummary | null>(null);
  const [person2, setPerson2] = useState<ParticipantSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pairs, setPairs] = useState<ManualPair[]>([]);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  /* Set when the routes are absent rather than failing, so the page can say
     so plainly instead of showing an admin a misleading error. */
  const [notWired, setNotWired] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingUnpair, setConfirmingUnpair] = useState<string | null>(null);
  const [unpairing, setUnpairing] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadPairs = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingPairs(true);
    try {
      const found = await fetchManualPairs(controller.signal);
      if (controller.signal.aborted) return;
      setPairs(found);
      setListError(null);
      setNotWired(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof EndpointMissingError) {
        setNotWired(true);
        setListError(null);
      } else {
        setListError(err instanceof Error ? err.message : "Could not load pairs");
      }
    } finally {
      if (!controller.signal.aborted) setLoadingPairs(false);
    }
  }, []);

  useEffect(() => {
    loadPairs();
    return () => abortRef.current?.abort();
  }, [loadPairs]);

  const bothChosen = person1 !== null && person2 !== null;

  const handlePair = async () => {
    if (!person1 || !person2) return;

    setSubmitting(true);
    setActionError(null);
    setNotice(null);
    try {
      const pair = await createManualPair(person1.id, person2.id);
      // Prepend rather than refetch, so the new pair shows even while the
      // list endpoint is slow — then reconcile with the server.
      setPairs((current) => [pair, ...current]);
      setNotice(`Paired ${person1.name} with ${person2.name}.`);
      setPerson1(null);
      setPerson2(null);
      setNotWired(false);
      loadPairs();
    } catch (err) {
      if (err instanceof EndpointMissingError) {
        setActionError(
          "The pairing endpoint (POST /api/admin/manual-pairs) is not implemented yet.",
        );
        setNotWired(true);
      } else {
        setActionError(err instanceof Error ? err.message : "Could not create pair");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpair = async (pair: ManualPair) => {
    setUnpairing(pair.id);
    setActionError(null);
    setNotice(null);
    try {
      await deleteManualPair(pair.id);
      setPairs((current) => current.filter((p) => p.id !== pair.id));
      setNotice(
        `Released ${pair.person1.name} and ${pair.person2.name} back to the algorithm.`,
      );
    } catch (err) {
      if (err instanceof EndpointMissingError) {
        setActionError(
          "The unpair endpoint (DELETE /api/admin/manual-pairs) is not implemented yet.",
        );
      } else {
        setActionError(err instanceof Error ? err.message : "Could not unpair");
      }
    } finally {
      setUnpairing(null);
      setConfirmingUnpair(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-valentine-light">
      <div className="p-4 sm:p-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-valentine-red/70 transition-colors hover:text-valentine-red"
        >
          <FaArrowLeft className="text-xs" />
          Back to dashboard
        </Link>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-valentine-red sm:text-4xl">
            Manual Pairing
          </h1>
          <p className="text-gray-600">
            Pick two participants to pair by hand. A manual pair is locked in and
            both people are left out of the general matching algorithm.
          </p>
        </header>

        {notWired && (
          <p className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The manual-pairing API is not available yet. Searching participants
            works, but pairs cannot be saved or listed until{" "}
            <code className="font-mono text-xs">/api/admin/manual-pairs</code> is
            implemented.
          </p>
        )}

        {/* Pair builder */}
        <section className="mb-10 rounded-lg border-2 border-valentine-red bg-white p-5 shadow-lg sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <ParticipantPicker
              label="Person 1"
              value={person1}
              onChange={setPerson1}
              excludeId={person2?.id}
              disabled={submitting}
            />
            <ParticipantPicker
              label="Person 2"
              value={person2}
              onChange={setPerson2}
              excludeId={person1?.id}
              disabled={submitting}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handlePair}
              disabled={!bothChosen || submitting}
              className="flex items-center gap-2 rounded-lg bg-valentine-red px-5 py-3 font-semibold text-white transition-colors hover:bg-valentine-pink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaLink className={submitting ? "animate-pulse" : ""} />
              {submitting ? "Pairing…" : "Pair these two"}
            </button>
            {!bothChosen && (
              <span className="text-sm text-gray-500">
                Choose both people to continue.
              </span>
            )}
          </div>

          <p aria-live="polite" className="mt-4 empty:mt-0">
            {actionError && (
              <span className="block rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </span>
            )}
            {notice && !actionError && (
              <span className="block rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                {notice}
              </span>
            )}
          </p>
        </section>

        {/* Existing pairs */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-valentine-red">
              Locked pairs{!loadingPairs && !notWired && ` (${pairs.length})`}
            </h2>
            <button
              type="button"
              onClick={loadPairs}
              disabled={loadingPairs}
              className="flex items-center gap-2 rounded-lg border-2 border-valentine-red bg-white px-3 py-1.5 text-sm font-medium text-valentine-red transition-colors hover:bg-valentine-red hover:text-white disabled:opacity-50"
            >
              <FaSync className={loadingPairs ? "animate-spin" : ""} />
              refresh
            </button>
          </div>

          {listError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {listError}
            </p>
          )}

          {!listError && loadingPairs && (
            <p className="text-sm text-gray-500">Loading pairs…</p>
          )}

          {!listError && !loadingPairs && pairs.length === 0 && (
            <p className="rounded-lg border-2 border-dashed border-grey1 bg-white/50 px-4 py-8 text-center text-sm text-gray-500">
              {notWired
                ? "Nothing to show until the API is available."
                : "No manual pairs yet. Everyone is in the general algorithm."}
            </p>
          )}

          <ul className="space-y-3">
            {pairs.map((pair) => (
              <li
                key={pair.id}
                className="rounded-lg border-2 border-grey1 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <PairSide person={pair.person1} />
                    <span className="text-valentine-red/40" aria-hidden="true">
                      ↔
                    </span>
                    <PairSide person={pair.person2} />
                  </div>

                  {confirmingUnpair === pair.id ? (
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUnpair(pair)}
                        disabled={unpairing === pair.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {unpairing === pair.id ? "Unpairing…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingUnpair(null)}
                        disabled={unpairing === pair.id}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingUnpair(pair.id)}
                      className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-grey2 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-600 hover:text-red-600"
                    >
                      <FaUnlink className="text-xs" />
                      Unpair
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function PairSide({ person }: { person: ParticipantSummary }) {
  return (
    <span className="min-w-0">
      <span className="block truncate font-semibold text-valentine-red">
        {person.name}
      </span>
      <span className="block truncate text-sm text-gray-600">{person.email}</span>
    </span>
  );
}
