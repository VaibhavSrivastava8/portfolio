import * as THREE from 'three/webgpu'

// Photograph the existing GLB once. The chart moves and rotates this transparent
// model-derived image without running a second renderer on every game frame.
export async function captureMapShip(model)
{
    const renderer = new THREE.WebGPURenderer({ alpha: true, antialias: true, forceWebGL: true })
    renderer.setSize(256, 256)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    const ship = model.clone(true)
    // The source model's bow is +Z; the chart's north is -Z.
    ship.rotation.set(0, Math.PI, 0)
    ship.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(ship)
    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    ship.position.sub(center)
    ship.traverse(child =>
    {
        // Cloned geometry and materials are shared with the game; never dispose them.
        if(child.isMesh) { child.castShadow = false; child.receiveShadow = false }
    })
    scene.add(ship)
    scene.add(new THREE.HemisphereLight(0xfff7e8, 0x493451, 2.4))
    const sun = new THREE.DirectionalLight(0xffffff, 2)
    sun.position.set(-8, 16, 8)
    scene.add(sun)
    const halfSize = Math.max(size.x, size.z) * 0.6
    const camera = new THREE.OrthographicCamera(-halfSize, halfSize, halfSize, -halfSize, 0.1, 200)
    camera.position.set(0, size.y + 20, 0)
    camera.up.set(0, 0, -1)
    camera.lookAt(0, 0, 0)
    try
    {
        await renderer.init()
        renderer.render(scene, camera)
        return renderer.domElement.toDataURL('image/png')
    }
    finally
    {
        renderer.dispose()
        renderer.backend.gl?.getExtension('WEBGL_lose_context')?.loseContext()
    }
}
