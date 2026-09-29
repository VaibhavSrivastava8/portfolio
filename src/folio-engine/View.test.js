import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as THREE from 'three/webgpu'
import { smallestAngle } from './utilities/maths.js'

function cameraFixture(reduced = false)
{
    const tweens = []
    const source = readFileSync(new URL('./View.js', import.meta.url), 'utf8')
        .replace(/^import[^\r\n]*[\r\n]+/gm, '')
        .replace('export class View', 'class View')
    const View = runInNewContext(`${source}\nView`, {
        THREE, smallestAngle, CameraControls: { install() {} },
        alea: function() { return () => 0.5 },
        gsap: { killTweensOf() {}, to(target, options) { tweens.push({ target, options }) } },
        document: { addEventListener() {}, querySelector() { return null } }
    })
    const actions = []
    const view = Object.assign(Object.create(View.prototype), {
        game: { physicalVehicle: { forward: { x: 1, z: 0 } }, inputs: {
            addActions(items) { actions.push(...items) }, events: { on() {} }, pointer: { events: { on() {} } }
        } },
        focusPoint: { position: new THREE.Vector3(), trackedPosition: new THREE.Vector3(20, 0, 0), isTracking: false },
        spherical: { theta: Math.PI * 4 + 0.2 }, zoom: { baseRatio: 0.7 },
        reducedMotion: { matches: reduced }
    })
    return { view, tweens, actions }
}

test('recenter follows the moving ship and rotates along the shortest arc', () =>
{
    const { view, tweens } = cameraFixture()
    view.returnToShip()
    assert.equal(view.focusPoint.isTracking, true)
    assert.equal(view.focusPoint.isReturning, true)
    const rotation = tweens.find(tween => tween.target === view.spherical)
    assert.ok(Math.abs(rotation.options.theta - view.spherical.theta) <= Math.PI)
    assert.equal(tweens.some(tween => tween.target === view.focusPoint.position), false,
        'must not tween to a stale ship position')
    rotation.options.onComplete()
    assert.equal(view.focusPoint.isReturning, false)
})

test('reduced-motion recenter has no long camera tween', () =>
{
    const { view, tweens } = cameraFixture(true)
    view.returnToShip()
    assert.ok(tweens.every(tween => tween.options.duration === 0))
})

test('camera bindings leave E exclusively available for exploration', () =>
{
    const { view, actions } = cameraFixture()
    view.setMapControls()
    const cameraKeys = actions.filter(action => action.name.startsWith('camera')).flatMap(action => action.keys)
    assert.equal(cameraKeys.includes('Keyboard.KeyE'), false)
    assert.equal(cameraKeys.includes('Keyboard.e'), false)
    assert.ok(cameraKeys.includes('Keyboard.BracketRight'))
})
