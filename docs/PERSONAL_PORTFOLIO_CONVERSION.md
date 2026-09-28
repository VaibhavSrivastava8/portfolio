# Personal portfolio conversion — 2026-09-28

## Direction

The maritime experience represents Vaibhav Srivastava. Development runs in
`C:/Users/vaibh/Desktop/products/portfolio`. The old Next.js app is preserved
in `../portfolio-backup-2026-09-28`, together with a source archive.
The original portfolio Git history and origin remote are retained.

## Bruno reference study

`folio-2025/sources/Game/Menu.js` uses named sections with matching preview and
content nodes. `ProjectsArea.js` presents a navigable, data-driven project
gallery; `CareerArea.js` reveals a chronological career as the visitor moves.
Social and achievement areas make additional content discoverable in the world.

This implementation applies those patterns through portfolio tabs, shared
project data, a chronological career section, and offshore portfolio beacons.
It retains the maritime world rather than importing Bruno's car-world geometry.
Professional credentials remain separate from game exploration achievements.

## Implemented

- Personal landing identity and page metadata.
- About, Projects, Skills, Experience, Credentials, Contact, and Settings.
- Nine project cards and detail dialogs, including the three original products.
- Work history, education, and credential links sourced from the old portfolio.
- Fourteen world destinations, with proximity actions and chart labels.
- Reused portrait and existing project screenshots.
- `/resume/` provides the same content without WebGL or JavaScript.
- Mobile layout, keyboard focus, and reduced-motion menu support.
- Fixed an early-entry initialization error found while testing navigation.
- Keyboard tab navigation, focus containment, and inert hidden content panels.
- Package identity and helper script paths updated for the new working location.

## Validation

Production build and browser checks cover section navigation, project dialogs,
the reading view, chart labels, and desktop/mobile layout. The existing large
3D bundle still produces a build size warning.

## Review before publishing

Confirm existing career dates and project descriptions remain current.
Some projects have no public URL or screenshot supplied; their descriptions
remain accessible without invented links or imagery. Hosting, the portfolio
domain are not changed. Development has moved
into the portfolio repository; the package is now named `vaibhav-portfolio`.
