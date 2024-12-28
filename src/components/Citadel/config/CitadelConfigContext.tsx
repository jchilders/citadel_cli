import * as React from 'react';
import { createContext, useContext } from 'react';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';

interface CitadelContextValue {
  config: CitadelConfig;
  commands?: Record<string, any>;
}

const CitadelConfigContext = createContext<CitadelContextValue>({ config: defaultConfig });

export const CitadelConfigProvider: React.FC<{
  config?: CitadelConfig;
  commands?: Record<string, any>;
  children: React.ReactNode;
}> = ({ config = {}, commands, children }) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  };

  const contextValue = {
    config: mergedConfig,
    commands
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
