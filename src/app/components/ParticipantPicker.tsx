"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import {
  searchParticipants,
  type ParticipantSummary,
} from "@/lib/manual-pairs";

/** Long enough that a single keystroke does not fire a query. */
const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

interface Props {
  label: string;
  value: ParticipantSummary | null;
  onChange: (participant: ParticipantSummary | null) => void;
  /** The other side's id, filtered out so nobody can be paired with themselves. */
  excludeId?: string;
  disabled?: boolean;
}

/**
 * Search-as-you-type participant selector. Typing a partial name or email
 * lists matches; picking one replaces the input with a confirmation chip, so
 * the admin always sees who they chose before pairing.
 */
export default function ParticipantPicker({
  label,
  value,
  onChange,
  excludeId,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParticipantSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort whatever is in flight; a stale response must never land on newer input.
  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY) {
      cancelInFlight();
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const found = await searchParticipants(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResults(found);
        setHighlighted(0);
        setError(null);
        setOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    /* Deps are [query], so this runs on every edit: drop both the pending
       timer and any live request, or a slow response for an older query
       could land over newer input. */
    return () => {
      clearTimeout(timer);
      cancelInFlight();
    };
  }, [query, cancelInFlight]);

  // Tear down on unmount, so a pending request cannot resolve into a dead component.
  useEffect(() => cancelInFlight, [cancelInFlight]);

  // Clicking away closes the list without clearing what was typed.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const visible = results.filter((r) => r.id !== excludeId);

  const select = (participant: ParticipantSummary) => {
    onChange(participant);
    setQuery("");
    setResults([]);
    setOpen(false);
    setError(null);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setError(null);
    // Return focus so clearing and retyping is one uninterrupted motion.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || visible.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((i) => (i + 1) % visible.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => (i - 1 + visible.length) % visible.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const choice = visible[highlighted];
      if (choice) select(choice);
    }
  };

  /* Selected: a chip replaces the input entirely, so the committed choice
     cannot be confused with a half-typed query. */
  if (value) {
    return (
      <div>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-valentine-red bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-valentine-red">
              {value.name}
              {value.pronouns && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {value.pronouns}
                </span>
              )}
            </p>
            <p className="truncate text-sm text-gray-600">{value.email}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-valentine-light hover:text-valentine-red disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel>{label}</FieldLabel>

      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => visible.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search by name or email…"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && visible[highlighted] ? `${listboxId}-${highlighted}` : undefined
          }
          className="w-full rounded-lg border-2 border-grey1 bg-white py-3 pl-11 pr-4 text-valentine-red placeholder:text-gray-400 focus:border-valentine-red focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Status line is reserved space, so the layout does not jump as it changes. */}
      <p className="mt-1 min-h-[1.25rem] text-xs" aria-live="polite">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : loading ? (
          <span className="text-gray-500">Searching…</span>
        ) : query.trim().length >= MIN_QUERY && visible.length === 0 ? (
          <span className="text-gray-500">No participants match.</span>
        ) : null}
      </p>

      {open && visible.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={`${label} results`}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border-2 border-valentine-red bg-white shadow-lg"
        >
          {visible.map((participant, index) => (
            <li
              key={participant.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === highlighted}
            >
              <button
                type="button"
                onClick={() => select(participant)}
                onMouseEnter={() => setHighlighted(index)}
                className={`block w-full px-4 py-3 text-left transition-colors ${
                  index === highlighted ? "bg-valentine-light" : "bg-white"
                }`}
              >
                <span className="block truncate font-medium text-valentine-red">
                  {participant.name}
                  {participant.pronouns && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {participant.pronouns}
                    </span>
                  )}
                </span>
                <span className="block truncate text-sm text-gray-600">
                  {participant.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-valentine-red/70">
      {children}
    </span>
  );
}
