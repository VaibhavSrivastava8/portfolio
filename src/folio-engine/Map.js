import { clamp } from 'three/src/math/MathUtils.js'
import { Game } from './Game.js'
import { portfolioStops } from '../data/portfolioStops.js'

export class Map
{
    constructor()
    {
        this.game = Game.getInstance()

        this.initiated = false
        this.modal = this.game.modals.items.get('map')
        this.element = this.modal.element.querySelector('.js-map-container')

        this.setTrigger()
        this.setInputs()
        this.selection = null
        const travel = this.modal.element.querySelector('.js-chart-travel')
        this.modal.element.querySelector('.js-chart-course')?.addEventListener('click', () =>
        {
            if(!this.selection) return
            const { item, respawn } = this.selection
            this.game.world.nauticalAreas.setDestination({
                id: item.respawnName, label: item.name.replace(/<[^>]*>/g, ' '),
                x: respawn.position.x, z: respawn.position.z
            })
            this.game.modals.close()
        })
        this.modal.element.querySelector('.js-chart-teleport')?.addEventListener('click', () =>
        {
            if(!this.selection) return
            this.game.player.respawn(this.selection.item.respawnName, () =>
            {
                this.game.view.focusPoint.isTracking = true
            })
            this.game.modals.close()
        })

        this.modal.events.on('open', () =>
        {
            if(!this.initiated)
                this.init()

            this.texture.update()
            this.update(true)
            this.selection = null
            if(travel) travel.hidden = true
            setTimeout(() => this.layoutLabels(), 300)
        })
        this.game.viewport.events.on('change', () =>
        {
            if(this.modal.isOpen) requestAnimationFrame(() => this.layoutLabels())
        })
    }

    layoutLabels()
    {
        // Keep names readable on small charts without moving their destinations.
        const labels = [...this.element.querySelectorAll('.chart-pin-label')]
        labels.forEach(label => label.style.translate = 'none')
        const bounds = this.element.getBoundingClientRect()
        const placed = []
        labels.sort((a, b) => Number(a.parentElement.classList.contains('is-territory')) - Number(b.parentElement.classList.contains('is-territory')))
        for(const label of labels)
        {
            const rect = label.getBoundingClientRect()
            for(const shift of [0, -8, 8, -16, 16, -24, 24, -32, 32, -40, 40, -48, 48, -56, 56])
            {
                const candidate = { left: rect.left, right: rect.right, top: rect.top + shift, bottom: rect.bottom + shift }
                if(candidate.top < bounds.top || candidate.bottom > bounds.bottom) continue
                if(placed.some(other => candidate.left < other.right + 3 && candidate.right > other.left - 3 && candidate.top < other.bottom + 3 && candidate.bottom > other.top - 3)) continue
                label.style.translate = `0 ${shift}px`
                placed.push(candidate)
                break
            }
        }
    }

    init()
    {
        this.initiated = true

        this.setTexture()
        this.setLocations()
        this.setPlayer()
        this.setTelemetryHUD()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 14)
    }

    setTexture()
    {
        this.texture = { element: this.element.querySelector('.js-texture') }
        this.texture.element.alt = 'Top-down photograph of the actual islands, terrain, water, and scenery'
        this.texture.element.addEventListener('load', () => this.texture.element.classList.add('is-visible'))
        this.texture.update = () =>
        {
            if(!this.texture.element.getAttribute('src'))
                this.texture.element.src = '/ui/map/world-topdown.png'
        }
    }

    setLocations()
    {
        this.locations = {}
        this.locations.items = [
            // Tier 1: Major Strongholds
            { name: '⚓ The Anchorage<br />(Central Port & Starting Haven)', respawnName: 'anchorage', category: 'major', offset: { x: 0, y: 0 } },
            { name: '📜 Shipwreck Cove<br />(Skeleton Galleon & Hidden Sands)', respawnName: 'pdfretype', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🏰 Citadel Fortress<br />(Keep Me Stable Bastion)', respawnName: 'citadel', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🧬 Coral Atoll<br />(Hive Cognitive Civilization)', respawnName: 'treasureAtoll', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🦕 Dinosaur Shallows<br />(Mangrove Estuary & Spinosaurus)', respawnName: 'spinosaurus', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🦈 Serpent\'s Deep<br />(Reef Shoals & Shark Waters)', respawnName: 'sharks', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🐙 Kraken Abyssal Vortex<br />(Whirlpool Lair & Sunken Ruins)', respawnName: 'kraken', category: 'major', offset: { x: 0, y: 0 } },
            { name: '🦕 Mosasaurus Trench<br />(Southern Abyssal Drop-off)', respawnName: 'mosasaurus', category: 'major', offset: { x: 0, y: 0 } },

            // Tier 2: Named Secondary Cays & Outposts
            { name: '🏝️ Smuggler\'s Cay', respawnName: 'smugglersCay', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ Cannon Cay', respawnName: 'cannonCay', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ Mermaid\'s Rest', respawnName: 'mermaidsRest', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ Siren\'s Ridge', respawnName: 'sirensRidge', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ Mist Haven Islet', respawnName: 'mistHaven', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ East Barrier Reef', respawnName: 'eastBarrier', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏝️ Southern Beacon Watch', respawnName: 'southernBeacon', category: 'cay', offset: { x: 0, y: 0 } },

            // Tier 3: POIs & Ruins
            { name: '⚓ Ghost Galleon Wreck', respawnName: 'ghostGalleon', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏛️ Ancient Sea Ruins', respawnName: 'ancientRuins', category: 'cay', offset: { x: 0, y: 0 } },

            // Tier 4: Four Corner Coastal Mountain Summits (World Perimeter)
            { name: '🏔️ Mount Sentinel Summit (NW)', respawnName: 'cornerNW', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏔️ Dragon\'s Tooth Peak (NE)', respawnName: 'cornerNE', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏔️ Kraken\'s Horn Fjord (SW)', respawnName: 'cornerSW', category: 'cay', offset: { x: 0, y: 0 } },
            { name: '🏔️ Siren\'s Bastion Bluff (SE)', respawnName: 'cornerSE', category: 'cay', offset: { x: 0, y: 0 } }
        ]

        for(const stop of portfolioStops)
        {
            const existing = this.locations.items.find(item => item.respawnName === stop.anchor)
            if(existing) existing.name = stop.label
            else this.locations.items.push({
                name: stop.label, respawnName: stop.anchor,
                category: 'cay', offset: { x: 0, y: 0 }
            })
        }

        // Remove any old SVG or location pins
        this.element.querySelectorAll('.js-nautical-chart-svg, .location').forEach(el => el.remove())

        for(const item of this.locations.items)
        {
            const respawn = this.game.respawns.getByName(item.respawnName)
            if(!respawn) continue

            const mapPosition = this.worldToMap(respawn.position)

            // Refined pirate chart pin and parchment banner
            const html = /* html */`
                <div class="pin ${item.category === 'cay' ? 'pin-cay' : 'pin-major'}">
                    <div class="pin-jewel"></div>
                </div>
                <div class="name-container">
                    <div class="name ${item.category === 'cay' ? 'name-cay' : 'name-major'}">
                        <span class="name-text">${item.name}</span>
                        <span class="travel-hint">Set bearing · sail there yourself</span>
                    </div>
                </div>
            `

            const element = document.createElement('button')
            const portfolioStop = portfolioStops.find(stop => stop.anchor === item.respawnName)
            const isTerritory = ['spinosaurus', 'mosasaurus', 'sharks', 'kraken'].includes(item.respawnName)
            element.type = 'button'
            element.setAttribute('aria-label', 'Set course for ' + item.name.replace(/<[^>]*>/g, ' '))
            element.classList.add('location')
            if(item.category === 'cay')
            {
                element.classList.add('is-cay')
            }
            element.innerHTML = html
            if(portfolioStop || isTerritory)
            {
                element.classList.add('has-chart-label')
                if(isTerritory) element.classList.add('is-territory', `territory-${item.respawnName}`)
                const label = document.createElement('span')
                label.className = 'chart-pin-label'
                label.textContent = portfolioStop?.label || {
                    spinosaurus: 'Spinosaurus', mosasaurus: 'Mosasaurus',
                    sharks: 'Shark waters', kraken: 'Kraken'
                }[item.respawnName]
                element.append(label)
            }
            element.style.left = `${(mapPosition.x + item.offset.x) * 100}%`
            element.style.top = `${(mapPosition.y + item.offset.y) * 100}%`
            element.style.zIndex = Math.round(mapPosition.y * 1000)

            this.element.append(element)

            element.addEventListener('pointerenter', () =>
            {
                element.classList.add('is-active')
            })

            element.addEventListener('pointerleave', () =>
            {
                element.classList.remove('is-active')
            })

            element.addEventListener('click', () =>
            {
                this.selection = { item, respawn }
                const travel = this.modal.element.querySelector('.js-chart-travel')
                if(travel)
                {
                    travel.hidden = false
                    travel.querySelector('.js-chart-destination').textContent = item.name.replace(/<[^>]*>/g, ' ')
                    travel.querySelector('.js-chart-course').focus()
                }
            })
        }
    }

    setPlayer()
    {
        this.player = {}
        this.player.element = this.element.querySelector('.js-player')
        this.player.roundedPosition = { x: -9999, y: -9999 }

        this.player.element.innerHTML = '<div class="ship-radar-pulse"></div><div class="ship-icon"></div>'
        const image = document.createElement('img')
        image.className = 'map-ship-model'
        image.alt = 'Your ship — top-down view of the game model'
        image.draggable = false
        image.src = '/ui/map/ship-topdown.png'
        this.player.element.querySelector('.ship-icon').append(image)
    }

    setTelemetryHUD()
    {
        let hud = this.element.querySelector('.js-map-telemetry')
        if(hud) return

        hud = document.createElement('div')
        hud.className = 'js-map-telemetry map-telemetry-hud'
        hud.innerHTML = `
            <span class="chart-north">N</span>
            <svg class="chart-heading-needle" aria-hidden="true" viewBox="0 0 32 32"><path d="M16 3 22 25 16 21 10 25Z" fill="currentColor"/><path d="m16 3 0 18-6 4Z" fill="#f7efdf"/></svg>
        `
        hud.setAttribute('role', 'img')
        hud.setAttribute('aria-label', 'Ship heading')
        this.element.appendChild(hud)
        this.telemetryHUD = hud
    }

    setTrigger()
    {
        const element = this.game.domElement.querySelector('.js-map-trigger')
        if(!element) return

        element.addEventListener('click', (event) =>
        {
            this.game.modals.open('map')
        })
        element.addEventListener('keydown', (event) =>
        {
            event.preventDefault()
        })
    }

    setInputs()
    {
        // Inputs keyboard
        this.game.inputs.addActions([
            { name: 'map', categories: [ 'modal', 'menu', 'wandering' ], keys: [ 'Keyboard.m', 'Keyboard.KeyM' ] },
        ])
        this.game.inputs.events.on('map', (action) =>
        {
            if(action.active)
            {
                if(!this.modal.isOpen)
                    this.game.modals.open('map')
                else
                    this.game.modals.close()
            }
        })
    }

    worldToMap(coordinates)
    {
        let x = coordinates.x
        let y = typeof coordinates.z !== 'undefined' ? coordinates.z : coordinates.y

        x /= this.game.terrain.size
        y /= this.game.terrain.size

        x += 0.5
        y += 0.5

        x = clamp(x, 0, 1)
        y = clamp(y, 0, 1)

        return { x, y }
    }

    update(force = false)
    {
        if(!this.modal.isOpen || !this.player.element)
            return

        const playerX = this.game.player?.position?.x || 0
        const playerZ = this.game.player?.position?.z || 0

        const playerRoundedX = Math.round(playerX * 10) / 10
        const playerRoundedY = Math.round(playerZ * 10) / 10

        // Calculate true compass bearing from 3D world forward vector
        const forward = this.game.physicalVehicle?.forward || { x: 1, y: 0, z: 0 }
        const bearing = Math.atan2(forward.x, -forward.z)
        const shipIcon = this.player.element.querySelector('.ship-icon')
        if(shipIcon)
        {
            shipIcon.style.transform = `rotate(${bearing}rad)`
        }

        // Update Telemetry HUD heading
        if(this.telemetryHUD)
        {
            const deg = Math.round((bearing * 180 / Math.PI + 360) % 360)
            const compassPoints = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest']
            const compassDir = compassPoints[Math.round(deg / 45) % 8]

            this.telemetryHUD.setAttribute('aria-label', `Ship heading: ${compassDir}, ${deg} degrees`)
            this.telemetryHUD.title = `Heading ${compassDir} · ${deg}°`
            this.telemetryHUD.querySelector('.chart-heading-needle').style.transform = `rotate(${bearing}rad)`
        }

        if(force || playerRoundedX !== this.player.roundedPosition.x || playerRoundedY !== this.player.roundedPosition.y)
        {
            this.player.roundedPosition.x = playerRoundedX
            this.player.roundedPosition.y = playerRoundedY

            const playerCoordinates = this.worldToMap({ x: playerX, z: playerZ })
            const x = Math.round(playerCoordinates.x * 1000) / 10
            const y = Math.round(playerCoordinates.y * 1000) / 10

            this.player.element.style.left = `${x}%`
            this.player.element.style.top = `${y}%`

            // Update Telemetry HUD coords & waters
            if(this.telemetryHUD)
            {
                const coordsEl = this.telemetryHUD.querySelector('.js-telem-coords')
                const watersEl = this.telemetryHUD.querySelector('.js-telem-waters')

                if(coordsEl) coordsEl.textContent = `X: ${playerX >= 0 ? '+' : ''}${playerX.toFixed(1)} | Z: ${playerZ >= 0 ? '+' : ''}${playerZ.toFixed(1)}`

                if(watersEl)
                {
                    const distTo = (tx, tz) => Math.hypot(playerX - tx, playerZ - tz)
                    let territory = 'The High Seas'
                    if(distTo(-123, 123) < 32) territory = '🏔️ Mount Sentinel Summit'
                    else if(distTo(123, 123) < 32) territory = '🏔️ Dragon\'s Tooth Peak'
                    else if(distTo(-123, -123) < 32) territory = '🏔️ Kraken\'s Horn Fjord'
                    else if(distTo(123, -123) < 32) territory = '🏔️ Siren\'s Bastion Bluff'
                    else if(playerZ > 110) territory = '🏔️ Northern Mountain Ridge & Sea Cliffs'
                    else if(playerZ < -110) territory = '🏔️ Southern Coastal Palisades & Fjord'
                    else if(playerX < -110) territory = '🏔️ Western Sea Cliffs & Plateaus'
                    else if(playerX > 110) territory = '🏔️ Eastern Mountain Peaks & Bluffs'
                    else if(distTo(0, 0) < 22) territory = 'The Anchorage'
                    else if(distTo(-66, 32) < 24) territory = 'Shipwreck Cove'
                    else if(distTo(69, 35) < 24) territory = 'Citadel Fortress Waters'
                    else if(distTo(54, -56) < 22) territory = 'Coral Lagoon'
                    else if(distTo(14, 90) < 22) territory = '🦕 Mosasaurus Abyssal Trench'
                    else if(distTo(-58, 76) < 22) territory = '🐙 Kraken Abyssal Vortex'
                    else if(distTo(-34, 15) < 14) territory = "Smuggler's Cay"
                    else if(distTo(36, 20) < 14) territory = 'Cannon Cay'
                    else if(distTo(34, -24) < 14) territory = "Mermaid's Rest Atoll"
                    else if(distTo(-22, -27) < 14) territory = "Siren's Ridge"
                    else if(distTo(-8, 50) < 14) territory = 'Mist Haven Islet'
                    else if(distTo(66, -22) < 14) territory = 'East Barrier Reef'
                    else if(distTo(-4, -52) < 14) territory = 'Southern Beacon Watch'
                    else if(distTo(-49, -50) < 22) territory = 'Dinosaur Shallows'
                    else if(distTo(-39, 66) < 22) territory = "Serpent's Deep"
                    else if(distTo(-90, 56) < 14) territory = 'Ghost Galleon Wreck'
                    else if(distTo(49, 62) < 14) territory = 'Ancient Sea Ruins'
                    else if(playerZ > 90) territory = 'The Deep Abyssal Ocean'

                    watersEl.textContent = territory
                }
            }
        }
    }
}
