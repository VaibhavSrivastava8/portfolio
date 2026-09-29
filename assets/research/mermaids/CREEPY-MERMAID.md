# Selected predatory mermaid source

Received and inspected on 2026-09-29. Original user download is unchanged.
Research copy: `creepy-source.glb`. Not loaded by the game or placed in `public/`.

## Attribution

"Creepy Mermaid" (https://skfb.ly/6RJpn) by crazyshroomz is licensed under
Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

Full source: https://sketchfab.com/3d-models/creepy-mermaid-d30d4818353d4957ad23ff635a143abe

Retain this attribution and identify modifications when a derivative is deployed.
The research copy is unmodified.

## Actual downloaded GLB inspection

- Size: 10,600,412 bytes (10.1 MiB).
- Geometry: 138,284 triangles across seven mesh primitives.
- Six materials; fifteen embedded PNG images.
- Zero skins/skeletons, zero animations, zero morph targets.
- Geometry includes body, head, hair, eyes and teeth materials. The derivative
  was visually inspected beside the ship in the running game.
- Choosing 1K textures did not reduce the mesh complexity or add animation.

## Integration record

1. Isolated visual preview beside the actual ship using the world's lighting.
   Verify the tail/body silhouette, pose, authored axes and relative size.
2. Produce a separate derivative, preserving this original. Retopologize or
   simplify toward 5–8K triangles; reduce redundant hair/eye detail, consolidate
   materials and use muted game colours with rough surfaces. Preserve the
   characteristic teeth and readable creature silhouette.
3. Create and skin a tail/spine/arm/jaw rig. Author swim, idle, warning, lunge
   and dive animations; moving the static sculpt is not an acceptable substitute.
4. Preview and approve the derivative before enabling encounters. Measure actual
   mobile frame time, download size and texture memory.
5. Build a group of three with shared geometry/materials and staggered behaviour:
   patrol, notice, spread, warn, lunge, dive, recover. Only one attacks at a time;
   damage requires actual hull contact, not proximity alone.
6. Constrain routes to water using full-body and ship clearance. Territory-limited
   pursuit, escape routes and cooldowns prevent harassment. No island clipping,
   forced steering/camera changes or expensive per-creature lights.

This replaces the earlier friendly-guardian direction for the selected creature.
The original remains unchanged. `scripts/build-siren.mjs` produces the deployed
8,086-triangle, 305,300-byte skinned derivative in `public/assets/monsters/`.
The encounter implementation and its physics/camera decisions are documented in
`docs/SIREN_ENCOUNTER.md`.
