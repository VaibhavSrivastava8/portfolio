# Portfolio World Map & Locations Directory

This document serves as the authoritative reference guide for the geography, coordinate systems, territories, landmarks, creature habitats, and area classifications across the portfolio.

---

## 🧭 Area Architecture & Disambiguation

> [!IMPORTANT]
> **Portfolio world and Bruno Simon's legacy template areas**
> 
> This portfolio originated from Bruno Simon's 3D folio template, but was transformed into a **3D Nautical Open-World Archipelago**.
> 
> - **Inactive legacy template areas**:
>   `ToiletArea` (wooden outhouse/latrine minigame), `BowlingArea` (bowling pins/ball minigame), `CookieArea` (cookie clicker), `SocialArea` (Bruno statue with Twitter/LinkedIn billboards), `CareerArea` (resume timeline), `CircuitArea` (race track with timer/leaderboard), `AltarArea` (car sacrifice pit), `TimeMachineArea`, `BehindTheSceneArea`, `EasterArea`.
>   *These are legacy template files preserved strictly for backward engine compatibility and are **NOT** part of the portfolio's world or map.*
> 
> - **Active portfolio world**:
>   The portfolio consists exclusively of the **14 Nautical Islands & Cays** (7 Major Territory Islands + 7 Intermediate Stepping Cays) managed by [`NauticalAreas.js`](../src/folio-engine/World/Areas/NauticalAreas.js), [`Archipelago.js`](../src/folio-engine/World/Archipelago.js), [`Floor.js`](../src/folio-engine/World/Floor.js), and [`Map.js`](../src/folio-engine/Map.js).

---

## 🗺️ The Complete 14 Nautical Islands & Locations Inventory

The world origin `(0, 0)` is **The Anchorage** (Spawn Port), with the ocean surface plane located at `y = 0.5`.

### 1. The 7 Major Territory Islands

| # | Island / Territory Name | World Coordinates | Key Landmarks & Features |
|---|-------------------------|-------------------|--------------------------|
| 1 | **⚓ The Anchorage (Spawn Port)** | `(x: 0, z: 0)` | **Safe Harbor Haven**: Large wooden arrival pier, twin docking platforms, stone watchtower, tropical palm trees, skull flags, lanterns, chests, and crates. 100% non-hostile sanctuary with active hull auto-repair (`+6%/s`). |
| 2 | **📜 Shipwreck Cove (PDF Retype)** | `(x: -45, z: 28)`<br>*Dock: `(-34, 20)`* | **Pirate Ruins & Showcase**: Massive stranded 17th-century pirate galleon wreck, tall jagged sea cliffs, landing dock, pirate flags, undead pirate skeletons stationed on deck throwing dodgeable boulders, and **PDF Retype** project showcase modal. |
| 3 | **🏰 Citadel Fortress (Citadel KMS)** | `(x: 45, z: 25)`<br>*Dock: `(34, 25)`* | **Naval Bastion & Showcase**: Giant medieval stone castle gates, twin fortified rampart towers, naval defensive cannons aimed out at sea, dock with skull flags, and **Citadel KMS** project showcase modal. |
| 4 | **🦈 Abyssal Sea Monster Trench & Vortex** | `(x: 18, z: 60)` & `(x: -15, z: 62)` | **Deep Ocean Boss Trench**: Deep submarine trench, submerged rock reefs, broken ship graveyard masts, 14.7m Mosasaurus prowling on surface patrol, and the giant multi-tentacled Kraken circling the Abyssal Vortex. |
| 5 | **🧜‍♀️ Coral Lagoon & Treasure Atoll** | `(x: 35, z: -40)`<br>*Lagoon: `(32, -30)`* | **Siren's Sanctuary & Hidden Bounty**: Colorful branching coral reefs, secluded sandy atoll, swaying coconut palms, buried golden treasure chest (triggers discovery event), and swimming Mermaid / Siren. |
| 6 | **🦈 Serpent's Deep (Shark Shoals)** | `(x: -24, z: 44)`<br>*Respawn: `(-24, 34)`* | **Hunting Grounds**: Shallow submerged reef rocks, floating debris and explosive barrel hazards, and a pack of swift predatory sharks patrolling the shoals. |
| 7 | **🦕 Dinosaur Shallows (Spinosaurus Coast)** | `(x: -32, z: -28)` | **Prehistoric Coastline**: Tidal sand ridges and prehistoric coastal shallows where the colossal Spinosaurus wades through the surf. |

### 2. The 7 Intermediate Stepping Cays & Navigable Channels

| # | Cay Name | Coordinates | Channel / Role | Key Features |
|---|----------|-------------|----------------|--------------|
| 8 | **🏝️ Smuggler's Cay** | `(x: -20, z: 10)` | Smuggler's Passage (West) | Sandy cay, palms, beached wooden rowboat, contraband rum barrels. |
| 9 | **🏝️ Cannon Cay** | `(x: 22, z: 12)` | Royal Seaway (East) | Stone watchtower battery, naval cannon aimed along channel, palms. |
| 10 | **🏝️ Mermaid's Rest** | `(x: 18, z: -20)` | Siren's Run (Southeast) | Sheltered atoll, coconut palms, pirate pennant flag, drift crates. |
| 11 | **🏝️ Siren's Ridge** | `(x: -16, z: -16)` | Prehistoric Approach (Southwest) | Coral ridge rocks, wrecked mast protruding from surf, palms. |
| 12 | **🏝️ Mist Haven Islet** | `(x: -8, z: 36)` | Northern Channel Waypoint | Wooden platform, hidden treasure chest, palms mid-channel. |
| 13 | **🏝️ East Barrier Reef** | `(x: 38, z: -16)` | Citadel Outer Channel | Jagged reef rocks, sand patch, drift barrels safeguarding lagoon. |
| 14 | **🏝️ Southern Beacon Watch** | `(x: 0, z: -32)` | Southern Sentinel | Watchtower dock, skull banner, lanterns guiding southern ships. |

---

## 🚢 Respawn & Teleport Coordinates Reference (`Respawns.js`)

```javascript
const nauticalRespawns = [
    // 7 Major Territory Islands
    { name: 'anchorage',     position: new THREE.Vector3(0, 0.5, 0),       rotation: 0 },
    { name: 'pdfretype',     position: new THREE.Vector3(-34, 0.5, 18),    rotation: Math.PI * 0.5 },
    { name: 'citadel',       position: new THREE.Vector3(34, 0.5, 25),     rotation: -Math.PI * 0.5 },
    { name: 'dangerReef',    position: new THREE.Vector3(0, 0.5, 58),      rotation: 0 },
    { name: 'mosasaurus',    position: new THREE.Vector3(15, 0.5, 36),     rotation: 0 },
    { name: 'kraken',        position: new THREE.Vector3(-14, 0.5, 38),    rotation: 0 },
    { name: 'treasureAtoll', position: new THREE.Vector3(28, 0.5, -34),    rotation: Math.PI * 0.5 },
    { name: 'sharks',        position: new THREE.Vector3(-24, 0.5, 32),    rotation: 0 },
    { name: 'spinosaurus',   position: new THREE.Vector3(-32, 0.5, -20),   rotation: 0 },
    { name: 'skeletons',     position: new THREE.Vector3(-36, 0.5, 20),    rotation: 0 },

    // 7 Intermediate Stepping Cays
    { name: 'smugglersCay',  position: new THREE.Vector3(-20, 0.5, 10),    rotation: 0 },
    { name: 'cannonCay',     position: new THREE.Vector3(22, 0.5, 12),     rotation: -Math.PI * 0.4 },
    { name: 'mermaidsRest',  position: new THREE.Vector3(18, 0.5, -20),    rotation: 0 },
    { name: 'sirensRidge',   position: new THREE.Vector3(-16, 0.5, -16),   rotation: 0 },
    { name: 'mistHaven',     position: new THREE.Vector3(-8, 0.5, 36),     rotation: 0 },
    { name: 'eastBarrier',   position: new THREE.Vector3(38, 0.5, -16),    rotation: 0 },
    { name: 'southBeacon',   position: new THREE.Vector3(0, 0.5, -32),     rotation: Math.PI }
]
```

---

## ⚔️ Combat & Creature Behavior Mechanics

1. **Safe Harbors (`insideSafeHarbor`)**:
   - **The Anchorage** (`x: 0, z: 0`) is a strictly protected safe haven.
   - Hostile predators drop aggro immediately upon vessel entry.
   - Ship hull passively repairs at `+6%/s` inside harbor and `+2%/s` while out of combat.

2. **Monster Standoff Clearance & Spin Prevention**:
   - Spinosaurus, Mosasaurus, and Sharks enforce a **hard minimum radial clearance of 4.5m - 5.5m**.
   - Upon landing a strike, creatures enter a **Disengage & Flank** state for 3.5s, circling around rather than clipping inside the ship hull or spinning on center.

3. **Mosasaurus & Kraken Surfacing**:
   - **Mosasaurus**: Patrols near `(15, 45)` with its dorsal spine breaking the surface (`y = 0.25`), performing breaching lunges when engaged.
   - **Kraken**: Awakens near `(-15, 48)`, rising from the depths with flailing tentacles and localized whirlpool suction.

4. **Skeletons**:
   - Stationed on the Shipwreck Cove galleon deck and cliffs.
   - Throws dodgeable high-arc rocks with a 1.5s flight time; maneuvering > 3.2m away avoids all damage.
