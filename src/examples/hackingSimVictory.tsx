import React from 'react';
import { CommandResult } from '@citadel/core';
import { BannerAnimation, toLines } from './AsciiBanner';

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

const SKULL_LINES = toLines(ART);

// Flowing rainbow palette (oklch per the repo's color guideline). Each line is
// offset by its row index so the hue appears to travel down the skull.
const PALETTE = [
  'oklch(0.72 0.21 25)', // red
  'oklch(0.80 0.18 70)', // orange
  'oklch(0.88 0.18 110)', // gold
  'oklch(0.82 0.16 150)', // green
  'oklch(0.80 0.15 210)', // cyan
  'oklch(0.72 0.20 280)', // indigo
  'oklch(0.74 0.23 330)' // magenta
];

const SUCCESS_COLOR = 'oklch(0.86 0.19 150)';

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
    return (
      <BannerAnimation
        artLines={SKULL_LINES}
        message={this.message}
        palette={PALETTE}
        messageColor={SUCCESS_COLOR}
        artLabel="skull and crossbones"
      />
    );
  }
}

export const victory = (message: string): HackVictoryResult => new HackVictoryResult(message);
