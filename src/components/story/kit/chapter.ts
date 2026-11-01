import { createContext, useContext } from 'react';
import { FIELDS, Field } from '../../../styles/fields';

/**
 * The colour chapter of the algorithm on stage (its module's field, as on the home page and the
 * module page). VisualizerStage provides it; scenes use it for their floor and accents, so a
 * scene from Module 6 stands on coral like Module 6's chapter.
 */
export const ChapterContext = createContext<Field>(FIELDS.coral);
export const useChapter = () => useContext(ChapterContext);
