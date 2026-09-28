import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { portfolioStops } from '../../../data/portfolioStops.js'

export class NauticalAreas
{
    constructor()
    {
        this.game = Game.getInstance()

        this.currentZone = 'harbor'
        this.nearProject = null
        this.visited = new Set()
        this.destination = null
        this.routeElement = document.querySelector('.js-voyage-route')
        this.discoveryElement = document.querySelector('.js-voyage-discoveries')
        document.querySelector('.js-clear-course')?.addEventListener('click', () => this.setDestination(null))

        this.zones = portfolioStops.map(stop => ({
            ...stop,
            name: stop.label,
            center: new THREE.Vector2(stop.x, stop.z),
            radius: 6
        }))

        this.setKeyboardInteraction()

        this.tickCallback = () => this.update()
        this.game.ticker.events.on('tick', this.tickCallback, 10)
    }

    setKeyboardInteraction()
    {
        this.game.inputs.events.on('interact', action =>
        {
            if(action.active && this.nearProject) this.openProject(this.nearProject)
        })
        this.game.inputs.interactiveButtons.events.on('interact', () =>
        {
            if(this.nearProject) this.openProject(this.nearProject)
        })
        window.addEventListener('keydown', (e) =>
        {
            if(e.code === 'KeyE' && this.nearProject)
            {
                if(this.game.modals?.current || document.querySelector('.js-menu.is-displayed')) return
                e.preventDefault()
                this.openProject(this.nearProject)
            }
        })

        const promptBtn = document.querySelector('.js-interact-prompt')
        if(promptBtn)
        {
            promptBtn.addEventListener('click', () =>
            {
                this.update()
                if(this.nearProject)
                {
                    this.openProject(this.nearProject)
                }
            })
        }
    }

    update()
    {
        const boatPos = this.game.physicalVehicle?.position
        if(!boatPos) return
        this.updateRoute(boatPos)

        let activeZone = null
        let closestDist = Infinity

        for(const zone of this.zones)
        {
            const dist = Math.hypot(boatPos.x - zone.center.x, boatPos.z - zone.center.y)
            if(dist < zone.radius && dist < closestDist)
            {
                closestDist = dist
                activeZone = zone
            }
        }

        if(activeZone && activeZone.id !== this.currentZone)
        {
            this.currentZone = activeZone.id
            this.onZoneEnter(activeZone)
        }
        else if(!activeZone && this.currentZone !== 'open_sea')
        {
            this.currentZone = 'open_sea'
            this.hideInteractionPrompt()
            this.nearProject = null
        }

        // Project interaction proximity
        if(activeZone && (activeZone.modal || activeZone.menu) && this.game.overlay?.progress.value < 0.001)
        {
            this.nearProject = activeZone.id
            this.showInteractionPrompt(`Press [E] to explore ${activeZone.name}`)
        }
        else
        {
            this.nearProject = null
            this.hideInteractionPrompt()
        }
    }

    onZoneEnter(zone)
    {
        if(!this.game.notifications) return

        if(zone.id === 'treasure')
        {
            // Trigger celebration achievement
            this.game.notifications.add({
                title: 'Secret Unlocked',
                text: 'You discovered the Secret Treasure Atoll!'
            })
        }
        else if(zone.id === 'trench')
        {
            this.game.notifications.add({
                title: 'Danger Zone',
                text: 'Warning! Sea predators detected in the deep trench!'
            })
        }
    }

    openProject(id)
    {
        if(this.game.modals?.current || document.querySelector('.js-menu.is-displayed')) return
        const stop = portfolioStops.find(stop => stop.id === id)
        if(!stop || !this.canInspect(stop.menu || stop.id)) return
        this.visited.add(stop.id)
        if(this.discoveryElement) this.discoveryElement.textContent = this.visited.size + ' / ' + portfolioStops.length + ' discovered'
        if(stop?.menu) this.game.menu?.open(stop.menu)
        else if(stop?.modal) this.game.modals?.open(stop.modal)
    }

    canInspect(id)
    {
        if(this.game.overlay?.progress.value > 0.001) return false
        const stop = portfolioStops.find(stop => stop.id === id || stop.menu === id)
        const boat = this.game.physicalVehicle?.position
        return !!stop && !!boat && Math.hypot(boat.x - stop.x, boat.z - stop.z) < 6
    }

    setDestination(destination)
    {
        this.destination = typeof destination === 'string'
            ? portfolioStops.find(stop => stop.id === destination || stop.menu === destination)
            : destination
        if(this.routeElement) this.routeElement.hidden = !this.destination
        const label = this.routeElement?.querySelector('.js-course-label')
        if(label && this.destination) label.textContent = this.destination.label
    }

    updateRoute(boat)
    {
        if(!this.destination || !this.routeElement) return
        const dx = this.destination.x - boat.x
        const dz = this.destination.z - boat.z
        const distance = Math.hypot(dx, dz)
        const label = this.routeElement.querySelector('.js-course-distance')
        const value = distance < 6 ? 'Arrived · inspect the landmark' : Math.round(distance) + ' m · follow the bearing'
        if(label && label.textContent !== value) label.textContent = value
        // Project the world bearing into camera space, so the compass remains useful in orbit mode.
        const angle = Math.atan2(dx, dz) - Math.atan2(
            this.game.view.camera.position.x - boat.x,
            this.game.view.camera.position.z - boat.z
        )
        const arrow = this.routeElement.querySelector('.js-course-arrow')
        if(arrow) arrow.style.transform = 'rotate(' + (180 - angle * 180 / Math.PI) + 'deg)'
    }

    updateZoneUI()
    {
        // Removed as requested
    }

    showInteractionPrompt(text)
    {
        const promptElem = document.querySelector('.js-interact-prompt')
        if(promptElem)
        {
            promptElem.textContent = text
            promptElem.classList.add('is-visible')
        }
    }

    hideInteractionPrompt()
    {
        const promptElem = document.querySelector('.js-interact-prompt')
        if(promptElem)
        {
            promptElem.classList.remove('is-visible')
        }
    }
}
