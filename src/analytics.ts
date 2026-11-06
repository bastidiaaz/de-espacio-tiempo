/**
 * Cookieless analytics with GoatCounter (ENG-05, D3). Three anonymous events per act: `acto-N/inicio`
 * (the act is opened from the act select), `acto-N/completado` (first completion in this browser) and
 * `acto-N/escuchar` (click on the ffm.to invitation). count.js also records one pageview per visit.
 * No cookies and no personal data, so no consent banner is needed.
 *
 * Only runs in production builds, never with `#debug` in the URL. Never throws: analytics must not
 * break the game (blocked by an ad blocker, offline, Node tests).
 */

/** GoatCounter site endpoint (https://<code>.goatcounter.com/count). `null` turns analytics off. */
export const GOATCOUNTER_ENDPOINT: string | null = 'https://tiann-play.goatcounter.com/count';

const SCRIPT_SRC = 'https://gc.zgo.at/count.js';

export type ActEventKind = 'inicio' | 'completado' | 'escuchar';

export function actEvent(act: number, kind: ActEventKind): string {
  return `acto-${act}/${kind}`;
}

interface GoatCounter {
  count?: (vars: { path: string; title: string; event: true }) => void;
}

/** The slice of the browser analytics touches; injectable for tests. */
export interface AnalyticsHost {
  hash: string;
  win: { goatcounter?: GoatCounter };
  /** Appends an async `<script src data-goatcounter=endpoint>` that calls `onload` once loaded. */
  appendScript(src: string, endpoint: string, onload: () => void): void;
}

export interface Analytics {
  /** Loads count.js (once). */
  init(): void;
  track(event: string): void;
}

export function createAnalytics(opts: {
  endpoint: string | null;
  production: boolean;
  host: AnalyticsHost | null;
}): Analytics {
  const { endpoint, production, host } = opts;
  const enabled = !!(endpoint && production && host && !/(^#|&)debug(&|$)/.test(host.hash));
  const queue: string[] = [];
  let started = false;

  const send = (event: string): boolean => {
    const count = host?.win.goatcounter?.count;
    if (!count) return false;
    try {
      count({ path: event, title: event, event: true });
    } catch {
      /* count.js failed: drop the event */
    }
    return true;
  };

  const flush = (): void => {
    while (queue.length && send(queue[0])) queue.shift();
  };

  return {
    init() {
      if (!enabled || started || !host || !endpoint) return;
      started = true;
      try {
        host.appendScript(SCRIPT_SRC, endpoint, flush);
      } catch {
        /* no DOM */
      }
    },
    track(event) {
      if (!enabled) return;
      queue.push(event);
      flush();
    },
  };
}

function browserHost(): AnalyticsHost | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return {
    hash: location.hash,
    win: window as AnalyticsHost['win'],
    appendScript(src, endpoint, onload) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.goatcounter = endpoint;
      script.addEventListener('load', onload);
      script.src = src;
      document.head.appendChild(script);
    },
  };
}

export const analytics = createAnalytics({
  endpoint: GOATCOUNTER_ENDPOINT,
  production: import.meta.env.PROD,
  host: browserHost(),
});

export const track = (event: string): void => analytics.track(event);
