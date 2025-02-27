import { ReactiveController } from 'lit';
import { CitadelCli } from '../CitadelCli';
import { CitadelConfig } from '../config/types';

export class ActivationController implements ReactiveController {
  private keyHandler: (e: KeyboardEvent) => void;
  private _isVisible = false;
  
  get isVisible(): boolean {
    return this._isVisible;
  }

  constructor(
    private host: CitadelCli,
    private config: CitadelConfig,
    private onVisibilityChange: () => void
  ) {
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  setVisible(visible: boolean) {
    const oldValue = this._isVisible;
    this._isVisible = visible;
    if (oldValue !== visible) {
      this.onVisibilityChange();
      this.host.requestUpdate();
    }
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
    
    if (!this._isVisible && event.key === this.config.showCitadelKey && !isInputElement) {
      event.preventDefault();
      this.setVisible(true);
    }

    if (this._isVisible && event.key === 'Escape') {
      event.preventDefault();
      this.setVisible(false);
    }
  }
}
