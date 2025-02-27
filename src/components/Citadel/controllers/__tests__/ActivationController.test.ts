import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActivationController } from '../ActivationController';
import { CitadelActivation } from '../../config/contexts';
import { CitadelCli } from '../../CitadelCli';

// Create a test element class that extends CitadelCli
class TestElement extends CitadelCli {
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
  let config: CitadelActivation;

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

  it('should call onOpen and update visibility when activation key is pressed', () => {
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(config.onOpen).toHaveBeenCalled();
    expect(controller.config.isVisible).toBe(true);
  });

  it('should call onClose and update visibility when Escape is pressed while visible', () => {
    config.isVisible = true;
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(config.onClose).toHaveBeenCalled();
    expect(controller.config.isVisible).toBe(false);
  });

  it('should trigger host update when config changes', () => {
    const updateSpy = vi.spyOn(host, 'requestUpdate');
    controller.updateConfig({ isVisible: true });
    expect(updateSpy).toHaveBeenCalled();
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
