import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { openProject, closeProject } from '../../stores/gameStore';

interface ProjectZoneProps {
  position: [number, number, number];
  title: string;
  description: string;
  link?: string;
}

export default function ProjectZone({ position, title, description, link }: ProjectZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (textRef.current) {
      // Bobbing animation
      textRef.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // Make text face camera
      textRef.current.lookAt(state.camera.position);
      
      // Smooth scale in/out
      const targetScale = isHovered ? 1.2 : 1;
      textRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Invisible Sensor for Boat */}
      <RigidBody 
        type="fixed" 
        colliders="cuboid" 
        sensor
        onIntersectionEnter={() => {
          setIsHovered(true);
          openProject(title, description);
        }}
        onIntersectionExit={() => {
          setIsHovered(false);
        }}
      >
        {/* The sensor area */}
        <mesh visible={false}>
          <boxGeometry args={[10, 5, 10]} />
          <meshBasicMaterial transparent opacity={0.2} color="green" />
        </mesh>
      </RigidBody>

      {/* Floating 3D Text */}
      <group ref={textRef}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color={isHovered ? "#38bdf8" : "#ffffff"}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {title}
        </Text>
        
        {isHovered && (
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.5}
            color="#e2e8f0"
            anchorX="center"
            anchorY="top"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={8}
            textAlign="center"
          >
            {description}
          </Text>
        )}
      </group>

      {/* Ground Ring Indicator */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 5, 32]} />
        <meshBasicMaterial 
          color={isHovered ? "#38bdf8" : "#ffffff"} 
          transparent 
          opacity={isHovered ? 0.8 : 0.3} 
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
}
