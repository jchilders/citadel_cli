import React, { useEffect, useRef, useState } from 'react';
import { CommandResult } from '../components/Citadel/types/command-results';

// Skull & crossbones. String.raw keeps the backslashes literal so the art
// doesn't need escaping; the leading newline is dropped by the filter below.
// Skull & crossbones by Joan G. Stark ("jgs"), via https://ascii.co.uk/art/skulls
// (artist signature removed). String.raw keeps the backslashes literal; the
// mouth border's backticks were swapped for apostrophes so the template parses.
const ART = String.raw`
                       ______
                    .-"      "-.
                   /            \
       _          |              |          _
      ( \         |,  .-.  .-.  ,|         / )
       > "=._     | )(__/  \__)( |     _.=" <
      (_/"=._"=._ |/     /\     \| _.="_.="\_)
             "=._ (_     ^^     _)"_.="
                 "=\__|IIIIII|__/="
                _.="| \IIIIII/ |"=._
      _     _.="_.="\          /"=._"=._     _
     ( \_.="_.="     '--------'     "=._"=._/ )
      > _.="                            "=._ <
     (_/                                    \_)
`;

const SKULL_LINES = ART.split('\n').filter((line) => line.length > 0);

// Flowing rainbow palette (oklch per the repo's color guideline). Each line is
// offset by its row index so the hue appears to travel down the skull.
const PALETTE = [
  'oklch(0.72 0.21 25)', // red
  'oklch(0.80 0.18 70)', // orange
  'oklch(0.88 0.18 110)', // gold
  'oklch(0.82 0.16 150)', // green
  'oklch(0.80 0.15 210)', // cyan
  'oklch(0.72 0.20 280)', // indigo
  'oklch(0.74 0.23 330)', // magenta
];

const FRAME_MS = 110;
// Reveal one line per frame, then keep the colors flowing for a beat before the
// message lands.
const TOTAL_FRAMES = SKULL_LINES.length + 12;

const colorFor = (row: number, frame: number): string =>
  PALETTE[(((row + frame) % PALETTE.length) + PALETTE.length) % PALETTE.length];

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const SUCCESS_COLOR = 'oklch(0.86 0.19 150)';

const SKULL_STYLE: React.CSSProperties = {
  margin: 0,
  lineHeight: 1.05,
  fontWeight: 700,
};

const MESSAGE_STYLE: React.CSSProperties = {
  margin: '0.6em 0 0',
  color: SUCCESS_COLOR,
  whiteSpace: 'pre-wrap',
  transition: 'opacity 240ms ease-in',
};

interface SkullAnimationProps {
  message: string;
}

const SkullAnimation: React.FC<SkullAnimationProps> = ({ message }) => {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [frame, setFrame] = useState(0);
  const [done, setDone] = useState(reduceMotion);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setFrame(current);
      if (current >= TOTAL_FRAMES) {
        clearInterval(id);
        setDone(true);
      }
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  // The output pane only auto-scrolls when the command list changes, not as the
  // skull grows or the message lands asynchronously. Keep the latest line in
  // view so the payoff doesn't end up below the fold.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [frame, done]);

  const visibleCount = reduceMotion ? SKULL_LINES.length : Math.min(SKULL_LINES.length, frame + 1);

  return (
    <div className="citadel-result-text">
      <pre aria-label="skull and crossbones" style={SKULL_STYLE}>
        {SKULL_LINES.slice(0, visibleCount).map((line, row) => (
          <div key={row} style={{ color: colorFor(row, frame) }}>
            {line}
          </div>
        ))}
      </pre>
      {done && <pre style={MESSAGE_STYLE}>{message}</pre>}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
};

// A custom CommandResult whose render() returns the animation. Handlers can
// return any CommandResult subclass, so the example owns this without touching
// the library's result types.
export class HackVictoryResult extends CommandResult {
  constructor(
    public readonly message: string,
    timestamp?: number
  ) {
    super(timestamp);
  }

  render(): React.ReactNode {
    return <SkullAnimation message={this.message} />;
  }
}

export const victory = (message: string): HackVictoryResult => new HackVictoryResult(message);
