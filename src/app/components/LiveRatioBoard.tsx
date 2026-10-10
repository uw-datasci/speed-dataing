"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import FlapNumber from "@/app/components/FlapNumber";

const POLL_MS = 5000;

interface Counts {
  men: number;
  women: number;
}

/** Normalises to "1 : N" against the smaller side; left column first. */
function formatRatio(leftCount: number, rightCount: number): string {
  if (leftCount === 0 && rightCount === 0) return "—";
  if (leftCount === 0) return `0 : ${rightCount}`;
  if (rightCount === 0) return `${leftCount} : 0`;
  const smaller = Math.min(leftCount, rightCount);
  const left = leftCount / smaller;
  const right = rightCount / smaller;
  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${fmt(left)} : ${fmt(right)}`;
}

export default function LiveRatioBoard() {
  const [counts, setCounts] = useState<Counts>({ men: 0, women: 0 });
  const [error, setError] = useState<string | null>(null);


  // Avoids a slow response overwriting a newer one.
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/admin/live-ratio", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setCounts({ men: data.men ?? 0, women: data.women ?? 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach server");
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const { men, women } = counts;
  const total = men + women;
  const menPct = total === 0 ? 50 : (men / total) * 100;
  const womenPct = total === 0 ? 50 : (women / total) * 100;
  const digits = Math.max(2, String(Math.max(men, women)).length);

  return (
    <div className="min-h-screen bg-valentine-light flex flex-col">
      <div className="p-4 sm:p-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-valentine-red/70 hover:text-valentine-red transition-colors"
        >
          <FaArrowLeft className="text-xs" />
          Back to dashboard
        </Link>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <h1 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-valentine-red/60 mb-10 sm:mb-14 text-center">
          Live Gender Ratio
        </h1>

        {/* Scoreboard */}
        <div className="flex items-start justify-center gap-6 sm:gap-12 lg:gap-20">
          <Side label="Women" value={women} digits={digits} accent="women" />
          <div
            className="font-mono font-bold text-valentine-red/25 select-none leading-none"
            style={{ fontSize: "clamp(2rem, 7vw, 5rem)", marginTop: "clamp(2.5rem, 7vw, 5rem)" }}
            aria-hidden="true"
          >
            :
          </div>
          <Side label="Men" value={men} digits={digits} accent="men" />
        </div>

        {/* Ratio readout + split bar */}
        <div className="w-full max-w-xl mt-12 sm:mt-16">
          <p
            className="text-center font-mono font-bold text-valentine-red tabular-nums mb-4"
            style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)" }}
          >
            {formatRatio(women, men)}
          </p>

          <div
            className="h-3 w-full rounded-full overflow-hidden flex bg-white"
            role="img"
            aria-label={`${Math.round(womenPct)}% women, ${Math.round(menPct)}% men`}
          >
            <div
              className="bg-women-pink transition-[width] duration-700 ease-out"
              style={{ width: `${womenPct}%` }}
            />
            <div
              className="bg-valentine-red transition-[width] duration-700 ease-out"
              style={{ width: `${menPct}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs sm:text-sm font-medium text-valentine-red/70 tabular-nums">
            <span>{total === 0 ? "—" : `${Math.round(womenPct)}%`}</span>
            <span>{total === 0 ? "—" : `${Math.round(menPct)}%`}</span>
          </div>
        </div>

        {/* Only on failure, so a dead feed cannot pass for live numbers. */}
        {error && (
          <p className="mt-10 text-xs text-red-600 text-center">
            {error} — retrying…
          </p>
        )}
      </main>
    </div>
  );
}

function Side({
  label,
  value,
  digits,
  accent,
}: {
  label: string;
  value: number;
  digits: number;
  accent: "men" | "women";
}) {
  return (
    <div className="flex flex-col items-center">
      <p
        className={`text-xs sm:text-base font-bold uppercase tracking-[0.18em] mb-4 sm:mb-6 ${
          accent === "men" ? "text-valentine-red" : "text-women-pink"
        }`}
      >
        {label}
      </p>
      <div
        className={accent === "men" ? "text-valentine-red" : "text-women-pink"}
        style={
          {
            fontSize: "clamp(4rem, 16vw, 11rem)",
            // Drives the card height the split-flap CSS keys off.
            ["--flap-h" as string]: "1.15em",
          } as React.CSSProperties
        }
      >
        <FlapNumber value={value} minDigits={digits} label={label} />
      </div>
    </div>
  );
}
