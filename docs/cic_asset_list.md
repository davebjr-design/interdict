# CIC asset list (Meshy)

Slots come from `docs/cic3d_build_plan.md` (`Slots.make(key, fallback)`; drop `assets/props/glb/<key>.glb` and list it in `manifest.json`). Style target: worn 1980s-90s military CIC, matte olive and grey metal, amber/green/cyan screen glow, taped labels, scuffs, cable runs. Real-scale, low-poly-friendly (game-ready, under about 20k tris per prop), PBR textured.

Status: Meshy sign-in pending Dave's device approval. Nothing generated yet. Check the balance with `meshy` before spending; Dave approved up to 200 more credits for the 3D buildout.

## Tier 1: biggest immersion per credit (generate first)
| Slot | Prompt seed | Why |
|---|---|---|
| couch_crew / couch_co | Heavy acceleration couch, padded black vinyl, five-point harness, grab handles, worn armrest control pod, military spacecraft | The brace mechanic lives here; the player sees what "brace" means |
| harness | Five-point harness, buckled, olive webbing, steel buckle | Pairs with the 5 s flip warning |
| crt | Chunky 1980s military CRT monitor in a steel bezel with brushed knobs and a taped label strip | Frames all eight screens; the single most visible prop |
| bench_sensors / bench_attack / bench_systems | Modular steel console bench with sloped panel, recessed monitor bays, kick plate, cable trays, scuffed paint | Defines the room silhouette |
| annunciator | Overhead warning light panel, rectangular backlit legend tiles in a steel frame | Already live-driven; gets a proper housing |

## Tier 2: tactile controls (what the hands-on mode touches)
keypad (B3), trackball (B4), joystick (B5), fire_box (B6, guarded hot switch with hazard stripes), gauge (B7, round analog dial), rotary + toggles (B8), rack + breaker (B10). Generate as a single "control kit" sheet, then split if Meshy handles it, otherwise one call each.

## Tier 3: room dressing (cheap, high feel)
- Map table with glass top (the hologram sits over it)
- Hologram projector emitter ring
- Wall cable bundles and conduit runs
- Fire extinguisher, first-aid box, emergency light
- Coffee cup with lid and clip (zero-g flavour), taped checklist, crew-name placards (QUILL, ABARA, CASTELLAN, DACE, FENWICK, PELL)
- Overhead pipe and ducting set, floor grating, hatch door

## Not Meshy
- Screen content (already live canvases).
- Crew rigs and animation: after the F-key cuts feel right (build plan step 3). Rig through Meshy later.
- Voice: see below.

## Making it feel alive (ideas, no code yet)
1. **Ambient audio bed**: ventilation hum that rises with heat sink; relay clicks on every order; muffled hull creak that grows under g.
2. **Crew chatter layer**: low-priority overheard lines between officers (Quill and Dace trading a joke, Fenwick muttering about a seal). Never carries information; makes silence meaningful when it stops.
3. **Light as state**: room lighting shifts amber on warning, red-dim on battle stations, cold blue in stealth. Screen glow bleeds onto faces and consoles.
4. **Physical reaction**: camera and loose props (coffee cup, tags, cables) sway with g load and drift during a flip; the 5 s flip warning gets a visible tell (cup slides).
5. **Officer posture**: each officer visibly braces on Abara's call; a missed brace shows someone caught unsecured.
6. **Console wear telling a story**: handwritten tape labels from the crew, a taped photo, a counter of ships ID'd.
7. **Answerback texture**: officers lean in or turn when they raise a call; unanswered calls get repeated at rising urgency.

## AI voice generation plan
- Catalog: `tools/tts/catalog_lines.js` expands `Stations.ROWS` into 279 static lines (answerbacks and H6/H7 included). Render these once per voice and store in `web/voice_clips/` (manifest already supported by `voice.js`).
- Live-number lines ("peaks at 3.2 g") either get quantised number clips stitched together, or go to a streaming TTS service at runtime; stitched clips are cheaper and offline-safe.
- One distinct voice per officer; keep radio-filter post-processing in the audio chain so the clips match and compress well.
- Service choice is open: evaluate for latency, per-character cost, licensing for shipped games, and voice-cloning terms before committing.
