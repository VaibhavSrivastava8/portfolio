// Cached water grid and A* routes. No raycasts, physics bodies, or render work.
export class SeaNavigation
{
    constructor(obstacles, clearance = 3, bound = 108, spacing = 2)
    {
        this.obstacles = obstacles
        this.clearance = clearance
        this.bound = bound
        this.spacing = spacing
        this.size = Math.floor(bound * 2 / spacing) + 1
        this.water = new Uint8Array(this.size * this.size)
        for(let index = 0; index < this.water.length; index++)
            this.water[index] = this.isWater(this.point(index)) ? 1 : 0
    }

    point(index)
    {
        return { x: index % this.size * this.spacing - this.bound, z: Math.floor(index / this.size) * this.spacing - this.bound }
    }

    isWater(point)
    {
        return Math.abs(point.x) <= this.bound && Math.abs(point.z) <= this.bound &&
            this.obstacles.every(island => Math.hypot(point.x - island.x, point.z - island.z) >= island.r + this.clearance - 1e-6)
    }

    isClear(from, to)
    {
        if(!this.isWater(from) || !this.isWater(to)) return false
        const dx = to.x - from.x, dz = to.z - from.z
        const lengthSquared = dx * dx + dz * dz
        return this.obstacles.every(island =>
        {
            const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((island.x - from.x) * dx + (island.z - from.z) * dz) / lengthSquared))
            return Math.hypot(from.x + dx * t - island.x, from.z + dz * t - island.z) >= island.r + this.clearance - 1e-6
        })
    }

    nearestWater(point)
    {
        let best = -1, bestDistance = Infinity
        const needsEscape = !this.isWater(point)
        for(let index = 0; index < this.water.length; index++)
        {
            if(!this.water[index]) continue
            const candidate = this.point(index)
            const distance = (candidate.x - point.x) ** 2 + (candidate.z - point.z) ** 2
            if(distance < bestDistance && (needsEscape || this.isClear(point, candidate)))
            {
                best = index
                bestDistance = distance
            }
        }
        return best
    }

    route(from, target)
    {
        // Keep direct pursuit cheap whenever the channel is unobstructed.
        if(this.isClear(from, target)) return [{ x: target.x, z: target.z }]
        const start = this.nearestWater(from), goal = this.nearestWater(target)
        if(start < 0 || goal < 0) return []
        const end = this.point(goal)
        const costs = new Float64Array(this.water.length).fill(Infinity)
        const previous = new Int32Array(this.water.length).fill(-1)
        const closed = new Uint8Array(this.water.length)
        const heap = []
        const push = (index, score) =>
        {
            const entry = { index, score }
            heap.push(entry)
            let child = heap.length - 1
            while(child > 0)
            {
                const parent = (child - 1) >> 1
                if(heap[parent].score <= score) break
                heap[child] = heap[parent]
                child = parent
            }
            heap[child] = entry
        }
        const pop = () =>
        {
            const first = heap[0], last = heap.pop()
            if(heap.length)
            {
                let parent = 0
                while(parent * 2 + 1 < heap.length)
                {
                    let child = parent * 2 + 1
                    if(child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++
                    if(heap[child].score >= last.score) break
                    heap[parent] = heap[child]
                    parent = child
                }
                heap[parent] = last
            }
            return first.index
        }
        const heuristic = point => Math.hypot(point.x - end.x, point.z - end.z)
        costs[start] = 0
        push(start, heuristic(this.point(start)))
        while(heap.length)
        {
            const index = pop()
            if(closed[index]) continue
            if(index === goal)
            {
                const raw = []
                for(let cursor = goal; cursor !== -1; cursor = previous[cursor]) raw.push(this.point(cursor))
                raw.reverse()
                if(this.isClear(end, target)) raw.push({ x: target.x, z: target.z })
                // String pulling removes grid zigzags, but never cuts a shoreline.
                const path = []
                let position = from, cursor = 0
                while(cursor < raw.length)
                {
                    let next = raw.length - 1
                    while(next > cursor && !this.isClear(position, raw[next])) next--
                    path.push(raw[next])
                    position = raw[next]
                    cursor = next + 1
                }
                return path
            }
            closed[index] = 1
            const x = index % this.size, z = Math.floor(index / this.size)
            const position = this.point(index)
            for(let dx = -1; dx <= 1; dx++) for(let dz = -1; dz <= 1; dz++)
            {
                if((dx === 0 && dz === 0) || x + dx < 0 || x + dx >= this.size || z + dz < 0 || z + dz >= this.size) continue
                const next = (z + dz) * this.size + x + dx
                if(!this.water[next] || closed[next]) continue
                const destination = this.point(next)
                if(!this.isClear(position, destination)) continue
                const cost = costs[index] + Math.hypot(dx, dz) * this.spacing
                if(cost >= costs[next]) continue
                costs[next] = cost
                previous[next] = index
                push(next, cost + heuristic(destination))
            }
        }
        return []
    }

    follow(position, path, distance)
    {
        let heading = null
        while(path.length && distance > 0)
        {
            const next = path[0]
            if(!this.isClear(position, next)) return null
            const dx = next.x - position.x, dz = next.z - position.z
            const length = Math.hypot(dx, dz)
            if(length < 1e-6) { path.shift(); continue }
            heading = Math.atan2(dx, dz)
            const step = Math.min(length, distance)
            position.x += dx / length * step
            position.z += dz / length * step
            distance -= step
            if(step >= length) path.shift()
        }
        return heading
    }
}
