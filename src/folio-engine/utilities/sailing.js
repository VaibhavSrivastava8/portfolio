// Frame-rate-independent response shared by sailing and the chase camera.
export const response = (rate, delta) => 1 - Math.exp(-rate * Math.max(0, delta))

export function hullVelocity(velocity, forward, sideward, throttle, boost, braking, delta)
{
    const speed = velocity.x * forward.x + velocity.z * forward.z
    const lateral = velocity.x * sideward.x + velocity.z * sideward.z
    const limit = throttle < 0 ? 6.5 : (boost ? 23 : 14)
    // Ease thrust near cruising speed; reversing first slows the existing motion.
    const available = Math.max(0, 1 - Math.max(0, speed * Math.sign(throttle)) / limit)
    const thrust = braking ? 0 : throttle * (throttle < 0 ? 5 : (boost ? 10 : 7)) * available * delta
    const drag = response(braking ? 5 : (Math.abs(throttle) < 0.01 ? 0.65 : 0.12), delta)
    const keel = response(3.5, delta)
    return {
        x: velocity.x + forward.x * (thrust - speed * drag) - sideward.x * lateral * keel,
        y: velocity.y,
        z: velocity.z + forward.z * (thrust - speed * drag) - sideward.z * lateral * keel
    }
}

export function rudderVelocity(yaw, steer, forwardSpeed, throttle, delta)
{
    // Reverse the rudder only once the hull actually travels astern.
    const direction = forwardSpeed < -0.4 || (Math.abs(forwardSpeed) < 0.4 && throttle < -0.1) ? -1 : 1
    const authority = 0.65 + Math.min(Math.abs(forwardSpeed) * 0.045, 0.55)
    const target = steer * direction * 1.1 * authority
    return yaw + (target - yaw) * response(Math.abs(steer) > 0.02 ? 7 : 9, delta)
}

export function sailingLookAhead(velocity, delta, maxDistance = 5)
{
    const scale = 0.35 / Math.max(delta, 0.0001)
    const x = velocity.x * scale
    const z = velocity.z * scale
    const limit = Math.min(1, maxDistance / Math.max(Math.hypot(x, z), 0.0001))
    return { x: x * limit, z: z * limit }
}
