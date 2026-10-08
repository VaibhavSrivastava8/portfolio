import * as THREE from 'three/webgpu'
import { portfolioStops, firstProjectStop } from '../data/portfolioStops.js'

// The portfolio uses the live islands, not a second set of preview artwork.
export function focusPortfolioStop(game, id)
{
    const stop = portfolioStops.find(stop => stop.id === (id === 'projects' ? firstProjectStop?.id : id) || stop.menu === id)
        || portfolioStops[0]
    game.view.portfolioStop = stop.id
    const landmark = game.world?.flagshipLandmarks?.landmarks.find(item => item.id === stop.id)
    const origin = landmark?.container.position || new THREE.Vector3(stop.x, 0, stop.z)
    const mobile = window.matchMedia('(max-width: 640px)').matches
    const target = origin.clone().add(new THREE.Vector3(mobile ? 0 : 9, mobile ? -8 : 1, mobile ? 0 : -6))
    const position = origin.clone().add(new THREE.Vector3(22, mobile ? 32 : 26, 32))
    game.view.cinematic.start(position, target)
}
