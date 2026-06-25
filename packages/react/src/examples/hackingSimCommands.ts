import {
  CommandDefinition,
  command,
  text,
  json,
  error,
} from '@citadel/core';
import { victory } from './hackingSimVictory';

// A tiny hacking-sim game: scan the network, pop hosts, capture loot that
// unlocks the next target, and root the mainframe for the win. It's meant to be
// fun to play first and foremost.
//
// The mechanism that makes it work is that the command registry is rebuilt from
// live game state every turn, so commands *appear as you discover the network*:
// only `scan`/`info`/`reset` exist up front; `connect.<host>` unlocks once a
// host is discovered, and `exploit.<host>` unlocks once you have a session on
// it — progression a static command tree can't express.

export interface HostBlueprint {
  id: string;
  ip: string;
  service: string;
  vuln: string;
  /** Loot that must be captured elsewhere before this host can be exploited. */
  requiresLoot: string | null;
  /** Loot captured when this host is rooted. */
  yieldsLoot: string;
  /** Hosts revealed (made discoverable) when this host is rooted. */
  revealsHosts: string[];
  /** Reachable from the initial scan (the public DMZ). */
  inDmz: boolean;
}

// Host ids have distinct first letters (g/w/d/m), as do the top-level command
// words (scan/connect/exploit/info/reset → s/c/e/i/r), so auto-expansion stays
// unambiguous: "s" → scan, "c g" → connect.gateway, "e m" → exploit.mainframe.
export const HACKING_SIM_NETWORK: HostBlueprint[] = [
  {
    id: 'gateway',
    ip: '10.0.0.1',
    service: 'ssh (22)',
    vuln: 'weak-credentials',
    requiresLoot: null,
    yieldsLoot: 'intranet-map',
    revealsHosts: ['dbserver'],
    inDmz: true,
  },
  {
    id: 'webserver',
    ip: '10.0.0.20',
    service: 'http (80)',
    vuln: 'sql-injection',
    requiresLoot: null,
    yieldsLoot: 'db-credentials',
    revealsHosts: [],
    inDmz: true,
  },
  {
    id: 'dbserver',
    ip: '10.0.0.30',
    service: 'postgres (5432)',
    vuln: 'credential-reuse',
    requiresLoot: 'db-credentials',
    yieldsLoot: 'root-key',
    revealsHosts: ['mainframe'],
    inDmz: false,
  },
  {
    id: 'mainframe',
    ip: '10.0.0.99',
    service: 'vault (8200)',
    vuln: 'unsealed-vault',
    requiresLoot: 'root-key',
    yieldsLoot: 'crown-jewels',
    revealsHosts: [],
    inDmz: false,
  },
];

export interface HostState extends HostBlueprint {
  discovered: boolean;
  connected: boolean;
  rooted: boolean;
}

export interface HackingSimSnapshot {
  hosts: HostState[];
  loot: string[];
  scanned: boolean;
  won: boolean;
}

export interface HackingSimActions {
  scan: () => void;
  connect: (hostId: string) => void;
  exploit: (hostId: string) => void;
  reset: () => void;
}

export function createHackingSimCommandDefinitions(
  actions: HackingSimActions,
  snapshot: HackingSimSnapshot
): CommandDefinition[] {
  const find = (id: string): HostState | undefined =>
    snapshot.hosts.find((host) => host.id === id);

  const definitions: CommandDefinition[] = [
    command('scan')
      .describe('Sweep the subnet for reachable hosts')
      .handle(async () => {
        actions.scan();
        const dmz = snapshot.hosts.filter((host) => host.inDmz);
        return text(
          `nmap sweep complete — ${dmz.length} hosts up:\n` +
            dmz.map((host) => `  ${host.ip}  ${host.id}  (${host.service})`).join('\n') +
            `\n\nOpen a session: "connect.${dmz[0].id}".`
        );
      }) as CommandDefinition,
  ];

  // connect.<host> exists only for hosts you've discovered but not yet rooted.
  for (const host of snapshot.hosts.filter((h) => h.discovered && !h.rooted)) {
    definitions.push(
      command(`connect.${host.id}`)
        .describe(`Open a session to ${host.id} (${host.ip})`)
        .handle(async () => {
          actions.connect(host.id);
          return text(
            `Session opened to ${host.id} ${host.ip}\n` +
              `  service: ${host.service}\n` +
              `  vuln:    ${host.vuln}\n` +
              (host.requiresLoot ? `  needs:   "${host.requiresLoot}" to exploit\n` : '') +
              `\nRun "exploit.${host.id}".`
          );
        }) as CommandDefinition
    );
  }

  // exploit.<host> exists only for hosts you currently have a session on.
  for (const host of snapshot.hosts.filter((h) => h.connected && !h.rooted)) {
    definitions.push(
      command(`exploit.${host.id}`)
        .describe(`Run ${host.vuln} against ${host.id}`)
        // Optional target IP. It defaults to this host's own address, so
        // "exploit.gateway" just works; passing an IP that isn't the host's is
        // treated as aiming at the wrong box.
        .arg('ip', (arg) =>
          arg
            .describe(`Target IP (defaults to ${host.id} at ${host.ip})`)
            .optional({ default: host.ip })
        )
        .handle(async ({ namedArgs }) => {
          const targetIp = (namedArgs.ip ?? host.ip).trim();
          if (targetIp !== host.ip) {
            return error(
              `No "${host.vuln}" target at ${targetIp}. ${host.id} is reachable at ${host.ip} — omit the IP to hit it directly.`
            );
          }

          if (host.requiresLoot && !snapshot.loot.includes(host.requiresLoot)) {
            const source = snapshot.hosts.find((h) => h.yieldsLoot === host.requiresLoot);
            return error(
              `Exploit blocked: "${host.vuln}" needs "${host.requiresLoot}", which you haven't captured yet` +
                (source ? ` — try rooting ${source.id} (${source.ip}).` : '.')
            );
          }

          actions.exploit(host.id);

          if (host.id === 'mainframe') {
            // A colorful skull-and-crossbones animation plays, then the
            // success message lands (see hackingSimVictory.tsx).
            return victory(
              [
                'ROOT @ mainframe — vault unsealed',
                'exfiltrated: crown-jewels',
                'OBJECTIVE COMPLETE',
                '',
                'Run "reset" to wipe your tracks and start a fresh engagement.',
              ].join('\n')
            );
          }

          const revealed = host.revealsHosts
            .map((id) => find(id))
            .filter((h): h is HostState => Boolean(h));
          return text(
            `root@${host.id}:~# id\nuid=0(root) gid=0(root)\n\n` +
              `Captured loot: "${host.yieldsLoot}".` +
              (revealed.length
                ? `\nNewly reachable: ${revealed
                    .map((h) => `${h.id} (${h.ip})`)
                    .join(', ')} — "connect.${revealed[0].id}".`
                : '')
          );
        }) as CommandDefinition
    );
  }

  definitions.push(
    command('info')
      .describe('Show the network map, captured loot, and objective status')
      .handle(async () =>
        json({
          objective: snapshot.won
            ? 'COMPLETE — mainframe rooted, crown-jewels exfiltrated'
            : 'Root the mainframe (10.0.0.99) and exfiltrate the crown-jewels',
          loot: snapshot.loot.length ? snapshot.loot : ['(none captured yet)'],
          hosts: snapshot.hosts
            .filter((host) => host.discovered)
            .map((host) => ({
              host: host.id,
              ip: host.ip,
              access: host.rooted ? 'root' : host.connected ? 'session' : 'discovered',
              vuln: host.vuln,
            })),
          undiscoveredHosts: snapshot.hosts.filter((host) => !host.discovered).length,
        })
      ) as CommandDefinition,

    command('reset')
      .describe('Reset the engagement to a fresh network')
      .handle(async () => {
        actions.reset();
        return text('Engagement reset — tracks wiped. Run "scan" to begin.');
      }) as CommandDefinition
  );

  return definitions;
}
