# CIC 3D build plan (staged)

Goal: the hunt plays in a fully 3D CIC. Screens stay 2D canvas on CRT glass. Placeholder props are code-built (toon + inked outline) from the Gemini A/B sheets; Meshy GLBs replace them per asset.

## Stages
1. **Shell (this commit)** `web/hunt3d.html` + `web/cic3d/*`: room, three benches (sensors, attack, systems), map table with hologram, CO couch, wall racks, overhead annunciator. Live engine (`HuntRT`), `StationAdapter` (Auto autonomy), `Annunciator`. Tiers ROOM / SECTION / SCREEN via keys; brace state FREE / BRACING / SECURE (B).
2. **Meshy swap** drop `assets/props/glb/<slot>.glb` and list the slot in `assets/props/glb/manifest.json`. No code change.
3. **Free-roam walking, crew rigs and animation** after F-key cuts feel right.
4. **Interaction (done, see docs/cic3d_interaction.md)**: click hardware and screens -> adapter orders, guarded FIRE, autonomy switch, radial menu, order bar, audio, simplified tutorial (`?tutorial=1`).

## Controls
F1 room · F2 sensors · F3 attack · F4 systems · Q/W/E screens of the current section · Esc/wheel out · 1-3 answer the top call · Backspace stand by · B brace · Space ack annunciator · T tick speed (1x/2x/4x).

## Asset slots (key -> procedural fallback, Meshy reference)
couch_crew (A1), couch_co (A1 variant), harness (A2), bench_sensors / bench_attack / bench_systems (B1), crt (B2), keypad (B3), trackball (B4), joystick (B5), fire_box (B6), gauge (B7), rotary + toggles (B8), annunciator (B9), rack + breaker (B10), map_table, hologram_sphere.
Each slot is built through `Slots.make(key, fallback)`: it returns a Group holding the fallback; if the manifest lists `key`, the GLB loads async and replaces the fallback children (scaled to the fallback's bounding box so placement stays valid; `Slots.fit` can be overridden per slot in the manifest: `{scale, y, rot}`).

## Live wiring
- `E.newHunt(seed)`, `E.tick(S, dt)`; `StationAdapter.create({engine:E, seed, autonomy:'auto', command:'tight'})`, `A.update(S, dt)` each frame.
- Screens read `S.an[]` (`E.displayPos`, `S.player`, `E.brgOf`, `E.classify`), `S.sink.h`, `S.hull`, `S.mag.byKind`, `S.pd`, `A.model.pending()`.
- Annunciator: `Annunciator.create().update({s, model: A.model, E})` drives the overhead panel and lamp text.
- Calls: `A.model.pending()` -> overlay card, keys 1-3 `A.model.answer(id,i)`.
- Brace: B toggles BRACING (couches recline over 2.5 s) -> SECURE; in the engine this will gate the burn calls (H4/H5/D4). Visual only for now.
