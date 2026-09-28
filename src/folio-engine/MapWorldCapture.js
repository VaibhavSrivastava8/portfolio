import * as THREE from 'three/webgpu'

// The same world bounds feed the orthographic photograph and map coordinates.
// Capture only on chart open: terrain and scenery are a flat image, not another live scene.
export async function captureMapWorld(game)
{
    await Promise.all([game.world.archipelago.ready, game.world.monsters.ready])
    const renderer = game.rendering.renderer
    const resolution = window.matchMedia('(max-width: 640px)').matches ? 768 : 1024
    const target = new THREE.RenderTarget(resolution, resolution)
    target.texture.colorSpace = THREE.SRGBColorSpace
    const extent = game.terrain.size / 2
    const camera = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.1, 600)
    camera.position.set(0, 250, 0)
    camera.up.set(0, 0, -1)
    camera.lookAt(0, 0, 0)
    // Gameplay uses a camera-sized moving ground/water patch and distance fog.
    // Give the photograph the full world without changing the live meshes permanently.
    const floor = game.world.floor.mesh
    const water = game.world.waterSurface.mesh
    const groundGeometry = new THREE.PlaneGeometry(game.terrain.size, game.terrain.size, 128, 128)
    groundGeometry.rotateX(-Math.PI / 2)
    groundGeometry.deleteAttribute('normal')
    const original = {
        geometry: floor.geometry, floorPosition: floor.position.clone(),
        waterPosition: water.position.clone(), waterScale: water.scale.clone(),
        near: game.fog.near.value, far: game.fog.far.value,
        reveal: game.reveal.distance.value,
        lightColor: game.lighting.colorUniform.value.clone(),
        lightIntensity: game.lighting.intensityUniform.value,
    }
    const hidden = new Map()
    const hide = object =>
    {
        if(!object || hidden.has(object)) return
        hidden.set(object, object.visible)
        object.visible = false
    }
    // No duplicate ship, cinematic fade, floating labels, or screen-space effects.
    Object.values(game.world.visualVehicle.parts).forEach(hide)
    hide(game.overlay.mesh)
    hide(game.view.speedLines?.mesh)
    game.world.flagshipLandmarks.landmarks.forEach(item => hide(item.sign))
    const previousTarget = renderer.getRenderTarget()
    try
    {
        floor.geometry = groundGeometry
        floor.position.set(0, 0, 0)
        water.position.set(0, game.water.surfaceElevation, 0)
        water.scale.setScalar(game.terrain.size)
        game.fog.near.value = 1000
        game.fog.far.value = 2000
        game.reveal.distance.value = 99999
        // Bake a readable daylight chart, independent of the current night cycle.
        game.lighting.colorUniform.value.set('#ffd2c2')
        game.lighting.intensityUniform.value = 1.2
        renderer.setRenderTarget(target)
        renderer.render(game.scene, camera)
    }
    catch(error)
    {
        target.dispose()
        throw error
    }
    finally
    {
        renderer.setRenderTarget(previousTarget)
        hidden.forEach((visible, object) => { object.visible = visible })
        floor.geometry = original.geometry
        floor.position.copy(original.floorPosition)
        water.position.copy(original.waterPosition)
        water.scale.copy(original.waterScale)
        game.fog.near.value = original.near
        game.fog.far.value = original.far
        game.reveal.distance.value = original.reveal
        game.lighting.colorUniform.value.copy(original.lightColor)
        game.lighting.intensityUniform.value = original.lightIntensity
        groundGeometry.dispose()
    }
    try
    {
        const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, resolution, resolution)
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = resolution
        const context = canvas.getContext('2d')
        const image = context.createImageData(resolution, resolution)
        // GPU rows start at the bottom; the chart's north (-Z) belongs at the top.
        const rowLength = resolution * 4
        for(let row = 0; row < resolution; row++)
            image.data.set(pixels.subarray(row * rowLength, (row + 1) * rowLength), (resolution - row - 1) * rowLength)
        context.putImageData(image, 0, 0)
        return canvas.toDataURL('image/png')
    }
    finally
    {
        target.dispose()
    }
}
