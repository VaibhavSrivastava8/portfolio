import { Game } from '../Game.js'

// Screen-space steering, independent of the camera and world raycasting.
export class TouchHelm
{
    constructor(inputs)
    {
        this.game = Game.getInstance()
        this.inputs = inputs
        this.active = false
        this.throttle = 0
        this.steering = 0
        this.pointerId = null
        this.element = document.createElement('div')
        this.element.className = 'touch-helm'
        this.element.innerHTML = '<button class="touch-helm-pad" type="button" aria-label="Sailing joystick: drag up to sail, down to reverse, left or right to steer"><span class="touch-helm-cross" aria-hidden="true">↑</span><span class="touch-helm-knob" aria-hidden="true"></span></button><span class="touch-helm-caption">Drag to sail · release to slow</span>'
        document.querySelector('.game').append(this.element)
        this.pad = this.element.querySelector('button')
        this.knob = this.element.querySelector('.touch-helm-knob')
        this.pad.addEventListener('pointerdown', event =>
        {
            if(this.pointerId !== null || !this.canSail()) return
            event.preventDefault()
            event.stopPropagation()
            this.pointerId = event.pointerId
            this.pad.setPointerCapture(event.pointerId)
            this.inputs.updateMode(3)
            this.active = true
            this.element.classList.add('is-active')
            this.move(event)
        })
        this.pad.addEventListener('pointermove', event =>
        {
            if(event.pointerId !== this.pointerId) return
            event.preventDefault()
            event.stopPropagation()
            if(!this.canSail()) this.reset()
            else this.move(event)
        })
        for(const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
            this.pad.addEventListener(name, event =>
            {
                if(event.pointerId === this.pointerId) this.reset()
            })
        window.addEventListener('blur', () => this.reset())
        document.addEventListener('visibilitychange', () => { if(document.hidden) this.reset() })
        document.addEventListener('pointerdown', event =>
        {
            if(event.target.closest('.spatial-command-dock')) this.reset()
        }, true)
        this.game.ticker.events.on('tick', () =>
        {
            if(this.active && !this.canSail()) this.reset()
        }, 0)
    }

    enabled()
    {
        return matchMedia('(pointer: coarse), (max-width: 900px)').matches
    }

    canSail()
    {
        return this.enabled() && this.inputs.filters.has('wandering') && this.game.player?.state === 1
    }

    move(event)
    {
        const rect = this.pad.getBoundingClientRect()
        const radius = rect.width * 0.32
        let x = (event.clientX - rect.left - rect.width / 2) / radius
        let y = (event.clientY - rect.top - rect.height / 2) / radius
        const length = Math.hypot(x, y)
        if(length > 1) { x /= length; y /= length }
        const axis = value => Math.abs(value) < 0.12 ? 0 : Math.sign(value) * (Math.abs(value) - 0.12) / 0.88
        this.steering = -axis(x)
        this.throttle = -axis(y)
        this.knob.style.transform = `translate(${x * radius}px, ${y * radius}px)`
    }

    reset()
    {
        const id = this.pointerId
        this.pointerId = null
        this.active = false
        this.throttle = 0
        this.steering = 0
        this.element.classList.remove('is-active')
        this.knob.style.transform = 'none'
        if(id !== null && this.pad.hasPointerCapture(id)) this.pad.releasePointerCapture(id)
    }
}
