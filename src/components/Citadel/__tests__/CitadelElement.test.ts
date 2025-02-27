import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CitadelElement } from '../CitadelElement';

// Import CitadelElement to ensure it's registered
import '../CitadelElement';

describe('CitadelElement', () => {
  let element: CitadelElement;

  beforeEach(async () => {
    element = document.createElement('citadel-element') as CitadelElement;
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
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    await element.updateComplete;
    // Wait for microtasks and animation frame
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(element.hasAttribute('visible')).toBe(true);
  });

  it('should hide when Escape is pressed while visible', async () => {
    // First show the element
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
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
