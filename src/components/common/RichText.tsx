import React from 'react';
import { GlossaryKey, linkGlossaryTerms } from '../../config/glossary';
import { Term } from './Term';

/**
 * Light inline markup for teaching text:
 *   `x ≤ W`   → condition / formula chip
 *   **take**  → bold action
 *   ✓ / ✗     → success / mismatch colour (the symbol stays, so colour is never alone)
 * Plain parts get glossary links (first occurrence across everything sharing `used`).
 */
export type RichToken =
  | { kind: 'text'; text: string; termKey?: GlossaryKey }
  | { kind: 'code'; text: string }
  | { kind: 'bold'; text: string; termKey?: GlossaryKey }
  | { kind: 'mark'; text: '✓' | '✗' };

const MARKUP = /(`[^`]+`|\*\*[^*]+\*\*|✓|✗)/g;

/** Split `text` into rich tokens. Glossary keys linked here are added to `used`. */
export const richTokens = (text: string, terms?: readonly GlossaryKey[], used: Set<GlossaryKey> = new Set()): RichToken[] => {
  const out: RichToken[] = [];
  for (const part of text.split(MARKUP)) {
    if (!part) continue;
    if (part === '✓' || part === '✗') out.push({ kind: 'mark', text: part });
    else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) out.push({ kind: 'code', text: part.slice(1, -1) });
    else if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      for (const seg of linkGlossaryTerms(part.slice(2, -2), terms, used)) {
        if (seg.termKey) used.add(seg.termKey);
        out.push({ kind: 'bold', text: seg.text, termKey: seg.termKey });
      }
    else
      for (const seg of linkGlossaryTerms(part, terms, used)) {
        if (seg.termKey) used.add(seg.termKey);
        out.push({ kind: 'text', text: seg.text, termKey: seg.termKey });
      }
  }
  return out;
};

/** Plain text with the markup removed (for comparisons and accessible names). */
export const plainText = (text: string) => text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');

export const RichTokens: React.FC<{ tokens: RichToken[] }> = ({ tokens }) => (
  <>
    {tokens.map((t, i) => {
      switch (t.kind) {
        case 'code':
          return (
            <code key={i} className="mx-px px-1 py-px font-mono text-[0.92em] bg-sem-formula/10 text-sem-formula-ink border border-sem-formula/25 [overflow-wrap:anywhere] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              {t.text}
            </code>
          );
        case 'bold':
          return (
            <strong key={i} className="font-semibold text-chalk-100">
              {t.termKey ? <Term termKey={t.termKey}>{t.text}</Term> : t.text}
            </strong>
          );
        case 'mark':
          return (
            <span key={i} className={`font-bold ${t.text === '✓' ? 'text-sem-match-ink' : 'text-sem-mismatch-ink'}`}>
              {t.text}
            </span>
          );
        default:
          return t.termKey ? (
            <Term key={i} termKey={t.termKey}>
              {t.text}
            </Term>
          ) : (
            <React.Fragment key={i}>{t.text}</React.Fragment>
          );
      }
    })}
  </>
);

export const RichText: React.FC<{ text: string; terms?: readonly GlossaryKey[] }> = ({ text, terms }) => (
  <RichTokens tokens={richTokens(text, terms)} />
);
