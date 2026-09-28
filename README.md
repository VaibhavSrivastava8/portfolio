# Vaibhav Srivastava — Spatial Portfolio

This project now presents Vaibhav's personal portfolio, connecting nine projects
with skills, career history, education, credentials, and contact information.

- Main experience: `/`; reading and print view: `/resume/`.
- Portfolio content: `src/data/portfolio.js`.
- World destinations: `src/data/portfolioStops.js`.
- Shared presentation: `src/components/portfolio/`.
- Career facts come from `../portfolio-backup-2026-09-28/src/data/resume.tsx`.
- Navigation is inspired by Bruno Simon's `../folio-2025`;
  attribution remains in Contact.

Development now runs from this `portfolio` directory. The original Next.js app
is preserved in `../portfolio-backup-2026-09-28`, alongside the migrated
source archive. The portfolio Git history and origin remote are
retained. No deployment or domain migration has been performed.

The world inventory below describes the existing maritime environment.

A high-performance, interactive 3D nautical open-world portfolio and interactive archipelago built with **Three.js**, **Rapier WASM 3D physics**, and **Astro / Vite**.

Sail a galleon across dynamic ocean waters, explore pirate ruins and fortified bastions, discover mythical sea creatures and prehistoric shallows, and interact with live project showcases and physics minigames.

---

## 🗺️ Complete World Inventory: 14 Islands & Cays

The portfolio archipelago consists of **14 authentic nautical islands and cays** (7 major territory islands + 7 intermediate stepping cays & channels).

### The 7 Major Territory Islands

| # | Island / Territory Name | World Coordinates | Key Landmarks & Features |
|---|-------------------------|-------------------|--------------------------|
| 1 | **⚓ The Anchorage (Spawn Port)** | `(x: 0, z: 0)` | **Safe Harbor Haven**: Large arrival pier, twin docks, stone watchtower, palm trees, skull flags, lanterns, chests, and crates. 100% non-hostile with passive hull repair. |
| 2 | **📜 Shipwreck Cove (PDF Retype Island)** | `(x: -45, z: 28)` *(Dock: `-34, 20`)* | **Pirate Ruins / Showcase**: Massive stranded pirate galleon wreckage, tall sea cliffs, landing dock, undead pirate skeletons on deck, and **PDF Retype** project showcase modal. |
| 3 | **🏰 Citadel Fortress (Citadel KMS)** | `(x: 45, z: 25)` *(Dock: `34, 25`)* | **Naval Bastion**: Giant medieval castle gates, twin fortified rampart towers, naval defensive cannons, docks with skull flags, and **Citadel KMS** project showcase modal. |
| 4 | **🦈 Abyssal Sea Monster Trench & Vortex** | `(x: 18, z: 60)` & `(x: -15, z: 62)` | **Deep Ocean Boss Trench**: Submerged reefs, broken ship masts, 14.7m Mosasaurus on surface patrol, and the giant multi-tentacled Kraken in the Abyssal Vortex. |
| 5 | **🧜‍♀️ Coral Lagoon & Treasure Atoll** | `(x: 35, z: -40)` *(Lagoon: `32, -30`)* | **Siren's Sanctuary**: Colorful branching coral reefs, secluded sandbar atoll, coconut palms, buried golden treasure chest, and swimming Mermaid / Siren. |
| 6 | **🦈 Serpent's Deep (Shark Shoals)** | `(x: -24, z: 44)` *(Respawn: `-24, 34`)* | **Hunting Grounds**: Submerged rock hazards, floating explosive barrels, and a pack of swift predatory sharks patrolling the shoals. |
| 7 | **🦕 Dinosaur Shallows (Spinosaurus Coast)** | `(x: -32, z: -28)` | **Prehistoric Coastline**: Tidal sand ridges and prehistoric coastal shallows where the colossal Spinosaurus wades through the surf. |

### The 7 Intermediate Stepping Cays & Navigable Channels

| # | Cay Name | Coordinates | Channel / Role |
|---|----------|-------------|----------------|
| 8 | **🏝️ Smuggler's Cay** | `(x: -20, z: 10)` | Smuggler's Passage (West) |
| 9 | **🏝️ Cannon Cay** | `(x: 22, z: 12)` | Royal Seaway (East) |
| 10 | **🏝️ Mermaid's Rest** | `(x: 18, z: -20)` | Siren's Run (Southeast) |
| 11 | **🏝️ Siren's Ridge** | `(x: -16, z: -16)` | Prehistoric Approach (Southwest) |
| 12 | **🏝️ Mist Haven Islet** | `(x: -8, z: 36)` | Northern Channel Waypoint |
| 13 | **🏝️ East Barrier Reef** | `(x: 38, z: -16)` | Citadel Outer Channel |
| 14 | **🏝️ Southern Beacon Watch** | `(x: 0, z: -32)` | Southern Sentinel |

> Detailed technical specifications, territory bounding radii, and respawn vectors can be found in [`docs/WORLD_MAP_AND_LOCATIONS.md`](./docs/WORLD_MAP_AND_LOCATIONS.md).

---

## 🎮 Controls

### Ship Navigation
- **`W` / `↑`**: Throttle forward
- **`S` / `↓`**: Reverse / brake
- **`A` / `←`**: Turn rudder port (left)
- **`D` / `→`**: Turn rudder starboard (right)
- **`Spacebar`**: Handbrake / quick anchor
- **`R`**: Respawn vessel at the nearest harbor / safe location

### Camera Navigation
- **Left-Click + Drag**: Orbit camera around vessel
- **Right-Click + Drag / Middle-Click / Shift + Left-Click**: Free-pan camera anywhere across the world plane
- **Scroll Wheel**: Smooth zoom (from close-up deck view at `22` units to strategic overview at `95` units)
- **Auto-Center**: Camera automatically smoothly returns to focus on your ship after 3.5s of mouse idle or immediately when steering with WASD

---

## 🛠️ Tech Stack & Architecture

- **Renderer**: [Three.js](https://threejs.org/) (WebGL / WebGPU-ready custom shaders for dynamic ocean waves, foam trails, and sunlight reflections)
- **Physics**: [Rapier 3D](https://rapier.rs/) (WASM-accelerated rigid-body simulation, raycast buoyancy with wave-displacement, kinematic obstacle queries)
- **Framework**: [Astro](https://astro.build/) & [Vite](https://vitejs.dev/)
- **Audio & FX**: Spatial 3D ocean audio, creature audio cues, particle wakes, splash bursts, and dynamic banner alerts

---

## 🚀 Getting Started

```sh
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build

# 4. Preview local production build
npm run preview
```
