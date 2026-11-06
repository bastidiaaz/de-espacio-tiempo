import { describe, expect, it } from 'vitest';
import { actEvent, createAnalytics, type AnalyticsHost } from './analytics';

interface FakeScript {
  src: string;
  endpoint: string;
  onload: () => void;
}

function fakeHost(hash = ''): AnalyticsHost & { scripts: FakeScript[]; counted: unknown[] } {
  const scripts: FakeScript[] = [];
  const counted: unknown[] = [];
  const host = {
    scripts,
    counted,
    hash,
    win: {} as { goatcounter?: { count?: (vars: unknown) => void } },
    appendScript(src: string, endpoint: string, onload: () => void) {
      scripts.push({ src, endpoint, onload });
    },
  };
  return host;
}

/** What count.js does once it has loaded. */
function loadScript(host: ReturnType<typeof fakeHost>): void {
  host.win.goatcounter = { count: (vars) => host.counted.push(vars) };
  host.scripts[0].onload();
}

const ENDPOINT = 'https://ejemplo.goatcounter.com/count';

describe('analytics', () => {
  it('names act events', () => {
    expect(actEvent(1, 'inicio')).toBe('acto-1/inicio');
    expect(actEvent(3, 'completado')).toBe('acto-3/completado');
    expect(actEvent(1, 'escuchar')).toBe('acto-1/escuchar');
  });

  it('loads count.js once with the endpoint', () => {
    const host = fakeHost();
    const a = createAnalytics({ endpoint: ENDPOINT, production: true, host });
    a.init();
    a.init();
    expect(host.scripts).toHaveLength(1);
    expect(host.scripts[0].src).toBe('https://gc.zgo.at/count.js');
    expect(host.scripts[0].endpoint).toBe(ENDPOINT);
  });

  it('queues events until count.js loads, then sends them as events', () => {
    const host = fakeHost();
    const a = createAnalytics({ endpoint: ENDPOINT, production: true, host });
    a.init();
    a.track('acto-1/inicio');
    expect(host.counted).toEqual([]);
    loadScript(host);
    a.track('acto-1/completado');
    expect(host.counted).toEqual([
      { path: 'acto-1/inicio', title: 'acto-1/inicio', event: true },
      { path: 'acto-1/completado', title: 'acto-1/completado', event: true },
    ]);
  });

  it('does nothing outside production, in debug mode, or without an endpoint', () => {
    for (const [endpoint, production, hash] of [
      [ENDPOINT, false, ''],
      [ENDPOINT, true, '#debug'],
      [ENDPOINT, true, '#w12&debug'],
      [null, true, ''],
    ] as const) {
      const host = fakeHost(hash);
      const a = createAnalytics({ endpoint, production, host });
      a.init();
      a.track('acto-1/inicio');
      expect(host.scripts).toHaveLength(0);
    }
  });

  it('never throws when there is no browser', () => {
    const a = createAnalytics({ endpoint: ENDPOINT, production: true, host: null });
    expect(() => {
      a.init();
      a.track('acto-1/inicio');
    }).not.toThrow();
  });
});
