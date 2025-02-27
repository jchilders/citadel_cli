import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActivationController } from '../ActivationController';
import { CitadelCli } from '../../CitadelCli';
import { CitadelConfig } from '../../config/types';

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
  let config: CitadelConfig;

  beforeEach(() => {
    config = {
      showCitadelKey: '/',
    };

    host = document.createElement('test-element') as TestElement;
    document.body.appendChild(host);
    controller = new ActivationController(host, config, () => {});
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

  it('should update visibility when activation key is pressed', () => {
    const onVisibilityChange = vi.fn();
    controller = new ActivationController(host, config, onVisibilityChange);
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(controller.isVisible).toBe(true);
    expect(onVisibilityChange).toHaveBeenCalled();
  });

  it('should update visibility when Escape is pressed while visible', () => {
    controller.setVisible(true);
    controller.hostConnected();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(controller.isVisible).toBe(false);
  });

  it('should trigger host update when visibility changes', () => {
    const updateSpy = vi.spyOn(host, 'requestUpdate');
    const onVisibilityChange = vi.fn();
    controller = new ActivationController(host, config, onVisibilityChange);
    controller.setVisible(true);
    expect(updateSpy).toHaveBeenCalled();
    expect(onVisibilityChange).toHaveBeenCalled();
  });

  it('should not trigger on input elements', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    
    controller.hostConnected();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    
    expect(controller.isVisible).toBe(false);
    document.body.removeChild(input);
  });
});
