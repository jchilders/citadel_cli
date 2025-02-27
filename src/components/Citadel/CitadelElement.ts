import { LitElement, html, css } from 'lit';
import { ActivationController } from './controllers/ActivationController';
import type { CitadelActivation } from './config/contexts';

export class CitadelElement extends LitElement {
  protected activationController: ActivationController;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
    }

    :host([visible]) {
      opacity: 1;
      visibility: visible;
    }

    .container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
      transform: translateY(-20px);
      transition: transform 0.2s ease-out;
    }

    :host([visible]) .container {
      transform: translateY(0);
    }
  `;

  private _visible = false;

  constructor() {
    super();
    this._visible = false;
    const config: CitadelActivation = {
      showCitadelKey: '/',
      isVisible: this._visible,
      onOpen: () => this.show(),
      onClose: () => this.hide()
    };
    
    this.activationController = new ActivationController(this, config);
  }

  connectedCallback() {
    super.connectedCallback();
    this.activationController.hostConnected();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.activationController.hostDisconnected();
  }

  private async show() {
    this._visible = true;
    this.setAttribute('visible', '');
    // Request update before notifying controller
    this.requestUpdate();
    await this.updateComplete;
    this.activationController.updateConfig({ isVisible: true });
  }

  private async hide() {
    this._visible = false;
    this.removeAttribute('visible');
    // Request update before notifying controller
    this.requestUpdate();
    await this.updateComplete;
    this.activationController.updateConfig({ isVisible: false });
  }

  render() {
    return html`
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('citadel-element', CitadelElement);
