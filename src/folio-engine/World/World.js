import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Floor } from './Floor.js'
import { Grid } from './Grid.js'
import { Grass } from './Grass.js'
import { color, float, Fn, instance, normalWorld, positionLocal, texture, vec3, vec4 } from 'three/tsl'
import { WaterSurface } from './WaterSurface.js'
import { Areas } from './Areas/Areas.js'
import { WindLines } from './WindLines.js'
import { Leaves } from './Leaves.js'
import { Lightnings } from './Lightnings.js'
import { Snow } from './Snow.js'
import { Whispers } from './Whispers.js'
import { VisualVehicle } from './VisualVehicle.js'
import { VisualTornado } from './VisualTornado.js'
import { Flowers } from './Flowers.js'
import { Bricks } from './Bricks.js'
import { Trees } from './Trees.js'
import { Bushes } from './Bushes.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { Fireballs } from './Fireballs.js'
import { ExplosiveCrates } from './ExplosiveCrates.js'
import { RainLines } from './RainLines.js'
import { Confetti } from './Confetti.js'
import { Intro } from './Intro.js'
import { PoleLights } from './PoleLights.js'
import { Lanterns } from './Lanterns.js'
import { Fences } from './Fences.js'
import { Benches } from './Benches.js'
import { Archipelago } from './Archipelago.js'
import { Monsters } from './Monsters.js'
import { NauticalAreas } from './Areas/NauticalAreas.js'
import { FlagshipLandmarks } from './FlagshipLandmarks.js'

export class World
{
    constructor()
    {
        this.game = Game.getInstance()

        this.step(0)

        // this.setAxesHelper()
        // this.setCollisionGroupsTest()
        // this.setNormalTest()
        // this.setTestMesh()
        // this.setTestShadow()
    }

    step(step)
    {
        if(step === 0)
        {
            this.grid = new Grid()
            this.intro = new Intro()
        }
        else if(step === 1)
        {
            this.visualVehicle = new VisualVehicle(this.game.resources.vehicle.scene)
            this.floor = new Floor()
            this.waterSurface = new WaterSurface()
            this.windLines = new WindLines()
            this.rain = new RainLines()
            this.lightnings = new Lightnings()
            this.archipelago = new Archipelago()
            this.monsters = new Monsters()
            this.nauticalAreas = new NauticalAreas()
            this.flagshipLandmarks = new FlagshipLandmarks()

            // Accurate procedural ground elevation for seating foliage firmly into island soil
            const getIslandElevation = (x, z) => {
                const getIsland = (cx, cz, r, peakH) => {
                    const d = Math.hypot(x - cx, z - cz) / r
                    if (d >= 1.0) return 0
                    if (d <= 0.2) return peakH
                    const t = (1.0 - d) / 0.8
                    return t * t * (3.0 - 2.0 * t) * peakH
                }

                const islands = [
                    getIsland(0, 0, 12.0, 3.4),       // Anchorage
                    getIsland(-66, 32, 14.5, 3.5),    // Shipwreck Cove
                    getIsland(69, 35, 14.5, 3.6),     // Citadel
                    getIsland(0, 100, 12.5, 2.8),     // Danger Reef
                    getIsland(54, -56, 14.0, 3.2),    // Coral Lagoon
                    getIsland(-39, 66, 13.0, 2.9),    // Serpent's Deep
                    getIsland(-49, -50, 14.0, 3.1),   // Dinosaur Shallows
                    getIsland(-34, 15, 7.5, 2.9),     // Smuggler's Cay
                    getIsland(36, 20, 7.5, 2.9),      // Cannon Cay
                    getIsland(34, -24, 7.5, 2.9),     // Mermaid's Rest
                    getIsland(-22, -27, 7.5, 2.8),    // Siren's Ridge
                    getIsland(-8, 50, 7.5, 2.9),      // Mist Haven
                    getIsland(66, -22, 7.5, 2.8),     // East Barrier
                    getIsland(-4, -52, 8.0, 3.0),     // Southern Beacon
                    getIsland(-90, 56, 5.0, 2.5),
                    getIsland(-58, 91, 5.0, 2.4),
                    getIsland(21, -46, 5.0, 2.4),
                    getIsland(14, 32, 5.0, 2.3),
                    getIsland(84, -46, 5.0, 2.5),
                    getIsland(-67, -22, 5.0, 2.5),
                    getIsland(49, 62, 5.5, 2.6),
                    getIsland(87, 6, 5.0, 2.4),
                    getIsland(20, 78, 5.0, 2.6),
                    getIsland(42, -87, 5.0, 2.4),
                    getIsland(-20, -74, 5.0, 2.4),
                ]
                let maxH = Math.max(...islands)

                // Perimeter coastal mountain elevation (Expanded 1.4x scale)
                const hw = 115.0, hh = 115.0, rBox = 20.0
                const qx = Math.abs(x) - hw + rBox
                const qz = Math.abs(z) - hh + rBox
                const mx = Math.max(qx, 0)
                const mz = Math.max(qz, 0)
                const outerDist = Math.hypot(mx, mz)
                const innerDist = Math.min(Math.max(qx, qz), 0)
                const sdBox = outerDist + innerDist - rBox
                const shoreNoise = Math.sin(x * 0.06 + z * 0.04) * 3.0 + Math.cos(x * 0.12 - z * 0.09) * 2.0
                const penetration = sdBox + shoreNoise
                const ramp = Math.max(0, Math.min(1, penetration / 14.0))
                const smoothRamp = ramp * ramp * (3.0 - 2.0 * ramp)
                const harm1 = Math.sin(x * 0.07 + z * 0.07) * 0.5 + 0.5
                const harm2 = Math.cos(x * 0.14 - z * 0.11) * 0.5 + 0.5
                const peakFactor = harm1 * 0.6 + harm2 * 0.4
                const plateauFactor = Math.sin(x * 0.045 - z * 0.045)
                const rawH = 4.5 + peakFactor * 8.0
                const plateauRatio = Math.max(0, Math.min(1, (plateauFactor - 0.15) / 0.15))
                const isPlateau = plateauRatio * plateauRatio * (3 - 2 * plateauRatio)
                const plateauH = rawH * (1 - isPlateau) + Math.min(rawH, 7.2) * isPlateau
                const crag = Math.sin(x * 0.28) * Math.cos(z * 0.28) * 0.4
                const mountainChain = Math.max(0, smoothRamp * plateauH + crag * smoothRamp)

                const groundY = Math.max(maxH, mountainChain) - 2.0
                return Math.max(0.1, groundY)
            }

            const makeTreeRefs = (coords) => coords.map((c) => {
                let x, y, z, s, r
                if (c.length === 4) {
                    [x, z, s = 1.0, r = 0] = c
                    y = getIslandElevation(x, z)
                } else {
                    [x, y, z, s = 1.0, r = 0] = c
                    if (y === null || y === undefined || y === 'auto') {
                        y = getIslandElevation(x, z)
                    }
                }
                const obj = new THREE.Object3D()
                obj.position.set(x, y, z)
                obj.scale.setScalar(s)
                obj.rotation.y = r
                obj.updateMatrix()
                obj.updateMatrixWorld(true)
                return obj
            })

            // 1. Royal Maritime Oaks - Rich deep emerald foliage across islands & peaks
            const oakCoords = [
                // The Anchorage (Spawn Island Groves)
                [6, -7, 1.25, 0.4], [8, -9, 1.3, -0.6], [-7, -7, 1.15, 0.8], [-8, -5, 1.2, -0.3],
                [-6, 5, 1.1, 1.2], [7, 4, 1.3, -1.0], [4, 8, 1.05, 0.5], [-5, 8, 1.15, -0.7],
                [1, -9, 1.1, 0.3], [-9, 0, 1.2, -0.9],
                // Shipwreck Cove (PDF Retype) - (-66, 32)
                [-63, 23, 1.3, 0.3], [-70, 25, 1.25, -0.5], [-73, 35, 1.4, 0.7], [-62, 39, 1.2, -0.8],
                [-58, 31, 1.1, 1.4], [-69, 42, 1.3, -0.2], [-54, 28, 1.15, 0.6], [-74, 30, 1.25, -1.1],
                // Citadel Fortress (Keep Me Stable) - (69, 35)
                [63, 28, 1.35, 0.5], [73, 31, 1.4, -0.4], [65, 42, 1.3, 0.9], [74, 39, 1.25, -1.1],
                [59, 35, 1.15, 0.2], [70, 45, 1.4, 0.7], [67, 24, 1.2, -0.5], [77, 35, 1.35, 1.3],
                // Coral Lagoon & Atoll (Hive) - (54, -56)
                [48, -60, 1.25, 0.6], [58, -62, 1.3, -0.7], [59, -50, 1.2, 0.4], [49, -48, 1.15, -0.9],
                [55, -56, 1.35, 1.1], [45, -56, 1.1, 0.2], [61, -56, 1.25, -0.4],
                // Dinosaur Shallows - (-49, -50)
                [-45, -55, 1.25, 0.5], [-53, -55, 1.3, -0.4], [-53, -45, 1.2, 0.9], [-44, -46, 1.15, -0.8],
                [-49, -59, 1.3, 0.3], [-56, -50, 1.2, -1.2], [-41, -50, 1.1, 0.7],
                // Serpent's Deep - (-39, 66)
                [-36, 60, 1.25, 0.4], [-44, 63, 1.3, -0.6], [-38, 72, 1.2, 0.8], [-45, 70, 1.15, -0.3],
                [-34, 66, 1.3, 1.2], [-40, 58, 1.1, -0.8],
                // Danger Reef - (0, 100)
                [-4, 98, 1.15, 0.2], [5, 99, 1.25, -0.5], [-3, 105, 1.2, 0.8], [4, 105, 1.1, -0.9],
                // Secondary Cays & Outposts
                [-32, 13, 1.15, 0.3], [-36, 17, 1.2, -0.7], [-31, 18, 1.05, 0.9], // Smuggler's Cay
                [35, 17, 1.15, -0.4], [39, 21, 1.25, 0.6], [34, 22, 1.05, -1.1], // Cannon Cay
                [32, -26, 1.15, 0.5], [36, -21, 1.2, -0.8],                       // Mermaid's Rest
                [-25, -24, 1.15, -0.3], [-20, -30, 1.2, 0.7],                     // Siren's Ridge
                [-10, 48, 1.15, 0.4], [-6, 53, 1.2, -0.6],                        // Mist Haven
                [64, -25, 1.15, -0.5], [69, -20, 1.25, 0.8],                      // East Barrier
                [-5, -55, 1.2, 0.3], [-2, -49, 1.15, -0.7],                       // Southern Beacon
                // Perimeter Mountain Ridges & Coastal Bluffs (Expanded 1.4x scale)
                [-95, -95, 1.4, 0.5], [-91, -84, 1.3, -0.4], [-98, 84, 1.4, 0.8], [-92, 95, 1.3, -0.6],
                [95, -95, 1.4, 0.3], [91, -84, 1.3, -0.9], [95, 95, 1.4, 0.7], [91, 84, 1.3, -0.2],
                [0, -104, 1.4, 0.4], [0, 110, 1.3, -0.5], [-104, 0, 1.4, 0.6], [104, 0, 1.4, -0.7]
            ]

            // 2. Autumn Gold & Amber Birch Trees - Warm vibrant tones across shores and trails
            const birchCoords = [
                // The Anchorage (Spawn Island)
                [9, -6, 1.15, 0.7], [-9, 3, 1.2, -0.4], [3, -9, 1.05, 1.1], [-4, -9, 1.15, -0.9],
                [8, 6, 1.2, 0.3], [-7, 7, 1.05, -0.6], [5, 6, 1.1, -0.3], [-8, -8, 1.15, 0.5],
                // Shipwreck Cove (PDF Retype) - (-66, 32)
                [-59, 25, 1.25, 0.8], [-71, 29, 1.15, -0.5], [-66, 38, 1.3, 0.3], [-60, 43, 1.05, -1.2],
                [-53, 35, 1.2, 0.6], [-64, 18, 1.1, 0.2], [-73, 39, 1.2, -0.7],
                // Citadel Fortress - (69, 35)
                [66, 25, 1.15, -0.3], [74, 35, 1.25, 0.8], [62, 39, 1.1, -0.7], [71, 46, 1.2, 0.4],
                [56, 31, 1.1, 0.9], [77, 41, 1.25, -0.6],
                // Coral Lagoon - (54, -56)
                [50, -59, 1.15, 0.5], [60, -57, 1.25, -0.8], [52, -52, 1.05, 1.2], [58, -48, 1.15, -0.4],
                [46, -52, 1.1, 0.6],
                // Dinosaur Shallows - (-49, -50)
                [-49, -48, 1.2, 0.7], [-55, -57, 1.15, -0.3], [-46, -57, 1.2, 0.9], [-52, -50, 1.05, -1.0],
                // Serpent's Deep - (-39, 66)
                [-39, 63, 1.2, -0.5], [-46, 66, 1.15, 0.6], [-35, 69, 1.25, -0.8], [-42, 73, 1.05, 0.3],
                // Danger Reef - (0, 100)
                [-1, 97, 1.15, 0.5], [3, 102, 1.2, -0.7], [-5, 102, 1.05, 1.0],
                // Secondary Cays
                [-35, 14, 1.1, -0.6], [-29, 17, 1.05, 0.4], // Smuggler's
                [38, 18, 1.15, 0.8], [32, 21, 1.05, -0.3],  // Cannon Cay
                [35, -25, 1.15, -0.7], [31, -22, 1.05, 0.5], // Mermaid's Rest
                [-21, -25, 1.1, 0.6], [-24, -31, 1.05, -0.8], // Siren's Ridge
                [-7, 50, 1.15, -0.4], [-11, 52, 1.05, 0.7],  // Mist Haven
                [67, -24, 1.15, 0.3], [63, -21, 1.05, -0.9], // East Barrier
                [-3, -53, 1.15, -0.5], [-7, -50, 1.05, 0.8], // Southern Beacon
                // Perimeter Mountain Ridges
                [-101, -87, 1.3, 0.4], [-87, -101, 1.2, -0.6], [-101, 87, 1.3, -0.3], [-87, 101, 1.2, 0.8],
                [101, -87, 1.3, 0.6], [87, -101, 1.2, -0.4], [101, 87, 1.3, -0.7], [87, 101, 1.2, 0.5],
                [-98, 28, 1.3, 0.3], [98, 28, 1.3, -0.5], [28, -98, 1.3, 0.7], [28, 98, 1.3, -0.4]
            ]

            // 3. Cherry Blossom Trees - Delicate sakura blooms for gardens, sanctuaries & sacred peaks
            const cherryCoords = [
                // Citadel Fortress Terraces & Gardens (Keep Me Stable) - (69, 35)
                [64, 22, 1.25, 0.2], [73, 25, 1.3, 0.9], [62, 31, 1.2, -0.4], [70, 34, 1.35, 0.6],
                [64, 36, 1.3, -0.8], [73, 42, 1.25, 1.1], [60, 46, 1.1, -0.5], [69, 49, 1.2, 0.3],
                [76, 36, 1.3, -0.9], [67, 28, 1.15, 0.4],
                // Coral Lagoon & Atoll (Hive Sanctuary) - (54, -56)
                [49, -53, 1.15, 1.2], [53, -59, 1.3, -0.6], [56, -53, 1.2, 0.4], [52, -63, 1.1, -0.9],
                [59, -60, 1.25, 0.7], [48, -63, 1.15, 0.3],
                // The Anchorage Village Green
                [5, -4, 1.05, 0.5], [-5, 1, 1.15, -0.6], [6, 1, 1.05, 1.2], [-3, 6, 1.1, -0.8],
                // Shipwreck Cove Cliffs - (-66, 32)
                [-64, 32, 1.2, 0.5], [-67, 35, 1.15, -0.7], [-62, 35, 1.2, 0.9],
                // Mermaid's Rest & Siren's Ridge
                [34, -22, 1.15, 0.4], [36, -24, 1.2, -0.5], [-22, -27, 1.15, 0.7], [-24, -25, 1.05, -0.3],
                // Highland Mountain Summits
                [92, 90, 1.35, 0.5], [-92, 90, 1.35, -0.4], [92, -90, 1.35, 0.8], [-92, -90, 1.35, -0.7]
            ]

            this.birchTrees = new Trees('Birch Tree', this.game.resources.birchTreesVisualModel.scene, makeTreeRefs(birchCoords), '#ff5a36', '#ffa64d')
            this.oakTrees = new Trees('Oak Tree', this.game.resources.oakTreesVisualModel.scene, makeTreeRefs(oakCoords), '#1b4332', '#2d6a4f')
            this.cherryTrees = new Trees('Cherry Tree', this.game.resources.cherryTreesVisualModel.scene, makeTreeRefs(cherryCoords), '#ff6d6d', '#ff9990')

            this.grass = new Grass()
            this.leaves = new Leaves()
        }
        else if(step === 2)
        {
            this.whispers = new Whispers()
        }
    }

    setPhysicalFloor()
    {
        this.game.objects.add(
            null,
            {
                type: 'fixed',
                friction: 0.25,
                restitution: 0,
                colliders: [
                    { shape: 'cuboid', parameters: [ 1000, 1, 1000 ], position: { x: 0, y: - 1.01, z: 0 }, category: 'floor' },
                ]
            }
        )
    }

    setTestKtx()
    {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshBasicNodeMaterial(),
        )
        mesh.material.outputNode = vec4(
            texture(this.game.resources.paletteTexture).rgb,
            1
        )
        mesh.position.copy(this.game.player.position)
        mesh.position.y += 2
        this.game.scene.add(mesh)
    }

    setTestShadow()
    {
        // Geometry
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

        // Material
        const material = new THREE.MeshLambertNodeMaterial()
        material.castShadowNode = vec4(0, 0, 0, 1)

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 2
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.game.scene.add(mesh)

        // // Receiver
        // const receiver = new THREE.Mesh(
        //     new THREE.PlaneGeometry(3, 3),
        //     new THREE.MeshLambertNodeMaterial()
        // )
        // receiver.rotation.x = - Math.PI * 0.5
        // receiver.position.y = 1
        // receiver.receiveShadow = true
        // receiver.castShadow = true
        // this.game.scene.add(receiver)
    }


    setTestMesh()
    {
        console.log(this.game.rendering.renderer.library)
        const testMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial()
        )
        // console.log(testMesh.material.outputNode = vec4(1, 0, 0, 1))
        // testMesh.material.outputNode = Fn(() =>
        // {
        //     return vec4(1, 0, 0, 1)
        // })()
        // setTimeout(() =>
        // {

        //     testMesh.material.outputNode = Fn(() =>
        //     {
        //         return vec4(1, 1, 0, 1)
        //     })()
        //     testMesh.material.needsUpdate = true
        // }, 2000)
        // testMesh.receiveShadow = true
        testMesh.position.z = 3
        this.game.scene.add(testMesh)

        // const testMesh2 = new THREE.Mesh(
        //     new THREE.SphereGeometry(1, 32, 32),
        //     new MeshDefaultMaterial({
        //         colorNode: color(0xffffff),
        //         hasCoreShadows: true,
        //         hasDropShadows: true,
        //     })
        // )
        // testMesh2.receiveShadow = true
        // testMesh2.position.x = 3
        // this.game.scene.add(testMesh2)
    }

    setAxesHelper()
    {
        const axesHelper = new THREE.AxesHelper()
        axesHelper.position.y = 0.1
        this.game.scene.add(axesHelper)
    }

    setCollisionGroupsTest()
    {
        // // Left (object)
        // this.game.objects.add(
        //     {
        //         type: 'dynamic',
        //         position: { x: 4, y: 2, z: 0.1 },
        //         colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'object' } ]
        //     }
        // )

        // Right (terrain)
        this.game.objects.add(
            null,
            {
                type: 'dynamic',
                position: { x: 4, y: 2, z: -1.1 },
                colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'floor' } ]
            }
        )

        // // Top (bumper)
        // this.game.objects.add(
        //     {
        //         type: 'dynamic',
        //         position: { x: 4, y: 4, z: -0.5 },
        //         colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'bumper' } ]
        //     }
        // )
    }

    // setNormalTest()
    // {
    //     const geometry = new THREE.IcosahedronGeometry(1, 2)

    //     const material = new THREE.MeshLambertNodeMaterial()

    //     material.normalNode = normalView
    //     // const newNormal = 
    //     // material.normalNode = vec3(0, 1, 0)

    //     // material.positionNode = Fn(() =>
    //     // {
    //     //     // materialNormal.assign(vec3(0, 1, 0))
    //     //     return positionGeometry
    //     // })()
    //     material.outputNode = vec4(transformedNormalWorld, 1)

    //     const mesh = new THREE.Mesh(geometry, material)
    //     mesh.position.y = 2

    //     this.game.scene.add(mesh)
    // }
}
