"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// The hero's 3D layer: a black monolith in fog, lit by thin white light strips; one strip
// follows the cursor. Kept deliberately small — one mesh, two point clouds,
// no post-processing — so it loads fast and stays smooth on phones.

export type Quality = "high" | "low";

const BG = "#050505";

/** Raises the monolith so the bottom-aligned headline does not cover it. */
const LIFT = 0.55;

/** Raw pointer in -1..1, written by the DOM listener. `at` = time of the last move (ms). */
const pointer = { x: 0, y: 0, at: -Infinity };

/** After this long without cursor movement (and always on touch screens) the scene drifts on its own. */
const IDLE_MS = 2500;
/** Eased pointer, updated once per frame; everything in the scene reads this one. */
const eased = { x: 0, y: 0 };

/**
 * Longest step a frame may take. When rendering resumes after the hero was off-screen,
 * the first delta can be seconds long; without this cap the camera and monolith would
 * jump to their targets in a single frame.
 */
const step = (delta: number) => Math.min(delta, 1 / 30);

function PointerEase() {
  useFrame((state, delta) => {
    const dt = step(delta);
    const idle = performance.now() - pointer.at > IDLE_MS;
    // Idle: a slow figure-eight "wander" stands in for the cursor, so the scene is never frozen.
    const t = state.clock.elapsedTime;
    const tx = idle ? Math.sin(t * 0.21) * 0.45 : pointer.x;
    const ty = idle ? Math.sin(t * 0.13) * Math.cos(t * 0.21) * 0.35 : pointer.y;
    const rate = idle ? 0.8 : 2.5;
    eased.x = THREE.MathUtils.damp(eased.x, tx, rate, dt);
    eased.y = THREE.MathUtils.damp(eased.y, ty, rate, dt);
  });
  return null;
}

function Monolith({ calm }: { calm: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = step(delta);
    const t = state.clock.elapsedTime;
    // Continuous slow turn (one revolution ≈ 50 s, ≈ 80 s in calm mode) plus a turn
    // toward the cursor, both eased so nothing snaps.
    spin.current += dt * (calm ? 0.08 : 0.125);
    const targetY = spin.current + eased.x * (calm ? 0.35 : 0.7);
    const targetX = -eased.y * (calm ? 0.06 : 0.14);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 2, dt);
    g.position.y = LIFT + Math.sin(t * 0.4) * 0.06;
  });

  return (
    <group ref={group} position={[0, LIFT, 0]}>
      <RoundedBox args={[1.05, 3.1, 0.3]} radius={0.015} smoothness={2}>
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={0.85}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>
    </group>
  );
}

/** Deterministic pseudo-random field so re-mounts produce the same sky. */
function makeField(count: number, seed: number, spread: [number, number, number]) {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (rand() - 0.5) * spread[0];
    arr[i * 3 + 1] = (rand() - 0.5) * spread[1];
    arr[i * 3 + 2] = (rand() - 0.5) * spread[2];
  }
  return arr;
}

/**
 * One layer of floating dust. It drifts on its own (slow rotation + rising) and shifts
 * against the cursor; nearer layers shift more, which reads as depth.
 */
function Dust({
  count,
  seed,
  size,
  opacity,
  depth,
  drift,
  z,
}: {
  count: number;
  seed: number;
  size: number;
  opacity: number;
  /** How strongly the layer shifts against the cursor. */
  depth: number;
  /** Rotation speed, rad/s. */
  drift: number;
  z: number;
}) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => makeField(count, seed, [14, 8, 6]), [count, seed]);

  useFrame((state, delta) => {
    const p = points.current;
    if (!p) return;
    const dt = step(delta);
    p.rotation.y += dt * drift;
    p.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    p.position.x = THREE.MathUtils.damp(p.position.x, -eased.x * depth, 2, dt);
    p.position.y = THREE.MathUtils.damp(p.position.y, -eased.y * depth * 0.6, 2, dt);
  });

  return (
    <points ref={points} position={[0, 0, z]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color="#f2f2f2"
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** A thin light strip drifting slowly, pulled toward the cursor, so a highlight glides over the faces. */
function SweepLight() {
  const light = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (light.current) {
      light.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 3 + eased.x * 3;
    }
  });
  return <Lightformer ref={light} form="rect" intensity={3} position={[0, 0, 4]} scale={[0.25, 10, 1]} />;
}

function CameraRig({ calm }: { calm: boolean }) {
  const start = useRef(-1);

  useFrame((state, delta) => {
    const { camera } = state;
    const dt = step(delta);

    // Arrival: the camera drifts in from the fog over the first seconds (skipped in calm mode).
    if (start.current < 0) start.current = state.clock.elapsedTime;
    const arrive = calm ? 1 : Math.min((state.clock.elapsedTime - start.current) / 3.2, 1);
    const inOut = 1 - Math.pow(1 - arrive, 3);

    // Scrolling out of the hero nudges the camera slightly closer — a hint, not a zoom.
    const scroll = calm ? 0 : Math.min(window.scrollY / window.innerHeight, 1);

    const z = THREE.MathUtils.lerp(11, 7.2, inOut) - scroll * 0.7;
    const x = calm ? 0 : eased.x * 0.5;
    const y = (calm ? 0 : eased.y * 0.3) + 0.1 - scroll * 0.2;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 2.5, dt);
    camera.lookAt(0, LIFT * 0.35, 0);
  });

  return null;
}

export default function MonolithScene({
  quality,
  calm,
  active,
  onReady,
}: {
  quality: Quality;
  /** prefers-reduced-motion: keep slow ambient motion, drop camera flights and parallax. */
  calm: boolean;
  /** False when the hero is scrolled out of view — stops rendering to save battery. */
  active: boolean;
  onReady: () => void;
}) {
  const [dpr, setDpr] = useState(quality === "high" ? 1.5 : 1);
  const high = quality === "high";

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Touch drags scroll the page; only a real mouse/pen steers the scene.
      if (e.pointerType === "touch") return;
      pointer.at = performance.now();
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    // Cursor left the window: hand control back to the idle wander.
    const onLeave = () => {
      pointer.at = -Infinity;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.1, calm ? 7.2 : 11], fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: high, powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        onReady();
      }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 6, 15]} />

      <ambientLight intensity={0.04} />
      {/* Cold rim light from behind-left, soft key from the right. */}
      <directionalLight position={[-4, 3, -3]} intensity={1.4} color="#dfe6ee" />
      <directionalLight position={[3, 1, 4]} intensity={0.25} />

      {/* Reflections come from these local light strips — no HDR download needed. */}
      <Environment resolution={high ? 256 : 64} frames={high ? Infinity : 1}>
        <Lightformer form="rect" intensity={4.5} position={[3, 0, 3]} scale={[0.15, 8, 1]} />
        <Lightformer form="rect" intensity={2} position={[-3, 1, 2]} scale={[0.08, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[0, 4, -2]} scale={[6, 0.1, 1]} />
        {/* Broad, dim panel in front: the face always reads as a soft grey gradient. */}
        <Lightformer form="rect" intensity={0.35} position={[0, 2, 7]} scale={[12, 8, 1]} />
        {/* Side strips: the edges light up as the slab turns. */}
        <Lightformer form="rect" intensity={2.5} position={[7, 0, 0]} scale={[0.3, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-7, 0, 0]} scale={[0.3, 10, 1]} />
        {high && <SweepLight />}
      </Environment>

      <PointerEase />
      <Monolith calm={calm} />
      {/* Far layer: many fine points, barely moving. Near layer: fewer, larger, more parallax. */}
      <Dust count={high ? 520 : 180} seed={7} size={0.016} opacity={0.45} depth={0.35} drift={0.02} z={-1.5} />
      <Dust count={high ? 200 : 80} seed={31} size={0.028} opacity={0.7} depth={1.1} drift={0.035} z={2} />
      <CameraRig calm={calm} />
    </Canvas>
  );
}
