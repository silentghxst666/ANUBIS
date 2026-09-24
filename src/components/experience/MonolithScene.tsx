"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// The hero's 3D layer: a black monolith in fog, lit only by thin white light strips.
// Kept deliberately small — one mesh, one points cloud, no post-processing — so it
// loads fast and stays smooth on phones. All commerce UI lives in HTML on top.

export type Quality = "high" | "low";

const BG = "#050505";

const pointer = { x: 0, y: 0 };

/** Raises the monolith so the bottom-aligned headline does not cover it. */
const LIFT = 0.55;

function Monolith({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || still) return;
    const t = state.clock.elapsedTime;
    // Slow breathing rotation plus a hint of the pointer; eased so nothing snaps.
    const targetY = Math.sin(t * 0.15) * 0.35 + pointer.x * 0.25;
    const targetX = pointer.y * 0.06;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 1.5, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 1.5, delta);
    g.position.y = LIFT + Math.sin(t * 0.4) * 0.05;
  });

  return (
    <group ref={group} position={[0, LIFT, 0]} rotation={[0, still ? 0.45 : 0, 0]}>
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

function Dust({ count, still }: { count: number; still: boolean }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // Deterministic pseudo-random so SSR/CSR and re-mounts produce the same field.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 12;
      arr[i * 3 + 1] = (rand() - 0.5) * 7;
      arr[i * 3 + 2] = (rand() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    const p = points.current;
    if (!p || still) return;
    p.rotation.y += delta * 0.012;
    p.position.y = (p.position.y + delta * 0.03) % 0.6;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#f2f2f2"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function CameraRig({ still }: { still: boolean }) {
  const start = useRef(still ? 0 : -1);

  useFrame((state, delta) => {
    const { camera } = state;
    // Arrival: the camera drifts in from the fog over the first seconds.
    if (start.current < 0) start.current = state.clock.elapsedTime;
    const arrive = still ? 1 : Math.min((state.clock.elapsedTime - start.current) / 3.2, 1);
    const eased = 1 - Math.pow(1 - arrive, 3);

    // Scrolling out of the hero pushes the camera toward the monolith.
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);

    const z = THREE.MathUtils.lerp(11, 7.2, eased) - scroll * 2.2;
    const x = still ? 0 : pointer.x * 0.45;
    const y = (still ? 0 : pointer.y * 0.25) + 0.1 - scroll * 0.4;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 2.5, delta);
    camera.lookAt(0, LIFT * 0.35, 0);
  });

  return null;
}

export default function MonolithScene({
  quality,
  still,
  active,
  onReady,
}: {
  quality: Quality;
  /** prefers-reduced-motion: render a composed still frame. */
  still: boolean;
  /** False when the hero is scrolled out of view — stops rendering to save battery. */
  active: boolean;
  onReady: () => void;
}) {
  const [dpr, setDpr] = useState(quality === "high" ? 1.5 : 1);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      dpr={dpr}
      frameloop={still ? "demand" : active ? "always" : "never"}
      camera={{ position: [0, 0.1, still ? 7.2 : 11], fov: 35, near: 0.1, far: 40 }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance", alpha: false }}
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
      <Environment resolution={quality === "high" ? 256 : 64} frames={1}>
        <Lightformer form="rect" intensity={4.5} position={[3, 0, 3]} scale={[0.15, 8, 1]} />
        <Lightformer form="rect" intensity={2} position={[-3, 1, 2]} scale={[0.08, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[0, 4, -2]} scale={[6, 0.1, 1]} />
      </Environment>

      <Monolith still={still} />
      <Dust count={quality === "high" ? 700 : 220} still={still} />
      <CameraRig still={still} />
    </Canvas>
  );
}
