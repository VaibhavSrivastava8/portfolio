import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Text, Text3D, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ProjectBillboardProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  title: string;
  description: string;
  link: string;
  imagePath: string; // The screenshot of the project
}

export default function ProjectBillboard({ position, rotation = [0, 0, 0], title, description, link, imagePath }: ProjectBillboardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<THREE.Mesh>(null);
  
  // In a real app we'd pass a real texture path. For now we use a solid color if none provided, 
  // but useTexture needs a valid URL. We'll use a placeholder or basic material if it fails.
  
  // Animation for the button press
  useFrame((state, delta) => {
    if (buttonRef.current) {
      const targetY = isHovered ? -0.2 : 0;
      buttonRef.current.position.y = THREE.MathUtils.lerp(buttonRef.current.position.y, targetY, delta * 10);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      
      {/* --- THE BILLBOARD (The Screen) --- */}
      <group position={[0, 6, -3]}>
        {/* Frame / Backing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[12, 8, 1]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        
        {/* Screen / Image */}
        <mesh position={[0, 0, 0.51]} castShadow>
          <planeGeometry args={[11.5, 7.5]} />
          {/* We use a solid bright color placeholder. Ideally useTexture(imagePath) */}
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.2} />
        </mesh>

        {/* 3D Text Title attached to the top of the billboard */}
        <Text
          position={[0, 5, 0]}
          fontSize={1.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {title}
        </Text>

        <Text
          position={[0, 3.5, 0]}
          fontSize={0.6}
          color="#bae6fd"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {description}
        </Text>
      </group>

      {/* --- THE LAUNCH BUTTON (Physical Interaction) --- */}
      <group position={[0, 0.5, 3]}>
        {/* Button Base */}
        <RigidBody type="fixed" colliders="hull">
          <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.2, 2.5, 0.5, 32]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </RigidBody>

        {/* The Pressable Red Button (Sensor) */}
        <RigidBody 
          type="fixed" 
          colliders="hull"
          sensor
          onIntersectionEnter={() => {
            if (!isHovered) {
              setIsHovered(true);
              // Launch the project!
              console.log("Launching project: ", link);
              window.open(link, '_blank');
            }
          }}
          onIntersectionExit={() => {
            setIsHovered(false);
          }}
        >
          <mesh ref={buttonRef} position={[0, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2, 2, 0.5, 32]} />
            <meshStandardMaterial color={isHovered ? "#991b1b" : "#ef4444"} emissive={isHovered ? "#ef4444" : "black"} emissiveIntensity={0.5} />
          </mesh>
        </RigidBody>
        
        {/* "LAUNCH" Text on the button */}
        <Text
          position={[0, 0.26, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          LAUNCH
        </Text>
      </group>
    </group>
  );
}
