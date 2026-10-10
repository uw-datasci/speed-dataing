"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Fallback for when `animationend` never fires (backgrounded tab). Must stay
   longer than the CSS flip (0.3s fall + 0.38s settle) or it cuts it short. */
const FLIP_FALLBACK_MS = 1200;

/** Each digit to the left starts this much later, like an odometer rolling. */
const STAGGER_MS = 60;

/* One card: the old top half hinges down as the new bottom half swings up.
   Plays even under prefers-reduced-motion — the flip is the whole point. */
function FlapDigit({ value, delayMs }: { value: string; delayMs: number }) {
  const [settled, setSettled] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Bumped when a flip lands, to re-key the crease so its fade-in replays. */
  const [creaseKey, setCreaseKey] = useState(0);

  /* Clears the leaves and commits the digit in one render, so the card is
     never left half-updated. */
  const endFlip = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setFlipping(false);
    setCreaseKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (value === settled) return;

    setPrevious(settled);
    setSettled(value);
    setFlipping(true);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(endFlip, FLIP_FALLBACK_MS + delayMs);
  }, [value, settled, delayMs, endFlip]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <span
      className="flap font-mono font-bold"
      style={{ ["--flap-delay" as string]: `${delayMs}ms` } as React.CSSProperties}
    >
      {/* Top shows the new digit; the bottom keeps the old one until
          the rising leaf covers it. */}
      <span className="flap-face flap-face-top">
        <span className="flap-glyph">{settled}</span>
      </span>
      <span className="flap-face flap-face-bottom">
        <span className="flap-glyph">{flipping ? previous : settled}</span>
      </span>

      {!flipping && <span key={creaseKey} className="flap-crease" aria-hidden="true" />}

      {flipping && (
        <>
          <span className="flap-leaf flap-leaf-top" aria-hidden="true">
            <span className="flap-glyph">{previous}</span>
          </span>
          <span
            className="flap-leaf flap-leaf-bottom"
            aria-hidden="true"
            // The rise is the last thing to finish, so its end is the end of
            // the flip. Ignore events bubbling up from anything nested.
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) endFlip();
            }}
          >
            <span className="flap-glyph">{settled}</span>
          </span>
        </>
      )}
    </span>
  );
}

/** A number as split-flap cards, zero-padded to `minDigits`. */
export default function FlapNumber({
  value,
  minDigits = 2,
  label,
}: {
  value: number;
  minDigits?: number;
  label: string;
}) {
  const digits = String(Math.max(0, value)).padStart(minDigits, "0").split("");
  const last = digits.length - 1;

  return (
    <span
      className="inline-flex gap-1.5 sm:gap-2"
      role="img"
      aria-label={`${label}: ${value}`}
    >
      {digits.map((digit, i) => (
        // Index-keyed on purpose: card N should flip to its new digit rather
        // than be replaced when the number grows a place.
        <FlapDigit
          key={i}
          value={digit}
          delayMs={(last - i) * STAGGER_MS}
        />
      ))}
    </span>
  );
}
