import * as THREE from 'three';

export function applyToyMaterial(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // If it already has a material, we modify it to look like a soft toy
      if (child.material) {
        // We ensure it's a MeshStandardMaterial
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.roughness = 0.8; // Soft look
          child.material.metalness = 0.1; 
          
          // Slight color adjustment to make it pastel/warm
          // We can blend the original color with a warm cream color to unify the palette
          const originalColor = child.material.color.clone();
          const creamColor = new THREE.Color('#fff5e6');
          child.material.color.lerp(creamColor, 0.15); // 15% cream tint for everything
          
          // Enable flat shading for that low-poly toy look
          child.material.flatShading = true;
          child.material.needsUpdate = true;
        } else {
          // If it's some other material, we just replace it
          const oldColor = child.material.color || new THREE.Color('#ffffff');
          child.material = new THREE.MeshStandardMaterial({
            color: oldColor,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true,
          });
        }
      }
    }
  });
}
