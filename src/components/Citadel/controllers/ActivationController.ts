import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContextProvider } from '@lit/context';
import { CitadelActivation, activationContext } from '../config/contexts';

export class ActivationController implements ReactiveController {
  private provider: ContextProvider<typeof activationContext>;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(
    private host: ReactiveControllerHost,
    private config: CitadelActivation
  ) {
    this.provider = new ContextProvider(this.host, {
      context: activationContext,
      initialValue: config
    });
    
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  hostConnected() {
    document.addEventListener('keydown', this.keyHandler);
  }

  hostDisconnected() {
    document.removeEventListener('keydown', this.keyHandler);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase() || '';
    const isInputElement = ['input', 'textarea'].includes(targetTag);
    
    if (!this.config.isVisible && event.key === this.config.showCitadelKey && !isInputElement) {
      event.preventDefault();
      this.config.onOpen();
    }

    if (this.config.isVisible && event.key === 'Escape') {
      event.preventDefault();
      this.config.onClose();
    }
  }
}
