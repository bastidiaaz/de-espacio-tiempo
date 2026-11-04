/** Which memories are recalled and which chapter is active. No rendering, fully testable. */
export interface ProgressItem {
  id: string;
  chapter: number;
}

export class Progress {
  readonly remembered: Set<string>;
  chapter: number;
  freeRoam: boolean;
  private readonly items: readonly ProgressItem[];
  private readonly chapterCount: number;

  constructor(items: readonly ProgressItem[], chapterCount: number, saved: readonly string[] = []) {
    this.items = items;
    this.chapterCount = chapterCount;
    this.remembered = new Set(saved);
    this.chapter = this.firstIncompleteChapter();
    this.freeRoam = this.chapter >= chapterCount;
  }

  get count(): number {
    return this.remembered.size;
  }

  get isFinished(): boolean {
    return this.chapter >= this.chapterCount;
  }

  isAvailable(it: ProgressItem): boolean {
    return !this.remembered.has(it.id) && it.chapter <= this.chapter;
  }

  isChapterComplete(chapter: number): boolean {
    return !this.items.some((x) => x.chapter === chapter && !this.remembered.has(x.id));
  }

  remember(id: string): void {
    this.remembered.add(id);
  }

  /** Debug: remember exactly the chapters before `chapter` and make it the active one. */
  jumpToChapter(chapter: number): void {
    const c = Math.max(0, Math.min(this.chapterCount - 1, chapter));
    this.remembered.clear();
    for (const it of this.items) if (it.chapter < c) this.remembered.add(it.id);
    this.chapter = c;
    this.freeRoam = false;
  }

  serialize(): string {
    return JSON.stringify([...this.remembered]);
  }

  static parse(raw: string | null): string[] {
    try {
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  }

  private firstIncompleteChapter(): number {
    for (let c = 0; c < this.chapterCount; c++) if (!this.isChapterComplete(c)) return c;
    return this.chapterCount;
  }
}
