# Hunt engine coherence audit (2026-10-31)

Scope: `web/hunt_rt_engine.js` (all 548 lines), `web/trims.js`, `web/tutorial.js`, `web/hunt_rt_template.html` (how the UI drives the engine, help text lines 165-176), `tools/trim_bot.js`, `tests/*.js`, `docs/decision_moments.md` §1. Line numbers below are engine lines unless prefixed (`T:` template, `tr:` trims.js, `tut:` tutorial.js). No code was changed.

Tests run: `burntest`, `hosttest`, `nrtest`, `tracktest` all pass. `trim_bot.js 30` runs in about 3 s. (`check_ship.js` and `smoke4.py` need Playwright and a browser, so they were not run.) I also ran extra probes with scratch bots (method at the end).

---

## 1. Summary verdict

The **sensing half** holds together well. That covers the three channels, information rate, classification, uncertainty and the solve timer. The tests check it, and the player-facing text mostly matches it. The **combat and pressure half** does not hold together, and three shortcuts make the analyst game optional:

1. **The kill radius is far too large for the aiming model.** `killR = 20 km` (P, line 4). Against that, track errors are 1.5-5 km and the cone runs 0-24 km. As a result, **cone 0 is strictly best** (100% hit and about 150 expected HE damage per volley, against 42 at cone 8 and 6 at cone 24), and **the lead you choose barely matters** (lead from 0.5x to 1.1x of the best value gives the same damage). The help text says a tight cone "risks missing" (T:172). It does not.
2. **Enemy fire is about 15x weaker than ours.** Our HE does 40 x (1-d/R)^2 per missile. Theirs does `foeW` 3 x dmg x (1-d/R), linear (78-80). A perfect enemy volley does about 10 hull points to our 100. One of ours kills a destroyer or a cruiser.
3. **There is no pressure on a patient player.** Sit still with no analysts tasked, and in 0 of 60 hunts did any enemy ever become aware of us in 60 game minutes. Meanwhile 83% of enemy warships vent within 30 minutes, and we see 95% of those vents. A seen vent marks the ship hostile at 100%. A "patient" bot that waits for a vent, locks, pings for an instant solution and fires at cone 0 **wins 97% of hunts with 86 hull left**. It never uses an analyst. The trim_bot-style baseline wins 67-73%.

The player and the enemy share the global `P` object and several formulas. Some of that sharing is good: symmetric physics, the same venting visibility, the same visibility curve. But two decision-moment trims meant only for the player already leak into enemy behaviour (`sensRef`, `ventFull`). The enemy rules are a thin, separate code path that only looks symmetric: different heat formula, different damage formula, no range limit, no tools of its own. **Recommendation: yes, give enemies separate parameter blocks and an AI profile, and keep a small set of truly shared rules** (§4).

---

## 2. Mechanics table

| Mechanic | Status | Evidence | Recommendation |
|---|---|---|---|
| Passive reads, three channels | OK | `signal` 140-146, `obsRead` 147-150, `doRead` 158-165. Occlusion works only against a star backdrop (`backdrop` 118-121). Auto analysts read only `open` contacts (368); tasked ones read locked contacts and refresh the anchor (164). | Fine. Small point: auto analysts add **no** exposure (only tasked ones count, `fN`/`tN` 442), so free passive reads cost nothing. Consider a small idle glow per analyst. |
| Information rate `infoMult` | Concern | 135-139: our `s.me.sensor` x signal x `rangeF(d, R)` x block x hull. The floor `floorM` 0.12 holds even behind a planet. Hull <60 is counted **three times** for us: infoMult x0.85 (138), cadence `rate` x0.85 (357), solve T x1.15 (472). | Apply the hull penalty once, through `sysEff`. |
| `rangeF` / `sensRef` | Bug (semantic) | 125: `(1+(sensRef/R)^2)/(1+(d/R)^2)`. `sensRef` sets only the near-field level, so x1.15 gives **+3.2% at every range**. Scaling `R` by 1.15 instead gives +5.5% at 80 km, +11% at 120 and +19% at 200. `sens.long_ears` (tr:13) and M01 ("15% more range, sensRef x1.15") get about a fifth of the advertised effect. The same function also scales enemy detection (102) and how loud our actions are to them (`alert` 86). | Range trims should scale the **observer's** `R`. Give each observer its own `sensR` (§4). |
| Classification and noise | Concern | `classify` 424-438: a proper Gaussian likelihood with priors. `KMEAN.thermal.real = 0.9` (423), but a real ship's actual thermal signal is 0.8 + 0.2 x vis, about 0.82-0.88 (142). That biases the classifier toward "lure" (0.78). Reactor (1.0 vs 0.68) does the real separating. `classNoise` scales only the classifier's sd, not the observations. | Set the means from `signal()` (or compute them at load). Note in the M01 popup that "noise x1.5" widens the posterior, which mostly slows the call down rather than making it wrong. |
| Locking | **Bug / exploit** | `lockContact` 477-482: real or friend becomes `locked` with "Contact N locked"; a lure or ghost becomes `chasing` with "Hope it is a ship". **The message reveals the truth at once**, so locking is a perfect test that costs one chase. **Chase overwrite bug:** locking a second decoy while `s.chase` is active replaces `s.chase`, so the first decoy stays `chasing` forever (reproduced: still `chasing` after 8 min). It also counts as live in the rescan check (418). The chase is also "Four minutes of fuel" (381), but nothing moves and `P.chase` = 5. | Block a lock while a chase is running, or keep chase state per contact. Make the lock response the same for every kind, and let the truth come out through the solve (for example, a decoy's solve stalls with "trace will not resolve"). Fix the text. |
| Tracking and uncertainty | OK (one coupling) | 281-291, 166-171; tracktest covers it (coverage 0.92, cold targets lose certainty). Locked uncertainty comes from `spreadAt`, which includes `P.leadSpread` (171). So lead trims (`tac.*`, `pell.assist_lead` 0.65) **also raise certainty**, which stops `certBleed` (360) and pauses on uncertainty (475). That is why `pell.assist_lead` scores "STRICTLY BETTER". | Keep lead error out of position certainty: apply `leadSpread` only in `fanInfo`/`dmgEst`, not in `uncertainty`. |
| Firing solution / lead / spread | **Bug (balance)** | With `killR` 20 against a spread of 1.5-5 km: cone sweep on a solved target at speeds 0/3/6. Cone 0 gives 100% / 125-153 damage; cone 8 gives 100% / 40; cone 24 gives 62% / 6. Lead from 0.5 to 1.1 x `bestL` changes damage by 0-15%. `intercept` 180 **rises** with cone width (`win = 1+min(1,cone/4)`), so wide cones are also easier to intercept. Bots: cone 0 wins 73%, cone 8 67%, cone 16 44%. `suggestShort` 0.72 deliberately undershoots, and it costs nothing. | Cut `killR` to about 6-8 km for HE, or make missiles individually small (each missile's lethal radius about 1.5x the 1-sigma track error). Then cone width and lead become real choices. Make tight cones easier, not harder, to intercept. Re-run the tracktest and trim_bot baselines afterwards. |
| Missiles: HE / EMP / flare | Bug (text) | `WARHEAD` 212-215. EMP (`w` 14) and flare (`w` 12) **do** cause hull damage (396-398), but the reports say "no hull damage" (411-412, T:582), and either can cripple. EMP tip: "for a few minutes". In fact `empRecover` 0.02/min takes **35 game minutes** to recover from 0.25 to 0.95. `empRecover` is also our own recovery after melt (355). | Either set `w` 0 for EMP and flare, or say "light hull damage". Give the enemy its own EMP recovery (about 0.15/min, so "a few minutes" is true). |
| Missile reaction and dodge | Bug (small) | `reactOf` 224-227 is fine. But the sideways slip uses `b.hd`, the **spawn heading** (189, 392), and that is never updated after maneuvers. | Use `legVel(b, t)` for the heading. |
| Homing | OK | Raises how often the target notices the salvo (x1/`missQuiet` 0.08), and pull drops to 0.15 when warned (190, 393). A coherent trade. | Fine. |
| Coilgun | **Bug / exploit** | `fireClose` 497-505: a hit calls `cripple()` and **ignores HP** (a battleship included). It needs no solve and no tube, cooldown 2 min, 85% accuracy inside 18 km. A bot that closes and uses only the coilgun wins 56 of 60, hull 73. The help text says "needs a good track" (T:172). | Give it damage (for example 35-50 HP per slug, scaled by track error). Require at least a TRACK state. |
| Our launch signature | Concern | The launch is "detected" only when the main target is **missed** (416, 60%). A hit alerts only the target (410). | Roll launch detection on every volley, before resolving the hit. |
| Self-damage | Concern | Our missiles hurt us inside `selfRadius` 7 at a flat `selfDmg` 25 each (276-277, 385). The same warheads hurt targets inside `killR` 20. Enemy missiles hurt us inside `killR` 20 at about 3 each. That is three different damage models for one weapon. | One warhead function `blast(dmgW, R, d)` used for every ship. |
| Enemy awareness | Concern | `enemyAI` 102-104: gain = knowK x **vis²** x sensor x perf x rangeF. Decay only below vis 0.35. Our idle vis is about 0.085, so gain is about 0.002/min against decay of about 0.04/min. **We are never found while idle** (0/60). Vent, ping, spool or three tasked analysts get us found in 1-3 min. Gain is the same in every direction (no occlusion or backdrop for the enemy). | Fine as an abstraction. It needs a pressure term (search behaviour, §5 M-6). |
| Enemy fire | **Bug (balance) / text** | 70-75: aware ships fire at **any range** (no range check; a 200 km shot has `tf` 6.7 min with the same sigma). Damage 3 x dmg x Σ(1-d/R): expected **1.0 / 2.5 / 9.6** hull per volley at know 0.4 / 0.7 / 1.0 while we hold still. At v3, v5 or evading it is 0.8-7.3; at redline 4.4-9.6. Help text: "Moving off the aim point makes them miss; sitting still lets them find us" (T:174). Moving cuts damage by about 25% at best, and redline is *worse* (wider `ownSpeed` cone, but the 20 km radius still covers us). `foeDmg` 12 and `foeKill` 4 are dead. | Put enemy volleys through the same warhead model with `prof.dmg`. Add `foeRange` and sigma that grows with range. Shrink `killR` so dodging works. |
| Go quiet | **Exploit** | Quiet blocks **all** enemy fire (71) for 2.5 min every 10, and it **zeroes engine heat whatever the speed** (443: engine term `s.t < s.quietUntil ? 0`). Quiet plus redline gives exposure 0.004, vis 0.06, heat +0.003/min, while moving at 9 km/min. Quiet also doesn't block `fire()` or `retreat()`. So quiet, then spool, means a 2.5-of-3-min spool with no incoming fire. The text says "three minutes" (540), but `quietDur` is 2.5. | Quiet should drop the drive to creep (or keep the engine heat) and block launches. Enemies should keep firing at the **last known** position with sigma growing over time, not stop. Fix the text. |
| Alert from our actions | OK / Concern | `alert` 85-87 is weighted by `rangeF` and planet blocking. Ping 0.3, launch 0.15, coil 0.2, beam 0.1, bait 0.1. `pingAlert` is player-only in meaning, so the narrow-ping trim is fine. Every alert uses the enemy's `rangeF` with `P.sensR`, the same constant as our sensing. | Use the listener's `prof.sensR`. |
| Pings | **Exploit** | 328-336. A ping on an open contact: 3 rounds x 3 channels with weight 3 and boost ≥1. That reaches `readDone` at once and **ignores planet blocking** (boost floor 1). A ping on a **locked** contact sets `pingSolve` and **0.6 min later solve = 1** (358), skipping the whole solve timer. A ping-spam bot wins 89% in 16 min (baseline 67% in 32). The cost (target aware, alert 0.3) is small because enemy fire is weak. | A ping should refresh the anchor and add solve progress (for example +0.4 and `track` ≥ 2), not complete it. Respect `blocked()`. |
| Heat sink / venting / forced vent | Concern | `sinkStep` 528-539 and `start/stopVent` 519-527 are consistent with each other: the fill is the same exposure that drives visibility, vent drains 0.25/min, and forced vents keep the fins out until <0.8 and stop at 0.25. But a **never-vent bot is as good as a venting one** (69% vs 67%): a forced vent costs almost nothing beyond a manual one. Melt never kills (`Math.max(1, …)`, 533). Idle fill is about 0.012/min, so it takes about 80 game minutes to fill. | A forced vent should cost something (no retract until 0.25, a short sensor blackout, or a heat spike). If heat is meant to be the clock, raise idle drift or add the pressure from M-6. |
| Stealth state (Cold/Warm/Hot) | Concern | `stealthState` 207-211 uses `exposure().total`. It ignores `s.me.sig`, the spool (`ourVis` = 0.9 while spooling) and `s.lit`. So the HUD can show WARM while we are at 90% visibility. | Base the state on `ourVis(s)`, with the thresholds converted through `visOf`. |
| Speeds and posture text | Concern | POSTURE tip for evade: "about 20% louder than holding still" (5) is true only for the drift term (0.95/0.8). The engine heat of the chosen speed (v3 = 0.04) is about 2-3x the whole drift term. | Compute the tip numbers from `exposure()` (as `heatRate`/`visIf` already do for hovers). |
| Spool / retreat | Concern | 541-544, 354. Visibility 0.9 and heat 0.06 while spooling, movement x0.3. The message gives **real** minutes ("0.8 minutes", 543), while every other crew line uses game minutes. The UI tooltip uses `P.spool`, not `s.spoolMin` (T:316). It can be combined with quiet (above). | Use one time unit for crew speech. |
| Redline | OK | 339-347, 349-350; burntest passes. `noRedline` trim hook works. | Fine. |
| Dog-leg arenas | Concern | `opts.dog` (33, 40, 42, 354), `arenaPlan` 253-256. **The UI never passes `dog`, `warn` or `zone`** (T:223), so only trim_bot uses dog-legs. With `warn` 0.5, `know` starts at 0.35, which is over 0.33, so warned enemies are aware on the first tick and fire from anywhere. With `nreal` 0 the only exit is an 11.25 min spool. | Start warned enemies below the awareness threshold (for example `know = 0.2 + warn x 0.2`) and give them a search behaviour, not instant fire. |
| Hull damage and system efficiency | Concern | Player: `hurtPlayer` 220-223, `hullHit` 276-280 (duplicated text), `sysEff` (melt only) affects analyst rate only. Enemy: `perf` 217 (eff x HP<50% factor) slows fire, aim, detection and reaction. The two are asymmetric but both reasonable. | Unify into one `perf(ship)` that both sides use. |
| Difficulty / loadouts | Concern | `LOADOUTS` 12-19: "the same fields rule our ship and theirs". For the player only `sensor`, `sig` and `sink` are read (138, 128, 529); `crew`, `spd` and `dmg` are **dead** for us. Enemy loadout is uniform random from 6 (38), plus random `tempo` 0.7-1.5 (30). There is no difficulty setting. Lures and ghosts share the same `LOADOUTS[1]` object reference (38), which breaks if anything ever mutates `a.load`. | §4. |
| Friendlies | OK / limited | Classify as real (141), challenge and share reads (506-518), friendly fire counted (271). Enemies ignore friends completely (63, 93): they never target them, are never distracted by them, and friends never fight. `foes()` skips friends, so they never edge-bounce, and `fold` reflects them. | Fine for now. If allies matter later, they need an AI profile too. |
| Lures | OK | Fixed vis 0.55 (132), thermal 0.78, reactor 0.68 (142-143), bait alert (381). A destroyed lure shows a **"Derelict"** symbol (260). | Show debris for a destroyed lure. |
| Pell | OK | 372-380. Honest advice (198-206), heat and integration cost. | Fine. |
| End conditions | Concern | `win` (274), `breach`/`breach0` (hull 0 or spool), `jump` (dog). `'found'` is checked in `salvage` (246) but never set. There is no time limit. Hull 0 is "emergency breach drive engaged": an escape, not a death, so losing costs only salvage. Melt can't reach 0. | Decide whether hull 0 should cost more (crew injury, parts). Remove `'found'` or implement it. |
| Salvage | OK | 244-252. Half salvage on any non-win. Computed once. | Fine. |
| Tutorial | Concern | Mutates global `P.N`, `P.nlure` and `E.ANALYSTS` (tut:54-55). It expects surrender at Corvane HP ≤60% (tut:95). A cone-0 volley (about 150 against her 110 HP) can **cripple her before she surrenders**, so the scripted surrender then plays over a derelict. | Make Corvane immune below 60% (clamp HP), or force a cone floor in the tutorial. |
| Messages vs numbers | Concern | Quiet "three minutes" vs 2.5 (540). Chase "Four minutes" vs 5 (381). Rescan "five minutes" hard-coded (419). Ping "`P.pingSolve * 16` seconds" hard-codes 16 (331). Our fire report gives game minutes ("Impact in 3.4 minutes", 494), while enemy fire gives real seconds (74). Spool gives real minutes (543). Help text says enemies ping us (T:173-174), but **enemies never ping**. | Build all crew times from `P` with one formatter. Remove the enemy-ping text, or add enemy pings (§4 AI). |
| Dead code and params | Cleanup | Unused P keys: `foeKill`, `foeDmg`, `stages`, `squeezeAfter`, `squeezeRamp`, `telegraph`, `quietCancel`, `pingBump`, `pingBumpOther`, `driftMin`, `driftMax`. Also `STAGE_TEXT`, `bump()`, `planPos`, `TIER_HEAT` (comment says "when dock fitting exists"), `s.lit` for the player (never set), `hitProb`, the "4 missiles" comment (181, P.missiles = 6), and the `steer` falsy check (53: steer 0 counts as no steer). Maneuvers made by aware hunters (`steer` set) never produce the "changed course" report (53). | Remove them or wire them up. |
| Shared RNG | Concern | One stream `s.r` serves enemy decisions, our observation noise and blast scatter. Any change in what the player does (or a trim) shifts every later enemy decision. trim_bot verdicts at 30-60 hunts are mostly noise (for example `pell.assist_heat` comes out "STRICTLY BETTER"). `burntest` passes `{seed:5}` as the seed, which becomes 0. | Separate streams: `s.rWorld` (spawn, enemy AI), `s.rObs` (our reads), `s.rFx` (scatter). Use paired seeds and 240+ hunts in the bots, as decision_moments §1.8 asks. |

---

## 3. Player/enemy couplings

### 3a. Shared through `P` (a trim on these changes both sides)
| Parameter | Player use | Enemy use | Verdict |
|---|---|---|---|
| `sensRef`, `sensR` (`rangeF`) | our reads (138) | enemy detection (102) and hearing our actions (`alert` 86) | **Bug.** `sens.long_ears` and M01 boost the enemy too (only +3%, but wrong in principle). Should be per observer. |
| `ventFull` | our vent drain (456, 529) | enemy vent drain (95) | **Bug.** Measured: `heat.fast_fins` shortens enemy vents from 3.35 to 2.50 min (fewer chances for us); `heat.bigger_sink` lengthens them to 4.10. M07 and M08 both say "player only". |
| `ventSig` | our vis when venting (128) | enemy vis when venting (132) | Good: a symmetric rule. |
| `visDiv/visFloor/visCap` (`visOf`) | our exposure to vis (128) | `enemyAct` to vis (133) | Looks symmetric but isn't: the inputs come from different formulas that happen to share a scale. OK if documented. |
| `killR`, `alongStretch`, `missiles` | our volleys (183, 218) | enemy volleys (73, 78, 218) | Symmetric in intent. But a module like `m_charge` ("blast radius +4%") would change theirs too. Move to per-ship weapon profiles. |
| `empRecover` | our `sysEff` after melt (355) | enemy EMP recovery (101) | **Limit.** One number can't fit both. 35 min is fine for melt damage and wrong for EMP. |
| `litDecay` | `s.lit` (dead) | flare glow (101) | Harmless. |
| `knowK/knowDecay/knowLose`, `foe*`, `aimSig*`, `standoff`, `man*`, `enemyK`, `enemySink`, `missRate`, `missQuiet`, `evade*`, `homePull`, `homeWarned`, `coneStill` | none | enemy only | Fine, but they belong in an enemy/AI block. |
| `pingAlert`, `launchAlert`, `coilAlert`, `nearRange`, `bait` | how loud *our* actions are | read by enemy knowledge | Good: a property of our action. Keep it in the player block. |
| `manLoss`, `manWin`, `manPen` | our solve penalty when *they* maneuver | none | Fine (player-side). |
| `secPerMin`, `sub`, `arena`, `edge`, `halfLife` | both | both | Good: world rules. |

### 3b. Shared through formulas and objects
- `LOADOUTS` schema (12): good in intent ("same fields rule both"), but for the player half of it is dead (`crew`, `spd`, `dmg`). `s.me` is the **same object** as `LOADOUTS[0]` until `applyShip` copies it (tr:37-38). Lures and ghosts all reference `LOADOUTS[1]`.
- `perf()` (217) exists only for enemies; the player gets ad hoc `hull<60` and `sysEff`. Asymmetric. They should be unified.
- `visOf`, `rangeF`, `blocked` (122): good shared physics. Planets block both ways, as the help text says.
- Damage: three different formulas (ours 190/393, theirs 78-79, self 277). Should be one.
- Heat: ours = `sinkK` x exposure parts / sink (529); theirs = `enemyK` x `enemyAct` / (sink x `enemySink`) (95, 129). The help text says "Warships have the same sinks and the same problem" (T:169). They share the vent rate and vent visibility, nothing else.
- RNG `s.r`: shared by both sides (above).
- Global `P` mutated by trims (tr:33-35) and by the tutorial (tut:55). That is the root cause of the leaks.

---

## 4. Recommended architecture

### 4.1 Should enemies have separate logic and parameters? Yes.
Keep the **world rules** shared: physics, visibility curves, planets and stars, how warheads hurt, how venting shows. Give each **ship** its own numbers, and give enemies an **AI profile** for decisions. Player trims and decision moments then touch only the player's ship or one contact's record, and the enemy can never be changed by accident.

```js
const RULES = { arena, secPerMin, sub, halfLife, visDiv, visFloor, visCap, ventSig, edge, blockM, floorM, ... };   // never trimmed
const SHIP_DEFAULTS = {            // one block per ship, deep-copied per hunt
  sensor: { R: 120, ref: 40, mult: 1 },          // rangeF uses the OBSERVER's block
  sig: 1, hull: 100, crew: 1, spd: 1,
  heat: { fill: 0.7, sink: 1, ventRate: 0.25, forcedRetract: 0.8, forcedStop: 0.25 },
  weapon: { missiles: 6, killR: 8, dmg: 40, falloff: 2, tubes: 3, reload: 3, speed: 40 },
  recover: { emp: 0.15, sys: 0.02 },
};
const PLAYER = { ...SHIP_DEFAULTS, analysts: {...}, solve: { min, max, stale, leadSpread }, ping: {...}, quiet: {...}, spool: {...} };
const AI_PROFILES = {
  patrol:  { gainK: 0.4, decay: 0.05, lose: 0.15, aimSig: [36, 5], cone: 9, fireCd: 3.5, range: 160, standoff: 60, ventSafe: 0.82, searchRate: 0.0, pingAt: null, quietRespect: 0.5 },
  hunter:  { ..., searchRate: 0.6, pingAt: 0.25 },   // sweeps toward last noise, pings when unsure (makes the help text true)
  ambush:  { ..., gainK: 0.6, fireCd: 5, ventSafe: 0.6, holdFireUntil: 0.66 },
};
// per hunt: s.player.prof = clone(PLAYER); a.prof = clone(SHIP_DEFAULTS ⊕ LOADOUT[a.load]); a.ai = AI_PROFILES[...] ⊕ difficulty
```
Changes this implies:
- `rangeF(d, obs.prof.sensor)`: the observer's `R`. `alert(s, amt)` uses each listener's `prof.sensor`.
- One `blast(target, shooterProf.weapon, d)` for every volley, ours and theirs, plus self-damage.
- One `perf(ship)` (EMP efficiency, HP factor, melt `sysEff`), used for both sides. Hull <60 is applied once.
- Enemy heat uses the same `fill / sink / ventRate` fields; `enemyAct` stays the AI's "activity" input.
- Separate RNG streams (`rWorld`, `rObs`, `rFx`).
- `LOADOUTS` are templates only, always copied into `prof`.

### 4.2 Difficulty: six knobs that scale enemy competence only
Applied as multipliers on `a.ai` and `a.prof` at spawn. They never touch `s.player`.

| Knob | Drives | Easy | Normal | Hard |
|---|---|---|---|---|
| `notice` | `ai.gainK` (how fast they build a fix on us) | 0.6 | 1.0 | 1.5 |
| `memory` | `ai.decay` (inverse), `ai.lose` | decay x1.5 | 1.0 | decay x0.6 |
| `gunnery` | `ai.aimSig` and `ai.cone` (x) | 1.4 | 1.0 | 0.75 |
| `tempo` | `ai.fireCd` (x), maneuver interval | 1.3 | 1.0 | 0.75 |
| `punch` | `prof.weapon.dmg` (x), after unifying damage | 0.7 | 1.0 | 1.3 |
| `cunning` | `ai.searchRate`, `ai.pingAt`, `ai.quietRespect` (fire at the last known position while we are quiet), salvo reaction `missRate` | 0.3 | 0.6 | 1.0 |

Suggested ranges for tuning: `notice` 0.5-2, `memory` 0.5-1.5, `gunnery` 0.6-1.5, `tempo` 0.6-1.4, `punch` 0.5-1.6, `cunning` 0-1. The class and loadout mix (picket..brute) stays a separate "threat" roll from the arena or briefing, so difficulty means *how well they fight*, not *what they fly*.

### 4.3 Decision-moment trims under this architecture
- **Never write to a global.** Replace `HuntTrims.applyP(P, …)` with a modifier stack: `s.mods = [{ key: 'player.heat.ventRate', mul: 1/0.75, scope: 'vent', until: 'ventEnd' }, { key: 'contact.sensor.R', mul: 1.15, contact: 4 }, …]`. A getter `par(s, key, ctx)` returns base x the product of the matching active modifiers.
- **Scopes from §1.8:** `hunt` (M09), `contact` (M01: `readDone`, `classNoise`, `sensor.R`, `hunchCap`, `hunchTrack` on `a.trk`), `solution` (M03 and M04: `leadSpread`, `solveStale` on `a.trk`, cleared on refresh), `vent` (M07: player `heat.ventRate` and `ventAfterglow`), `spool` (deferred short-spool, `spoolTrip`).
- **Standing settings at 90% of the benefit:** `mul_eff = 1 + 0.9 x (mul − 1)` on the benefit term only; costs stay at full size.
- **Underway trims (M06, M08, M10)** go into `s.player.prof` at `newHunt` (`sig`, `heat.sink`, `noRedline`, `darkWindow`), never into `RULES` or `AI`.
- **Fix the doc's own numbers.** M01's "15% more range" must scale `sensor.R` (not `sensRef`, which gives +3%). M07 and M08's "player only" `ventFull` becomes `player.heat.ventRate`. M03's `leadSpread` should no longer feed `uncertainty()`.
- The trim_bot acceptance test (§1.8) needs paired RNG streams to mean anything at ±2 points.

---

## 5. Prioritized fix list

### Small (hours; local, low risk)
1. **Chase overwrite bug**: refuse a lock while `s.chase` is set, or keep the chase per contact (481).
2. Give lock the same response for every contact kind, so it no longer reveals the truth (480-481).
3. EMP and flare reports: "light hull damage", or set `w` 0 (411-412, T:582). Give enemies their own fast EMP recovery.
4. `reactOf` dodge direction: current heading, not `a.hd` (189, 392).
5. Quiet: keep engine heat (or cap speed at creep) and block `fire`/`retreat` while quiet (443, 490, 541).
6. A ping completes part of a solve, not all of it, and respects `blocked()` (332, 358).
7. Unify crew-message time units and wire the numbers to `P` (331, 381, 419, 494, 540, 543). Remove the "enemies ping us" help text (T:173-174).
8. `stealthState` based on `ourVis` (207-211).
9. Remove dead params and functions (list in §2). Fix the `burntest` seed. Fix the "4 missiles" comment.
10. Range trims scale `sensR` for our channels only (tr:13; decision_moments M01).

### Medium (a day or two; rebalance needed)
1. **Shrink `killR`** (about 6-8) and make tight cones easier to intercept. Re-tune `tracktest`, the cone dial and the tutorial (Corvane HP clamp).
2. **Unify warhead damage** for ours, theirs and self, with `prof.weapon`. Raise enemy lethality to match (it is about 15x weaker now). Give the coilgun damage, not an instant cripple.
3. **Enemy fire range and sigma that grow with range.** While we are quiet, enemies fire at the last known position instead of holding fire.
4. **Separate `ventFull` and `sensRef`/`sensR` per side** as a stopgap (`P.enemyVentFull`, `P.enemySensR`) until the full split.
5. Make forced vents cost something. Base stealth state on visibility. Count the hull <60 penalty once.
6. **Pressure on a patient player**: enemy search behaviour (sweep toward the last alert, the dead `squeezeAfter`/`squeezeRamp` revived as a slow drift in `notice`), plus enemy pings at moderate `know`. Target: an idle player gets found in roughly 15-25 game minutes on Normal.
7. A seen enemy vent marks it as a *warship candidate* (a strong thermal read), not 100% hostile, unless a tasked analyst is on it. That keeps the analyst game in the loop.
8. Separate RNG streams. trim_bot at 240 paired hunts.

### Large (the architecture)
1. Split `P` into `RULES`, per-ship `prof` (player and each enemy), and `AI_PROFILES` (§4.1). Port `foes`/`enemyAI` to read `a.ai`/`a.prof`, and our code to read `s.player.prof`.
2. A difficulty layer: six knobs applied at spawn (§4.2), exposed in the briefing and in `arenaPlan`.
3. A modifier stack for decision moments and standing settings (§4.3), replacing `HuntTrims.applyP`. Port `trims.js` entries to scoped modifiers.
4. Optional: give enemies the player's tools under AI control (quiet, ping, retreat), so "the same rules" is literally true.

---

## Method notes (probes run, not committed)
Scratch bots, all with seeds fixed per hunt (7000+i), nreal 1-3, 90 hunts each:

| Policy | Win % | Mean hull | Worst decile hull | Mean game min |
|---|---|---|---|---|
| trim_bot policy, cone 8 | 67 | 58 | 15 | 32 |
| same, cone 0 | 73 | 68 | 19 | 30 |
| same, cone 16 | 44 | 41 | 2 | 35 |
| auto analysts only, cone 0 | 70 | 68 | 17 | 63 |
| ping-spam, cone 0 | 89 | 68 | 30 | 16 |
| never vent | 69 | 61 | 15 | 33 |
| lock every contact (lock-as-test) | 64 | 54 | 12 | 23 |
| **patient: wait for a vent, ping, cone 0, quiet on incoming** | **97** | **86** | **57** | 28 |

Other probes:
- Idle player, 60 game minutes: 0 of 60 hunts with an aware enemy; mean sink 0.75.
- Enemy vents within 30 min: 133 of 160 ships; 126 of those seen.
- Coilgun-only rush: 56 of 60 wins.
- Quiet plus redline: vis 0.06 while moving at 9 km/min.
