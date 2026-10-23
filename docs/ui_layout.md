# Interdict hunt screen: layout and views

Status: design proposal. Wireframe: `/tmp/design/mockup.html` (static, sample data, placeholder styling). Screenshots: `/tmp/design/shots/`.
Nothing in `/home/claude/interdict` was changed.

## 0. What the player actually does (and why the page is wrong today)

Order of play in a hunt: arrive and read the briefing; sweep passively; watch evidence bars and report lines accumulate; point analysts at contacts that look interesting; call each contact (lock / dismiss); move (close, separate, evade, ping) while watching heat and the hunter's warning; track a locked ship until the wedge is narrow; plan and fire a volley; repeat; break contact if it goes badly.

Problems in the current page (see `/tmp/nav.png`):
- The radar is a quarter of the width, and the contact slips, which are read constantly, sit beside it at the same weight as everything else. About 40% of the width at 1920 is margin (`.wrap` is capped at 1240px).
- The page scrolls: the bottom row (ship, weapons, crew, reports) is below the fold, so the heat signature, tube readiness and the report feed are not visible while you look at the radar.
- The volley planner is embedded in the Weapons panel at the bottom. It is the most consequential decision in the game and it is the smallest, least visible control.
- The same facts appear twice or three times (hunter pips in header and ship panel, stealth in header and on the radar, a sentence of help text under nearly every control).
- Nothing tells you what matters right now. Everything is the same size.

## a. Landscape layout, no page scrolling

One fixed screen, `100vh x 100vw`, `overflow:hidden` on the body. Three horizontal bands: **alert strip** (top, about 6% of height, always the same), **work area** (about 92%, swaps between views), **footer** (the mockup's control bar only; the game has none).

Sizing rule: root `font-size: clamp(10.5px, 100vh/78, 15px)` and every dimension in `rem`. Because the rem follows viewport height, 1920x1080 and 1366x768 (both 16:9) are the same layout at two scales and 1440x900 (16:10) is the same with slightly more width per rem. Region widths are percentages; the scope canvas is sized from its container (ResizeObserver, redraw on resize). Cap the whole screen at 2400px wide and center it, so an ultrawide monitor does not stretch the scope.

### Alert strip (identical in every view), about 4.6 rem tall

| Cell | Width | Content |
|---|---|---|
| Clock | 6% | Hunt clock (game time). |
| Hunter | 10% | Three pips. Under them the **sweep line**: "NO SWEEP SEEN" or "SWEEP IN 0:09" (red, blinking). |
| Signature | 18% | Stealth badge (COLD / WARM / HOT / DARK), a heat bar with the 30% and 60% thresholds, and a one-line "because": rising or falling plus the largest contributor ("rising: active ping + burn"). |
| Actions | 9% | Go quiet (with cooldown on the button), Break contact. |
| Report ticker | flex (about 22%) | Newest two report lines, officer name colored, urgent ones with a red bar. |
| Vitals | 7% | Hull %, three salvo squares (green ready, amber filling while reloading). |
| View tabs | 14% | TACTICAL 1 / STRATEGIC 2 / TARGET n 3. |
| System | 7% | Pause, Manual. |

### Tactical (default). Region grid below the strip

| Region | Width | Height | Content |
|---|---|---|---|
| Contacts rack (left) | 23% | 100% | Header; eight slips share the height equally (about 11.5% each); ruled-out slips collapse to one line and give the height back. |
| Scope (center) | 45% | 100% | Header with range zoom 10/20/40 km; scope canvas fills the rest; under it one **helm line**: stance, speed, Hold position, Resume plan. The current order text sits in the scope's bottom-left HUD. |
| Right rail | 32% | 100% | Ship (heat contributors, power draw, hull), Weapons (3 salvos + coilgun), Crew (3 analysts, Pell meter and toggle), Reports (history, fills the remaining height, newest on top). |

Right rail heights at 1080: Ship about 27%, Weapons about 14%, Crew about 18%, Reports about 41%.

### Strategic

| Region | Width | Height | Content |
|---|---|---|---|
| Arena map | 42% | 78% | Whole 40 km square in a fixed frame, flight plan with ETAs, contacts and wedges, our trail, 6 km coilgun ring toggle, signature ring, start zone, ally. |
| Contact ledger + Reports | 36% | 78% | Table (number, status, class and odds, bearing, range, last-read age), then report history. |
| Plan and knowledge | 22% | 78% | Flight plan list with Resume/Clear and waypoint ETAs, "What we know" notes. |
| Hunt timeline | 100% | 22% | Rows: Hunter, Signature, Our fire, Quiet/Plan. "Now" line with a hatched, honest "not knowable" future. |

### Targeting

| Region | Width | Height | Content |
|---|---|---|---|
| Dossier (left) | 17% | 100% | Target number, class, status, three evidence bars, track quality (tracking minutes, scan age, path error), other targetable contacts, reports about this contact. |
| Plot + instruments (center) | 49% | 100% | Fire-solution plot (about 70% of height) with a row of four dials under it: Bearing, Range, Bow angle, Target speed. |
| Solution cluster (right) | 34% | 100% | Sweep banner (only when a warning is live); Aim lead and Cone width dials (the two amber, interactive ones) with sliders; hit chance; danger-close and coilgun lamps; salvo lamps; volleys in flight; HOLD AIM and FIRE SALVO; Coilgun; Back. |

### How it degrades

- **1920x1080**: reference layout, rem about 13.8px, body text about 13px.
- **1440x900**: rem about 11.5px. Same regions, same content. Text is 11-12px. This is the smallest size where everything is shown in full.
- **1366x768**: rem clamps at 10.5px (the clamp is why width wins over height here). Everything still fits with no scroll in the mockup, but body text is about 10.5px, which is small for a mono font. If the user actually has this screen, apply these cuts, in order: (1) slips drop the third line (advice sentence moves to a tooltip); (2) Ship panel shows the top 2 contributors, not 4, and power draw collapses to a one-line "Sensors/Drive/Weapons/Compute" tooltip; (3) Reports panel shows the last 6 lines only; (4) dial captions (the small note under each dial) hide. Nothing in the alert strip is ever cut.
- Below about 1280 wide or 720 tall: not supported (desktop landscape only). Show a "make the window larger" notice rather than reflowing.

## b. The three views

### Tactical (the working view)

You live here. Contents and the single job of each region:
- **Slips** (the decision queue): status chip, class and odds, the three evidence bars, Lock/Dismiss. **The evidence bars are the analyst buttons**: click the Heat bar to point Dace at that contact (the bar gets an outline and a pulsing dot), click again to release. That removes the three analyst buttons per slip, which is about a third of the slip's controls, and makes "who is looking at what" visible where you read the evidence. Crew panel still lists who is on what (it is the confirmation and the Pell controls).
- **Scope**: see section e.
- **Helm line**: stance and speed segmented controls and plan buttons. Contact orders stay in the click menu.
- **Ship**: heat signature with its top contributors in words and numbers ("5%/m active ping (loud)"), power draw, hull and systems.
- **Weapons**: tube bars, coilgun status with the range ("out of range 13.3 km"). Read-only. The planner is not here any more.
- **Crew, Reports**: as today, compressed.

Locked contacts show a single prominent **Target >** button on the slip instead of Lock/Dismiss; it opens the Targeting view.

### Strategic (the map and the clock)

For "where is everything, where am I going, how long have I been at this". It does not have to be glanced at, so it can be dense.
- Arena map in a fixed frame (not ship-centered), 40 km. Shows the flight plan with per-waypoint ETA, our trail, our current signature ring (so "can they hear us here" is spatial), the starting zone box from the briefing, every contact blob (size = how little we know) with wedge for locked ones, the ally in green, the 6 km coilgun ring (toggle).
- Click the map to add a waypoint, click a waypoint to remove it. This is the briefing's flight-plan tool carried into the hunt. Needs a small engine change, see "new quantities" below.
- Timeline (game minutes, "now" line, future hatched): hunter steps and the pressure ramp (squeezeAfter 8, squeezeRamp), our signature history as colored bands (cold/warm/hot/dark), our volleys (launch to impact, tube reload), quiet windows and cooldown, waypoint ETAs. The future is shown only for things we really know: volleys in flight, reload, quiet cooldown, waypoint ETAs, and a telegraphed sweep when one is live. Sweeps are never drawn in the future beyond the warning, because they are not knowable.
- Ledger: one row per contact. This is the "tell me everything about all eight at once" table that the slip view cannot give.

### Targeting (the fire-solution station)

Opens when you choose **Target** from the contact menu (click a contact on the scope or a slip), when you press **Target >** on a locked slip, when you double-click a locked blip, or with `3` (last target, or the best locked contact). If the contact is not yet locked, Target locks it (same as now) and opens the view.

Silent Hunter ideas mapped to real engine quantities (all computed in the UI from existing engine calls; none need new simulation):

| Silent Hunter III | Interdict | Engine source | Notes |
|---|---|---|---|
| Bearing dial | **Bearing** to the target's displayed position, degrees from chart north (top of arena = 000) | `atan2` of `displayPos(s,a)` minus `s.player` | Error arc on the dial = cross uncertainty / range, from `spreadAt`. Chart-north, not relative to our bow: our ship has no heading in the engine. |
| Range dial | **Range** in km, with an amber band 0 to 6 km for the coilgun | `closeInfo(s,a).d` | Error arc from the along-path spread. |
| Angle on bow | **Bow angle**: how the target is oriented to our line of sight, 0 = head-on, 90 = beam on, 180 = running away; L/R shows which way it crosses | `anchor.hdg` against the bearing from target to us | This is real information in our game: it says whether the target is closing or crossing, so how much the lead and the cone matter. Error arc = `anchor.hs` (in radians, shown in degrees), which visibly shrinks while you track. |
| Speed dial | **Target speed** km/min | `anchor.spd`, error arc `spd * anchor.ss` | Same shrinking arc. |
| Gyro angle | none | - | Our missiles are not steered by a gyro angle; they are aimed at a point. Closest real thing: the bearing line from us to the aim point, drawn on the plot (dotted cyan). Do not make a gyro dial. |
| Spread angle | **Cone width** (km at the aim point, 0 to 8) | `cone` parameter of `fire`, `hitProb`, `selfRisk` | It is a width in km, not an angle. Ellipse on the plot is drawn to scale (along = 1.5 x cross, `P.alongStretch`), 1 sigma solid, 2 sigma dashed. |
| (no equivalent) | **Aim lead** km along the path (0 to 20 on the dial, slider can go to 40 like today) | `L` parameter, `fanInfo(s,a,L)` | Cyan tick on the dial and ghost marker on the plot = Abara's suggestion (`L == null` branch, which under-leads by `suggestShort` 0.72). Do not show the "best L" (`fanInfo().bestL`): the build log says showing the optimum killed the aim decision. |
| Tube selection | **Salvo lamps** 1, 2, 3 | `S.tubes` | Tubes are identical: `fire` uses the first ready one and each salvo is 4 missiles. There is nothing to choose, so the lamps are status, not a selector. Selecting a tube would need a reason to differ (see decisions). |
| Depth, pistol/magnetic, torpedo speed | none | - | No equivalent. Missile speed is a constant 8 km/min (`P.missileSpeed`); it appears only as flight time. |
| Stopwatch | **Flight time** (arrival) | `P.engage + fanInfo().tf` | Shown beside the sweep countdown when a warning is live. |
| Lock | **HOLD AIM** | UI only: set `aimL` to the current number so it stops following Abara's moving suggestion | This is the existing "follow suggestion" checkbox with a better name. It does not "lock the target" (that already happened). |
| Fire | **FIRE SALVO** | `E.fire(S, id, aimL, cone)` | One press. A two-step (lock then fire) is not recommended, see risks. |
| (new) | **Hit chance** | `E.hitProb` (Monte Carlo, 500 samples) | Compute every 0.9 s as now, smooth the display, show a bar plus a number rounded to 1%. Label "your picture", because it uses only the player's readings. |
| (new) | **Danger close** lamp | `E.selfRisk(...)` (p, dist) | Green: "clear, aim point n km from us". Red, blinking when p >= 0.03: "about 22% our missiles land on us". The plot also draws the 2 km self-hit zone (`P.selfRadius`) around us in red and tints the aim cross red. |
| (new) | **Coilgun** lamp and button | `closeInfo().d <= P.closeRange` and `S.cwCd` | Shows range and limit. Button live only inside 6 km and off cooldown. |
| (new) | **Grid read** | `a.flutter` | Text only until we have one. |

The plot is the large instrument. It is zoomed to whatever contains us, the target's last scan, the estimate, the aim point, and 4 km of margin: world-frame 2 km grid, the wedge (shaded by likelihood along the path, minute ticks, "+2m", "+4m"), last-scan marker, the estimated position in lock brackets, the aim cross with its cone ellipse, the dotted missile line with the arrival time in minutes, Abara's ghost marker, the 6 km coilgun ring (dashed amber) and the 2 km self-hit ring (red). Dragging the aim cross along the wedge also sets the lead (the slider and the dial follow); the cone has the wheel and the slider. The two amber dials are the only controls; the grey ones are instruments.

### New quantities, and what each would need

- **Own-ship heading / relative bearing**: not computable now. Needs `s.player.hdg` (heading of the last move vector) if the user wants relative bearings; otherwise keep chart-north bearing.
- **Sweep countdown**: the strip needs the telegraph end time. The engine has `P.telegraph` (0.8 min); verify there is a field such as `s.warnAt` / `s.sweepAt` the UI can read; if not, expose one (a single number).
- **Timeline history** (hunter step times, signature bands, past volleys): record in the UI from `S.stage`, `E.stealthState(S)` and `S.volleys`; no engine change.
- **Dominant contributor and trend** for the strip: from `E.exposure(S).parts` and a small moving average; no engine change.
- **Editing the flight plan mid-hunt**: `S.route` and `routeI` exist; add a tiny `E.setRoute(s, pts)` so the strategic map can edit them (or mutate `s.route` directly and accept it).
- **Pell's recommendation per contact** is already in `advice()`; shown in the slip's third line (`r3`).

## c. Always visible, and view switching

### The alert strip (never changes with the view)

Everything the player must never miss lives in the strip: clock; hunter pips and the sweep countdown; stealth badge with trend and cause; Go quiet and Break contact; newest two reports; hull and salvo readiness. Hull and salvos are there so that Strategic and Targeting do not hide whether we are hurt or loaded.

### Switching

- Tabs `TACTICAL / STRATEGIC / TARGET n`, hotkeys `1 / 2 / 3`.
- Click a contact (scope or slip): the existing context menu (Close, Separate, Evade, Active ping, Target). Target opens the Targeting view. Double-click a locked blip: straight to Targeting.
- `Esc`: closes the context menu if it is open, otherwise returns to Tactical from any other view. In Tactical with nothing open, Esc does nothing. Pause moves to `P` (today Esc is pause; keep Esc as "back", it is the more common need).
- `[` and `]` in Targeting: previous and next targetable contact (locked, hostile).
- `Q` goes quiet from any view. `B` is break contact (with a confirm).
- The clock never stops when a view changes. Only Pause stops it, and Pause blanks all views as today (including the strip's ticker and the plot).
- Switching is instant (no animation longer than about 100 ms). The Targeting view remembers the last aim and cone for each contact.

### A sweep warning arrives while in Targeting

The game does not move the player. It makes the warning impossible to miss while leaving the player in control:
1. Strip: the sweep line turns red and blinks, **Go quiet** gets a red outline and blinks (both mockup-demonstrated).
2. The whole work area gets a 3-pixel red inner frame and a soft red inset glow for the telegraph's duration (the mockup frame).
3. The Targeting view shows a red banner at the top of the right cluster: "SWEEP INCOMING 0:09. Impact of a volley now would land in 0:41. Press Q to go quiet." The flight time and the sweep countdown are now side by side, which is the actual decision: fire now (and be loud when the sweep lands) or go quiet and return.
4. An optional audio cue (one short tone), off by default.
5. No modal, no forced return, and no auto-quiet. Go quiet suspends analyst work, which is a real cost, so the player decides.

The same treatment applies in Strategic. A **hostile ping** (a contact flagged 100% hostile) gets the strip ticker's red bar and a one-time strip flash, but not the red frame, which is reserved for sweeps.

## d. Information hierarchy

**Glanceable (always on screen, never needs a click)**: stealth badge and trend; sweep countdown; hunter pips; hull; salvo readiness; slip status chips and classification with odds; scope blips with evolving labels; which analyst is on which contact (outlined bar, pulsing dot); the newest two reports.

**Read on demand (one click or hover)**: why we are hot (top contributors in the Ship panel; full list in a tooltip); a contact's detail (the advice sentence is the slip's third line, kept, but only as a single wrapped line); the ledger; the timeline; flight plan list; Field manual; each dial's caption.

**Hidden until relevant**: the Targeting view and all firing controls; the danger-close warning text; the coilgun button (appears live only inside 6 km); Pell's "act without asking" toggle (only from 75% integration); Resume plan (only when a plan is paused); the whole sweep banner; the Pause overlay; hostile-ping flash.

**Removed or relocated**:
- Second hunter pips (Ship panel): removed, the strip has them.
- Header stealth badge versus radar "STEALTH: HOT" label versus ship signature: keep three, but each has a different job: strip = verdict, scope HUD = spatial (ring), Ship panel = causes. The radar's text label drops its word and keeps only the ring color and the small corner tag.
- Per-panel help paragraphs ("Hunter finds you at 0.8x speed...", the posture and speed explanations, "Every bit of sensor work adds to the bar above", the radar legend): move into tooltips on the controls and into the Field manual.
- "Nothing yet. Sweeps will reach it, or study it" on unread slips: the chip says it, so the sentence stays only as the third line and is only one short line.
- Three analyst buttons per slip: replaced by the clickable evidence bars.
- Weapons panel "Engage" area: moved to the Targeting view.
- "Slow time" checkbox: moves to the strip's pace chip menu (or Pause menu), since it is a setting, not a tool.

## e. Evolving labels, chips, bars, stealth readout, and the scope

### Radar labels and blips (all feasible in canvas 2D)

A contact's picture is its knowledge, so the blip itself gets more crisp as evidence comes in:
1. **Not read**: a fuzzy gray glow about 16 px wide and the bare number. Dim.
2. **Some evidence** (one or two channels): glow shrinks, a small ring appears, and a **colored pip under the blip for each established channel** (orange heat, cyan reactor, violet eclipse). Label is still the number only.
3. **Classification** (two channels, `classify()`): label becomes "4 WARSHIP 65%", colored by class (amber warship, cyan decoy, dim for static). An **odds ring** around the blip fills clockwise in proportion to the odds, so confidence reads without reading the number. The label brightens and thickens at 90% and above ("ready to call", cyan bracket).
4. **Locked**: four corner brackets, a solid mark, the wedge (see below), and a bold label. Analyst beams: a thin dotted line in the analyst's color from us to the contact while Dace/Castellan/Quill is pointed at it. Beams exist only when an analyst is pointed, so motion on the scope is information.
5. **Hostile** (pinged us): red diamond, "2 HOSTILE 100%", a single expanding red ring when flagged.
6. **Ally**: green circle with a bar, "6 ALLY".
7. **Ruled out**: a small faded X, no label. **Crippled**: X with a short fade and a "crippled" tag, then ruled-out treatment.

Labels use simple placement: ten candidate offsets per label, reject any that overlap an already-placed label or leave the scope circle, draw labels last so nothing covers them. At scales where eight labels collide, fall back to numbers plus the selected contact's full label.

The wedge keeps today's behavior (anchor at last scan, fan along the heading, brightness at the likely current position), drawn with the amber gradient fading with age.

### Status chips

Same eight words as now, fixed colors, never moving: NOT READ (gray), UNRESOLVED (gray outline), READY TO CALL (cyan fill), LOCKED (amber fill), HOSTILE (red fill, red slip), FRIENDLY (green), CHASING (red outline), RULED OUT (collapsed, 45% opacity). Only READY TO CALL and HOSTILE draw attention (cyan edge, red edge). Nothing else glows, so the player's eye lands on the contacts that need a decision.

### Evidence bars

Three channel colors (heat orange, reactor cyan, eclipse violet) with a letter tab. Fill = strength, word inside (strong, faint, clear, blind, ?). Bars dim (40% opacity) when the reading is old (older than about 1.5 half-lives). Eclipse shows "?" when blind, hatched, never as an empty bar. The bar is also the analyst toggle and shows an outline and pulsing dot when an analyst is on it.

### Stealth readout

- **Strip**: a boxed badge: COLD (cyan), WARM (amber), HOT (red with glow), DARK (blue). Each has a different word as well as a color so it is readable without color. Beside it a heat bar with the two threshold ticks and a one-line cause: "rising: active ping + burn". Rising/falling is from the exposure trend; the cause is the largest term in `exposure().parts`.
- **Transition behavior**: going to HOT blinks the badge for 3 seconds and then holds a slow breath (not a permanent blink; the current permanent 1 Hz blink is stressful over a whole hunt). A Dace report fires on the transition as now.
- **Dark**: the badge turns blue with the time left ("DARK 1:48"), the scope dims and shows "SENSORS DARK", Go quiet shows its cooldown.
- **Scope**: a ring around our ship whose radius and color track the state, with a soft inner gradient, as in the mockup.

### The scope as a distinct sonar/radar instrument, not clipart

All in canvas 2D, no WebGL:
- **Glass and bezel**: dark teal phosphor field with a pre-rendered noise texture (a few hundred 1 px specks), a radial vignette, a CSS scanline overlay (`repeating-linear-gradient`), and a metal bezel with a 5-degree tick scale and 30-degree labels. Engraved N marker.
- **Rings and bearings**: dim rings every 5 km with numerals on the north axis, faint 30-degree spokes, a dashed amber 6 km coilgun ring.
- **Persistence**: draw the scene to an offscreen canvas and fade it with `globalCompositeOperation = 'destination-out'` at 6-8% per frame, so moving ships and the ping ripple leave short trails. Keep trails short (about 1 s) so they do not read as history.
- **Sensor wash**: a slow conic-gradient arm (period about 8 s, 10% opacity) purely as atmosphere. It does not carry data, and does not "paint" blips (otherwise players will think a blip is stale until the arm passes).
- **Bloom**: `shadowBlur` 6-10 on blips and strokes for glow.
- **Active ping**: an expanding ring from our ship along the bearing of the pinged contact only (it is directional), fading over `P.pingDur`.
- **Signature ring**: our ship's ring breathes at 0.5 Hz when Warm or Hot and is still when Cold.
- **Plot (Targeting)**: same glass and grain, world-frame 2 km grid, no bezel numerals; heavier line weights.

Tilt toward original art direction (CRT/vector, switches and knobs): the bezels, the dials' engraved plates and the physical FIRE/HOLD AIM buttons are where that lands; the layout does not depend on them.

## f. Playability risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Tunnel vision in Targeting**: the player is aiming and misses a sweep or a hostile ping. | The central trade-off of a separate view. | Strip is always there; sweep banner and red frame in the view; flight time shown beside sweep countdown; Q works anywhere; no auto-return (it would steal the aim). Playtest this specific moment first. |
| **Tactical overload**: 8 slips + scope labels + report feed + crew + ship, all in one screen. | The design makes the screen denser (the old one hid half of it below the fold). | Only two statuses draw attention (READY TO CALL, HOSTILE); ruled-out slips collapse; unread slips are dim; third line is one sentence; the right rail is read-mostly; a user setting "Calm" can hide Crew and Reports history in Tactical (they remain in the ticker and Strategic). |
| **Report ticker and Reports panel duplicate each other in Tactical.** | Redundancy the brief asked to remove. | Ticker stays (it is the only place new reports appear in other views). In Tactical, keep both for now; if it is cluttered, hide the ticker in Tactical only. Decision for the user. |
| **Dial fiddliness**: needles to drag are annoying and imprecise. | The aim has to be set in seconds. | Dials are readouts. Controls: drag the aim cross on the plot, the slider, mouse wheel on the dial, arrow keys (1 step) and Shift+arrow (5 steps), `A` to snap lead to Abara's suggestion. |
| **Hit-chance flicker**: Monte Carlo with 500 samples jitters by a few percent. | Looks broken, and tempts the player to chase noise. | Compute at about 1 Hz, smooth (exponential), round to 1% (or to 5% if still noisy), label "your picture". |
| **Pause blank vs. Targeting**: pause blanks the plot so no free aim analysis. | Intended. | Keep. The plot, dials and strip all blank. |
| **Switching away loses the aim**. | Frustrating if the player peeks at Tactical. | Keep aim and cone per contact for the hunt. |
| **Small text at 1366x768** (10.5px). | Readability of mono type. | State the cuts in section a; fix bar and chip fonts to 11px minimum; consider a user "UI size" toggle (Large drops the right-rail Reports and Crew into a drawer). |
| **Wide monitors above 16:9** (ultrawide). | The layout caps at 2400px wide and centers. | State it; do not stretch the scope. |
| **Fire is too easy** (one press, no confirmation). | Wasting a salvo (3-minute reload) is costly. | Danger-close red lamp, disabled FIRE when no salvo is ready (shows the reload time), the coilgun separately. Not recommended: a lock-then-fire two-step. It adds a click in the most time-critical moment and the player already has HOLD AIM as the "I am sure" act. |
| **Calm option cost** must be visible. | Brief says calm is allowed at a cost to effectiveness. | Put it in the pace chip (strip): Calm = slower pace, no blinking, a longer telegraph, Pell reports only urgent items; cost: analysts read 10% slower, so the hunter gains time. Numbers to be set by the user. |

## Decisions for the user

1. **Report ticker in Tactical**: keep both ticker and the Reports panel, or hide the ticker in Tactical.
2. **Lock/Fire**: confirm that LOCK in Silent Hunter maps to HOLD AIM (UI only), with FIRE a single press. Alternative: a real two-step.
3. **Relative bearing**: chart-north bearing now. If you want "bearing relative to our bow" and a true Silent-Hunter bow angle for us, the ship needs a heading in the engine.
4. **Tube selection**: tubes are identical today, so the lamps are read-only. Give salvos different properties (e.g. one cone-tight, one wide-fan) or leave it.
5. **Edit the flight plan during the hunt** (Strategic map). Needs `setRoute`. If not wanted, the Strategic plan list becomes read-only.
6. **Calm option**: what it changes and what it costs (see risk table).
7. **Sweep display**: how much lead should the sweep warning give? Today it is 0.8 game minutes, about 13 real seconds at 16 s/min. That is the full time a player in Targeting has to notice and act.
8. **Esc**: change from "pause" to "back"; move pause to `P`.
9. **Smallest screen**: is 1366x768 a real target? If yes, apply the cuts list; if not, 1440x900 is the floor.

## Implementation plan (each step leaves the game playable)

Current `hunt_rt_template.html` anchors: CSS block and markup in the first 100 lines; `<header>` (clock, stealth, pips, warn, Go quiet, pause, slow, break, manual, new hunt); `.top` (radar panel with `#cv` + contacts panel `#ct`); `.bottom` (Ship status, Weapons `#wpnp` with `#engage`, Crew, Reports); overlays `#cmenu`, `#brief`, `#manual`, `#pausebox`, `#over`; functions `build`, `btnsFor`, `uiUpdate`, `buildEngage`, `engUpdate`, `openMenu`, `togglePause`, `frame`, `contactLabel`, `draw`.

1. **Fixed frame, no scroll.** Change `body` to a 100vh grid (strip / work area), drop `.wrap` max-width and body padding, add the rem rule. Wrap the existing header, `.top`, `.bottom` in the grid without changing their contents. Nothing else changes. Check: no scroll at the three sizes (the page will look cramped; that is expected).
2. **Alert strip.** Turn `<header>` into the strip: move the stealth badge, pips, `#warn` (now the sweep line), Go quiet, Break contact into their cells; add the ticker (last two `S.log` lines, reusing the feed code) and vitals (hull, `S.tubes`). Delete the second pips row (`#pips2`) from the Ship panel and its update lines in `uiUpdate`.
3. **Tactical regions.** Re-grid `.top`/`.bottom` into the three columns: contacts rack (`#ct` becomes one column, `grid-template-columns:1fr`), scope (`#cv` panel, sized from the container: replace the `aspect-ratio:1/1` with fill + `resize` redraw; helm line made from `#seg-post`, `#seg-spd`, `#ordtxt`), right rail (Ship, Weapons, Crew, Reports stacked). All ids stay, so `uiUpdate` keeps working.
4. **Slips v2.** In `btnsFor`/`build`, make the three evidence bars the analyst toggles (existing `E.assign`), delete the Dace/Castellan/Quill buttons, shrink the third line, collapse `out` slips, add the **Target >** button for locked ones.
5. **Scope v2.** Rewrite `draw` and `contactLabel` per section e: blob/pips/odds ring, label placement, bezel, signature ring, beams, grain and scanline. Keep click and `openMenu` hit testing (reuse the stored blip positions).
6. **Views.** Add `view` state (`tac|str|tgt`), tabs, hotkeys, `Esc` behavior, and a `setView`. Tactical is unchanged until step 8. Move pause to `P`.
7. **Strategic view.** Generalize `drawBrief`'s map code into a `drawArena(canvas, opts)` shared by the briefing and the strategic map; add the ledger from `E.classify`, `closeInfo`; add history sampling (stage times, `E.stealthState` once a second, volleys) and the timeline.
8. **Targeting view.** Move `buildEngage` and `engUpdate` into the new view; keep `aimL`, `cone`, `E.fanInfo`, `E.hitProb`, `E.selfRisk`, `E.fire`, `E.fireClose` calls exactly as they are. Draw the plot (new canvas) from `fanInfo` and the wedge code in `draw`; add the dials as SVG (the mockup's `dial()` is reusable); add bow angle (`anchor.hdg` vs bearing). Remove `#engage` from the Weapons panel and make Weapons read-only. Set `engageId` when the view opens and clear it on exit.
9. **Sweep behavior.** Add the red frame (body class when a warning is live), banner in the Targeting view, blinking Go quiet; read the telegraph end time (see "new quantities").
10. **Polish.** Hotkeys `[`/`]`, drag-to-aim, wheel on dials, tooltips replacing help paragraphs, the "Calm" setting, a 1366x768 pass (cuts list), `prefers-reduced-motion`.

Steps 1-3 can be done and shipped without touching the engine. Steps 7-9 need only the small engine additions listed under "New quantities".

## Dave's decisions (2026-10-23)

1. Report ticker: only Tactical reports show while the Tactical view is open (ticker hidden in Tactical, shown in Strategic and Targeting).
2. Lock computes the firing solution; once a solution exists, Fire becomes available. (Lock then Fire, two steps. Hold aim is replaced by lock-and-solve.)
3. Bearings relative to our bow; to be tuned. Needs a ship heading in the engine.
4. Salvos are always identical: same missile count. Cone size sets density, which sets hit chance and proximity damage. Future: swappable missile types. Tube lamps stay read-only.
5. Flight path is editable in play. Initial planned path plus relative maneuvers. EVE-style: pick a pattern (orbit/circle, close directly, escape) and give a magnitude. Magnitude units are not kilometers at this scale; unit TBD.
6. Resolution: no stated target. Use rem scaling, 1440x900 as design floor, check 1366x768.
7. Open, defaults used: calm option as in the risk table; sweep warning lead unchanged (0.8 min); Esc = back, pause = P.
