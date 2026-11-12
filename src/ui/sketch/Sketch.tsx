import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { BoilLevel } from './boil';

/**
 * Hand-drawn building blocks of the sketch UI (ART-01). Styles: `styles/sketch.css`.
 * The page must render `<BoilFilters />` once for the line to boil.
 */

type Boil = BoilLevel | 'none';
const boilClass = (boil: Boil): string => (boil === 'none' ? '' : ` sk-${boil}`);

/**
 * Three hands for the same rectangle, so neighbours don't look stamped. Four separate strokes that
 * overshoot the corners, as in the tower of the cover, plus a partial second pass over one side.
 * Drawn in a 100×100 box that stretches to the parent; strokes keep their width (non-scaling).
 */
const OUTLINES: readonly { sides: readonly string[]; retrace: string; fill: string }[] = [
  {
    sides: [
      'M-1.2 1.4C28 -0.4 71 1.6 101 0.2',
      'M99.7 -3C100.7 31 99.1 68 100.4 103',
      'M101.4 99C69 100.9 33 98.7 -0.8 100.5',
      'M0.5 103C-0.6 72 0.9 29 0 -2.5',
    ],
    retrace: 'M36 101.2C58 99.4 81 101.6 100.8 99.8',
    fill: 'M0.2 1 100.2 0.6 100.1 99.4 0.1 100.2Z',
  },
  {
    sides: [
      'M-0.6 0.3C33 1.8 64 -0.5 101.3 1.1',
      'M100.3 -2.2C99.2 27 100.8 73 99.6 102.4',
      'M100.9 100.6C72 98.9 29 101 -1.3 99.3',
      'M-0.2 102C0.9 66 -0.7 35 0.4 -3',
    ],
    retrace: 'M-0.9 2C24 0.2 44 2.2 61 0.7',
    fill: 'M0.1 0.7 100 0.9 99.9 100 0 99.8Z',
  },
  {
    sides: [
      'M-1.5 0.8C24 1.9 76 -0.3 100.6 0.9',
      'M100.1 -2.6C100.9 38 99.3 61 99.9 103',
      'M101 99.6C61 101.3 38 98.8 -1 100.1',
      'M0.2 102.6C0.8 59 -0.6 41 0.3 -2',
    ],
    retrace: 'M99.2 44C100.6 62 99.4 84 100.5 102',
    fill: 'M0.2 0.8 100.1 0.8 100 99.8 0.1 100Z',
  },
];

export type SketchVariant = 0 | 1 | 2;

interface StrokeProps {
  variant?: SketchVariant;
  /** `ink`: solid, in the line colour. `panel`: the translucent black that sits over the 3D world. */
  fill?: 'none' | 'ink' | 'panel';
  boil?: Boil;
}

/** The outline layer. Put it first inside a `position: relative; isolation: isolate` parent. */
export function SketchStroke({ variant = 0, fill = 'none', boil = 'boil' }: StrokeProps) {
  const outline = OUTLINES[variant];
  return (
    <svg
      className={`sk-stroke${boilClass(boil)}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {fill !== 'none' && <path className={`sk-stroke__fill sk-stroke__fill--${fill}`} d={outline.fill} />}
      {outline.sides.map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
      <path className="sk-stroke__retrace" d={outline.retrace} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SketchVariant;
  boil?: Boil;
  children?: ReactNode;
}

/** A framed surface: cards, dialogs, notes. */
export function SketchPanel({ variant, boil, className = '', children, ...rest }: PanelProps) {
  return (
    <div className={`sk-panel ${className}`.trimEnd()} {...rest}>
      <SketchStroke variant={variant} fill="panel" boil={boil} />
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `solid`: the one main action. `outline`: any other action. `bare`: a word with an underline. */
  tone?: 'solid' | 'outline' | 'bare';
  block?: boolean;
  variant?: SketchVariant;
  boil?: Boil;
}

export function SketchButton({
  tone = 'outline',
  block = false,
  variant = 1,
  boil,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = `sk-button sk-button--${tone}${block ? ' sk-button--block' : ''} ${className}`.trimEnd();
  return (
    <button className={classes} type={type} {...rest}>
      {tone === 'bare' ? (
        <SketchRule boil={boil} />
      ) : (
        <SketchStroke variant={variant} fill={tone === 'solid' ? 'ink' : 'none'} boil={boil} />
      )}
      {children}
    </button>
  );
}

/** The cross-shaped star of the cover: a long stroke and a short one across it. Size: `--star`. */
export function SketchStar({ boil = 'boil-soft', className = '' }: { boil?: Boil; className?: string }) {
  return (
    <svg
      className={`sk-star${boilClass(boil)} ${className}`.trimEnd()}
      viewBox="0 0 20 40"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.4 1C9.4 13 11 26 9.7 39" vectorEffect="non-scaling-stroke" />
      <path d="M2.4 23.6C7.6 21.5 13 22.9 17.8 20.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A hand-drawn underline, like the one under the title of the cover. */
export function SketchRule({ boil = 'boil', className = '' }: { boil?: Boil; className?: string }) {
  return (
    <svg
      className={`sk-rule${boilClass(boil)} ${className}`.trimEnd()}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0.5 5.8C21 3.4 52 7 99.5 3.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
