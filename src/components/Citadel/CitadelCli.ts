import { LitElement, html, css, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { defaultConfig } from './config/defaults';
import { ActivationController } from './controllers/ActivationController';
import type { CitadelConfig } from './config/types';

export class CitadelCli extends LitElement {
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

  private _config: CitadelConfig = defaultConfig;

  @property({ type: Object })
  get config(): CitadelConfig {
    return this._config;
  }

  set config(value: CitadelConfig) {
    const oldValue = this._config;
    this._config = value;
    this.requestUpdate('config', oldValue);
  }

  private updateVisibility() {
    if (this.activationController.isVisible) {
      this.setAttribute('visible', '');
    } else {
      this.removeAttribute('visible');
    }
  }

  private handleVisibilityChange = () => {
    this.updateVisibility();
  }

  constructor() {
    super();
    this.activationController = new ActivationController(this, this.config, this.handleVisibilityChange);
    this.addController(this.activationController);
  }

  connectedCallback() {
    super.connectedCallback();
    this.activationController.hostConnected();
  }

  disconnectedCallback() {
    this.activationController.hostDisconnected();
    super.disconnectedCallback();
  }

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('config')) {
      const oldController = this.activationController;
      oldController.hostDisconnected();
      this.activationController = new ActivationController(this, this.config, this.handleVisibilityChange);
      this.addController(this.activationController);
      this.activationController.hostConnected();
    }
  }

  render() {
    return html`
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('citadel-cli', CitadelCli);
