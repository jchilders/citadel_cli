import React, { createContext, useContext } from 'react';
import { CitadelConfig } from './types';
import { defaultConfig } from './defaults';

const CitadelConfigContext = createContext<CitadelConfig>(defaultConfig);

export const CitadelConfigProvider: React.FC<{
  config?: CitadelConfig;
  children: React.ReactNode;
}> = ({ config = defaultConfig, children }) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    showCitadelKey: config.showCitadelKey || '.'
  };

  return (
    <CitadelConfigContext.Provider value={mergedConfig}>
      {children}
    </CitadelConfigContext.Provider>
  );
};

export const useCitadelConfig = () => {
  const context = useContext(CitadelConfigContext);
  if (context === undefined) {
    throw new Error('useCitadelConfig must be used within a CitadelConfigProvider');
  }
  return context;
};
