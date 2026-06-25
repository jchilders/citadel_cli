import { useCallback, useMemo, useRef, useState } from 'react';
import { CommandRegistry } from '@citadel/core';
import { createCommandRegistry } from '@citadel/core';
import {
  Action,
  StarshipActions,
  StarshipSnapshot,
  applyAction,
  createInitialState,
  createStarshipCommandDefinitions,
} from './starshipCommands';

export interface UseStarshipDemoResult {
  commandRegistry: CommandRegistry;
  snapshot: StarshipSnapshot;
}

// Owns the ship state and rebuilds the registry from it every cycle, so the
// available commands track the situation. A ref holds the latest committed
// state so command handlers can dispatch and read the outcome synchronously
// (commands run sequentially between renders).
export const useStarshipDemo = (): UseStarshipDemoResult => {
  const [ship, setShip] = useState<StarshipSnapshot>(createInitialState);
  const shipRef = useRef(ship);
  shipRef.current = ship;

  const dispatch = useCallback<StarshipActions['dispatch']>((action: Action) => {
    const result = applyAction(shipRef.current, action);
    shipRef.current = result.next;
    setShip(result.next);
    return result;
  }, []);

  const actions = useMemo<StarshipActions>(() => ({ dispatch }), [dispatch]);

  const commandRegistry = useMemo(
    () => createCommandRegistry(createStarshipCommandDefinitions(actions, ship)),
    [actions, ship]
  );

  return { commandRegistry, snapshot: ship };
};
