import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActivationController } from '../ActivationController';
import { LitElement } from 'lit';

// Create a test element class
class TestElement extends LitElement {
  constructor() {
    super();
    // Disable shadow DOM for tests
    this.createRenderRoot = () => this;
  }
}

// Register the custom element
customElements.define('test-element', TestElement);

describe('ActivationController', () => {
  let host: TestElement;
  let controller: ActivationController;
  let config: {
    showCitadelKey: string;
    isVisible: boolean;
    onOpen: () => void;
    onClose: () => void;
  };

  beforeEach(() => {
    config = {
      showCitadelKey: '/',
      isVisible: false,
      onOpen: vi.fn(),
      onClose: vi.fn()
    };

    host = document.createElement('test-element') as TestElement;
    document.body.appendChild(host);
    controller = new ActivationController(host, config);
  });

  afterEach(() => {
    vi.clearAllMocks();
    host.remove();
  });

  it('should add keydown listener on connect', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    controller.hostConnected();
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove keydown listener on disconnect', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    controller.hostDisconnected();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should call onOpen when activation key is pressed', () => {
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(config.onOpen).toHaveBeenCalled();
  });

  it('should call onClose when Escape is pressed while visible', () => {
    config.isVisible = true;
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(config.onClose).toHaveBeenCalled();
  });

  it('should not trigger on input elements', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    
    controller.hostConnected();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    
    expect(config.onOpen).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
