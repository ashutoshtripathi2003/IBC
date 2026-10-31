/** Motion vocabulary shared by every animated component (mirrors tokens.css). */
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const durations = { fast: 0.16, base: 0.32, slow: 0.72, reveal: 1.1 } as const;

/** Stagger for sequenced reveals (lines of a headline, steps of a journey). */
export const stagger = (index: number, step = 0.08, delay = 0) => delay + index * step;

export const springs = {
  /** Magnetic buttons and the cursor: responsive, slightly soft. */
  soft: { type: 'spring', stiffness: 260, damping: 26, mass: 0.6 },
  /** Menus and panels. */
  panel: { type: 'spring', stiffness: 320, damping: 34 },
} as const;
