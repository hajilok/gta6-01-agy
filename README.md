[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?ref=41fw6r6c)
[![rank](https://make.fun/badge/gta6-01/hajilok/gta6-01-agy/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?ref=41fw6r6c)
[![reward](https://make.fun/badge/gta6-01/hajilok/gta6-01-agy/reward.svg)](https://make.fun/bounty/gta6-01/leaderboard?ref=41fw6r6c)

# CALA SOLARA

**CALA SOLARA** is a 100% original, offline 3D open-world crime game built for the [make.fun `gta6-01` bounty](https://make.fun/bounty/gta6-01?ref=41fw6r6c), set in a sun-soaked volcanic-bay coastal metropolis across a clean, zero-dropped-file 29-module ES architecture.

## Highlights
- **4× MSAA HDR Bloom & Dynamic Coastal Atmosphere**: Custom GLSL HDR bloom & ACES filmic grading on a 4× hardware-antialiased WebGL2 render target, cached per-preset PMREM sky reflections (*Golden Hour*, *Sunlit Afternoon*, *Neon Dusk*, *Coastal Morning*), directional shadows, charcoal wet-sheen asphalt, feathered alpha-cutout curved tropical coconut palms, terraced volcanic peaks, and an animated Caribbean turquoise-to-sapphire ocean surf shader.
- **Sculpted Clearcoat Vehicles & Seamless Articulated Characters**: 9 original drivable vehicle classes (*Solara Apex V12* with wide-body rear haunches, louvered V12 deck, swan-neck GT wing, full-width crimson LED lightbar & plasma nitro, *Caldera V8 Coupe*, *Palmera Spyder*, *Vanguard LX*, *Harbor Cargo Van*, *Veloce 900R*, *CSPD Interceptor* with door/trunk livery & wet-road siren reflections, *CSPD Enforcer APC*, and *Cala WaveRunner* speedboat) with 28-segment concave 5-spoke alloys & red brake calipers, wall-sliding collision physics, and seamless proportioned combat characters with crouch/cover, dodge roll, camera shake, and 5 firearms.
- **6 Distinct Districts, 16-Tower Neon Skyline & Showroom Solara Customs Marina**: Explore *Palmera Strip* with Art-Deco hotels, sidewalk cafés & bustling boardwalk crowds, *Solara Financial Core* with 16 illuminated towers & skybridge, *Barrio Viejo* (*Plaza de la Fiesta* cobalt-mosaic fountain), *Puerto Caldera* with an open showroom-lit *Solara Customs* tuning bay (hydraulic lift, *Apex Performance* wall banner, tool bay & yacht marina), *Puente del Sol* suspension bridge, and *Monte Faro* volcanic lighthouse island.
- **Tactical 5-Star CSPD Dispatch**: Escalating pursuit tiers with RAM/PIT/Box-In interceptors, 3-ray obstacle avoidance, avenue roadblocks with blazing flares and tire-puncturing spike strips, armored SWAT APC squads, and *Air-1* helicopter volumetric searchlight lockdowns.
- **9-Mission Story Campaign, Active Crew, Road-Following GPS & Command Hub**: 9 multi-stage story missions with character radio comms, 3 switchable crew specialists (`[Q]`/`[C]`), road-following magenta GPS minimap, organic coastal vector turf map, AI street circuit races, 12 golden relics, stunt jumps, procedural Web Audio SFX + 3 FM radio stations, and 3-slot `localStorage` save/load.

## Run Locally
```bash
node serve.ts
# Open http://localhost:8080 in desktop Chrome
```

## Build Dossier
```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
