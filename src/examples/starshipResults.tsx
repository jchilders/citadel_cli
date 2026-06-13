import React, { useEffect, useRef, useState } from 'react';
import { CommandResult } from '../components/Citadel/types/command-results';

// Two animated end-of-run results for the Starship demo, built the same way as
// the Hacking Sim victory (String.raw art revealed line-by-line with a flowing
// oklch palette, then a settled message). Reads first-and-foremost as fun.

const FRAME_MS = 100;
const REVEAL_TAIL = 10; // frames of color flow after the art is fully revealed

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const colorFor = (palette: string[], row: number, frame: number): string =>
  palette[(((row + frame) % palette.length) + palette.length) % palette.length];

const ART_STYLE: React.CSSProperties = { margin: 0, lineHeight: 1.05, fontWeight: 700 };

interface BannerAnimationProps {
  artLines: string[];
  message: string;
  palette: string[];
  messageColor: string;
}

const BannerAnimation: React.FC<BannerAnimationProps> = ({
  artLines,
  message,
  palette,
  messageColor,
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

  // The output pane only auto-scrolls when the command list changes, not as the
  // banner grows, so keep the latest line in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [frame, done]);

  const visibleCount = reduceMotion ? artLines.length : Math.min(artLines.length, frame + 1);
  const messageStyle: React.CSSProperties = {
    margin: '0.6em 0 0',
    color: messageColor,
    whiteSpace: 'pre-wrap',
  };

  return (
    <div className="citadel-result-text">
      <pre style={ART_STYLE}>
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

const toLines = (art: string): string[] => art.split('\n').filter((line) => line.length > 0);

// Warp streaks lighting up as the drive engages.
const WARP_ART = toLines(String.raw`
   ·    .      *      ·     .       ·      *    .
  ------------------------------------------->
   ·    *    ------------------------>    ·    .
  ----------------------------------------------->
   *    ·    --------------------->     .    ·   *
  --------------------------------------->   *
   ·   .    *     ·      .      *     ·    .     ·
`);

const WARP_PALETTE = [
  'oklch(0.85 0.13 220)',
  'oklch(0.90 0.11 200)',
  'oklch(0.95 0.04 220)',
  'oklch(0.82 0.15 250)',
  'oklch(0.88 0.12 210)',
];

// Hull breach — debris and a flash.
const BREACH_ART = toLines(String.raw`
          \    .   |   .    /
      '  .  \   \  |  /   /  .  '
   --==[    *   BOOM   *    ]==--
      .  /   /  |  \   \  .
          /    '   |   '    \
`);

const BREACH_PALETTE = [
  'oklch(0.70 0.21 25)',
  'oklch(0.78 0.19 45)',
  'oklch(0.85 0.17 75)',
  'oklch(0.72 0.20 30)',
];

export class WarpJumpResult extends CommandResult {
  constructor(public readonly message: string, timestamp?: number) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return (
      <BannerAnimation
        artLines={WARP_ART}
        message={this.message}
        palette={WARP_PALETTE}
        messageColor="oklch(0.90 0.10 210)"
      />
    );
  }
}

export class HullBreachResult extends CommandResult {
  constructor(public readonly message: string, timestamp?: number) {
    super(timestamp);
    this.markFailure();
  }

  render(): React.ReactNode {
    return (
      <BannerAnimation
        artLines={BREACH_ART}
        message={this.message}
        palette={BREACH_PALETTE}
        messageColor="oklch(0.72 0.20 28)"
      />
    );
  }
}

export const warpJump = (message: string): WarpJumpResult => new WarpJumpResult(message);
export const hullBreach = (message: string): HullBreachResult => new HullBreachResult(message);
