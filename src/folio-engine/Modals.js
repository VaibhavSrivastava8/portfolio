import { Events } from './Events.js'
import { Game } from './Game.js'
import { Tabs } from './Tabs.js'
import { focusPortfolioStop } from './PortfolioTour.js'

export class Modals
{
    static OPEN = 1
    static OPENING = 2
    static CLOSED = 3
    static CLOSING = 4
    
    constructor()
    {
        this.game = Game.getInstance()
        this.state = Modals.CLOSED
        this.element = document.querySelector('.js-modals')
        this.current = null
        this.pending = null
        this.default = null
        this.events = new Events()

        this.setClose()
        this.setItems()
        this.preopen()
        
        this.element.addEventListener('transitionend', (event) =>
        {
            if(event.target === this.element) this.onTransitionEnded()
        })
        this.element.addEventListener('keydown', (event) =>
        {
            if(event.key !== 'Tab' || !this.current) return
            const elements = [...this.current.element.querySelectorAll('button, a[href], [tabindex]')]
                .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length)
            const first = elements[0]
            const last = elements[elements.length - 1]
            if(event.shiftKey && document.activeElement === first)
            {
                event.preventDefault()
                last?.focus()
            }
            else if(!event.shiftKey && document.activeElement === last)
            {
                event.preventDefault()
                first?.focus()
            }
        })
    }

    onTransitionEnded()
    {
        clearTimeout(this.transitionTimer)
        if(this.state === Modals.OPENING)
        {
            this.state = Modals.OPEN
            this.events.trigger('opened')
            this.current.events.trigger('opened')
        }
        else if(this.state === Modals.CLOSING)
        {
            this.state = Modals.CLOSED
            this.events.trigger('closed')
            this.current.events.trigger('closed')
            this.current.element.classList.remove('is-displayed')
            this.current = null
            
            // Pending => Open pending
            if(this.pending)
            {
                this.open(this.pending)
                this.pending = null
            }

            // No pending => Fully hide
            else
            {
                this.element.classList.remove('is-displayed')
            }
        }
    }

    setItems()
    {
        const elements = this.element.querySelectorAll('.js-modal')
        
        this.items = new Map()
        
        for(const element of elements)
        {
            const name = element.dataset.name

            const item = {
                name: name,
                element: element,
                isOpen: false,
                tabs: null,
                mainFocus: element.querySelector('.js-main-focus'),
                events: new Events()
            }

            const tabsElement = element.querySelector('.js-tabs')

            if(tabsElement)
                item.tabs = new Tabs(tabsElement)

            this.items.set(name, item)

            if(typeof element.dataset.default !== 'undefined')
                this.default = item
        }
    }

    setClose()
    {
        this.element.querySelectorAll('.js-return-projects').forEach(button =>
            button.addEventListener('click', () => this.close()))
        const closeElements = this.element.querySelectorAll('.js-close')

        for(const element of closeElements)
        {
            element.addEventListener('click', () =>
            {
                this.pending = null
                this.close()
            })
        }

        this.element.addEventListener('click', (event) =>
        {
            if(event.target === this.element)
                this.close()
        })
    }

    open(name)
    {
        const item = this.items.get(name)

        if(!item)
            return
        if(name !== 'map' && !this.game.world?.nauticalAreas?.canInspect(name))
        {
            this.game.world?.nauticalAreas?.setDestination(name)
            return
        }

        // Already visible => Set pending
        if(this.state === Modals.OPEN || this.state === Modals.OPENING)
        {
            if(item === this.current)
                return

            this.pending = name
            this.close()
        }
        // Already closing => Set (or change) pending
        else if(this.state === Modals.CLOSING)
        {
            this.pending = name
        }
        // Currently closed => Open immediately
        else if(this.state === Modals.CLOSED)
        {
            this.returnFocus = document.activeElement
            // Sound
            const sound = this.game.audio.groups.get('click')
            if(sound)
                sound.play(true)

            this.element.classList.add('is-displayed')
            item.element.classList.add('is-displayed')

            requestAnimationFrame(() =>
            {
                requestAnimationFrame(() =>
                {
                    this.element.classList.add('is-visible')

                    // Tabs resize
                    if(item.tabs)
                        item.tabs.resize()

                    // Focus
                    ;(item.mainFocus || item.element.querySelector('.js-close'))?.focus()
                    this.transitionTimer = setTimeout(() => this.onTransitionEnded(), 350)
                })
            })

            this.state = Modals.OPENING
            this.current = item
            item.isOpen = true
            this.events.trigger('open')
            item.events.trigger('open')
            this.game.inputs.filters.clear()
            this.game.inputs.filters.add('modal')
            if(name !== 'map') focusPortfolioStop(this.game, name)
        }
    }

    close()
    {
        if(this.state === Modals.CLOSING || this.state === Modals.CLOSED)
            return

        // Sound
        const sound = this.game.audio.groups.get('click')
        if(sound)
            sound.play(false)

        this.element.classList.remove('is-visible')

        this.state = Modals.CLOSING
        this.current.isOpen = false
        this.events.trigger('close')
        this.current.events.trigger('close')
        if(this.current.name !== 'map') this.game.view.cinematic.end()
        const returnTarget = this.returnFocus?.getClientRects().length
            ? this.returnFocus : document.querySelector('.js-menu-trigger')
        returnTarget?.focus()
        this.transitionTimer = setTimeout(() => this.onTransitionEnded(), 350)
    }

    preopen()
    {
        if(this.game.debug.active)
            return

        this.items.forEach((item) => 
        {
            // Is preopened
            if(typeof item.element.dataset.preopen !== 'undefined')
            {
                this.open(item.name)               
            }
        })
    }
}
