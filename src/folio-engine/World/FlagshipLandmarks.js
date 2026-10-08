import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { portfolioStops } from '../../data/portfolioStops.js'

export class FlagshipLandmarks
{
    constructor()
    {
        this.game = Game.getInstance()
        this.group = new THREE.Group()
        this.game.scene.add(this.group)

        this.landmarks = []

        if(portfolioStops.some(stop => stop.id === 'pdfretype')) this.createPDFRetypeLandmark()
        if(portfolioStops.some(stop => stop.id === 'kms')) this.createKeepMeStableLandmark()
        if(portfolioStops.some(stop => stop.id === 'hive')) this.createHiveLandmark()
        this.createPortfolioBeacons()
        this.createIslandSigns()

        this.time = 0
        this.update = this.update.bind(this)
        this.game.ticker.events.on('tick', this.update, 12)
    }

    createPortfolioBeacons()
    {
        for(const stop of portfolioStops)
        {
            if(['pdfretype', 'kms', 'hive'].includes(stop.id)) continue
            const container = new THREE.Group()
            container.position.set(stop.x, 0, stop.z)
            const color = stop.menu ? '#d5b5e8' : '#f5c777'
            const aura = this.createWaterRipples(color, 1.4)
            const monolith = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.65),
                new THREE.MeshStandardNodeMaterial({ color, roughness: 0.85, metalness: 0 })
            )
            monolith.position.y = 2.4
            const plinth = new THREE.Mesh(
                new THREE.CylinderGeometry(0.9, 1.2, 1.1, 6),
                new THREE.MeshStandardNodeMaterial({ color: '#493451', roughness: 1 })
            )
            plinth.position.y = 0.6
            container.add(plinth)
            container.add(aura, monolith)
            this.group.add(container)
            this.landmarks.push({
                id: stop.id, container, monolith, aura,
                rings: [], baseY: 2.4, pulseSpeed: 1.5
            })
        }
    }

    createIslandSigns()
    {
        for(const landmark of this.landmarks)
        {
            const stop = portfolioStops.find(stop => stop.id === landmark.id)
            if(!stop) continue
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 128
            const context = canvas.getContext('2d')
            context.fillStyle = '#493451'
            context.fillRect(0, 0, 512, 128)
            context.fillStyle = '#f7efdf'
            context.fillRect(8, 8, 496, 108)
            context.fillStyle = '#493451'
            context.font = 'bold 36px Nunito, sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(stop.label, 256, 64, 460)
            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(3.8, 0.95),
                new THREE.MeshBasicNodeMaterial({ map: texture, side: THREE.DoubleSide })
            )
            sign.position.y = 4.6
            landmark.container.add(sign)
            landmark.sign = sign
        }
    }

    createWaterRipples(colorHex, radius)
    {
        const ringGeo = new THREE.RingGeometry(radius * 0.75, radius, 32)
        const ringMat = new THREE.MeshBasicNodeMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            depthWrite: false
        })
        const mesh = new THREE.Mesh(ringGeo, ringMat)
        mesh.rotation.x = -Math.PI * 0.5
        mesh.position.y = 0.52 // Just skimming waterline
        return mesh
    }

    createPDFRetypeLandmark()
    {
        const container = new THREE.Group()
        container.position.set(-45, 0, 32)

        // 1. Water aura ring
        const aura = this.createWaterRipples('#f59e0b', 3.8)
        container.add(aura)

        // 2. Crystal Document Monolith (Golden/Amber)
        const monolithGeo = new THREE.OctahedronGeometry(1.4, 0)
        monolithGeo.scale(0.8, 2.2, 0.8)
        const monolithMat = new THREE.MeshBasicNodeMaterial({
            color: '#fbbf24',
            wireframe: false
        })
        const monolith = new THREE.Mesh(monolithGeo, monolithMat)
        monolith.position.y = 3.2
        container.add(monolith)

        // 3. Inner Wireframe Core for high-tech holographic look
        const wireMat = new THREE.MeshBasicNodeMaterial({
            color: '#ffffff',
            wireframe: true
        })
        const wireMesh = new THREE.Mesh(monolithGeo, wireMat)
        wireMesh.scale.setScalar(1.05)
        monolith.add(wireMesh)

        // 4. Orbiting Rings (representing document layers & OCR scan rings)
        const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 48)
        const ringMat = new THREE.MeshBasicNodeMaterial({
            color: '#f59e0b'
        })
        const ring1 = new THREE.Mesh(ringGeo, ringMat)
        ring1.rotation.x = Math.PI * 0.35
        container.add(ring1)

        const ring2 = new THREE.Mesh(ringGeo, ringMat)
        ring2.rotation.y = Math.PI * 0.4
        ring2.scale.setScalar(1.2)
        container.add(ring2)

        // 5. Point Light
        const light = new THREE.PointLight('#f59e0b', 18, 22)
        light.position.y = 3.2
        container.add(light)

        this.group.add(container)

        this.landmarks.push({
            id: 'pdfretype',
            container,
            monolith,
            rings: [ring1, ring2],
            baseY: 3.2,
            aura,
            pulseSpeed: 1.8
        })
    }

    createKeepMeStableLandmark()
    {
        const container = new THREE.Group()
        container.position.set(48, 0, 35)

        // 1. Water aura ring (Serene Cyan / Emerald)
        const aura = this.createWaterRipples('#10b981', 4.0)
        container.add(aura)

        // 2. Fortified Pedestal
        const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.6, 1.8, 6)
        const pedestalMat = new THREE.MeshBasicNodeMaterial({
            color: '#1e293b'
        })
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
        pedestal.position.y = 0.9
        container.add(pedestal)

        // 3. Floating Wellness Heartbeat Orb (Icosahedron)
        const orbGeo = new THREE.IcosahedronGeometry(1.1, 2)
        const orbMat = new THREE.MeshBasicNodeMaterial({
            color: '#10b981'
        })
        const orb = new THREE.Mesh(orbGeo, orbMat)
        orb.position.y = 3.5
        container.add(orb)

        // 4. Orbiting Care / Telemetry Rings
        const ringGeo = new THREE.TorusGeometry(2.2, 0.04, 16, 48)
        const ringMat = new THREE.MeshBasicNodeMaterial({
            color: '#06b6d4'
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI * 0.25
        container.add(ring)

        // 5. Point Light
        const light = new THREE.PointLight('#10b981', 18, 22)
        light.position.y = 3.5
        container.add(light)

        this.group.add(container)

        this.landmarks.push({
            id: 'kms',
            container,
            monolith: orb,
            rings: [ring],
            baseY: 3.5,
            aura,
            pulseSpeed: 2.5
        })
    }

    createHiveLandmark()
    {
        const container = new THREE.Group()
        container.position.set(36, 0, -56)

        // 1. Water aura ring (Cognitive Purple / Magenta)
        const aura = this.createWaterRipples('#a855f7', 4.2)
        container.add(aura)

        // 2. Central Neural Cognitive Core
        const coreGeo = new THREE.IcosahedronGeometry(1.2, 1)
        const coreMat = new THREE.MeshBasicNodeMaterial({
            color: '#c084fc',
            wireframe: false
        })
        const core = new THREE.Mesh(coreGeo, coreMat)
        core.position.y = 3.4
        container.add(core)

        const coreWireMat = new THREE.MeshBasicNodeMaterial({
            color: '#f472b6',
            wireframe: true
        })
        const coreWire = new THREE.Mesh(coreGeo, coreWireMat)
        coreWire.scale.setScalar(1.1)
        core.add(coreWire)

        // 3. Orbiting Autonomous Cognitive Bots (8 satellite nodes)
        const bots = []
        const botGeo = new THREE.SphereGeometry(0.18, 8, 8)
        const botMat = new THREE.MeshBasicNodeMaterial({ color: '#f472b6' })

        for(let i = 0; i < 8; i++)
        {
            const bot = new THREE.Mesh(botGeo, botMat)
            container.add(bot)
            bots.push({
                mesh: bot,
                offset: (i / 8) * Math.PI * 2,
                radius: 2.2 + (i % 2) * 0.6,
                speed: 1.0 + (i % 3) * 0.3
            })
        }

        // 4. Point Light
        const light = new THREE.PointLight('#c084fc', 20, 24)
        light.position.y = 3.4
        container.add(light)

        this.group.add(container)

        this.landmarks.push({
            id: 'hive',
            container,
            monolith: core,
            bots,
            rings: [],
            baseY: 3.4,
            aura,
            pulseSpeed: 1.6
        })
    }

    update()
    {
        const delta = this.game.ticker.delta
        this.time += delta
        const welcoming = !!document.querySelector('.voyage-welcome:not(.is-hidden)')

        for(const lm of this.landmarks)
        {
            lm.sign?.quaternion.copy(this.game.view.camera.quaternion)
            if(lm.sign)
            {
                const boat = this.game.physicalVehicle?.position
                const near = this.game.world.nauticalAreas?.nearProject === lm.id
                const touring = this.game.view.cinematic.active
                lm.sign.visible = !welcoming
                    && (touring ? this.game.view.portfolioStop === lm.id : near)
            }
            // Gentle levitation bobbing
            const bob = Math.sin(this.time * lm.pulseSpeed) * 0.25
            lm.monolith.position.y = lm.baseY + bob
            lm.monolith.rotation.y += delta * 0.8
            lm.monolith.rotation.x += delta * 0.3

            // Pulsing scale
            const pulse = 1.0 + Math.sin(this.time * lm.pulseSpeed * 1.5) * 0.08
            lm.monolith.scale.set(pulse, pulse, pulse)

            // Orbiting rings
            if(lm.rings)
            {
                lm.rings.forEach((r, idx) =>
                {
                    r.position.y = lm.baseY + bob * 0.5
                    r.rotation.z += delta * (idx === 0 ? 0.7 : -0.9)
                    r.rotation.x += delta * 0.4
                })
            }

            // Orbiting bot swarm for Hive
            if(lm.bots)
            {
                lm.bots.forEach(b =>
                {
                    const angle = this.time * b.speed + b.offset
                    b.mesh.position.x = Math.cos(angle) * b.radius
                    b.mesh.position.z = Math.sin(angle) * b.radius
                    b.mesh.position.y = lm.baseY + Math.sin(angle * 2.0) * 0.8
                })
            }

            // Aura ring pulsation
            if(lm.aura)
            {
                const auraPulse = 1.0 + Math.sin(this.time * lm.pulseSpeed) * 0.15
                lm.aura.scale.set(auraPulse, auraPulse, 1)
            }
        }
    }

    destroy()
    {
        this.game.ticker.events.off('tick', this.update)
        this.group.removeFromParent()
    }
}
