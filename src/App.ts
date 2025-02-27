import { LitElement, html, css } from 'lit';
import './components/Citadel';

export class App extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .text {
      margin: 0 0 1rem;
      font-size: 1.2rem;
      color: #333;
    }

    .keyCode {
      background: #eee;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="card">
          <p class="text">
            Press <code class="keyCode">/</code> to<br />activate Citadel
          </p>
          <citadel-cli></citadel-cli>
        </div>
      </div>
    `;
  }
}

customElements.define('citadel-app', App);
