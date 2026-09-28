import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  
  // Basic Gerstner wave implementation
  vec3 gerstnerWave(vec3 p, vec2 dir, float steepness, float wavelength, float speed, float time) {
    float k = 2.0 * 3.14159 / wavelength;
    float c = sqrt(9.8 / k);
    float f = k * (dot(dir, p.xz) - c * time * speed);
    float a = steepness / k;
    
    return vec3(
      dir.x * (a * cos(f)),
      a * sin(f),
      dir.y * (a * cos(f))
    );
  }

  void main() {
    vUv = uv;
    vec3 p = position;
    
    // Apply a few waves
    vec3 offset1 = gerstnerWave(p, vec2(1.0, 0.5), 0.1, 10.0, 0.5, uTime);
    vec3 offset2 = gerstnerWave(p, vec2(0.5, 1.0), 0.1, 8.0, 0.6, uTime);
    vec3 offset3 = gerstnerWave(p, vec2(-0.2, 0.8), 0.05, 5.0, 0.8, uTime);
    
    vec3 finalPos = p + offset1 + offset2 + offset3;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  void main() {
    // Stylized blue water
    gl_FragColor = vec4(0.1, 0.4, 0.8, 0.9);
  }
`;

export default function Ocean() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const poolSize = 100;
  const wallHeight = 10;
  
  return (
    <RigidBody type="fixed" friction={0} restitution={0}>
      <group>
        {/* The Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[poolSize, poolSize]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.9} roughness={0.1} metalness={0.1} />
        </mesh>

        {/* The Sandbox Floor (Underneath the water) */}
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[poolSize, poolSize]} />
          <meshStandardMaterial color="#fef3c7" roughness={1} />
        </mesh>
        
        {/* Walls (North, South, East, West) */}
        <mesh position={[0, wallHeight/2 - 2, -poolSize/2]} receiveShadow castShadow>
          <boxGeometry args={[poolSize, wallHeight, 1]} />
          <meshStandardMaterial color="#fef3c7" roughness={1} />
        </mesh>
        <mesh position={[0, wallHeight/2 - 2, poolSize/2]} receiveShadow castShadow>
          <boxGeometry args={[poolSize, wallHeight, 1]} />
          <meshStandardMaterial color="#fef3c7" roughness={1} />
        </mesh>
        <mesh position={[-poolSize/2, wallHeight/2 - 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[poolSize, wallHeight, 1]} />
          <meshStandardMaterial color="#fef3c7" roughness={1} />
        </mesh>
        <mesh position={[poolSize/2, wallHeight/2 - 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[poolSize, wallHeight, 1]} />
          <meshStandardMaterial color="#fef3c7" roughness={1} />
        </mesh>
      </group>
    </RigidBody>
  );
}
