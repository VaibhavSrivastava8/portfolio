import test from 'node:test'
import assert from 'node:assert/strict'
import { CoastalGuardian } from './CoastalGuardian.js'

const obstacles = [
    { x: -49, z: -50, r: 15 }, { x: -22, z: -27, r: 8.5 },
    { x: -67, z: -22, r: 6 }, { x: -20, z: -74, r: 6 }, { x: -4, z: -52, r: 9 }
]
function fixture()
{
    const guardian = new CoastalGuardian(obstacles)
    const position = guardian.navigation.point(guardian.navigation.nearestWater(guardian.waypoint(guardian.patrolAngle)))
    return { guardian, position }
}
function run(fixture, boat, seconds, callback = () => {}, fps = 60, safe = false)
{
    for(let step = 0; step < seconds * fps; step++)
    {
        const before = { ...fixture.position }
        const result = fixture.guardian.update(fixture.position, boat, 1 / fps, safe)
        assert.ok(fixture.guardian.navigation.isWater(fixture.position), 'body must clear every island and stay in the basin')
        assert.ok(fixture.guardian.navigation.isClear(before, fixture.position), 'movement segments must not cut through land')
        assert.ok(result.speed <= 2.7001, 'no teleporting or sudden sprint')
        callback(result, step / fps)
    }
}

test('patrol circles the coast, pauses, and never walks inside its island', () =>
{
    const f = fixture(), states = new Set()
    let minX = Infinity, maxX = -Infinity, attacks = 0
    run(f, { x: 0, z: 0 }, 180, result => {
        states.add(result.state); attacks += result.attack ? 1 : 0
        minX = Math.min(minX, f.position.x); maxX = Math.max(maxX, f.position.x)
    })
    assert.ok(maxX - minX > 35)
    assert.ok(states.has('PATROL') && states.has('REST'))
    assert.equal(attacks, 0)
})

test('a nearby ship gets notice and wind-up before an attack, followed by retreat', () =>
{
    const f = fixture(), states = new Set(), attacks = []
    run(f, { x: -62, z: -75 }, 60, (result, seconds) => {
        states.add(result.state)
        if(result.attack) attacks.push(seconds)
    })
    assert.ok(states.has('NOTICE') && states.has('STALK') && states.has('WINDUP') && states.has('RETREAT'))
    assert.ok(attacks.length > 0)
    assert.ok(attacks[0] > 2, 'attacks cannot be instantaneous')
    for(let i = 1; i < attacks.length; i++) assert.ok(attacks[i] - attacks[i - 1] >= 5)
})

test('leaving during a wind-up avoids the swipe', () =>
{
    const f = fixture()
    f.guardian.transition('WINDUP', 0.5)
    let attacks = 0
    run(f, { x: 20, z: 0 }, 2, result => { attacks += result.attack ? 1 : 0 })
    assert.equal(attacks, 0)
    assert.notEqual(f.guardian.state, 'WINDUP')
})

test('does not attack through land or pursue boats outside its own coast', () =>
{
    for(const boat of [{ x: -49, z: -50 }, { x: 0, z: 0 }, { x: -89, z: -50 }])
    {
        const f = fixture()
        let attacks = 0
        run(f, boat, 30, result => { attacks += result.attack ? 1 : 0 })
        assert.equal(attacks, 0)
    }
})

test('safe harbour protection overrides any close encounter', () =>
{
    const f = fixture()
    let attacks = 0
    run(f, { ...f.position }, 10, result => { attacks += result.attack ? 1 : 0 }, 60, true)
    assert.equal(attacks, 0)
})

test('can swipe a close boat just beyond the patrol boundary without leaving the basin', () =>
{
    const f = fixture()
    let attacks = 0
    run(f, { x: -56, z: -79 }, 15, result => { attacks += result.attack ? 1 : 0 })
    assert.ok(attacks > 0)
    assert.equal(f.guardian.hasClearStrike({ x: -49, z: -74 }, { x: -49, z: -26 }), false,
        'an island between the animal and ship always blocks a strike')
})

test('route and gait remain stable at different frame rates', () =>
{
    const endpoints = [30, 60, 120].map(fps => {
        const f = fixture()
        run(f, { x: 0, z: 0 }, 12, () => {}, fps)
        return f.position
    })
    assert.ok(Math.hypot(endpoints[0].x - endpoints[2].x, endpoints[0].z - endpoints[2].z) < 0.2)
})

test('navigation does not run the visible body through a ship blocking the coast', () =>
{
    const f = fixture(), boat = { x: -68, z: -65 }
    run(f, boat, 45, () => {
        assert.ok(Math.hypot(f.position.x - boat.x, f.position.z - boat.z) >= f.guardian.stopDistance - 0.001)
    })
})
