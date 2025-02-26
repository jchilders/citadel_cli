import { createContext } from '@lit/context';

export interface CitadelActivation {
  showCitadelKey: string;
  isVisible: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const activationContext = createContext<CitadelActivation>('citadel-activation');
