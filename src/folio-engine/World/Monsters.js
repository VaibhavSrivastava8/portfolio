import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Game } from '../Game.js'

// =============================================================================
// ISLAND OBSTACLES & BOUNDARIES (All 25 Islands at 1.4x Scale)
// Used for smooth raycast-free tangential obstacle avoidance so sea creatures
// and ships never clip, penetrate, or pass through any landmass or perimeter rock.
// =============================================================================
const ISLAND_OBSTACLES = [
    // Tier 1: Major Strongholds
    { x: 0, z: 0, r: 12.0 },       // The Anchorage
    { x: -66, z: 32, r: 15.5 },    // Shipwreck Cove
    { x: 69, z: 35, r: 15.5 },     // Citadel Fortress
    { x: 0, z: 100, r: 13.5 },     // Danger Reef
    { x: 54, z: -56, r: 15.0 },    // Coral Lagoon Atoll
    { x: -39, z: 66, r: 14.0 },    // Serpent's Deep
    { x: -49, z: -50, r: 15.0 },   // Dinosaur Shallows

    // Tier 2: Named Secondary Cays & Outposts
    { x: -34, z: 15, r: 8.5 },     // Smuggler's Cay
    { x: 36, z: 20, r: 8.5 },      // Cannon Cay
    { x: 34, z: -24, r: 8.5 },     // Mermaid's Rest Atoll
    { x: -22, z: -27, r: 8.5 },    // Siren's Ridge
    { x: -8, z: 50, r: 8.5 },      // Mist Haven Islet
    { x: 66, z: -22, r: 8.5 },     // East Barrier Reef
    { x: -4, z: -52, r: 9.0 },     // Southern Beacon Watch

    // Tier 3: Minor Reefs & Ruins
    { x: -90, z: 56, r: 6.0 },     // Ghost Galleon Shallows
    { x: -58, z: 91, r: 6.0 },     // Merchant's Graveyard
    { x: 21, z: -46, r: 6.0 },     // Siren's Shallows Sandbar
    { x: 14, z: 32, r: 6.0 },      // Mid-Channel Waypoint Beacon
    { x: 84, z: -46, r: 6.0 },     // Coral Shoal Spire
    { x: -67, z: -22, r: 6.0 },    // South-West Reef Outcrop
    { x: 49, z: 62, r: 6.5 },      // Ancient Sea Fortress Ruins
    { x: 87, z: 6, r: 6.0 },       // Eastern Deep Spire
    { x: 20, z: 78, r: 6.0 },      // Abyssal Sentinel Rocks
    { x: 42, z: -87, r: 6.0 },     // North-East Sandbar
    { x: -20, z: -74, r: 6.0 }     // South Sand Spit
]

export class Monsters
{
    constructor()
    {
        this.game = Game.getInstance()
        this.group = new THREE.Group()
        this.group.name = 'monsters'
        this.game.scene.add(this.group)

        this.loader = new GLTFLoader()
        this.mixers = []

        this.hullIntegrity = 100
        this.lastDamageTime = 0
        this.isSinking = false
        this.currentTerritory = null
        this.rocks = []
        this.cannonballs = []

        // Remove any old sightings or hull elements from DOM
        if(typeof document !== 'undefined')
        {
            document.querySelectorAll('.js-creature-sightings, .hull-gauge').forEach(el => el.remove())
        }

        this.ready = this.initCreatures()

        this.tickCallback = () => this.update()
        this.game.ticker.events.on('tick', this.tickCallback, 9)
    }

    async loadGLTF(url)
    {
        return new Promise((resolve) =>
        {
            this.loader.load(
                url,
                (gltf) => resolve(gltf),
                undefined,
                (err) =>
                {
                    console.warn(`Failed to load monster model: ${url}`, err)
                    resolve(null)
                }
            )
        })
    }

    preserveAuthenticMaterials(model)
    {
        model.traverse((child) =>
        {
            if(child.isMesh)
            {
                child.castShadow = true
                child.receiveShadow = true

                const mats = Array.isArray(child.material) ? child.material : (child.material ? [child.material] : [])
                for(const mat of mats)
                {
                    mat.userData.prevent = true

                    if(mat.map)
                    {
                        mat.map.colorSpace = THREE.SRGBColorSpace
                        mat.map.needsUpdate = true
                    }
                    if(mat.normalMap)
                    {
                        mat.normalMap.needsUpdate = true
                    }

                    mat.side = THREE.DoubleSide
                    mat.needsUpdate = true
                }
            }
        })
    }

    async initCreatures()
    {
        await Promise.all([
            this.setupMosasaurus(),
            this.setupKraken(),
            this.setupSharks(),
            this.setupSpinosaurus(),
            this.setupSkeletons(),
            this.setupMermaid(),
            this.setupGhostCorsair()
        ])
    }

    // =========================================================================
    // TANGENTIAL ISLAND & COASTLINE OBSTACLE AVOIDANCE
    // Deflects heading smoothly around island shores so creatures NEVER clip.
    // =========================================================================
    avoidObstacles(currentPos, headingAngle, clearanceBuffer = 4.0, lookAhead = 8.0)
    {
        const nextX = currentPos.x + Math.sin(headingAngle) * lookAhead
        const nextZ = currentPos.z + Math.cos(headingAngle) * lookAhead

        // 1. Check against all 25 islands
        for(const isl of ISLAND_OBSTACLES)
        {
            const dist = Math.hypot(nextX - isl.x, nextZ - isl.z)
            const minSafeDist = isl.r + clearanceBuffer
            if(dist < minSafeDist)
            {
                // Island directly ahead! Steer along tangent around the coastline
                const awayAngle = Math.atan2(nextX - isl.x, nextZ - isl.z)
                let diff = awayAngle - headingAngle
                while(diff > Math.PI) diff -= Math.PI * 2
                while(diff < -Math.PI) diff += Math.PI * 2

                return diff > 0 ? (awayAngle + Math.PI * 0.45) : (awayAngle - Math.PI * 0.45)
            }
        }

        // 2. Check world perimeter coastal mountain barriers (+/- 108m)
        const margin = 108
        if(Math.abs(nextX) > margin || Math.abs(nextZ) > margin)
        {
            const awayX = -Math.sign(nextX) * Math.max(0, Math.abs(nextX) - margin)
            const awayZ = -Math.sign(nextZ) * Math.max(0, Math.abs(nextZ) - margin)
            return Math.atan2(awayX, awayZ)
        }

        return headingAngle
    }

    clampOutsideIslands(pos, minClearance = 2.5)
    {
        for(const isl of ISLAND_OBSTACLES)
        {
            const dist = Math.hypot(pos.x - isl.x, pos.z - isl.z)
            const minSafe = isl.r + minClearance
            if(dist < minSafe && dist > 0.001)
            {
                const angle = Math.atan2(pos.x - isl.x, pos.z - isl.z)
                pos.x = isl.x + Math.sin(angle) * minSafe
                pos.z = isl.z + Math.cos(angle) * minSafe
            }
        }
        const maxBound = 112
        pos.x = Math.max(-maxBound, Math.min(maxBound, pos.x))
        pos.z = Math.max(-maxBound, Math.min(maxBound, pos.z))
    }

    // =========================================================================
    // 1. MOSASAURUS — APEX SEA LEVIATHAN (Deep South Trench: 14, 90)
    // =========================================================================
    async setupMosasaurus()
    {
        const gltf = await this.loadGLTF('/assets/monsters/mosasaurus.glb')
        if(!gltf) return

        this.mosa = gltf.scene
        this.mosa.name = 'mosasaurus'
        // Proportionate 11.5m apex predator (matches schooner scale, not oversized)
        this.mosa.scale.set(0.026, 0.026, 0.026)
        this.mosa.position.set(14, -1.2, 90)
        this.mosa.visible = false

        this.preserveAuthenticMaterials(this.mosa)
        this.mosa.traverse((child) => {
            if(child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material]
                for(const mat of mats) {
                    mat.roughness = 0.4
                    mat.metalness = 0.08
                    mat.emissive = new THREE.Color(0x0a1c24)
                }
            }
        })

        // Baked swimming animation
        if(gltf.animations && gltf.animations.length > 0)
        {
            this.mosaMixer = new THREE.AnimationMixer(this.mosa)
            const swimClip = gltf.animations[0]
            const action = this.mosaMixer.clipAction(swimClip)
            action.play()
            this.mixers.push(this.mosaMixer)
        }

        this.mosaTerritory = {
            center: new THREE.Vector2(14, 90),
            radius: 42,
            patrolRadius: 18,
            speed: 5.5,
            attackSpeed: 9.0
        }

        this.mosaState = 'PATROL'
        this.mosaPatrolAngle = 0
        this.mosaAttackCooldown = 0
        this.mosaCurrentSpeed = 5.0
        this.mosaTargetY = -1.2
        this.mosaPassTarget = null

        this.group.add(this.mosa)
    }

    // =========================================================================
    // 2. KRAKEN — THE ABYSSAL VORTEX (Deep Waters: -58, 76)
    // =========================================================================
    async setupKraken()
    {
        const gltf = await this.loadGLTF('/assets/monsters/kraken.glb')
        if(!gltf) return

        this.kraken = gltf.scene
        this.kraken.name = 'kraken'
        this.kraken.scale.set(0.9, 0.9, 0.9)
        // Submerged resting depth in the deep vortex basin
        this.kraken.position.set(-58, -1.8, 76)

        this.preserveAuthenticMaterials(this.kraken)

        this.krakenCenter = new THREE.Vector2(-58, 76)
        this.krakenSurfacing = 0
        this.krakenAttackCooldown = 0
        this.group.add(this.kraken)
    }

    // =========================================================================
    // 3. GREAT WHITE SHARK PACK (3 SHARKS) — SERPENT'S DEEP (-39, 66)
    // =========================================================================
    async setupSharks()
    {
        const gltf = await this.loadGLTF('/assets/monsters/shark.glb')
        if(!gltf) return

        this.sharkPack = []
        this.sharkTerritory = {
            center: new THREE.Vector2(-39, 66),
            radius: 28,
            chaseSpeed: 7.2,
            patrolSpeed: 4.2
        }

        // Realistic ~4.2m great white shark scale
        const sharkScale = 0.28

        const offsets = [
            { x: 0, z: 0, angle: 0, orbit: 9, role: 'stern' },
            { x: -5, z: 4, angle: Math.PI * 0.65, orbit: 11, role: 'port' },
            { x: 5, z: -4, angle: Math.PI * 1.35, orbit: 10, role: 'starboard' }
        ]

        for(let i = 0; i < 3; i++)
        {
            const sharkMesh = i === 0 ? gltf.scene : gltf.scene.clone()
            sharkMesh.scale.setScalar(sharkScale)
            
            // Submerged body so only dorsal fin cuts cleanly through the water surface
            sharkMesh.position.set(
                this.sharkTerritory.center.x + offsets[i].x,
                -1.35,
                this.sharkTerritory.center.y + offsets[i].z
            )

            this.preserveAuthenticMaterials(sharkMesh)

            const mixer = new THREE.AnimationMixer(sharkMesh)
            const actions = {}

            if(gltf.animations && gltf.animations.length > 0)
            {
                for(const rawClip of gltf.animations)
                {
                    const clip = rawClip.clone()
                    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position') && !track.name.includes('shark_root'))
                    const action = mixer.clipAction(clip)
                    actions[clip.name.toLowerCase()] = action
                }
            }

            if(actions['swimming'])
            {
                actions['swimming'].play()
            }

            this.mixers.push(mixer)

            this.sharkPack.push({
                mesh: sharkMesh,
                mixer: mixer,
                actions: actions,
                currentAction: 'swimming',
                angle: offsets[i].angle,
                orbitRadius: offsets[i].orbit,
                role: offsets[i].role,
                speed: this.sharkTerritory.patrolSpeed,
                turnSpeed: 3.5,
                disengageTimer: 0
            })

            this.group.add(sharkMesh)
        }
    }

    // =========================================================================
    // 4. SPINOSAURUS — TIDAL MANGROVE GUARDIAN (Dinosaur Shallows: -49, -50)
    // =========================================================================
    async setupSpinosaurus()
    {
        const gltf = await this.loadGLTF('/assets/monsters/spinosaurus.glb')
        if(!gltf) return

        this.spino = gltf.scene
        this.spino.name = 'spinosaurus'
        // Proportionate semi-aquatic predator scale
        this.spino.scale.set(0.68, 0.68, 0.68)
        // Wading in shallow tidal lagoon surrounding Dinosaur Shallows
        this.spino.position.set(-49, -0.55, -50)

        this.preserveAuthenticMaterials(this.spino)

        this.spinoTerritory = {
            center: new THREE.Vector2(-49, -50),
            innerRadius: 7.5,
            outerRadius: 18.5,
            speed: 3.8
        }

        this.spinoState = 'PATROL'
        this.spinoPatrolAngle = 0
        this.spinoDisengageTimer = 0
        this.spinoDisengageAngle = 0

        if(gltf.animations && gltf.animations.length > 0)
        {
            this.spinoMixer = new THREE.AnimationMixer(this.spino)
            this.spinoWalkAction = this.spinoMixer.clipAction(gltf.animations[0])
            this.spinoWalkAction.play()
            this.mixers.push(this.spinoMixer)
        }

        this.group.add(this.spino)
    }

    // =========================================================================
    // 5. SKELETON PIRATES — CURSED SHIPWRECK COVE LOOKOUTS (-66, 32)
    // =========================================================================
    async setupSkeletons()
    {
        const gltf = await this.loadGLTF('/assets/monsters/skeleton.glb')
        if(!gltf) return

        this.skeletons = []
        this.skeletonIsland = {
            name: 'Shipwreck Cove',
            banner: '💀 Shipwreck Cove — Cursed Skeleton Waters',
            center: new THREE.Vector2(-66, 32),
            radius: 26,
            spawns: [
                { x: -66, y: 1.4, z: 32, rot: Math.PI * 1.0 }, // Captain on broken deck
                { x: -70, y: 1.6, z: 30, rot: Math.PI * 0.75 }, // Lookout on rock cliff
                { x: -62, y: 1.2, z: 34, rot: Math.PI * 1.25 }  // Gunner on reef ridge
            ]
        }

        for(const spawn of this.skeletonIsland.spawns)
        {
            const skelMesh = this.skeletons.length === 0 ? gltf.scene : gltf.scene.clone()
            skelMesh.scale.set(0.38, 0.38, 0.38)
            skelMesh.position.set(spawn.x, spawn.y, spawn.z)
            skelMesh.rotation.y = spawn.rot

            this.preserveAuthenticMaterials(skelMesh)

            this.skeletons.push({
                mesh: skelMesh,
                basePos: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
                baseRot: spawn.rot,
                phase: this.skeletons.length * 1.5,
                throwCooldown: 2.0 + Math.random() * 2.0
            })

            this.group.add(skelMesh)
        }
    }

    // =========================================================================
    // 6. SIREN / MERMAID — CORAL REEF SANCTUARY (Coral Lagoon: 54, -56)
    // =========================================================================
    async setupMermaid()
    {
        const gltf = await this.loadGLTF('/assets/monsters/mermaid.glb')
        if(!gltf) return

        this.mermaid = gltf.scene
        this.mermaid.name = 'mermaid'
        // Natural human siren proportion (1.15 scale)
        this.mermaid.scale.set(1.15, 1.15, 1.15)
        // Perched gracefully on the lagoon rocks at Coral Lagoon (51.0, 0.85, -53.5)
        this.mermaid.position.set(51.0, 0.85, -53.5)
        this.mermaid.rotation.set(-0.12, -Math.PI * 0.65, 0.05)

        this.preserveAuthenticMaterials(this.mermaid)

        // Hide translucent bubble material
        this.mermaid.traverse((child) =>
        {
            if(child.isMesh)
            {
                const mats = Array.isArray(child.material) ? child.material : (child.material ? [child.material] : [])
                mats.forEach(m => {
                    if(m.name === 'mat24' || m.opacity < 0.5)
                    {
                        m.visible = false
                    }
                })
            }
        })

        // Soft mystical cyan beacon light around the siren
        const sirenLight = new THREE.PointLight(0x38bdf8, 2.5, 14)
        sirenLight.position.set(51.0, 1.6, -53.5)
        this.group.add(sirenLight)
        this.sirenLight = sirenLight

        this.mermaidPerchPos = new THREE.Vector3(51.0, 0.85, -53.5)
        this.mermaidTerritory = {
            center: new THREE.Vector2(54, -56),
            radius: 26
        }
        this.mermaidState = 'PERCHED'
        this.mermaidCircleAngle = Math.random() * Math.PI * 2

        this.group.add(this.mermaid)
    }

    // =========================================================================
    // 7. GHOST PIRATE CORSAIR — CURSED SHIPWRECK COVE BRIGANTINE (-66, 32)
    // =========================================================================
    async setupGhostCorsair()
    {
        const gltf = await this.loadGLTF('/assets/monsters/ship-ghost.glb')
        if(!gltf) return

        this.ghostCorsair = gltf.scene
        this.ghostCorsair.name = 'ghostCorsair'
        // Authentic pirate brigantine scale matching the player schooner
        this.ghostCorsair.scale.set(0.85, 0.85, 0.85)
        this.ghostCorsair.position.set(-66, 0.05, 32)

        this.preserveAuthenticMaterials(this.ghostCorsair)

        // Spectral green ethereal lantern glow
        const spectralGlow = new THREE.PointLight(0x4ade80, 3.5, 16, 1.5)
        spectralGlow.position.set(0, 3.5, 0)
        this.ghostCorsair.add(spectralGlow)

        this.corsairTerritory = {
            center: new THREE.Vector2(-66, 32),
            radius: 34,
            patrolRadius: 18,
            speed: 4.5,
            chaseSpeed: 6.5
        }
        this.corsairAngle = 0
        this.corsairSpeed = 4.0
        this.corsairState = 'PATROL'
        this.corsairFireCooldown = 2.5

        this.group.add(this.ghostCorsair)
    }

    // =========================================================================
    // UPDATE LOOP — REALISTIC LIVING PHYSICS, AUTONOMOUS AI & COMBAT
    // =========================================================================
    update()
    {
        const delta = Math.min(this.game.ticker.delta, 0.1)
        const time = this.game.ticker.elapsed * 0.001
        const boatPos = this.game.physicalVehicle?.position

        // Suppression of all creatures during Intro / before game starts
        const isIntro = (this.game.inputs?.filters?.has('intro') ?? true) || (this.game.reveal?.step === 0)
        if(isIntro)
        {
            if(this.mosa) this.mosa.visible = false
            if(this.kraken) this.kraken.visible = false
            if(this.spino) this.spino.visible = false
            if(this.sharkPack) this.sharkPack.forEach(s => { if(s.mesh) s.mesh.visible = false })
            if(this.skeletons) this.skeletons.forEach(s => { if(s.mesh) s.mesh.visible = false })
            if(this.mermaid) this.mermaid.visible = false
            if(this.sirenLight) this.sirenLight.visible = false
            if(this.ghostCorsair) this.ghostCorsair.visible = false
            return
        }

        const viewerPos = this.game.view?.camera?.position || boatPos
        const maxDrawDist = 88.0

        // 1. Update Skeletal AnimationMixers
        for(const mixer of this.mixers)
        {
            mixer.update(delta)
        }

        // ---------------------------------------------------------------------
        // 0. SAFE HARBOR REPAIR (The Anchorage at 0, 0)
        // ---------------------------------------------------------------------
        const distToHarbor = boatPos ? Math.hypot(boatPos.x, boatPos.z) : 0
        const insideSafeHarbor = distToHarbor < 24

        if(insideSafeHarbor && this.hullIntegrity < 100)
        {
            this.hullIntegrity = Math.min(100, this.hullIntegrity + 6.0 * delta)
        }
        else if(this.game.ticker.elapsed - this.lastDamageTime > 4.0 && this.hullIntegrity < 100)
        {
            this.hullIntegrity = Math.min(100, this.hullIntegrity + 2.0 * delta)
        }

        // ---------------------------------------------------------------------
        // 1. MOSASAURUS — ACTIVE PREDATORY STALKING, BREACH & RAM
        // ---------------------------------------------------------------------
        if(this.mosa && boatPos)
        {
            const distMosaCam = viewerPos ? viewerPos.distanceTo(this.mosa.position) : 999
            this.mosa.visible = distMosaCam < maxDrawDist

            const distToCenter = Math.hypot(boatPos.x - this.mosaTerritory.center.x, boatPos.z - this.mosaTerritory.center.y)
            const distToBoat = Math.hypot(boatPos.x - this.mosa.position.x, boatPos.z - this.mosa.position.z)
            const shouldChase = (distToCenter < this.mosaTerritory.radius || distToBoat < 32) && !insideSafeHarbor

            let targetX, targetZ, targetSpeed, targetElev

            if(this.mosaAttackCooldown > 0)
            {
                this.mosaAttackCooldown -= delta
            }

            if(shouldChase)
            {
                // Disengage dive pass after ram
                if(this.mosaAttackCooldown > 1.8 && this.mosaPassTarget)
                {
                    this.mosaState = 'DISENGAGE'
                    targetX = this.mosaPassTarget.x
                    targetZ = this.mosaPassTarget.y
                    targetSpeed = 6.0
                    targetElev = -2.0 // Deep underwater escape dive
                }
                else
                {
                    this.mosaState = 'CHASE'
                    targetX = boatPos.x
                    targetZ = boatPos.z
                    targetSpeed = this.mosaTerritory.attackSpeed

                    // Dramatic surface breach when closing in for the strike
                    if(distToBoat < 16)
                    {
                        targetElev = 0.85 // Surges above water!
                    }
                    else
                    {
                        targetElev = -1.2 // Stalking underwater, dorsal ridge slicing
                    }

                    // Direct Hull Ram Strike when closing to 3.8m
                    if(distToBoat < 3.8 && this.mosaAttackCooldown <= 0)
                    {
                        this.attackShip(15, 'Mosasaurus hull ram!', false, this.mosa.position)
                        this.mosaAttackCooldown = 4.8

                        const exitAngle = this.mosa.rotation.y + (Math.random() > 0.5 ? 0.8 : -0.8)
                        this.mosaPassTarget = new THREE.Vector2(
                            boatPos.x + Math.sin(exitAngle) * 26,
                            boatPos.z + Math.cos(exitAngle) * 26
                        )
                    }
                }
            }
            else
            {
                this.mosaState = 'PATROL'
                this.mosaPatrolAngle += 0.32 * delta
                targetX = this.mosaTerritory.center.x + Math.sin(this.mosaPatrolAngle) * this.mosaTerritory.patrolRadius
                targetZ = this.mosaTerritory.center.y + Math.cos(this.mosaPatrolAngle * 0.7) * (this.mosaTerritory.patrolRadius * 0.85)
                targetSpeed = this.mosaTerritory.speed
                targetElev = -1.0
            }

            // Smooth forward steering with island obstacle avoidance
            const toTarget = new THREE.Vector2(targetX - this.mosa.position.x, targetZ - this.mosa.position.z)
            if(toTarget.length() > 1.2)
            {
                let targetAngle = Math.atan2(toTarget.x, toTarget.y)
                targetAngle = this.avoidObstacles(this.mosa.position, targetAngle, 4.5)

                let diffAngle = targetAngle - this.mosa.rotation.y
                while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                while(diffAngle < -Math.PI) diffAngle += Math.PI * 2
                this.mosa.rotation.y += diffAngle * 2.8 * delta

                // Natural predatory banking into turns
                const turnRate = diffAngle * 2.8
                this.mosa.rotation.z += (-turnRate * 0.42 - this.mosa.rotation.z) * 4.0 * delta
            }

            this.mosaCurrentSpeed += (targetSpeed - this.mosaCurrentSpeed) * 2.5 * delta
            this.mosa.position.x += Math.sin(this.mosa.rotation.y) * this.mosaCurrentSpeed * delta
            this.mosa.position.z += Math.cos(this.mosa.rotation.y) * this.mosaCurrentSpeed * delta

            // Guarantee zero island clipping
            this.clampOutsideIslands(this.mosa.position, 3.0)

            this.mosaTargetY += (targetElev - this.mosaTargetY) * 2.5 * delta
            this.mosa.position.y = this.mosaTargetY + Math.sin(time * 3) * 0.08

            const targetPitch = (this.mosaTargetY > 0.3) ? -0.28 : (this.mosaTargetY < -1.5 ? 0.20 : (Math.sin(time * 2.5) * 0.05))
            this.mosa.rotation.x += (targetPitch - this.mosa.rotation.x) * 3 * delta

            if(this.mosaMixer)
            {
                this.mosaMixer.timeScale = this.mosaCurrentSpeed / 3.5
            }
        }

        // ---------------------------------------------------------------------
        // 2. KRAKEN — SUBMERGED WHIRLPOOL VORTEX & TENTACLE LASH
        // ---------------------------------------------------------------------
        if(this.kraken)
        {
            const distKrakenCam = viewerPos ? Math.hypot(viewerPos.x - this.krakenCenter.x, viewerPos.z - this.krakenCenter.y) : 999
            this.kraken.visible = distKrakenCam < maxDrawDist

            const distKraken = boatPos ? Math.hypot(boatPos.x - this.krakenCenter.x, boatPos.z - this.krakenCenter.y) : 999
            const inLairRange = distKraken < 34 && !insideSafeHarbor

            if(this.krakenAttackCooldown > 0)
            {
                this.krakenAttackCooldown -= delta
            }

            // Surfacing behavior (zero gyro spinning!)
            if(inLairRange)
            {
                this.krakenSurfacing = Math.min(1.0, this.krakenSurfacing + 0.9 * delta)
            }
            else
            {
                this.krakenSurfacing = Math.max(0.0, this.krakenSurfacing - 0.4 * delta)
            }

            // Submerged resting (-1.8) -> dramatic surfacing (+0.65)
            const targetY = -1.8 + this.krakenSurfacing * 2.45
            this.kraken.position.y += (targetY - this.kraken.position.y) * 2.5 * delta + Math.sin(time * 2.2) * 0.06

            // Gentle organic swaying rather than mechanical rotation
            this.kraken.rotation.y = Math.sin(time * 0.4) * 0.15
            this.kraken.rotation.x = Math.sin(time * 0.8) * 0.06

            // Whirlpool vortex suction & swirl physics
            if(inLairRange && distKraken < 28 && this.game.physicalVehicle?.chassis?.physical?.body)
            {
                const pullFactor = (28 - distKraken) / 28
                const pullX = (this.krakenCenter.x - boatPos.x) * 2.2 * pullFactor * delta
                const pullZ = (this.krakenCenter.y - boatPos.z) * 2.2 * pullFactor * delta

                const swirlAngle = Math.atan2(boatPos.z - this.krakenCenter.y, boatPos.x - this.krakenCenter.x) + Math.PI * 0.5
                const swirlX = Math.cos(swirlAngle) * 1.6 * pullFactor * delta
                const swirlZ = Math.sin(swirlAngle) * 1.6 * pullFactor * delta

                try
                {
                    this.game.physicalVehicle.chassis.physical.body.applyImpulse({
                        x: pullX + swirlX,
                        y: 0,
                        z: pullZ + swirlZ
                    }, false)
                }
                catch(err) {}

                // Active Tentacle Lash when ship is drawn within 11m
                if(distKraken < 11 && this.krakenAttackCooldown <= 0)
                {
                    this.attackShip(14, 'Kraken tentacle lash!', false, new THREE.Vector3(this.krakenCenter.x, 0, this.krakenCenter.y))
                    this.krakenAttackCooldown = 4.2
                    this.kraken.position.y += 0.5
                }
            }
        }

        // ---------------------------------------------------------------------
        // 3. GREAT WHITE SHARK PACK — FLANKING & LUNGE BITES
        // ---------------------------------------------------------------------
        if(this.sharkPack && boatPos)
        {
            const distPackToCenter = Math.hypot(boatPos.x - this.sharkTerritory.center.x, boatPos.z - this.sharkTerritory.center.y)
            const insideSharkTerritory = (distPackToCenter < this.sharkTerritory.radius || distPackToCenter < 30) && !insideSafeHarbor

            for(let i = 0; i < this.sharkPack.length; i++)
            {
                const shark = this.sharkPack[i]
                const distSharkCam = viewerPos ? viewerPos.distanceTo(shark.mesh.position) : 999
                shark.mesh.visible = distSharkCam < maxDrawDist

                const distSharkToBoat = Math.hypot(boatPos.x - shark.mesh.position.x, boatPos.z - shark.mesh.position.z)

                if(!shark.disengageTimer) shark.disengageTimer = 0
                if(shark.disengageTimer > 0) shark.disengageTimer -= delta

                let targetX, targetZ, targetSpeed, targetY

                if(insideSharkTerritory)
                {
                    if(shark.actions['swimming'] && !shark.actions['swimming'].isRunning())
                    {
                        shark.actions['swimming'].play()
                    }

                    // Post-bite disengage: dives and circles outward
                    if(shark.disengageTimer > 0)
                    {
                        shark.angle += 1.4 * delta
                        const circleDist = 12.0
                        targetX = boatPos.x + Math.sin(shark.angle + i * 2.0) * circleDist
                        targetZ = boatPos.z + Math.cos(shark.angle + i * 2.0) * circleDist
                        targetSpeed = 5.5
                        targetY = -2.0 // Dive deep
                    }
                    else
                    {
                        // Coordinated flanking wolf-pack approach
                        let flankAngle = 0
                        if(shark.role === 'port') flankAngle = -0.65
                        else if(shark.role === 'starboard') flankAngle = 0.65

                        targetX = boatPos.x + Math.sin(flankAngle) * 3.5
                        targetZ = boatPos.z + Math.cos(flankAngle) * 3.5
                        targetSpeed = this.sharkTerritory.chaseSpeed
                        targetY = -1.35 // Fin slicing surface

                        if(distSharkToBoat < 3.4 && shark.disengageTimer <= 0)
                        {
                            if(shark.actions['bite'])
                            {
                                shark.actions['bite'].reset().play()
                            }
                            this.attackShip(5, 'Shark bite!', false, shark.mesh.position)
                            shark.disengageTimer = 3.8
                            shark.angle = Math.atan2(shark.mesh.position.x - boatPos.x, shark.mesh.position.z - boatPos.z)
                        }
                    }
                }
                else
                {
                    if(shark.actions['swimming'] && !shark.actions['swimming'].isRunning())
                    {
                        shark.actions['swimming'].play()
                    }

                    shark.angle += (0.55 + i * 0.12) * delta
                    targetX = this.sharkTerritory.center.x + Math.sin(shark.angle) * shark.orbitRadius
                    targetZ = this.sharkTerritory.center.y + Math.cos(shark.angle) * (shark.orbitRadius * 0.85)
                    targetSpeed = this.sharkTerritory.patrolSpeed
                    targetY = -1.35
                }

                // Smooth steering with obstacle avoidance
                const toTarget = new THREE.Vector2(targetX - shark.mesh.position.x, targetZ - shark.mesh.position.z)
                if(toTarget.length() > 0.8)
                {
                    let targetAngle = Math.atan2(toTarget.x, toTarget.y)
                    targetAngle = this.avoidObstacles(shark.mesh.position, targetAngle, 3.5)

                    let diffAngle = targetAngle - shark.mesh.rotation.y
                    while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                    while(diffAngle < -Math.PI) diffAngle += Math.PI * 2

                    shark.mesh.rotation.y += diffAngle * shark.turnSpeed * delta

                    const turnRate = diffAngle * shark.turnSpeed
                    shark.mesh.rotation.z += (-turnRate * 0.38 - shark.mesh.rotation.z) * 4 * delta
                }

                shark.speed += (targetSpeed - shark.speed) * 2.5 * delta
                shark.mesh.position.x += Math.sin(shark.mesh.rotation.y) * shark.speed * delta
                shark.mesh.position.z += Math.cos(shark.mesh.rotation.y) * shark.speed * delta

                this.clampOutsideIslands(shark.mesh.position, 2.0)

                shark.mesh.position.y += (targetY - shark.mesh.position.y) * 2.5 * delta + Math.sin(time * 3.0 + i) * 0.03
                shark.mesh.rotation.x = Math.sin(time * 3.5 + i) * 0.03

                if(shark.mixer)
                {
                    shark.mixer.timeScale = shark.speed / 3.8
                }
            }
        }

        // ---------------------------------------------------------------------
        // 4. SPINOSAURUS — TIDAL MANGROVE WADING & CLAW SWIPE
        // ---------------------------------------------------------------------
        if(this.spino && boatPos)
        {
            const distSpinoCam = viewerPos ? viewerPos.distanceTo(this.spino.position) : 999
            this.spino.visible = distSpinoCam < maxDrawDist

            const distSpinoCenter = Math.hypot(boatPos.x - this.spinoTerritory.center.x, boatPos.z - this.spinoTerritory.center.y)
            const insideSpinoTerritory = distSpinoCenter < this.spinoTerritory.outerRadius + 8.0 && !insideSafeHarbor
            const distToSpino = Math.hypot(boatPos.x - this.spino.position.x, boatPos.z - this.spino.position.z)

            if(this.spinoDisengageTimer > 0)
            {
                this.spinoDisengageTimer -= delta
            }

            let targetX, targetZ, moveSpeed

            if(insideSpinoTerritory)
            {
                if(this.spinoDisengageTimer > 0)
                {
                    this.spinoDisengageAngle += 0.5 * delta
                    const orbitRadius = 14.0
                    targetX = this.spinoTerritory.center.x + Math.sin(this.spinoDisengageAngle) * orbitRadius
                    targetZ = this.spinoTerritory.center.y + Math.cos(this.spinoDisengageAngle) * orbitRadius
                    moveSpeed = 3.2
                }
                else
                {
                    targetX = boatPos.x
                    targetZ = boatPos.z
                    moveSpeed = 3.8

                    if(distToSpino < 4.8 && this.spinoDisengageTimer <= 0)
                    {
                        this.attackShip(8, 'Spinosaurus swipe!', false, this.spino.position)
                        this.spinoDisengageTimer = 4.2
                        this.spinoDisengageAngle = Math.atan2(this.spino.position.x - this.spinoTerritory.center.x, this.spino.position.z - this.spinoTerritory.center.y)
                    }
                }
            }
            else
            {
                this.spinoPatrolAngle += 0.25 * delta
                targetX = this.spinoTerritory.center.x + Math.sin(this.spinoPatrolAngle) * 14.0
                targetZ = this.spinoTerritory.center.y + Math.cos(this.spinoPatrolAngle) * 14.0
                moveSpeed = 2.4
            }

            // Smooth rotation towards target with deadzone
            const toTarget = new THREE.Vector2(targetX - this.spino.position.x, targetZ - this.spino.position.z)
            if(toTarget.length() > 1.0)
            {
                const targetAngle = Math.atan2(toTarget.x, toTarget.y)
                let diffAngle = targetAngle - this.spino.rotation.y
                while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                while(diffAngle < -Math.PI) diffAngle += Math.PI * 2
                this.spino.rotation.y += diffAngle * 2.2 * delta
            }

            const nextX = this.spino.position.x + Math.sin(this.spino.rotation.y) * moveSpeed * delta
            const nextZ = this.spino.position.z + Math.cos(this.spino.rotation.y) * moveSpeed * delta
            const distToIslandCenter = Math.hypot(nextX - this.spinoTerritory.center.x, nextZ - this.spinoTerritory.center.y)

            // Strictly confined to shallow tidal water ring [innerRadius, outerRadius]
            if(distToIslandCenter >= this.spinoTerritory.innerRadius && distToIslandCenter <= this.spinoTerritory.outerRadius)
            {
                this.spino.position.x = nextX
                this.spino.position.z = nextZ
            }
            else
            {
                // Deflect around tidal sandbanks
                const angleOut = Math.atan2(this.spino.position.x - this.spinoTerritory.center.x, this.spino.position.z - this.spinoTerritory.center.y)
                const clampedR = Math.max(this.spinoTerritory.innerRadius + 0.5, Math.min(this.spinoTerritory.outerRadius - 0.5, distToIslandCenter))
                this.spino.position.x = this.spinoTerritory.center.x + Math.sin(angleOut) * clampedR
                this.spino.position.z = this.spinoTerritory.center.y + Math.cos(angleOut) * clampedR
            }

            this.spino.position.y = -0.55 + Math.sin(time * 2.5) * 0.03

            if(this.spinoMixer)
            {
                this.spinoMixer.timeScale = moveSpeed / 2.8
            }
        }

        // ---------------------------------------------------------------------
        // 5. GHOST PIRATE CORSAIR — CURSED SHIPWRECK COVE PATROL & CANNONS
        // ---------------------------------------------------------------------
        if(this.ghostCorsair && boatPos)
        {
            const distCorsairCam = viewerPos ? viewerPos.distanceTo(this.ghostCorsair.position) : 999
            this.ghostCorsair.visible = distCorsairCam < maxDrawDist

            const distToCove = Math.hypot(boatPos.x - this.corsairTerritory.center.x, boatPos.z - this.corsairTerritory.center.y)
            const distToShip = Math.hypot(boatPos.x - this.ghostCorsair.position.x, boatPos.z - this.ghostCorsair.position.z)
            const inCove = distToCove < this.corsairTerritory.radius && !insideSafeHarbor

            if(this.corsairFireCooldown > 0)
            {
                this.corsairFireCooldown -= delta
            }

            let targetX, targetZ, targetSpeed

            if(inCove)
            {
                this.corsairState = 'COMBAT'
                targetSpeed = this.corsairTerritory.chaseSpeed

                // Broadside positioning maneuver: maintain 14m distance perpendicular to player
                const angleToPlayer = Math.atan2(boatPos.x - this.ghostCorsair.position.x, boatPos.z - this.ghostCorsair.position.z)
                const broadsideOffset = angleToPlayer + Math.PI * 0.5
                targetX = boatPos.x + Math.sin(broadsideOffset) * 14.0
                targetZ = boatPos.z + Math.cos(broadsideOffset) * 14.0

                // Fire cannonball volleys when in broadside range
                if(distToShip < 24.0 && this.corsairFireCooldown <= 0)
                {
                    this.fireCorsairCannons(boatPos)
                    this.corsairFireCooldown = 4.0 + Math.random() * 1.5
                }
            }
            else
            {
                this.corsairState = 'PATROL'
                this.corsairAngle += 0.35 * delta
                targetX = this.corsairTerritory.center.x + Math.sin(this.corsairAngle) * this.corsairTerritory.patrolRadius
                targetZ = this.corsairTerritory.center.y + Math.cos(this.corsairAngle * 0.8) * (this.corsairTerritory.patrolRadius * 0.75)
                targetSpeed = this.corsairTerritory.speed
            }

            // Smooth sailing steering with obstacle avoidance
            const toTarget = new THREE.Vector2(targetX - this.ghostCorsair.position.x, targetZ - this.ghostCorsair.position.z)
            if(toTarget.length() > 1.2)
            {
                let targetAngle = Math.atan2(toTarget.x, toTarget.y)
                targetAngle = this.avoidObstacles(this.ghostCorsair.position, targetAngle, 4.5)

                let diffAngle = targetAngle - this.ghostCorsair.rotation.y
                while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                while(diffAngle < -Math.PI) diffAngle += Math.PI * 2

                this.ghostCorsair.rotation.y += diffAngle * 2.2 * delta

                // Ship banking roll on waves
                const turnRate = diffAngle * 2.2
                this.ghostCorsair.rotation.z += (-turnRate * 0.28 - this.ghostCorsair.rotation.z) * 3.5 * delta
            }

            this.corsairSpeed += (targetSpeed - this.corsairSpeed) * 2.5 * delta
            this.ghostCorsair.position.x += Math.sin(this.ghostCorsair.rotation.y) * this.corsairSpeed * delta
            this.ghostCorsair.position.z += Math.cos(this.ghostCorsair.rotation.y) * this.corsairSpeed * delta

            this.clampOutsideIslands(this.ghostCorsair.position, 3.5)

            // Oceanic bobbing pitch & roll
            this.ghostCorsair.position.y = 0.05 + Math.sin(time * 2.2) * 0.06
            this.ghostCorsair.rotation.x = Math.sin(time * 1.8) * 0.04
        }

        // ---------------------------------------------------------------------
        // 6. SKELETON PIRATES — SHIPWRECK COVE OVERLOOKS
        // ---------------------------------------------------------------------
        if(this.skeletons && boatPos)
        {
            const distToCove = Math.hypot(boatPos.x - this.skeletonIsland.center.x, boatPos.z - this.skeletonIsland.center.y)
            const insideSkeletonTerritory = distToCove < this.skeletonIsland.radius && !insideSafeHarbor

            for(let i = 0; i < this.skeletons.length; i++)
            {
                const skel = this.skeletons[i]
                const distSkelCam = viewerPos ? viewerPos.distanceTo(skel.mesh.position) : 999
                skel.mesh.visible = distSkelCam < maxDrawDist

                const distToSkel = Math.hypot(boatPos.x - skel.mesh.position.x, boatPos.z - skel.mesh.position.z)
                skel.mesh.position.y = skel.basePos.y + Math.sin(time * 2.0 + skel.phase) * 0.03

                if(skel.throwCooldown > 0)
                {
                    skel.throwCooldown -= delta
                }

                if(insideSkeletonTerritory && distToSkel < 18.0)
                {
                    const lookAngle = Math.atan2(boatPos.x - skel.mesh.position.x, boatPos.z - skel.mesh.position.z)
                    let diffAngle = lookAngle - skel.mesh.rotation.y
                    while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                    while(diffAngle < -Math.PI) diffAngle += Math.PI * 2
                    skel.mesh.rotation.y += diffAngle * 3.5 * delta

                    if(skel.throwCooldown < 0.8)
                    {
                        skel.mesh.rotation.x = -0.35
                    }
                    else
                    {
                        skel.mesh.rotation.x = 0
                    }

                    if(skel.throwCooldown <= 0)
                    {
                        this.throwRock(skel, boatPos)
                        skel.throwCooldown = 3.5 + Math.random() * 1.5
                    }
                }
                else
                {
                    let diffAngle = skel.baseRot - skel.mesh.rotation.y
                    while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                    while(diffAngle < -Math.PI) diffAngle += Math.PI * 2
                    skel.mesh.rotation.y += diffAngle * 1.5 * delta
                    skel.mesh.rotation.x = 0
                }
            }
        }

        // ---------------------------------------------------------------------
        // 7. SIREN / MERMAID — CORAL SANCTUARY GUIDANCE
        // ---------------------------------------------------------------------
        if(this.mermaid && boatPos)
        {
            const distMermaidCam = viewerPos ? viewerPos.distanceTo(this.mermaid.position) : 999
            this.mermaid.visible = distMermaidCam < maxDrawDist
            if(this.sirenLight)
            {
                this.sirenLight.visible = this.mermaid.visible
            }

            const distToTerritoryCenter = Math.hypot(
                boatPos.x - this.mermaidTerritory.center.x,
                boatPos.z - this.mermaidTerritory.center.y
            )

            if(distToTerritoryCenter < this.mermaidTerritory.radius)
            {
                this.mermaidState = 'SWIMMING'
                this.mermaidCircleAngle += 0.85 * delta
                const circleRadius = 9.0
                const targetX = boatPos.x + Math.sin(this.mermaidCircleAngle) * circleRadius
                const targetZ = boatPos.z + Math.cos(this.mermaidCircleAngle) * circleRadius

                const toTarget = new THREE.Vector2(targetX - this.mermaid.position.x, targetZ - this.mermaid.position.z)
                const targetAngle = Math.atan2(toTarget.x, toTarget.y)
                let diffAngle = targetAngle - this.mermaid.rotation.y
                while(diffAngle > Math.PI) diffAngle -= Math.PI * 2
                while(diffAngle < -Math.PI) diffAngle += Math.PI * 2
                this.mermaid.rotation.y += diffAngle * 3.2 * delta

                this.mermaid.position.x += (targetX - this.mermaid.position.x) * 2.8 * delta
                this.mermaid.position.z += (targetZ - this.mermaid.position.z) * 2.8 * delta

                const targetY = 0.35 + Math.sin(time * 2.5) * 0.12
                this.mermaid.position.y += (targetY - this.mermaid.position.y) * 3 * delta

                this.mermaid.rotation.x += (0.12 - this.mermaid.rotation.x) * 3 * delta
                this.mermaid.rotation.z = Math.sin(time * 4) * 0.12

                if(this.sirenLight)
                {
                    this.sirenLight.position.copy(this.mermaid.position)
                    this.sirenLight.position.y += 0.95
                }
            }
            else
            {
                this.mermaidState = 'PERCHED'
                this.mermaid.position.x += (this.mermaidPerchPos.x - this.mermaid.position.x) * 2.0 * delta
                this.mermaid.position.z += (this.mermaidPerchPos.z - this.mermaid.position.z) * 2.0 * delta
                this.mermaid.position.y = this.mermaidPerchPos.y + Math.sin(time * 1.8) * 0.02
                this.mermaid.rotation.set(-0.12 + Math.sin(time * 1.5) * 0.02, -Math.PI * 0.65, Math.sin(time * 1.8) * 0.03)

                if(this.sirenLight)
                {
                    this.sirenLight.position.set(this.mermaidPerchPos.x, this.mermaidPerchPos.y + 0.95, this.mermaidPerchPos.z)
                }
            }
        }

        // ---------------------------------------------------------------------
        // PROJECTILE FLIGHT & IMPACT (CANNONBALLS & ROCKS)
        // ---------------------------------------------------------------------
        this.updateProjectiles(delta, boatPos)

        // ---------------------------------------------------------------------
        // TERRITORY DETECTION BANNER
        // ---------------------------------------------------------------------
        if(boatPos)
        {
            this.checkTerritoryAlerts(boatPos)
        }
    }

    fireCorsairCannons(boatPos)
    {
        const geometry = new THREE.SphereGeometry(0.35, 12, 12)
        const material = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 })
        const ballMesh = new THREE.Mesh(geometry, material)

        // Calculate broadside firing port position
        const broadsideSide = (Math.random() > 0.5 ? 1 : -1)
        const fireOffset = new THREE.Vector3(
            Math.cos(this.ghostCorsair.rotation.y) * broadsideSide * 2.2,
            1.2,
            -Math.sin(this.ghostCorsair.rotation.y) * broadsideSide * 2.2
        )
        const start = this.ghostCorsair.position.clone().add(fireOffset)
        const target = new THREE.Vector3(boatPos.x + (Math.random() - 0.5) * 2.0, 0.4, boatPos.z + (Math.random() - 0.5) * 2.0)

        ballMesh.position.copy(start)
        this.group.add(ballMesh)

        // Play cannon blast audio
        this.game.audio?.groups?.get('hitDefault')?.playRandomNext(1.0, start)

        this.cannonballs.push({
            mesh: ballMesh,
            start,
            target,
            elapsed: 0,
            duration: 1.4
        })
    }

    throwRock(skel, boatPos)
    {
        const geometry = new THREE.DodecahedronGeometry(0.5, 0)
        const material = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
        const rockMesh = new THREE.Mesh(geometry, material)

        const start = new THREE.Vector3(
            skel.mesh.position.x,
            skel.mesh.position.y + 1.2,
            skel.mesh.position.z
        )
        const target = new THREE.Vector3(boatPos.x, boatPos.y + 0.5, boatPos.z)

        rockMesh.position.copy(start)
        this.group.add(rockMesh)

        this.rocks.push({
            mesh: rockMesh,
            start,
            target,
            elapsed: 0,
            duration: 1.5
        })
    }

    updateProjectiles(delta, boatPos)
    {
        // Cannonballs
        if(this.cannonballs && this.cannonballs.length)
        {
            for(let i = this.cannonballs.length - 1; i >= 0; i--)
            {
                const ball = this.cannonballs[i]
                ball.elapsed += delta
                const t = Math.min(ball.elapsed / ball.duration, 1)

                ball.mesh.position.lerpVectors(ball.start, ball.target, t)
                ball.mesh.position.y += Math.sin(t * Math.PI) * 4.2

                if(t >= 1)
                {
                    if(boatPos)
                    {
                        const distFromImpact = Math.hypot(boatPos.x - ball.target.x, boatPos.z - ball.target.z)
                        if(distFromImpact < 3.5)
                        {
                            this.attackShip(10, 'Ghost Corsair cannonball strike!', false, ball.target)
                        }
                        else
                        {
                            this.game.audio?.groups?.get('hitDefault')?.playRandomNext(0.3, ball.target)
                        }
                    }
                    this.group.remove(ball.mesh)
                    ball.mesh.geometry.dispose()
                    ball.mesh.material.dispose()
                    this.cannonballs.splice(i, 1)
                }
            }
        }

        // Skeletons Thrown Rocks
        if(this.rocks && this.rocks.length)
        {
            for(let i = this.rocks.length - 1; i >= 0; i--)
            {
                const rock = this.rocks[i]
                rock.elapsed += delta
                const t = Math.min(rock.elapsed / rock.duration, 1)

                rock.mesh.position.lerpVectors(rock.start, rock.target, t)
                rock.mesh.position.y += Math.sin(t * Math.PI) * 3.5
                rock.mesh.rotation.x += delta * 6
                rock.mesh.rotation.z += delta * 4

                if(t >= 1)
                {
                    if(boatPos)
                    {
                        const distFromImpact = Math.hypot(boatPos.x - rock.target.x, boatPos.z - rock.target.z)
                        if(distFromImpact < 3.2)
                        {
                            this.attackShip(4, 'Skeleton rock strike!', true)
                        }
                        else
                        {
                            this.game.audio?.groups?.get('hitDefault')?.playRandomNext(0.25, rock.target)
                        }
                    }

                    this.group.remove(rock.mesh)
                    rock.mesh.geometry.dispose()
                    rock.mesh.material.dispose()
                    this.rocks.splice(i, 1)
                }
            }
        }
    }

    attackShip(damage, reason, isRock = false, attackerPos = null)
    {
        if(this.isSinking) return

        const now = this.game.ticker.elapsed
        if(now - this.lastDamageTime < (isRock ? 0.7 : 1.2)) return

        this.lastDamageTime = now
        this.hullIntegrity = Math.max(0, this.hullIntegrity - damage)

        // Camera shake
        const shakePower = isRock ? 0.25 : Math.min(1.5, 0.4 + damage * 0.08)
        this.game.view?.roll?.kick(shakePower)

        let vignette = document.querySelector('.js-damage-vignette')
        if(!vignette)
        {
            vignette = document.createElement('div')
            vignette.className = 'js-damage-vignette'
            vignette.style.position = 'fixed'
            vignette.style.inset = '0'
            vignette.style.pointerEvents = 'none'
            vignette.style.zIndex = '998'
            vignette.style.boxShadow = 'inset 0 0 100px rgba(239, 68, 68, 0.7)'
            vignette.style.opacity = '0'
            vignette.style.transition = 'opacity 0.15s ease-out'
            document.body.appendChild(vignette)
        }

        vignette.style.opacity = isRock ? '0.35' : '0.85'
        setTimeout(() => { vignette.style.opacity = '0' }, isRock ? 200 : 350)

        // Real Physics Impulse: Physically knock the boat hull!
        if(!isRock && this.game.physicalVehicle?.chassis?.physical?.body)
        {
            const impulseStrength = Math.min(12.0, 4.0 + damage * 0.5)
            const boatPos = this.game.physicalVehicle.position
            let dirX = 0
            let dirZ = 0

            if(attackerPos && boatPos)
            {
                const dx = boatPos.x - attackerPos.x
                const dz = boatPos.z - attackerPos.z
                const d = Math.hypot(dx, dz)
                if(d > 0.001)
                {
                    dirX = dx / d
                    dirZ = dz / d
                }
            }
            if(dirX === 0 && dirZ === 0)
            {
                const angle = Math.random() * Math.PI * 2
                dirX = Math.sin(angle)
                dirZ = Math.cos(angle)
            }

            try
            {
                this.game.physicalVehicle.chassis.physical.body.applyImpulse({
                    x: dirX * impulseStrength,
                    y: 0.8,
                    z: dirZ * impulseStrength
                }, true)
            }
            catch(err) {}
        }

        this.game.audio?.groups?.get('hitDefault')?.playRandomNext(isRock ? 0.4 : 1.0, this.game.player.position)
    }

    checkTerritoryAlerts(boatPos)
    {
        let newTerritory = null

        if(Math.hypot(boatPos.x, boatPos.z) < 22)
        {
            newTerritory = '⚓ The Anchorage — Safe Haven'
        }
        else if(Math.hypot(boatPos.x - (-66), boatPos.z - 32) < 26)
        {
            newTerritory = '💀 Shipwreck Cove — Cursed Ghost Corsair Waters'
        }
        else if(Math.hypot(boatPos.x - 14, boatPos.z - 90) < 26)
        {
            newTerritory = '⚠️ Mosasaurus Trench — Sea Monster Territory'
        }
        else if(Math.hypot(boatPos.x - (-58), boatPos.z - 76) < 24)
        {
            newTerritory = '🐙 The Abyssal Vortex — Kraken\'s Lair'
        }
        else if(Math.hypot(boatPos.x - (-39), boatPos.z - 66) < 24)
        {
            newTerritory = '⚠️ Serpent\'s Deep — Great White Shark Shoals'
        }
        else if(Math.hypot(boatPos.x - (-49), boatPos.z - (-50)) < 26)
        {
            newTerritory = '⚠️ Dinosaur Shallows — Spinosaurus Tidal Basin'
        }
        else if(Math.hypot(boatPos.x - 54, boatPos.z - (-56)) < 24)
        {
            newTerritory = '🧜‍♀️ Coral Lagoon — Siren\'s Sanctuary'
        }
        else if(Math.hypot(boatPos.x - (-123), boatPos.z - 123) < 28)
        {
            newTerritory = '🏔️ Mount Sentinel Summit (North-West)'
        }
        else if(Math.hypot(boatPos.x - 123, boatPos.z - 123) < 28)
        {
            newTerritory = '🏔️ Dragon\'s Tooth Peak (North-East)'
        }
        else if(Math.hypot(boatPos.x - (-123), boatPos.z - (-123)) < 28)
        {
            newTerritory = '🏔️ Kraken\'s Horn Fjord (South-West)'
        }
        else if(Math.hypot(boatPos.x - 123, boatPos.z - (-123)) < 28)
        {
            newTerritory = '🏔️ Siren\'s Bastion Bluff (South-East)'
        }
        else if(boatPos.z > 110)
        {
            newTerritory = '🏔️ Northern Mountain Ridge & Sea Cliffs'
        }
        else if(boatPos.z < -110)
        {
            newTerritory = '🏔️ Southern Coastal Palisades & Fjord'
        }
        else if(boatPos.x < -110)
        {
            newTerritory = '🏔️ Western Sea Cliffs & Plateaus'
        }
        else if(boatPos.x > 110)
        {
            newTerritory = '🏔️ Eastern Mountain Peaks & Bluffs'
        }

        if(newTerritory !== this.currentTerritory)
        {
            this.currentTerritory = newTerritory
            if(newTerritory)
            {
                this.showTerritoryBanner(newTerritory)
            }
        }
    }

    showTerritoryBanner(title)
    {
        let banner = document.querySelector('.js-territory-banner')
        if(!banner)
        {
            banner = document.createElement('div')
            banner.className = 'js-territory-banner'
            banner.style.position = 'fixed'
            banner.style.top = '62px'
            banner.style.left = '50%'
            banner.style.transform = 'translateX(-50%)'
            banner.style.background = 'rgba(15, 23, 42, 0.94)'
            banner.style.border = '1px solid #f59e0b'
            banner.style.color = '#fef3c7'
            banner.style.padding = '7px 22px'
            banner.style.borderRadius = '30px'
            banner.style.fontSize = '13px'
            banner.style.fontWeight = 'bold'
            banner.style.letterSpacing = '1px'
            banner.style.zIndex = '999'
            banner.style.pointerEvents = 'none'
            banner.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.3)'
            banner.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
            document.body.appendChild(banner)
        }

        banner.textContent = title
        banner.style.opacity = '1'
        banner.style.transform = 'translateX(-50%) translateY(0)'

        clearTimeout(this.bannerTimer)
        this.bannerTimer = setTimeout(() =>
        {
            banner.style.opacity = '0'
            banner.style.transform = 'translateX(-50%) translateY(-10px)'
        }, 4000)
    }
}
