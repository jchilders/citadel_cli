import { useCallback, useMemo, useState } from 'react';
import { CommandRegistry } from '@citadel_cli/core';
import { createCommandRegistry } from '@citadel_cli/core';
import {
  HACKING_SIM_NETWORK,
  HackingSimSnapshot,
  HostState,
  createHackingSimCommandDefinitions,
} from './hackingSimCommands';

const initialHosts = (): HostState[] =>
  HACKING_SIM_NETWORK.map((blueprint) => ({
    ...blueprint,
    discovered: false,
    connected: false,
    rooted: false,
  }));

export interface UseHackingSimDemoResult {
  commandRegistry: CommandRegistry;
  snapshot: HackingSimSnapshot;
}

// Owns the engagement state and rebuilds the registry from it every turn (the
// `useMemo` keyed on `snapshot`). Because the registry identity changes when
// state changes, <Citadel> hot-swaps it and the newly-available command chips
// appear live as you progress.
export const useHackingSimDemo = (): UseHackingSimDemoResult => {
  const [hosts, setHosts] = useState<HostState[]>(initialHosts);
  const [loot, setLoot] = useState<string[]>([]);
  const [scanned, setScanned] = useState(false);
  const [won, setWon] = useState(false);

  const scan = useCallback(() => {
    setScanned(true);
    setHosts((prev) => prev.map((host) => (host.inDmz ? { ...host, discovered: true } : host)));
  }, []);

  const connect = useCallback((hostId: string) => {
    setHosts((prev) =>
      prev.map((host) => (host.id === hostId ? { ...host, connected: true } : host))
    );
  }, []);

  const exploit = useCallback((hostId: string) => {
    setHosts((prev) => {
      const target = prev.find((host) => host.id === hostId);
      if (!target) {
        return prev;
      }
      const reveal = new Set(target.revealsHosts);
      return prev.map((host) => {
        if (host.id === hostId) {
          return { ...host, rooted: true };
        }
        if (reveal.has(host.id)) {
          return { ...host, discovered: true };
        }
        return host;
      });
    });
    setLoot((prev) => {
      const target = HACKING_SIM_NETWORK.find((host) => host.id === hostId);
      if (!target || prev.includes(target.yieldsLoot)) {
        return prev;
      }
      return [...prev, target.yieldsLoot];
    });
    if (hostId === 'mainframe') {
      setWon(true);
    }
  }, []);

  const reset = useCallback(() => {
    setHosts(initialHosts());
    setLoot([]);
    setScanned(false);
    setWon(false);
  }, []);

  const snapshot = useMemo<HackingSimSnapshot>(
    () => ({ hosts, loot, scanned, won }),
    [hosts, loot, scanned, won]
  );

  const commandRegistry = useMemo(
    () =>
      createCommandRegistry(
        createHackingSimCommandDefinitions({ scan, connect, exploit, reset }, snapshot)
      ),
    [scan, connect, exploit, reset, snapshot]
  );

  return { commandRegistry, snapshot };
};
