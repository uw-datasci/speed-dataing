"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Safety net only. The flip normally ends on the rising leaf's `animationend`
 * event, which is frame-exact; this just stops a card being stuck mid-flip if
 * that event never arrives (an unpainted or backgrounded tab, say). It must
 * stay comfortably LONGER than the CSS animations (0.3s fall + 0.38s settle)
 * — if it fires first, the leaves are torn out while the flip is still
 * running, which looks like a glitch.
 */
const FLIP_FALLBACK_MS = 1200;

/** Each digit to the left starts this much later, like an odometer rolling. */
const STAGGER_MS = 60;

/**
 * One split-flap card. Shows `value`, and when it changes plays the flip: the
 * old digit's top half hinges down about the centre line while the new
 * digit's bottom half swings into place behind it.
 *
 * Note: this deliberately plays even under `prefers-reduced-motion`. The flip
 * is the entire purpose of this board, and the page is only reachable by an
 * admin who navigated to it on purpose.
 */
function FlapDigit({ value, delayMs }: { value: string; delayMs: number }) {
  const [settled, setSettled] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Retiring the leaves and committing the new digit to the static bottom
     face happen in one render, so the card never shows a half-updated
     state. */
  /* Bumped when a flip lands, to re-key the crease so its fade-in replays. */
  const [creaseKey, setCreaseKey] = useState(0);

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
      {/* Static halves hold the settled state. The top already shows the new
          digit; the bottom keeps the old one until the rising leaf covers it. */}
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

/**
 * A number rendered as split-flap cards, zero-padded to `minDigits` the way a
 * scoreboard would show it.
 */
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
