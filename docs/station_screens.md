# Station screens and the annunciator panel (design, 2026-11-14)

Dave's direction: **break the control screens out** into dedicated screens, one per station, with a **standardised alert and caution light panel** in a corner or along the side, styled more like the **AN/BYG-1 combat control system** and the **Tactical Control System (TCS)**. This replaces the single all-in-one console (kept as the F1 Conn view) with the F-key stations in `docs/stations_and_command_ui.md` s3, each a proper screen.

**Reference, honestly stated.** Public material on AN/BYG-1 (General Dynamics Mission Systems / Progeny) describes its *functions*, not its screens. It integrates a **Tactical Control System** (sensor data fusion, **target motion analysis**, tactical situational awareness, command decision tools; ingests sensor and comms data into a common operational picture) and a **Payload Control System** (planning, command and control and launch control for torpedoes, missiles, **unmanned vehicles** and countermeasures). Its operator displays are listed as: **contact management, payload command and control, threat warning, mission tasking, geographic environment, signal alerts, analysis, and reports**. We take that function split as the skeleton and borrow general multifunction-console conventions (annunciators, softkeys, windowed panels). We are **inspired by it, not copying real screens**, which are not public. Source: [GDMS AN/BYG-1](https://gdmissionsystems.com/submarine-systems/combat-systems/an-byg-1).

## 1. The annunciator panel (same on every screen)

- **Placement:** a fixed vertical strip on the **right edge** of every station screen (a compact corner cluster on small windows). Same lamps, same positions, always, so muscle memory works.
- **Tiles:** rectangular labelled lamps in **fixed positions** grouped by station. Each tile has a short label (up to 8 characters), a state, and a click or hotkey that **jumps to its station**.
- **States** (standard aviation and ship convention):
  | State | Look | Meaning |
  |---|---|---|
  | **Warning** | red, flashing until acknowledged, then steady | act now (hull, vampire, fire) |
  | **Caution** | amber, flashing until acknowledged, then steady | attend soon (running hot, mag low, link lost) |
  | **Advisory** | white or cyan, steady | status or information (PD armed, probes out) |
  | **Normal** | dim green outline | healthy |
  | **Off** | dark | not applicable |
- **Master WARNING and master CAUTION** buttons at the top of the strip flash while anything is unacknowledged; **A** acknowledges all (or click a tile to acknowledge one). Acknowledging silences the flash, not the condition; the lamp clears when the condition does.
- **Tied to the call model:** a lamp is driven by engine state or an open call (a priority 3 call lights its station's caution; a priority 4 call lights a warning and the master warning). The CO can glance at the strip and see *which station needs them* without reading.
- **Colour grammar note:** the hunt scope's rule (reds and yellows = affirmatively detected, blues and greens = suspected) belongs to **contact symbols**. Annunciators follow ship-systems convention (red, amber, white, green) and live in a boxed panel so the two never mix.
- **Initial tile set** (about 24; each row is a station):
  - **SENSORS:** NEW TRK, PING HEARD, TRK LOST, SENS FOULED
  - **FIRE CTL:** SOL READY, SOL STALE, BEARING ONLY
  - **WEAPONS:** INCOMING (warning), MAG LOW, PD ARMED, PD ACTIVE, SALVO AWAY
  - **HELM:** BURN, LINK BRK (laser or wire broken by a manoeuvre), COURSE CHG
  - **ENG/THERMAL:** RUN HOT, SINK HIGH, VENTING, REDLINE
  - **DAMAGE:** HULL, FIRE, BREACH
  - **COMMS/PROBES:** LINK OFFER, PROBE LINK, PROBES OUT, PROBES LOST

## 2. The common screen frame (the multifunction look)

Every station screen shares one frame so they read as one system:
- **Top bar:** station name and officer (with autonomy mode badge: AUTO, SUPV, HANDS-ON), game clock, our posture (quiet, hot, ping), and the master lamps.
- **Right strip:** the annunciator panel.
- **Left column:** **function tabs** (vertical, like a multifunction console's page keys) that switch between the station's pages.
- **Main area:** windowed panels with title bars and thin ruled borders, **dense but gridded**, monospaced numerals, one accent colour per station, dark background.
- **Bottom row:** **softkeys** (F-labelled buttons, context-sensitive), above the call-deck strip and its answer chips (unchanged).
- **Message line:** one line for the last order's lifecycle ("Abara: fire control aye, ranging S2").
- **Autonomy and the screen:** in **Auto** the screen is a **live read-only view** of what the officer is doing ("Quill: sweeping; S3 classify 60%"); in **Supervised** it shows the pending recommendation; in **Hands-on** the controls are live and the officer only acks. So the same screen is a window in Auto and a workstation in Hands-on.

## 3. The screens (mapped to the BYG-1 function split)

| Key | Screen | BYG-1 analogue | Pages and contents |
|---|---|---|---|
| **F1** | **Conn / Tactical** | TCS tactical picture, geographic environment | The scope (current map), contact list, our posture, the two or three most urgent items; the existing console view stays here until the scope session decides the final view |
| **F2** | **Sensors** | Contact management, signal alerts | **Track table** (designation S/R/V/L, quality, bearing, age, range band, class guess), channel strips per track (heat, reactor, eclipse), analyst assignments, ping control, ghost list |
| **F3** | **Fire control** | TCS TMA, analysis | **Bearing-time history plot** per selected track, the solution card (confidence, age, range uncertainty as an along-bearing band), baseline controls (stub until Newtonian motion), lock and release |
| **F4** | **Weapons and payload** | Payload Control System | **Magazine and tubes** (60 rounds by warhead), **salvo planner** (presets and parameters, run-to-enable timeline, point-defence window), **PD control** (off, armed, active), launch control (READY, ARM, FIRE), **unmanned vehicles / probe sets** (two-set rack, state, link type, recovery), countermeasures |
| **F5** | **Helm and navigation** | Mission tasking, geographic environment | Route and waypoint plan, burn nodes and heat and flare preview, link tolerance indicator (laser or wire holds only if course and speed hold), strategic map |
| **F6** | **Engineering and thermal** | Platform systems | Reactor, drive, sink gauge, heat-rate dial, trend, vents, redline, power allocation |
| **F7** | **Damage control** | Platform systems | Compartment and system schematic, repair queue, priority doctrine, hull bar |
| **F8** | **Comms and reports** | Reports, mission tasking | Comms log, patron tasking, link offers and status, Pell channel, event and after-action report |

Probe control lives in **F4** (the Payload Control System handles unmanned vehicles); *fix requests* come from F2 and F3 as intent orders; link state shows on F5 and the annunciator.

## 4. Standard widgets (build once, reuse)
Annunciator strip, screen frame (top bar, function tabs, softkey row, message line), **track table**, **bearing-time plot**, **solution card**, **tube and magazine panel**, **salvo timeline**, **heat plot** (exists), **gauge** (exists), **schematic** (damage), **log list**, **probe set card**.

## 5. Build order
1. Frame and annunciator (shared), wired to the station model and engine state, on every F-key.
2. F2 Sensors and F4 Weapons (the two richest, and the first to make Hands-on meaningful).
3. F3 Fire control (the bearing-time plot and the solution card).
4. F5, F6, F7, F8 (largely re-arrangements of existing widgets).
5. Then the scope session decides F1's final view.

## 6. Open questions
- Annunciator count and exact labels: start with the set above and prune in playtests.
- Do the screens use one global accent colour or one per station (proposal: per station, low-saturation, so the CO knows where they are at a glance)?
- Should the annunciator be draggable or fixed (proposal: fixed)?
- Audio for the annunciator: a distinct chime for caution and a tone for warning, over the voice lines (proposal: yes, quiet).

## 7. Implementation notes (2026-11-14, built)
- **Files.** `web/annunciator.js` (no DOM: the tile set, `derive({s, model, E})` the pure lamp-state function, and `create()` for acknowledgement and flashing; tests `tests/annunciator_test.js`), `web/station_screens.js` + `web/station_screens.css` (the frame, the annunciator strip, softkeys, message line, audio), `web/station_pages.js` (the F2-F8 pages). All inlined into `web/hunt_rt.html` by `web/build_hunt_rt.sh`. Browser test `tests/screens_pages.py` (screenshots `tests/shots/screens_F1.png` ... `screens_F8.png`, `screens_annunciator.png`).
- **Same switch as the call deck:** normal hunts only. The Tern tutorial and `?calldeck=0` have none of it (no frame, no annunciator, the stage stays 1920 wide).
- **Stage.** With the screens on, the fixed stage grows from 160 to 174 units: the annunciator is a 14-unit column on the right edge of **every** screen, F1 included, so it never covers anything. F1 is the existing console unchanged (scope and map untouched; the scope session decides F1 later). F2-F8 replace everything below the top rail with the frame; the top rail (F-keys, CREW settings, time keys) stays on every screen.
- **Frame:** top bar (F-key, station, officer(s), autonomy badge AUTO / SUPV / HANDS-ON, page, selected track, posture, mission clock), left function tabs (P1, P2), a mode banner, windowed panels, eight softkeys (**Shift+F1-F8**; Shift+F8 is always MODE, cycling the station's autonomy), the message line (the last order of this station: issued, acked, executing, done) and the call band where the call deck's strip and chips sit (the call rail sits beside it). Toasts land on the message line. One low-saturation accent per station.
- **Autonomy on screen:** Auto = read-only live view ("QUILL: DACE ON S3, S3 CLASSIFY 81% WARSHIP"), the controls greyed. Supervised = the station's pending recommendation in the banner with APPROVE and the other options as chips (they answer the call). Hands-on = the controls are live. Track selection and page tabs work in every mode.
- **Annunciator:** 27 tiles in fixed positions by station (SENSORS gained DETECTED, the enemy-fix lamp; SOL STALE is labelled STALE to keep 8 characters). Lamps derive from engine state (vampire event, `s.inc`, `s.warn`, `s.mag`, `s.pd`, `s.heat`, `s.sink`, `s.vent`, `s.burn`, `s.hull`, `s.melt`, `s.stage`, locked-track solutions) and from open station-model calls (row to tile; priority 3 = caution, 4 = warning, a waiting priority 2 = advisory, a fresh routine report = a short advisory). Warnings and cautions flash until acknowledged (click the tile: it also jumps to the station; click a master; or **A** for all), then stay steady until the condition clears. LINK BRK, PRB LINK, PRB OUT, PRB LOST are dark: not simulated. Audio: a WebAudio two-tone for a warning (repeated every 4.5 s while unacknowledged) and a soft chime for a caution; it follows the voice mute and volume, has its own toggle in the CREW drawer, and stays silent if the browser blocks audio.
- **Pages.** F2 TRACKS (track table with quality, observed bearing, age, range band from the engine's uncertainty, class guess, H-R-V readings; channel strips for the selected track; analyst assignments; active ping) and GHOSTS (ruled out with re-analyze; lost tracks). F3 TMA (bearing-time history from **observed** bearings, `E.displayPos`, with the bearing-uncertainty band; solution card with confidence, age, track state and the range band drawn along the bearing; lock / target view, re-solve, release, re-analyze) and ALL SOLUTIONS. F4 LAUNCH (magazine by warhead, tubes, salvo planner with presets and the run-to-enable timeline, launch control READY / ARM / FIRE where FIRE is an order to Abara through the adapter, point defence, probe sets, countermeasures) and PRESETS. F5 ROUTE (the strategic map window, unchanged, plus route table, drive and heading, burn preview, link tolerance). F6 HEAT (sink, rate dial, trend, heat sources, vents / quiet / redline / cut thrust) and POWER. F7 SYSTEMS (compartment schematic coloured from hull, heat and efficiency; hull; system table; repair priority flag). F8 COMMS (calls log, link offers) and REPORTS (event log, after-action so far).
- **Stubs (NOT YET SIMULATED, no behaviour):** salvo pattern, run-to-enable and wire; probe sets (two placeholder sets, Orrin and Vask, stowed; deploy and recover disabled); countermeasures; TMA baseline legs; link tolerance; burn nodes and flare cones; power allocation; compartment damage and the repair queue; ally data link, probe links and patron tasking.
