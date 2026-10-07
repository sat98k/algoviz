import React, { useMemo } from 'react';
import { GlossaryKey, linkGlossaryTerms } from '../../config/glossary';
import { Term } from './Term';

interface GlossaryTextProps {
  text: string;
  /** Glossary keys that may be linked in this text (first occurrence each). */
  terms?: readonly GlossaryKey[];
  /** Keys already linked elsewhere on the same panel. */
  exclude?: ReadonlySet<GlossaryKey>;
}

/** Renders plain text with the listed glossary terms turned into inline <Term>s. */
export const GlossaryText: React.FC<GlossaryTextProps> = ({ text, terms, exclude }) => {
  const segments = useMemo(() => linkGlossaryTerms(text, terms, exclude), [text, terms, exclude]);
  return (
    <>
      {segments.map((seg, i) =>
        seg.termKey ? (
          <Term key={i} termKey={seg.termKey}>
            {seg.text}
          </Term>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
};
