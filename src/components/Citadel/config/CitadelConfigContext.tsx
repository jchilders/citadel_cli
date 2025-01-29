import React, { createContext, useContext, useEffect } from 'react';
import { createHelpHandler } from '../types/help-command';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';
import { StorageFactory } from '../storage/StorageFactory';
import { CommandStorage } from '../types/storage';
import { CommandTrie } from '../types/command-trie';


interface CitadelContextValue {
  config: CitadelConfig;
  commands?: CommandTrie;
  storage?: CommandStorage;
}

const CitadelConfigContext = createContext<CitadelContextValue>({ config: defaultConfig });

export const CitadelConfigProvider: React.FC<{
  config?: CitadelConfig;
  commands?: CommandTrie;
  children: React.ReactNode;
}> = ({ config = defaultConfig, commands: commands, children }) => {
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
  }, []); // Empty deps array since we only want to initialize once

  // Add help command if enabled
  useEffect(() => {
    if (commands && mergedConfig.includeHelpCommand) {
      const helpHandler = createHelpHandler(commands);
      commands.addCommand(
        [{ type: 'word', name: 'help' }],
        'Show available commands',
        helpHandler
      );
    }
  }, [commands, mergedConfig.includeHelpCommand]);

  const contextValue = {
    config: mergedConfig,
    commands: commands,
    storage
  };

  return (
    <CitadelConfigContext.Provider value={contextValue}>
      {children}
    </CitadelConfigContext.Provider>
  );
};

export const useCitadelConfig = () => {
  const context = useContext(CitadelConfigContext);
  if (context === undefined) {
    throw new Error('useCitadelConfig must be used within a CitadelConfigProvider');
  }
  return context.config;
};

export const useCitadelCommands = () => {
  const context = useContext(CitadelConfigContext);
  if (context === undefined) {
    throw new Error('useCitadelCommands must be used within a CitadelConfigProvider');
  }
  return context.commands;
};

export const useCitadelStorage = () => {
  const context = useContext(CitadelConfigContext);
  if (context === undefined) {
    throw new Error('useCitadelStorage must be used within a CitadelConfigProvider');
  }
  return context.storage;
};
