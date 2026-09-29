import assert from 'node:assert/strict'
import test from 'node:test'
import { SeaNavigation } from './SeaNavigation.js'

const trench = [
    { x: 0, z: 100, r: 13.5 }, // Danger Reef
    { x: 20, z: 78, r: 6 }, // Abyssal Sentinel rocks
    { x: 49, z: 62, r: 6.5 }, // Ancient ruins
    { x: -8, z: 50, r: 8.5 }, // Mist Haven
    { x: -39, z: 66, r: 14 }, // Serpent's Deep
    { x: -58, z: 91, r: 6 }, // Merchant's Graveyard
]
const navigation = new SeaNavigation(trench)

function swim(start, destination, speed = 9)
{
    const position = { ...start }
    const path = navigation.route(position, destination)
    assert.ok(path.length, 'A reachable water destination must have a route')
    let distance = 0
    for(let frame = 0; frame < 60 * 40 && path.length; frame++)
    {
        const before = { ...position }
        navigation.follow(position, path, speed / 60)
        assert.ok(navigation.isWater(position), 'Swimming must not clip into an island or perimeter')
        distance += Math.hypot(position.x - before.x, position.z - before.z)
    }
    assert.equal(path.length, 0, 'The creature must arrive instead of staying pinned to a shore')
    return { position, distance }
}

test('chases a ship through the narrow reef channel and reaches ram range', () =>
{
    for(const destination of [{ x: 14, z: 90 }, { x: 34, z: 96 }, { x: -20, z: 90 }, { x: 14, z: 65 }])
    {
        const result = swim({ x: 28, z: 85 }, destination)
        assert.ok(Math.hypot(result.position.x - destination.x, result.position.z - destination.z) < 3.8)
    }
})

test('routes around Danger Reef rather than steering into it', () =>
{
    const start = { x: 14, z: 90 }, target = { x: -20, z: 90 }
    assert.equal(navigation.isClear(start, target), false)
    const result = swim(start, target)
    assert.ok(result.distance > Math.hypot(start.x - target.x, start.z - target.z))
})

test('patrol targets inside rocks become reachable water waypoints', () =>
{
    let position = { x: 14, z: 90 }
    for(const target of [{ x: 20, z: 78 }, { x: 0, z: 100 }, { x: 34, z: 96 }])
    {
        const result = swim(position, target, 5.5)
        assert.ok(navigation.isWater(result.position))
        position = result.position
    }
})

test('a retreat pass reaches open water, allowing another attack', () =>
{
    const result = swim({ x: 14, z: 90 }, { x: 36, z: 102 }, 6)
    assert.ok(result.distance > 20)
    swim(result.position, { x: 14, z: 90 })
})

test('rejects segments through land even when both endpoints are water', () =>
{
    assert.equal(navigation.isClear({ x: -20, z: 100 }, { x: 20, z: 100 }), false)
    assert.equal(navigation.isClear({ x: 14, z: 90 }, { x: 30, z: 94 }), true)
})
