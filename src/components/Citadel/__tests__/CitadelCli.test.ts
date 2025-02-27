import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CitadelConfig } from '../config/types';
import { defaultConfig } from '../config/defaults';
import { CitadelCli } from '../CitadelCli';

// Import CitadelCli to ensure it's registered
import '../CitadelCli';

describe('CitadelCli', () => {
  let element: CitadelCli;

  beforeEach(async () => {
    element = document.createElement('citadel-cli') as CitadelCli;
    document.body.appendChild(element);
    await element.updateComplete;
    // Wait for element to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(() => {
    element.remove();
  });

  it('should be hidden by default', () => {
    expect(element.hasAttribute('visible')).toBe(false);
  });

  it('should show when activation key is pressed', async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }));
    await element.updateComplete;
    // Wait for microtasks and animation frame
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(element.hasAttribute('visible')).toBe(true);
  });

  it('should accept custom config', async () => {
    const customConfig: CitadelConfig = {
      ...defaultConfig,
      showCitadelKey: 'x',
      maxHeight: '60vh'
    };
    element.config = customConfig;
    await element.updateComplete;

    // Test that it uses the custom activation key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    await element.updateComplete;
    expect(element.hasAttribute('visible')).toBe(true);
  });

  it('should hide when Escape is pressed while visible', async () => {
    // First show the element
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }));
    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(element.hasAttribute('visible')).toBe(true);

    // Then press Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(element.hasAttribute('visible')).toBe(false);
  });
});
