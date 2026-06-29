import React from 'react';
import { CommandResult } from '@citadel/core';
import { BannerAnimation, toLines } from './AsciiBanner';

// Two animated end-of-run results for the Starship demo, sharing the reveal
// animation in AsciiBanner. Reads first-and-foremost as fun.

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
  'oklch(0.88 0.12 210)'
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
  'oklch(0.72 0.20 30)'
];

export class WarpJumpResult extends CommandResult {
  constructor(
    public readonly message: string,
    timestamp?: number
  ) {
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
  constructor(
    public readonly message: string,
    timestamp?: number
  ) {
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
