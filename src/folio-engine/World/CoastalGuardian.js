import { SeaNavigation } from './SeaNavigation.js'
import { response } from '../utilities/sailing.js'

// A wading territorial animal, not a ship-seeking missile. All travel stays
// outside land, with body clearance, and inside its own shallow-water basin.
export class CoastalGuardian
{
    constructor(obstacles, center = { x: -49, z: -50 }, clearance = 5)
    {
        this.center = center
        this.outerRadius = 29
        this.shipRadius = 5.5
        this.stopDistance = clearance + this.shipRadius
        this.navigation = new SeaNavigation(obstacles, clearance, 108, 2,
            point => Math.hypot(point.x - center.x, point.z - center.z) <= this.outerRadius)
        this.state = 'PATROL'
        this.timer = 0
        this.cooldown = 0
        // Southern coast has room for the whole animated body; the northern
        // channel is pinched between two neighbouring reefs.
        this.patrolAngle = Math.PI
        this.speed = 0
        this.heading = Math.PI / 2
        this.path = []
        this.goal = null
        this.routeTimer = 0
    }

    waypoint(angle)
    {
        return { x: this.center.x + Math.sin(angle) * 24, z: this.center.z + Math.cos(angle) * 24 }
    }

    transition(state, seconds = 0)
    {
        this.state = state
        this.timer = seconds
        this.path = []
        this.goal = null
        this.routeTimer = 0
    }

    hasClearStrike(from, to)
    {
        // The ship may be just outside the patrol basin. Check real coastline
        // sightlines, not the guardian's larger body clearance or patrol bounds.
        const dx = to.x - from.x, dz = to.z - from.z
        const length = dx * dx + dz * dz
        return this.navigation.obstacles.every(island =>
        {
            const t = length ? Math.max(0, Math.min(1, ((island.x - from.x) * dx + (island.z - from.z) * dz) / length)) : 0
            return Math.hypot(from.x + dx * t - island.x, from.z + dz * t - island.z) >= island.r + 1
        })
    }

    update(position, boat, delta, safeHarbor = false)
    {
        const previous = { x: position.x, z: position.z }
        this.timer = Math.max(0, this.timer - delta)
        this.cooldown = Math.max(0, this.cooldown - delta)
        const distance = Math.hypot(position.x - boat.x, position.z - boat.z)
        const boatRadius = Math.hypot(boat.x - this.center.x, boat.z - this.center.z)
        const threat = !safeHarbor && boatRadius < 33 && distance < Math.max(16, this.stopDistance + 3)
        const canStrike = !safeHarbor && distance < this.stopDistance + 0.8 && this.hasClearStrike(position, boat)
        let attack = false

        if(!threat && ['NOTICE', 'STALK', 'WINDUP'].includes(this.state)) this.transition('PATROL')
        if(['PATROL', 'REST'].includes(this.state) && threat && this.cooldown === 0)
            this.transition('NOTICE', 1.25)
        if(this.state === 'NOTICE' && this.timer === 0) this.transition('STALK')
        if(this.state === 'STALK' && canStrike && this.cooldown === 0) this.transition('WINDUP', 0.85)
        if(this.state === 'WINDUP')
        {
            if(!canStrike) this.transition('STALK')
            else if(this.timer === 0)
            {
                attack = true
                this.cooldown = 5
                this.retreatAngle = Math.atan2(position.x - this.center.x, position.z - this.center.z) + 0.7
                this.transition('RETREAT', 3.5)
            }
        }
        if(['RETREAT', 'REST'].includes(this.state) && this.timer === 0) this.transition('PATROL')

        let target, desiredSpeed = 0
        if(this.state === 'PATROL') { target = this.waypoint(this.patrolAngle); desiredSpeed = 1.6 }
        if(this.state === 'STALK')
        {
            // Stop outside the hull rather than running through the ship.
            const standOff = Math.max(0, distance - this.stopDistance) / Math.max(distance, 0.001)
            target = { x: position.x + (boat.x - position.x) * standOff, z: position.z + (boat.z - position.z) * standOff }
            desiredSpeed = distance > this.stopDistance + 0.1 ? 2.7 : 0
        }
        if(this.state === 'RETREAT') { target = this.waypoint(this.retreatAngle); desiredSpeed = 2 }

        this.speed += (desiredSpeed - this.speed) * response(4, delta)
        this.routeTimer -= delta
        if(target)
        {
            const moved = !this.goal || Math.hypot(target.x - this.goal.x, target.z - this.goal.z) > 2
            const blocked = this.path.length && !this.navigation.isClear(position, this.path[0])
            if(blocked || this.routeTimer <= 0 && (moved || !this.path.length))
            {
                this.path = this.navigation.route(position, target)
                this.goal = target
                this.routeTimer = 0.6
            }
            const heading = this.navigation.follow(position, this.path, this.speed * delta)
            if(heading !== null) this.heading = heading
            // Treat the visible ship as a keep-out volume even on retreat or
            // patrol. A player blocking the coast makes the animal wait.
            const nextDistance = Math.hypot(position.x - boat.x, position.z - boat.z)
            if(nextDistance < this.stopDistance && nextDistance < distance - 1e-6)
            {
                Object.assign(position, previous)
                this.path = []
            }
            if(this.state === 'PATROL' && !this.path.length)
            {
                this.patrolAngle += Math.PI / 3
                this.transition('REST', 1.4)
            }
        }
        else if(['NOTICE', 'WINDUP'].includes(this.state))
            this.heading = Math.atan2(boat.x - position.x, boat.z - position.z)
        return { state: this.state, heading: this.heading,
            speed: Math.hypot(position.x - previous.x, position.z - previous.z) / Math.max(delta, 0.0001), attack }
    }
}
