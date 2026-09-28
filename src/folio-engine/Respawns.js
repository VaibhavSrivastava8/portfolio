import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class Respawns
{
    constructor(defaultName = 'anchorage')
    {
        this.game = Game.getInstance()
        this.defaultName = defaultName

        this.setItems()
    }

    setItems()
    {
        this.items = new Map()

        for(const child of this.game.resources.respawnsReferencesModel.scene.children)
        {
            child.rotation.reorder('YXZ')

            let name = child.name.replace(/^respawn(.+)$/i, '$1')

            name = name.charAt(0).toLowerCase() + name.slice(1)

            const item = {
                name: name,
                position: new THREE.Vector3(
                    child.position.x,
                    4,
                    child.position.z
                ),
                rotation: child.rotation.y
            }

            this.items.set(name, item)
        }

        const nauticalRespawns = [
            // Tier 1: Major Strongholds (Mathematically verified offshore anchorages in 100% deep water, elev = -2.00m)
            { name: 'anchorage', position: new THREE.Vector3(-2.0, 0.05, 18.0), rotation: -Math.PI * 0.5 },
            { name: 'pdfretype', position: new THREE.Vector3(-45.0, 0.05, 32.0), rotation: 0.0 },
            { name: 'citadel', position: new THREE.Vector3(48.0, 0.05, 35.0), rotation: -Math.PI * 0.5 },
            { name: 'dangerReef', position: new THREE.Vector3(0.0, 0.05, 82.0), rotation: 0.0 },
            { name: 'treasureAtoll', position: new THREE.Vector3(36.0, 0.05, -56.0), rotation: -Math.PI * 0.5 },
            { name: 'sharks', position: new THREE.Vector3(-22.0, 0.05, 66.0), rotation: 0.0 },
            { name: 'spinosaurus', position: new THREE.Vector3(-30.0, 0.05, -50.0), rotation: Math.PI },
            { name: 'kraken', position: new THREE.Vector3(-58.0, 0.05, 76.0), rotation: -Math.PI * 0.25 },
            { name: 'mosasaurus', position: new THREE.Vector3(14.0, 0.05, 90.0), rotation: 0.0 },
            { name: 'skeletons', position: new THREE.Vector3(-45.0, 0.05, 32.0), rotation: 0.0 },

            // Tier 2: Named Secondary Cays & Outposts
            { name: 'smugglersCay', position: new THREE.Vector3(-34.0, 0.05, 27.0), rotation: 0.0 },
            { name: 'cannonCay', position: new THREE.Vector3(36.0, 0.05, 7.0), rotation: 0.0 },
            { name: 'mermaidsRest', position: new THREE.Vector3(34.0, 0.05, -12.0), rotation: -Math.PI * 0.5 },
            { name: 'sirensRidge', position: new THREE.Vector3(-22.0, 0.05, -14.0), rotation: -Math.PI * 0.5 },
            { name: 'mistHaven', position: new THREE.Vector3(-8.0, 0.05, 37.0), rotation: 0.0 },
            { name: 'eastBarrier', position: new THREE.Vector3(52.0, 0.05, -22.0), rotation: -Math.PI * 0.5 },
            { name: 'southernBeacon', position: new THREE.Vector3(-4.0, 0.05, -38.0), rotation: -Math.PI * 0.5 },

            // Tier 3: POIs & Ruins
            { name: 'ghostGalleon', position: new THREE.Vector3(-76.0, 0.05, 56.0), rotation: 0.0 },
            { name: 'merchantGraveyard', position: new THREE.Vector3(-44.0, 0.05, 91.0), rotation: -Math.PI * 0.25 },
            { name: 'ancientRuins', position: new THREE.Vector3(36.0, 0.05, 62.0), rotation: -Math.PI * 0.5 },
            { name: 'waypointBeacon', position: new THREE.Vector3(14.0, 0.05, 20.0), rotation: 0.0 },
            { name: 'sirensShallows', position: new THREE.Vector3(21.0, 0.05, -34.0), rotation: 0.0 },
            { name: 'coralShoal', position: new THREE.Vector3(70.0, 0.05, -46.0), rotation: -Math.PI * 0.5 },
            { name: 'swReef', position: new THREE.Vector3(-53.0, 0.05, -22.0), rotation: 0.0 },
            { name: 'easternDeep', position: new THREE.Vector3(73.0, 0.05, 6.0), rotation: -Math.PI * 0.5 },
            { name: 'abyssalSentinel', position: new THREE.Vector3(20.0, 0.05, 66.0), rotation: 0.0 },
            { name: 'neSandbar', position: new THREE.Vector3(42.0, 0.05, -73.0), rotation: 0.0 },
            { name: 'southSandSpit', position: new THREE.Vector3(-20.0, 0.05, -60.0), rotation: 0.0 },

            // Tier 4: Four Corner World Boundary Coral Atolls (+/- 100m)
            { name: 'cornerNW', position: new THREE.Vector3(-100.0, 0.05, 100.0), rotation: Math.PI * 0.25 },
            { name: 'cornerNE', position: new THREE.Vector3(100.0, 0.05, 100.0), rotation: -Math.PI * 0.25 },
            { name: 'cornerSW', position: new THREE.Vector3(-100.0, 0.05, -100.0), rotation: Math.PI * 0.75 },
            { name: 'cornerSE', position: new THREE.Vector3(100.0, 0.05, -100.0), rotation: -Math.PI * 0.75 }
        ]

        for(const item of nauticalRespawns)
        {
            this.items.set(item.name, item)
        }
        this.items.set('landing', { name: 'landing', position: new THREE.Vector3(-2.0, 0.05, 18.0), rotation: -Math.PI * 0.5 })
    }

    getByName(name)
    {
        return this.items.get(name)
    }

    getDefault()
    {
        return this.items.get(this.defaultName) || this.items.get('anchorage') || {
            name: 'anchorage',
            position: new THREE.Vector3(-2.0, 0.05, 16.0),
            rotation: -Math.PI * 0.5
        }
    }

    getClosest(position)
    {
        let closestItem = null
        let closestDistance = Infinity

        this.items.forEach((item) =>
        {
            const distance = Math.hypot(item.position.x - position.x, item.position.z - position.z)

            if(distance < closestDistance)
            {
                closestDistance = distance
                closestItem = item
            }
        })

        return closestItem
    }
}