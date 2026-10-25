# Interdict hunt UI v2: a console of lamps, keys, gauges and dials

Status: design proposal, nothing in `web/` was touched. Mocks are static HTML (no scripts, no network fonts, fake data).
Open `mock_1366.html` and `mock_1920.html` (Tactical), `mock_target.html` (Target). Tick "show widget slots" (bottom right) to see every slot rectangle and its size tag.
Regenerate with `python3 build_mocks.py && python3 shoot.py` (needs Playwright). Screenshots of the shipped build are in `current/`.

Files

| File | What it is |
|---|---|
| `mock_1366.html` / `.png` | Tactical at 1366x768 (1u = 8.54 px) |
| `mock_1920.html` / `.png` | Tactical at 1920x1080 (1u = 12 px), with a heat-hover preview showing (100% drive hovered) |
| `mock_target.html` / `.png`, `mock_target_1366.png` | Target view at 1920 and 1366 |
| `mock_*_slots.png` | Same, with the slot overlay on |
| `build_mocks.py`, `shoot.py` | Generators for the above (the widget library in miniature) |
| `current/` | Shipped UI: briefing, tactical (cold and hot), strategic, target, nav menu, at 1366 and 1920 |

---

## 1. What is wrong today (from the screenshots in `current/`)

1. Prose does jobs a lamp should do. Every contact card carries a 30 to 45 word paragraph ("Most likely a warship, 52% certain. Evidence: Heat: strong, 6% sure; ..."). On a 1366x768 screen that is 55 to 65% of the card height and the rack shows only 5 contacts before scrolling. Ship Status adds four more sentences (heat, visibility, hull, a tip).
2. The same fact is shown two or three times, so the eye does not know which copy to trust: heat (header cell, "Heat sinks" panel, three "x% of the sink per min" lines under Visibility), stealth (header Signature, Visibility panel, Timeline), hull (header, Hull and systems), salvos (header squares, Weapons panel, Target "Salvos:" line), reports (header ticker, Reports feed, Strategic).
3. Like things are far apart. Drive speed (right column) is the main cause of heat (header, top middle) and the visibility change is under Ship Status. The drive, its heat and the hover preview that connects them are on three different edges of the screen.
4. Controls repeat. Six contacts show six rows of Lock on / Dismiss / Investigate (18 buttons, only one or two valid at a time) and the player must read the prose to learn which one is right.
5. Layout defects visible at 1920 and 1366: the Signature "why" line collides with the "Heat rate" label (`current/tactical_hot_1920.png`); the Target view at 1366 has its Fire controls below the panel edge (`current/target_1366.png` cuts off at the "Salvos:" line, so FIRE SALVO looks to need a scroll; verify in game); the Pause/speed/Manual/New row sits in a second header line of its own.
6. Widgets have no common size. Bars are 3 px, 8 px, 12 px, 18 px tall, labels are inline text, buttons have five different paddings. Nothing can be skinned by a background plate because nothing has a fixed rectangle.

What already works and must be kept: the Target view's round dials (they are the right idiom; I reuse them), the hover ghost on heat-changing buttons, channel colors (heat orange, reactor cyan, visual violet), dark phosphor palette, right-click navigation with shift-queued legs, voiced callouts.

---

## 2. Principles

1. One fact, one widget, one place. Every number appears once. If a second view needs it, it is the same widget in the same shell position, never a copy.
2. Cluster by question, not by data source. The question the player is asking decides the zone: "How hot am I and when does it bite?" (Heat), "What can they see of me?" (Signature), "What is that thing and what do I do with it?" (Contacts), "Where am I going?" (Scope and helm), "What can I shoot?" (Weapons), "Am I okay?" (Ship).
3. State is shown by a lit part, not a sentence. Lamp color, needle angle, bar length, segment count, a number in a window. A sentence is allowed in exactly two places: the NEXT beacon (one imperative, templated) and the quiet comms log.
4. Three fixed layers. Shell (rail, Heat, Signature, Ship) is identical in all three views. Work area (rack and scope, or map, or target plot) swaps. Overlays (menus, briefing, hit cutscene) stay as they are.
5. Glanceable means readable in 300 ms with eyes mostly on the scope. Anything read during play uses a numeral of at least 1.9u (16 px at 1366, 23 px at 1920) or a lit color change. Legends under widgets are engraved-label class (1.1u to 1.3u, 9 to 11 px at 1366) and the player is never required to read them in play.
6. Color means one thing. Cyan = information/ours, amber = needs attention or committed, red = danger/irreversible, green = ready/OK, orange = heat, violet = visual channel and Pell. Nothing else gets a color.
7. Anticipation over reaction. Heat shows rate, remaining time and a 5-minute trend with a projection line. Every key that changes heat previews its effect on hover (section 7).
8. Pausing blanks the glass, not the console. On pause the scope, slips, needles and tank go dark (as now); the rail and the PAUSE key stay lit so resuming is obvious. Art note: the glass is a layer separate from the bezel.
9. Everything is a slot. Each widget has a fixed rectangle on a 6u x 4u grid, so a background plate can be painted once per zone and widgets drop on top without code changes.

---

## 3. Inventory: every item, grouped into families

"Now" is where it is in `hunt_rt.html` today. "Widget" is what replaces it in v2. "Gone" means removed because it duplicates something.

### 3.1 Family table

| Family | Items today (and where) | v2 widget(s) and zone | Notes |
|---|---|---|---|
| Heat | Header "Heat sink: click to vent" cell (%, "full in m:ss"); Header "Heat rate" gauge and +x%/min; Ship Status "Heat sinks" bar plus sentence; three "x% of the sink per min" lines under Visibility; ping and spool heat shown only in prose; vent control (click header cell, key V) | HEAT zone: tank (M-tall), heat-rate dial (L), FULL IN clock (T), trend recorder (L), VENT key (K 12x8), threshold lamps 60/80/95/PEG/MELT/FINS, six HEAT SOURCES lamps | Largest block in the shell on purpose. Three duplicates deleted. Sources lamps replace the "why" sentences. |
| Quiet and cooldown | "Go quiet" button (header), key Q; cooldown only in tooltip | GO QUIET key (K 12x4) in HEAT, QUIET CD readout (T), QUIET lamp in rail | Cooldown becomes a visible readout. |
| Stealth and enemy fix | Header Signature bar + COLD/WARM/HOT + "largest:" sentence; Visibility panel (bar, zones, sentence); Enemy fix 3 pips + warn text (header); Timeline panel (Strategic) of the same history | SIGNATURE zone: SEEN BY ENEMY band gauge (M 24x8), ENEMY FIX plate (3 pips), COVER / ECLIPSE lamps, hunter attitude lamps | Timeline is cut (its data is the trend recorder plus these gauges). Hunter attitude lamps are new information (see 8.4). |
| Drive, speed, navigation | Stance seg (Hold still, Evasive), Speed seg (20 to 100, Redline), "Heading 090, 60%" text under the scope, maneuver ETA text, route legs on scope, right-click menu, "Edit flight plan" (Strategic), Clear plan (menu) | HELM strip beside the scope: compass (L), SPEED and LEG readouts (T), drive keys 2x3 (K), stance keys, CLEAR PLAN, EDIT PLAN, waypoint lamps, shift hint plate | Drive keys sit directly left of the Heat zone so a hover preview crosses one gutter. Redline is a guarded key. |
| Scope and map | Scope canvas + zoom +/-/Fit/Follow, zoom text; Strategic map canvas, its own +/-/Fit; briefing map | SCOPE (XL 52x52u with a shelf: ZOOM, RING readouts, FOLLOW, FIT keys, BACKLIT lamp) | Backlit zone is drawn on the scope so the Visual channel makes sense spatially. |
| Contacts and certainty | Rack of cards: number, chip (NOT READ YET, UNRESOLVED, DECISION NEEDED, SOLVING, CHASING, RULED OUT, CRIPPLED, LOCKED, FRIENDLY), three channel bars with word and "x% sure", prose paragraph, 3 buttons each, Target tab; Strategic ledger table (status, class, bearing, range, last read) | CONTACTS zone of slips: Full slip P 36x8u (id, state lamp and word, class glyph, ODDS, range, three channel meters) and Compact slip P 36x4u (id, lamp, glyph, three micro bars, range) | Ledger table cut (rack is persistent in Strategic). Prose cut. |
| Contact orders | Lock on, Dismiss, Investigate, Re-analyze, Target on each card; right-click Scan group (Active ping, Lock on, Investigate); Navigate group (Close, Separate, Evade, Circle) | ORDERS bank (6 keys, acts on the selected contact) plus the NEXT beacon; right-click menu kept for Navigate and as a mouse shortcut | One bank instead of N rows. The recommended key pulses. |
| Analysts and crew | Crew panel: three rows (name, role, "auto sweep / focused on contact 4"); channel bars on cards double as "point analyst here" | SENSORS zone: three analyst cells (M 12x8): name, channel, target plate, state lamp (SWEEP, FOCUS, HOLD, DONE, BLIND) | Sits directly above Contacts: analysts and the things they look at are neighbors. |
| Weapons and firing | Weapons panel (Salvo 1 to 3 bars, Coilgun bar, prose); header salvo squares; Target view: solution bar, Refresh, plot, 6 dials, 2 sliders, auto checkbox, warhead buttons, homing checkbox, hit chance, danger lamp, salvo status prose, FIRE, Coilgun, Back | WEAPONS zone (4 tube gauges, IN FLIGHT clock, TARGET key, LIVE/STALE/IN RNG/FRIEND lamps); Target view: SOLUTION strip, PLOT, AIM zone (6 dials, FOLLOW ABARA, HOMING, HE/EMP/FLARE keys, HIT CHANCE gauge, lamps, guarded FIRE SALVO, COILGUN) | Salvo status lives in one place and Target shows the same tube lamps. Sliders become dials you drag on the plot or wheel. |
| Hull and systems | Header Hull % and 3 squares; Ship Status Hull bar plus "Sensors OK. Drive OK / Weapons OK / Breach drive ready" sentence; Power draw (Sensors, Drive, Weapons, Compute gauges) | SHIP zone: HULL gauge (M), four system lamps (SENS, DRIVE, WEAPON, BREACH) | Power draw is cut (see section 9). |
| Pell and integration | "Pell assists" checkbox, integration meter and sentence, "Let Pell act without asking" checkbox | SHIP zone: PELL ASSIST and PELL ACTS keys (K 12x4), INTEGRATION gauge (M 12x8, ticks 25/50/75), PELL lamp in HEAT SOURCES | Violet is reserved for Pell and the Visual channel. |
| Breach and retreat | "Break contact" button (header), spool progress only in text; dog-leg spool; "Spool" in Visibility why | SHIP zone: BREACH key (guarded, K 12x8), BREACH SPOOL gauge (M 24x8, tick at 3 min), SPOOL ETA readout, JUMP RDY and DOGLEG lamps, SPOOL lamp in rail | Guard cover prevents accidental retreat. |
| Reports and comms | Header ticker (last 2 lines); Reports panel with Voice and Key-reports buttons; Strategic header shows the ticker too; hit popup (fx) | COMMS zone: 5-line quiet log (mono), VOICE key, KEY CALLS/ALL key; MASTER CAUTION lamp row in rail for events | Ticker deleted. Voiced callouts unchanged. |
| Time and session | Clock (header), Pause, 1/2x 1x 2x, Manual, New, view tabs | Rail: MISSION clock (T), PAUSE, three speed keys, MENU (Manual, New hunt), TACTICAL/STRATEGIC/TARGET keys | One row, one place. |
| Overlays | Briefing, Field manual, Pause box, hit cutscene, end screen, right-click menus | Unchanged | Restyle later with the same keys and plates. |

### 3.2 Duplicates, scatter and prose, itemized

Duplicates removed: heat sink (3 to 1), heat rate (3 to 1), stealth (3 to 1), hull (2 to 1), salvo state (3 to 1), report text (3 to 1), contact data (rack + ledger + scope labels to rack + scope), heading (text under scope + speed seg to compass + keys), Enemy fix (pips + timeline to pips).

Scattered, now adjacent: drive keys with heat; analysts with contacts; weapons readiness with the Target shortcut; hull with Pell and breach (the "state of the ship" zone); Quiet and Vent next to the tank they act on.

Prose replaced (table of sentence to part):

| Sentence today | Replacement |
|---|---|
| "Most likely a warship, 64% certain. Evidence: Heat strong 2% sure..." | ODDS number plus class glyph plus three channel meters |
| "No readings yet. The analysts will get to it..." | State lamp NOT READ + analyst cell shows who is free |
| "Heat faint, 4% sure" words in each bar | meter fill = significance, hairline = collection progress, check mark at read complete |
| "Visual: not backlit" | V meter hatched dark plus BACKLIT lamp on the scope shelf lit only when the contact is in the glow |
| "Stored 28%, filling 14.5% per min; about 5:01 until the fins open" | tank + rate dial + FULL IN clock + trend |
| "Enemy sensors see us at 28% (warm)" and "largest: Hull heat and drive" | SEEN BY ENEMY gauge + HEAT SOURCES lamps |
| "Sensors OK. Drive OK / Weapons OK / Breach drive ready" | four green lamps |
| "Integration 0% (rises while Pell assists...)" | INTEGRATION gauge; the sentence lives in the key's hover |
| "All salvos ready. Lock a ship, then press Engage" | tube gauges + TARGET key lit when a lock exists |
| "SOLUTION STALE: PRESS REFRESH" and the "Scan is 0:19 old" lines | STALE / SOLVING / READY lamps, SCAN AGE readout, REFRESH key |
| "Chance a missile gets close enough to do something" | HIT CHANCE gauge |
| Every `.help` line under controls | hover text (title attribute), shown after a 400 ms dwell |

---

## 4. Zone map

Stage: 160 x 90 u. 1u = 12 px at 1920x1080, 8.5375 px at 1366x768 (`--u: min(100vw/160, 100vh/90)`; letterbox the rest). Coordinates are stage u, top-left origin. Widgets inside a zone are placed in zone-relative u (zone title strip is the first 3u).

```
 0                    36                          112                         160
 +--------------------+----------------------------+---------------------------+ 0
 | RAIL: clock, pause, speed | master caution lamps | menu | view keys        | 8
 +--------------------+----------------------------+---------------------------+
 | SENSORS 36x12      | SCOPE & HELM 76x62         | HEAT 48x40                | 
 | (3 analysts)       |  NEXT beacon               |  tank | rate dial | FULL IN|
 +--------------------+  scope 52x52 | helm 24x52  |  | trend | VENT | QUIET  |
 | CONTACTS 36x56     |   shelf: zoom ring follow  |  sources lamps            | 48
 |  full slip 36x8    |                            +---------------------------+
 |  compact slip 36x4 |                            | SIGNATURE 48x17           |
 |  ...               |                            |  seen gauge | enemy fix   | 65
 |                    +--------------+-------------+  cover/eclipse/attitude   |
 |                    | WEAPONS 48x20| COMMS 28x20 +---------------------------+
 +--------------------+              |             | SHIP & AI 48x25           |
 | ORDERS 36x14       |              |             |  hull sys pell integ      |
 | (6 keys on sel.)   |              |             |  spool | BREACH | eta     |
 +--------------------+--------------+-------------+---------------------------+ 90
```

| Zone | x, y, w, h (u) | At 1920 (px) | At 1366 (px) | Always / contextual |
|---|---|---|---|---|
| RAIL | 0, 0, 160, 8 | 1920 x 96 | 1366 x 68 | always |
| SENSORS | 0, 8, 36, 12 | 432 x 144 | 307 x 102 | always (Tactical, Strategic); folds into the slip in Target |
| CONTACTS | 0, 20, 36, 56 | 432 x 672 | 307 x 478 | Tactical, Strategic; replaced by the one locked slip in Target |
| ORDERS | 0, 76, 36, 14 | 432 x 168 | 307 x 120 | Tactical, Strategic |
| SCOPE and HELM | 36, 8, 76, 62 | 912 x 744 | 649 x 529 | Tactical (map takes its place in Strategic, plot in Target) |
| WEAPONS | 36, 70, 48, 20 | 576 x 240 | 410 x 171 | Tactical; Target uses the same tube lamps in AIM |
| COMMS | 84, 70, 28, 20 | 336 x 240 | 239 x 171 | Tactical, Strategic |
| HEAT | 112, 8, 48, 40 | 576 x 480 | 410 x 341 | always, every view |
| SIGNATURE | 112, 48, 48, 17 | 576 x 204 | 410 x 145 | always |
| SHIP and AI | 112, 65, 48, 25 | 576 x 300 | 410 x 213 | always |
| Target: SOLUTION | 0, 8, 112, 10 | 1344 x 120 | 956 x 85 | Target |
| Target: PLOT | 0, 18, 64, 72 | 768 x 864 | 546 x 615 | Target |
| Target: AIM and FIRE | 64, 18, 48, 72 | 576 x 864 | 410 x 615 | Target |

Placement logic

- Scope in the middle, helm touching its right edge: the eye lands on contacts, the right hand goes to the drive keys and the Heat zone one gutter further right. Heat, the thing most likely to end the hunt, is the first thing at top right and is never covered.
- Contacts on the left with the analysts above and orders below: read left to right, "who is looking, what they found, what I do about it".
- Weapons under the scope because firing is a decision made while looking at the scope; the TARGET key is lit whenever a lock exists, and key T opens the Target view.
- Ship and AI at the bottom right: it is the "everything is fine" corner, mostly green, glanced at less often. The only red-capable item that needs thought there is BREACH, and it is guarded.
- Strategic: the same shell. Work area = arena map (XL, 76x62 plus the helm strip as route editor), rack kept on the left (replaces the ledger), a leg list (compact slips, one per waypoint: leg number, speed key color, ETA) where WEAPONS sits. Timeline is cut.
- Target: the same shell; the rack and scope are replaced by SOLUTION, PLOT and AIM. Heat, Signature and Ship stay visible, so a player lining up a shot still sees the sink and the Vent key. This is a change from today, where Target hides most of the ship.

---

## 5. Widget size system

Grid: columns of 6u, rows of 4u (half-steps only in the rail, where rows are 5u). One u = 12 px at 1920, 8.54 px at 1366. Widgets sit flush; each draws its own 0.3u inset margin, so adjacent plates read as separate parts.

| Class | Size (u) | 1920 (px) | 1366 (px) | Use | States |
|---|---|---|---|---|---|
| S lamp | 6 x 4 | 72 x 48 | 51 x 34 | Status lamp with an engraved legend: FINS, PEG, 60/80/95, SENS/DRIVE/WEAPON/BREACH, COVER, WPT n, LIVE, STALE | off, dim, on (green/amber/red/cyan/orange/violet), flash |
| K key | 12 x 4 | 144 x 48 | 102 x 34 | Push key or two-position switch: speed keys, stance, orders, tube-side keys, warheads (8x4 variants allowed for 3-up rows) | idle, lit (on), available (legend colored), recommended (pulsing amber ring), disabled, guarded (hatched cover), hover |
| K tall | 12 x 8 | 144 x 96 | 102 x 68 | The two big switches: VENT, BREACH, COILGUN | same as K |
| T readout | 12 x 4 | 144 x 48 | 102 x 34 | LCD window with a ghost "88:88" behind the digits: FULL IN, SPOOL ETA, SPEED, LEG, IN FLIGHT, SCAN AGE, AIM PT | normal, warning (amber), danger (red), preview (cyan) |
| M gauge | 12 x 8 | 144 x 96 | 102 x 68 | Segmented bar with legend and value: HULL, INTEGRATION, SALVO n, COILGUN | fill, zones, ticks, ghost |
| M wide | 24 x 8 | 288 x 96 | 205 x 68 | SEEN BY ENEMY band, BREACH SPOOL, HIT CHANCE | same |
| M tall | 12 x 32 | 144 x 384 | 102 x 273 | HEAT SINK tank (the only one) | fill, thresholds, ghost level |
| L dial | 24 x 16 | 288 x 192 | 205 x 137 | Round needle instrument: HEAT RATE, compass, and the six Target dials | needle, ghost needle, zone arcs |
| L recorder | 24 x 16 | 288 x 192 | 205 x 137 | SINK TREND strip chart (same footprint as a dial so the two can swap in the art) | trace, projection, ghost projection |
| P slab | 36 x 8 and 36 x 4 | 432 x 96 / 432 x 48 | 307 x 68 / 307 x 34 | Contact slips (internals: id 4x4, state 14x4, glyph 4x4, odds 6x4, range 8x4, 3 channel meters 12x4) | normal, selected (amber ring), locked (red ring), ally (green), ruled-out (dimmed) |
| XL scope | 52 x 52 (50 x 50 glass) | 624 x 624 | 444 x 444 | Scope; Target plot is 64 x 64 | glass layer, live/projected brackets |
| Plate | any (6 x 4 multiples) | | | Engraved legend plate, no function (shift hint, master caution label) | static |
| Log | 28 x 13 | 336 x 156 | 239 x 111 | Quiet text log, 5 lines | static |

Counts in the mocks: Tactical has 163 widget slots; the library is 14 canonical sizes plus 7 slip internals and 6 rail variants (the rail is the only strip with 5u rows; I would normalize it to 4u rows plus 4u margin in production, see 11.2). Target has 108 slots.

Type: labels use a condensed face (mocks fall back to Arial Narrow/DejaVu Condensed; the shipped game's Oxanium works). Numerals use the mono face. Sizes in u: engraved legend 1.1 to 1.2; key title 1.15 to 1.45; readout digits 2.3; gauge value 1.6 to 1.9; rail clock 2.3.

Art pipeline fit (`docs/art_pipeline.md`)

- Each zone is one background plate (9-slice friendly: 0.5u corner radius, rivet insets are 0.55u from the corner). Paint 12 plates at 1920 and let the 1366 build downscale (0.7116x).
- Each widget slot gets a manifest entry: `name`, `size` in u, `states`. Skins swap the SVG/CSS of the widget; the slot rectangle never changes.
- Needles, lamps and fills are separate layers (glass, fill, needle, bezel), so a painted dial face can sit under a live needle.

---

## 6. The contact slip: "what do I do with this?"

Full slip (selected, decision needed, locked, solving) is 36x8u; compact (everything else) is 36x4u. Auto-expand rule: expanded if selected, DECISION, SOLVING, LOCKED or being investigated. Friendly, ruled-out and not-read-yet contacts stay compact. Capacity in 56u: 4 full + 5 compact with room to spare; beyond that the rack scrolls only the compact tail.

State lamp and what the key bank recommends (the recommended key pulses amber):

| State (lamp) | Meaning | Recommended | Also valid |
|---|---|---|---|
| NOT READ (dim) | No analyst has looked | INVESTIGATE | PING |
| UNRESOLVED (cyan) | Reads thin or mixed | INVESTIGATE (or wait) | PING, DISMISS |
| DECISION (amber, flashing) | Sensors agree enough to call it | LOCK ON if warship, DISMISS if decoy or static (the glyph and ODDS say which) | PING |
| SOLVING n% (red ring) | Locked, firing solution cooking | TARGET when ready | PING (refreshes fix) |
| LOCKED (red) | Solution ready | TARGET | RELEASE analysts |
| VENT (orange, flashing) | Venting, thermal blaze, easy read | INVESTIGATE now (cheap and fast) | |
| RULED OUT (grey) | Dismissed | RE-ANALYZE (only key enabled) | |
| FRIENDLY (green) | Ally | none; all keys disabled | |
| CRIPPLED (violet) | Derelict | none for now (salvage later) | |

Channel meter (12x4u): letter plate (H orange, R cyan, V violet), bar fill = how strongly the channel resolves the class (the old "x% sure" word), thin white hairline under the fill = collection progress, green hairline and a check mark = read complete (the old `P.readDone`), dashed cyan outline = an analyst is on this channel right now, hatched dark = channel blind (Visual when not backlit, or no screen behind it). The number is shown only while incomplete.

Selecting: click a slip, click a contact on the scope, or Tab/Shift-Tab. Selected slip gets the amber ring and the ORDERS bank retitles ("ORDERS FOR C3"). The NEXT beacon above the scope auto-names the contact most needing a decision and reads like "C3: 3 SENSORS AGREE, LOCK ON or DISMISS". Clicking the beacon selects that contact. The beacon is the only template sentence on the screen; its vocabulary is fixed (about 8 templates), so it can be voiced or localized later.

Trade-off, recommended option marked: (A) per-slip buttons (today), (B) one ORDERS bank on the selected contact. B costs one extra click (select, then order) but removes 12 to 18 redundant buttons, lets the bank show which orders are legal at all, and keeps hit targets large (12x4u = 102x34 px at 1366). I recommend B, with the beacon pre-selecting the contact that needs a decision so the common case is still one click. Keyboard additions: Tab cycles selection; I = investigate, G = active ping, L = lock on, D = dismiss, R = re-analyze (the keydown handler I read uses 1 2 3 P Q V [ ] Esc Space, so these do not collide, but verify against the full handler).

---

## 7. Hover behavior (one rule: hover previews, click commits)

The shipped game already ghost-previews heat on hover (`data-heat`, `heatRate(s, mod)`). v2 extends the same hook to all new widgets and shows the preview where the player is looking: on the Heat widgets, with a small cyan tooltip near the cursor. Mock 1920 shows it with 100% drive hovered.

| Widget | Hover shows | Click does |
|---|---|---|
| Drive key (20% to Redline) | Heat zone: ghost needle on the rate dial, cyan dashed tank level at +1 min, dashed trend projection, FULL IN turns cyan with the new time; SEEN BY ENEMY shows a ghost marker; tooltip "rate +15 to +42, full in 05:01 to 01:44, seen 28 to 55" | Sets speed (or, with a route, speed of the next leg) |
| Right-click menu items (Go here at speed) | Same as the matching drive key; leg preview drawn on the scope in the speed color | Replace plan; Shift adds a waypoint |
| GO QUIET | Rate dial ghost needle near zero, FULL IN freezes; tooltip with "dark about 40 s, cooldown 2:30" | Go quiet |
| VENT | Dial ghost swings into the drain zone, FULL IN becomes "EMPTY IN", SEEN BY ENEMY ghost jumps to 100% | Extend fins (toggle) |
| BREACH (guard up) | SPOOL gauge ghost fills; tooltip "visibility about 0.9, speed 30% while spooling, 3 min (mission) or 11 min (dog-leg)" | Press once to spool, again to cancel |
| ACTIVE PING | Tank ghost jumps about 17%; HEAT SOURCES PING lamp lights cyan; scope shows the ping ring | Ping selected contact |
| INVESTIGATE | Analyst cells light the three target plates "C3" in ghost; SENSE lamp brightens in sources | All analysts on the contact |
| Slip (any) | The contact pulses on the scope (and the reverse, hovering a scope contact highlights its slip) | Select |
| Channel meter | Tooltip with the analyst's name and "click to point Dace here" | Point that analyst here |
| Analyst cell | Dashed line on the scope from ship to their current contact | Click, then click a contact, to retarget; second click releases |
| Hull, tube, lamp or dial | Tooltip with the exact value and one sentence on what it means (this is where the old `.help` text goes), after 400 ms | None |
| Scope contact | Slip pulses; a thin range/bearing readout follows the cursor | Select; right-click opens the menu |

Preview must be cheap and cancel instantly on mouse-out. The previews never alter the sim; they call `heatRate` on a copy as today.

---

## 8. Always visible vs contextual

### 8.1 Always visible (every view)

Rail (clock, pause, speed, master caution lamps, view keys), the entire HEAT zone, SIGNATURE, SHIP and AI. That is 36% of the screen area, every instrument that can kill the player or that they must anticipate, and nothing that depends on the selected contact.

### 8.2 Tactical and Strategic

Analysts, Contacts, Orders, Comms, plus the scope or the map.

### 8.3 Contextual (appears only when it means something)

| Widget | Appears when | Otherwise |
|---|---|---|
| NEXT beacon | A contact is DECISION, a solution is READY, or a heat or vent event needs action | Shows the highest-priority standing action or "NO ACTION: SWEEPING" in dim |
| TARGET key (Weapons) | A locked contact exists | dim |
| IN FLIGHT clock | A volley is in the air | "--:--" |
| BACKLIT lamp | Scope has a backlit zone (star in arena) | dim |
| Master caution lamps | Event active: INCOMING (red, flash), FINS OUT (orange), QUIET (cyan), SPOOL (amber), SOLUTION (amber while solving, green when ready), MASTER (red, any red condition unacknowledged) | off |
| Pell ACTS | Pell assist is on | disabled |
| DOGLEG lamp | Arena is a dog-leg stop | off |
| Waypoint lamps | Plan has waypoints (colored by leg speed) | dim |
| Warning stripes on tank | Sink above 60/80/95 | lamps 60, 80, 95 light in turn; PEG at 100; MELT when hull is being damaged |

### 8.4 New information this layout wants (needs a game-design yes or no)

- HUNTER ATTITUDE (CALM, ALERT, SILENT): the arrival rule (relaxed x1.25, alerted and silent x0.7) is currently hidden. Showing it changes what the player knows. Recommendation: show it, because the briefing and "how do we arrive" choice already tell the player roughly this, and a lamp makes the choice legible. Easy to hide if Dave wants it secret.
- COVER and ECLIPSE lamps: "we are behind a planet" and "we are crossing a star's glow". The engine knows both; today the player infers them from the scope. Recommend showing.
- HEAT SOURCES lamps: the engine already prints the contributors as sentences; this is the same data as six brightness levels (off, dim, bright). No new rule.
- SINK TREND: the UI needs a ring buffer of 5 minutes of sink samples (about 20 samples). No engine change.

---

## 9. What moves out of prose, and what is cut

Moves to lamps, dials, gauges: everything in the table in 3.2.

Cut outright

| Item | Why |
|---|---|
| Power draw (Sensors/Drive/Weapons/Compute gauges) | Derived and decorative; its real content (sensors and drive adding heat) is in HEAT SOURCES |
| Header ticker (last two reports) | Duplicate of the log; a flicker source at the top of the screen |
| Header hull % and salvo squares | Duplicates of HULL and tube gauges (both are always visible in v2) |
| Visibility panel and header Signature cell | Replaced by SEEN BY ENEMY |
| Heat sinks panel and its sentence | Replaced by HEAT |
| Contact ledger table and Timeline (Strategic) | Rack and trend/gauges cover them |
| All `.help` lines under controls | Hover tooltips |
| Two checkboxes (Pell, Pell acts) | Become keys |
| Two sliders (aim lead, cone) | Become the dials, driven by drag/wheel on the plot (as the plot already supports); keys for fine steps are optional |
| Pause/Manual/New row | Pause and speed move into the rail; Manual and New go under MENU |

Kept but demoted: Manual (menu), voice cycling (VOICE key), Key/All reports (KEY CALLS key).

Officer callouts: voiced for these events only (recommendation, already close to current): contact calls (DECISION reached, contact vents), incoming fire, hull hit, solution ready, heat 80 and 95. Everything else is log-only. The log is 5 lines and never scrolls the screen; MASTER CAUTION lamps are the silent fallback when voice is off.

---

## 10. Where the scope, map and plot sit, and how they read

- Scope: 52x52u plate with a 50x50u glass (600 px at 1920, 427 px at 1366; the shipped scope is about 540 and 385 px). Beacon on top, shelf (zoom, ring, follow, fit) below. Everything on the glass uses the existing language (dot to arrowhead, LIVE bracket vs dashed PROJECTED, fan, route colored by drive). New on glass: backlit zone (faint amber disc with dashed edge) so the Visual channel has a place; analyst focus lines (thin dashed cyan) from ship to the contact an analyst is on.
- Strategic map: same plate position and size; the helm strip turns into the route editor; the plan list is a column of compact slips.
- Target plot: 64x64u (768 px at 1920, 546 at 1366) on the left; six dials in a 2x3 grid at the right, same L size as the heat dial and compass. Dial order: Bearing, Range, Bow angle, Target speed (what the target is doing, cyan), then Aim lead and Cone width (what you choose, amber). Needle color = who owns the number.
- Fire: FIRE SALVO is a guarded 36x8u key, red hatched, enabled only when the solution is READY (and then a pulsing amber). COILGUN is a 12x8u key enabled inside 18 km. No Fire control is ever below the fold: the mock at 1366 shows all of AIM and FIRE at once.

---

## 11. Trade-offs and decisions

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Fluid layout or fixed stage | Fluid CSS grid (today) vs fixed 160x90u stage scaled by `--u` | Fixed stage. Art plates need fixed rectangles. Cost: black bars on non-16:9 windows (a 16:10 screen loses about 6% height). Accept. |
| 2 | Per-contact buttons or one bank | See section 6 | One bank plus the beacon |
| 3 | Heat prominence | Header strip (today), center, or top-right block | Top-right block, 40u tall, same size in every view. It is the one resource that can silently kill the run, and anticipation needs a trend and a clock, not a thin bar. |
| 4 | Rail row height | 5u variants (mock) vs 4u rows (canonical grid) | Use 4u rows with 4u margin in production. I used 5u in the mock to give the speed and view keys more presence; it adds six one-off sizes. |
| 5 | Dials or bars for heat rate | Bar (today, tiny) vs log-scale dial | Dial (log scale, 0 at the top, VENT drain on the left, REDLINE on the right). Rates span 4 to 240 percent per minute, a linear scale hides the bottom half of the range. Needle plus a "+15" number. |
| 6 | Where analysts live | Beside the crew/Pell block (today) vs with contacts | With contacts. They are only meaningful relative to a contact. Pell moves to Ship and AI. |
| 7 | Scope size vs controls | Bigger scope (more of the page) vs helm strip beside it | Helm strip. Drive and stance keys have to be near the scope (right-click covers fast moves, keys cover the quick re-speeds the player makes constantly) and near Heat. The scope still grows about 11% over today. |
| 8 | Text legends under widgets | Large (readable in play) vs small (engraved) | Small. They name the part; the state is carried by color, position and number. Legends at 1366 are 9 to 11 px; if playtests find them unreadable, bump S and K legends to 1.3u without changing slot sizes. |
| 9 | One hover system or two | Native `title` tooltips vs custom cards | Custom cards for Heat-affecting items (they have numbers and ghosts); native `title` for everything else (cheap). |
| 10 | Pause blanking | Hide everything (today) vs blank the glass only | Glass only, keep the rail alive. The game already blanks to stop reading-while-paused; this keeps the rule and removes the visual jolt. |

---

## 12. Migration order (small steps, each shippable and testable)

Files: all changes are in `web/hunt_rt_template.html` (and `build_hunt_rt.sh` output), never hand-edit `hunt_rt.html`. The engine (`hunt_rt_engine.js`) needs no change except where marked.

0. Stage and unit. Wrap `#app` in a `.stage` (160x90u) with `--u` set from the window size; convert the current layout to run inside it without changing look. Verify at 1366x768, 1920x1080, 1440x900. Risk: low.
1. Widget CSS library. Add classes `.w .lamp .key .ro .gauge .dial` and their states (copy from `build_mocks.py` CSS), no usage yet. Add one manifest entry per class in `assets/manifest.json`. Risk: none.
2. HEAT zone first, because it is the spine. Build tank, rate dial, FULL IN, trend (new 5-minute buffer), VENT and GO QUIET keys, threshold lamps. Reuse `heatRate` and the existing `data-heat` hover hook; drive the same values the header cells use. Delete the header Heat cells, the "Heat sinks" panel and the three per-minute lines. Keep keys V and Q.
3. HELM strip. Re-skin stance and speed segs as K keys (keep `data-heat`), add compass and SPEED/LEG readouts, guard Redline, CLEAR PLAN and EDIT PLAN keys. Delete the "Heading..." text line.
4. SIGNATURE zone. SEEN BY ENEMY band gauge from `ourVis`, ENEMY FIX pips, COVER/ECLIPSE lamps, hunter attitude lamps (see 8.4; needs the arrival attitude exposed read-only from the engine; I did not find an existing field for it). Delete the header Signature cell and the Visibility panel.
5. Contact slips. Build P slabs from the card data (the same fields; no engine change). Compact/full rule, selection, channel meters (significance, progress, done check, hold outline, blind hatch). Keep the old cards behind a flag for one build, compare, then delete them with the prose.
6. ORDERS bank and NEXT beacon. Bind to the selected contact; legality from the same rules that enable the card buttons today; recommended key from the state table in section 6. Add I, G, L, D, R and Tab. Keep the right-click menu.
7. Analyst cells above the rack. Pure display of `S.analysts` (task, state, hold). Remove the Crew panel rows.
8. SHIP and AI. Hull gauge, four system lamps, Pell keys and integration gauge, BREACH guarded key with spool gauge and ETA. Delete Power draw, Hull and systems sentence, header Hull and salvo squares, Break contact button.
9. WEAPONS and COMMS. Four tube gauges and IN FLIGHT clock, TARGET key; the log (5 lines, same feed) with VOICE and KEY CALLS keys; master caution lamps in the rail from existing event flags. Delete the ticker and the Reports panel.
10. Target view. New SOLUTION strip (reuse the contact slip), keep the plot, convert six dials to the shared L dial, sliders become drag/wheel on the plot plus dials, warhead keys, homing key, HIT CHANCE gauge, guarded FIRE SALVO. Keep the shell. This also fixes the 1366 fire-button problem.
11. Strategic view. Map in the scope slot, rack replaces ledger, leg list replaces Timeline. Delete the Timeline canvas.
12. Art hookup. Export the zone and widget rectangles from the stage to `manifest.json` (the mocks' `data-size` and zone `data-z` attributes are the source), commission or generate 12 plates, replace backgrounds one zone at a time. Order of value: HEAT plate, SCOPE bezel, CONTACTS rack, then the rest.

Test after each step: the game's bot/playtest harness is unaffected (UI only); manual checks are keyboard (1 2 3 P Q V [ ] Esc Space), right-click nav with Shift, hover ghost on every heat-changing key, pause blank, and 1366x768 screenshot diffs against `mock_1366.png`.

---

## 13. Open questions for Dave

1. Hunter attitude lamps: reveal or keep hidden (8.4)?
2. Keep the Strategic view as a separate screen, or fold the map into the scope with a zoom-out key? (v2 keeps it separate because the plan editor needs the full 240 km at once.)
3. Redline: guarded key (as drawn) or two-step (arm, then press)? The guard is cosmetic until art exists.
4. Analyst retargeting: click analyst then contact (drawn) or drag the analyst cell onto a slip?
5. Does the beacon get a voice line (the XO reading it), or stay silent?
