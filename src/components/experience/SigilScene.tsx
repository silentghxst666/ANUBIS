"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as THREE from "three";
import type { Theme } from "@/lib/theme";
import { EYE_PATH, EYE_VIEWBOX } from "./eye-path";

// The hero's 3D layer: the ANUBIS Eye extruded in polished silver, floating in space.
//
// Optics, kept physically motivated and subtle:
// - the silver has a thin-film layer (iridescence) and brushed-metal anisotropy, so grazing
//   highlights stretch and pick up a faint spectral tint;
// - stars behind the sigil are displaced by a point-mass gravitational lens, so the sky bends
//   around the mark as it moves, with a faint photon ring at the Einstein radius;
// - dark theme only: a soft halo with slow rays, bloom on the brightest glints, and a touch of
//   radial chromatic aberration at the frame edges, as a real lens would show.
// Light theme turns the same scene into a pale studio: silver against light, dust instead of
// stars, and now and then a dark shooting star crossing behind the sigil.
// All commerce UI lives in HTML on top.

export type Quality = "high" | "low";

type Palette = {
  bg: string;
  /** Fog start/end distance: pale haze must be thinner than dark haze or the silver washes out. */
  fog: [number, number];
  star: string;
  starOpacity: number;
  glow: number;
};

const PALETTE: Record<Theme, Palette> = {
  dark: { bg: "#030303", fog: [7, 16], star: "#f2f2f2", starOpacity: 1, glow: 1 },
  light: { bg: "#f1f1f1", fog: [9, 24], star: "#1a1a1a", starOpacity: 0.55, glow: 0 },
};

/** Raises the sigil so the bottom-aligned headline does not cover it. */
const LIFT = 0.7;
/** Rendered width of the sigil in world units. */
const SIGIL_WIDTH = 2.3;
/** Einstein radius of the lens in screen units (fraction of the viewport height). */
const EINSTEIN_RADIUS = 0.16;

/** Raw pointer in -1..1, written by the DOM listener. `at` = time of the last move (ms). */
const pointer = { x: 0, y: 0, at: -Infinity };
/** After this long without cursor movement (and always on touch screens) the scene drifts on its own. */
const IDLE_MS = 2500;
/** Eased pointer, updated once per frame; everything in the scene reads this one. */
const eased = { x: 0, y: 0 };
/** The sigil's centre in normalised device coordinates, shared with the lensing shader. */
const lensCenter = new THREE.Vector2();
/** Distance from the camera to the sigil; only stars farther than this are lensed. */
const lens = { depth: 7 };

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

/** Eases the background and fog toward the current theme, so switching feels like dusk/dawn. */
function ThemeRig({ theme }: { theme: Theme }) {
  const target = useMemo(() => new THREE.Color(PALETTE[theme].bg), [theme]);
  useFrame((state, delta) => {
    const k = 1 - Math.exp(-3 * step(delta));
    if (state.scene.background instanceof THREE.Color) state.scene.background.lerp(target, k);
    const fog = state.scene.fog;
    if (fog instanceof THREE.Fog) {
      fog.color.lerp(target, k);
      fog.near += (PALETTE[theme].fog[0] - fog.near) * k;
      fog.far += (PALETTE[theme].fog[1] - fog.far) * k;
    }
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
  const world = useMemo(() => new THREE.Vector3(), []);
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

    // Publish where the lens is on screen for the star shader.
    g.getWorldPosition(world);
    lens.depth = world.distanceTo(state.camera.position);
    world.project(state.camera);
    lensCenter.set(world.x, world.y);
  });

  return (
    <group ref={group} position={[anchor.x, anchor.y, 0]} scale={anchor.scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#c9ccd1"
          metalness={1}
          roughness={0.16}
          clearcoat={0.5}
          clearcoatRoughness={0.08}
          // Thin-film interference: a faint spectral sheen at grazing angles.
          iridescence={0.45}
          iridescenceIOR={1.35}
          iridescenceThicknessRange={[180, 420]}
          // Brushed-metal anisotropy: highlights stretch along the surface instead of pooling.
          anisotropy={0.35}
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

// Soft halo, slow rays and a faint photon ring behind the sigil; additive, so it only adds light.
const glowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRays;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float halo = exp(-r * r * 10.0) * 0.14 + exp(-r * 3.4) * 0.03;
    float pulse = 0.85 + 0.15 * sin(uTime * 0.6);
    float rays = pow(abs(sin(a * 6.0 + uTime * 0.04)), 40.0) * 0.6
               + pow(abs(sin(a * 11.0 - uTime * 0.03 + 1.3)), 60.0) * 0.35;
    rays *= smoothstep(1.0, 0.15, r) * smoothstep(0.0, 0.18, r) * uRays;
    float ring = exp(-pow((r - 0.26) / 0.02, 2.0)) * 0.025;
    float light = (halo * pulse + rays * 0.32 + ring) * uStrength;
    gl_FragColor = vec4(vec3(0.93, 0.95, 1.0) * light, light);
  }
`;

function SpaceGlow({ rays, theme }: { rays: boolean; theme: Theme }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uRays: { value: rays ? 1 : 0 },
    uStrength: { value: PALETTE[theme].glow },
  }));
  const anchor = useAnchor();

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uRays.value = rays ? 1 : 0;
    // Theme changes fade the glow rather than cutting it.
    m.uniforms.uStrength.value = THREE.MathUtils.damp(m.uniforms.uStrength.value, PALETTE[theme].glow, 3, step(delta));
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

// Stars as round soft points, bent by a point-mass gravitational lens centred on the sigil:
// a star at angular distance r from the lens appears pushed outward by θE² / r, and brightens
// near the Einstein ring. Only stars behind the sigil are lensed.
const starVertex = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uEinstein;
  uniform float uLensDepth;
  uniform float uAspect;
  uniform float uSize;
  uniform float uScale;
  varying float vGain;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;

    vec2 d = ndc - uCenter;
    d.x *= uAspect;
    float r = max(length(d), 1e-4);
    float behind = smoothstep(uLensDepth, uLensDepth + 0.8, -mv.z);
    float shift = min(uEinstein * uEinstein / r, 0.35) * behind;
    vec2 off = d / r * shift;
    off.x /= uAspect;
    clip.xy = (ndc + off) * clip.w;
    gl_Position = clip;

    vGain = 1.0 + behind * min(uEinstein * uEinstein / (r * r), 2.5) * 0.6;
    gl_PointSize = uSize * uScale / -mv.z * sqrt(vGain);
  }
`;

const starFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vGain;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d) * uOpacity * vGain;
    gl_FragColor = vec4(uColor, min(a, 1.0));
  }
`;

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
function Stars({
  count,
  seed,
  size,
  opacity,
  depth,
  drift,
  z,
  theme,
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
  theme: Theme;
}) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const positions = useMemo(() => makeField(count, seed, [14, 8, 6]), [count, seed]);
  const color = useMemo(() => new THREE.Color(PALETTE[theme].star), [theme]);
  const [uniforms] = useState(() => ({
    uCenter: { value: lensCenter },
    uEinstein: { value: EINSTEIN_RADIUS },
    uLensDepth: { value: lens.depth },
    uAspect: { value: 1 },
    uSize: { value: size },
    uScale: { value: 400 },
    uColor: { value: new THREE.Color(PALETTE[theme].star) },
    uOpacity: { value: opacity * PALETTE[theme].starOpacity },
  }));

  useFrame((state, delta) => {
    const p = points.current;
    const m = material.current;
    if (!p || !m) return;
    const dt = step(delta);
    p.rotation.y += dt * drift;
    p.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
    p.position.x = THREE.MathUtils.damp(p.position.x, -eased.x * depth, 2, dt);
    p.position.y = THREE.MathUtils.damp(p.position.y, -eased.y * depth * 0.6, 2, dt);

    const u = m.uniforms;
    const aspect = state.size.width / state.size.height;
    u.uLensDepth.value = lens.depth;
    u.uAspect.value = aspect;
    // Same scale three.js uses for size-attenuated points: half the drawing-buffer height.
    u.uScale.value = (state.size.height * state.viewport.dpr) / 2;
    u.uEinstein.value = EINSTEIN_RADIUS * (aspect < 1 ? 0.7 : 1);
    (u.uColor.value as THREE.Color).lerp(color, 1 - Math.exp(-3 * dt));
    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, opacity * PALETTE[theme].starOpacity, 3, dt);
  });

  return (
    <points ref={points} position={[0, 0, z]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/** A light strip drifting slowly, pulled toward the cursor, so a bright glint glides across the silver. */
function SweepLight({ color = "#ffffff", intensity = 6 }: { color?: string; intensity?: number }) {
  const light = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (light.current) {
      light.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 3 + eased.x * 3;
    }
  });
  return (
    <Lightformer
      ref={light}
      form="rect"
      color={color}
      intensity={intensity}
      position={[0, 0, 4]}
      scale={[0.35, 10, 1]}
    />
  );
}

/** What the silver reflects. Dark: black space with thin bright strips. Light: a pale studio with dark flags. */
function Surroundings({ theme, high }: { theme: Theme; high: boolean }) {
  return (
    <Environment
      // Rebuild the reflection map when the theme changes (low quality renders it only once).
      key={theme}
      resolution={high ? 256 : 64}
      frames={high ? Infinity : 1}
    >
      {theme === "dark" ? (
        <>
          <Lightformer form="rect" intensity={0.3} position={[0, 2, 7]} scale={[12, 8, 1]} />
          <Lightformer form="rect" intensity={4} position={[3, 0, 3]} scale={[0.2, 8, 1]} />
          <Lightformer form="rect" intensity={2} position={[-3, 1, 2]} scale={[0.1, 6, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[0, 5, -1]} scale={[8, 0.2, 1]} />
          <Lightformer form="rect" intensity={2.5} position={[7, 0, 0]} scale={[0.3, 10, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-7, 0, 0]} scale={[0.3, 10, 1]} />
          {high && <SweepLight />}
        </>
      ) : (
        <>
          <color attach="background" args={["#9c9c9c"]} />
          <Lightformer form="rect" intensity={1.8} position={[0, 4, 6]} scale={[14, 5, 1]} />
          <Lightformer form="rect" intensity={1} color="#050505" position={[2.5, 0, 3]} scale={[0.7, 9, 1]} />
          <Lightformer form="rect" intensity={1} color="#050505" position={[-3.5, 0, 2.5]} scale={[1.1, 9, 1]} />
          <Lightformer form="rect" intensity={1} color="#050505" position={[0, -5, 2]} scale={[14, 3, 1]} />
          {high && <SweepLight color="#050505" intensity={1} />}
        </>
      )}
    </Environment>
  );
}

const streakVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A meteor streak: solid at the head (uv.x = 1), fading to nothing along the tail,
// with soft edges across its width.
const streakFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float tail = pow(vUv.x, 2.2);
    float edge = 1.0 - abs(vUv.y * 2.0 - 1.0);
    gl_FragColor = vec4(uColor, tail * edge * uOpacity);
  }
`;

type Meteor = { active: boolean; t: number; duration: number; from: THREE.Vector3; dir: THREE.Vector3 };

const METEORS = 3;
const METEOR_LENGTH = 1.6;
const METEOR_TRAVEL = 6.5;

/**
 * Light theme only: every few seconds a dark shooting star crosses the sky behind the sigil.
 * A tiny fixed pool of streaks is reused, so nothing is allocated while the page runs.
 */
function ShootingStars({ theme }: { theme: Theme }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const meteors = useRef<Meteor[]>(
    Array.from({ length: METEORS }, () => ({
      active: false,
      t: 0,
      duration: 1,
      from: new THREE.Vector3(),
      dir: new THREE.Vector3(),
    })),
  );
  const wait = useRef(3);
  const presence = useRef(0);
  const [materials] = useState(() =>
    Array.from(
      { length: METEORS },
      () =>
        new THREE.ShaderMaterial({
          vertexShader: streakVertex,
          fragmentShader: streakFragment,
          uniforms: { uColor: { value: new THREE.Color("#0a0a0a") }, uOpacity: { value: 0 } },
          transparent: true,
          depthWrite: false,
        }),
    ),
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame((_, delta) => {
    const dt = step(delta);
    const light = theme === "light";
    // Fades the whole effect in/out with the theme instead of cutting streaks mid-flight.
    presence.current = THREE.MathUtils.damp(presence.current, light ? 1 : 0, 3, dt);

    wait.current -= dt;
    if (light && wait.current <= 0) {
      wait.current = 3 + Math.random() * 7;
      const free = meteors.current.find((m) => !m.active);
      if (free) {
        const side = Math.random() < 0.5 ? -1 : 1;
        free.active = true;
        free.t = 0;
        free.duration = 1.1 + Math.random() * 0.7;
        free.from.set(-side * (1 + Math.random() * 5), 3.2 + Math.random() * 1.4, -4 - Math.random() * 2);
        free.dir.set(side * (0.75 + Math.random() * 0.25), -(0.45 + Math.random() * 0.3), 0).normalize();
      }
    }

    meteors.current.forEach((m, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      if (!m.active) {
        mesh.visible = false;
        return;
      }
      m.t += dt;
      const p = m.t / m.duration;
      if (p >= 1) {
        m.active = false;
        mesh.visible = false;
        return;
      }
      // Head position; the streak's centre trails half a length behind it.
      const travel = p * METEOR_TRAVEL;
      mesh.visible = true;
      mesh.position.copy(m.from).addScaledVector(m.dir, travel - METEOR_LENGTH / 2);
      mesh.rotation.z = Math.atan2(m.dir.y, m.dir.x);
      materials[i].uniforms.uOpacity.value = Math.sin(Math.PI * p) * 0.7 * presence.current;
    });
  });

  return (
    <>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          material={material}
          visible={false}
        >
          <planeGeometry args={[METEOR_LENGTH, 0.014]} />
        </mesh>
      ))}
    </>
  );
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
  theme,
  onReady,
}: {
  quality: Quality;
  /** prefers-reduced-motion: keep slow ambient motion, drop camera flights and parallax. */
  calm: boolean;
  /** False when the hero is scrolled out of view — stops rendering to save battery. */
  active: boolean;
  theme: Theme;
  onReady: () => void;
}) {
  const high = quality === "high";
  const [dpr, setDpr] = useState(high ? 1.5 : 1);
  const [initial] = useState(PALETTE[theme]);
  const [aberration] = useState(() => new THREE.Vector2(0.0012, 0.0008));

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
      {/*
        Only resolution adapts at runtime. Effects are decided once at start: the first seconds
        (shader compilation) are always slow, and switching bloom off then made the glow vanish.
      */}
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <color attach="background" args={[initial.bg]} />
      <fog attach="fog" args={[initial.bg, ...initial.fog]} />
      <ThemeRig theme={theme} />

      <ambientLight intensity={theme === "dark" ? 0.03 : 0.4} />
      <directionalLight position={[-4, 3, -3]} intensity={theme === "dark" ? 1 : 0.6} color="#dfe6ee" />
      <directionalLight position={[3, 2, 4]} intensity={0.3} />

      <Surroundings theme={theme} high={high} />

      <PointerEase />
      <SpaceGlow rays={!calm} theme={theme} />
      <Sigil calm={calm} />
      {/* Far layer: many fine points behind the sigil (lensed). Near layer: fewer, larger, more parallax. */}
      <Stars count={high ? 700 : 240} seed={7} size={0.018} opacity={0.5} depth={0.35} drift={0.02} z={-3} theme={theme} />
      <Stars count={high ? 180 : 70} seed={31} size={0.03} opacity={0.75} depth={1.1} drift={0.035} z={2} theme={theme} />
      <ShootingStars theme={theme} />
      <CameraRig calm={calm} />

      {high && theme === "dark" && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.15} />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={aberration}
            radialModulation
            modulationOffset={0.35}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
