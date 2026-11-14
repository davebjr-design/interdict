# Station model and the hear-and-respond layer (design, 2026-11-14)

Phase 1 of `docs/stations_and_command_ui.md`. Decisions already made there: Auto/Supervised/Hands-on per station (Auto default), F-keys to move between stations, no ring colours for now, probing salvos spend real missiles. This doc defines (1) the station model, (2) the workflow for each station, (3) the **call deck**, the hear-and-respond interface Dave asked for, (4) pacing, (5) multiplayer fit, (6) tests and build steps. **DECIDE** items are for Dave.

## 1. The model (no art needed, testable headlessly)

### 1.1 Entities
- **Station**: `id` (conn, sensors, fire, weapons, helm, engineering, damage, comms), `seat` (a mount in a room), `occupant` (crew id, Pell link, or a human player), `autonomy` (auto | supervised | hands_on), `workload` (0-1), `queue` (pending calls), `doctrine` (standing rules).
- **Crew member** (existing six): `skill` per station, `reaction_s`, `voice` (style per command model), `fatigue`. A person can hold more than one station (Abara: fire, weapons, helm), which is a real constraint: **one person can only be on one call at a time**, so a busy Abara answers late.
- **Call**: `id`, `from` (station), `kind` (report | query | alert | recommendation | order-ack), `priority` (1 routine, 2 notable, 3 urgent, 4 critical), `text` (spoken line, at most two short sentences), `refs` (track ids), `options` (response set), `default` (what the crew do if you don't answer), `expires_s`, `cost_of_default`.
- **Order**: `id`, `to` (station), `verb`, `args`, `state` (issued, acked, executing, reported, failed, cancelled), timestamps. The lifecycle from stations doc section 2.3.
- **Doctrine**: per station, a small set of named rules the crew follow without asking (rules of engagement, point-defence posture, vent threshold, ping policy, damage priorities). Editable between hunts and in a hurry through presets.
- **Track**: existing contact plus `designation` (S/R/V/L/M-or-O + number), `quality` (suspected, passive, affirmed), `age`, `ghost` flag.

### 1.2 Autonomy semantics
| Setting | Crew behaviour | Calls to the CO |
|---|---|---|
| **Auto** | Acts on doctrine; reports by exception | Only priority 3+ and decisions the doctrine leaves open |
| **Supervised** | Proposes, waits for a yes (the call's `default` is "hold") | Every consequential action becomes a recommendation call |
| **Hands-on** | The CO works the station's screen directly; the officer only acks and reports | The station UI is live and the officer narrates |
- A station with no occupant is Auto run by Pell, with Pell's cost. A station held by a human is Hands-on by definition (multiplayer).
- **Order latency** = `reaction_s` + queue delay when the officer is busy. This makes crew load a real resource.

### 1.3 The loop (what the engine does each tick)
1. Engine events (new track, threshold crossed, launch seen, damage) go to the owning station.
2. The station's crew apply **doctrine**; if it decides, it acts and emits an order-report call (priority 1-2, log only).
3. If doctrine leaves it open, or priority 3+, it emits a **call** with options and a default.
4. The **call deck** (section 3) voices and presents it. The CO answers, defers, or lets it expire to the default.
5. The answer becomes an **order** and runs the lifecycle.
Everything above is plain data and rules, so the existing bots can drive it.

## 2. Station workflows (first pass; refine one at a time)

Each: purpose, automatic behaviour, calls it raises, orders it takes, and the one decision it owns.

### 2.1 Conn (CO's station; the scope)
- **Purpose:** the overall picture and intent. No officer; this is the player.
- **Orders:** intent ("find her", "hold cold", "break contact"), waypoint, select track, jump to station.
- **Decision owned:** where we go and what we are trying to do.

### 2.2 Sensors (Quill)
- **Auto:** sweeps, builds tracks, classifies easy ones, rules out ghosts, fades stale tracks, reports "new thermal S3".
- **Calls:** new track (2); track firmed or changed (2); lost contact (2); "she's pinging" (3).
- **Options:** *Isolate and classify* (spend analysis), *Mark and continue*, *Ignore*. Default: mark and continue.
- **Orders:** deep analysis on a track, ping (active), narrow or widen search.
- **Decision owned:** where the analysis time goes, and whether to ping.

### 2.3 Fire control (Abara, with Pell if linked)
- **Auto:** stacks bearings (TMA), keeps solutions fresh, flags stale ones.
- **Calls:** "Bearing-only on S2, I need a leg to range her" (2); solution ready (2); solution stale (2).
- **Options:** *Give a baseline* (a burn, loud), *Hold silent* (fuzzy range), *Wait*.
- **Decision owned:** buy range certainty with noise or stay quiet.

### 2.4 Weapons (Abara)
- **Auto:** tubes loaded per doctrine, point-defence posture per doctrine, applies the chosen salvo preset.
- **Calls:** "Solution good, tubes ready, recommend Ambush" (3); incoming V-track (4: forces the point-defence decision); tube or stock status (2).
- **Options:** *Fire (preset)*, *Probe (feint)*, *Hold*, *Change preset*; on V-track: *Go active*, *Stay cold*.
- **Orders:** salvo preset (pattern, run-to-enable, homing, wire), launch, probe, point-defence posture.
- **Decision owned:** whether, when and how to shoot.
- **Missile stock (new, decided):** a magazine count per warhead kind. Probing salvos spend real missiles. **DECIDE:** starting count and resupply (proposal: a small magazine, 6-8 total; resupply only at port or from salvage, so each probe is a visible cost).

### 2.5 Helm and navigation (Abara)
- **Auto:** flies the plan, holds the coast, reports burn complete.
- **Calls:** "Burn will run hot, recommend shorter" (3); "Course change breaks the wire" (3).
- **Options:** *Burn as ordered*, *Shorter burn*, *Abort*.
- **Orders:** waypoint, burn node, hold still, slow drift.
- **Decision owned:** the manoeuvre plan and its heat and flare cost.

### 2.6 Engineering and thermal (Castellan, Dace)
- **Auto:** keeps drive in spec, vents on doctrine threshold.
- **Calls:** "Sink at 80 percent" (2); "Forced vent in 20 seconds" (3).
- **Options:** *Vent now*, *Hold and risk it*, *Cut thrust*.
- **Decision owned:** how much heat risk to carry.

### 2.7 Damage control (Fenwick, Pell)
- **Auto:** repairs by doctrine priority.
- **Calls:** "Breach in aft thermal, fire in the stores" (3-4).
- **Options:** *Save the sink*, *Save the drive*, *Seal and sacrifice*.
- **Decision owned:** which system to save when two are hurt.

### 2.8 Comms and link
- **Auto:** receives data-link tracks, patron calls, relays Pell.
- **Calls:** an ally link offer (2); patron message (2); Pell speaks (2-3).
- **Options:** *Accept link*, *Decline*, *Reply later*. Accepting a link adds a track source but is an emission (cost).
- **Decision owned:** who we talk to and what we reveal.

## 3. The call deck (the hear-and-respond interface)

**Goal:** the player stays engaged and in control of pace, never reading a wall of text or clicking through menus while the clock runs. The model is **a radio you answer**, not a menu you manage.

### 3.1 Anatomy
- **The line:** the officer's spoken call, subtitled in a strip at the bottom of whatever view is up, with their portrait and the track id. Voice first; text appears with the voice (the UI follows the audio).
- **The answer chips:** up to **four** short options under the line, each with a **number key** (1-4) and the **crew's recommendation marked** (a small tick). The recommended one is also bound to **Enter**.
- **The timer ring:** a thin ring around the line that shows when the default will run. It is slow for routine calls and fast for urgent ones; it is **hidden for priority 1-2** (nothing happens if ignored) and visible for 3-4.
- **The call rail:** a thin vertical list at the screen edge of waiting calls as small icons coloured by priority, so you see the queue without reading it.

### 3.2 Keys
| Key | Action |
|---|---|
| **1-4** | Choose that answer |
| **Enter** | Do what the crew recommends |
| **Space** | Take the next waiting call (the highest priority; also jumps to its station if you want, see below) |
| **Backspace** | **Stand by**: tell the officer to hold; extends the timer (limited, see 4.2) |
| **R** | **Say again**: replay the line (and shows the full text) |
| **Esc** | Dismiss to the log (priority 1-2 only) |
| **F1-F8** | Move to a station (independent of calls) |
| **Hold V + a station letter** | **Ask a station for a report** ("Sensors, report", "Weapons, status"): pulls a status call on demand |
- **A call never moves the camera by itself** unless the option "follow calls" is on; it flashes the station's F-key and plays the officer's voice cue. The player chooses to go there (Space or the F-key). This respects "control the pace".

### 3.3 Query-and-answer, not only alerts
Not every call is an alarm. Officers also **ask**:
- "Conn, Sensors. Contact S3 is firming. Do you want analysis on her or on S2?" (a choice with consequences)
- "Conn, Fire control. I can range S2 if you give me a leg." (a trade)
This is where the player's judgment is exercised; alerts are the minority.

### 3.4 Speaking back
- Answers are voiced back by the officer as the repeat-back ("Helm aye, coming to zero-nine-zero"). The player never speaks; they press.
- **Verb hotkeys for proactive orders** (not in reply to a call): **hold V, tap the station letter, then pick from the chips**. This keeps a single grammar: *station, then verb, then target (click or Tab)*. A mouse-only path always exists (click the station icon in the rail, then a chip).
- **DECIDE:** whether to also offer a **radial menu** on the scope for target-first orders (click a track, pick "classify / track / probe / fire"), which many players will expect.

## 4. Pacing: the player controls the tempo

### 4.1 The principle
The hunt is real time, but **the player never loses more than they can bear to a menu**. The crew buy the player time; the player spends it.

### 4.2 The tools
- **Auto absorbs load.** The more stations on Auto, the fewer calls reach the CO.
- **Stand by** (Backspace): holds a call open for a set time. Each officer has a **patience** (from `command.style` and trust). Past it, the doctrine default runs. A tight crew waits longer; a loose crew improvises sooner.
- **Defaults are competent** and **cost something** (`cost_of_default`), so ignoring is safe but not free.
- **Priority gating:** priority 1-2 never forces anything; 3 has a visible timer; 4 (vampire, breach) interrupts and shortens other timers.
- **Batching:** simultaneous low priority calls from one station merge into one ("Three new thermal returns, S3 to S5") to avoid a flood.
- **Time compression** (optional setting): when nothing is pending the game can run faster; it **drops to 1x on any priority 3+ call** (UBOAT precedent).
- **Tutorial only:** the pause-to-read rule stays tutorial-only (decided earlier). In normal play there is **no pause**; Stand by and the call rail are the pacing tools.

### 4.3 Rhythm targets (for tuning)
- At most **one priority-3+ call per 20 s** on average in a normal hunt; bursts allowed in a fight.
- At most **two lines of speech** per call; at most **four** options; most calls need **one keypress**.
- A competent player should be able to run a whole hunt on **Enter, Space, Backspace and 1-4**.

## 5. Multiplayer fit (a note, not a plan)
- A station occupied by a human is Hands-on; the call deck routes that station's calls to that player, and the CO's rail shows "(Player 2) has Sensors".
- The same call and order objects are the network messages; nothing in the model assumes one human.
- **Out of scope now**; the model just must not forbid it.

## 6. Tests and build steps
1. **Data model and rules** (`web/station_model.js`, no DOM): stations, crew, calls, orders, doctrine, autonomy, latency, priority queue, batching, stand-by, defaults.
2. **Bot tests** (like `tests/tutorial_bots.py`): all-Auto run produces calls only at priority 3+; a Supervised station raises recommendation calls; Stand by extends then defaults; one person on two stations delays the second; a V-track interrupts.
3. **Engine hooks:** map engine events to station calls (new track, firm, lost, ping alert, vent threshold, incoming). Needs the `foes()` launch-announcement bug fixed first (in `audit_playability.md`).
4. **Call deck UI** over the existing hunt console (flat shell S1): line, chips, ring, rail, keys.
5. **Then station by station:** Sensors, Fire control, Weapons (with the magazine), Helm, Engineering, Damage control, Comms. For each: write the workflow (this doc section 2), add its rules and calls, add its screen, add its tests.

## 7. Open items
- Radial menu on the scope: yes or no.
- Magazine size and resupply.
- Patience values per command style (tuning).
- Do **Abara's three roles** become a bottleneck by design (my proposal: yes, it is a lever for Pell's value and for hiring a fifth officer later)?
- Voice: text-to-speech, recorded lines, or text with sound cues? (Audio-first means this needs an answer before Phase 4. Placeholder: text with cue sounds and a short typed-on delay.)
