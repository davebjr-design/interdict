# Ship technology choices: what modern submarines teach us (2026-11-13, from Dave's submarine rundown)

Dave's prompt: ship-building choices are another good gameplay element. The rundown of modern submarines (US/UK single hull vs Russian double hull, natural-circulation vs pumped reactors, pump-jet vs propeller, spherical vs conformal sonar, automation vs crew size) is all one idea: **you cannot be fast, silent, armed, tough and cheap at once, so every design is a bet on how the fight will go.** That is exactly the hunt. This note maps each submarine trade-off to an Interdict analogue, says what it would change in play, and flags what the engine already supports. Nothing here is decided; items marked DECIDE need Dave.

## 1. The five axes (our version of "fast, silent, armed, deep, cheap")

| Axis | In the hunt | Currency already in the game |
|---|---|---|
| **Cold** (quiet) | Staying unseen: heat rate, venting, "seen by enemy" | heat sink, vent signature, drive noise |
| **Eyes** | Reading contacts before they read us | sensor track, ping, analysts |
| **Teeth** | Killing or crippling in one exchange | salvo cone, kill radius, coilgun |
| **Tough** | Surviving the exchange you lose | hull points, breach drive, damage control |
| **Clean** | Passing a Tally audit | AI-touched parts, `tally.trace`, declared tally |

The first four are the submarine triangle. **Clean is ours alone**, and it is where the story lives (section 4).

## 2. The choices

Each is a **fork between two or three real options at the dock**, never a ladder of strictly better parts. Format: submarine trade-off, then the Interdict analogue, then what changes in play.

### 2.1 Hull: single vs double
- **Sub:** single hull is small, quiet and cheap to push; double hull is big and loud but takes damage and keeps its buoyancy.
- **Here: compact hull vs armoured hull.** Compact: small eclipse profile (the V-channel dimming we just made the identification clue), less heat mass, fewer part slots and bunks. Armoured: a deep damage reserve and a chance to limp home after a lost exchange, but a bigger, easier-to-read profile and slower to cool.
- **Play:** compact ships win by never being found; armoured ships win by being found and not minding. Armoured ships can run a riskier hunt (fire first, take the answer). Breach-drive escapes work better on armoured.
- **Hooks:** hull points, `profile` depth, slot count. Existing mass tiers (light 1, medium 2, heavy 4) already point at this.

### 2.2 Reactor cooling: natural circulation vs pumped loop
- **Sub:** pumps are the main mechanical noise; convection cooling lets a boat go silent at low speed but caps its power.
- **Here: passive (convective) sink vs pumped sink.** Passive: no added thermal signature while drifting or at 20-40% drive, but its capacity collapses above that and venting is slow. Pumped: much larger sink, handles redline and fast vents, but the pumps add a steady heat-rate floor and a "pump whine" that makes you easier to see even while hold-still.
- **Play:** passive ships are ambushers (sit cold for twenty minutes, then one decisive burn and a long recovery). Pumped ships are chasers and brawlers who can afford to run hot. This is the single clearest "changes how you play" choice, and it is almost free to build: it adds one rule to the heat-sink model (capacity depends on speed).
- **Hooks:** existing `sink` slot (Fin / Haul coil / Reservoir / Bastion). Add a tag `loop: passive | pumped`. Reservoir's `coldplus` is already a passive-flavoured part.

### 2.3 Drive: pump-jet vs open propeller (the cavitation knee)
- **Sub:** a ducted pump-jet delays cavitation, so the boat stays quiet to a higher speed, at the price of weight and low-speed efficiency.
- **Here: ducted bell vs open bell.** Every drive has a **knee**: the speed setting above which its signature jumps (our cavitation). Ducted: knee at 60-80%, quiet and fast, but heavy, thirsty at creep, poor on the ring-station "creep" settings. Open: efficient at low speed, cheap, knee near 40%.
- **Play:** the speed ladder (20/40/60/80/100%) stops being a smooth tradeoff and becomes "which rung is safe for this ship". A veteran reads the enemy's knee off its heat and knows how fast it can run without lighting up.
- **Hooks:** existing drive stats (`eff`, `thrust`, `noise`, `draw`); add `knee` (speed fraction). Anchor thrusters are already the extreme low-knee, creep drive.

### 2.4 Sensors and weapon placement: sphere vs flank vs towed
- **Sub:** a big spherical bow array gives a full 3D picture but pushes the torpedo tubes aft; conformal flank arrays keep the bow free; towed arrays give range and bearing at the cost of speed and turns.
- **Here: all-round array, directional dish, or trailed line.**
  - All-round: reads every bearing at once, medium range, and takes the nose, so fewer launch tubes (two salvo tubes plus coilgun instead of three).
  - Directional dish: long range on one bearing, blind elsewhere; you must point the ship (heading matters, which ties to the compass and hold-still).
  - Trailed line: best range and bearing on a sensing contact, but it limits you to slow speeds and a turn cuts it; one hard burn loses it.
- **Play:** changes how you read the board. Dish ships interrogate one contact at a time (good with the sequential reading we just taught); all-round ships watch everything; trailed-line ships are sniper boats that must be babysat.
- **Hooks:** existing `sensor` slot (`track`, `draw`, `warn`). Needs heading-dependent detection, which the engine may not have yet. Flagged, DECIDE whether to build it.

### 2.5 Crew vs automation: the whole story in one slider
- **Sub:** automation shrinks the crew and the boat; a large crew gives redundancy and damage control.
- **Here: crewed vs clockwork vs Pell-run.** Three analysts per contact today. A **crewed** ship has four stations (more simultaneous reads, stronger damage control, bigger hull and life-support heat). A **clockwork** ship has two stations and automatic nav tables (small, cheap, quiet, slower to read). A **Pell-run** ship needs fewer people and sees more, but that is `integration`, which is a Tally offence.
- **Play:** analysts are the throttle on how much information you can process. Fewer, better-assisted analysts is the path of temptation; a full crew is slow and clean.
- **Hooks:** analyst count, `integration`, `tally.trace`. This is the choice most tied to the narrative (section 4).

### 2.6 Payload: depth of magazine vs everything else
- **Sub:** payload capacity competes with quiet, speed and size.
- **Here:** magazine depth (how many salvos before you must loot and reload at dock) vs cold. A deep magazine is hot (supercooled missiles are quieter but need refrigeration) and heavy. A thin magazine means every salvo is a decision. Pairs with `salvo_design.md`: tight vs wide cone matters more when you only have two.

## 2a. How permanent is each choice? (Dave, 2026-11-13: you can't change a hull on the fly, but you can retrofit convincingly)

Not every fork above can be made at the dock. Sort them by how hard they are to change, and give each tier its own price. This also fixes the structure: **the frame is a story decision, the refit is a dock decision, the loadout is a per-hunt decision.**

| Tier | What it covers | Changed by | Price |
|---|---|---|---|
| **Frame** (permanent) | Hull form (compact or armoured base), where the sensor sphere and tubes sit, bunk count, reactor type | Getting a different ship. The player inherits Corvane's ship (a story event), so the frame is a given and not a shopping choice | Never refit; a new frame is a major beat (a prize hull, a purchase, a hard-won derelict) |
| **Refit** (dock, days, salvage kg) | Cooling loop (radiators, coolant loop), armour plating, drive bell, sensor mast or dish, trailed-line winch, tubes and magazine | A yard or a hide, using salvage and parts | Time at dock, kg of salvage, and a **retrofit penalty** (below) |
| **Consumables** (every dock) | Cold paint and absorber tiles, magazine fill, coolant, spares | Paying at any dock | Cheap, wears off, forces a routine |
| **Hunt-time** (free, reversible) | Stance, speed rung, vent, which pumps run, trailed line out or in, dish heading, who is on which contact | The player, in the hunt | Decisions and risk only |

### Retrofits that stay convincing
The trick is that a retrofit gives you **the same trade-off as the designed-in version, weaker and with an ugly side effect**, as in reality:
- **Armour applique (added plating):** adds hull and mass; the profile grows a little; heat mass rises, so cooling slows; the drive loses a rung of thrust. It gives maybe two thirds of what an armoured frame gets, and it is visible: an enemy reads "bolted plates" in the eclipse profile.
- **Cooling swap (fin panels, a pumped loop, or a reservoir):** the most believable retrofit. A pumped loop bolted onto a passive frame adds capacity and a pump whine; panels add capacity and a bigger thermal profile. Existing parts (Fin radiator, Haul coil, Reservoir, Bastion) already do this.
- **Drive swap:** the biggest refit; needs a yard, days and a lot of kg. A re-engined ship has a **mismatch** (thrust mounts, a duct that does not quite fit), so a ducted bell on an open-bell ship keeps part of its knee penalty.
- **Sensors:** easy. A mast, dish or trailed line is a bolt-on and a winch, which is the cheapest believable upgrade, so sensors are the first thing a poor crew changes.
- **Cold paint and tiles:** a consumable. Anechoic-style cold paint gives a real signature reduction that ablates in a few hunts and has to be reapplied at every dock.

**Retrofit penalty** is one rule, not many: a fitting from outside the frame's own design family costs efficiency (friction), mass, or both, in the same units as the maker friction already in the parts table (0.07 per extra maker, 0.04 per extra origin). It means a frame built for passive cooling is simply better at it than a frame that has been patched, and a patched ship is readable as patched.

### Refits create the dock story
- **Licensed yard vs hide:** a licensed yard refits quickly but inspects (it sees AI-touched parts and logs them: the Tally); a hide (unlisted berth) will fit anything and ask nothing, at a price and a risk. This gives the hides a gameplay job.
- **Reversible or not:** the part swap is reversible for a fee; AI-touched integration is not (one-way, as `integration` already is).
- **Dock time is a cost:** the Tally, the patron's clock and rivals all keep moving while you are in the yard, so a deep refit is a bet.
- **Mix and match, the sub way:** real boats can switch pumps off and run on convection at low speed. That is a hunt-time toggle available on a hybrid loop: a ship that carries both loops, at the price of mass and a big thermal footprint. A third option for the cooling fork: **hybrid**, flexible but never best at either.

## 3. Maker doctrines (the national-design-school idea, fictionalised)

The three makers already exist (Orrin light, Vask heavy, Halden medium). Give each a **design philosophy** so a part reads as a choice about who you trust, and so set bonuses mean something. Mapping, not copying:

| Maker | Doctrine | Tends to build | Weakness |
|---|---|---|---|
| **Orrin** | Never be found: small, quiet, delicate | Compact hulls, passive sinks, ducted bells, directional dishes | Soft; loses any exchange it does not avoid |
| **Vask** | Win the exchange: big, armoured, loud | Armoured hulls, pumped sinks, big batteries, all-round arrays | Seen from a long way off |
| **Halden** | Make it work: cheap, adaptable, catching up | Mixed, repairable, open bells, trailed lines | Efficiency lost to mixing makers; slower to improve |

The existing friction rule (extra makers or origins cost efficiency) then models what real navies find: mixing a Western quiet reactor with a Russian hull gets you neither.

## 4. The Clean axis: the best option is always AI-touched

This is where the submarine analogy turns into the game's premise.
- For each choice above there is a **war-era variant** salvaged from a derelict whose performance is better than anything a legal maker sells: a thermosiphon sink that is silent at any speed, a drive with no knee, an array that sees every aspect, an autopilot that plans the course. All are **AI-touched** (the trace is in the part).
- Fitting one goes in the Tally. Hiding it is possible, but audits read `tally.trace` (hidden) and a dock inspector can find it, as the dock inspection already does for the wiring.
- This makes ship-building a **moral and risk decision as well as a stat one**: your ship can be better, and every upgrade makes the audit harder to survive. It feeds the Act 3 pressure (the Tally turning on you) directly, and it gives crew reasons to object (Castellan on the off-books reactor, Quill on the arrays that "listen", Dace delighted).
- It also gives integration a physical form beyond Pell's dialogue: the more of the ship that is war-era, the deeper the link.

## 5. Enemy ships get the same choices (and you can read them)

If enemies use the same menu, the identification work we just taught becomes richer without new systems:
- **Profile** reads hull class (compact vs armoured) from the eclipse depth.
- **Heat behaviour** reads cooling (pump whine vs silent drift) and drive knee (it lights up at 60%).
- **Pinging a contact** or its response reads sensors (it turned to face you: a dish).
- A veteran can say "Vask armoured hull, pumped loop: it will soak the first volley and run hot, hit it twice" and the tutorial's *wide cone, non-lethal hit* lesson becomes a *choice* by enemy type.
- It also gives hunt variety: three ships with three doctrines make a 3-ship hunt a puzzle, not just a harder number.

## 6. Design rules
1. **No strictly better part.** Every option's cost is on a different axis from its benefit. If one option wins on every axis, it is a bug (the trim bot already hunts these: `pell.assist_heat` scoring "strictly better").
2. **Change the decision, not just the number.** Passive cooling and drive knee change *when* you act; dish sensors change *where you point the ship*; automation changes *how many things you can watch*. Numbers-only upgrades (+10% sink) are filler.
3. **Visible in the hunt.** The player should feel the choice in the first ten minutes of the next hunt, and a crewmate should say so.
4. **Legible to the enemy.** If the enemy cannot read your loadout and you cannot read theirs, the choice is cosmetic.
5. **Fit at the dock only**, as already decided; loadout is a commitment between hunts, which is what makes it a choice.
6. **Both ends viable.** Same rule as the Pell dial (`narrative_architecture.md` 3.2): a clean ship wins harder and slower; an AI-touched ship wins easier with a ledger to hide.

## 7. What is cheap to build, and in what order
1. **Sink loop (passive vs pumped)**: one rule on the existing sink model plus a tag on four parts. Smallest change, biggest play difference. Needs a balance pass with the bots.
2. **Drive knee**: a signature step on the speed ladder. Small; also gives the enemy ships their readable tell.
3. **Hull compact vs armoured**: wire hull points and `profile` depth to a hull option. Small; the profile reading already exists.
4. **Crew vs clockwork**: analyst count as a parameter. Medium; touches the tutorial and the console layout (two or four analyst columns).
5. **Sensor arcs**: needs heading-dependent detection. Larger. DECIDE before committing.
6. **AI-touched variants and the Tally link**: a content pass on the parts list once the dock screen exists (`dock_and_crew_screens.md`).
7. **Enemy loadouts**: after 1-3, generate enemy ships from the same menu.

## 8. DECIDE (Dave)
1. Is the Clean axis (section 4) the centre of this system, with AI-touched variants as the temptation? Recommend yes.
2. Build order: start with sink loop and drive knee (1 and 2), then hull (3)?
3. Do we want heading-dependent sensors (2.4), or keep sensors all-round and let the choice be range vs warning time?
4. How many fittings can a ship hold: the existing four slots, plus one **hull** and one **crew mode** slot, for six choices total? (Under 2a the hull is the frame and is not fitted, so it may be four slots plus the crew mode.)
5b. Frame: do we ever let the player acquire a second hull (and so a new frame), or stay on Corvane's ship for the whole campaign? Recommend one frame-change moment late, as a story beat.
5. Do maker doctrines (section 3) read as intended, or is the "national school" mapping too close to real navies?
