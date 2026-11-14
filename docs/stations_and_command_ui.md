# Stations, command flow and the zoomable ship (design, 2026-11-14)

Dave's brief (2026-11-14), with two PDFs ("Space Combat Command: Communications and Information Flow" and "System Workflows and UI Architecture"):
- Instead of one screen, **a few screens with integrated information**: damage control, sonar, tactical, navigation, and so on, with hotkeys to swap between them.
- **Preserve autonomy.** The player is the commanding officer; the crew run the stations. Most tactics must be autonomous.
- **Missile settings**: pattern (so far just "firing cone"), and how long a missile runs dark before it homes actively (which makes it detectable to point defence). Activating point defence is itself a **visibility event**, so you only do it if you are sure of an incoming shot, and **faking a strike in a general area** is a tactic, an alternative to active pings.
- **Fold in enough to feel authentic without becoming a simulator.**
- **Is a zoomed-in, almost over-the-shoulder isometric view feasible, and has anyone done it?**

Companion docs: `docs/hunt_interface_rework.md` (scope, colour grammar, Newtonian burns), `docs/ship_tech_choices.md`, `docs/detection_model.md` (authoritative engine rules), `docs/command_model.md`, `docs/crew_roster.md`, `docs/salvo_design.md`. Items marked **DECIDE** need Dave.

## 0. Short version

1. **Yes, fold most of it in, but only as a presentation and decision layer over the engine we already have.** About two thirds of the PDFs' ideas map onto systems that exist (information-rate detection, analysts, pings, venting, a grid, ghosts). The PDFs add the *shape* of the experience: audio before UI, repeat-back orders, an arrival "wash", symbol designations, and per-weapon doctrine.
2. **The six-person crew is the answer to "stations".** The stations are already places on the ship (Control room aft zone: Quill; attack centre: Abara; Engineering: Castellan; Thermal control: Dace; Pell's pedestal). Swapping station = **looking over that officer's shoulder**, which is exactly the over-the-shoulder view you described. The screen on their console is the station UI.
3. **One station model, three visual shells.** Build the station layer (crew behaviour, orders, reports, audio queue, standing doctrine) once and show it through (S1) flat console screens with hotkeys, now; (S2) the zoomable isometric cutaway of the ship, later; (S3) over-the-shoulder station dioramas, later still. The logic never depends on the art.
4. **The zoomable iso view is feasible, with limits.** Pre-rendered 2D room plates (about 1400 px) can zoom to roughly 1.5x before they blur. A real close-up needs 3D station dioramas (we already render rigged GLB characters with three.js). Precedent exists; section 7.
5. **Simulator creep is controlled by design rules** (section 8): one primary decision per station per minute, competent defaults, optional depth, and authenticity carried by voice and procedure, not numbers.

## 1. The PDFs, concept by concept

| Concept (PDF) | Interdict today | Verdict | Note |
|---|---|---|---|
| **Command chain**: CO decides, OOD translates, specialists execute, helm acts blind | Three analysts (Dunne, Riggs, Sato in the tutorial); Corvane's crew: Quill, Abara, Castellan, Dace; Ostrow as the tutorial's CO-coach | **Adapt** | Six people only. Abara is the de facto OOD (Tactical, Weapons, Astrogation, Helm); no chief of the boat. The player is the CO. |
| **Repeat-back loop**: order, acknowledgement, "action happening" | Crew lines on events; orders apply instantly | **New, cheap, high value** | An order lifecycle (section 2.3) with a spoken ack. The UI waits for the voice. |
| **Information delay: audio before UI** | Reports and UI update together | **New** | Rule: a track or change is *spoken first*, then drawn (about 1-2 s). |
| **Track designations**: S (passive), R (active), V (vampire), M (optical), L (data link) | Contacts are "Contact 1..n" | **Adapt** | Use S, R, V, L; optical (M) maps to our eclipse channel, DECIDE name (section 5.1). |
| **NTDS symbols**: shape = category, hue = alliance; yellow default for unknown | Planned: warm/cool = how we know (Dave) | **Conflict, reconcile** | Section 5.2. |
| **DDI**: the selected track's best-guess card with confidence and age | Contact slips, Target view | **Have** | Add confidence words and AGE to the slip (some exist). |
| **TMA**: passive tracks are bearing-only; manoeuvre to build a baseline and range them | Information-rate tracking with a round uncertainty bubble | **Adapt (big opportunity)** | Fits Newtonian burns perfectly: ranging a passive target needs a manoeuvre, which is loud. Section 5.3. |
| **Fire control presets**: RTE, search pattern, floor/ceiling, wire guidance | Cone, aim point, warhead kinds, homing flag, grid intercept | **Extend** | Section 4. |
| **Active vs passive; active reaches twice as far as it detects** | Pings cost heat and alert warships weighted by range | **Have, tune** | Make the ping's alert reach about 2x its detection range. |
| **Nebula / asteroid / gas-giant baffle** | Planets block sight; one star | **Extend later** | Clutter and baffles as arena features; section 5.5. |
| **Sector Drop**: wash, auto-triage, commander's triage | Dog-leg arrival ("warned" or "relaxed" hunters); the opening board read | **New** | The arrival sequence, section 5.4. |
| **Ghosts as decaying tracks (30 s fade)** | Lures, static, "ruled out", age fade planned | **Have, polish** | Decay plus a spoken "marking as thermal ghost". |

## 2. The commander model: autonomy by design

### 2.1 Three layers of command
The player works at the highest layer they like, and the crew fill in the rest.
- **Intent** ("Find her", "Stay cold, close to 40 km, then take her"). The default. The crew turn it into orders.
- **Order** (a waypoint, a lock, a salvo plan, a vent). What the hunt console does today.
- **Doctrine** (standing rules the crew follow without being asked): rules of engagement, sensor posture, point-defence policy, damage-control priorities.
- Each station has an **autonomy setting**: **Auto** (the crew run it and report by exception), **Supervised** (the crew propose, you approve) and **Hands-on** (you do it). Defaults are Auto for everything except the player's chosen focus. This is the same idea as UBOAT's crew-management levels (Minimal, Intermediate, Expert; section 7), and it is how we keep one game playable by someone who never opens a sub-screen *and* by someone who wants to.

### 2.2 What the crew do on their own
| Station | Crew | Autonomous behaviour | Asks the CO |
|---|---|---|---|
| Sensors and ECM | Quill | Sweeps, builds tracks, classifies the easy ones, rules out ghosts, reports by exception | Which contact gets deep analysis; when to ping |
| Fire control (TMA, solutions) | Abara (and Pell when linked) | Builds solutions as tracks firm; says when one is ready or stale | Whether to give it a baseline (a burn) to range a passive track |
| Tactical and weapons | Abara | Keeps tubes loaded; applies doctrine | Fire or not; the salvo plan if you want to change it |
| Helm and navigation | Abara | Flies the plan; holds the course blind to the picture | Where to go, and what each burn costs |
| Engineering (drive) | Castellan | Keeps the drive in spec; warns before a burn runs hot | Whether to redline |
| Thermal control | Dace | Manages the sink; vents when told or when forced | When to vent; how much to risk |
| Damage control | Fenwick (maintenance) with Pell | Repairs by priority | Which system to save first when two are hit |
| Ship AI | Pell | Nothing until asked; clamped to clockwork | Everything above is faster and wider with the link, at a Tally cost |

**Pell is the automation slider.** The more of the stations Pell can run (`integration`), the more autonomous the ship is, the fewer people it needs, and the worse the audit. This turns the autonomy design into the game's core temptation, not a convenience setting. (Same argument as the crew-versus-automation fork in `ship_tech_choices.md`.)

### 2.3 The order lifecycle (repeat-backs, made short)
Every order moves through four states, shown in the order log and spoken:
1. **Issued** (the CO clicks). Nothing changes on the map yet; a "pending" ghost.
2. **Acknowledged** (one line from the right officer: "Helm aye, coming to zero-nine-zero"). The delay is the officer's reaction time (command style and trust scale it: tight ships ack fast and exactly, loose ships answer in their own words).
3. **Executing** (the effect starts; the burn begins, the vent opens).
4. **Reported** (an outcome line: "Steady on zero-nine-zero. Coasting." or "Burn complete").
- **Terse mode:** the full repeat-back is a teaching device. After the player has heard it a few dozen times, drop to acknowledgements only, and let high-stakes orders keep the full loop. A setting, not a mandate.
- **Calls follow the PDF's grammar**: *[station called], [station calling], [message]*. Fits our voiced reports and the existing `E.advice`.

## 3. The stations (screens)

Hotkeys are proposals. All screens share a strip of the PDF's "common operational picture" (the clocks, alerts, hunter fix) so the player never loses the headline.

| Key | Station | What it shows | Player decisions | Exists today |
|---|---|---|---|---|
| **F1** | **Conn** (the scope) | The tactical picture: tracks, our route and burns, their picture, wakes | Where to go; which contact to look at | Hunt map, contact slips (see mock-ups) |
| **F2** | **Sensors** (Quill) | The channels (heat, reactor, eclipse, and later clutter), contact states, ghosts, ping | Where to point deep analysis; ping or not | Scanner bars, analysts, active ping |
| **F3** | **Fire control** (Abara) | Track solutions: bearing lines, baseline, certainty, the solution card | Whether to spend a baseline; lock; wait | Target view, firing solution bar |
| **F4** | **Weapons** (Abara) | Tubes, warheads, salvo preset editor, point-defence posture, the launch timeline | Preset; RTE; pattern; fire; feint | Salvo planner, coilgun |
| **F5** | **Helm and navigation** | Manoeuvre plan: coasting legs, burn nodes, previews of heat and flare | Plan; confirm burns; hold still | Strategic map, route, speed and stance buttons |
| **F6** | **Engineering and thermal** (Castellan, Dace) | Reactor, sink, drive, vents, power draw, damage to parts | When to vent; redline; reallocate power | Heat sink, heat rate dial, vent, parts |
| **F7** | **Damage control** (Fenwick, Pell) | A schematic of compartments and systems, fires and breaches, repair queue | Repair priorities; seal and sacrifice | Hull bar; system lights |
| **F8** | **Comms and link** | Data-link (Lima) tracks from allies, patron calls, Pell, the log | Accept a link; reply to a call | Comms log, Pell toggle |
| **Space** | Next alert | Jumps to the station that needs the CO and flashes its icon | | New |
| **Tab / 1-9** | Next contact / select contact | | | Partly |

- **Alert-driven jumps.** When something needs the CO, an officer calls them ("Conn, Sensors"); the station's key flashes with a short audio cue; Space jumps there. An option lets the camera auto-jump to the officer who is calling.
- **Quiet by default.** A station's screen only changes the *hunt* when something there changes (a track firms, a warning). The player can stay on Conn for a whole hunt.
- **Each station is a small number of widgets reused from what we have.** Most of the console already splits this way (scanner/analysts, target, heat, ship, weapons); the work is rearranging and adding the missing views (damage control, link, solution baseline).

## 4. Missiles: doctrine, running dark, point defence and feints

### 4.1 A salvo is a plan, not a trigger
The PDF's central idea: the commander **programs the weapon before launch** and the weapon is autonomous. Today's "firing cone" becomes one parameter of a **salvo preset**.

| Parameter | Meaning | Choices | Trade-off |
|---|---|---|---|
| **Pattern** | How the missiles spread over the aim region | **Spread** (today's cone: wide or tight); **Snake** (weave across the approach, good against lateral speed); **Circle** (expanding loops around a spot, good against a ship hovering in a pocket); **Line** (a stream along a track, for a coaster) | Each suits one kind of target; the wrong one wastes the salvo |
| **Run to enable (RTE)** | Distance or time flown dark before the seeker turns on | Short to long | **Too short: the point defence has time to arm and shoot. Too long: the missile flies past before it looks.** The key skill expression |
| **Homing** | Active seeker after RTE | Off (ballistic) or On | Homing improves the hit chance and is an **emission**: the target's sensors can detect it |
| **Ceiling and floor** (only if the simulation is 3D) | Limits the search in elevation | | Ignore flares and decoys outside the target's plane |
| **Wire (telemetry tether)** | A data link back to us | On or off | Lets us steer or force an early enable; **any hard burn by us breaks the link** (Newtonian) |
| **Warhead** | HE, EMP, flare, etc. (exists) | | Flare and EMP are the feint warheads (4.4) |

- **A visible timeline** in the Weapons station: launch, dark run, wake-up, homing, impact; plus a band showing **the target's likely point-defence window** (how early it could detect, how long it needs to arm). The player sees "RTE too short" before pressing fire.
- **Doctrine presets**, so the crew can run it: **Ambush** (long RTE, tight, homing late), **Snap shot** (short RTE, wide, fast), **Probe** (a feint, 4.4), **Saturation** (many missiles, a wide spread). Each opens with defaults the crew choose from the situation; the "Advanced" panel exposes the parameters.
- **Missile stealth** (already in `salvo_design.md`): supercooled, ballistic missiles are very hard to see until the seeker wakes. RTE is exactly that switch.

### 4.2 Point defence as a visibility event
The engine already has a `grid` on enemies (none, light, heavy) that scales the chance to intercept, and it already ignores warnings when the ship is unaware (the `hot` factor). Make this explicit:
- Point defence has three states: **Off**, **Armed** (cold, slow to react, nearly silent), **Active** (tracking radar or laser on, **a bright emission that every sensor can see**).
- **Going Active announces you.** Doing so on a false alarm gives away your position for nothing; doing so late gets you hit. So the player (or the doctrine) should only go Active when sure.
- **Our crew's default**: Armed, and Active only on a **V-track** (a confirmed vampire). The player can set the doctrine tighter ("never go active unless I say") or looser ("go active on any launch we see").
- **Enemy AI** uses the same rule, scaled by its `cunning` and `notice`. A veteran crew holds point defence cold until it is sure; a green crew lights up at every shadow. This makes crew quality *readable* from behaviour.
- **Autonomy fit:** a crew that is told "hold point defence cold" has to be trusted, which ties to command style and trust.

### 4.3 The V-track (incoming)
A confirmed incoming missile or torpedo becomes a **V-track** with a countdown ("Vampire, bearing two-one-zero, impact in 45"). It is the one event that always interrupts, and the one event where the point-defence decision (4.2) is forced. It maps to the existing incoming list (`s.inc`) and the existing "has fired on us" warning (note the known bug in `foes()` from `audit_playability.md`: enemy launches are not announced; it must be fixed for this to work).

### 4.4 Feints: a salvo as a question, not an attack
Dave's idea: instead of an active ping, **fake a strike in a general area** and watch how the other side reacts.
- **A probing salvo** is a cheap, small launch (a few flare or marker warheads, or inert drones), aimed at an area where a target may be. It costs a missile (or a marker), a **launch alert** (the existing launch event weights about 0.15), and it **reveals our approximate position** (the launch plume), but **it does not ping**.
- **The target's reaction is the information.** A ship that is really there and aware will do something: arm its point defence (an emission), burn (a flare), vent, turn. A ghost or an unaware ship does nothing. So a feint **classifies by behaviour** (the engine already marks a contact hostile when it fires or vents; add "reacted to a probe").
- **Crew quality changes the answer.** A veteran will not take the bait (no reaction means nothing learned, which is itself information: "either empty or very good"). A green crew reacts. That makes feints a gamble that rewards reading the enemy.
- **Why it is better than a ping:** a ping is certain but loud and instantly announces you to everyone in range; a feint is deniable, aimed, and shapes the target's behaviour. **It is also a tool for the cat-and-mouse:** you can make a hunter light up its point defence, which makes *it* visible.
- Costs to keep it honest: missile stock (only if stock is modelled), a launch alert, the risk of provoking a ship that was unaware, and the risk of wasting a salvo on a ghost.

## 5. Information flow

### 5.1 Audio first, then the picture
- **The rule (PDF):** *the discovery of information (audio) must precede the utilisation of information (UI).* A new track is spoken ("Conn, Sensors. New thermal spike, bearing two-eight-zero."), and only after the line ends does the yellow track appear. Then the CO selects it and orders "isolate and classify"; the crew acknowledge; a progress bar runs; the symbol resolves.
- **Mapping to our channels:** heat (Dace's old line), reactor (Castellan) and eclipse (Quill) become the *sources* in a designation: **S** for passive heat or reactor returns, **R** for active ping returns, **L** for data-link tracks from an ally, **V** for incoming ordnance, and **optical** for a track confirmed by eclipse profile (the PDF uses **M**; DECIDE whether to call it M or O). Crews say "Sierra Four".
- **Pacing guards:** the voice line is never more than two short sentences; lines queue by priority; low priority goes to the log only; an overlapping callout is delayed, not dropped.

### 5.2 Symbols and colours: reconciling two grammars
The PDF's NTDS grammar: **shape = category, hue = alliance** (red hostile, yellow unknown, blue friendly, green neutral). Dave's earlier request: **hue = how we know** (warm = affirmatively detected, cool = passively detected or suspected). They collide (blue and green mean different things).
- **Proposal, two layers:**
  - **Track quality** (how we know) is carried by **line style and glow**: dotted (suspected), dashed (passive track), solid (affirmed), and a cool-to-warm **glow** exactly as in the mock-ups. This is Dave's grammar and is what an *unclassified* contact shows.
  - **Identity** (what it is) is a **small pip and an alliance ring** that appears *only after classification*: red ring hostile, blue friendly, green neutral (civil traffic with a transponder), no ring while unknown. Shape stays category (capital, stealth, fighter, ordnance).
- Result: an unknown contact is never blue-because-friendly; blue/green as *glow* means passive, and blue/green as a *ring* means identity, and the ring only exists after the crew have said so. DECIDE whether this is clear enough, or whether to drop the ring colours and use a letter code instead (F, H, N).

### 5.3 TMA: the cat-and-mouse, in one mechanic
- A **passive** track is a **line of bearing** with the range unknown, shown as a long uncertainty region along the bearing, not a round bubble (the PDF's "line to infinity").
- To range it, the ship must **manoeuvre to build a baseline** and the system stacks bearings until the lines intersect (the PDF's four-step TMA). **In a Newtonian game a manoeuvre is a burn, and a burn is loud.** So the choice becomes: *stay silent and keep a fuzzy line, or burn to resolve the range and tell the hunter where you are.*
- **Autonomy:** fire control does the stacking; the CO decides whether to *give it a baseline*. The crew say so: "Conn, Fire control. Bearing-only on Sierra Two. I need a leg to range her."
- Engine fit: the engine's single uncertainty bubble becomes anisotropic (long on the line of bearing, short across it); a baseline (our velocity change across the line) shrinks the long axis. Our existing "information rate" model can supply the rate; the change is in how range certainty is computed. Medium work.
- It also explains the rule that a coasting ship is easy to track: its straight line is the one thing TMA solves immediately.

### 5.4 The Sector Drop: the arrival "wash"
At the start of a hunt (and after a jump):
1. **The wash (0-3 s):** static, a thermal bloom, a low rumble. The scope is fuzzed; the ship is momentarily blind.
2. **Auto-triage (3-8 s):** Sensors: "Twelve broadband contacts. Auto-filters engaging." Chimes; the easy ones turn grey and are labelled debris or rock.
3. **Commander's triage (8 s on):** "Holding four unresolved thermal tracks, Sierra One through Four." The cognitive load is cut to a handful and the CO picks where to spend deep analysis.
- This is a natural **fit with the tutorial's board read** (four contacts) and an excellent opening for every hunt. It also says "contacts are ranked for you, not dumped".

### 5.5 Terrain
Planets already block sight both ways. To add in order: **gas giant thermal wake** (hide in the shadow; but you are blind toward the planet: a baffle you can't see through); **nebula** (blocks active pings, forcing passive and short range); **asteroid field** (broadband clutter: more false contacts, more analysis time). Each is a way to make a map matter.

### 5.6 Ghosts
An unresolved contact with no new energy for about 30 s fades; the crew say "lost contact on Sierra Four, marking as thermal ghost" and the track is removed. This rewards composure over panic fire. It already fits the lure and static contacts and the "rule out" step.

## 6. The ship as the interface

### 6.1 The crew are already at their stations
`docs/crew_roster.md`: six people run a ship built for eighty, because Pell does the work of the rest. Their stations are real rooms we have art for: **Control room** (aft zone: Quill's SENSOR mount; attack centre: Abara's WEAPON mount), **Engineering** (Castellan, DRIVE mount), **Thermal control** (Dace, SINK mount), **Pell's pedestal** (in the control room, nodes throughout), **Mess** (Fenwick), **Utility** (the dormant sickbay). The part slots in the ship system (drive, sink, sensor, weapon) *are* these mounts.

### 6.2 The zoom tiers
| Tier | View | Used for |
|---|---|---|
| **L0 Tactical** | The scope (sphere or flat; the mock-ups) | The default; the whole hunt can be played here |
| **L1 Ship** | Isometric cutaway of the ship (our twelve iso rooms), with the crew at their stations and a status icon on each (alerts, autonomy setting, current order) | Overview of the crew; switching station by clicking a room; seeing the ship react (heat in engineering, a fire in a compartment) |
| **L2 Station** | Almost over-the-shoulder at one console: the officer in the foreground, their screen as the UI (the station screen from section 3) | Hands-on work at a station; the emotional close-up when an officer calls the CO |
- **Hotkeys and zoom are the same thing**: F2 is "go to Quill's shoulder", and the camera moves there. Mouse wheel zooms continuously between the tiers.
- **The captain stays where the captain sits** (the player's chair is in the control room); station swaps are *the captain's attention*, not the captain walking across the ship. (Walking is for the walk demo, between hunts.)

### 6.3 One station model, three shells
Build in this order so nothing blocks on art:
- **Model (no art):** crews, orders, reports, the audio queue, doctrine, autonomy settings, designations. Testable headlessly (the bots).
- **Shell S1:** flat station screens with hotkeys and tabs, framed by a small crew portrait. Works now with the existing hunt console as the pieces.
- **Shell S2:** the iso cutaway; clicking a station zooms to its screen. Art needed: mostly existing (the walkable rooms) plus status overlays.
- **Shell S3:** the over-the-shoulder dioramas (section 7).

## 7. Is the zoomed-in, over-the-shoulder isometric view feasible? Has it been done?

**Short answer: yes. It is a known camera pattern. The hard part is art, not code.**

### 7.1 Precedents
Verified from sources (links at the end):
- **UBOAT** (a U-boat commander/management game): free cameras including an ego view, a side view and an orbit view, officers you can click to control, and **double-click for first-person**; crew management with **Minimal, Intermediate and Expert levels** (an autonomy dial); **standing orders** that continue until cancelled; **time compression that switches off on a threat or a radio message**. The review does not describe a cutaway.
- **Artemis: Spaceship Bridge Simulator**: separate stations (helm, weapons, engineering, science, communications) and a captain **with no screen of their own**, who relies on the other stations and a shared main screen. The "captain as information manager" design is the one in the PDFs.
- **Baldur's Gate 3** (a birdseye CRPG): a community mod adds a true **over-the-shoulder** camera; it reverts to the regular camera in combat, and looking in places the levels were not designed for can expose areas. **The lesson: a view the art was not built for shows its seams.**
- **Space Crew** (Runner Duck; layout mirrors *Bomber Crew*): real-time orders to crew, characters carried over. The reviews do not clearly describe the camera.
- **Dangerous Waters** (a submarine and anti-submarine simulator): a very deep simulation where the stations (sonar, fire control, navigation) are separate positions and multiplayer assigns players to them. The page does not describe station switching.
- From general knowledge, not verified in this pass: **FTL** (a 2D cutaway ship where crew walk to stations and you issue orders), **Barotrauma**, **Silent Hunter**-style station screens on function keys, and **Duskers** (a terminal-driven drone game). Treat these as pointers, not citations.

### 7.2 What it takes here
| Approach | Idea | Zoom range | Art cost | Verdict |
|---|---|---|---|---|
| **A. Zoom the 2D plates** | The AI-generated room images, scaled | About 1.5x (the plates are about 1400 px; the stage about 1100) | None | Fine for L1; **not** a real close-up |
| **B. 3D station dioramas** | A small three.js scene per station: the console, the officer (rigged GLB), the screen as a live canvas texture | Continuous, down to over-the-shoulder | A rigged officer plus a console per station; sitting and typing poses; back-view quality | **Recommended for L2** |
| **C. Full 3D ship** | The whole ship modelled | Everything | Very high | Not now |
- **We already have the toolchain**: `tools/sprites/` renders rigged Meshy GLB characters with three.js to build the sprite sheets, so a live three.js scene is a small step. The captain and Ames exist as rigs; Quill, Abara, Castellan and Dace would need the same (about 40 Meshy credits each; 15 remain, so this is a credit-planning item, not a build-now item).
- **The dolly-zoom trick** (narrowing the field of view while moving back) lets one camera blend an isometric look into a perspective close-up with no cut. **A spike is running to prove it with our assets**; results are in `design/spikes/` (see the end of this doc once it lands).
- **Screens as live textures**: the station UI is an HTML canvas drawn onto the console surface in 3D, so the same widget serves the flat shell and the diorama.
- **Risks:** back-view quality of AI-generated characters; sitting and typing animation (no sit animation yet; 3 credits per action); consistency between a plate-based L1 and a 3D L2 (a style match job); performance in the browser is not a concern at this scale.

## 8. Not a simulator: scope rules

**What we fold in** (cheap, felt): audio-first reporting; repeat-back acks; designations; the arrival wash and triage; ghosts that fade; the colour grammar; salvo presets with RTE and pattern; point defence as a visibility event; feints; TMA as the cost of a baseline; station screens and hotkeys; crew calls.

**What we keep out:** hand-plotting bearings; typing numeric courses and ranges; valve line-ups; individual weapon-system checklists; a damage-control minigame; a realistic multi-key ECM suite; any station that needs a manual to use.

**Rules that keep it playable:**
1. **One primary decision per station per minute.** A station that asks for more is split or automated.
2. **Competent defaults.** A player who never opens a sub-screen still gets a fair hunt; depth only adds wins at the margin.
3. **Depth is on demand.** Advanced panels open by choice; the crew explain what they mean in words.
4. **Authenticity from voice and procedure, not numbers.** The repeat-back, the call format and the pacing do more than extra parameters.
5. **Time budget.** A hunt stays about 10-15 minutes; time compression drops on a threat (UBOAT precedent).
6. **Accessibility:** a terse-comms setting, a high-contrast mode, and every critical event also shown visually (not only spoken).

## 9. How this fits what we already have
- **Hunt console** becomes shell S1: its zones are already stations in disguise.
- **Analysts** (the tutorial's Dunne, Riggs, Sato): on the Tern. On Corvane's ship the same roles are Quill, Abara, Castellan, Dace. The station model is crew-agnostic (a station has a seat, a person, a skill).
- **Command model** (`docs/command_model.md`): tight ships run crisp repeat-backs; loose ships improvise; `command.style` scales order latency and the number of options a station offers.
- **Decision moments** (`docs/decision_moments.md`): they become calls from a station to the CO.
- **Tutorial:** rebuilt around stations in order: Conn first, then Sensors, Fire control, Weapons, with Ostrow doing the OOD's part. It can also introduce the repeat-back and the wash.
- **Ship tech choices:** the part slots map to the mounts; the sensor choice (dish versus all-round) becomes what Quill's screen shows.
- **Newtonian motion** (decided): Helm owns the manoeuvre plan; TMA depends on baselines; wire guidance depends on not burning.
- **Pell and the Tally:** the more a station is automated by Pell, the worse the trace.

## 10. Roadmap (dependencies, not dates)
| Phase | Work | Size | Needs art? |
|---|---|---|---|
| 1 | **Station model and order lifecycle**: crew, acks, audio-first queue, autonomy settings, designations | M | No |
| 2 | **Salvo presets**: pattern, RTE, homing timeline, doctrine presets; engine support for dark-run missiles | M-L | No |
| 3 | **Point defence states and V-tracks** (fix the `foes()` announcement bug first); feints and reactions | M | No |
| 4 | **Flat station screens with hotkeys** (S1) and the new colour grammar | M | No |
| 5 | **Newtonian motion** and the helm manoeuvre plan (own design pass; see `hunt_interface_rework.md`) | L | No |
| 6 | **TMA and baselines** (anisotropic uncertainty) | M | No |
| 7 | **Arrival wash and triage; ghosts; terrain** | S-M | Light (audio, effects) |
| 8 | **Iso cutaway shell** (S2) | M | Mostly existing rooms |
| 9 | **Station dioramas** (S3) | L | Yes (rigged officers, consoles, animations; credits) |
Phases 1-7 need no new art and can be built and tested with the bots. 8 and 9 can wait for credits.

## 11. DECIDE (Dave)
1. **Scope of the fold-in:** is section 8's "keep out" list right, and the "fold in" list the right size?
2. **Autonomy defaults:** the three settings (Auto, Supervised, Hands-on) per station, with Auto as the default. Agree?
3. **Colour grammar:** the two-layer proposal (glow for how we know, ring for identity after classification), or drop the ring colours?
4. **Track letters:** use S, R, V, L; optical as M or O?
5. **Point defence:** Off, Armed, Active as a visible emission, with the crew defaulting to Armed and going Active only on a V-track?
6. **Feints:** does a probing salvo cost a real missile (needs a missile stock) or only a launch alert and a marker?
7. **Build order:** start with phases 1-3 (the station model, salvo presets, point defence) before the interface shells?
8. **The shells:** S1 first, S2 once the rooms are staged, S3 only when credits allow?
9. **Does the captain ever go hands-on at a station for real** (UBOAT's double-click to first-person) or is L2 only a view?

## Sources
- UBOAT review: [SUBSIM](https://www.subsim.com/ssr/uboat/review_uboat_full.php)
- Space Crew: [Wikipedia](https://en.wikipedia.org/wiki/Space_Crew), [Space.com review](https://www.space.com/space-crew-game-review)
- Dangerous Waters: [MobyGames](https://www.mobygames.com/game/17079)
- Baldur's Gate 3 over-the-shoulder mod: [PC Gamer](https://www.pcgamer.com/games/baldurs-gate/the-maker-of-the-baldurs-gate-3-over-the-shoulder-camera-mod-has-gone-to-great-lengths-to-demonstrate-its-not-like-other-third-person-viewpoint-solutions/)
- Artemis: Spaceship Bridge Simulator: [Wikipedia](https://en.wikipedia.org/wiki/Artemis:_Spaceship_Bridge_Simulator)
- The two PDFs supplied by Dave: "Communications and Information Flow" and "System Workflows and UI Architecture".
