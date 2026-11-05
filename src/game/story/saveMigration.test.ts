import { describe, expect, it } from 'vitest';
import { CHAPTERS, MEMORIES } from '../../content/story';
import { Progress } from '../systems/progress';
import { migrateSave } from './saveMigration';

describe('migrateSave', () => {
  it('adds the campfire memory to saves that already finished the act', () => {
    expect(migrateSave(['fire', 'ship', 'star'])).toEqual(['fire', 'ship', 'star', 'campfire']);
  });

  it('leaves unfinished and already-migrated saves alone', () => {
    expect(migrateSave(['fire', 'ship'])).toEqual(['fire', 'ship']);
    expect(migrateSave(['ship', 'campfire', 'star'])).toEqual(['ship', 'campfire', 'star']);
    expect(migrateSave([])).toEqual([]);
  });

  it('keeps an old finished save finished', () => {
    const old = MEMORIES.filter((m) => m.id !== 'campfire').map((m) => m.id);
    const p = new Progress(MEMORIES, CHAPTERS.length, migrateSave(old));
    expect(p.freeRoam).toBe(true);
  });
});
