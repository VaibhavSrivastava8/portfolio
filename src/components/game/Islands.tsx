import { useMemo } from 'react';
import { useGLTF, Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { applyToyMaterial } from '../../utils/materialUtils';
import Buoy from './Buoy';
import ProjectBillboard from './ProjectBillboard';

function StaticModel({ path, position = [0,0,0], rotation = [0,0,0], scale = 1 }: any) {
  const { scene } = useGLTF(path);
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    applyToyMaterial(clone);
    return clone;
  }, [scene, path]);
  
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders="trimesh">
      <primitive object={clonedScene} scale={scale} castShadow receiveShadow />
    </RigidBody>
  );
}

function DynamicBarrel({ position = [0,0,0] }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/models/pirate_kit/Models/GLB format/barrel.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    applyToyMaterial(clone);
    return clone;
  }, [scene]);

  return (
    <RigidBody type="dynamic" position={position} colliders="hull" mass={1} linearDamping={2} angularDamping={2}>
      <primitive object={clonedScene} castShadow receiveShadow />
    </RigidBody>
  );
}

export default function Islands() {
  const basePath = '/models/pirate_kit/Models/GLB format/';

  return (
    <group>
      {/* =========================================
          ZONE 1: THE SPAWN HARBOR (Introduction)
          ========================================= */}
      
      {/* Harbor Walls */}
      <StaticModel path={`${basePath}rocks-sand-a.glb`} position={[0, -1, -15]} scale={2.5} rotation={[0, Math.PI, 0]} />
      <StaticModel path={`${basePath}structure-platform-dock.glb`} position={[0, 0, -9.5]} rotation={[0, 0, 0]} scale={1.2} />
      
      {/* 3D Text embedded in the world */}
      <Text
        position={[0, 0.5, 5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={3}
        color="#0369a1"
        anchorX="center"
        anchorY="middle"
      >
        WELCOME TO VAIBHAV'S PORTFOLIO
      </Text>
      <Text
        position={[0, 0.5, 9]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1}
        color="#0284c7"
        anchorX="center"
        anchorY="middle"
      >
        Navigate your boat using WASD to explore.
      </Text>

      {/* =========================================
          ZONE 2: THE PROJECT BAY (Billboards)
          ========================================= */}
      
      <StaticModel path={`${basePath}rocks-sand-c.glb`} position={[-40, -1, 20]} scale={2} rotation={[0, Math.PI / 2, 0]} />
      <ProjectBillboard 
        position={[-30, 0, 20]} 
        rotation={[0, Math.PI / 4, 0]}
        title="PDF Retype"
        description="Blazing fast WebAssembly PDF editor"
        link="https://pdfretype.com"
        imagePath="/screenshot1.png"
      />

      <StaticModel path={`${basePath}rocks-sand-b.glb`} position={[40, -1, 20]} scale={2} rotation={[0, -Math.PI / 2, 0]} />
      <ProjectBillboard 
        position={[30, 0, 20]} 
        rotation={[0, -Math.PI / 4, 0]}
        title="KMS Dashboard"
        description="Enterprise key management UI"
        link="https://example.com/kms"
        imagePath="/screenshot2.png"
      />

      {/* =========================================
          ZONE 3: THE PHYSICS PLAYGROUND
          ========================================= */}
      
      {/* The Bowling Alley Ramp */}
      <StaticModel path={`${basePath}platform-planks.glb`} position={[0, -0.5, 30]} rotation={[Math.PI / 6, 0, 0]} scale={2} />
      
      {/* The Bowling Pins (Barrels) */}
      <group position={[0, 0.5, 45]}>
        {/* Row 1 */}
        <DynamicBarrel position={[0, 0, 0]} />
        {/* Row 2 */}
        <DynamicBarrel position={[-1, 0, 2]} />
        <DynamicBarrel position={[1, 0, 2]} />
        {/* Row 3 */}
        <DynamicBarrel position={[-2, 0, 4]} />
        <DynamicBarrel position={[0, 0, 4]} />
        <DynamicBarrel position={[2, 0, 4]} />
        
        <Text
          position={[0, 0.5, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={2}
          color="#be123c"
          anchorX="center"
          anchorY="middle"
        >
          STRIKE!
        </Text>
      </group>

      {/* Miscellaneous Toys */}
      <Buoy position={[15, 1, 0]} />
      <Buoy position={[-15, 1, 0]} />
    </group>
  );
}

// Preload models
const preloadList = [
  'rocks-sand-a.glb', 'rocks-sand-b.glb', 'rocks-sand-c.glb',
  'structure-platform-dock.glb', 'structure-platform-dock-small.glb',
  'tower-complete-large.glb', 'tower-watch.glb', 'castle-gate.glb',
  'palm-detailed-bend.glb', 'chest.glb', 'crate.glb', 'barrel.glb',
  'flag-pirate-high.glb'
];

preloadList.forEach(file => {
  useGLTF.preload(`/models/pirate_kit/Models/GLB format/${file}`);
});
