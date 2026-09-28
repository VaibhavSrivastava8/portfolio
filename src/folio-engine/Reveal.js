import * as THREE from 'three/webgpu'
import { color, uniform, vec2 } from 'three/tsl'
import { Game } from './Game.js'
import gsap from 'gsap'

export class Reveal
{
    constructor()
    {
        this.game = Game.getInstance()
        
        this.step = -1
        const respawn = this.game.respawns.getDefault()
        this.position = respawn.position.clone()
        this.position2Uniform = uniform(vec2(this.position.x, this.position.z))
        this.distance = uniform(99999)
        this.thickness = uniform(0.05)
        this.color = uniform(color('#e88eff'))
        this.intensity = uniform(5.5)
        this.intensityMultiplier = 1
        this.sound = this.game.audio.register({
            path: 'sounds/reveal/reveal-1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            preload: true
        })

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '📜 Reveal',
                expanded: false,
            })

            this.debugPanel.addBinding(this.distance, 'value', { label: 'distance', min: 0, max: 20, step: 0.01 })
            this.debugPanel.addBinding(this.thickness, 'value', { label: 'thickness', min: 0, max: 1, step: 0.001 })
            // this.game.debug.addThreeColorBinding(this.debugPanel, this.color.value, 'color')
            this.debugPanel.addBinding(this.intensity, 'value', { label: 'intensity', min: 1, max: 20, step: 0.001 })
        }

        this.update = this.update.bind(this)
        this.game.ticker.events.on('tick', this.update, 10)

        // Early embarkation listener
        this.earlyEmbark = this.game.embarkRequested
        const earlyEmbarkBtn = document.querySelector('.js-landing-embark')
        if(earlyEmbarkBtn)
        {
            earlyEmbarkBtn.addEventListener('click', (e) =>
            {
                e.stopPropagation()
                if(this.step === 0 && this.embarkNext)
                {
                    this.embarkNext()
                }
                else
                {
                    this.earlyEmbark = true
                }
            })
        }

        const openMenuBtns = document.querySelectorAll('.js-portal-open-menu')
        for(const btn of openMenuBtns)
        {
            btn.addEventListener('click', (e) =>
            {
                e.stopPropagation()
                if(this.step === 0 && this.embarkNext)
                {
                    this.embarkNext()
                }
                else
                {
                    this.earlyEmbark = true
                }
                setTimeout(() =>
                {
                    const menuTrigger = document.querySelector('.js-menu-trigger')
                    if(menuTrigger) menuTrigger.click()
                }, 350)
            })
        }

        const openMapBtns = document.querySelectorAll('.js-portal-open-map')
        for(const btn of openMapBtns)
        {
            btn.addEventListener('click', (e) =>
            {
                e.stopPropagation()
                if(this.step === 0 && this.embarkNext) this.embarkNext()
                else this.earlyEmbark = true
                setTimeout(() =>
                {
                    const mapTrigger = document.querySelector('.js-map-trigger')
                    if(mapTrigger) mapTrigger.click()
                }, 350)
            })
        }

        const toggleOrbitBtns = document.querySelectorAll('.js-portal-toggle-orbit')
        for(const btn of toggleOrbitBtns)
        {
            btn.addEventListener('click', (e) =>
            {
                e.stopPropagation()
                if(this.step === 0 && this.embarkNext) this.embarkNext()
                else this.earlyEmbark = true
                setTimeout(() =>
                {
                    const camToggle = document.querySelector('.js-camera-mode-toggle')
                    if(camToggle) camToggle.click()
                }, 350)
            })
        }

        const soundToggleBtns = document.querySelectorAll('.js-portal-sound-toggle')
        for(const btn of soundToggleBtns)
        {
            btn.addEventListener('click', (e) =>
            {
                e.stopPropagation()
                this.game.audio.mute.toggle()
            })
        }
        this.game.audio.events.on('muteChange', (active) =>
        {
            for(const btn of soundToggleBtns)
            {
                btn.innerText = active ? '🔇 Sound: Off' : '🔊 Sound: On'
            }
        })

        window.addEventListener('keydown', (e) =>
        {
            const embarkKeys = ['Space', 'Enter', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
            if(embarkKeys.includes(e.code) && this.step <= 0)
            {
                if(this.step === 0 && this.embarkNext)
                {
                    this.embarkNext()
                }
                else
                {
                    this.earlyEmbark = true
                }
            }
            if(e.code === 'Escape' && this.step <= 0)
            {
                if(this.step === 0 && this.embarkNext)
                {
                    this.embarkNext()
                }
                else
                {
                    this.earlyEmbark = true
                }
                setTimeout(() =>
                {
                    const menuTrigger = document.querySelector('.js-menu-trigger')
                    if(menuTrigger) menuTrigger.click()
                }, 350)
            }
        })
    }

    updateStep(step)
    {
        const speedMultiplier = location.hash.match(/skip/i) ? 4 : 1

        // Step 0: Cinematic Cover Landing Screen
        if(step === 0)
        {
            this.step = 0
            this.distance.value = 99999

            // View: Natural sailing view
            this.game.view.zoom.smoothedRatio = 0.45
            this.game.view.zoom.baseRatio = 0.45
            this.game.view.setLandingMode(true)

            const landingEl = document.querySelector('.js-landing-screen')
            if(landingEl)
            {
                landingEl.classList.remove('is-hidden')
            }

            const next = () =>
            {
                if(this.step >= 1) return
                this.updateStep(1)
                this.game.inputs.events.off('introStart', inputCallback)
                window.removeEventListener('keydown', keyCallback)
                if(landingEl)
                {
                    landingEl.classList.add('is-hidden')
                    setTimeout(() => landingEl.remove(), 1200)
                }
            }
            this.embarkNext = next

            const inputCallback = () => next()
            const keyCallback = (e) =>
            {
                if(e.code === 'Space' || e.code === 'Enter')
                {
                    next()
                }
            }

            if(location.hash.match(/skip/i) || this.earlyEmbark)
            {
                next()
                return
            }

            if(landingEl)
            {
                const embarkBtn = landingEl.querySelector('.js-landing-embark')
                if(embarkBtn)
                {
                    embarkBtn.addEventListener('click', (e) => { e.stopPropagation(); next() })
                }
            }

            window.addEventListener('keydown', keyCallback)

            this.game.inputs.addActions([
                { name: 'introStart', categories: [ 'intro' ], keys: [ 'Gamepad.cross', 'Keyboard.Enter', 'Keyboard.Space' ] },
            ])
            this.game.inputs.events.on('introStart', inputCallback)
        }
        else if(step === 1)
        {
            this.step = 1
            this.game.view.setLandingMode(false)
            // Audio
            this.game.audio.init()
            this.sound.play()

            // Keep full reveal distance
            this.distance.value = 99999

            const landingEl = document.querySelector('.js-landing-screen')
            if(landingEl)
            {
                landingEl.classList.add('is-hidden')
                setTimeout(() => landingEl.remove(), 1200)
            }

            // Inputs
            this.game.inputs.filters.clear()
            this.game.inputs.filters.add('wandering')

            // View
            this.game.view.focusPoint.isTracking = true
            this.game.view.focusPoint.magnet.active = false

            // View
            gsap.to(
                this.game.view.zoom,
                {
                    baseRatio: 0.5,
                    ease: 'power2.out',
                    duration: 1.5 / speedMultiplier,
                    overwrite: true,
                    onComplete: () =>
                    {
                        this.updateStep(2)
                    }
                }
            )

            // Cherry trees
            if(this.game.world.cherryTrees)
            {
                gsap.to(
                    this.game.world.cherryTrees.leaves,
                    {
                        seeThroughMultiplier: 1,
                        ease: 'power1.inOut',
                        duration: 2 / speedMultiplier,
                        overwrite: true
                    }
                )
            }
        }
        else if(step === 2)
        {
            this.game.interactivePoints.recover()
            
            this.game.world.step(2)
            this.game.world.grid.destroy()
            this.game.world.intro.destroy()
            this.game.world.intro = null

            this.game.overlay.moveOnTop()

            this.game.server.start()

            this.game.menu.preopen()

            this.game.ticker.events.off('tick', this.update)
        }

        this.step = step
    }

    update()
    {
        this.color.value.copy(this.game.dayCycles.properties.revealColor.value)
        this.intensity.value = this.game.dayCycles.properties.revealIntensity.value * this.intensityMultiplier
    }
}
