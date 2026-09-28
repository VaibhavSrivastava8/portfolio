import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { mul, max, step, output, color, sin, smoothstep, mix, matcapUV, float, mod, texture, transformNormalToView, uniformArray, varying, vertexIndex, rotateUV, cameraPosition, vec4, atan, vec3, vec2, modelWorldMatrix, Fn, attribute, uniform, normalWorld } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class Grass
{
    constructor()
    {
        this.game = Game.getInstance()

        // High-performance subdivision: 70x70 = 4,900 blades (94% reduction from legacy 78,400)
        this.subdivisions = 70
        const halfExtent = Math.min(45, this.game.view.optimalArea.radius || 45)
        this.size = halfExtent * 2
        this.count = this.subdivisions * this.subdivisions
        this.fragmentSize = this.size / this.subdivisions

        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)

        // Resize
        this.game.viewport.events.on('throttleChange', () =>
        {
            const halfExtent = Math.min(45, this.game.view.optimalArea.radius || 45)
            this.size = halfExtent * 2
            this.fragmentSize = this.size / this.subdivisions
            
            this.sizeUniform.value = this.size
            this.bladeWidth.value = 0.035
            this.bladeHeight.value = 0.22

            this.geometry.dispose()
            this.setGeometry()
            this.mesh.geometry = this.geometry
        }, 2)
    }

    setGeometry()
    {
        const position = new Float32Array(this.count * 3 * 2)
        const heightRandomness = new Float32Array(this.count * 3)

        for(let iX = 0; iX < this.subdivisions; iX++)
        {
            const fragmentX = (iX / this.subdivisions - 0.5) * this.size + this.fragmentSize * 0.5
            
            for(let iZ = 0; iZ < this.subdivisions; iZ++)
            {
                const fragmentZ = (iZ / this.subdivisions - 0.5) * this.size + this.fragmentSize * 0.5

                const i = (iX * this.subdivisions + iZ)
                const i3 = i * 3
                const i6 = i * 6

                // Center of the blade with jitter
                const positionX = fragmentX + (Math.random() - 0.5) * this.fragmentSize
                const positionZ = fragmentZ + (Math.random() - 0.5) * this.fragmentSize

                position[i6    ] = positionX
                position[i6 + 1] = positionZ

                position[i6 + 2] = positionX
                position[i6 + 3] = positionZ

                position[i6 + 4] = positionX
                position[i6 + 5] = positionZ

                // Randomness
                heightRandomness[i3    ] = Math.random()
                heightRandomness[i3 + 1] = Math.random()
                heightRandomness[i3 + 2] = Math.random()
            }
        }
        
        this.geometry = new THREE.BufferGeometry()
        this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1)
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 2))
        this.geometry.setAttribute('heightRandomness', new THREE.Float32BufferAttribute(heightRandomness, 1))
    }

    setMaterial()
    {
        this.center = uniform(new THREE.Vector2())

        const vertexLoopIndex = varying(vertexIndex.toFloat().mod(3))
        const tipness = varying(step(vertexLoopIndex, 0.5))
        const wind = varying(vec2())
        const bladePosition = varying(vec2())

        // Realistic grass lawn scale: 22 cm height, 3.5 cm width
        this.bladeWidth = uniform(0.035)
        this.bladeHeight = uniform(0.22)
        this.bladeHeightRandomness = uniform(0.35)
        this.sizeUniform = uniform(this.size)

        const bladeShape = uniformArray([
            // Tip
            0, 1,
            // Left side
            1, 0,
            // Right side
            -1, 0,
        ])

        const terrainData = this.game.terrain.terrainNode(bladePosition)
        const terrainDataGrass = terrainData.g
        const tipnessShadowMix = tipness.oneMinus().mul(terrainDataGrass)

        this.material = new MeshDefaultMaterial({
            colorNode: this.game.terrain.colorNode(terrainData),
            normalNode: vec3(0, 1, 0),
            hasWater: false,
            hasLightBounce: false,
            shadowNode: tipnessShadowMix
        })

        this.material.positionNode = Fn(() =>
        {
            // Blade position
            const position = attribute('position')

            const loopPosition = position.sub(this.center)
            const halfSize = this.sizeUniform.mul(0.5)
            loopPosition.x.assign(mod(loopPosition.x.add(halfSize), this.sizeUniform).sub(halfSize))
            loopPosition.y.assign(mod(loopPosition.y.add(halfSize), this.sizeUniform).sub(halfSize))

            const worldPosition = modelWorldMatrix.mul(vec3(loopPosition.x, 0, loopPosition.y).add(vec3(this.center.x, 0, this.center.y)))
            bladePosition.assign(worldPosition.xz)

            // Sample actual ground elevation from terrain
            const groundY = this.game.terrain.elevationNode(worldPosition.xz)

            // Sample terrain data at blade coordinates
            const bladeTerrainData = this.game.terrain.terrainNode(worldPosition.xz)
            const bladeGrassData = bladeTerrainData.g

            // Strict grass mask: only on elevated dry island ground, never in ocean or on sand
            const grassMask = smoothstep(float(0.35), float(0.65), bladeGrassData).mul(smoothstep(float(-0.05), float(0.15), groundY))

            // Realistic height variation
            const heightVariation = texture(this.game.noises.perlin, bladePosition.mul(0.0321)).r.add(0.5)
            const height = this.bladeHeight
                .mul(this.bladeHeightRandomness.mul(attribute('heightRandomness')).add(this.bladeHeightRandomness.oneMinus()))
                .mul(heightVariation)
                .mul(grassMask)

            const actualWidth = this.bladeWidth.mul(grassMask)

            // Base position sitting flush upon island ground
            const position3 = vec3(loopPosition.x, groundY, loopPosition.y).add(vec3(this.center.x, 0, this.center.y))

            // Blade triangle shape (collapses to degenerate 0-area point when grassMask is 0)
            const shape = vec3(
                bladeShape.element(vertexLoopIndex.mod(3).mul(2)).mul(actualWidth),
                bladeShape.element(vertexLoopIndex.mod(3).mul(2).add(1)).mul(height),
                0
            )

            // Vertex positioning
            const vertexPosition = position3.add(shape)

            // Vertex billboard rotation towards camera
            const angleToCamera = atan(worldPosition.z.sub(cameraPosition.z), worldPosition.x.sub(cameraPosition.x)).add(- Math.PI * 0.5)
            vertexPosition.xz.assign(rotateUV(vertexPosition.xz, angleToCamera, worldPosition.xz))

            // Subtle wind wave animation
            wind.assign(this.game.wind.offsetNode(worldPosition.xz).mul(tipness).mul(height).mul(2))
            vertexPosition.addAssign(vec3(wind.x, 0, wind.y))

            return vertexPosition
        })()

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '🌱 Grass',
                expanded: false,
            })

            debugPanel.addBinding(this.bladeWidth, 'value', { label: 'bladeWidth', min: 0, max: 0.2, step: 0.001 })
            debugPanel.addBinding(this.bladeHeight, 'value', { label: 'bladeHeight', min: 0, max: 1.0, step: 0.001 })
            debugPanel.addBinding(this.bladeHeightRandomness, 'value', { label: 'bladeHeightRandomness', min: 0, max: 1, step: 0.001 })
        }
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)
    }

    update()
    {
        this.center.value.set(this.game.view.optimalArea.position.x, this.game.view.optimalArea.position.z)
    }
}