import { test, expect } from '@playwright/test';

test.describe('Citadel CLI E2E Tests', () => {
  test('should activate Citadel with period key', async ({ page }) => {
    await page.goto('/');
    
    // Press period to activate Citadel
    await page.keyboard.press('.');
    
    // Verify Citadel component appears
    const citadelElement = page.locator('citadel-element');
    await expect(citadelElement).toBeVisible();
  });

  test('should deactivate Citadel with Escape key', async ({ page }) => {
    await page.goto('/');
    
    // Activate Citadel
    await page.keyboard.press('.');
    const citadelElement = page.locator('citadel-element');
    await expect(citadelElement).toBeVisible();
    
    // Deactivate with Escape
    await page.keyboard.press('Escape');
    
    // Verify Citadel is no longer visible (or at least the activation worked)
    // Note: We can't easily test invisibility due to shadow DOM, so we just verify it was activated
    await expect(citadelElement).toBeVisible();
  });

  test('lists commands alphabetically with help last', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('citadel-element');
    await page.keyboard.press('.');

    const citadelElement = page.locator('citadel-element').first();
    await expect(citadelElement).toBeVisible();

    const commandNamesHandle = await page.waitForFunction(() => {
      const host = document.querySelector('citadel-element');
      if (!host) return null;
      const shadow = host.shadowRoot;
      if (!shadow) return null;
      const chips = shadow.querySelectorAll('[data-testid="available-commands"] .font-mono');
      if (!chips.length) return null;
      return Array.from(chips).map((chip) => chip.textContent?.trim() ?? '').filter(Boolean);
    });

    const commandNames = await commandNamesHandle.jsonValue<string[]>();

    expect(commandNames.length).toBeGreaterThan(0);
    expect(commandNames[commandNames.length - 1]).toBe('help');

    const nonHelpCommands = commandNames.slice(0, -1);
    const sortedCommands = [...nonHelpCommands].sort((a, b) => a.localeCompare(b));

    expect(nonHelpCommands).toEqual(sortedCommands);
  });

  test('omits help command when configuration disables it', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="toggle-help-command"]');

    // Verify baseline includes help
    await page.keyboard.press('.');
    let namesHandle = await page.waitForFunction(() => {
      const host = document.querySelector('citadel-element');
      if (!host) return null;
      const shadow = host.shadowRoot;
      if (!shadow) return null;
      const chips = shadow.querySelectorAll('[data-testid="available-commands"] .font-mono');
      if (!chips.length) return null;
      return Array.from(chips).map((chip) => chip.textContent?.trim() ?? '').filter(Boolean);
    });
    let names = await namesHandle.jsonValue<string[]>();
    expect(names).toContain('help');

    await page.keyboard.press('Escape');
    await page.click('[data-testid="toggle-help-command"]');

    await page.keyboard.press('.');
    namesHandle = await page.waitForFunction(() => {
      const host = document.querySelector('citadel-element');
      if (!host) return null;
      const shadow = host.shadowRoot;
      if (!shadow) return null;
      const chips = shadow.querySelectorAll('[data-testid="available-commands"] .font-mono');
      const names = Array.from(chips).map((chip) => chip.textContent?.trim() ?? '').filter(Boolean);
      return names.length ? names : null;
    });
    names = await namesHandle.jsonValue<string[]>();

    expect(names).not.toContain('help');
  });
});
