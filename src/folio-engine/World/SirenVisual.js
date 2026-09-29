import * as THREE from 'three/webgpu'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { response } from '../utilities/sailing.js'

export function createSirenVisual(source, index) {
    const root = new THREE.Group()
    root.name = `reef-siren-${index + 1}`
    const model = clone(source)
    model.scale.setScalar(0.85)
    root.add(model)
    const bones = ['Hip', 'Chest', 'Head', 'Tail1', 'Tail2', 'Tail3', 'Tail4', 'Fluke'].map(name => model.getObjectByName(name))
    model.traverse(child => {
        if(child.isMesh) {
            child.castShadow = false
            child.receiveShadow = true
            child.frustumCulled = false
        }
    })
    return { root, model, bones, phase: index * 2.1, pitch: 1.05 }
}

export function poseSiren(visual, member, clock, delta) {
    const { root, model, bones } = visual
    root.position.set(member.position.x, member.position.y, member.position.z)
    root.rotation.y = member.heading
    const warning = member.state === 'WARN'
    const targetPitch = warning ? 0.55 : member.state === 'DIVE' ? 1.32 : member.state === 'LUNGE' ? 1.2 : 1.05
    visual.pitch += (targetPitch - visual.pitch) * response(5, delta)
    model.rotation.x = visual.pitch
    const movement = Math.min(1, (member.actualSpeed || 0) / 2.8)
    visual.phase += delta * (1.4 + movement * 4)
    const amplitude = 0.035 + movement * 0.14
    bones[1].rotation.x = warning ? -0.1 : Math.sin(visual.phase) * 0.025
    bones[2].rotation.x = warning ? -0.16 : -0.08
    bones[2].rotation.z = Math.sin(clock * 0.8 + visual.phase * 0.1) * 0.025
    for(let i = 3; i < bones.length; i++) {
        bones[i].rotation.x = Math.sin(visual.phase - (i - 3) * 0.65) * amplitude + (warning ? 0.12 : 0)
        bones[i].rotation.z = Math.sin(visual.phase * 0.5 - i * 0.4) * amplitude * 0.18
    }
}
