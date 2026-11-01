import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { LiquidMetal } from '@paper-design/shaders-react';
import { useAmbient } from './useAmbient';

/**
 * WebGL extras for the home page, loaded lazily (see ./lazy.tsx) so the first paint never waits
 * on them. Each one sits over a flat colour that shows until it is ready and wherever WebGL is not.
 */

/**
 * A slow, grainy shader-gradient field (shadergradient) in three of the page's colours. It flows for
 * a few seconds, then holds; a pointer moving over it sets it flowing again.
 */
export const GradientField: React.FC<{ colors: [string, string, string]; className?: string; speed?: number }> = ({
  colors,
  className,
  speed = 0.18,
}) => {
  const { active, wake } = useAmbient(8000);
  return (
    // data-dynamic tells the hero's liquid glass to re-read this canvas every frame; only while it moves.
    <div className={className} aria-hidden data-dynamic={active ? '' : undefined} onPointerMove={wake}>
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        pixelDensity={1}
        fov={45}
        lazyLoad
        preserveDrawingBuffer
      >
        <ShaderGradient
          control="props"
          type="waterPlane"
          animate={active ? 'on' : 'off'}
          uSpeed={speed}
          uStrength={1.6}
          uDensity={1.1}
          uFrequency={5.5}
          uAmplitude={1}
          color1={colors[0]}
          color2={colors[1]}
          color3={colors[2]}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={2.4}
          cameraZoom={1}
          lightType="3d"
          brightness={1.2}
          reflection={0.1}
          grain="on"
          grainBlending={0.18}
        />
      </ShaderGradientCanvas>
    </div>
  );
};

/** The owl mark drawn as a shape for the shader to fill: only its outline and holes matter. */
const OWL_MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220"><g fill="#000">` +
      `<path d="M44 58 L34 10 L82 44 Z"/><path d="M156 58 L166 10 L118 44 Z"/>` +
      `<ellipse cx="100" cy="122" rx="82" ry="90"/></g>` +
      `<g fill="#fff"><circle cx="68" cy="88" r="26"/><circle cx="132" cy="88" r="26"/>` +
      `<path d="M88 112 L112 112 L100 132 Z"/></g></svg>`
  );

/**
 * The owl as liquid metal (Paper Design's liquid-metal shader, the React form of liquid-logo). The
 * metal ripples for a few seconds, then holds, and ripples again under the pointer.
 */
export const LiquidOwl: React.FC<{ className?: string; tint?: string }> = ({ className, tint = '#ffffff' }) => {
  const { active, wake } = useAmbient();
  return (
    <div className={className} aria-hidden onPointerMove={wake}>
      <LiquidMetal
        image={OWL_MARK}
        colorBack="#00000000"
        colorTint={tint}
        shape="none"
        repetition={2.2}
        softness={0.15}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.08}
        contour={0.45}
        angle={70}
        speed={active ? 0.6 : 0}
        scale={0.85}
        fit="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
