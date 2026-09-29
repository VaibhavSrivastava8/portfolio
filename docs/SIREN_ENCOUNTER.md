# Siren's Ridge encounter

The three sirens patrol the water around Siren's Ridge at world position
`(-22, -27)`, within a 23 m territory. They are not island decorations or
free-roaming land characters. Their routes use the shared sea navigation grid,
with 2.8 m shoreline clearance, 4.5 m pack separation, and a water-only return
route. The Anchorage remains safe, and leaving the territory breaks pursuit.

One siren at a time approaches from the side, surfaces for a 1.3 s visual
warning, then lunges at up to 6 m/s. The lunge aims at a locked position, so
turning away works. Damage requires the siren's head to reach the actual hull
and an unobstructed line of sight; a miss does not cause a hit. She dives,
retreats, and the pack waits 4.5 s before another member can attack. The
remaining two continue patrolling instead of stacking on the boat. Sirens are
kinematic swimmers; contact uses the existing ship-damage and Rapier impulse
path rather than adding three continuously simulated rigid bodies.

Each mermaid is approximately 2.9 m head-to-fluke at 0.85 scale beside the
roughly 9.7 m ship. The tail normally stays underwater; the upper body briefly
emerges to warn and lunge. A jointed torso/head and travelling tail wave make
the swim read as motion. The chase camera and visitor-controlled orbit are
unchanged: there is no forced camera cut, steering, or input lock during an
attack. This keeps the reef and approaching swimmers in the normal third-person
view without taking control away from the player.

The runtime GLB is a modified, rigged 8,086-triangle, 305,300-byte derivative.
All three instances share geometry and materials and are hidden beyond 65 m.
The original 10.1 MiB download is kept in `assets/research/mermaids/` for
reproducibility, but is never loaded by the website. Rebuild with
`node scripts/build-siren.mjs`. Browser checks should include sailing through
the territory, camera orbit, chart teleport, and narrow/touch controls; the
navigation tests cover 30, 60, and 120 frame/s updates and island clearance.

Source and credit: [“Creepy Mermaid” by crazyshroomz](https://skfb.ly/6RJpn),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The derivative is
simplified, recoloured, scaled, and rigged. Attribution also appears in the
portfolio's in-game credits and GLB metadata.
