import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import { SirenPack } from './SirenPack.js'

const world = readFileSync(new URL('./Monsters.js', import.meta.url), 'utf8')
const obstacleDeclaration = world.match(/const ISLAND_OBSTACLES = \[[\s\S]*?\n\]/)?.[0]
assert.ok(obstacleDeclaration)
const obstacles = runInNewContext(`${obstacleDeclaration}; ISLAND_OBSTACLES`)
const asset = readFileSync(new URL('../../../public/assets/monsters/siren-reef.glb', import.meta.url))
const json = JSON.parse(asset.subarray(20, 20 + asset.readUInt32LE(12)).toString())

test('deployed derivative preserves attribution, skin and mobile geometry budget', () => {
    assert.equal(asset.toString('ascii', 0, 4), 'glTF')
    assert.match(json.asset.copyright, /crazyshroomz.*CC BY 4\.0/)
    assert.ok(json.skins[0].joints.length >= 8)
    const triangles = json.meshes.reduce((total, mesh) => total + mesh.primitives.reduce((sum, p) => sum + json.accessors[p.indices].count / 3, 0), 0)
    assert.ok(triangles <= 8500)
    assert.ok(asset.length < 500_000)
})

test('the pack patrols and attacks in turn without entering land or colliding with a peer', () => {
    const pack = new SirenPack(obstacles)
    const boat = { x: -22, z: -45 }
    const attackers = new Set(), states = new Set()
    let strikes = 0
    for(let frame = 0; frame < 120 * 60; frame++) {
        const before = pack.members.map(m => ({ ...m.position }))
        const hits = pack.update(boat, 1 / 60)
        strikes += hits.length
        if(hits.length) attackers.add(pack.attacker)
        assert.ok(hits.length <= 1, 'only one siren strikes per frame')
        for(let i = 0; i < 3; i++) {
            const member = pack.members[i]
            states.add(member.state)
            assert.ok(pack.navigation.isWater(member.position), 'whole-body shoreline clearance')
            assert.ok(pack.navigation.isClear(before[i], member.position), 'no island shortcut')
            for(let j = i + 1; j < 3; j++)
                assert.ok(Math.hypot(member.position.x - pack.members[j].position.x, member.position.z - pack.members[j].position.z) >= 4.49)
        }
    }
    assert.ok(strikes >= 2 && attackers.size >= 2, 'the pack must take turns with real hull-range strikes')
    for(const state of ['PATROL', 'WARN', 'LUNGE', 'DIVE', 'RETURN']) assert.ok(states.has(state))
})

test('escape and safe harbour stop attacks; behaviour is stable at mobile frame rates', () => {
    for(const fps of [30, 60, 120]) {
        const pack = new SirenPack(obstacles)
        const boat = { x: -22, z: -45 }
        for(let frame = 0; frame < fps * 12; frame++) pack.update(boat, 1 / fps)
        Object.assign(boat, { x: 0, z: 0 })
        for(let frame = 0; frame < fps * 15; frame++) {
            assert.equal(pack.update(boat, 1 / fps).length, 0)
            pack.members.forEach(m => assert.ok(pack.navigation.isWater(m.position)))
        }
        assert.equal(pack.attacker, -1)
        assert.equal(pack.update({ x: -22, z: -45 }, 1 / fps, true).length, 0)
    }
})
