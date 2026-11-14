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

## 3. The screens (first mapping, SUPERSEDED by s7 on the console wall; the widgets and rules below still apply)

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

## 7. The console wall (Dave, 2026-11-14): revised shell and screen set

Dave supplied an AI-generated image of a submarine control wall: **eight bezel-framed screens in two rows of four**, each ringed by physical keypads, over a **desk** with keyboards, trackballs, analog dials and sliders, joysticks, safety switches and **guarded red fire interlocks**. Its screens: Tactical Navigation, Common Operational Picture, Sonar Fusion (waterfall), Target Motion Analysis, Target Identification, Engagement and Weapon Status, Payload Readiness, Strike Control. Direction: **adapt it, make the F keys zoom in on those screens with enhanced functionality, and fit the screens to our rules.**

### 7.1 One view, two zoom levels
- **Wall view (default hub):** the whole wall at once: 8 screens in 2x4, a **systems rack** of 3 smaller screens beside it, the **annunciator strip along the top** (overhead panel), and the **desk strip** along the bottom. Screens here are **live miniatures**: glanceable, non-interactive, updated at about 2-4 Hz. The call strip and call rail stay on top as now.
- **Zoom (F key):** **F1-F8 fly the camera into that screen** (an eased 300-400 ms zoom, slight perspective so outer screens angle in), the screen fills most of the view, its **bezel keys become live** (the physical-keypad arrays: roughly 6 page keys down the right, 8 softkeys along the bottom, labelled per screen), extra panes appear that the miniature omits, and neighbouring screens dim at the edges. **Esc or the same F key zooms back to the wall.** Mouse: click a screen to zoom, wheel to move between levels. **Shift+F1-F3** zoom the three systems-rack screens.
- **Same DOM, scaled:** each screen is built once at full size and scaled down on the wall (CSS transform), so the miniature is the real screen and there is no second implementation. Only the focused screen renders at full frame rate; the rest refresh slowly to keep it cheap.
- **Look:** procedural, no new art needed: dark green-grey steel panels with rivets, rounded bezels, keycaps drawn in CSS, scanlines or a faint glass sheen on the screens, one low-saturation accent per screen. This is the "multifunction console family" look; the AI image is the mood reference only.
- This is also the **ship-level L1 view** of the earlier zoom-tier plan; a later **over-the-shoulder 3D diorama (L2)** can replace the zoom target without changing the screens.

### 7.2 The eight screens, adapted to our rules
| Key | Screen (image analogue) | Owner (autonomy) | What it shows and does here |
|---|---|---|---|
| **F1** | **TACTICAL NAV** (Tactical Navigation) | Helm | The scope/map **as it exists today** (the scope-view session will redesign it), route and waypoints, scale +/-, REL/ABS centring, **heat cost of a course change**, **link tolerance** indicator for laser and wire (STUB until probes and Newtonian). Helm functions live here. |
| **F2** | **CONTACT PICTURE** (Common Operational Picture) | Sensors | The **track table**: designation (S, R, V, L), quality marker (dotted suspected, dashed passive, solid affirmed), bearing, range band, age, class guess, ghost flag; threat filter, class overlay, search; selecting a track selects it on every screen. Probe **fix requests** are intent buttons here. |
| **F3** | **SIGNAL FUSION** (Sonar Fusion) | Sensors | A **bearing-time waterfall** of our three channels (heat, reactor, eclipse) as stacked bands; contacts appear as moving traces, pings as streaks, own noise as a band. Controls: **listening-cone width** (narrow reaches farther, wide covers more; the directional-scan trade), array source (all-round or dish by ship tech), filter, analyst assignments, **active ping** (with the alert warning). |
| **F4** | **TMA / FIRE CONTROL** (Target Motion Analysis) | Fire control | Bearing-time plot for the selected track, the **solution card** (confidence, age), the **range band drawn along the bearing**, geometry plot (own legs versus the solution), SOLUTION toggle, data filter, lock and release, **baseline** controls (STUB until Newtonian motion). Probes add bearing sources here when they exist. |
| **F5** | **TARGET ID** (Target Identification) | Sensors | Per selected contact, the **three channel instruments** (heat spectrum, reactor line, eclipse profile) fed by the analysts, the **lineage and class clues** ("pumped loop, armoured plating: Vask"), the **identification gate** (is she a warship, a lure, a ghost), and a **3D image tile** that fills only after a probe fix (STUB). |
| **F6** | **ENGAGEMENT AND DEFENCE** (Engagement and Weapon Status) | Weapons | **Their picture of us**: each hunter's fix state (aware, closing, firm), our exposure, **incoming V-tracks** with bearing and ETA, **point-defence** state (off, armed, active) and the intercept window, our weapons in flight with time to impact. This is where priority 4 calls resolve. |
| **F7** | **PAYLOAD READINESS** (Payload Readiness) | Weapons | The **magazine** (60 rounds by warhead, salvos), tube and rack cutaway with ready lamps, **probe sets** (the two-set rack: lineage, size, link types, state; deploy and recover STUB), countermeasures. |
| **F8** | **STRIKE CONTROL** (Strike Control) | Weapons | The **salvo planner**: preset (Ambush, Snap shot, Probe, Saturation), pattern, **run-to-enable**, homing, wire, warhead, cone, count; the **launch timeline** with the enemy point-defence window; aim region on a small plot; **launch control with a guarded FIRE** (lift the guard, then hold to fire; blocked by rules of engagement or no solution). |
| **Shift+F1** | **ENGINEERING / THERMAL** (systems rack) | Engineering, Thermal | Reactor, drive, **heat sink gauge and rate dial, trend, vents, redline**, power allocation. |
| **Shift+F2** | **DAMAGE CONTROL** (systems rack) | Damage | Compartment and system schematic, hull bar, repair queue, priority doctrine. |
| **Shift+F3** | **COMMS / REPORTS** (systems rack) | Comms | Comms log, patron tasking, link offers and status, Pell channel, event and after-action log. |
The three systems screens are additions to the image (it has no engineering or damage screens, but our stealth and heat rules need them).

### 7.3 The desk strip (physical controls, made functional)
- **Autonomy switches:** one three-position rotary per station: AUTO, SUPV, HANDS-ON. This is the autonomy setting as a physical object.
- **Guarded FIRE interlock** (the red levers): mirrors F8's launch control, so firing is a deliberate two-step (lift guard, then fire) from any screen.
- **Master WARNING and master CAUTION** and the **annunciator acknowledge** (these also sit on the overhead strip).
- **Dials and sliders:** voice volume, annunciator chime volume, screen brightness, time compression 1x/2x.
- **Trackball and keyboards:** cosmetic in the first build.

### 7.4 Rules that carry over
- **Autonomy on screens:** Auto = live read-only view of what the officer is doing; Supervised = shows the pending recommendation; Hands-on = controls live. Zooming into a screen whose station is Auto is still allowed (it is a window), and a **Take over** key switches that station to Hands-on.
- **Calls and the wall:** an open call **highlights its screen on the wall** and flashes its F key, and the officer's name tag shows on the bezel; the camera never zooms by itself unless the "follow calls" setting is on.
- **No pause** in normal play; the tutorial is unaffected.
- **Scope view still undecided:** F1 holds the existing scope until that session.

### 7.5 Build order for the wall
1. Wall shell: 2x4 bezels with live miniatures, systems rack, overhead annunciator, desk strip, zoom transition, key handling (reuse the frame and annunciator work).
2. Content for F2, F3, F5 (the sensing chain), then F4.
3. F6, F7, F8 and the guarded fire interlock; then the three systems screens.
4. Polish: bezel keys per screen, dim neighbours, miniature update rates, call highlighting on the wall.
