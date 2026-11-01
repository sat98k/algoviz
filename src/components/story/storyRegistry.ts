import React from 'react';
import { StorySceneProps } from './StoryStage';
import { STORY_HINTS } from './storyHints';
import { WaterPipesScene } from './WaterPipesScene';
import { StencilScene } from './StencilScene';
import { PegboardScene } from './PegboardScene';
import { CubbyWallScene } from './CubbyWallScene';
import { HuffmanMobileScene } from './HuffmanMobileScene';
import { ChessboardScene } from './ChessboardScene';
import { TownMapScene } from './TownMapScene';
import { CoinScaleScene } from './CoinScaleScene';
import { PaintHousesScene } from './PaintHousesScene';
import { TreasureCaveScene } from './TreasureCaveScene';
import { CoinRoadScene } from './CoinRoadScene';
import { HelpersWorkshopScene } from './HelpersWorkshopScene';
import { BeadNecklaceScene } from './BeadNecklaceScene';
import { GiftWrapScene } from './GiftWrapScene';
import { CarFactoryScene } from './CarFactoryScene';
import { PostmanScene } from './PostmanScene';
import { WordTreeScene } from './WordTreeScene';
import { SweepCurtainScene } from './SweepCurtainScene';
import { HeightLineupScene } from './HeightLineupScene';
import { InterviewRoomScene } from './InterviewRoomScene';
import { ClayBlobsScene } from './ClayBlobsScene';
import { StreetCamerasScene } from './StreetCamerasScene';
import { RadioTowersScene } from './RadioTowersScene';
import { RopeNetworkScene } from './RopeNetworkScene';

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
  'ford-fulkerson': { component: WaterPipesScene, hint: STORY_HINTS['ford-fulkerson'] },
  'edmonds-karp': { component: WaterPipesScene, hint: STORY_HINTS['edmonds-karp'] },
  'push-relabel': { component: WaterPipesScene, hint: STORY_HINTS['push-relabel'] },
  'naive-string-match': { component: StencilScene, hint: STORY_HINTS['naive-string-match'] },
  kmp: { component: StencilScene, hint: STORY_HINTS['kmp'] },
  'rabin-karp': { component: StencilScene, hint: STORY_HINTS['rabin-karp'] },
  'graham-scan': { component: PegboardScene, hint: STORY_HINTS['graham-scan'] },
  'jarvis-march': { component: PegboardScene, hint: STORY_HINTS['jarvis-march'] },
  'knapsack-dp': { component: CubbyWallScene, hint: STORY_HINTS['knapsack-dp'] },
  huffman: { component: HuffmanMobileScene, hint: STORY_HINTS['huffman'] },
  'n-queens': { component: ChessboardScene, hint: STORY_HINTS['n-queens'] },
  'floyd-warshall': { component: TownMapScene, hint: STORY_HINTS['floyd-warshall'] },
  'bellman-ford': { component: TownMapScene, hint: STORY_HINTS['bellman-ford'] },
  'subset-sum': { component: CoinScaleScene, hint: STORY_HINTS['subset-sum'] },
  'graph-coloring': { component: PaintHousesScene, hint: STORY_HINTS['graph-coloring'] },
  'knapsack-bb': { component: TreasureCaveScene, hint: STORY_HINTS['knapsack-bb'] },
  'job-selection-bb': { component: TreasureCaveScene, hint: STORY_HINTS['job-selection-bb'] },
  'max-subarray': { component: CoinRoadScene, hint: STORY_HINTS['max-subarray'] },
  karatsuba: { component: HelpersWorkshopScene, hint: STORY_HINTS['karatsuba'] },
  lcs: { component: BeadNecklaceScene, hint: STORY_HINTS['lcs'] },
  'matrix-chain-multiplication': { component: GiftWrapScene, hint: STORY_HINTS['matrix-chain-multiplication'] },
  'assembly-line-scheduling': { component: CarFactoryScene, hint: STORY_HINTS['assembly-line-scheduling'] },
  tsp: { component: PostmanScene, hint: STORY_HINTS['tsp'] },
  'suffix-tree': { component: WordTreeScene, hint: STORY_HINTS['suffix-tree'] },
  'line-segment-intersection': { component: SweepCurtainScene, hint: STORY_HINTS['line-segment-intersection'] },
  'randomized-quicksort': { component: HeightLineupScene, hint: STORY_HINTS['randomized-quicksort'] },
  'hiring-problem': { component: InterviewRoomScene, hint: STORY_HINTS['hiring-problem'] },
  'karger-min-cut': { component: ClayBlobsScene, hint: STORY_HINTS['karger-min-cut'] },
  'vertex-cover-approx': { component: StreetCamerasScene, hint: STORY_HINTS['vertex-cover-approx'] },
  'set-cover': { component: RadioTowersScene, hint: STORY_HINTS['set-cover'] },
  'tsp-approx': { component: RopeNetworkScene, hint: STORY_HINTS['tsp-approx'] },
};
