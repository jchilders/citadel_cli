import { HistoryService } from '../services/HistoryService';

export interface CommandContext {
  history?: HistoryService;
  // We can add other services here as needed, like:
  // config?: ConfigService;
  // theme?: ThemeService;
  // etc.
}
