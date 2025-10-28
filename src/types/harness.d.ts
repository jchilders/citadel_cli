import type { CitadelConfig } from '../components/Citadel/config/types';

declare global {
  interface Window {
    __CITADEL_PROPS__?: {
      config?: Partial<CitadelConfig>;
    };
  }
}

export {};
