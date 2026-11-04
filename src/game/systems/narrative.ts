export type CardKind = 'memory' | 'thought';

export interface Card {
  text: string;
  title: string;
  kind: CardKind;
}

/** Where the narrative is displayed (implemented by the UI bridge). */
export interface NarrativeView {
  showCard(card: Card): void;
  setCardProgress(shown: string, done: boolean): void;
  hideCard(): void;
  showWhisper(text: string): void;
  hideWhisper(): void;
}

const TYPE_SPEED = 42; // characters per second

/** Queue of typed-out cards (memories and thoughts) plus short whispers. */
export class Narrative {
  card: Card | null = null;
  whisperTime = 0;
  /** Runs once when the queue empties. */
  afterCards: (() => void) | null = null;
  private readonly queue: Card[] = [];
  private typed = 0;
  private cardTime = 0;
  private lastShown = '';
  private lastDone = false;
  private readonly view: NarrativeView;
  private readonly instant: boolean;

  constructor(view: NarrativeView, instant: boolean) {
    this.view = view;
    this.instant = instant;
  }

  say(text: string, title = '', kind: CardKind = 'thought'): void {
    this.queue.push({ text, title, kind });
    if (!this.card) this.next();
  }

  /** Finish typing, or move on to the next card. */
  advance(): void {
    if (!this.card) return;
    if (this.typed < this.card.text.length) this.typed = this.card.text.length;
    else this.next();
  }

  /** Drop every queued card, the pending afterCards and the whisper (debug jumps). */
  clear(): void {
    this.queue.length = 0;
    this.card = null;
    this.afterCards = null;
    this.whisperTime = 0;
    this.view.hideCard();
    this.view.hideWhisper();
  }

  update(dt: number): void {
    const card = this.card;
    if (!card) return;
    if (this.typed < card.text.length) {
      this.typed += dt * TYPE_SPEED;
      this.publish(card.text.slice(0, this.typed | 0), false);
    } else {
      this.publish(card.text, true);
      this.cardTime += dt;
      if (this.cardTime > 4 + card.text.length * 0.045) this.next();
    }
  }

  whisper(text: string, duration = 3.5): void {
    this.view.showWhisper(text);
    this.whisperTime = duration;
  }

  tickWhisper(dt: number): void {
    if (this.whisperTime > 0) {
      this.whisperTime -= dt;
      if (this.whisperTime <= 0) this.view.hideWhisper();
    }
  }

  private next(): void {
    this.card = this.queue.shift() ?? null;
    if (!this.card) {
      this.view.hideCard();
      if (this.afterCards) {
        const f = this.afterCards;
        this.afterCards = null;
        f();
      }
      return;
    }
    this.typed = this.instant ? this.card.text.length : 0;
    this.cardTime = 0;
    this.lastShown = '';
    this.lastDone = false;
    this.view.showCard(this.card);
  }

  private publish(shown: string, done: boolean): void {
    if (shown === this.lastShown && done === this.lastDone) return;
    this.lastShown = shown;
    this.lastDone = done;
    this.view.setCardProgress(shown, done);
  }
}
