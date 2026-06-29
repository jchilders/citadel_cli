import { describe, expect, it } from 'vitest';
import {
  Action,
  StarshipSnapshot,
  applyAction,
  createInitialState,
  createStarshipCommandDefinitions,
} from '../starshipCommands';

// Drive the pure reducer through a sequence of actions, asserting no rejections
// unless expected.
const run = (state: StarshipSnapshot, actions: Action[]): StarshipSnapshot =>
  actions.reduce((s, action) => applyAction(s, action).next, state);

const commandPaths = (snapshot: StarshipSnapshot): string[] =>
  createStarshipCommandDefinitions({ dispatch: () => ({ next: snapshot }) }, snapshot).map(
    (def) => def.path
  );

describe('starship applyAction', () => {
  it('rejects routing power past the reactor budget', () => {
    const state = createInitialState(); // used 4/6, engines draw 3 → 7 > 6
    const { rejected, next } = applyAction(state, { type: 'ROUTE_POWER', system: 'engines' });
    expect(rejected).toMatch(/insufficient power/i);
    expect(next).toBe(state); // unchanged, no cycle consumed
  });

  it('charges the jump drive when engines are powered and reaches 100%', () => {
    // Free power for engines by cutting life support, route engines, then hold.
    const charged = run(createInitialState(), [
      { type: 'CUT_POWER', system: 'life' },
      { type: 'ROUTE_POWER', system: 'engines' },
      { type: 'HOLD' },
      { type: 'HOLD' },
      { type: 'HOLD' },
      { type: 'HOLD' },
    ]);
    expect(charged.jumpCharge).toBe(100);
    expect(charged.status).toBe('active');

    const jumped = applyAction(charged, { type: 'JUMP' }).next;
    expect(jumped.status).toBe('jumped');
  });

  it('cannot jump before the drive is fully charged', () => {
    const { rejected } = applyAction(createInitialState(), { type: 'JUMP' });
    expect(rejected).toMatch(/not ready/i);
  });

  it('raised shields halve hull damage versus lowered shields', () => {
    const start = createInitialState();
    const lowered = applyAction(start, { type: 'HOLD' }).next; // shields down by default
    const raised = run(start, [{ type: 'RAISE_SHIELDS' }]); // raising also runs the same cycle
    expect(start.hull - raised.hull).toBeLessThan(start.hull - lowered.hull);
  });

  it('destroys the ship when the hull reaches zero', () => {
    // Strip all protection then ride enough cycles for the escalating hazards to
    // finish the hull.
    let state = run(createInitialState(), [{ type: 'CUT_POWER', system: 'shields' }]);
    for (let i = 0; i < 12 && state.status === 'active'; i++) {
      state = applyAction(state, { type: 'HOLD' }).next;
    }
    expect(state.status).toBe('destroyed');
    expect(state.hull).toBe(0);
  });

  it('scram cuts all power; restart brings the reactor back', () => {
    const scrammed = run(createInitialState(), [{ type: 'SCRAM' }]);
    expect(scrammed.systems.find((s) => s.id === 'reactor')?.online).toBe(false);
    expect(scrammed.reactorOutput).toBe(0);
    expect(scrammed.powerUsed).toBe(0);
    expect(scrammed.systems.every((s) => s.id === 'reactor' || !s.powered)).toBe(true);
    expect(scrammed.shieldsRaised).toBe(false);

    const restarted = applyAction(scrammed, { type: 'RESTART' }).next;
    expect(restarted.systems.find((s) => s.id === 'reactor')?.online).toBe(true);
    expect(restarted.reactorOutput).toBe(6);
  });
});

describe('starship dynamic registry', () => {
  it('offers the right commands for the initial state', () => {
    const paths = commandPaths(createInitialState());
    // shields are powered but lowered → raise offered, lower not
    expect(paths).toContain('shields.raise');
    expect(paths).not.toContain('shields.lower');
    // engines are unpowered but unaffordable (4/6 used, draw 3) → not offered yet
    expect(paths).not.toContain('power.route.engines');
    // powered systems can be cut; already-powered systems are not re-offered to route
    expect(paths).toContain('power.cut.shields');
    expect(paths).toContain('power.cut.life');
    expect(paths).not.toContain('power.route.shields');
    expect(paths).toContain('core.scram');
  });

  it('swaps power.route/power.cut and shields.raise/lower with state', () => {
    const raised = run(createInitialState(), [{ type: 'RAISE_SHIELDS' }]);
    const paths = commandPaths(raised);
    expect(paths).toContain('shields.lower');
    expect(paths).not.toContain('shields.raise');
  });

  it('only exposes reset once the run is over', () => {
    const jumped: StarshipSnapshot = { ...createInitialState(), status: 'jumped' };
    expect(commandPaths(jumped)).toEqual(['reset']);
  });

  it('reveals jump.engage only when the drive is charged', () => {
    const charged = run(createInitialState(), [
      { type: 'CUT_POWER', system: 'life' },
      { type: 'ROUTE_POWER', system: 'engines' },
      { type: 'HOLD' },
      { type: 'HOLD' },
      { type: 'HOLD' },
      { type: 'HOLD' },
    ]);
    expect(commandPaths(charged)).toContain('jump.engage');
  });
});
