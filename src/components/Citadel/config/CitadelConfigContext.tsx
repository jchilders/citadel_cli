import React, { createContext, useEffect } from 'react';
import { createHelpHandler } from '../types/help-command';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';
import { StorageFactory } from '../storage/StorageFactory';
import { CommandStorage } from '../types/storage';
import { CommandRegistry } from '../types/command-registry';
import { SegmentStack } from '../types/segment-stack';

interface CitadelContextValue {
  config: CitadelConfig;
  commands: CommandRegistry;
  storage?: CommandStorage;
  segmentStack: SegmentStack;
}

const defaultContextValue: CitadelContextValue = {
  config: defaultConfig,
  commands: new CommandRegistry(),
  segmentStack: new SegmentStack()
};

let internalContext: React.Context<CitadelContextValue> | null = null;

export const getCitadelConfigContext = () => {
  if (internalContext) {
    return internalContext;
  }

  if (typeof createContext !== 'function') {
    throw new Error(
      'Citadel can only be rendered in a Client Component. Add the `"use client"` directive to the module that imports it.'
    );
  }

  internalContext = createContext(defaultContextValue);
  return internalContext;
};

export const CitadelConfigContext = new Proxy(
  {} as React.Context<CitadelContextValue>,
  {
    get: (_target, property) => {
      const context = getCitadelConfigContext();
      return (context as unknown as Record<PropertyKey, unknown>)[property];
    },
    set: (_target, property, value) => {
      const context = getCitadelConfigContext();
      (context as unknown as Record<PropertyKey, unknown>)[property] = value;
      return true;
    },
    has: (_target, property) => {
      const context = getCitadelConfigContext();
      return property in (context as unknown as Record<PropertyKey, unknown>);
    },
  }
);

export const CitadelConfigProvider: React.FC<{
  config?: CitadelConfig;
  commandRegistry?: CommandRegistry;
  children: React.ReactNode;
}> = ({ config = defaultConfig, commandRegistry: commands, children }) => {
  const [storage, setStorage] = React.useState<CommandStorage>();

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    // Ensure nested objects are properly merged
    storage: {
      ...defaultConfig.storage,
      ...config.storage
    },
    // Ensure explicit values from config take precedence
    cursorType: config.cursorType ?? defaultConfig.cursorType,
    cursorColor: config.cursorColor ?? defaultConfig.cursorColor,
    cursorSpeed: config.cursorSpeed ?? defaultConfig.cursorSpeed,
    showCitadelKey: config.showCitadelKey || '.'
  };

  // Initialize storage during provider setup
  useEffect(() => {
    StorageFactory.getInstance().initializeStorage(
      mergedConfig.storage ?? defaultConfig.storage!
    );
    setStorage(StorageFactory.getInstance().getStorage());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array since we only want to initialize once

  // Add help command if enabled
  useEffect(() => {
    if (!commands) {
      return;
    }

    if (mergedConfig.includeHelpCommand) {
      if (!commands.commandExistsForPath(['help'])) {
        const helpHandler = createHelpHandler(commands);
        commands.addCommand(
          [{ type: 'word', name: 'help' }],
          'Show available commands',
          helpHandler
        );
      }
      return;
    }

    commands.removeCommand(['help']);
  }, [commands, mergedConfig.includeHelpCommand]);

  const contextValue: CitadelContextValue = {
    config: mergedConfig,
    commands: commands || new CommandRegistry(),
    storage,
    segmentStack: new SegmentStack()
  };

  const Context = getCitadelConfigContext();

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
