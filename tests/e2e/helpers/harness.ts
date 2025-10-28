import { Page } from '@playwright/test';
import { CitadelConfig } from '../../../src/components/Citadel/config/types';

export type HarnessProps = {
  config?: Partial<CitadelConfig>;
};

export async function openHarness(page: Page, props: HarnessProps = {}) {
  await page.addInitScript(() => {
    window.__CITADEL_PROPS__ = undefined;
  });
  await page.addInitScript((config) => {
    window.__CITADEL_PROPS__ = config;
  }, props);
  await page.goto('/tests/harness/index.html');
  await page.waitForSelector('citadel-element');
}
