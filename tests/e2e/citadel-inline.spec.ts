import { test, expect } from '@playwright/test';

test.describe('Citadel inline mode', () => {
  test('renders inline console with dominant output area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inlineToggle = page.locator('[data-testid="mode-toggle-inline"]');
    await inlineToggle.click();

    const citadelElement = page.locator('citadel-element').first();
    await expect(citadelElement).toBeVisible({ timeout: 10000 });

    const metrics = await citadelElement.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return null;

      const inlineContainer = shadow.querySelector('[data-testid="citadel-inline-container"]') as HTMLElement | null;
      const output = shadow.querySelector('[data-testid="citadel-command-output"]') as HTMLElement | null;

      if (!inlineContainer || !output) return null;

      return {
        containerHeight: inlineContainer.clientHeight,
        outputHeight: output.clientHeight
      };
    });

    expect(metrics).not.toBeNull();
    const { containerHeight, outputHeight } = metrics!;

    expect(containerHeight).toBeGreaterThan(0);
    expect(outputHeight).toBeGreaterThan(containerHeight * 0.6);
  });
});
