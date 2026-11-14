# Hunt rework: the cat-and-mouse made legible (design, 2026-11-14)

Dave's brief (2026-11-14), after a Gemini overview of space-sensor physics:
1. Get specific about the cat-and-mouse. **There is no stealth in space, only delay.** A ship that is not transmitting a transponder code is detectable, but can run silent to delay detection. Make that clear in play.
2. Rework the interface: the main map becomes a more interactive, informative **sphere** (EVE Online's overview, Battlestar Galactica's DRADIS).
3. A clear **colour grammar**: reds and yellows are affirmatively detected objects; blues and greens are passively detected or suspected objects and readings.
4. Keep paths of travel on the map, and make the **heat cost** of changing direction and of high engine settings much clearer. The choice should be *sneak and stay steady*, or *actively manoeuvre and be detected*. A course change should feel like a big deal in stealth.
5. Optimise the **pacing** of all this information.

Nothing here is built. Items marked DECIDE need Dave. Existing rules are in `docs/detection_model.md` ("Current engine rules" is authoritative).

## 1. The physics, as game rules

The Gemini overview gives three detection families and one law. Here is each, what the engine already does, and the gap.

**The law: detection is a clock, not a yes/no.** Every action moves a signature; every signature accumulates information in someone's sensors; running silent only *slows* the accumulation. The engine already works this way (`know` grows at 0.4 x vis^2 x sensor x range falloff per minute; thirds of `know` are *aware / closing / firm*). What is missing is **showing the clock** (section 2.5).

| Family (Gemini) | In the physics | In the engine today | The gap |
|---|---|---|---|
| **Thermal** | Waste heat is stored in a sink; when it fills you must radiate it, and the flare is seen from far away. Directional radiators help unless something is behind you. A perfectly cold hull is still a patch missing the background's thermal noise. | Sink, vent (100% visible), hold still, spool, heat rate dial, "full in" clock, hostile-on-vent rule. | Venting has no direction. The cold-patch silhouette is covered by the eclipse/profile channel but not named. |
| **Ion trail / plasma wake ("chemical")** | An active drive is loud in X-ray and UV. After shutdown the exhaust keeps expanding as an ion trail; a probe crossing it can read the composition and the magnetic field and recover the ship's vector and speed. | Drive heat while moving (continuous, by speed setting). **No lingering wake. No cost to changing course.** | **New channel.** Burns create a wake that stays in space after you have gone and tells a searcher where you were, how fast, and which way. |
| **Optical** | Albedo is faint but real near a star. Lidar is an active ping that gives the searcher away. **Occlusion (the transit method)** blinks a star and gives size, speed and track. | Eclipse channel (Quill), pings, planets blocking sight. | Albedo is not modelled (fine). Lidar is the existing ping. |
| **Identity (Dave)** | Ships that transmit a transponder code are identified at once; ships that do not are only detected. | Identity from behaviour only (fires or vents = hostile). **No transponder concept.** | **New identity layer** (2.3). |

## 2. Mechanics changes (each independently shippable)

### 2.1 Manoeuvring costs something: the Burn (the big one)
Today speed is a continuous setting (five rungs plus Redline) and heat comes from the setting; turning is free. The brief asks for the opposite emphasis: **steady is cheap, changing is loud.**
- **Steady course = quiet.** Holding a heading and rung costs only what the drive costs at that rung, as now. Hold still is the quietest.
- **Every change is a Burn event:** a course change, a rung change, or starting from rest. Each burn has a size proportional to the change in velocity (heading change x speed, or speed step). A burn adds (a) a **heat spike** to the sink and (b) a **visibility flare** that decays over a few game minutes, like the existing `ventAfterglow` (`ourVis` already has the hook).
- **Big burns are big deals:** a hard turn at cruise is a flare that an alert hunter can read from far away; a creep-speed nudge is almost nothing. Redline is a burn that never ends.
- **Tuning:** one scale constant (`P.burnK`) and one decay (`P.burnTau`), so the balance bots can tune it. A free "settle" window after a burn lets a quick correction cost less than two separate big ones.
- **Why this works for the story:** the captain's best tool becomes patience; the expensive decisions (course changes) happen on the captain's order, which is where the command model lives.
- **Risk:** this changes the balance tables (hunts today are won by pinging and firing, with plenty of free manoeuvre). Re-run the 240-hunt bots and re-tune enemy `cunning`. Hunts will be slower and tenser.

### 2.2 The Wake: a lingering signature
- A burn leaves a **wake knot** at the place and moment it happened: position, vector, age, size. Knots spread and fade (the plume cloud), with a lifetime of several game minutes.
- **A searcher detects a wake only by passing through it or sensing it with a probe-like sensor**, and then learns where we *were*, our approximate vector and speed, and how old it is. It does not give a current position; it gives a lead, which is how real trail-following works.
- Enemy search behaviour (the existing `search` ramp) uses knots they cross as hints; this gives them a way to find a quiet ship that burned once, without cheating.
- On our scope **our own wake is visible**, so the player can see what they left behind and where a hunter who follows it would end up. Contacts' wakes appear when our sensors cross them.
- DECIDE (2.7): whether we need this phase or whether Burn flares alone are enough.

### 2.3 Transponders and running dark
- **Lawful traffic broadcasts a transponder code** (freighters, stations, patrol ships, civil traffic). A contact with a code is *identified on sight*: it is shown with its name and class and cannot be mistaken for a target. Gleaners and anyone with something to hide fly **dark** (transponder off). In a hunt, the hunted ship is dark by definition; so is the hunter.
- **Detect-then-identify becomes the puzzle:** every dark contact is a candidate, and the existing "rule out" work (heat, reactor, eclipse) is how you tell Corvane from a rock, a lure, a gleaner or a ghost. A coded contact costs nothing to rule out, which also makes the tutorial's contact reading less abstract.
- **Our transponder:** the player is dark by default (we are gleaners). DECIDE whether the captain may broadcast (to be recognised by an ally or the CSRA, and to give up the hide) as a deliberate, costly act.
- **Running silent** for either side means: transponder off, no pings, no comms, hold still, minimal burns, sink as cold as possible. This is the clear name for the thing the engine already half-models ("Go quiet", hold still, spool).

### 2.4 Their picture of you
- The engine already tracks each enemy's belief (`know`, and the position error derived from it) and steers it toward where it thinks we are. **Show it.** On our scope, an enemy that has detected us gets a faint **"where they think we are"** shape: a fuzzy region whose size is their uncertainty and whose brightness is their `know`. It tightens as `know` rises and drifts as we move.
- This is the single biggest clarity gain for cat-and-mouse: the player sees *the other side's map*. It lets you play against a belief (feint, burn away from the shape, leave a false wake) and not against a hidden number.
- Enemies use the same rules, so the AI profile needs nothing new, only exposure.

### 2.5 The detection clock
- Replace the single "Seen by enemy 24%" gauge with a **clock**: *"time to detection at this rate: 6:40"* and *"sink full in 7:01"*, both responding live to the order the captain is hovering (the heat hover tooltip already shows a rate). Hunters have an equivalent clock for us shown as their `know` level.
- Two clocks, same style as the heat clock already in the header: **how long can I stay cold**, **how long until they have a fix**.

### 2.6 Directional venting (later)
- A vent has a facing; venting with the fins aimed away from a hunter reduces how bright it looks to them, unless a body or dust behind us reflects it. Adds a use for planets and for ship heading. Parked until the first five land.

### 2.7 DECIDE
1. Do we want the Wake (2.2) as its own phase, or is the Burn flare enough for now? Recommend Burn first, Wake after playtest.
2. Is the Burn model (steady is cheap, change is loud) the intended direction, as opposed to a full Newtonian model where coasting is free and thrust is the only cost? The latter is more faithful and a much larger rewrite (it changes the whole speed ladder). Recommend the Burn model.
3. Transponder: does the captain ever broadcast one?

## 3. The interface

### 3.1 The scope (a sphere)
Today's main map is a flat, pannable top-down square (240 km) with five-ring zoom. The target is a **ship-centred spherical scope**: an interactive display you rotate, zoom and read, like EVE's 3D overview or the DRADIS disc, with an overview list beside it.
- **Options.**
  - **A. Polar scope (recommended first step).** The simulation stays planar. The display is ship-centred, with range rings and a bearing ring, a tilt control that gives it a sphere's look (the plane is the equator), contacts as glyphs with elevation stalks that are flat for now. Cheap, and the feel of a sphere.
  - **B. True 3D.** Add elevation to the sim. Planets and the star become real occluders in 3D, tracks get a third dimension, and balance changes everywhere. A large rewrite; the payoff is real depth and the DRADIS look.
  - **C. Keep the flat map**, change only colours, paths and layers. Smallest change; does not deliver the "sphere".
- Recommend A now, with the data model written so B can be turned on later (positions carry a z of 0).
- **Interactions** (EVE/DRADIS): drag to rotate the tilt, wheel to zoom, click a glyph to select (as slips do now), double-click to centre, bearing ring and range rings with labels, a **layer bar** (Passive, Active, Wakes, Their picture, Paths, Bodies) so the player turns layers on and off.
- **Overview list** (EVE): the contact slips become a sortable table (name, state, distance, certainty, last-seen age, glyph) kept in step with the scope. Selecting one selects the other. This is the existing slips, re-presented.

### 3.2 The colour grammar
Rule (Dave): **warm = affirmatively detected; cool = passively detected or suspected.** Allegiance and kind are carried by **shape**, never by colour, so the colour channel stays free for detection state.

| State | Colour | Meaning | Example |
|---|---|---|---|
| Suspected (faint, below the threshold) | Deep blue, dotted outline, fades with age | A trace on one channel, not yet a track | A faint heat smudge |
| Passively detected (a real track) | Cyan to green as the track firms | Two or more channels agree; position uncertain; we are not revealing ourselves | A cold, drifting contact with a firming read |
| Affirmed (confirmed by an active act or an unambiguous event) | Yellow to amber | An active ping fix, a transponder reply, a confirmed vent flare | A pinged contact; a contact that vented |
| Hostile or committed (threat) | Red | Hostile-confirmed, has fired on us, or has a firm lock on us | A ship that launched |
| Us | White with a heading tick | Never any of the above | |
| Their picture of us | Warm ghost (amber, dashed) | What the enemy believes (2.4) | |
| Wakes (ours or theirs) | Cool wake colour fading to transparent | Old to new | |

- **Age and certainty fade a mark**, not change its colour: opacity falls with the age of the last observation and the uncertainty ring grows. A stale red mark is a faded red mark.
- **Accessibility:** do not rely on hue alone. Every state also changes **fill** (hollow, dotted, solid, solid with halo) and **line style**. Test with a colour-blind simulator; avoid green-vs-red as the only difference (the cool ramp is blue to cyan to green, the warm ramp yellow to red, and the break between them is a change of fill and saturation, not only hue).
- **Shape language** (existing symbols plus new): ship classes and bodies keep their glyphs; unknown is a diamond; coded transponder is a ring with a tag.
- The existing console palette (teal chrome, amber headings, red alerts) already follows part of this; the scope will be reconciled with it, not restyled from scratch.

### 3.3 Paths and the price of a turn
- **Our route** stays on the map, as now. The leg colour changes from *drive setting* to **heat cost** (cool-to-warm by the predicted sink rise per minute on that leg), so a glance at a plan tells you how loud it is. The five-rung legend stays in the tooltip.
- **Burn markers.** Each waypoint and each course change shows a small marker with its cost: *+x% sink, visible for y minutes*. The marker is cool for a small burn and warm for a large one.
- **Preview before commit.** Hover or drag a waypoint and a **ghost path** shows the cost and the wake it would leave; releasing commits. In stealth the cost can sit behind a one-click confirmation ("This burn is loud").
- **Stealth mode, explicit.** A mode toggle (or stance, extending Hold still and Evasive) that **names the choice**: *Silent* (steady, hold, cheap) or *Active* (manoeuvre, loud). While Silent, a course change asks for confirmation and shows what it will cost. The crew voices it (Riggs: "That turn's a flare, captain.").
- **Enemy paths** are the existing projected tracks, shown dashed and aged, coloured by detection state (3.2). Enemy burns that we detect appear as flares on their tracks.

### 3.4 Layout
- **Scope** is the main stage and keeps the central position; the **overview list** replaces the slips column or sits beside the scope.
- **Heat, signature and ship panels** keep their places (they are already the right size after the tutorial layout work). The **detection clock** joins the heat cluster.
- The crew panel, comms log and tutorial box keep their places (the tutorial band is unchanged).
- Ship the new scope **behind a flag** (`?ui=v3`) next to the current console until it has been playtested, so nothing regresses.

### 3.5 Pacing the information
The risk with this much new information is an overloaded screen. Rules:
1. **Quiet by default, loud on change.** The scope is calm when nothing changes; only *changes* in state raise attention (a track firms, a vent, a burn seen, a belief tightens).
2. **One headline at a time.** At most one big callout on screen; others queue. Each has a priority (threat > own signature > new contact > read complete > log). Low-priority items go to the log only.
3. **Attention budget.** A cap on simultaneous highlighted marks (about three) and on callouts per game minute; the rest are quiet marks on the scope.
4. **Layered disclosure.** The scope starts with only *Passive* and *Paths*; *Active*, *Wakes* and *Their picture* appear as the captain meets each idea (tutorial steps unlock them, and a new captain can toggle them). Experts can turn everything on from the start.
5. **Auto-ease on new information.** On a threat-level change the engine can drop to a slower clock for a few seconds (optional, a setting) so the player can read it; the tutorial's explicit pause stays tutorial-only (Dave, 2026-11-03).
6. **Crew voice carries the meaning.** Numbers live on the scope; the crew say what they *mean* in a line. Callouts never stack more than two sentences.
7. **Level of detail by zoom.** Far out: glyph and colour only. Closer: name, range, certainty. Selected: the full slip.

## 4. What changes elsewhere
- **Tutorial (17 steps)** is built on the current console. The new scope needs a revised sequence that introduces layers one at a time (the pacing rule above). Plan it after Phase 1, not before.
- **Balance:** the Burn changes win rates. Re-run `tools/balance_bot.js` and the hunt bots after Phase 1; re-tune `P.burnK` and enemy `cunning`.
- **Ship tech choices** (`docs/ship_tech_choices.md`) tie in directly: the passive-vs-pumped sink and the drive knee are now *burn-cost* choices, and cold paint is an optical-albedo consumable. Build them on top of the Burn, not before it.
- **Narrative:** Quill's signal (the Choir) and the hunt's lingering wake are a natural pair.

## 5. Phasing
0. **Mock-up** (no engine): a static scope page with fake contacts in every colour state, to settle the look and the colour grammar before anything else. Cheap, reviewable.
1. **Colours, paths and the Burn** in the existing console: the colour grammar on the current map, heat-cost leg colouring, burn markers, the Burn rule in the engine, balance re-tune.
2. **Their picture** and the **detection clock** (both are exposure of existing data).
3. **The scope** (option A): polar display, layers, overview list, behind `?ui=v3`.
4. **The Wake** channel and enemy search on it.
5. **Transponders** and the identity layer.
6. Optional: true 3D, directional venting.
Tests at every step: the bots (`tests/tutorial_bots.py`, `tests/hunt_pages.py`, `tools/balance_bot.js`), plus a layout check at the viewports already tested.

## 6. DECIDE (Dave)
1. **Scope:** polar scope first (A), true 3D (B), or flat map with new colours (C)? Recommend A.
2. **Manoeuvre model:** the Burn (steady cheap, change loud) or full Newtonian? Recommend the Burn.
3. **Order:** mock-up first (Phase 0), or straight into the colours and Burn in the live console?
4. **Wake:** a separate later phase, or part of the first pass?
5. **Transponder:** can the captain ever broadcast?
