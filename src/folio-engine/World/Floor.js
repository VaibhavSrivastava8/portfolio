import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { abs, clamp, color, cos, float, Fn, materialNormal, max, min, mix, mul, normalWorld, positionLocal, positionWorld, sin, smoothstep, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class Floor
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '⏥ Floor',
                expanded: false,
            })
        }
        this.geometry = this.game.resources.terrainModel.scene.children[0].geometry
        this.subdivision = this.game.terrain.subdivision

        this.setVisual()
        this.setPhysical()
        this.setBedRock()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)
    }

    setVisual()
    {
        this.size = Math.round(this.game.view.optimalArea.radius * 2) + 1
        this.halfSize = this.size * 0.5
        this.cellSize = 1.5
        this.subdivisions = this.size / this.cellSize

        // Geometry
        let geometry = new THREE.PlaneGeometry(this.size, this.size, this.subdivisions, this.subdivisions)
        geometry.rotateX(-Math.PI * 0.5)
        geometry.deleteAttribute('normal')

        // Terrain data
        const terrainData = this.game.terrain.terrainNode(positionWorld.xz)

        // Island & Seabed elevation
        const sandDeep = uniform(color('#a17d52'))
        const sandShallow = uniform(color('#e2b678'))
        const islandGrass = uniform(color('#2d6a4f'))

        const colorNode = Fn(() =>
        {
            const height = this.game.terrain.elevationNode(positionWorld.xz)
            
            // Sand ripples
            const sandNoiseUv = positionWorld.xz.mul(0.06)
            const sandNoise = texture(this.game.noises.perlin, sandNoiseUv).r
            const sandColor = mix(sandDeep, sandShallow, sandNoise)

            // Beach to grass blend above sea level (-0.1 to +0.4)
            const grassFactor = smoothstep(float(-0.1), float(0.4), height)
            const lowLandColor = mix(sandColor, islandGrass, grassFactor)

            // Coastal mountain cliff rock colors: dark volcanic slate & weathered stone
            const cliffRockDark = uniform(color('#373d47'))
            const cliffRockLight = uniform(color('#596270'))
            const cliffRock = mix(cliffRockDark, cliffRockLight, sandNoise)

            // Mountain plateau moss & highland green
            const plateauMoss = uniform(color('#234938'))

            // Rock factor: elevations above +1.8m rise into steep coastal cliffs
            const rockFactor = smoothstep(float(1.5), float(3.2), height)
            
            // Plateau grass factor: flat high plateaus have highland greenery
            const highGrassFactor = smoothstep(float(3.8), float(6.2), height)
            const mountainSurface = mix(cliffRock, plateauMoss, highGrassFactor.mul(0.45))

            return mix(lowLandColor, mountainSurface, rockFactor)
        })()

        // Material
        const material = new MeshDefaultMaterial({
            colorNode: colorNode,
            normalNode: vec3(0, 1, 0),
            shadowNode: terrainData.g,
            hasWater: false,
            hasLightBounce: false,
            wireframe: false
        })

        // Displacement: Seabed at -2.0, islands rise up above water to +0.6 - +1.0
        material.positionNode = Fn(() =>
        {
            const newPosition = positionLocal
            newPosition.y.assign(this.game.terrain.elevationNode(positionWorld.xz))
            return newPosition
        })()

        // Mesh
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.receiveShadow = true
        // this.mesh.castShadow = true
        this.game.scene.add(this.mesh)

        // Resize
        this.game.viewport.events.on('throttleChange', () =>
        {
            this.size = Math.round(this.game.view.optimalArea.radius * 2) + 1
            this.halfSize = this.size * 0.5
            this.subdivisions = Math.min(100, Math.round(this.size / this.cellSize))
            
            geometry.dispose()
            
            geometry = new THREE.PlaneGeometry(this.size, this.size, this.subdivisions, this.subdivisions)
            geometry.rotateX(-Math.PI * 0.5)
            geometry.deleteAttribute('normal')

            this.mesh.geometry = geometry
        }, 2)

        if(this.game.debug.active)
        {
            this.debugPanel.addBinding(slabTextureFrequency, 'value', { label: 'slabTextureFrequency', min: 0, max: 1, step: 0.001 })
            this.debugPanel.addBinding(slabNoiseFrequency, 'value', { label: 'slabNoiseFrequency', min: 0, max: 0.1, step: 0.001 })
            this.game.debug.addThreeColorBinding(this.debugPanel, slabHighColor.value, 'slabHighColor')
            this.game.debug.addThreeColorBinding(this.debugPanel, slabLowColor.value, 'slabLowColor')
        }
    }

    setPhysical()
    {
        // Generate physics heightfield mathematically from authentic archipelago elevations
        // This eliminates all invisible curbs, ramps, and walls from the legacy car portfolio
        const rowsCount = 145
        const totalCount = rowsCount * rowsCount
        const heights = new Float32Array(totalCount)
        const terrainSize = this.game.terrain.size
        const halfExtent = terrainSize / 2

        const calcElev = this.game.terrain.getElevation

        for(let iz = 0; iz < rowsCount; iz++)
        {
            const wz = ((iz / (rowsCount - 1)) - 0.5) * terrainSize
            for(let ix = 0; ix < rowsCount; ix++)
            {
                const wx = ((ix / (rowsCount - 1)) - 0.5) * terrainSize
                const index = iz + ix * rowsCount
                heights[index] = calcElev(wx, wz)
            }
        }

        const object = this.game.objects.add(
            null,
            {
                type: 'fixed',
                friction: 0.2,
                restitution: 0.15,
                colliders: [
                    { shape: 'heightfield', parameters: [ rowsCount - 1, rowsCount - 1, heights, { x: terrainSize, y: 1, z: terrainSize } ], category: 'floor' }
                ]
            }
        )
        this.physical = object.physical
    }

    setBedRock()
    {
        this.bedRock = {}
        this.bedRock.halfHeight = 0.5
        this.bedRock.halfWidth = 6
        this.bedRock.enabled = false


        this.bedRock.physical = this.game.physics.getPhysical({
            type: 'kinematicPositionBased',
            position: new THREE.Vector3(0, this.game.water.depthElevation - this.bedRock.halfHeight, 0),
            frictionRule: 'min',
            friction: 0.5,
            enabled: true,
            colliders:
            [
                { shape: 'cuboid', parameters: [ this.bedRock.halfWidth, this.bedRock.halfHeight, this.bedRock.halfWidth ] },
            ]
        })
    }

    update()
    {
        this.mesh.position.x = Math.round(this.game.view.optimalArea.position.x / this.cellSize) * this.cellSize
        this.mesh.position.z = Math.round(this.game.view.optimalArea.position.z / this.cellSize) * this.cellSize

        // Bedrock
        if(
            Math.abs(this.game.player.position.x) > this.game.terrain.size / 2 - this.bedRock.halfWidth ||
            Math.abs(this.game.player.position.z) > this.game.terrain.size / 2 - this.bedRock.halfWidth
        )
        {
            if(!this.bedRock.enabled)
            {
                this.bedRock.enabled = true
                this.bedRock.physical.body.setEnabled(true)
            }
            const x = Math.round(this.game.player.position.x)
            const z = Math.round(this.game.player.position.z)
            this.bedRock.physical.body.setNextKinematicTranslation({
                x,
                y: this.game.water.depthElevation - this.bedRock.halfHeight,
                z
            })
            this.bedRock.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
        }
        else
        {
            if(this.bedRock.enabled)
            {
                this.bedRock.enabled = false
                this.bedRock.physical.body.setEnabled(false)
            }
        }
    }
}
