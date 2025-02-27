import { ReactiveController } from 'lit';
import { ContextProvider } from '@lit/context';
import { CitadelActivation, activationContext } from '../config/contexts';
import { CitadelElement } from '../CitadelElement';

export class ActivationController implements ReactiveController {
  private provider: ContextProvider<typeof activationContext>;
  private keyHandler: (e: KeyboardEvent) => void;

  private _config: CitadelActivation;

  get config(): CitadelActivation {
    return this._config;
  }

  constructor(
    private host: CitadelElement,
    initialConfig: CitadelActivation
  ) {
    this._config = initialConfig;
    this.provider = new ContextProvider(this.host, {
      context: activationContext,
      initialValue: this._config
    });
    
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  updateConfig(updates: Partial<CitadelActivation>) {
    this._config = { ...this._config, ...updates };
    this.provider.setValue(this._config);
    this.host.requestUpdate();
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
    
    if (!this._config.isVisible && event.key === this._config.showCitadelKey && !isInputElement) {
      event.preventDefault();
      this._config.onOpen();
      this.updateConfig({ isVisible: true });
    }

    if (this._config.isVisible && event.key === 'Escape') {
      event.preventDefault();
      this._config.onClose();
      this.updateConfig({ isVisible: false });
    }
  }
}
