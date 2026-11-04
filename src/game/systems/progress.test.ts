import { describe, expect, it } from 'vitest';
import { CHAPTERS, MEMORIES } from '../../content/story';
import { Progress } from './progress';

describe('Progress', () => {
  it('starts at chapter 0 with nothing remembered', () => {
    const p = new Progress(MEMORIES, CHAPTERS.length);
    expect(p.chapter).toBe(0);
    expect(p.freeRoam).toBe(false);
    expect(p.isAvailable(MEMORIES[0])).toBe(true);
    expect(p.isAvailable(MEMORIES.find((m) => m.chapter === 1)!)).toBe(false);
  });

  it('resumes at the first incomplete chapter', () => {
    const p = new Progress(MEMORIES, CHAPTERS.length, ['fire', 'helmet', 'thermos', 'photo']);
    expect(p.chapter).toBe(1);
    expect(p.isChapterComplete(0)).toBe(true);
    expect(p.isChapterComplete(1)).toBe(false);
  });

  it('is finished and free-roaming when everything is remembered', () => {
    const p = new Progress(
      MEMORIES,
      CHAPTERS.length,
      MEMORIES.map((m) => m.id),
    );
    expect(p.isFinished).toBe(true);
    expect(p.freeRoam).toBe(true);
  });

  it('jumps to a chapter with exactly the earlier chapters remembered', () => {
    const p = new Progress(MEMORIES, CHAPTERS.length, ['fire', 'patch', 'ship']);
    p.jumpToChapter(2);
    expect(p.chapter).toBe(2);
    expect(p.freeRoam).toBe(false);
    expect([...p.remembered].sort()).toEqual(
      MEMORIES.filter((m) => m.chapter < 2)
        .map((m) => m.id)
        .sort(),
    );
    p.jumpToChapter(0);
    expect(p.count).toBe(0);
    p.jumpToChapter(99);
    expect(p.chapter).toBe(CHAPTERS.length - 1);
    expect(p.isFinished).toBe(false);
  });

  it('round-trips through storage and tolerates garbage', () => {
    const p = new Progress(MEMORIES, CHAPTERS.length, ['fire']);
    expect(Progress.parse(p.serialize())).toEqual(['fire']);
    expect(Progress.parse('{oops')).toEqual([]);
    expect(Progress.parse(null)).toEqual([]);
  });
});

describe('story content', () => {
  it('every chapter has at least one memory, ids are unique', () => {
    CHAPTERS.forEach((_, c) => expect(MEMORIES.some((m) => m.chapter === c)).toBe(true));
    expect(new Set(MEMORIES.map((m) => m.id)).size).toBe(MEMORIES.length);
  });
});
