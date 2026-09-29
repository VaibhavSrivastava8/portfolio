// Offline derivative pipeline. Never changes the creator's original GLB.
// Usage: node scripts/build-siren.mjs [source.glb]
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { MeshoptSimplifier } from 'meshoptimizer'

await MeshoptSimplifier.ready
const source = readFileSync(process.argv[2] || 'assets/research/mermaids/creepy-source.glb')
if(source.toString('ascii', 0, 4) !== 'glTF') throw Error('Expected GLB')
const jsonLength = source.readUInt32LE(12)
const input = JSON.parse(source.subarray(20, 20 + jsonLength).toString())
const binary = source.subarray(28 + jsonLength)
const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const constructors = { 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
function read(index) {
    const a = input.accessors[index], view = input.bufferViews[a.bufferView]
    const Type = constructors[a.componentType], width = widths[a.type]
    if(!Type) throw Error('Unsupported source layout')
    if(view.byteStride) {
        const result = new Type(a.count * width)
        const data = new DataView(binary.buffer, binary.byteOffset, binary.byteLength)
        const readComponent = a.componentType === 5126 ? 'getFloat32' : a.componentType === 5123 ? 'getUint16' : 'getUint32'
        for(let i = 0; i < a.count; i++) for(let k = 0; k < width; k++)
            result[i * width + k] = data[readComponent]((view.byteOffset || 0) + (a.byteOffset || 0) + i * view.byteStride + k * Type.BYTES_PER_ELEMENT, true)
        return result
    }
    const buffer = binary.subarray((view.byteOffset || 0) + (a.byteOffset || 0),
        (view.byteOffset || 0) + (a.byteOffset || 0) + a.count * width * Type.BYTES_PER_ELEMENT)
    return new Type(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length))
}
const output = { asset: { version: '2.0', generator: 'Portfolio siren derivative pipeline',
    copyright: 'Creepy Mermaid by crazyshroomz (https://skfb.ly/6RJpn), CC BY 4.0. Simplified, recoloured and rigged.' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'Siren', children: [] }],
    meshes: [], skins: [], materials: [
        { name: 'Reef skin', pbrMetallicRoughness: { baseColorFactor: [0.24, 0.43, 0.46, 1], roughnessFactor: 0.95, metallicFactor: 0 } },
        { name: 'Ink hair', pbrMetallicRoughness: { baseColorFactor: [0.22, 0.15, 0.29, 1], roughnessFactor: 1, metallicFactor: 0 } },
        { name: 'Ivory teeth', pbrMetallicRoughness: { baseColorFactor: [0.95, 0.84, 0.63, 1], roughnessFactor: 0.9, metallicFactor: 0 } },
        { name: 'Amber eyes', pbrMetallicRoughness: { baseColorFactor: [0.66, 0.36, 0.12, 1], roughnessFactor: 0.65, metallicFactor: 0 } }
    ], accessors: [], bufferViews: [], buffers: [] }
const chunks = []; let offset = 0
function accessor(array, type, target, bounds = false) {
    const pad = (4 - offset % 4) % 4
    if(pad) { chunks.push(Buffer.alloc(pad)); offset += pad }
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
    const view = output.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, ...(target ? { target } : {}) }) - 1
    chunks.push(data); offset += data.length
    const entry = { bufferView: view, componentType: array instanceof Float32Array ? 5126 : array instanceof Uint16Array ? 5123 : 5125,
        count: array.length / widths[type], type }
    if(bounds) {
        entry.min = Array(widths[type]).fill(Infinity); entry.max = Array(widths[type]).fill(-Infinity)
        for(let i = 0; i < array.length; i++) {
            const k = i % widths[type]
            entry.min[k] = Math.min(entry.min[k], array[i]); entry.max[k] = Math.max(entry.max[k], array[i])
        }
    }
    return output.accessors.push(entry) - 1
}
// Small anatomical rig: torso/head plus a continuous five-joint tail.
const bindY = [0, 0.35, 0.65, -0.4, -0.9, -1.4, -1.9, -2.45]
const names = ['Hip', 'Chest', 'Head', 'Tail1', 'Tail2', 'Tail3', 'Tail4', 'Fluke']
const parents = [-1, 0, 1, 0, 3, 4, 5, 6]
for(let i = 0; i < bindY.length; i++) {
    output.nodes.push({ name: names[i], translation: [0, bindY[i] - (parents[i] < 0 ? 0 : bindY[parents[i]]), 0], children: [] })
    output.nodes[parents[i] < 0 ? 0 : parents[i] + 1].children.push(i + 1)
}
const inverse = new Float32Array(bindY.length * 16)
bindY.forEach((y, i) => { inverse.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,-y,0,1], i * 16) })
output.skins.push({ name: 'Siren swim rig', inverseBindMatrices: accessor(inverse, 'MAT4'), skeleton: 1,
    joints: bindY.map((_, i) => i + 1) })
const budgets = [3000, 1200, 100, 600, 1300, 1600, 300]
let triangles = 0
for(let meshIndex = 0; meshIndex < input.meshes.length; meshIndex++) {
    const primitive = input.meshes[meshIndex].primitives[0]
    const positions = read(primitive.attributes.POSITION)
    const normals = read(primitive.attributes.NORMAL)
    // Source uses Z-up. Convert to metres, Y-up, face +Z; length approx 3.4m.
    for(let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1], z = positions[i + 2]
        positions[i] *= 0.003; positions[i + 1] = (z + 30) * 0.003; positions[i + 2] = -y * 0.003
        const ny = normals[i + 1], nz = normals[i + 2]
        normals[i + 1] = nz; normals[i + 2] = -ny
    }
    const indices = Uint32Array.from(read(primitive.indices))
    const [simplified] = MeshoptSimplifier.simplify(indices, positions, 3, budgets[meshIndex] * 3, 0.045, ['Permissive'])
    if(!simplified.length) throw Error('Empty simplification')
    const map = new Map(), vertices = [], normalData = [], compactIndices = []
    for(const original of simplified) {
        if(!map.has(original)) {
            map.set(original, map.size)
            vertices.push(...positions.subarray(original * 3, original * 3 + 3))
            normalData.push(...normals.subarray(original * 3, original * 3 + 3))
        }
        compactIndices.push(map.get(original))
    }
    const joints = new Uint16Array(map.size * 4), weights = new Float32Array(map.size * 4)
    const materialName = input.materials[primitive.material].name
    for(let i = 0; i < map.size; i++) {
        const y = vertices[i * 3 + 1]
        let a = 0, b = 0, mix = 0
        if(materialName !== 'Body') a = b = 2
        else if(y >= 0) {
            a = y < 0.35 ? 0 : 1; b = a + 1
            mix = Math.max(0, Math.min(1, (y - bindY[a]) / (bindY[b] - bindY[a])))
        } else {
            a = 0; b = 3
            for(let k = 3; k < 7 && y < bindY[k]; k++) { a = k; b = k + 1 }
            mix = Math.max(0, Math.min(1, (bindY[a] - y) / (bindY[a] - bindY[b])))
        }
        joints[i * 4] = a; joints[i * 4 + 1] = b
        weights[i * 4] = 1 - mix; weights[i * 4 + 1] = mix
    }
    const material = materialName.includes('Hair') ? 1 : materialName === 'Teeth' ? 2 : materialName === 'Eyes' ? 3 : 0
    const mesh = output.meshes.push({ name: materialName, primitives: [{ attributes: {
        POSITION: accessor(new Float32Array(vertices), 'VEC3', 34962, true),
        NORMAL: accessor(new Float32Array(normalData), 'VEC3', 34962),
        JOINTS_0: accessor(joints, 'VEC4', 34962), WEIGHTS_0: accessor(weights, 'VEC4', 34962)
    }, indices: accessor(new Uint16Array(compactIndices), 'SCALAR', 34963), material }] }) - 1
    const node = output.nodes.push({ name: `Siren_${materialName}_${meshIndex}`, mesh, skin: 0 }) - 1
    output.nodes[0].children.push(node)
    triangles += compactIndices.length / 3
}
if(triangles > 11000) throw Error(`Exceeded mobile budget: ${triangles}`)
output.buffers = [{ byteLength: offset }]
const json = Buffer.from(JSON.stringify(output)), jsonPad = (4 - json.length % 4) % 4
const bin = Buffer.concat(chunks), binPad = (4 - bin.length % 4) % 4
const header = Buffer.alloc(20), binHeader = Buffer.alloc(8)
header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + jsonPad + bin.length + binPad, 8)
header.writeUInt32LE(json.length + jsonPad, 12); header.writeUInt32LE(0x4e4f534a, 16)
binHeader.writeUInt32LE(bin.length + binPad, 0); binHeader.writeUInt32LE(0x004e4942, 4)
const result = Buffer.concat([header, json, Buffer.alloc(jsonPad, 32), binHeader, bin, Buffer.alloc(binPad)])
writeFileSync('public/assets/monsters/siren-reef.glb', result)
console.log(JSON.stringify({ triangles, bytes: result.length, joints: bindY.length,
    sourceSHA256: createHash('sha256').update(source).digest('hex') }))
