"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as THREE from "three";
import { EYE_PATH, EYE_VIEWBOX } from "./eye-path";

// The hero's 3D layer: the ANUBIS Eye extruded in polished silver, floating in dark space.
// Light "from space" = a soft halo and slow rays behind the sigil, a light strip gliding over
// the metal, and (on capable devices) a gentle bloom on the brightest highlights.
// All commerce UI lives in HTML on top.

export type Quality = "high" | "low";

const BG = "#050505";

/** Raises the sigil so the bottom-aligned headline does not cover it. */
const LIFT = 0.7;
/** Rendered width of the sigil in world units. */
const SIGIL_WIDTH = 2.3;

/** Raw pointer in -1..1, written by the DOM listener. `at` = time of the last move (ms). */
const pointer = { x: 0, y: 0, at: -Infinity };
/** After this long without cursor movement (and always on touch screens) the scene drifts on its own. */
const IDLE_MS = 2500;
/** Eased pointer, updated once per frame; everything in the scene reads this one. */
const eased = { x: 0, y: 0 };

/**
 * Where the sigil sits for the current screen shape. Wide screens: to the right of the
 * headline, magazine-cover style. Narrow/portrait screens: centred above it, smaller.
 */
function useAnchor() {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const wide = THREE.MathUtils.clamp((aspect - 1.15) / 0.6, 0, 1);
  return {
    x: wide * 1.75,
    y: LIFT + wide * 0.05,
    scale: THREE.MathUtils.clamp(aspect / 1.7, 0.55, 1),
  };
}

/**
 * Longest step a frame may take. When rendering resumes after the hero was off-screen,
 * the first delta can be seconds long; without this cap everything would jump.
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

function useSigilGeometry() {
  return useMemo(() => {
    const [x, y, w, h] = EYE_VIEWBOX;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"><path fill-rule="evenodd" d="${EYE_PATH}"/></svg>`;
    const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 34,
      bevelEnabled: true,
      bevelThickness: 7,
      bevelSize: 2.5,
      bevelSegments: 4,
      curveSegments: 6,
    });
    geometry.center();
    // SVG is y-down; turning it over puts it upright without mirroring.
    geometry.rotateX(Math.PI);
    const s = SIGIL_WIDTH / w;
    geometry.scale(s, s, s);
    return geometry;
  }, []);
}

function Sigil({ calm }: { calm: boolean }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useSigilGeometry();
  const anchor = useAnchor();
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = step(delta);
    const t = state.clock.elapsedTime;
    // A slow sway so the metal keeps catching new light, plus a turn toward the cursor.
    // It never turns far enough to show the mark mirrored from behind.
    const sway = calm ? 0.25 : 0.45;
    const targetY = Math.sin(t * 0.22) * sway + eased.x * (calm ? 0.25 : 0.5);
    const targetX = Math.sin(t * 0.17) * 0.1 - eased.y * (calm ? 0.1 : 0.25);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 2, dt);
    g.position.y = anchor.y + Math.sin(t * 0.4) * 0.06;
  });

  return (
    <group ref={group} position={[anchor.x, anchor.y, 0]} scale={anchor.scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#c9ccd1"
          metalness={1}
          roughness={0.14}
          clearcoat={0.5}
          clearcoatRoughness={0.08}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Soft halo plus thin rays radiating from behind the sigil; additive, so it only adds light.
const glowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRays;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float halo = exp(-r * r * 9.0) * 0.22 + exp(-r * 3.2) * 0.05;
    float pulse = 0.85 + 0.15 * sin(uTime * 0.6);
    float rays = pow(abs(sin(a * 6.0 + uTime * 0.04)), 40.0) * 0.6
               + pow(abs(sin(a * 11.0 - uTime * 0.03 + 1.3)), 60.0) * 0.35;
    rays *= smoothstep(1.0, 0.15, r) * smoothstep(0.0, 0.18, r) * uRays;
    float light = (halo * pulse + rays * 0.45);
    gl_FragColor = vec4(vec3(0.93, 0.95, 1.0) * light, light);
  }
`;

function SpaceGlow({ rays }: { rays: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRays: { value: rays ? 1 : 0 } }), [rays]);
  const anchor = useAnchor();

  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[anchor.x, anchor.y, -1.4]} scale={anchor.scale}>
      <planeGeometry args={[11, 11]} />
      <shaderMaterial
        ref={material}
        vertexShader={glowVertex}
        fragmentShader={glowFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </mesh>
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
 * One layer of stars/dust. It drifts on its own and shifts against the cursor;
 * nearer layers shift more, which reads as depth.
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

/** A light strip drifting slowly, pulled toward the cursor, so a bright glint glides across the silver. */
function SweepLight() {
  const light = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (light.current) {
      light.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 3 + eased.x * 3;
    }
  });
  return <Lightformer ref={light} form="rect" intensity={6} position={[0, 0, 4]} scale={[0.35, 10, 1]} />;
}

function CameraRig({ calm }: { calm: boolean }) {
  const start = useRef(-1);

  useFrame((state, delta) => {
    const { camera } = state;
    const dt = step(delta);

    // Arrival: the camera drifts in from the dark over the first seconds (skipped in calm mode).
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

export default function SigilScene({
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
  const [bloom, setBloom] = useState(quality === "high");
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
      {/* If the device struggles: first drop resolution, then the bloom pass. */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setBloom(false);
        }}
      />
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 7, 16]} />

      <ambientLight intensity={0.05} />
      <directionalLight position={[-4, 3, -3]} intensity={1.2} color="#dfe6ee" />
      <directionalLight position={[3, 2, 4]} intensity={0.35} />

      {/* Reflections for the silver come from these local light panels — no HDR download. */}
      <Environment resolution={high ? 256 : 64} frames={high ? Infinity : 1}>
        {/* Dim wide panel: silver stays readable; bright strips give it contrast. */}
        <Lightformer form="rect" intensity={0.5} position={[0, 2, 7]} scale={[12, 8, 1]} />
        <Lightformer form="rect" intensity={4} position={[3, 0, 3]} scale={[0.2, 8, 1]} />
        <Lightformer form="rect" intensity={2} position={[-3, 1, 2]} scale={[0.1, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 5, -1]} scale={[8, 0.2, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[7, 0, 0]} scale={[0.3, 10, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-7, 0, 0]} scale={[0.3, 10, 1]} />
        {high && <SweepLight />}
      </Environment>

      <PointerEase />
      <SpaceGlow rays={!calm} />
      <Sigil calm={calm} />
      {/* Far layer: many fine points, barely moving. Near layer: fewer, larger, more parallax. */}
      <Dust count={high ? 520 : 180} seed={7} size={0.016} opacity={0.45} depth={0.35} drift={0.02} z={-2} />
      <Dust count={high ? 200 : 80} seed={31} size={0.028} opacity={0.7} depth={1.1} drift={0.035} z={2} />
      <CameraRig calm={calm} />

      {bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.82} luminanceSmoothing={0.15} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
