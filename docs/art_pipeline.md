# Art and interface pipeline (draft v0)

Goal: a bridge that feels physical (switches, knobs, a screen) with a radar display that looks striking, not like geometric clipart. Desktop browser only.

## Principles
1. Logic never depends on art. Every visual is a named slot in `web/assets/manifest.json` (name, size, states). Placeholders ship first and are swapped without code changes.
2. Art waits for a fun loop. Placeholder UI until the Stage 3 playtest says the hunt holds tension. Then we spend.
3. The radar is a shader, not an image. Phosphor persistence, sweep, grain, bloom and bearing-bin glow on a canvas/WebGL layer. Contacts are smears and ghosts, never icons. The funnel is a fading, widening translucent wedge.
4. Controls are components, not pictures. Each knob, switch, toggle and slider is an SVG/CSS component with states (idle, hover, active, locked, fault) and a sound hook. Skins change the look, not the behavior.
5. One style bible before any final asset: reference board (3-5 real instruments: submarine sonar consoles, 70s-80s radar and avionics), palette (max 6 colors plus two phosphor tints), type (one mono, one condensed label face), material notes (brushed metal, backlit legends, worn labels).

## Production routes (pick per asset)
- Procedural (us): panels, grain, scanlines, radar, glow, indicator lamps. Cheapest, fully consistent.
- Image generation (Dave, outside this sandbox): bezel plates, panel textures, label sheets, from the style bible. Delivered as PNG/WebP at manifest sizes, 9-slice friendly.
- Licensed or CC0 packs (check license): knob and switch sprites, UI sounds.
- Commission: only for the hero bezel and logo, after the playtest.

## Process per asset batch
1. Add entries to the manifest (name, size, states, status: placeholder/draft/final).
2. Build the placeholder from code.
3. Dave reviews in the browser; mark draft/final; swap files; no code edits.
4. Critic pass on readability: can a tester read the state of every control at a glance, and does the radar answer "where, how sure, how old" without a legend?

## Open
- Hosting and audio. Whether Pell gets a visual (waveform, lamp) or stays voice and text only.
