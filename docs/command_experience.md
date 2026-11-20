# Command experience: glance, look, speak (design, 2026-11-19)

Builds on docs/stations_and_command_ui.md (F-key stations, audio-first, repeat-back, Auto / Supervised / Hands-on) and docs/command_model.md. This doc fixes how the captain moves between the overview, the station screens and the crew, in the 3D ship.

## 1. Three levels of attention
| Level | What | How |
|---|---|---|
| **Glance** | Command view from the command chair: a round overview scope on the front wall, a ring of key gauges, and six station tiles (Quill, Abara, Castellan, Dace, Fenwick, Pell) showing autonomy mode, current order and alert state. A knocked-out officer's tile greys out. | Key **9**, the hunt default; the avatar auto-sits in the command chair (which counts as a brace point) |
| **Look** | The station's own screen, full detail | **Tap** a station key (F1-F8, or click a tile) to go; **tap again** to return to Command view. **Shift + key** = peek: the screen overlays the overview while held |
| **Speak** | Ask and Order, by voice | **Hold** the station key: the station's radial. Hold empty space / key **Q**: the Call radial (six crew spokes) |
The overview shows only: the top five threats, own-ship state (speed, stealth/heat, power, hull, crew), and the next thing that needs a decision. Everything else is a station screen.

## 2. Input rules (one action system)
- Every input path (radial, hotkey, call-card answer) fires the same action ids that `CTL.activate` already uses, so each action is built once.
- **Tap vs hold:** under 0.25 s is a tap, over is a hold. A hold opens the radial at once on a hold of 0.25 s; the item under the flick direction is chosen on release, so it works without looking (marking menu).
- **Radial depth:** two levels at most: crew spoke, then Ask / Order items (up to six each). Per-officer verb cap of about 12.
- **Context radial:** right-click a contact, tile or crew member for that object's radial.
- **Answers:** keys **1-5** answer the current call card; **6** orbit camera, **7** shoulder, **8** ship view, **9** Command view.
- **Slow time while the radial is open:** the sim runs at **25 percent** while a radial is open (so you can think), and returns on release. This is the one allowed bend of the "no pause" rule: time never stops, it slows, only while a radial is open, and never while a station screen is merely looked at.

## 3. Posture presets (a bundle of standing orders)
**Silent run**, **Cruise**, **Combat**, **Evade**. Each sets speed rung, sensor posture, point-defence policy and quiet mode in one go; the crew handle the detail and the overview shows the current posture. **Brace is not a posture**: it is the crew's body state (`s.brace`), ordered separately (B key / crew radial), and works under any posture.
| Posture | Speed | Sensors | PD | Notes |
|---|---|---|---|---|
| Silent run | v1 (20%) | passive only, quiet | armed | coast, fins in |
| Cruise | v3 (60%) | normal | armed | default |
| Combat | v4 (80%) | normal | armed, active on a V-track | weapons ready |
| Evade | v5 (100%), hard evade | normal | armed | loud; crew should be braced (gate H4 asks) |

## 4. Where the overview lives (survey)
Searched, but the results were mostly link lists; the following is from general knowledge, not verified in this pass.
- **Star Trek, Artemis, Bridge Commander:** a big forward viewscreen the whole bridge faces; the captain sees it from the chair. Great for a glance; it shows the outside, not tactics.
- **Battlestar Galactica CIC:** a central tactical table (DRADIS) plus wall displays; the captain walks to the table. Works for a standing commander, not a seated one.
- **The Expanse (Rocinante and warships):** no single big screen; stations have their own, plus a holo-table. A flat information design with a lot of voice.
- **Submarine films (Das Boot, The Hunt for Red October):** no screen at all: the plot table and the officers' voices; the captain reads the room.
- **FTL / Space Crew:** a 2D cutaway overview with per-crew icons; the closest analogue to our tile ring.
Decision: **wall**, front of the control room, round scope. The captain sees it from the chair without walking, the tile ring does the crew-tracking job of FTL, and the central table stays free for Abara's chart work (the first-morning scene).

## 5. Layered tutorial
1. Overview: read the scope, the ring, the tiles (no input needed).
2. Look: tap a station key and tap it again; Shift peek.
3. Speak: hold a station key, answer a call with 1-5.
4. Posture: change posture, watch the tiles.
5. Brace and brace points: strap in, then walk to a rail.
6. Time: the 25 percent slowdown is introduced with the radial.
Each layer unlocks after the player has used the previous one twice; terse mode drops repeat-backs later.

## 6. Build order
1. Command view camera + round overview.
2. Call radial and station radials (+ slow time).
3. Tap / hold / peek station keys.
4. Posture presets.
5. CIC model rebuilt to match (dome, wall scope, stations, brace points).
