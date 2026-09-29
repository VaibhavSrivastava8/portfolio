import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { SeaNavigation } from './SeaNavigation.js'
import { CoastalGuardian } from './CoastalGuardian.js'
import { response } from '../utilities/sailing.js'

// Load the actual state machine without the browser-only Game/render imports.
// Model loading, visuals, and hull effects are stubbed; movement is not.
const source = readFileSync(new URL('./Monsters.js', import.meta.url), 'utf8')
    .replace(/^import[^\r\n]*[\r\n]+/gm, '').replace('export class Monsters', 'class Monsters')
const { Monsters, ISLAND_OBSTACLES } = runInNewContext(`${source}\n({ Monsters, ISLAND_OBSTACLES })`, {
    SeaNavigation, CoastalGuardian, response, THREE: { Vector2: class {
        constructor(x, y) { this.x = x; this.y = y }
        length() { return Math.hypot(this.x, this.y) }
    } },
})

function simulation(boat, start = { x: 14, z: 90 })
{
    const monsters = Object.create(Monsters.prototype)
    monsters.game = {
        ticker: { delta: 1 / 60, elapsed: 0 }, inputs: { filters: new Set(['wandering']) }, reveal: { step: 2 },
        physicalVehicle: { position: { ...boat, y: 0, distanceTo: () => 0 } },
    }
    Object.assign(monsters, {
        mosa: { position: { ...start, y: -1.2 }, rotation: { x: 0, y: 0, z: 0 } },
        mosaTerritory: { center: { x: 14, y: 90 }, radius: 42, patrolRadius: 18, speed: 5.5, attackSpeed: 9 },
        mosaPatrolAngle: 0, mosaAttackCooldown: 0, mosaCurrentSpeed: 5, mosaTargetY: -1.2,
        mosaNavigation: new SeaNavigation(ISLAND_OBSTACLES), mosaRoute: [], mosaRouteGoal: null, mosaRouteTimer: 0,
        hullIntegrity: 100, lastDamageTime: 0, mixers: [], strikes: 0,
    })
    monsters.attackShip = function() { this.strikes++; this.lastDamageTime = this.game.ticker.elapsed }
    monsters.updateProjectiles = () => {}
    monsters.checkTerritoryAlerts = () => {}
    return monsters
}

function tick(monsters, seconds, callback = () => {})
{
    for(let frame = 0; frame < seconds * 60; frame++)
    {
        monsters.game.ticker.elapsed += 1 / 60
        monsters.update()
        assert.ok(monsters.mosaNavigation.isWater(monsters.mosa.position), 'Mosasaurus must stay clear of all 25 islands')
        callback(monsters)
    }
}

test('patrol roams instead of getting pinned at the sentinel rocks', () =>
{
    const monsters = simulation({ x: 0, z: 0 })
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    tick(monsters, 120, ({ mosa }) =>
    {
        minX = Math.min(minX, mosa.position.x); maxX = Math.max(maxX, mosa.position.x)
        minZ = Math.min(minZ, mosa.position.z); maxZ = Math.max(maxZ, mosa.position.z)
    })
    assert.ok(maxX - minX > 20 && maxZ - minZ > 15, 'Patrol must cover the trench, not hover beside one rock')
    assert.equal(monsters.strikes, 0, 'Safe harbour remains protected')
})

test('chases, strikes, disengages, and attacks again near the trench rocks', () =>
{
    const monsters = simulation({ x: 14, z: 90 }, { x: 34, z: 94 })
    const states = new Set()
    tick(monsters, 40, monster => states.add(monster.mosaState))
    assert.ok(monsters.strikes >= 3, 'A ship must receive repeated ram attacks rather than a single stuck encounter')
    assert.ok(states.has('CHASE') && states.has('DISENGAGE'))
})

test('returns to patrol when the ship leaves the territory', () =>
{
    const monsters = simulation({ x: 14, z: 90 }, { x: 34, z: 94 })
    tick(monsters, 5)
    Object.assign(monsters.game.physicalVehicle.position, { x: 0, z: 0 })
    tick(monsters, 20)
    assert.equal(monsters.mosaState, 'PATROL')
})

test('Spino actual update grounds the model, synchronizes gait, and clears all 25 islands', () =>
{
    const monsters = simulation({ x: 0, z: 0 })
    monsters.mosa = null
    monsters.game.terrain = { getElevation: () => -2 }
    monsters.spinoGuardian = new CoastalGuardian(ISLAND_OBSTACLES, { x: -49, z: -50 }, 7.9)
    const nav = monsters.spinoGuardian.navigation
    monsters.spino = { position: nav.point(nav.nearestWater(monsters.spinoGuardian.waypoint(monsters.spinoGuardian.patrolAngle))), rotation: { y: 0 } }
    monsters.spinoVisual = { rotation: { x: 0 } }
    monsters.spinoMixer = { timeScale: 0 }
    let minX = Infinity, maxX = -Infinity, moving = 0, resting = 0
    for(let frame = 0; frame < 180 * 60; frame++)
    {
        const before = { ...monsters.spino.position }
        monsters.game.ticker.elapsed += 1 / 60
        monsters.update()
        assert.ok(nav.isWater(monsters.spino.position))
        assert.ok(nav.isClear(before, monsters.spino.position))
        assert.equal(monsters.spino.position.y, -2)
        minX = Math.min(minX, monsters.spino.position.x)
        maxX = Math.max(maxX, monsters.spino.position.x)
        if(monsters.spinoMixer.timeScale > 0.01) moving++
        else resting++
    }
    assert.ok(maxX - minX > 20, 'large animated body must still have room to roam')
    assert.ok(moving > 0 && resting > 0, 'gait stops when the animal rests')
    assert.equal(monsters.strikes, 0)
})

test('Spino damage requires head-to-hull reach, not merely an attack-state timer', () =>
{
    for(const inReach of [false, true])
    {
        const monsters = simulation({ x: -63, z: -78 })
        monsters.mosa = null
        monsters.game.terrain = { getElevation: () => -2 }
        monsters.spinoGuardian = new CoastalGuardian(ISLAND_OBSTACLES, { x: -49, z: -50 }, 7.9)
        monsters.spinoGuardian.transition('WINDUP', 0)
        monsters.spino = { position: { x: -50, z: -74 }, rotation: { y: 0 }, updateMatrixWorld() {} }
        monsters.spinoVisual = { rotation: { x: 0 } }
        monsters.spinoStrikePosition = {}
        monsters.spinoHead = { getWorldPosition(target) {
            Object.assign(target, { x: inReach ? -61 : -49, z: -78, y: 1 })
        } }
        monsters.update()
        assert.equal(monsters.spinoState, 'RETREAT')
        assert.equal(monsters.strikes, inReach ? 1 : 0)
    }
})
