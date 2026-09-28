import { Events } from './Events.js'
import { Game } from './Game.js'

export class Quality
{
    constructor()
    {
        this.game = Game.getInstance()

        this.events = new Events()

        this.level = 1 // Start balanced on every device; high quality is opt-in.
        this.userSelected = false
        this.monitorStart = performance.now() + 15000
        this.monitorFrames = 0
        this.slowWindows = 0
        this.monitorCallback = () =>
        {
            const now = performance.now()
            if(now < this.monitorStart || document.hidden || this.userSelected || this.level !== 0) return
            this.monitorFrames++
            if(now - this.monitorStart < 5000) return
            const fps = this.monitorFrames * 1000 / (now - this.monitorStart)
            this.slowWindows = fps < 28 ? this.slowWindows + 1 : 0
            this.monitorFrames = 0
            this.monitorStart = now
            if(this.slowWindows >= 2)
            {
                if(this.level === 0) this.changeLevel(1, true)
                this.slowWindows = 0
            }
        }

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '⚙️ Quality',
                expanded: false,
            })

            this.game.debug.addButtons(
                debugPanel,
                {
                    low: () =>
                    {
                        this.changeLevel(1)
                    },
                    high: () =>
                    {
                        this.changeLevel(0)
                    },
                },
                'change'
            )
        }
    }

    startMonitoring()
    {
        this.game.ticker.events.on('tick', this.monitorCallback, 20)
    }

    changeLevel(level = 0, automatic = false)
    {
        if(!automatic) this.userSelected = true
        // Same
        if(level === this.level)
            return
            
        this.level = level
        this.events.trigger('change', [ this.level ])
    }
}
