import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import { abs, clamp, color, cos, float, Fn, max, min, mix, round, sin, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl'

export class Terrain
{
    constructor()
    {
        this.game = Game.getInstance()

        this.subdivision = 128
        this.size = 300

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🏔️ Terrain Data',
                expanded: false,
            })
        }

        this.setGradient()
        this.setElevationTexture()
        this.setNodes()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)
    }

    setGradient()
    {
        const height = 16

        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = height

        this.gradientTexture = new THREE.Texture(canvas)
        this.gradientTexture.colorSpace = THREE.SRGBColorSpace

        const context = canvas.getContext('2d')

        this.colors = [
            { stop: 0.1, value: '#ffa94e' },
            { stop: 0.3, value: '#5bc2b9' },
            { stop: 0.9, value: '#13375f' },
        ]

        const update = () =>
        {
            const gradient = context.createLinearGradient(0, 0, 0, height)
            for(const color of this.colors)
                gradient.addColorStop(color.stop, color.value)

            context.fillStyle = gradient
            context.fillRect(0, 0, 1, height)
            this.gradientTexture.needsUpdate = true
        }

        update()

        // // Debug
        // canvas.style.position = 'fixed'
        // canvas.style.zIndex = 999
        // canvas.style.top = 0
        // canvas.style.left = 0
        // canvas.style.width = '128px'
        // canvas.style.height = `256px`
        // document.body.append(canvas)
        
        if(this.game.debug.active)
        {
            for(const color of this.colors)
            {
                this.debugPanel.addBinding(color, 'stop', { min: 0, max: 1, step: 0.001 }).on('change', update)
                this.debugPanel.addBinding(color, 'value', { view: 'color' }).on('change', update)
            }
        }
    }

    setElevationTexture()
    {
        const islandsList = [
            // Tier 1: Major Strongholds (Expanded 1.4x scale with open navigation channels)
            { cx: 0, cz: 0, r: 12.0, h: 3.4 },
            { cx: -66, cz: 32, r: 14.5, h: 3.5 },
            { cx: 69, cz: 35, r: 14.5, h: 3.6 },
            { cx: 0, cz: 100, r: 12.5, h: 2.8 },
            { cx: 54, cz: -56, r: 14.0, h: 3.2 },
            { cx: -39, cz: 66, r: 13.0, h: 2.9 },
            { cx: -49, cz: -50, r: 14.0, h: 3.1 },
            // Tier 2: Secondary Cays
            { cx: -34, cz: 15, r: 7.5, h: 2.9 },
            { cx: 36, cz: 20, r: 7.5, h: 2.9 },
            { cx: 34, cz: -24, r: 7.5, h: 2.9 },
            { cx: -22, cz: -27, r: 7.5, h: 2.8 },
            { cx: -8, cz: 50, r: 7.5, h: 2.9 },
            { cx: 66, cz: -22, r: 7.5, h: 2.8 },
            { cx: -4, cz: -52, r: 8.0, h: 3.0 },
            // Tier 3: Reefs & Ruins
            { cx: -90, cz: 56, r: 5.0, h: 2.5 },
            { cx: -58, cz: 91, r: 5.0, h: 2.4 },
            { cx: 21, cz: -46, r: 5.0, h: 2.4 },
            { cx: 14, cz: 32, r: 5.0, h: 2.3 },
            { cx: 84, cz: -46, r: 5.0, h: 2.5 },
            { cx: -67, cz: -22, r: 5.0, h: 2.5 },
            { cx: 49, cz: 62, r: 5.5, h: 2.6 },
            { cx: 87, cz: 6, r: 5.0, h: 2.4 },
            { cx: 20, cz: 78, r: 5.0, h: 2.6 },
            { cx: 42, cz: -87, r: 5.0, h: 2.4 },
            { cx: -20, cz: -74, r: 5.0, h: 2.4 }
        ]

        // Continuous Coastal Mountain, Valley & Plateau Perimeter Chain (Expanded 1.4x scale)
        const getMountainElev = (wx, wz) => {
            const hw = 115.0
            const hh = 115.0
            const r = 20.0

            const qx = Math.abs(wx) - hw + r
            const qz = Math.abs(wz) - hh + r

            const mx = Math.max(qx, 0.0)
            const mz = Math.max(qz, 0.0)
            const outerDist = Math.hypot(mx, mz)
            const innerDist = Math.min(Math.max(qx, qz), 0.0)
            const sdBox = outerDist + innerDist - r

            const shoreNoise = (
                Math.sin(wx * 0.06 + wz * 0.04) * 3.0 +
                Math.cos(wx * 0.12 - wz * 0.09) * 2.0
            )

            const penetration = sdBox + shoreNoise
            if(penetration <= 0.0) return 0.0

            const ramp = Math.min(1.0, penetration / 14.0)
            const smoothRamp = ramp * ramp * (3.0 - 2.0 * ramp)

            const harm1 = 0.5 + 0.5 * Math.sin(wx * 0.07 + wz * 0.07)
            const harm2 = 0.5 + 0.5 * Math.cos(wx * 0.14 - wz * 0.11)
            const peakFactor = harm1 * 0.6 + harm2 * 0.4

            const plateauFactor = Math.sin(wx * 0.045 - wz * 0.045)
            const rawH = 4.5 + 8.0 * peakFactor
            const plateauRatio = Math.max(0, Math.min(1, (plateauFactor - 0.15) / 0.15))
            const plateauBlend = plateauRatio * plateauRatio * (3 - 2 * plateauRatio)
            const maxH = rawH * (1 - plateauBlend) + Math.min(rawH, 7.2) * plateauBlend

            const crag = 0.4 * Math.sin(wx * 0.28) * Math.cos(wz * 0.28)
            return Math.max(0.0, smoothRamp * maxH + crag * smoothRamp)
        }

        this.getElevation = (wx, wz) => {
            let maxH = 0
            for(let k = 0; k < islandsList.length; k++) {
                const isl = islandsList[k]
                const dist = Math.hypot(wx - isl.cx, wz - isl.cz) / isl.r
                if(dist < 1.0) {
                    const norm = Math.max(0, Math.min(1, (dist - 1.0) / (0.2 - 1.0)))
                    const smooth = norm * norm * (3 - 2 * norm)
                    const h = smooth * isl.h
                    if(h > maxH) maxH = h
                }
            }
            const mountainH = getMountainElev(wx, wz)
            if(mountainH > maxH) maxH = mountainH

            return maxH - 2.0 // Open ocean is at -2.0, islands rise above 0.0
        }


        const resolution = 512
        const data = new Uint8Array(resolution * resolution * 4)
        for(let z = 0; z < resolution; z++) for(let x = 0; x < resolution; x++)
        {
            const elevation = this.getElevation(((x + 0.5) / resolution - 0.5) * this.size,
                ((z + 0.5) / resolution - 0.5) * this.size)
            const encoded = Math.round(Math.max(0, Math.min(1, (elevation + 2) / 16)) * 65535)
            const offset = (z * resolution + x) * 4
            data[offset] = encoded >> 8
            data[offset + 1] = encoded & 255
            data[offset + 3] = 255
        }
        this.elevationTexture = new THREE.DataTexture(data, resolution, resolution)
        this.elevationTexture.minFilter = this.elevationTexture.magFilter = THREE.LinearFilter
        this.elevationTexture.generateMipmaps = false
        this.elevationTexture.needsUpdate = true
    }

    setNodes()
    {
        this.grassColorUniform = uniform(color('#b8b62e'))
        this.tracksDelta = uniform(vec2(0))

        const worldPositionToUvNode = Fn(([position]) =>
        {
            return position.div(this.size).add(0.5)
        })

        // One filtered height lookup replaces all 25 island/coast calculations
        // in every terrain, water and scenery fragment.
        this.elevationNode = Fn(([position]) =>
        {
            const data = texture(this.elevationTexture, worldPositionToUvNode(position))
            return data.r.mul(256).add(data.g).mul(255 / 65535 * 16).sub(2)
        })

        this.terrainNode = Fn(([position]) =>
        {
            const textureUv = worldPositionToUvNode(position)
            const data = texture(this.game.resources.terrainTexture, textureUv)

            // Calculate elevation in world coordinates
            const elevation = this.elevationNode(position)
            const isIsland = smoothstep(float(-0.5), float(0.8), elevation)

            // Water depth: 1.0 everywhere in ocean, 0.0 on islands & mountains
            data.b.assign(float(1.0).sub(isIsland))

            // Grass mask: 1.0 on elevated island centers and mountain plateaus
            data.g.assign(isIsland.mul(smoothstep(float(0.2), float(0.8), elevation)))

            return data
        })
        
        this.colorNode = Fn(([terrainData]) =>
        {
            // Curated nautical palette: Turquoise ocean, golden sand, tropical island grass
            const deepOcean = uniform(color('#034078'))
            const shallowOcean = uniform(color('#0096c7'))
            const beachSand = uniform(color('#e2b678'))
            const islandGrass = uniform(color('#2d6a4f'))

            const oceanColor = mix(deepOcean, shallowOcean, float(0.45))
            const landColor = mix(beachSand, islandGrass, terrainData.g)

            const finalColor = mix(landColor, oceanColor, terrainData.b)

            return finalColor.rgb
        })

        if(this.game.debug.active)
        {
            this.game.debug.addThreeColorBinding(this.debugPanel, this.grassColorUniform.value, 'grassColor')
        }
    }
    
    update()
    {
        // Tracks delta
        this.tracksDelta.value.set(
            this.game.tracks.focusPoint.x,
            this.game.tracks.focusPoint.y
        )
    }
}
