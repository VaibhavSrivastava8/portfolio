import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { uniform } from 'three/tsl'

export class Intro
{
    constructor()
    {
        this.game = Game.getInstance()

        const respawn = this.game.respawns.getDefault()
        this.center = respawn.position.clone()

        this.setCircle()
        this.setLabel()
    }

    setLabel()
    {
        this.label = new THREE.Group()
        this.label.position.copy(this.center)
        this.label.visible = false
        this.game.scene.add(this.label)
    }

    setCircle()
    {
        this.circle = {}
        this.circle.progress = 0
        this.circle.smoothedProgress = uniform(0)

        // Clean dummy placeholder - no neon floor ring
        this.circle.mesh = new THREE.Group()
        this.circle.mesh.name = 'intro-circle-placeholder'

        this.circle.hide = (callback = null) =>
        {
            if(typeof callback === 'function')
            {
                callback()
            }
        }
    }

    setText()
    {
        // Replaced by high-resolution cinematic HTML/CSS landing screen
    }

    setSoundButton()
    {
        // Replaced by high-resolution cinematic HTML/CSS landing screen
    }

    showLabel()
    {
        // No-op
    }

    hideLabel()
    {
        // No-op
    }

    updateProgress(progress)
    {
        this.circle.progress = progress
    }

    update()
    {
        // No-op
    }

    destroy()
    {
        if(this.label)
        {
            this.label.removeFromParent()
        }
        if(this.circle.mesh)
        {
            this.circle.mesh.removeFromParent()
        }
    }
}