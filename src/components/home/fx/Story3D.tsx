import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAmbient } from './useAmbient';

/**
 * The story objects as real 3D models (react-three-fiber): the cheese wheel with a wedge cut out,
 * a chess queen and a peg. Drawn on a transparent canvas so they sit on the page itself.
 */

const RIND = '#e9a514';
const PASTE = '#fcd34d';

/** A cheese wheel with one sixth sliced away, its holes showing on the top and the cut faces. */
const CheeseWheel: React.FC<{ spin?: number }> = ({ spin = 0.35 }) => {
  const group = useRef<THREE.Group>(null);
  const cut = (Math.PI * 2) / 6;
  const h = 0.6;
  const geo = useMemo(() => {
    const side = new THREE.CylinderGeometry(1, 1, h, 96, 1, true, cut, Math.PI * 2 - cut);
    // Circle angles run the other way round from the cylinder's, so each cap gets its own start.
    const top = new THREE.CircleGeometry(1, 96, cut - Math.PI / 2, Math.PI * 2 - cut);
    const bottom = new THREE.CircleGeometry(1, 96, Math.PI / 2, Math.PI * 2 - cut);
    const face = new THREE.PlaneGeometry(1, h);
    return { side, top, bottom, face };
  }, [cut]);

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * spin;
    // Lean a little toward the pointer.
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.45 + state.pointer.y * -0.25, 0.05);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, state.pointer.x * -0.2, 0.05);
  });

  const holes = [
    [0.45, -0.15, 0.11],
    [-0.4, 0.35, 0.08],
    [-0.15, -0.5, 0.13],
    [-0.6, -0.1, 0.07],
  ];

  return (
    <group ref={group} rotation={[0.45, 0, 0]}>
      <mesh geometry={geo.side}>
        <meshStandardMaterial color={RIND} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.top} position={[0, h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={PASTE} roughness={0.7} />
      </mesh>
      <mesh geometry={geo.bottom} position={[0, -h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={RIND} roughness={0.7} />
      </mesh>
      {/* the two faces left by the knife */}
      {[cut, Math.PI * 2].map((a, k) => (
        <mesh key={k} geometry={geo.face} position={[Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5]} rotation={[0, a - Math.PI / 2, 0]}>
          <meshStandardMaterial color={PASTE} roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {holes.map(([x, z, r], k) => (
        <mesh key={k} position={[x, h / 2 + 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 32]} />
          <meshStandardMaterial color={RIND} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

/** A chess queen turned on a lathe. */
const Queen: React.FC<{ color?: string }> = ({ color = '#2b2116' }) => {
  const geo = useMemo(() => {
    const profile = [
      [0, 0],
      [0.55, 0],
      [0.55, 0.12],
      [0.42, 0.2],
      [0.3, 0.32],
      [0.2, 0.8],
      [0.16, 1.15],
      [0.3, 1.22],
      [0.22, 1.32],
      [0.36, 1.62],
      [0.12, 1.66],
      [0, 1.66],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 64);
  }, []);
  return (
    <group>
      <mesh geometry={geo} position={[0, -0.85, 0]}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </mesh>
    </group>
  );
};

/** A board peg: a dark round head on a short wooden shank. */
const Peg: React.FC = () => (
  <group>
    <mesh position={[0, 0.25, 0]}>
      <sphereGeometry args={[0.32, 32, 32]} />
      <meshStandardMaterial color="#2b2116" roughness={0.3} />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <cylinderGeometry args={[0.12, 0.12, 0.6, 24]} />
      <meshStandardMaterial color="#a77d4a" roughness={0.6} />
    </mesh>
  </group>
);

/**
 * Bobs gently and turns, offset by `phase` so neighbours do not move in step. `at` places it
 * as a fraction of the visible half-width and half-height, so it keeps its spot at any size.
 */
const Float: React.FC<{ at: [number, number]; phase?: number; children: React.ReactNode; scale?: number }> = ({
  at,
  phase = 0,
  scale = 1,
  children,
}) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + phase;
    const { width, height } = state.viewport;
    ref.current.position.x = (at[0] * width) / 2 + state.pointer.x * 0.15;
    ref.current.position.y = (at[1] * height) / 2 + Math.sin(t * 0.9) * 0.12;
    ref.current.rotation.y = t * 0.4;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.15 + state.pointer.x * 0.15;
  });
  return (
    <group ref={ref} scale={scale}>
      {children}
    </group>
  );
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.85} />
    <directionalLight position={[3, 5, 4]} intensity={1.6} />
    <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#ffe2b0" />
  </>
);

/** While `active` the scene renders every frame; otherwise it draws once and holds still. */
const canvasProps = (active: boolean) => ({
  dpr: [1, 2] as [number, number],
  gl: { alpha: true, antialias: true },
  frameloop: (active ? 'always' : 'demand') as 'demand' | 'always',
  style: { width: '100%', height: '100%', pointerEvents: 'none' as const },
});

/** One cheese wheel, turning for a few seconds and again when the pointer passes over it. */
export const CheeseWheel3D: React.FC<{ className?: string }> = ({ className }) => {
  const { active, wake } = useAmbient();
  return (
    <div className={className} aria-hidden onPointerMove={wake}>
      <Canvas {...canvasProps(active)} camera={{ position: [0, 0.4, 3.1], fov: 35 }}>
        <Lights />
        <CheeseWheel spin={0.35} />
      </Canvas>
    </div>
  );
};

/** A cheese wheel, a queen and two pegs floating at the edges of a section. */
export const FloatingStory3D: React.FC<{ className?: string; queenColor?: string }> = ({ className, queenColor }) => {
  const { active, wake } = useAmbient();
  return (
    <div className={className} aria-hidden onPointerMove={wake}>
      <Canvas {...canvasProps(active)} camera={{ position: [0, 0, 8], fov: 40 }}>
        <Lights />
        <Float at={[-0.76, 0.05]} phase={0} scale={1.25}>
          <group rotation={[0.5, 0, 0]}>
            <CheeseWheel spin={0} />
          </group>
        </Float>
        <Float at={[-0.4, 0.45]} phase={1.7} scale={1.15}>
          <Queen color={queenColor} />
        </Float>
        <Float at={[0.4, 0.5]} phase={3.1} scale={0.8}>
          <Peg />
        </Float>
        <Float at={[0.84, 0.1]} phase={4.4} scale={0.75}>
          <Peg />
        </Float>
      </Canvas>
    </div>
  );
};

export default CheeseWheel3D;
