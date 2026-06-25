import React, { useEffect, useMemo, useRef, useState } from 'react';

// Shared "reveal then settle" ASCII banner used by the demo win/lose payoffs
// (the hacking-sim skull and the starship warp/breach). Art is revealed
// line-by-line with a flowing oklch palette, then a message lands. Honors
// prefers-reduced-motion and scrolls itself into view as it grows.

const FRAME_MS = 100;
const REVEAL_TAIL = 10; // frames of color flow after the art is fully revealed

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const colorFor = (palette: string[], row: number, frame: number): string =>
  palette[(((row + frame) % palette.length) + palette.length) % palette.length];

export const toLines = (art: string): string[] =>
  art.split('\n').filter((line) => line.length > 0);

const ART_STYLE: React.CSSProperties = { margin: 0, lineHeight: 1.05, fontWeight: 700 };

interface BannerAnimationProps {
  artLines: string[];
  message: string;
  palette: string[];
  messageColor: string;
  artLabel?: string;
}

export const BannerAnimation: React.FC<BannerAnimationProps> = ({
  artLines,
  message,
  palette,
  messageColor,
  artLabel
}) => {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [frame, setFrame] = useState(0);
  const [done, setDone] = useState(reduceMotion);
  const bottomRef = useRef<HTMLDivElement>(null);
  const totalFrames = artLines.length + REVEAL_TAIL;

  useEffect(() => {
    if (reduceMotion) return;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setFrame(current);
      if (current >= totalFrames) {
        clearInterval(id);
        setDone(true);
      }
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [reduceMotion, totalFrames]);

  const visibleCount = reduceMotion ? artLines.length : Math.min(artLines.length, frame + 1);

  // Keep the newest revealed line (and the final message) in view; the output
  // pane only auto-scrolls when the command list changes, not as this grows.
  // Depend on visibleCount/done so we don't reflow on the static tail frames.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [visibleCount, done]);

  const messageStyle = useMemo<React.CSSProperties>(
    () => ({ margin: '0.6em 0 0', color: messageColor, whiteSpace: 'pre-wrap' }),
    [messageColor]
  );

  return (
    <div className="citadel-result-text">
      <pre aria-label={artLabel} style={ART_STYLE}>
        {artLines.slice(0, visibleCount).map((line, row) => (
          <div key={row} style={{ color: colorFor(palette, row, frame) }}>
            {line}
          </div>
        ))}
      </pre>
      {done && <pre style={messageStyle}>{message}</pre>}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
};
