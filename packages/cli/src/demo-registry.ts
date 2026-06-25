import { command, createCommandRegistry, json, text, CommandRegistry } from '@citadel/core';

/**
 * A small, playful registry for the CLI demo. Sibling words have distinct first
 * letters so prefix auto-expansion feels snappy (`b e` → brew.espresso). Drink
 * choices are modeled as word segments (not a free-text arg) so they take part
 * in expansion — the pattern the docs recommend. `greet` shows argument entry.
 */
export function demoRegistry(): CommandRegistry {
  let cupsServed = 0;

  const cup = (emoji: string, name: string) =>
    command(`brew.${name}`)
      .describe(`Pull a ${name}`)
      .handle(async () => {
        cupsServed += 1;
        return text(`${emoji} One ${name}, ready! (${cupsServed} served)`);
      });

  return createCommandRegistry([
    command('ping').describe('Health check').handle(async () => text('pong')),
    cup('☕', 'espresso'),
    cup('🥛', 'latte'),
    cup('🧊', 'coldbrew'),
    command('brew.status')
      .describe('Cups served so far')
      .handle(async () => json({ cupsServed })),
    command('greet')
      .describe('Greet someone')
      .arg('name', (arg) => arg.describe('Who to greet'))
      .handle(async ({ namedArgs }) => text(`Hello, ${namedArgs.name}! 👋`)),
  ]);
}
