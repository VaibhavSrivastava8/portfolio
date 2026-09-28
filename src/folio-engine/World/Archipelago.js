import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class Archipelago
{
    constructor()
    {
        this.game = Game.getInstance()
        this.group = new THREE.Group()
        this.group.name = 'archipelago'
        this.game.scene.add(this.group)

        this.loader = new GLTFLoader()
        this.modelsCache = new Map()
        this.pendingModels = new Map()

        this.basePath = 'models/pirate_kit/Models/GLB format/'
        
        this.interactivePoints = []

        this.ready = this.init()
    }

    async loadGLTF(fileName)
    {
        if(this.modelsCache.has(fileName))
        {
            return this.modelsCache.get(fileName).clone()
        }

        if(this.pendingModels.has(fileName))
            return (await this.pendingModels.get(fileName)).clone()

        const pending = new Promise((resolve) =>
        {
            this.loader.load(
                `${this.basePath}${fileName}`,
                (gltf) =>
                {
                    this.modelsCache.set(fileName, gltf.scene)
                    resolve(gltf.scene)
                },
                undefined,
                (error) =>
                {
                    console.warn(`Could not load GLTF: ${fileName}`, error)
                    resolve(new THREE.Group())
                }
            )
        })
        this.pendingModels.set(fileName, pending)
        try { return (await pending).clone() }
        finally { this.pendingModels.delete(fileName) }
    }

    async addProp(fileName, position, rotation = [0, 0, 0], scale = [1, 1, 1], collider = null)
    {
        const model = await this.loadGLTF(fileName)
        model.position.set(...position)
        model.rotation.set(...rotation)
        model.scale.set(...scale)

        model.traverse((child) =>
        {
            if(child.isMesh)
            {
                child.castShadow = true
                child.receiveShadow = true
                const mats = Array.isArray(child.material) ? child.material : [child.material]
                for(const mat of mats)
                {
                    if(mat)
                    {
                        mat.roughness = 0.8
                        mat.metalness = 0.1
                        if(mat.map)
                        {
                            mat.map.colorSpace = THREE.SRGBColorSpace
                        }
                        // Clones share source materials; don't repeatedly prepend
                        // the filename and create a different shader for every prop.
                        if(!mat.name.startsWith(`${fileName}_`))
                            mat.name = `${fileName}_${mat.name || 'default'}`
                    }
                }
            }
        })

        // Convert to WebGPU compatible TSL materials
        this.game.materials.updateObject(model)
        this.group.add(model)

        // Add physics collider if specified
        if(collider && this.game.physics?.world)
        {
            const shape = collider.shape || 'cuboid'
            const parameters = collider.parameters || [1, 1, 1]
            const colPos = collider.position || { x: position[0], y: position[1] + parameters[1] * 0.5, z: position[2] }

            this.game.objects.add(
                null,
                {
                    type: 'fixed',
                    position: colPos,
                    colliders: [
                        { shape: shape, parameters: parameters }
                    ]
                }
            )
        }

        return model
    }

    async init()
    {
        const props = []
        const add = (...args) => props.push(this.addProp(...args))

        // =========================================================================
        // TIER 1: MAJOR STRONGHOLDS & REGIONAL CAPITAL ISLANDS
        // =========================================================================

        // 1. THE ANCHORAGE (Main Safe Harbor) - Center (0, 0)
        add('structure-platform-dock.glb', [0, 0.05, -7], [0, 0, 0], [1.8, 1.5, 2.2], { shape: 'cuboid', parameters: [3.5, 1, 4] })
        add('structure-platform-dock-small.glb', [4, 0.05, -6], [0, Math.PI * 0.5, 0], [1.5, 1.5, 1.5], { shape: 'cuboid', parameters: [2.5, 1, 2] })
        add('structure-platform-dock-small.glb', [-4, 0.05, -6], [0, -Math.PI * 0.5, 0], [1.5, 1.5, 1.5], { shape: 'cuboid', parameters: [2.5, 1, 2] })
        add('tower-complete-large.glb', [-8, 0.8, -10], [0, Math.PI * 0.2, 0], [1.4, 1.4, 1.4], { shape: 'cuboid', parameters: [3, 8, 3] })
        add('rocks-sand-a.glb', [8, 0.2, -10], [0, -Math.PI * 0.3, 0], [2.4, 2.4, 2.4], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('rocks-sand-b.glb', [-10, 0.1, 2], [0, Math.PI * 0.4, 0], [2.5, 2.0, 2.5], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('palm-detailed-bend.glb', [-7, 0.6, -6], [0, 0.5, 0], [1.8, 1.8, 1.8])
        add('palm-straight.glb', [7, 0.6, -8], [0, -0.8, 0], [1.6, 1.6, 1.6])
        add('flag-pirate-high.glb', [-2.5, 0.4, -5], [0, 0, 0], [1.2, 1.2, 1.2])
        add('crate.glb', [1.5, 0.6, -7], [0, 0.4, 0], [1.2, 1.2, 1.2])
        add('chest.glb', [-1.5, 0.6, -7], [0, -0.2, 0], [1.2, 1.2, 1.2])

        // 2. CITADEL FORTRESS (Ranisons Bastion & Royal Naval Port) - (69, 35)
        add('rocks-c.glb', [66, 0.4, 35], [0, 0.5, 0], [4.5, 3.5, 4.5], { shape: 'cuboid', parameters: [6, 4, 6] })
        add('rocks-sand-b.glb', [72, 0.4, 40], [0, 1.8, 0], [4.0, 3.5, 4.0], { shape: 'cuboid', parameters: [5, 4, 5] })
        add('castle-gate.glb', [66, 1.3, 35], [0, -Math.PI * 0.5, 0], [1.8, 1.8, 1.8], { shape: 'cuboid', parameters: [4, 6, 8] })
        add('castle-wall.glb', [66, 1.3, 43], [0, -Math.PI * 0.5, 0], [1.8, 1.8, 1.8], { shape: 'cuboid', parameters: [3, 5, 6] })
        add('castle-wall.glb', [66, 1.3, 27], [0, -Math.PI * 0.5, 0], [1.8, 1.8, 1.8], { shape: 'cuboid', parameters: [3, 5, 6] })
        add('tower-watch.glb', [72, 1.4, 47], [0, 0, 0], [1.6, 1.6, 1.6], { shape: 'cuboid', parameters: [3, 7, 3] })
        add('tower-watch.glb', [72, 1.4, 23], [0, 0, 0], [1.6, 1.6, 1.6], { shape: 'cuboid', parameters: [3, 7, 3] })
        add('cannon.glb', [60, 1.1, 32], [0, -Math.PI * 0.5, 0], [1.4, 1.4, 1.4])
        add('cannon.glb', [60, 1.1, 38], [0, -Math.PI * 0.5, 0], [1.4, 1.4, 1.4])
        add('structure-platform-dock.glb', [53, 0.05, 35], [0, Math.PI * 0.5, 0], [2.0, 1.5, 2.8], { shape: 'cuboid', parameters: [4, 1, 5] })
        add('flag-high.glb', [66, 3.4, 35], [0, -Math.PI * 0.5, 0], [1.6, 1.6, 1.6])

        // 3. SHIPWRECK COVE (PDF Retype & Pirate Haven) - (-66, 32)
        add('ship-wreck.glb', [-66, 0.4, 37], [0.1, Math.PI * 0.35, -0.15], [2.2, 2.2, 2.2], { shape: 'cuboid', parameters: [8, 6, 14] })
        add('rocks-sand-b.glb', [-72, 0.2, 35], [0, 1.2, 0], [3.8, 3.2, 3.8], { shape: 'cuboid', parameters: [6, 5, 6] })
        add('rocks-c.glb', [-59, 0.3, 21], [0, -0.8, 0], [3.2, 3.0, 3.2], { shape: 'cuboid', parameters: [5, 4, 5] })
        add('boat-row-large.glb', [-56, 0.2, 29], [0.1, 0.5, -0.1], [1.5, 1.5, 1.5])
        add('cannon.glb', [-69, 1.1, 26], [0, Math.PI * 0.6, 0], [1.3, 1.3, 1.3])
        add('chest.glb', [-62, 0.9, 24], [0, -0.4, 0], [1.3, 1.3, 1.3])
        add('palm-detailed-bend.glb', [-56, 0.8, 33], [0, -1.2, 0], [1.9, 1.9, 1.9])
        add('palm-detailed-straight.glb', [-67, 1.0, 20], [0, 0.4, 0], [1.7, 1.7, 1.7])
        add('flag-pirate-high.glb', [-64, 1.5, 18], [0, 0.2, 0], [1.4, 1.4, 1.4])

        // 4. CORAL LAGOON (Atolia Atoll & Siren's Sanctuary) - (54, -56)
        add('rocks-sand-c.glb', [48, 0.2, -53], [0, 2.3, 0], [3.4, 2.6, 3.4], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand-foliage.glb', [54, 0.5, -59], [0, 0.5, 0], [3.5, 1.5, 3.5])
        add('patch-sand.glb', [50, 0.4, -50], [0, -0.8, 0], [3.0, 1.5, 3.0])
        add('palm-detailed-bend.glb', [53, 0.8, -56], [0, -1.5, 0], [2.0, 2.0, 2.0])
        add('palm-bend.glb', [57, 0.7, -53], [0, 1.0, 0], [1.8, 1.8, 1.8])
        add('structure-platform-small.glb', [45, 0.1, -48], [0, 0.3, 0], [1.6, 1.5, 1.6], { shape: 'cuboid', parameters: [2.5, 1, 2.5] })
        add('chest.glb', [46, 0.5, -48], [0, 0.7, 0], [1.4, 1.4, 1.4])
        add('mast.glb', [39, 0.05, -43], [0.3, 0.4, -0.2], [1.6, 1.6, 1.6])

        // 5. DINOSAUR SHALLOWS (Prehistoric Spinosaurus Coast) - (-49, -50)
        add('rocks-sand-b.glb', [-49, 0.3, -50], [0, 0.5, 0], [4.2, 2.6, 4.2], { shape: 'cuboid', parameters: [6, 4, 6] })
        add('patch-sand-foliage.glb', [-46, 0.5, -47], [0, -0.8, 0], [3.2, 1.5, 3.2])
        add('patch-sand.glb', [-53, 0.4, -53], [0, 1.2, 0], [3.2, 1.5, 3.2])
        add('rocks-sand-a.glb', [-42, 0.1, -57], [0, -2.0, 0], [3.4, 2.8, 3.4], { shape: 'cuboid', parameters: [5, 4, 5] })
        add('palm-detailed-bend.glb', [-48, 0.8, -47], [0, 1.4, 0], [2.0, 2.0, 2.0])
        add('palm-straight.glb', [-52, 0.8, -52], [0, -0.6, 0], [1.8, 1.8, 1.8])
        add('flag-pirate-high.glb', [-46, 1.1, -45], [0, 0.3, 0], [1.3, 1.3, 1.3])

        // 6. DANGER REEF (Northern Abyss Gateway) - (0, 100)
        add('rocks-c.glb', [-7, 0.1, 96], [0, 0.8, 0], [3.6, 3.8, 3.6], { shape: 'cuboid', parameters: [5, 5, 5] })
        add('rocks-a.glb', [7, 0.1, 100], [0, -1.2, 0], [3.8, 4.2, 3.8], { shape: 'cuboid', parameters: [5, 6, 5] })
        add('mast.glb', [0, 0.2, 97], [0.35, 0.2, 0.45], [1.8, 1.8, 1.8])
        add('crate-bottles.glb', [3, 0.4, 96], [0, 0.4, 0], [1.3, 1.3, 1.3])

        // 7. SERPENT'S DEEP (Shark Shoals & Reef Shallows) - (-39, 66)
        add('rocks-sand-a.glb', [-39, 0.2, 66], [0, -0.5, 0], [3.5, 3.0, 3.5], { shape: 'cuboid', parameters: [5, 4, 5] })
        add('boat-row-small.glb', [-33, 0.1, 64], [0.15, -1.2, 0.1], [1.4, 1.4, 1.4])
        add('barrel.glb', [-36, 0.3, 67], [0.2, 0.3, -0.1], [1.3, 1.3, 1.3])
        add('rocks-b.glb', [-45, 0.1, 60], [0, 2.1, 0], [2.8, 2.5, 2.8], { shape: 'cuboid', parameters: [4, 3, 4] })

        // =========================================================================
        // TIER 2: NAMED SECONDARY CAYS & CHANNEL OUTPOSTS
        // =========================================================================

        // 8. SMUGGLER'S CAY - Western Channel Hideout (-34, 15)
        add('rocks-sand-a.glb', [-34, 0.2, 15], [0, 0.4, 0], [3.0, 2.4, 3.0], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand.glb', [-32, 0.4, 17], [0, -0.5, 0], [2.6, 1.5, 2.6])
        add('palm-detailed-bend.glb', [-35, 0.8, 14], [0, 1.2, 0], [1.8, 1.8, 1.8])
        add('boat-row-large.glb', [-31, 0.2, 18], [0.1, 0.8, -0.1], [1.4, 1.4, 1.4])
        add('barrel.glb', [-30, 0.4, 15], [0, 0.2, 0], [1.3, 1.3, 1.3])
        add('chest.glb', [-34, 0.5, 17], [0, 0.5, 0], [1.2, 1.2, 1.2])

        // 9. CANNON CAY - Eastern Channel Outpost (36, 20)
        add('rocks-sand-b.glb', [36, 0.2, 20], [0, -0.7, 0], [3.2, 2.4, 3.2], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand-foliage.glb', [35, 0.4, 21], [0, 0.3, 0], [2.4, 1.4, 2.4])
        add('tower-complete-small.glb', [38, 0.6, 18], [0, -Math.PI * 0.3, 0], [1.3, 1.3, 1.3], { shape: 'cuboid', parameters: [2, 5, 2] })
        add('cannon.glb', [34, 0.5, 23], [0, -Math.PI * 0.5, 0], [1.3, 1.3, 1.3])
        add('palm-straight.glb', [39, 0.8, 21], [0, -1.0, 0], [1.7, 1.7, 1.7])

        // 10. MERMAID'S REST ATOLL - Southeastern Stepping Cay (34, -24)
        add('rocks-c.glb', [34, 0.2, -24], [0, 1.8, 0], [2.8, 2.5, 2.8], { shape: 'cuboid', parameters: [3.5, 3, 3.5] })
        add('patch-sand.glb', [32, 0.4, -22], [0, 0.6, 0], [2.6, 1.5, 2.6])
        add('palm-detailed-bend.glb', [35, 0.8, -25], [0, -2.1, 0], [1.8, 1.8, 1.8])
        add('flag-pirate-pennant.glb', [31, 0.6, -21], [0, 0.4, 0], [1.3, 1.3, 1.3])
        add('crate.glb', [34, 0.5, -21], [0.1, 0.5, 0], [1.2, 1.2, 1.2])

        // 11. SIREN'S RIDGE - Southwestern Shallows Outcrop (-22, -27)
        add('rocks-sand-c.glb', [-22, 0.2, -27], [0, -1.2, 0], [3.2, 2.4, 3.2], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand.glb', [-21, 0.4, -25], [0, 0, 0], [2.4, 1.4, 2.4])
        add('mast.glb', [-24, 0.2, -28], [0.25, 0.4, -0.2], [1.6, 1.6, 1.6])
        add('palm-bend.glb', [-20, 0.7, -25], [0, 0.8, 0], [1.7, 1.7, 1.7])

        // 12. MIST HAVEN ISLET - North-Central Channel Haven (-8, 50)
        add('rocks-b.glb', [-8, 0.2, 50], [0, 0.5, 0], [3.2, 2.6, 3.2], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand-foliage.glb', [-7, 0.4, 52], [0, -0.4, 0], [2.6, 1.5, 2.6])
        add('structure-platform-small.glb', [-10, 0.2, 49], [0, Math.PI * 0.25, 0], [1.5, 1.4, 1.5], { shape: 'cuboid', parameters: [2, 1, 2] })
        add('palm-straight.glb', [-6, 0.8, 53], [0, 1.5, 0], [1.8, 1.8, 1.8])
        add('chest.glb', [-8, 0.5, 50], [0, -0.3, 0], [1.3, 1.3, 1.3])

        // 13. EAST BARRIER REEF - Protective Eastern Ridge (66, -22)
        add('rocks-sand-a.glb', [66, 0.2, -22], [0, -2.2, 0], [3.4, 2.6, 3.4], { shape: 'cuboid', parameters: [4, 3, 4] })
        add('patch-sand.glb', [64, 0.4, -21], [0, 0.2, 0], [2.4, 1.3, 2.4])
        add('palm-detailed-bend.glb', [67, 0.8, -24], [0, 0.7, 0], [1.7, 1.7, 1.7])
        add('barrel.glb', [63, 0.4, -22], [0.1, 0.2, 0], [1.3, 1.3, 1.3])

        // 14. SOUTHERN BEACON WATCH - Far-South Sentinel Outpost (-4, -52)
        add('structure-platform-dock-small.glb', [-4, 0.1, -52], [0, 0, 0], [2.2, 1.5, 2.2], { shape: 'cuboid', parameters: [3, 1, 3] })
        add('tower-watch.glb', [0, 0.4, -53], [0, Math.PI * 0.4, 0], [1.5, 1.5, 1.5], { shape: 'cuboid', parameters: [2, 6, 2] })
        add('palm-detailed-bend.glb', [-8, 0.7, -50], [0, -1.5, 0], [1.9, 1.9, 1.9])
        add('flag-pirate-high.glb', [-4, 0.8, -49], [0, 0, 0], [1.4, 1.4, 1.4])
        add('crate-bottles.glb', [-2, 0.5, -52], [0, 0.5, 0], [1.3, 1.3, 1.3])

        // =========================================================================
        // TIER 3: NAUTICAL REEFS, WRECKS, RUINS & SEA STACKS
        // =========================================================================

        // 15. The Ghost Galleon & Flotsam Shallows (-90, 56)
        add('ship-ghost.glb', [-90, -0.4, 56], [0.1, Math.PI * 0.6, -0.1], [1.8, 1.8, 1.8], { shape: 'cuboid', parameters: [5, 4, 8] })
        add('rocks-c.glb', [-86, 0.1, 59], [0, 1.1, 0], [2.8, 2.8, 2.8], { shape: 'cuboid', parameters: [4, 4, 4] })

        // 16. Merchant's Graveyard Shallows (-58, 91)
        add('mast-ropes.glb', [-58, 0.1, 91], [0.2, -0.4, 0.1], [1.6, 1.6, 1.6])
        add('crate.glb', [-55, 0.1, 92], [0.1, 0.6, 0.1], [1.3, 1.3, 1.3])
        add('barrel.glb', [-60, 0.05, 90], [-0.1, 1.2, 0.2], [1.3, 1.3, 1.3])

        // 17. Siren's Shallows Sandbar & Lost Dinghy (21, -46)
        add('patch-sand.glb', [21, 0.15, -46], [0, 0.5, 0], [2.8, 1.2, 2.8])
        add('boat-row-small.glb', [20, 0.2, -45], [0.15, 0.9, -0.1], [1.3, 1.3, 1.3])

        // 18. Shore Landing Pier & Outpost Flag (At water's edge on Cannon Cay)
        add('structure-platform-small.glb', [31, 0.05, 20], [0, -Math.PI * 0.5, 0], [1.4, 1.4, 1.4], { shape: 'cuboid', parameters: [2, 1, 2] })
        add('flag-high-pennant.glb', [31, 0.55, 20], [0, Math.PI * 0.25, 0], [1.3, 1.3, 1.3])

        // 19. Coral Shoal Spire (84, -46)
        add('rocks-sand-a.glb', [84, 0.2, -46], [0, 0.8, 0], [3.2, 3.8, 3.2], { shape: 'cuboid', parameters: [4, 5, 4] })

        // 20. South-West Reef Outcrop (-67, -22)
        add('rocks-b.glb', [-67, 0.1, -22], [0, -1.4, 0], [3.2, 2.8, 3.2], { shape: 'cuboid', parameters: [4, 4, 4] })

        // 21. Ancient Sea Fortress Ruins (49, 62)
        add('castle-gate.glb', [49, 0.2, 62], [0, Math.PI * 0.25, 0], [1.4, 1.4, 1.4], { shape: 'cuboid', parameters: [3, 4, 5] })
        add('rocks-c.glb', [46, 0.1, 59], [0, -0.5, 0], [2.8, 2.5, 2.8], { shape: 'cuboid', parameters: [4, 3, 4] })

        // 22. Eastern Deep Spire & Wreck (87, 6)
        add('rocks-a.glb', [87, 0.1, 6], [0, 1.7, 0], [3.0, 3.5, 3.0], { shape: 'cuboid', parameters: [4, 5, 4] })
        add('mast.glb', [84, 0.05, 8], [0.3, 0.5, -0.2], [1.5, 1.5, 1.5])

        // 23. Abyssal Trench Sentinel Rocks (20, 78)
        add('rocks-c.glb', [20, 0.1, 78], [0, -0.6, 0], [3.4, 3.8, 3.4], { shape: 'cuboid', parameters: [4, 5, 4] })

        // 24. North-East Atoll Sandbar (42, -87)
        add('patch-sand.glb', [42, 0.1, -87], [0, 0.9, 0], [2.8, 1.2, 2.8])
        add('boat-row-large.glb', [43, 0.15, -86], [0.1, -0.7, 0.1], [1.3, 1.3, 1.3])

        // 25. South Sand Spit (-20, -74)
        add('patch-sand.glb', [-20, 0.1, -74], [0, -0.3, 0], [2.6, 1.2, 2.6])
        add('barrel.glb', [-19, 0.2, -73], [0, 0.8, 0], [1.2, 1.2, 1.2])

        // =========================================================================
        // TIER 4: ATMOSPHERIC SHIPS & ISLAND SHORELINE BARRELS
        // =========================================================================

        // 26. Royal Navy Flagship Patrol (Anchored in Citadel Bay) (58, 23)
        add('ship-large.glb', [58, -0.3, 23], [0.03, -Math.PI * 0.45, 0.02], [1.5, 1.5, 1.5], { shape: 'cuboid', parameters: [2, 2, 4] })

        // 27. Smuggler's Corsair Sloop (Anchored off Smuggler's Cay) (-42, 24)
        add('ship-pirate-medium.glb', [-42, -0.3, 24], [0.02, Math.PI * 0.35, -0.02], [1.4, 1.4, 1.4], { shape: 'cuboid', parameters: [2, 2, 4] })

        // 28. Merchant Sloop & Atoll Trader (Anchored in Southern Passage) (25, -53)
        add('ship-small.glb', [25, -0.25, -53], [0.02, Math.PI * 0.8, 0.01], [1.4, 1.4, 1.4], { shape: 'cuboid', parameters: [2, 2, 3] })

        // 29. Coastal Island Shoreline Barrels (Moored close to water on side of islands)
        const shoreBarrels = [
            // The Anchorage shoreline edges
            [-9.0, 0.05, 9.0],
            [11.0, 0.05, 2.0],
            [3.5, 0.05, -10.5],
            [-11.0, 0.05, -1.5],
            // Cannon Cay shoreline
            [31.5, 0.05, 17.5],
            [35.0, 0.05, 15.0],
            // Smuggler's Cay shoreline
            [-29.0, 0.05, 14.5],
            [-32.0, 0.05, 20.0],
            // Mist Haven shoreline
            [-7.5, 0.05, 46.0],
            [-3.5, 0.05, 51.0],
            // Mermaid's Rest shoreline
            [31.5, 0.05, -20.5],
            // Siren's Ridge shoreline
            [-18.0, 0.05, -24.5],
            // Citadel Fortress shoreline
            [58.0, 0.05, 33.0],
            // Shipwreck Cove shoreline
            [-59.0, 0.05, 25.0],
            // Coral Lagoon shoreline
            [48.0, 0.05, -52.0]
        ]
        for(const [bx, by, bz] of shoreBarrels)
        {
            add('barrel.glb', [bx, by, bz], [Math.random() * 0.15, Math.random() * Math.PI, Math.random() * 0.15], [1.2, 1.2, 1.2])
        }

        // =========================================================================
        // TIER 5: CONTINUOUS COASTAL MOUNTAIN, CLIFF & PLATEAU CHAIN (World Perimeter - Expanded 1.4x scale)
        // =========================================================================

        // --- 1. Four Corner Mountain Summits & Bastion Crags (+/- 123m) ---
        // North-West Mountain Crag: Mount Sentinel (-123, 123)
        add('rocks-a.glb', [-123, 1.5, 123], [0, 0.4, 0], [5.5, 5.0, 5.5], { shape: 'cuboid', parameters: [8, 7, 8] })
        add('rocks-sand-a.glb', [-118, 0.8, 119], [0, -0.6, 0], [4.5, 4.0, 4.5], { shape: 'cuboid', parameters: [6, 5, 6] })
        add('tower-watch.glb', [-124, 4.5, 124], [0, -Math.PI * 0.25, 0], [1.8, 2.2, 1.8], { shape: 'cuboid', parameters: [4, 8, 4] })
        add('flag-pirate-high.glb', [-124, 8.5, 124], [0, Math.PI * 0.4, 0], [1.6, 1.6, 1.6])
        add('palm-detailed-bend.glb', [-115, 1.5, 118], [0, Math.PI * 0.3, 0], [2.0, 2.0, 2.0])

        // North-East Mountain Crag: Dragon's Tooth Peak (123, 123)
        add('rocks-b.glb', [123, 1.5, 123], [0, -0.6, 0], [5.5, 5.0, 5.5], { shape: 'cuboid', parameters: [8, 7, 8] })
        add('rocks-sand-b.glb', [119, 0.8, 118], [0, 0.8, 0], [4.5, 4.0, 4.5], { shape: 'cuboid', parameters: [6, 5, 6] })
        add('tower-watch.glb', [124, 4.5, 124], [0, Math.PI * 0.75, 0], [1.8, 2.2, 1.8], { shape: 'cuboid', parameters: [4, 8, 4] })
        add('flag-high-pennant.glb', [124, 8.5, 124], [0, -Math.PI * 0.2, 0], [1.6, 1.6, 1.6])
        add('palm-detailed-straight.glb', [116, 1.5, 119], [0, -Math.PI * 0.4, 0], [2.0, 2.0, 2.0])

        // South-West Mountain Crag: Kraken's Horn (-123, -123)
        add('rocks-c.glb', [-123, 1.5, -123], [0, 1.2, 0], [5.5, 5.0, 5.5], { shape: 'cuboid', parameters: [8, 7, 8] })
        add('rocks-sand-c.glb', [-119, 0.8, -118], [0, -0.5, 0], [4.5, 4.0, 4.5], { shape: 'cuboid', parameters: [6, 5, 6] })
        add('tower-watch.glb', [-124, 4.5, -124], [0, Math.PI * 0.25, 0], [1.8, 2.2, 1.8], { shape: 'cuboid', parameters: [4, 8, 4] })
        add('flag-high.glb', [-124, 8.5, -124], [0, Math.PI * 0.6, 0], [1.6, 1.6, 1.6])
        add('palm-detailed-bend.glb', [-116, 1.5, -119], [0, Math.PI * 0.9, 0], [2.0, 2.0, 2.0])

        // South-East Mountain Crag: Siren's Bastion (123, -123)
        add('rocks-a.glb', [123, 1.5, -123], [0, -1.5, 0], [5.5, 5.0, 5.5], { shape: 'cuboid', parameters: [8, 7, 8] })
        add('rocks-sand-a.glb', [118, 0.8, -119], [0, 0.7, 0], [4.5, 4.0, 4.5], { shape: 'cuboid', parameters: [6, 5, 6] })
        add('tower-watch.glb', [124, 4.5, -124], [0, -Math.PI * 0.75, 0], [1.8, 2.2, 1.8], { shape: 'cuboid', parameters: [4, 8, 4] })
        add('flag-pirate-high-pennant.glb', [124, 8.5, -124], [0, -Math.PI * 0.5, 0], [1.6, 1.6, 1.6])
        add('palm-detailed-straight.glb', [118, 1.5, -116], [0, -Math.PI * 0.8, 0], [2.0, 2.0, 2.0])

        // --- 2. Northern Mountain Range & Sea Cliffs (z = 120 to 128) ---
        // Promontory Peak 1 (-95, 124)
        add('rocks-sand-b.glb', [-95, 1.0, 125], [0, 0.5, 0], [4.5, 4.5, 4.5], { shape: 'cuboid', parameters: [6, 6, 6] })
        add('rocks-b.glb', [-90, 1.8, 127], [0, -0.4, 0], [4.2, 4.8, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        // Valley Inlet 1 (-70, 120)
        add('palm-detailed-bend.glb', [-70, 1.0, 122], [0, 1.2, 0], [2.0, 2.0, 2.0])
        add('patch-sand-foliage.glb', [-67, 0.6, 120], [0, 0.3, 0], [3.5, 1.5, 3.5])
        // Coastal Plateau 1 (-48, 124)
        add('rocks-sand-c.glb', [-48, 1.2, 125], [0, -0.8, 0], [5.0, 4.0, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-c.glb', [-42, 2.0, 128], [0, 0.6, 0], [4.0, 5.0, 4.0], { shape: 'cuboid', parameters: [5, 6, 5] })
        add('flag-pirate-pennant.glb', [-48, 4.5, 125], [0, 0.2, 0], [1.5, 1.5, 1.5])
        // High Peak 2: Mount Royal (0, 126)
        add('rocks-sand-a.glb', [-3, 1.5, 123], [0, 0.2, 0], [5.2, 5.2, 5.2], { shape: 'cuboid', parameters: [7, 7, 7] })
        add('tower-watch.glb', [0, 3.5, 127], [0, Math.PI, 0], [2.0, 2.4, 2.0], { shape: 'cuboid', parameters: [4.5, 8, 4.5] })
        add('flag-pirate-high.glb', [0, 7.5, 127], [0, 0, 0], [1.8, 1.8, 1.8])
        add('rocks-a.glb', [5, 1.8, 126], [0, 1.1, 0], [4.8, 5.0, 4.8], { shape: 'cuboid', parameters: [6, 6, 6] })
        // Valley Inlet 2 (25, 120)
        add('palm-straight.glb', [25, 1.0, 122], [0, 0.8, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 2 (50, 124)
        add('rocks-sand-a.glb', [50, 1.2, 125], [0, 1.1, 0], [5.0, 4.2, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-b.glb', [56, 2.0, 128], [0, -0.7, 0], [4.2, 5.0, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        add('palm-detailed-bend.glb', [48, 1.5, 122], [0, -0.9, 0], [2.0, 2.0, 2.0])
        // Promontory Peak 3 (91, 124)
        add('rocks-sand-b.glb', [91, 1.2, 125], [0, -1.4, 0], [4.8, 4.5, 4.8], { shape: 'cuboid', parameters: [6.5, 6, 6.5] })
        add('tower-watch.glb', [95, 3.5, 126], [0, -Math.PI * 0.4, 0], [1.6, 1.8, 1.6], { shape: 'cuboid', parameters: [3.5, 6, 3.5] })

        // --- 3. Southern Coastal Palisades & Fjord (z = -120 to -128) ---
        // Promontory Peak 1 (-95, -124)
        add('rocks-sand-c.glb', [-95, 1.0, -125], [0, -0.7, 0], [4.5, 4.5, 4.5], { shape: 'cuboid', parameters: [6, 6, 6] })
        add('rocks-c.glb', [-90, 1.8, -127], [0, 0.8, 0], [4.2, 4.8, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        // Valley Inlet 1 (-70, -120)
        add('palm-detailed-straight.glb', [-70, 1.0, -122], [0, -1.1, 0], [2.0, 2.0, 2.0])
        add('patch-sand-foliage.glb', [-67, 0.6, -120], [0, -0.3, 0], [3.5, 1.5, 3.5])
        // Coastal Plateau 1 (-48, -124)
        add('rocks-sand-a.glb', [-48, 1.2, -125], [0, 0.9, 0], [5.0, 4.0, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-a.glb', [-42, 2.0, -128], [0, -0.5, 0], [4.0, 5.0, 4.0], { shape: 'cuboid', parameters: [5, 6, 5] })
        add('flag-high.glb', [-48, 4.5, -125], [0, Math.PI * 0.5, 0], [1.5, 1.5, 1.5])
        // High Peak 2: Southern Citadel Bluff (0, -126)
        add('rocks-sand-b.glb', [-3, 1.5, -123], [0, -0.3, 0], [5.2, 5.2, 5.2], { shape: 'cuboid', parameters: [7, 7, 7] })
        add('tower-watch.glb', [0, 3.5, -127], [0, 0, 0], [2.0, 2.4, 2.0], { shape: 'cuboid', parameters: [4.5, 8, 4.5] })
        add('flag-high-pennant.glb', [0, 7.5, -127], [0, Math.PI, 0], [1.8, 1.8, 1.8])
        add('rocks-b.glb', [5, 1.8, -126], [0, -0.9, 0], [4.8, 5.0, 4.8], { shape: 'cuboid', parameters: [6, 6, 6] })
        // Valley Inlet 2 (25, -120)
        add('palm-detailed-bend.glb', [25, 1.0, -122], [0, -0.6, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 2 (50, -124)
        add('rocks-sand-b.glb', [50, 1.2, -125], [0, -1.2, 0], [5.0, 4.2, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-c.glb', [56, 2.0, -128], [0, 0.4, 0], [4.2, 5.0, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        add('palm-straight.glb', [48, 1.5, -122], [0, 0.4, 0], [2.0, 2.0, 2.0])
        // Promontory Peak 3 (91, -124)
        add('rocks-sand-c.glb', [91, 1.2, -125], [0, 1.6, 0], [4.8, 4.5, 4.8], { shape: 'cuboid', parameters: [6.5, 6, 6.5] })
        add('tower-watch.glb', [95, 3.5, -126], [0, Math.PI * 0.3, 0], [1.6, 1.8, 1.6], { shape: 'cuboid', parameters: [3.5, 6, 3.5] })

        // --- 4. Western Sea Cliffs & Plateaus (x = -120 to -128) ---
        // Promontory Peak 1 (-124, -95)
        add('rocks-sand-a.glb', [-125, 1.0, -95], [0, 1.4, 0], [4.5, 4.5, 4.5], { shape: 'cuboid', parameters: [6, 6, 6] })
        add('rocks-a.glb', [-127, 1.8, -90], [0, -0.8, 0], [4.2, 4.8, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        // Valley Inlet 1 (-120, -70)
        add('palm-detailed-bend.glb', [-122, 1.0, -70], [0, -0.8, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 1 (-124, -48)
        add('rocks-sand-b.glb', [-125, 1.2, -48], [0, -0.6, 0], [5.0, 4.0, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-b.glb', [-128, 2.0, -42], [0, 0.5, 0], [4.0, 5.0, 4.0], { shape: 'cuboid', parameters: [5, 6, 5] })
        add('flag-pirate-high.glb', [-125, 4.5, -48], [0, Math.PI * 0.3, 0], [1.5, 1.5, 1.5])
        // High Peak 2: Western Watch Bluff (-126, 0)
        add('rocks-sand-c.glb', [-123, 1.5, -3], [0, 0.8, 0], [5.2, 5.2, 5.2], { shape: 'cuboid', parameters: [7, 7, 7] })
        add('tower-watch.glb', [-127, 3.5, 0], [0, Math.PI * 0.5, 0], [2.0, 2.4, 2.0], { shape: 'cuboid', parameters: [4.5, 8, 4.5] })
        add('flag-pirate-high-pennant.glb', [-127, 7.5, 0], [0, 0, 0], [1.8, 1.8, 1.8])
        add('rocks-c.glb', [-126, 1.8, 5], [0, -1.1, 0], [4.8, 5.0, 4.8], { shape: 'cuboid', parameters: [6, 6, 6] })
        // Valley Inlet 2 (-120, 25)
        add('palm-straight.glb', [-122, 1.0, 25], [0, 1.1, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 2 (-124, 50)
        add('rocks-sand-c.glb', [-125, 1.2, 50], [0, 0.8, 0], [5.0, 4.2, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-a.glb', [-128, 2.0, 56], [0, -0.6, 0], [4.2, 5.0, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        add('palm-detailed-bend.glb', [-122, 1.5, 48], [0, -1.3, 0], [2.0, 2.0, 2.0])
        // Promontory Peak 3 (-124, 91)
        add('rocks-sand-a.glb', [-125, 1.2, 91], [0, -1.5, 0], [4.8, 4.5, 4.8], { shape: 'cuboid', parameters: [6.5, 6, 6.5] })
        add('tower-watch.glb', [-126, 3.5, 95], [0, -Math.PI * 0.6, 0], [1.6, 1.8, 1.6], { shape: 'cuboid', parameters: [3.5, 6, 3.5] })

        // --- 5. Eastern Mountain Peaks & Bluffs (x = 120 to 128) ---
        // Promontory Peak 1 (124, -95)
        add('rocks-sand-b.glb', [125, 1.0, -95], [0, -1.1, 0], [4.5, 4.5, 4.5], { shape: 'cuboid', parameters: [6, 6, 6] })
        add('rocks-b.glb', [127, 1.8, -90], [0, 0.7, 0], [4.2, 4.8, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        // Valley Inlet 1 (120, -70)
        add('palm-detailed-straight.glb', [122, 1.0, -70], [0, 0.7, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 1 (124, -48)
        add('rocks-sand-c.glb', [125, 1.2, -48], [0, 1.3, 0], [5.0, 4.0, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-c.glb', [128, 2.0, -42], [0, -0.8, 0], [4.0, 5.0, 4.0], { shape: 'cuboid', parameters: [5, 6, 5] })
        add('flag-high.glb', [125, 4.5, -48], [0, -Math.PI * 0.4, 0], [1.5, 1.5, 1.5])
        // High Peak 2: Eastern Bastion Peak (126, 0)
        add('rocks-sand-a.glb', [123, 1.5, -3], [0, -0.7, 0], [5.2, 5.2, 5.2], { shape: 'cuboid', parameters: [7, 7, 7] })
        add('tower-watch.glb', [127, 3.5, 0], [0, -Math.PI * 0.5, 0], [2.0, 2.4, 2.0], { shape: 'cuboid', parameters: [4.5, 8, 4.5] })
        add('flag-high-pennant.glb', [127, 7.5, 0], [0, Math.PI, 0], [1.8, 1.8, 1.8])
        add('rocks-a.glb', [126, 1.8, 5], [0, 0.9, 0], [4.8, 5.0, 4.8], { shape: 'cuboid', parameters: [6, 6, 6] })
        // Valley Inlet 2 (120, 25)
        add('palm-detailed-bend.glb', [122, 1.0, 25], [0, -0.9, 0], [2.0, 2.0, 2.0])
        // Coastal Plateau 2 (124, 50)
        add('rocks-sand-a.glb', [125, 1.2, 50], [0, -0.7, 0], [5.0, 4.2, 5.0], { shape: 'cuboid', parameters: [7, 6, 7] })
        add('rocks-b.glb', [128, 2.0, 56], [0, 1.0, 0], [4.2, 5.0, 4.2], { shape: 'cuboid', parameters: [5.5, 6, 5.5] })
        add('palm-straight.glb', [122, 1.5, 48], [0, 1.2, 0], [2.0, 2.0, 2.0])
        // Promontory Peak 3 (124, 91)
        add('rocks-sand-b.glb', [125, 1.2, 91], [0, 0.9, 0], [4.8, 4.5, 4.8], { shape: 'cuboid', parameters: [6.5, 6, 6.5] })
        add('tower-watch.glb', [126, 3.5, 95], [0, Math.PI * 0.8, 0], [1.6, 1.8, 1.6], { shape: 'cuboid', parameters: [3.5, 6, 3.5] })

        await Promise.all(props)
    }
}
