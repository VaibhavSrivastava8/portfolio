import { SeaNavigation } from './SeaNavigation.js'
import { response } from '../utilities/sailing.js'

// Kinematic swimmers; damage goes through the existing Rapier hull impulse.
// One shared navigation grid and one attack token, not three competing chasers.
export class SirenPack {
    constructor(obstacles, center = { x: -22, z: -27 }) {
        this.center = center
        this.radius = 23
        this.clearance = 2.8
        this.hullRadius = 5.5
        this.clock = 0
        this.cooldown = 2
        this.attacker = -1
        this.nextAttacker = 0
        this.navigation = new SeaNavigation(obstacles, this.clearance, 108, 2,
            p => Math.hypot(p.x - center.x, p.z - center.z) <= this.radius)
        this.members = Array.from({ length: 3 }, (_, index) => {
            const angle = Math.PI * 0.5 + index * Math.PI * 2 / 3
            const start = this.navigation.point(this.navigation.nearestWater(this.waypoint(angle)))
            return { position: { ...start, y: -0.1 }, heading: angle, angle, phase: index * 2.1,
                state: 'PATROL', timer: 0, speed: 0, path: [], routeTimer: 0, goal: null, hit: false }
        })
    }
    waypoint(angle) {
        return { x: this.center.x + Math.sin(angle) * 17, z: this.center.z + Math.cos(angle) * 17 }
    }
    transition(member, state, timer = 0) {
        Object.assign(member, { state, timer, path: [], goal: null, routeTimer: 0 })
    }
    update(boat, delta, safeHarbor = false) {
        delta = Math.max(0, Math.min(delta, 0.05))
        this.clock += delta
        this.cooldown = Math.max(0, this.cooldown - delta)
        const engaged = !safeHarbor && Math.hypot(boat.x - this.center.x, boat.z - this.center.z) < this.radius
        const strikes = []
        if(!engaged) {
            this.attacker = -1
            this.cooldown = Math.max(this.cooldown, 2)
            for(const member of this.members) if(!['PATROL', 'RETURN'].includes(member.state)) this.transition(member, 'RETURN')
        }
        if(engaged && this.attacker < 0 && this.cooldown === 0) {
            this.attacker = this.nextAttacker
            this.nextAttacker = (this.nextAttacker + 1) % this.members.length
            this.transition(this.members[this.attacker], 'APPROACH', 7)
        }
        for(let i = 0; i < this.members.length; i++) {
            const member = this.members[i], previous = { ...member.position }
            member.timer = Math.max(0, member.timer - delta)
            const distance = Math.hypot(member.position.x - boat.x, member.position.z - boat.z)
            const isAttacker = i === this.attacker
            let target, desiredSpeed = 0
            const toBoat = Math.atan2(boat.x - member.position.x, boat.z - member.position.z)
            if(member.state === 'APPROACH') {
                // Approach from the member's side, never through the hull centre.
                target = { x: boat.x - Math.sin(toBoat) * 9, z: boat.z - Math.cos(toBoat) * 9 }
                desiredSpeed = 2.8
                if(distance < 10.5 && this.navigation.isClear(member.position, target)) {
                    member.strikeHeading = toBoat
                    // Lock the lunge target before the warning so evasive steering works.
                    member.strikeTarget = { x: boat.x - Math.sin(toBoat) * 7.1, z: boat.z - Math.cos(toBoat) * 7.1 }
                    this.transition(member, 'WARN', 1.3)
                } else if(member.timer === 0) this.transition(member, 'DIVE', 2)
            }
            if(member.state === 'WARN') {
                member.heading = member.strikeHeading
                if(member.timer === 0) { member.hit = false; this.transition(member, 'LUNGE', 1.2) }
            }
            if(member.state === 'LUNGE') {
                target = member.strikeTarget
                desiredSpeed = 6
                // Head projects ~0.8m forward in the swimming pose. Only apply
                // a strike at real hull reach and an unobstructed water sightline.
                const head = { x: member.position.x + Math.sin(member.heading) * 0.8,
                    z: member.position.z + Math.cos(member.heading) * 0.8 }
                const contact = Math.hypot(head.x - boat.x, head.z - boat.z) <= this.hullRadius + 0.85
                if(!member.hit && engaged && contact && this.clearSightline(head, boat)) {
                    member.hit = true
                    strikes.push({ ...member.position })
                }
                if(member.timer === 0) this.transition(member, 'DIVE', 2.2)
            }
            if(member.state === 'DIVE') {
                target = this.waypoint(Math.atan2(member.position.x - this.center.x, member.position.z - this.center.z) + 0.65)
                desiredSpeed = 2.6
                if(member.timer === 0) {
                    this.transition(member, 'RETURN')
                    if(isAttacker) { this.attacker = -1; this.cooldown = 4.5 }
                }
            }
            if(['PATROL', 'RETURN'].includes(member.state)) {
                target = this.waypoint(member.angle)
                desiredSpeed = engaged ? 1.6 : 1.15
            }
            member.speed += (desiredSpeed - member.speed) * response(4, delta)
            member.routeTimer -= delta
            if(target && member.state !== 'WARN') {
                if(member.routeTimer <= 0 && (!member.goal || !member.path.length || Math.hypot(target.x - member.goal.x, target.z - member.goal.z) > 1.5)) {
                    member.path = this.navigation.route(member.position, target)
                    member.goal = target
                    member.routeTimer = 0.75 + i * 0.1
                }
                const heading = this.navigation.follow(member.position, member.path, member.speed * delta)
                if(heading !== null) {
                    let turn = heading - member.heading
                    while(turn > Math.PI) turn -= Math.PI * 2
                    while(turn < -Math.PI) turn += Math.PI * 2
                    // Navigation follows smooth segments; align within a bounded turn.
                    member.heading += Math.max(-delta * 3, Math.min(delta * 3, turn))
                }
                const nextDistance = Math.hypot(member.position.x - boat.x, member.position.z - boat.z)
                const stop = member.state === 'LUNGE' ? 7.1 : 8.5
                const overlapsPeer = this.members.some((peer, index) => index !== i &&
                    Math.hypot(member.position.x - peer.position.x, member.position.z - peer.position.z) < 4.5)
                if((nextDistance < stop && nextDistance < distance) || overlapsPeer) {
                    Object.assign(member.position, previous)
                    member.path = []
                }
                if(['PATROL', 'RETURN'].includes(member.state) && !member.path.length) {
                    member.angle += Math.PI / 3
                    member.state = 'PATROL'
                }
            }
            const depth = member.state === 'DIVE' ? -0.95 : member.state === 'WARN' ? 0.2 : member.state === 'LUNGE' ? 0.05 : -0.1
            member.position.y += (depth - member.position.y) * response(2.5, delta)
            member.actualSpeed = Math.hypot(member.position.x - previous.x, member.position.z - previous.z) / Math.max(delta, 0.0001)
        }
        return strikes
    }
    clearSightline(from, to) {
        const dx = to.x - from.x, dz = to.z - from.z, length = dx * dx + dz * dz
        return this.navigation.obstacles.every(island => {
            const t = length ? Math.max(0, Math.min(1, ((island.x - from.x) * dx + (island.z - from.z) * dz) / length)) : 0
            return Math.hypot(from.x + dx * t - island.x, from.z + dz * t - island.z) >= island.r + 0.5
        })
    }
}
