import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from '../game/platform';
import { createShellStore } from './shellStore';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    map,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

describe('shell store analytics (ENG-05)', () => {
  it('tracks every act start and only the first completion of each act', () => {
    const events: string[] = [];
    const store = createShellStore(memoryStorage({ 'lvr-acts-done': '[2]' }), () => {}, (e) => events.push(e));
    store.getState().startAct(1);
    store.getState().restartAct();
    store.getState().markCompleted(1);
    store.getState().markCompleted(1);
    store.getState().markCompleted(2);
    expect(events).toEqual(['acto-1/inicio', 'acto-1/completado']);
  });
});

describe('shell store', () => {
  it('starts on the menu with sound and retro on', () => {
    const s = createShellStore(memoryStorage()).getState();
    expect(s.screen).toBe('menu');
    expect(s.actNumber).toBeNull();
    expect(s.sound).toBe(true);
    expect(s.retro).toBe(true);
    expect(s.actsDone).toEqual([]);
    expect(s.optionsOpen).toBe(false);
    expect(s.loadError).toBe(false);
  });

  it('reads saved settings', () => {
    const s = createShellStore(memoryStorage({ 'lvr-sound': '0', 'lvr-retro': '0' })).getState();
    expect(s.sound).toBe(false);
    expect(s.retro).toBe(false);
  });

  it('persists toggles', () => {
    const storage = memoryStorage();
    const store = createShellStore(storage);
    store.getState().toggleSound();
    expect(store.getState().sound).toBe(false);
    expect(storage.map.get('lvr-sound')).toBe('0');
    store.getState().toggleSound();
    expect(storage.map.get('lvr-sound')).toBe('1');
    store.getState().toggleRetro();
    expect(store.getState().retro).toBe(false);
    expect(storage.map.get('lvr-retro')).toBe('0');
    store.getState().toggleRetro();
    expect(storage.map.get('lvr-retro')).toBe('1');
  });

  it('marks acts done once, sorted', () => {
    const storage = memoryStorage();
    const store = createShellStore(storage);
    store.getState().markCompleted(3);
    store.getState().markCompleted(1);
    store.getState().markCompleted(1);
    expect(store.getState().actsDone).toEqual([1, 3]);
    expect(storage.map.get('lvr-acts-done')).toBe('[1,3]');
  });

  it('ignores a corrupt acts-done value', () => {
    const read = (raw: string) => createShellStore(memoryStorage({ 'lvr-acts-done': raw })).getState().actsDone;
    expect(read('nope')).toEqual([]);
    expect(read('{"a":1}')).toEqual([]);
    expect(read('[1,"x",9]')).toEqual([1]);
  });

  it('navigates menu → select → act', () => {
    const store = createShellStore(memoryStorage());
    store.getState().openSelect();
    expect(store.getState().screen).toBe('select');
    store.getState().startAct(1);
    const s = store.getState();
    expect(s.screen).toBe('act');
    expect(s.actNumber).toBe(1);
    expect(s.optionsOpen).toBe(false);
    expect(s.loadError).toBe(false);
  });

  it('escape depends on the screen', () => {
    const store = createShellStore(memoryStorage());
    store.getState().escape();
    expect(store.getState().screen).toBe('menu');
    store.getState().openSelect();
    store.getState().escape();
    expect(store.getState().screen).toBe('menu');
    store.getState().startAct(1);
    store.getState().escape();
    expect(store.getState().optionsOpen).toBe(true);
    store.getState().escape();
    expect(store.getState().optionsOpen).toBe(false);
    expect(store.getState().screen).toBe('act');
  });

  it('exits to the menu', () => {
    const store = createShellStore(memoryStorage());
    store.getState().startAct(1);
    store.getState().setOptionsOpen(true);
    store.getState().exitToMenu();
    const s = store.getState();
    expect(s.screen).toBe('menu');
    expect(s.actNumber).toBeNull();
    expect(s.optionsOpen).toBe(false);
  });

  it('restarts the act', () => {
    const store = createShellStore(memoryStorage());
    store.getState().startAct(1);
    store.getState().setOptionsOpen(true);
    const before = store.getState().mountKey;
    store.getState().restartAct();
    const s = store.getState();
    expect(s.mountKey).toBe(before + 1);
    expect(s.optionsOpen).toBe(false);
    expect(s.screen).toBe('act');
    expect(s.actNumber).toBe(1);
  });

  it('returns to select after a failed load', () => {
    const store = createShellStore(memoryStorage(), () => {});
    store.getState().startAct(1);
    store.getState().loadFailed();
    const s = store.getState();
    expect(s.screen).toBe('select');
    expect(s.actNumber).toBeNull();
    expect(s.loadError).toBe(true);
  });

  it('reloads the page instead of retrying in place after a failed load', () => {
    // A failed chunk stays failed in this page (cached import / preload); only a reload really retries.
    let reloads = 0;
    const store = createShellStore(memoryStorage(), () => reloads++);
    store.getState().startAct(1);
    expect(reloads).toBe(0);
    store.getState().loadFailed();
    store.getState().startAct(1);
    expect(reloads).toBe(1);
    expect(store.getState().screen).toBe('select');
  });

  it('defaults the accessibility options to the original feel (ENG-09)', () => {
    const s = createShellStore(memoryStorage()).getState();
    expect(s.lookSensitivity).toBe(1);
    expect(s.textScale).toBe(1);
  });

  it('reads saved accessibility options and ignores invalid ones', () => {
    const read = (look: string, text: string) => {
      const s = createShellStore(memoryStorage({ 'lvr-look': look, 'lvr-text': text })).getState();
      return [s.lookSensitivity, s.textScale];
    };
    expect(read('1.5', '1.25')).toEqual([1.5, 1.25]);
    expect(read('7', 'big')).toEqual([1, 1]);
    expect(read('', '0')).toEqual([1, 1]);
  });

  it('persists accessibility options, snapped to a level', () => {
    const storage = memoryStorage();
    const store = createShellStore(storage);
    store.getState().setLookSensitivity(2);
    store.getState().setTextScale(1.5);
    expect(store.getState().lookSensitivity).toBe(2);
    expect(store.getState().textScale).toBe(1.5);
    expect(storage.map.get('lvr-look')).toBe('2');
    expect(storage.map.get('lvr-text')).toBe('1.5');
    store.getState().setLookSensitivity(0.6);
    expect(store.getState().lookSensitivity).toBe(0.5);
    expect(storage.map.get('lvr-look')).toBe('0.5');
  });
});
