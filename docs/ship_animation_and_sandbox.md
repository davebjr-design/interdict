# Animation list, brace points, sandbox plan, and what knocks people down (2026-11-19)

Grounded in docs/mechanics_brace.md (engine: web/hunt_rt_engine.js). "Exists" = already in the engine. "Proposed" = new, needs Dave's call.

## 0. Bobbing
Abara's bobbing was my doing: the generic crew idle (a sine on height and yaw, meant for the placeholder seated crew) was applied to her. Removed in the source; she now stands still until she has a real idle clip.

## 1. Animation list (ambitious)
Source key: M = Meshy animation library on the existing rig (a few credits per clip), R = retarget from a free humanoid library (Mixamo-style) onto the Meshy skeleton, P = procedural (bone offsets / IK / physics), C = custom keyed by hand.
Rule of thumb: every character needs the same skeleton so one clip set serves all six crew.

### A. Locomotion (M/R)
idle (weight shift, glance), idle-tired, walk, brisk walk, run (Shift), turn in place 90/180, start/stop, walk with sidestep, walk carrying a crate, walk in low-g shuffle (magnetic-boot gait, optional), walk injured (limp; Abara already has a limp in her card), walk supporting a hurt crewmate (two-body pair clip).

### B. Vertical movement
ladder climb up / down (hand-over-hand), ladder idle, mount top / mount bottom, shaft climb (long), step onto landing, hatch step-through (duck under the coaming), crawl through low hatch.

### C. Stations and seats (R + C poses)
sit down / stand up (couch), seated idle, seated work (typing, tapping a screen, headset hand), seated lean-in at screen, seated look-over-shoulder, seated react (flinch), seated strapped-in (brace pose, see E), command chair: sit, lean forward, hand on chin, hand on rail. Per station: helm hands-on (stick/throttle), weapons (arm key, safety flip), sensors (headphones, hand on ear), thermal (valve wheel), engineering (reach to panel).

### D. Standing work and social (R/M)
stand at the chart table (lean on elbows, trace the chart, tap, clip a paper), pointing, arms crossed, hands on hips, check clipboard, write, drink tea (Abara), clean glasses (Abara's habit), hum while working, talk (two or three gesture loops), nod, shake head, shrug, salute-ish (ship's gesture), sit on a bunk edge, lie in bunk (sleep, breathing), get up from bunk, eat at the mess table (sit, fork, drink), cook (stir, chop, taste: Fenwick), pour, wash dishes, use the head, wash hands, shower (suit-less, behind a screen), do laundry, med cot: lie down, examine (Dace), treat (bandage, injection), carry a patient, darts (Abara, throws and blames the board), hand an object, receive an object, kneel to open a floor panel (Castellan), crouch to inspect, reach under the pedestal.

### E. Brace and load (the headline set)
reach-for-grab-bar (from standing, 0.5 s), hold a brace point standing (one hand, two hands, back to wall), strap in seated (belt, 3-5 s, matches `braceTime` 0.4 min = 6.4 s so the animation length is tuned to the rule), secure idle (head back, braced), release (stand easy), brace in a bunk (cinch the lash), brace in a low hatch, brace crouched at a locker. Each runs forward as "bracing" and loops as "secure".
Load reactions while secure: small shake, big shake (impact), long burn press-back (lean into restraints, 0.5 g to 1.5 g), spool shudder.

### F. Not braced (the other headline set)
stumble (sudden lurch, 0.5-1 s, recovers), stagger-step and catch a rail, grab-and-hold-on (late brace, half-effective), thrown forward / back / sideways (direction from the load vector), slide along deck, hit wall (front, back, shoulder), fall flat, tumble in a low-g hit, crouch-cover head, get up from the deck (slow, hand on knee), get up and stagger, kneel dazed (stun 6-12 s), lie unconscious (face up, face down, curled), come round (groan, sit up), dragged by a crewmate, carried (fireman's lift), propped on the med cot, seated slump (officer stunned at station), seated slump to the floor (chair empty, body drops), clutch arm / side / head (injured stance), hold bandaged arm (idle while hurt).
Rig note: most of these are P (ragdoll for the throw and slide, keyed clips for get-up, dazed, unconscious). A ragdoll with a capsule per bone fits Babylon's physics add-on; if it is too heavy, a 4-state fake (lurch clip, slide tween, impact clip, floor clip) reads nearly as well from the orbit and shoulder cameras.

### G. Alarm, damage, crisis (M/R/P)
run to station (urgent run), look up at alarm, cover ears (klaxon), duck under spark shower, shield face (arc flash), extinguish fire (fire extinguisher: Castellan's dc_locker), patch hull (plate and sealant gun), fire hose / pump, carry a bleeding crewmate, call out (hands cupped), hold a hatch against a pressure pull, close a hatch (wheel), dog a hatch, throw a breaker, hit an emergency stop, pull a manual release, evacuate to the shelter, hold breath (decompression), gasping (CO2 lamps in ship_systems), cough (smoke), shiver (cold, thermal fault).

### H. Airlock, suits, EVA (M/R/C)
suit up (step in, seal collar, helmet on, lock), helmet check (tap), gloves, suit-locker open/close, tether clip on / off, air-lock stance (hand on wall), cycle wait, hatch pull (inner/outer), push off in vacuum, float idle (zero-g), float-turn, float-grab (hand-over-hand along a line), float-brace on a ring, EVA tool use (cutter, wire cut: matches the engine's cutter job), EVA carry, EVA hurt (tethered drift), board a derelict (look around, torch sweep, weapon-low walk), dock handshake (Corvane handing a pass), return and unsuit. Maps to `airlock_sys` events: `suit`, `outer-open`, `board`, `look`.

### I. Combat / boarding (optional, M/R)
sidearm draw / holster (Quill checks the safety), aim-low-ready, aim, crouch-cover, peek, flinch from hit, hands-up (surrender), kneel with hands on head, restrain (cuff), search a body, drag a body, open a locker under guard.

### J. Hunt-specific and mission-specific
point at the plot, mark a contact (grease pencil on the chart), listen (hand on headset, eyes closed), flip a guard cover, arm weapons (two-hand turn key), read paper log, read a tablet, write a letter (Abara's unsent letters), pass the key (Pell's red key scene), pat shoulder, hug, argue (hands up, step back), turn away, slump in a chair (grief), pour a drink, toast, bow head (the blessing), turn a key (wiring scene), kick plate open (Castellan), pry a panel, kneel to look under the pedestal.

### K. Face and hands (separate layer, P)
blink, eyelid close, eyebrows (worry, query), mouth shapes for speech (visemes tied to the voice clips in web/voice_clips; 8 shapes cover most), smile, frown, grimace (hurt), wince, eyes up/down/left/right, head look-at (look at the speaker or screen, driven by script), hand poses (open, fist, pointing, grip rail, grip stick, pen, cup, tablet), finger tap loop. Only the look-at and mouth shapes are essential; the rest are polish.

### L. Fixture animations (not characters)
hatch open/close (iris and swing), airlock hatches (already scripted), collar bolts latch, soft-dock tube extend, ladder gate, bunk curtain, med cot raise, shower curtain, mess table fold, galley range hatch, tube cap open, warhead lift on the loader crane, missile load into a tube, tube-rotating drum (revolver base), engine bell gimbal, reactor pod pulse, pump tower spin, cassette load, coolant valve turn, fire extinguisher swing, door interlock lamps.

### Counts and priorities
Roughly 160 character clips if everything above is made, and about 25 fixture animations. Do not make them all: a first playable set is 36 clips.
P1 (the sandbox needs these to look right): idle, walk, run, turn, ladder up/down, sit/stand at station, seated idle, seated work, stand-at-table, strap-in, secure idle, release, grab-rail-brace, stumble, thrown (ragdoll or 4-state), get-up, dazed, unconscious, come-round, carried/dragged, small/big shake, burn press.
P2: suit up, float set, airlock, hatch dog, extinguish, patch, med treat, lie in bunk, eat, cook, point, talk, hurt walk.
P3: combat set, social set, face layer, polish.
Meshy: character GLBs are Meshy; clips come from R mostly (cheap), M for the 10-15 clips that need custom flavour. Each crew member is a separate mesh on the same rig family, so retargeting one clip library covers all.

## 2. Brace points through the ship
Status: not in. The ship has seats (couches at the CIC stations, bunks) but no marked brace points; right now "braced" is a number (`s.brace`), not a place. Proposed rule: each place a person can stand or lie has a brace point, and a crew member's position decides how well they are braced.

### Types
- **seat-belt** (station couch, command chair, med cot, mess bench): full brace; this is "secure".
- **bunk lash** (each rack): full brace, lying.
- **grab bar / handhold** (walls, hatch coamings, ladder rails, console edges): standing brace, half protection (the engine's "bracing" tier: half injury and stun chance).
- **wall-and-foot** (a corner or recess where you can wedge): half.
- **deck loop / net** (cargo net in the missile hall, shelves with netting): half, crouched.
- **tether point** (airlock, junction, hull): needed for EVA and decompression events.
- **none** (open floor): unbraced, the full risk.

### Where (per room)
- **A1 CIC:** 5 station belts, command chair belt, grab ring around the chart table (all round), rail along the screens, handhold by each locker.
- **A2 Berths + captain's pod:** 8 bunk lashes, captain's bunk lash, handholds at pod door, ladder rails.
- **A3 Array hall:** handrail along the arrays, cabinet handholds.
- **B1 Mess:** belts or bars on the mess bench (a lap bar swings down on the round table), galley rail, range/fridge handholds.
- **B2 Junction + airlock:** lock handholds both sides of each hatch, tether points on collar and tube, suit-locker bars, ladder rails.
- **B3 Utility:** med cot belt, shower pod grab bars, head grab bars, laundry rail.
- **T Missile hall:** catwalk rail the whole way, ladder cages, deck loops at each tube base, loader crane cab seat.
- **C1-C3, D1-D2:** pump tower and reactor rails, machinery cage, ladder rails, one belt-seat per engineering console, valve gallery rail.
- **Shafts:** ladder (rail) is the brace; climbing counts as half-braced only if both hands are on the ladder.
Gameplay link: walking to a brace point and pressing a key (or the CO's "brace" order) auto-walks the crew to the nearest point, then plays the matching animation; time to secure = walking time + belt time. Crew who start a long way from a point take longer than 6.4 s; that is a real cost the current engine does not have.
Visual: brace points should read at a glance (yellow bar, a belt hanging on a seat), and the HUD can overlay them when brace is ordered.

## 3. Sandbox first, then hunt scenarios (agree; recommended)
Yes: put the ship in a sandbox and prove the systems before scripting hunts. Proposed contents:
- A "sandbox" scene mode: the ship, no mission, no patron, a control panel (dev overlay) with sliders and buttons, plus a recorder/log.
- Controls: spawn contacts (type, bearing, range, lineage), fire a volley (count, seen/unseen, seeker range), set speed rung, hard evade, redline, jump spool, force an impact of N damage, force a fire / leak / vent / scram / loss of power, set crew positions (random, at stations, in bunks, in the mess, at the airlock), set doctrine (ask / auto / manual), set brace (free / bracing / secure), set a crew member to injured / stunned, time scale x1/2/4/16.
- A **maneuver matrix** (automated, headless): each of redline, hard evade, spool, impact(10, 20, 30, 50) x brace (free, bracing, secure, partly: some on belts, some standing) x crew positions (stations, mess, bunks, ladder, airlock, EVA) -> record: stunned, injured, knocked-out, work-rate, time to secure, any contradictions (a secure person hurt, a person on a ladder uninjured at 1.5 g). 
- **Dev checks** that must pass before hunts are scripted: braced crew are never hurt; unbraced at 1.5 g are hurt at roughly the engine's rate; bracing halves the risks; a crewman on a ladder in an impact falls (or holds on if both hands are on the rails); a crewman in the airlock tethered / untethered; decompression with and without suit; the animations play the right clip for each state; no stuck or teleporting crew after a throw; nothing breaks on speed 16.
- **Instrumented outputs:** a table in the overlay and a JSON dump so the same matrix can run in Playwright.
Only after this passes do we write hunt scenarios against it.

## 4. What causes unbraced damage
### Exists today (engine)
| Cause | Threshold | Result |
|---|---|---|
| Hard burn, crew not secure | load above 0.5 g (redline 1.5 g, spool 0.8 g, hard evasion 0.6 g) | injury hazard per step, `1 - exp(-0.5 (g - 0.5) dt)`; injured officer works at 60 percent for a few minutes |
| Impact (big hit, 20+ damage) | 30 percent chance (15 percent while bracing, 0 secure) scaled by damage/40; two injuries at 30+ | injury |
| Any hit on an unsecure crew | 40 percent at 30 damage (half while bracing, 0 when secure), each officer rolled alone | stun 6 to 12 s: the station is dead, orders held |
No death and no long unconsciousness exists today: "nobody dies of an injury".
### Proposed tiers (animations map to these)
1. **Stumble (cosmetic, 0.5-1 s):** any lurch from a moderate load (0.3-0.5 g, small hits, a hard turn) on a standing, unbraced person. No rule effect (maybe a tiny work-rate dip). Also a brace-by-grab: if a handhold is within reach, the person catches it.
2. **Knockdown / thrown (2-6 s):** a hit of 10-20 damage, evasion or spool while standing and free. Thrown along the load vector, hits wall or deck, gets up. Work stops for that time; no injury. (The current "stun" could be split: knocked down briefly vs stunned.)
3. **Stun (6-12 s, exists):** now shown as dazed on the knees or slumped at the station.
4. **Injury (minutes, exists):** hurt stance, 60 percent work, treat with Fenwick/Dace.
5. **Knocked out (proposed, 1-3 game minutes = 16-48 s real):** a hit 30+ on a free crew, or being thrown into a hard fixture (ladder, console edge, ladder-fall), or a fall from height (the shaft: falling 10+ m). Out of action; someone has to carry or rouse them; a second officer is pulled off task. Probability high for the unbraced at 1.5 g impact, small for bracing.
6. **Serious / out of the hunt (proposed, hunt-length):** a fall down the missile-hall shaft; an unbraced, unsuited person in decompression; a second KO on top of an injury. Recovers after the hunt in the sickbay; the mission loses that officer's station for the next hunt (Act-1 can leave this off; it is the dramatic ceiling).
### Events that should trigger damage (list)
Moderate: hard evade, redline burn, spool (jump spool shudder), a near miss that shakes the hull, PD firing salvo recoil, big docking bump, brace ordered too late.
Strong: missile hit (20+), multiple hits in one second, collision with debris, ramming/docking bump, grappling (a wire cut that snaps), tube misfire in the missile hall (blast shove), weapon launch recoil (24 tubes, 12 per side) with people on the catwalk.
Hazards (need rules): hull breach (decompression pull, suit or tether needed), fire (smoke and heat), reactor scram (sudden deceleration and darkness), power loss (lights, gravity-less drift if drive off), coolant leak (slick floor, burns), CO2 build-up (drowsy, then blackout: `ship_systems` already has CO2 lamps), thermal runaway (heat injury), tether snap on EVA, airlock pressure mistake (inner hatch against 30 kPa), sudden "gravity" change (thrust ends: loose items and people float), jump transition (the weirdest: not designed yet).
Positions that change the outcome: standing on a ladder or in the shaft (worst: falling distance), on the catwalk (rail helps), in the shower pod (slick), in a bunk (lashed = safe, unlashed = thrown out), carrying something heavy, mid-hatch (hit by the door), EVA (tethered or not).
### Design questions for Dave
1. Do we want knocked-out as a real state (1-3 minutes), or keep stun + injury only?
2. Can anyone die in Act 1? (The engine says no; a fall in the shaft is the obvious case.)
3. Are brace points required (walk to a seat) or abstract (the CO orders and everyone is instantly "assigned")? Required is more physical and richer in animation but more annoying in play; middle option: crew auto-walk to points, the player just orders.
4. Does the player avatar get thrown too (player controls)? Suggest: yes, a short lose-control (2 s) unless the player holds a rail.
5. Do the ship's passengers (e.g. Corvane in her cabin) have brace points and animations? Cheap to add later.

## 5. Decisions (Dave, 2026-11-19)
1. **Knocked-out is a real state.** The station that officer was at drops to **25 percent** effectiveness. Exception: if the captain takes that station, it runs at normal effectiveness; the knocked-out officer must then be **moved to an unoccupied couch** (carried or dragged there, which costs another crew member's time). Open detail: which couch (nearest free; sickbay cot if sickbay is free).
2. **No deaths in Act 1.** Worst outcome is knocked out or seriously hurt (out for the hunt). A shaft fall is knocked-out at worst.
3. **Triggers to build:** hard evasion, sudden acceleration, **the jump itself** (spooling alone is not a trigger), hits, **ship collisions** (other ships, asteroids and the like; no separate "debris" concept), hull breach, fire; the rest of the proposed list (power loss, CO2, tether snap, tube misfire) stays as later candidates.
4. **Brace points:** crew **auto-walk** to the nearest brace point when brace is ordered. Crew already at a station are strapped in, so a station counts as a brace point (instantly secure).
5. **The player avatar gets thrown too unless braced.** Braced can mean holding a rail or handhold, not only a belt.
6. **Orbit camera:** the control room (top deck, nothing above) looks down at about 45 degrees. On every lower deck the camera may not look down through the deck above: its elevation is limited so it stays under that deck's ceiling (it sits near the rim looking across the room). Fading the deck above is the alternative if the rim view proves too tight.
7. **Keys:** 1-5 answer calls, 6 orbit camera, 7 over-the-shoulder, 8 ship view (9 free).

## 6. Implementation status (2026-11-20)
- **Engine**: knocked-out state with 25 percent station effect (Abara solve time, Castellan spool, Dace vent and body rate, Quill body rate, Fenwick treatment), captain cover, move-to-couch; new engine events `impact` ({dmg, from, brace}) and `jump`; existing `unsecure`, `ko`, `woke`.
- **Ship (ship3d_bjs.js, window.BRACING)**: on a brace order Abara walks (1.7 m/s) to the nearest brace point (CIC rails round the chart table) and returns on stand-easy; a knocked-out Abara slumps and gets up on `woke`; the avatar is thrown (slide, tilt, shake, no control for 1 to 2.4 s) by a hit of 6 or more, the jump, or a loaded burn, unless braced. Braced = within 1.1 m of a belt or seat, or of a rail or handhold while the crew are bracing or secure. The other rooms get eight wall handholds so the avatar can brace anywhere. Other crew (Quill, Castellan, Dace, Fenwick) are not yet modelled walking.
- **Not yet**: the move-to-couch and captain-takes-station flow on screen (E.moveKo, E.captainTakes have no UI), KO visuals on other crew, the thrown/brace animation clips (capsule tilt only), sandbox panel and maneuver matrix (task 100).
