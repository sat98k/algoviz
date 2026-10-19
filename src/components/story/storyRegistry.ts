import React from 'react';
import { StorySceneProps } from './StoryStage';
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
  'subset-sum': { component: CoinScaleScene, hint: 'Coins on a balance scale' },
  'graph-coloring': { component: PaintHousesScene, hint: 'Painting houses so neighbours differ' },
  'knapsack-bb': { component: TreasureCaveScene, hint: 'Treasure caves, crystal balls and rope barriers' },
  'job-selection-bb': { component: TreasureCaveScene, hint: 'Treasure caves, crystal balls and rope barriers' },
  'max-subarray': { component: CoinRoadScene, hint: 'A road of coins and thieves' },
  karatsuba: { component: HelpersWorkshopScene, hint: 'Three helpers instead of four' },
  lcs: { component: BeadNecklaceScene, hint: 'Two bead necklaces' },
  'matrix-chain-multiplication': { component: GiftWrapScene, hint: 'Gluing wooden panels in the cheapest order' },
  'assembly-line-scheduling': { component: CarFactoryScene, hint: 'A car factory with two belts' },
  tsp: { component: PostmanScene, hint: 'A postman with a stamp card and notebook' },
  'suffix-tree': { component: WordTreeScene, hint: 'A word tree with apples and an ant' },
  'line-segment-intersection': { component: SweepCurtainScene, hint: 'Sticks on a table and a sliding curtain' },
  'randomized-quicksort': { component: HeightLineupScene, hint: 'Kids lining up by height' },
  'hiring-problem': { component: InterviewRoomScene, hint: 'An interview room with two coin jars' },
  'karger-min-cut': { component: ClayBlobsScene, hint: 'Squishing balls of clay tied with ropes' },
  'vertex-cover-approx': { component: StreetCamerasScene, hint: 'Security cameras at street corners' },
  'set-cover': { component: RadioTowersScene, hint: 'Radio towers lighting up houses' },
  'tsp-approx': { component: RopeNetworkScene, hint: 'A rope network walked around like a hedge' },
};
