const media = (q: string): boolean => typeof matchMedia !== 'undefined' && matchMedia(q).matches;

export const isCoarsePointer = media('(pointer: coarse)');
export const prefersReducedMotion = media('(prefers-reduced-motion: reduce)');

/** localStorage that never throws (private mode, sandboxed iframes, tests). */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* unavailable */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* unavailable */
    }
  },
};
