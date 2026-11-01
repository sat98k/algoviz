import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

/**
 * GSAP for the story scenes, registered once. Every plugin here ships in the public `gsap`
 * package (free since GSAP 3.13).
 *
 * The scene eases, named so every scene moves with the same feel:
 * - `story.out`: things arriving or settling (strong ease-out, matches --ease-out).
 * - `story.move`: things travelling from one place to another (matches --ease-move).
 * - `story.land`: a small overshoot for things that drop into place (a crown, a medal).
 */
gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, MotionPathPlugin);

CustomEase.create('story.out', '0.23, 1, 0.32, 1');
CustomEase.create('story.move', '0.77, 0, 0.175, 1');
CustomEase.create('story.land', 'M0,0 C0.2,0 0.3,1.18 0.55,1.08 0.72,1.01 0.84,1 1,1');

export { gsap, useGSAP };
