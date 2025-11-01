import { useContext } from 'react';
import { getCitadelConfigContext } from './CitadelConfigContext';

export const useCitadelConfig = () => {
  const context = useContext(getCitadelConfigContext());
  if (context === undefined) {
    throw new Error('useCitadelConfig must be used within a CitadelConfigProvider');
  }
  return context.config;
};

export const useCitadelCommands = () => {
  const context = useContext(getCitadelConfigContext());
  if (context === undefined) {
    throw new Error('useCitadelCommands must be used within a CitadelConfigProvider');
  }
  return context.commands;
};

export const useCitadelStorage = () => {
  const context = useContext(getCitadelConfigContext());
  if (context === undefined) {
    throw new Error('useCitadelStorage must be used within a CitadelConfigProvider');
  }
  return context.storage;
};

export const useSegmentStack = () => {
  const context = useContext(getCitadelConfigContext());
  if (context === undefined) {
    throw new Error('useSegmentStack must be used within a CitadelConfigProvider');
  }
  return context.segmentStack;
};
