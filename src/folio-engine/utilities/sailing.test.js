import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as THREE from 'three/webgpu'
import { hullVelocity, rudderVelocity, response, sailingLookAhead } from './sailing.js'

const forward = { x: 1, z: 0 }
const side = { x: 0, z: 1 }
const simulate = (fps, seconds, throttle = 1, boost = false, braking = false, initial = 0) =>
{
    let velocity = { x: initial, y: 0, z: 0 }
    for(let i = 0; i < fps * seconds; i++)
        velocity = hullVelocity(velocity, forward, side, throttle, boost, braking, 1 / fps)
    return velocity.x
}

test('acceleration builds progressively and boost adds useful speed', () =>
{
    const first = simulate(60, 0.5)
    const cruise = simulate(60, 8)
    assert.ok(first > 0 && first < 4)
    assert.ok(cruise > first && cruise <= 14)
    assert.ok(simulate(60, 8, 1, true) > cruise + 4)
    assert.ok(simulate(60, 8, -1) >= -6.5)
})

test('sailing stays consistent at 30, 60, and 120 updates per second', () =>
{
    const speeds = [30, 60, 120].map(fps => simulate(fps, 4))
    assert.ok(Math.max(...speeds) - Math.min(...speeds) < 0.1)
    const yaw = fps => {
        let value = 0
        for(let i = 0; i < fps; i++) value = rudderVelocity(value, 1, 5, 1, 1 / fps)
        return value
    }
    assert.ok(Math.abs(yaw(30) - yaw(120)) < 0.0001)
})

test('release coasts to a stop, while anchor braking is decisive', () =>
{
    const coast = simulate(60, 1, 0, false, false, 10)
    const brake = simulate(60, 1, 1, true, true, 10)
    assert.ok(coast > 4 && coast < 6)
    assert.ok(brake < 0.1)
})

test('water resistance preserves vertical buoyancy and settles lateral drift', () =>
{
    const result = hullVelocity({ x: 5, y: 2, z: 4 }, forward, side, 1, false, false, 1 / 60)
    assert.equal(result.y, 2)
    assert.ok(result.z > 0 && result.z < 4)
})

test('reverse input slows a forward-moving hull before reversing the rudder', () =>
{
    assert.ok(rudderVelocity(0, 1, 5, -1, 0.1) > 0)
    assert.ok(rudderVelocity(0, 1, -3, -1, 0.1) < 0)
    assert.ok(Math.abs(rudderVelocity(1, 0, 5, 1, 0.5)) < 0.02)
})

test('camera look-ahead follows actual travel, stays bounded, and handles rest', () =>
{
    assert.deepEqual(sailingLookAhead({ x: 0, z: 0 }, 1 / 60), { x: 0, z: 0 })
    assert.ok(sailingLookAhead({ x: -0.1, z: 0 }, 1 / 60).x < 0)
    const lead = sailingLookAhead({ x: 20, z: 20 }, 1 / 60)
    assert.ok(Math.hypot(lead.x, lead.z) <= 5.00001)
    assert.ok(response(8, 1) <= 1)
})

test('actual vessel update retains buoyancy while applying forward propulsion', () =>
{
    const source = readFileSync(new URL('../Physics/PhysicsVehicle.js', import.meta.url), 'utf8')
        .replace(/^import[^\r\n]*[\r\n]+/gm, '')
        .replace('export class PhysicsVehicle', 'class PhysicsVehicle')
    const PhysicsVehicle = runInNewContext(`${source}\nPhysicsVehicle`, {
        THREE, hullVelocity, rudderVelocity, response, lerp: THREE.MathUtils.lerp
    })
    let velocity = { x: 0, y: 0, z: 0 }
    const body = {
        linvel: () => ({ ...velocity }), angvel: () => ({ x: 0, y: 0, z: 0 }),
        applyImpulse: impulse => { for(const axis of ['x', 'y', 'z']) velocity[axis] += impulse[axis] },
        setLinvel: value => { velocity = { ...value } }, setAngvel: () => {}
    }
    const vehicle = Object.assign(Object.create(PhysicsVehicle.prototype), {
        game: { ticker: { deltaScaled: 1 / 30 }, player: { accelerating: 1, steering: 0, boosting: 0, braking: 0 } },
        chassis: { physical: { body }, mass: 1 }, position: { y: 0.65 }, upward: { y: 1 },
        forward, sideward: side, speed: 0,
        topSpeed: 12, topSpeedBoost: 35, boostMultiplier: 2, engineForceAmplitude: 380
    })
    vehicle.updatePrePhysics()
    assert.ok(velocity.x > 0, 'thrust must survive the drag update')
    assert.ok(velocity.y > 0, 'buoyancy must survive the drag update')
})
