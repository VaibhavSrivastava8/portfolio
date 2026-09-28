import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

export class Grid
{
    constructor()
    {
        this.game = Game.getInstance()
        this.setVisual()
    }

    setVisual()
    {
        // For this portfolio, the black cyber matrix grid is removed in favor of
        // the rich, natural Caribbean ocean and archipelago terrain.
        this.mesh = new THREE.Group()
        this.mesh.name = 'grid-placeholder'
    }

    show()
    {
        // No-op: do not occlude the ocean world
    }

    destroy()
    {
        if(this.mesh)
        {
            this.mesh.removeFromParent()
        }
    }
}