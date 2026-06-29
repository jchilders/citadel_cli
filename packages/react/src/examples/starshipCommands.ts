import {
  CommandDefinition,
  command,
  text,
  json,
  bool,
  error,
} from '@citadel/core';
import { warpJump, hullBreach } from './starshipResults';

// A "survive the incident and jump to safety" engineering console. The fun core
// is a power-budget squeeze: the reactor can't run everything at once, so you
// trade shields vs. charging the jump drive while an escalating hazard chips at
// the hull. The headline Citadel feature on display is the dynamic registry —
// the available commands track the ship's situation (you can only `power.cut`
// what's powered, `repair` what's damaged, `jump.engage` once the drive is
// charged), rebuilt from state every cycle.
//
// Model: reads are free; every actuating command costs one cycle, during which a
// scripted hazard hits (halved if shields are up), the jump drive charges if the
// engines are powered, and win/lose is checked. Deterministic — no timers.

export type SystemId = 'reactor' | 'shields' | 'engines' | 'life';
export type ShipStatus = 'active' | 'jumped' | 'destroyed' | 'abandoned';
export type AlertLevel = 'green' | 'yellow' | 'red';

export interface SubsystemState {
  id: SystemId;
  label: string;
  online: boolean;
  integrity: number; // 0-100
  powered: boolean;
  powerDraw: number;
}

export interface StarshipSnapshot {
  systems: SubsystemState[];
  reactorOutput: number; // available power units
  powerUsed: number; // Σ powered draw
  hull: number; // 0-100
  alert: AlertLevel;
  shieldsRaised: boolean;
  jumpCharge: number; // 0-100
  cycle: number;
  ejectArmed: boolean;
  status: ShipStatus;
  lastEvent: string;
}

export type Action =
  | { type: 'ROUTE_POWER'; system: SystemId }
  | { type: 'CUT_POWER'; system: SystemId }
  | { type: 'RAISE_SHIELDS' }
  | { type: 'LOWER_SHIELDS' }
  | { type: 'REPAIR'; system: SystemId }
  | { type: 'SCRAM' }
  | { type: 'RESTART' }
  | { type: 'HOLD' }
  | { type: 'JUMP' }
  | { type: 'ARM_EJECT' }
  | { type: 'EJECT' }
  | { type: 'RESET' };

export interface StarshipActions {
  dispatch: (action: Action) => { next: StarshipSnapshot; rejected?: string };
}

const REACTOR_OUTPUT = 6;
const CHARGE_PER_CYCLE = 22;
const LIFE_SUPPORT_PENALTY = 5;
const REPAIR_AMOUNT = 40;

const LABELS: Record<SystemId, string> = {
  reactor: 'Reactor',
  shields: 'Shields',
  engines: 'Engines',
  life: 'Life Support',
};

// Power consumers (the reactor produces power, it doesn't draw it).
export const POWERABLE: SystemId[] = ['shields', 'engines', 'life'];

interface Hazard {
  label: string;
  hull: number;
  damage?: { system: SystemId; amount: number };
}

const HAZARDS: Hazard[] = [
  { label: 'Asteroid field — hull stress.', hull: 8 },
  { label: 'Debris impact buckles the starboard shield emitters.', hull: 12, damage: { system: 'shields', amount: 18 } },
  { label: 'Plasma storm scores the engine nacelles.', hull: 10, damage: { system: 'engines', amount: 16 } },
  { label: 'Micro-breach on deck 3 — life support strained.', hull: 14, damage: { system: 'life', amount: 22 } },
  { label: 'Pursuers open fire.', hull: 18 },
  { label: 'Reactor containment wavers under the barrage.', hull: 14, damage: { system: 'reactor', amount: 20 } },
  { label: 'Sustained barrage — they are right on top of us.', hull: 20 },
];

const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));
const sysOf = (s: StarshipSnapshot, id: SystemId): SubsystemState =>
  s.systems.find((x) => x.id === id) as SubsystemState;
const powerUsed = (systems: SubsystemState[]): number =>
  systems.filter((s) => s.powered && s.online).reduce((sum, s) => sum + s.powerDraw, 0);

export const shieldsUp = (s: StarshipSnapshot): boolean => {
  const sh = sysOf(s, 'shields');
  return sh.online && sh.powered && s.shieldsRaised;
};

const computeAlert = (s: StarshipSnapshot): AlertLevel => {
  if (s.hull <= 30 || !sysOf(s, 'reactor').online) return 'red';
  if (s.hull <= 60 || s.systems.some((x) => !x.online || x.integrity < 60)) return 'yellow';
  return 'green';
};

// Recompute derived fields from base facts so the state is always consistent:
// a dead reactor zeroes output and unpowers consumers; unpowered shields can't
// be raised; power usage and alert follow.
const normalize = (s: StarshipSnapshot): StarshipSnapshot => {
  const reactorOnline = sysOf(s, 'reactor').online;
  const systems = reactorOnline
    ? s.systems
    : s.systems.map((x) => (x.id === 'reactor' ? x : { ...x, powered: false }));
  const sh = systems.find((x) => x.id === 'shields') as SubsystemState;
  const shieldsRaised = sh.online && sh.powered ? s.shieldsRaised : false;
  const withDerived: StarshipSnapshot = {
    ...s,
    systems,
    reactorOutput: reactorOnline ? REACTOR_OUTPUT : 0,
    powerUsed: powerUsed(systems),
    shieldsRaised,
  };
  return { ...withDerived, alert: computeAlert(withDerived) };
};

export const createInitialState = (): StarshipSnapshot =>
  normalize({
    systems: [
      { id: 'reactor', label: LABELS.reactor, online: true, integrity: 100, powered: false, powerDraw: 0 },
      { id: 'shields', label: LABELS.shields, online: true, integrity: 100, powered: true, powerDraw: 2 },
      { id: 'engines', label: LABELS.engines, online: true, integrity: 100, powered: false, powerDraw: 3 },
      { id: 'life', label: LABELS.life, online: true, integrity: 100, powered: true, powerDraw: 2 },
    ],
    reactorOutput: REACTOR_OUTPUT,
    powerUsed: 0,
    hull: 100,
    alert: 'green',
    shieldsRaised: false,
    jumpCharge: 0,
    cycle: 0,
    ejectArmed: false,
    status: 'active',
    lastEvent: 'Hostiles inbound. Chart a jump and run — the drive needs charge.',
  });

// One incident cycle: hazard hits, shields halve hull damage, engines charge the
// drive, then derived fields and win/lose are recomputed.
const runCycle = (state: StarshipSnapshot): StarshipSnapshot => {
  const cycle = state.cycle + 1;
  const hazard = HAZARDS[Math.min(cycle - 1, HAZARDS.length - 1)];

  let systems = state.systems.map((s) => ({ ...s }));
  if (hazard.damage) {
    const { system, amount } = hazard.damage;
    systems = systems.map((s) => {
      if (s.id !== system) return s;
      const integrity = clamp(s.integrity - amount);
      const online = integrity > 0 && s.online;
      return { ...s, integrity, online, powered: online ? s.powered : false };
    });
  }

  let hullDmg = hazard.hull;
  if (shieldsUp({ ...state, systems })) hullDmg = Math.round(hullDmg / 2);
  if (!(systems.find((s) => s.id === 'life') as SubsystemState).online) hullDmg += LIFE_SUPPORT_PENALTY;
  const hull = clamp(state.hull - hullDmg);

  const eng = systems.find((s) => s.id === 'engines') as SubsystemState;
  const jumpCharge = eng.online && eng.powered ? clamp(state.jumpCharge + CHARGE_PER_CYCLE) : state.jumpCharge;

  return normalize({
    ...state,
    systems,
    hull,
    jumpCharge,
    cycle,
    lastEvent: `Cycle ${cycle} · ${hazard.label}`,
    status: hull <= 0 ? 'destroyed' : 'active',
  });
};

const withSystem = (
  s: StarshipSnapshot,
  id: SystemId,
  patch: Partial<SubsystemState>
): SubsystemState[] => s.systems.map((x) => (x.id === id ? { ...x, ...patch } : x));

export function applyAction(
  state: StarshipSnapshot,
  action: Action
): { next: StarshipSnapshot; rejected?: string } {
  if (action.type === 'RESET') return { next: createInitialState() };
  if (state.status !== 'active') return { next: state, rejected: 'The engagement is over — run "reset".' };

  switch (action.type) {
    case 'ROUTE_POWER': {
      const sys = sysOf(state, action.system);
      if (!sys.online) return { next: state, rejected: `${sys.label} is offline.` };
      if (sys.powered) return { next: state, rejected: `${sys.label} is already powered.` };
      if (state.powerUsed + sys.powerDraw > state.reactorOutput) {
        return {
          next: state,
          rejected: `Insufficient power (${state.powerUsed + sys.powerDraw}/${state.reactorOutput}). Cut power to another system first.`,
        };
      }
      return { next: runCycle({ ...state, systems: withSystem(state, sys.id, { powered: true }) }) };
    }
    case 'CUT_POWER': {
      const sys = sysOf(state, action.system);
      if (!sys.powered) return { next: state, rejected: `${sys.label} is not powered.` };
      return {
        next: runCycle({
          ...state,
          systems: withSystem(state, sys.id, { powered: false }),
          shieldsRaised: sys.id === 'shields' ? false : state.shieldsRaised,
        }),
      };
    }
    case 'RAISE_SHIELDS': {
      const sh = sysOf(state, 'shields');
      if (!sh.online || !sh.powered) return { next: state, rejected: 'Shields need power first — power.route.shields.' };
      if (state.shieldsRaised) return { next: state, rejected: 'Shields are already raised.' };
      return { next: runCycle({ ...state, shieldsRaised: true }) };
    }
    case 'LOWER_SHIELDS': {
      if (!state.shieldsRaised) return { next: state, rejected: 'Shields are already lowered.' };
      return { next: runCycle({ ...state, shieldsRaised: false }) };
    }
    case 'REPAIR': {
      const sys = sysOf(state, action.system);
      if (sys.integrity >= 100) return { next: state, rejected: `${sys.label} is already at full integrity.` };
      return {
        next: runCycle({
          ...state,
          systems: withSystem(state, sys.id, { integrity: clamp(sys.integrity + REPAIR_AMOUNT), online: true }),
        }),
      };
    }
    case 'SCRAM': {
      if (!sysOf(state, 'reactor').online) return { next: state, rejected: 'Reactor is already offline.' };
      return { next: runCycle({ ...state, systems: withSystem(state, 'reactor', { online: false }) }) };
    }
    case 'RESTART': {
      const reactor = sysOf(state, 'reactor');
      if (reactor.online) return { next: state, rejected: 'Reactor is already online.' };
      if (reactor.integrity <= 0) return { next: state, rejected: 'Reactor is too damaged — repair it first.' };
      return { next: runCycle({ ...state, systems: withSystem(state, 'reactor', { online: true }) }) };
    }
    case 'HOLD':
      return { next: runCycle(state) };
    case 'JUMP': {
      if (state.jumpCharge < 100) return { next: state, rejected: `Jump drive at ${state.jumpCharge}% — not ready.` };
      const eng = sysOf(state, 'engines');
      if (!eng.online || !eng.powered) return { next: state, rejected: 'Engines must be online and powered to jump.' };
      return { next: { ...state, status: 'jumped', lastEvent: 'Jump drive engaged — translating to FTL.' } };
    }
    case 'ARM_EJECT': {
      if (state.alert !== 'red') return { next: state, rejected: 'Core ejection is only available at red alert.' };
      return { next: { ...state, ejectArmed: true, lastEvent: 'Core ejection ARMED.' } };
    }
    case 'EJECT': {
      if (!state.ejectArmed) return { next: state, rejected: 'Ejection is not armed.' };
      return { next: { ...state, status: 'abandoned', lastEvent: 'Core ejected — all hands to the escape pods.' } };
    }
    default:
      return { next: state };
  }
}

const infoView = (s: StarshipSnapshot) => ({
  objective:
    s.status === 'active'
      ? 'Charge the jump drive to 100% and engage before the hull fails'
      : `Outcome: ${s.status}`,
  hull: `${s.hull}%`,
  alert: s.alert,
  jumpDrive: `${s.jumpCharge}%`,
  power: `${s.powerUsed}/${s.reactorOutput}`,
  systems: s.systems.map((x) => ({
    system: x.label,
    status: x.online ? (x.powered ? 'powered' : 'standby') : 'OFFLINE',
    integrity: `${x.integrity}%`,
  })),
  lastEvent: s.lastEvent,
});

const statusLine = (s: StarshipSnapshot): string =>
  `Hull ${s.hull}% · Shields ${shieldsUp(s) ? 'UP' : 'down'} · Jump ${s.jumpCharge}% · Alert ${s.alert.toUpperCase()}`;

const outcomeResult = (s: StarshipSnapshot, verb: string) => {
  if (s.status === 'destroyed') {
    return hullBreach('Hull integrity zero. The ship breaks apart in the dark.\n\nRun "reset" to try the run again.');
  }
  if (s.status === 'jumped') {
    return warpJump('JUMP COMPLETE\n\nYou translate to safety — hull scarred, crew alive.\nRun "reset" to run it again.');
  }
  if (s.status === 'abandoned') {
    return text(`${verb}\nThe ship is lost, but the crew drifts home in the pods.\nRun "reset" to run it again.`);
  }
  return text(`${verb}\n${s.lastEvent}\n${statusLine(s)}`);
};

export function createStarshipCommandDefinitions(
  actions: StarshipActions,
  snapshot: StarshipSnapshot
): CommandDefinition[] {
  const defs: CommandDefinition[] = [];
  const sys = (id: SystemId) => sysOf(snapshot, id);
  const active = snapshot.status === 'active';

  // Every actuating command runs through this: dispatch, surface rejections as
  // error(), otherwise narrate the cycle (or play the win/lose animation).
  const act = (action: Action, verb: string) => async () => {
    const { next, rejected } = actions.dispatch(action);
    if (rejected) return error(rejected);
    return outcomeResult(next, verb);
  };

  if (active) {
    // Free reads — no cycle cost.
    defs.push(
      command('info')
        .describe('Show the full bridge status')
        .handle(async () => json(infoView(snapshot))) as CommandDefinition,
      command('jump.status')
        .describe('Is the jump drive ready?')
        .handle(async () =>
          bool(snapshot.jumpCharge >= 100, 'JUMP READY', `charging — ${snapshot.jumpCharge}%`)
        ) as CommandDefinition
    );

    // power.route.<sys> — only for an online, unpowered system the budget allows.
    for (const id of POWERABLE) {
      const s = sys(id);
      if (s.online && !s.powered && snapshot.powerUsed + s.powerDraw <= snapshot.reactorOutput) {
        defs.push(
          command(`power.route.${id}`)
            .describe(`Route reactor power to ${s.label}`)
            .handle(act({ type: 'ROUTE_POWER', system: id }, `Routed power to ${s.label}.`)) as CommandDefinition
        );
      }
    }
    // power.cut.<sys> — only for a currently powered system.
    for (const id of POWERABLE) {
      if (sys(id).powered) {
        defs.push(
          command(`power.cut.${id}`)
            .describe(`Cut reactor power to ${sys(id).label}`)
            .handle(act({ type: 'CUT_POWER', system: id }, `Cut power to ${sys(id).label}.`)) as CommandDefinition
        );
      }
    }

    // shields — only the applicable verb is offered.
    const sh = sys('shields');
    if (sh.online && sh.powered && !snapshot.shieldsRaised) {
      defs.push(
        command('shields.raise')
          .describe('Raise shields (halves incoming hull damage)')
          .handle(act({ type: 'RAISE_SHIELDS' }, 'Shields raised.')) as CommandDefinition
      );
    }
    if (snapshot.shieldsRaised) {
      defs.push(
        command('shields.lower')
          .describe('Lower shields')
          .handle(act({ type: 'LOWER_SHIELDS' }, 'Shields lowered.')) as CommandDefinition
      );
    }

    // fix.<sys> — only for damaged systems. (Named "fix" not "repair" so its
    // first letter doesn't collide with "reset".)
    for (const s of snapshot.systems) {
      if (s.integrity < 100) {
        defs.push(
          command(`fix.${s.id}`)
            .describe(`Patch ${s.label} (+${REPAIR_AMOUNT} integrity)`)
            .handle(act({ type: 'REPAIR', system: s.id }, `Repairing ${s.label}.`)) as CommandDefinition
        );
      }
    }

    // reactor — scram if online, restart if not.
    if (sys('reactor').online) {
      defs.push(
        command('core.scram')
          .describe('Emergency reactor shutdown (kills all power)')
          .handle(act({ type: 'SCRAM' }, 'Reactor SCRAM — emergency shutdown.')) as CommandDefinition
      );
    } else {
      defs.push(
        command('core.restart')
          .describe('Bring the reactor back online')
          .handle(act({ type: 'RESTART' }, 'Reactor restarted.')) as CommandDefinition
      );
    }

    defs.push(
      command('hold')
        .describe('Hold position for one cycle (charge / weather the hazard)')
        .handle(act({ type: 'HOLD' }, 'Holding position.')) as CommandDefinition
    );

    // jump.engage — the win move, only once the drive is charged.
    if (snapshot.jumpCharge >= 100 && sys('engines').online && sys('engines').powered) {
      defs.push(
        command('jump.engage')
          .describe('Engage the jump drive and escape')
          .handle(act({ type: 'JUMP' }, 'Jumping.')) as CommandDefinition
      );
    }

    // eject.core — last resort at red alert, guarded by a two-step confirm that
    // only appears once armed.
    if (snapshot.alert === 'red' && !snapshot.ejectArmed) {
      defs.push(
        command('eject.core')
          .describe('Arm core ejection (abandon ship)')
          .handle(act({ type: 'ARM_EJECT' }, 'Core ejection armed — run eject.core.confirm.')) as CommandDefinition
      );
    }
    if (snapshot.ejectArmed) {
      defs.push(
        command('eject.core.confirm')
          .describe('Confirm core ejection — abandon ship')
          .handle(act({ type: 'EJECT' }, 'Ejecting core.')) as CommandDefinition
      );
    }
  }

  defs.push(
    command('reset')
      .describe('Reset the engagement')
      .handle(async () => {
        const { next } = actions.dispatch({ type: 'RESET' });
        return text(`Bridge reset. ${next.lastEvent}`);
      }) as CommandDefinition
  );

  return defs;
}
