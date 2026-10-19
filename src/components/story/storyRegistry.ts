import React from 'react';
import { StorySceneProps } from './StoryStage';
import { WaterPipesScene } from './WaterPipesScene';
import { StencilScene } from './StencilScene';
import { PegboardScene } from './PegboardScene';
import { CubbyWallScene } from './CubbyWallScene';
import { HuffmanMobileScene } from './HuffmanMobileScene';
import { ChessboardScene } from './ChessboardScene';
import { TownMapScene } from './TownMapScene';

export interface StorySceneEntry {
  component: React.FC<StorySceneProps>;
  /** Shown next to the toggle while the animation is on. */
  hint: string;
}

/**
 * Beginner-friendly 🎬 Animation Mode scenes, keyed by algorithm id.
 * Algorithms listed here get a 📊 / 🎬 toggle above their (unchanged) technical view.
 * Fractional Knapsack keeps its own built-in toggle and is deliberately not listed.
 */
export const STORY_SCENES: Record<string, StorySceneEntry> = {
  'ford-fulkerson': { component: WaterPipesScene, hint: 'Water pipes: scout droplets and the narrowest pipe' },
  'edmonds-karp': { component: WaterPipesScene, hint: 'Water pipes: ripple scouts check the nearest tanks first' },
  'push-relabel': { component: WaterPipesScene, hint: 'Tanks on stilts: water only rolls downhill' },
  'naive-string-match': { component: StencilScene, hint: 'A word stencil sliding along a sentence' },
  kmp: { component: StencilScene, hint: 'A smart stencil with jump-back notes' },
  'rabin-karp': { component: StencilScene, hint: 'Fingerprints and a detective' },
  'graham-scan': { component: PegboardScene, hint: 'A rubber band hooked around pegs' },
  'jarvis-march': { component: PegboardScene, hint: 'Gift-wrapping pegs with a ribbon' },
  'knapsack-dp': { component: CubbyWallScene, hint: 'A wall of cubbies, a balance scale and a backpack' },
  huffman: { component: HuffmanMobileScene, hint: 'Marble jars tied into a hanging mobile' },
  'n-queens': { component: ChessboardScene, hint: 'Queens on a wooden chessboard' },
  'floyd-warshall': { component: TownMapScene, hint: 'Hub towns and a trip planner' },
  'bellman-ford': { component: TownMapScene, hint: 'Delivery vans and price tags' },
};
