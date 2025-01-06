import React, { createContext, useContext, useEffect } from 'react';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';
import { StorageFactory } from '../storage/StorageFactory';
import { CommandStorage } from '../types/storage';

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

  const contextValue = {
    config: mergedConfig,
    commands,
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