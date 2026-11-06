import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SHELL_COPY } from '../src/content/shellCopy';

// The texts come from the author's file, so rewriting them never breaks this test. Read as plain
// JSON: Playwright's loader won't import `.json` without an import attribute, which Vite's code doesn't use.
const ui = JSON.parse(readFileSync(new URL('../src/content/acto1.json', import.meta.url), 'utf8')).interfaz;
const COPY = {
  title: ui.titulo as string,
  act: ui.acto as string,
  intro: { start: ui.intro.boton_empezar as string },
  ending: {
    title: ui.final.titulo as string,
    listen: ui.final.escuchar as string,
    // Same value `src/content/acto1.test.ts` pins for COPY.ending.listenUrl.
    listenUrl: 'https://ffm.to/tiann-astronauta',
  },
};

/** Fixed seed + debug panel (ENG-03): same world every run, and nothing is saved. */
const START = '/#w123&debug';
const ACT_I = SHELL_COPY.actLabel('I', 'Astronauta');

/** Fails the test on any uncaught exception or console error. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** Menu → act select → Act I, and through the intro until the player is up and playing. */
async function enterActI(page: Page): Promise<void> {
  await page.getByRole('button', { name: SHELL_COPY.selectAct }).click();
  await page.getByRole('button', { name: ACT_I }).click();
  await expect(page.locator('#intro')).not.toHaveClass(/gone/);
  await expect(page.locator('#intro h1')).toHaveText(COPY.title);
  await expect(page.locator('#intro .act')).toHaveText(COPY.act);
}

/** The world canvas is up with a live WebGL context (SwiftShader in CI). */
async function expectWorldRendering(page: Page): Promise<void> {
  const canvas = page.locator('canvas#world');
  await expect(canvas).toHaveCount(1);
  // getContext returns the context three.js already created; null would mean WebGL never started.
  const webgl = await canvas.evaluate((c: HTMLCanvasElement) => {
    const gl = c.getContext('webgl2');
    return gl !== null && !gl.isContextLost();
  });
  expect(webgl).toBe(true);
}

test.beforeEach(async ({ page }) => {
  // Never reach the real ffm.to from a test run.
  await page
    .context()
    .route('https://ffm.to/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>ffm.to (stub)</title>' }),
    );
  await page.goto(START);
});

test('intro → despertar → final (debug) → link de ffm.to', async ({ page, context }) => {
  const errors = watchErrors(page);
  await enterActI(page);
  await expectWorldRendering(page);

  // Despertar: the intro goes away and the debug panel reports chapter 1 once she's up (~4 s of waking).
  await page.getByRole('button', { name: COPY.intro.start }).click();
  await expect(page.locator('#intro')).toHaveClass(/gone/);
  const debug = page.locator('#debug');
  await debug.locator('summary').click();
  await expect(debug.locator('summary')).toContainText('cap. 1');

  // Final: mark everything, then click through the memory cards until the closing hands over.
  await debug.getByRole('button', { name: /Marcar todo/ }).click();
  const card = page.locator('#mcard');
  const ending = page.locator('#ending');
  await expect(async () => {
    if (await card.evaluate((el) => el.classList.contains('show'))) await card.click();
    await expect(ending).not.toHaveClass(/gone/, { timeout: 500 });
  }).toPass({ timeout: 150_000, intervals: [250] });

  await expect(ending.locator('h1')).toHaveText(COPY.ending.title);
  await expect(debug.locator('summary')).toContainText('final');

  // Link de ffm.to: right URL, opens in a new tab.
  const listen = ending.getByRole('link', { name: COPY.ending.listen });
  await expect(listen).toHaveAttribute('href', COPY.ending.listenUrl);
  await expect(listen).toHaveAttribute('target', '_blank');
  const [popup] = await Promise.all([context.waitForEvent('page'), listen.click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe(COPY.ending.listenUrl);

  expect(errors).toEqual([]);
});

test('entrar y salir del Acto I varias veces no rompe nada (ADR 0001)', async ({ page }) => {
  const errors = watchErrors(page);
  for (let i = 0; i < 3; i++) {
    await enterActI(page);
    await expectWorldRendering(page);
    await page.getByRole('button', { name: COPY.intro.start }).click();
    await expect(page.locator('#intro')).toHaveClass(/gone/);

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: SHELL_COPY.toMenu }).click();
    // dispose() removes the canvas: nothing of the act is left behind.
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByRole('button', { name: SHELL_COPY.selectAct })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('opciones de accesibilidad se aplican y se guardan (ENG-09)', async ({ page }) => {
  const errors = watchErrors(page);
  await enterActI(page);
  await page.getByRole('button', { name: COPY.intro.start }).click();
  await page.keyboard.press('Escape');

  const rootFontSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  const base = parseFloat(await rootFontSize());
  const largest = SHELL_COPY.textSizes[1.5];
  await page.getByRole('button', { name: largest }).click();
  await expect(page.getByRole('button', { name: largest })).toHaveAttribute('aria-pressed', 'true');
  expect(parseFloat(await rootFontSize())).toBeCloseTo(base * 1.5, 1);

  const slider = page.getByRole('slider', { name: SHELL_COPY.lookSensitivity });
  await slider.fill('4');
  await expect(slider).toHaveAttribute('aria-valuetext', SHELL_COPY.lookValue(2));

  await page.reload();
  expect(parseFloat(await rootFontSize())).toBeCloseTo(base * 1.5, 1);
  expect(await page.evaluate(() => [localStorage.getItem('lvr-text'), localStorage.getItem('lvr-look')])).toEqual([
    '1.5',
    '2',
  ]);
  expect(errors).toEqual([]);
});
