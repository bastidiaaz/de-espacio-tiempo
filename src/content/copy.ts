/** Interface copy (not story). */
export const COPY = {
  title: 'Lumen Vale',
  intro: {
    fresh: 'You wake beside a small fire. You don’t remember lighting it.',
    resumed: 'You doze off by the fire. Some of it comes back when you wake.',
    complete: 'You remember everything now. The others land at dawn.',
    how: (coarse: boolean) =>
      (coarse ? 'Drag on the left to walk and on the right to look.' : 'Walk with WASD, drag to look around.') +
      ' To remember something, stand still and hold your gaze on it.',
    start: 'Wake up',
  },
  hud: {
    countNone: 'Nothing remembered yet',
    count: (n: number, total: number) => `${n} of ${total} remembered`,
    journal: 'Journal',
    sound: 'Sound',
    pixels: 'Pixels',
  },
  card: {
    next: (coarse: boolean) => (coarse ? 'Tap to continue' : 'Click or press E to continue'),
    label: 'Continue',
  },
  journal: {
    title: 'What I remember',
    unknown: 'Something I haven’t remembered yet.',
    back: 'Back to the valley',
    restart: 'Forget everything and begin again',
  },
  ending: {
    title: 'You remembered',
    body: 'Mara Ilves kept the fire going until the sky turned gold. The Long Morning landed in the valley just after sunrise, and Nell named the first garden after the fire.',
    wander: 'Keep wandering',
    restart: 'Begin again',
  },
  canvasLabel: 'A quiet alien valley at night, lit by a campfire',
} as const;
