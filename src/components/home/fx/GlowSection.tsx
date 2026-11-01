import React, { useRef } from 'react';
import { FIELDS, type FieldName } from '../../../styles/fields';
import { FieldCanvas, type FieldPalette } from './FieldCanvas';

/** The page's own paper (#e6e0d2), behind the home sections that are not colour chapters. */
type GlowName = FieldName | 'paper';

/**
 * Each field's blobs and particles. Blob colours are lighter or neighbouring shades of the field,
 * so its ink and soft text keep at least the contrast they have on the flat colour (lowest: soft
 * on the yellow field's orange, 5.28:1; the paper's inactive story labels, large text, 3.63:1).
 * Particles are light motes on the bright fields, embers on ink and gold dust on paper and bone.
 * Module-level constants, so the canvas never restarts on a re-render.
 */
const PALETTES: Record<GlowName, FieldPalette> = {
  coral: { blobs: ['#f6806b', '#f58a3c'], particle: '#ffe4cc', particleAlpha: 0.6 },
  ink: { blobs: ['#3a2422', '#2e2a1c'], particle: '#f5a623', particleAlpha: 0.55 },
  green: { blobs: ['#6fd27a', '#9ccf3a'], particle: '#efffd0', particleAlpha: 0.55 },
  yellow: { blobs: ['#f8d75c', '#f5a623'], particle: '#fff7d1', particleAlpha: 0.7 },
  bone: { blobs: ['#ebe6da', '#e8d49a'], particle: '#b8860b', particleAlpha: 0.32 },
  paper: { blobs: ['#f6f1e6', '#ecd49a', '#f0cdbd'], particle: '#c08a10', particleAlpha: 0.45 },
};

/** Field names by background colour, for callers that hold a field object rather than its name. */
const NAME_BY_BG: Record<string, GlowName> = {
  ...Object.fromEntries((Object.keys(FIELDS) as FieldName[]).map((name) => [FIELDS[name].bg.toLowerCase(), name])),
  '#e6e0d2': 'paper',
};

type Props = {
  /** The field by name ('paper' for the page's own colour), or by its background colour. */
  field: GlowName | string;
  /** The element to render: a tag name, or a motion component such as motion.header. */
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
} & Record<string, unknown>;

/**
 * A colour field with a drifting gradient and particles under its content (see FieldCanvas):
 * scroll-driven, still when the page is still. Used for the home chapters and paper sections, the
 * footer, and the colour headers of the module, algorithm and comparison pages, so every page
 * shares the home's feel.
 */
export const GlowSection: React.FC<Props> = ({ field, as: Tag = 'section', className, children, ...rest }) => {
  const ref = useRef<HTMLElement>(null);
  const name: GlowName | undefined = field in PALETTES ? (field as GlowName) : NAME_BY_BG[field.toLowerCase()];
  if (!name) {
    // An unknown colour: render the element plain rather than guess at shades.
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag ref={ref} {...rest} className={`${className ?? ''} hc-glow-host`}>
      <div className={`hc-glow${name === 'ink' ? ' is-dark' : ''}`} aria-hidden>
        <FieldCanvas palette={PALETTES[name]} hostRef={ref} />
      </div>
      {children}
    </Tag>
  );
};
