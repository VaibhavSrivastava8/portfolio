"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

// ---- Shared mouse + scroll state ----
function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useFrame(({ pointer }) => {
    mouse.current.x = pointer.x * viewport.width * 0.5;
    mouse.current.y = pointer.y * viewport.height * 0.5;
  });

  return mouse;
}

// ---- Central Geometric Sculpture ----
function GeometricSculpture({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const icoRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useMousePosition();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = scrollY.current;

    if (icoRef.current) {
      icoRef.current.rotation.x = t * 0.08 + scroll * 0.001;
      icoRef.current.rotation.y = t * 0.12;
    }

    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.15 + scroll * 0.0005;
      torusRef.current.rotation.y = t * 0.2;
      torusRef.current.rotation.z = t * 0.05;
    }

    if (groupRef.current) {
      // Subtle parallax toward cursor
      const targetX = mouse.current.x * 0.04;
      const targetY = mouse.current.y * 0.04;
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.02;

      // Scale on scroll
      const s = Math.max(0.6, 1 - scroll * 0.0003);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe icosahedron */}
      <mesh ref={icoRef}>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshBasicMaterial
          color="#999999"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Inner torus knot with emissive glow */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh ref={torusRef}>
          <torusKnotGeometry args={[0.7, 0.22, 100, 16]} />
          <meshStandardMaterial
            color="#888888"
            emissive="#aaaaaa"
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </Float>
    </group>
  );
}

// ---- Floating Particle Field ----
function ParticleField({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const COUNT = 250;
  const meshRef = useRef<THREE.Points>(null);
  const mouse = useMousePosition();

  const { positions, velocities, basePositions } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const basePositions = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 10 - 2;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      velocities[i3] = (Math.random() - 0.5) * 0.002;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    return { positions, velocities, basePositions };
  }, []);

  const sizes = useMemo(() => {
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      s[i] = Math.random() * 2 + 0.5;
    }
    return s;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const sizeAttr = geo.attributes.size as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    const mx = mouse.current.x;
    const my = mouse.current.y;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Gentle drift
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];

      const px = bx + Math.sin(t * 0.3 + i * 0.1) * 0.3 + velocities[i3] * t * 40;
      const py = by + Math.cos(t * 0.2 + i * 0.15) * 0.3 + velocities[i3 + 1] * t * 40;
      const pz = bz + Math.sin(t * 0.15 + i * 0.05) * 0.2;

      // Mouse repulsion
      const dx = px - mx;
      const dy = py - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repulse = dist < 3 ? (3 - dist) * 0.15 : 0;
      const angle = Math.atan2(dy, dx);

      posAttr.array[i3] = px + Math.cos(angle) * repulse;
      posAttr.array[i3 + 1] = py + Math.sin(angle) * repulse;
      posAttr.array[i3 + 2] = pz;

      // Glow brighter near mouse
      const baseSz = sizes[i];
      const glow = dist < 4 ? 1 + (4 - dist) * 0.5 : 1;
      sizeAttr.array[i] = baseSz * glow;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={COUNT}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#aaaaaa"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ---- Post Processing ----
function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}

// ---- Main Scene Component ----
export default function Scene3D() {
  const scrollY = useRef(0);
  const [opacity, setOpacity] = useState(1);

  const handleScroll = useCallback(() => {
    scrollY.current = window.scrollY;
    // Fade out as user scrolls
    const newOpacity = Math.max(0.15, 1 - window.scrollY / 1200);
    setOpacity(newOpacity);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} />
        <pointLight position={[-3, 2, 4]} intensity={0.3} color="#ffffff" />

        <GeometricSculpture scrollY={scrollY} />
        <ParticleField scrollY={scrollY} />
        <Effects />
      </Canvas>
    </div>
  );
}
