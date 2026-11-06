import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from './config';

describe('STORAGE_KEYS', () => {
  it('keeps the legacy storage keys', () => {
    expect(STORAGE_KEYS.seed).toBe('lvr-seed');
    expect(STORAGE_KEYS.retro).toBe('lvr-retro');
    expect(STORAGE_KEYS.sound).toBe('lvr-sound');
    expect(STORAGE_KEYS.memory(12345)).toBe('lvr-mem-12345');
    expect(STORAGE_KEYS.hidden(12345)).toBe('lvr-a1-hidden-12345');
    expect(STORAGE_KEYS.actsDone).toBe('lvr-acts-done');
    expect(STORAGE_KEYS.lookSensitivity).toBe('lvr-look');
    expect(STORAGE_KEYS.textScale).toBe('lvr-text');
  });
});
