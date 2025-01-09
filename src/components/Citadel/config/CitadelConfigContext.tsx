import React, { createContext, useContext, useEffect } from 'react';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';
import { StorageFactory } from '../storage/StorageFactory';
import { CommandStorage } from '../types/storage';
import { CommandHandler, CommandArgument } from '../types/command-trie';

interface FlatCommand {
  description: string;
  handler?: CommandHandler;
  argument?: CommandArgument;
}

interface HierarchicalCommand {
  description?: string;
  handler?: CommandHandler;
  argument?: CommandArgument;
  [key: string]: any;
}

function flattenCommands(
  obj: Record<string, HierarchicalCommand>,
  prefix: string[] = []
): Record<string, FlatCommand> {
  const result: Record<string, FlatCommand> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...prefix, key];
    
    if (value.handler || value.argument || value.description) {
      result[currentPath.join('.')] = {
        description: value.description || `${currentPath.join('.')} command`,
        ...(value.handler && { handler: value.handler }),
        ...(value.argument && { argument: value.argument })
      };
    }
    
    // Recursively process nested commands
    const nested = Object.entries(value).reduce((acc, [k, v]) => {
      if (k !== 'description' && k !== 'handler' && k !== 'argument') {
        acc[k] = v;
      }
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(nested).length > 0) {
      Object.assign(result, flattenCommands(nested, currentPath));
    }
  }

  return result;
}

interface CitadelContextValue {
  config: CitadelConfig;
  commands?: Record<string, any>;
  storage?: CommandStorage;
}

const CitadelConfigContext = createContext<CitadelContextValue>({ config: defaultConfig });

export const CitadelConfigProvider: React.FC<{
  config?: CitadelConfig;
  commands?: Record<string, any>;
  children: React.ReactNode;
}> = ({ config = defaultConfig, commands, children }) => {
  const [storage, setStorage] = React.useState<CommandStorage>();

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    showCitadelKey: config.showCitadelKey || '.'
  };

  // Initialize storage during provider setup
  useEffect(() => {
    StorageFactory.getInstance().initializeStorage(
      mergedConfig.storage ?? defaultConfig.storage!
    );
    setStorage(StorageFactory.getInstance().getStorage());
  }, []); // Empty deps array since we only want to initialize once

  const flattenedCommands = commands ? flattenCommands(commands) : undefined;
  
  const contextValue = {
    config: mergedConfig,
    commands: flattenedCommands,
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
