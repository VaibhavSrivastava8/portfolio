import { Events } from './Events.js'

export class Viewport
{
    constructor(domElement)
    {
        this.domElement = domElement

        this.events = new Events()
        
        this.measure()
        this.setResize()
    }

    measure()
    {
        const bounding = this.domElement.getBoundingClientRect()

        this.width = bounding.width
        this.height = bounding.height
        this.ratio = this.width / this.height

        this.pixelRatioPure = window.devicePixelRatio
        const touchDevice = window.matchMedia('(pointer: coarse)').matches || this.width < 768
        this.pixelRatioMax = touchDevice ? 1.25 : 1.5
        this.pixelRatio = Math.min(this.pixelRatioPure, this.pixelRatioMax)
    }

    setResize()
    {
        const throttleDuration = 400
        let throttleTimeout = null
        const resize = () =>
        {
            const previousWidth = this.width
            const previousHeight = this.height
            const previousRatio = this.pixelRatio
            this.measure()
            if(previousWidth === this.width && previousHeight === this.height && previousRatio === this.pixelRatio) return
            this.events.trigger('change')

            if(throttleTimeout)
            {
                clearTimeout(throttleTimeout)
            }

            throttleTimeout = setTimeout(() =>
            {
                throttleTimeout = null
                this.events.trigger('throttleChange')
            }, throttleDuration)
        }
        addEventListener('resize', resize)
        // Also catch layout/display changes that don't fire window.resize.
        this.resizeObserver = new ResizeObserver(resize)
        this.resizeObserver.observe(this.domElement)
    }
}
