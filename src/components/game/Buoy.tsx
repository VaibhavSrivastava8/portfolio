import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { applyToyMaterial } from '../../utils/materialUtils';
import * as THREE from 'three';
import { calculateGerstnerWave } from '../../utils/waveUtils';

export default function Buoy({ position = [0, 0, 0] }: { position: [number, number, number] }) {
  const rb = useRef<RapierRigidBody>(null);
  
  const { scene } = useGLTF('/models/pirate_kit/Models/GLB format/bottle-large.glb');
  const model = useMemo(() => {
    const clone = scene.clone();
    applyToyMaterial(clone);
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!rb.current) return;
    
    const pos = rb.current.translation();
    const time = state.clock.getElapsedTime();
    
    // Calculate wave height at the buoy's position
    const waveHeight = calculateGerstnerWave(pos.x, pos.z, time);
    
    // Apply buoyancy force
    if (pos.y < waveHeight) {
      // Upward buoyant force
      const depth = waveHeight - pos.y;
      rb.current.applyImpulse({ x: 0, y: depth * 0.1, z: 0 }, true);
      
      // Damping to prevent flying into space
      const linVel = rb.current.linvel();
      rb.current.setLinvel({ x: linVel.x * 0.95, y: linVel.y * 0.9, z: linVel.z * 0.95 }, true);
      
      // Righting moment (keep it mostly upright)
      const rot = rb.current.rotation();
      const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w));
      rb.current.applyTorqueImpulse({
        x: -euler.x * 0.05,
        y: 0,
        z: -euler.z * 0.05
      }, true);
    }
  });

  return (
    <RigidBody 
      ref={rb} 
      position={position} 
      colliders="hull" 
      mass={0.5} 
      restitution={0.8}
      friction={0.2}
      onCollisionEnter={() => {
        // Optional: Play a "clink" sound or spawn particles here
        console.log("Bottle Hit!");
      }}
    >
      <primitive object={model} scale={1.5} castShadow receiveShadow />
    </RigidBody>
  );
}

useGLTF.preload('/models/pirate_kit/Models/GLB format/bottle-large.glb');
