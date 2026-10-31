# Mini-missions: department trims (2026-10-30)

Dave's direction: short jobs that are purposeful, fill underway time, and let the player tune the ship. Each is department-specific and is a trade: better at one thing, worse at another. Data: `data/mini_missions.json`. Fits the existing mini-mission tracker (`game_flow.md`: calls become tracker entries) and the command model (`command_model.md`).

## 1. What a mini-mission is
- **An officer pitches a trim.** It shows on the tracker as a call ("Engineering: Castellan has an idea about the bearings"). Go to the station and the officer makes the pitch, one other officer objects, and the captain decides: the decision grammar in miniature.
- **A trim is a trade on real hunt numbers.** Benefits and costs are multipliers on the hunt engine's parameters (`web/hunt_rt_engine.js`, `P.*`) or on named effects. Example: *Long ears* raises passive range by 15% (`sensRef` ×1.15) and slows classification by 12% (`readDone` ×1.12).
- **One trim per department at a time.** A new trim replaces the old one. Trims persist across hunts until replaced; at a dock, a trim can be made permanent with the right part, or cleared.
- **They take time.** Most cost one or two watches of a leg (the `watches` field). A leg has about three watches free, so the player chooses which jobs to do on the way, and travel stops being dead time.
- **They're purposeful.** Mission briefings and captains'-bar rumours hint at what's coming ("the target runs cold", "the field's crowded with lures"), so a player who listens can tune for the next hunt.

## 2. How well a trim lands
Each job is a delegated check: officer's rating in the department × 1.5 + noise − difficulty, the same bands as `sim/delegation_sim.py`:
| Band | Result |
|---|---|
| Great | full benefit, half the cost |
| Fixed | as listed |
| Unchanged | no effect; the watch is spent |
| Worse | the cost without the benefit, until fixed |
The command model shapes it:
- **Trust** changes steadiness: a loyal officer's trims land more reliably; a shaken one's go wrong more often.
- **Command style** changes which trims get pitched. Loose ships hear the unorthodox ones (tagged `style: loose`, e.g. *Snap classifier*, *Lead from judgment*, *Feast night*). Tight ships hear the drills (*Drill the solution*). Very tight crews stop pitching loose trims at all; very loose crews sometimes botch a step ("nobody checked").
- **Arcs:** some jobs touch a secret. Castellan's engine trims are next to the padlocked panel, so ordering someone else to do one is a trust and clue moment.

## 3. Pell's assists: the temptation
Once integration passes a tier, Pell offers an **assisted** version of some trims: the benefit with no performance cost. The cost is integration (always a human turning the key) and the trust of the officer whose job Pell just did. That puts the AI dial in the most ordinary moment of the game: tuning the ship. (`pell_assists` in the data: classifier, lead tables, heat.)

## 4. The first set (17 trims, 6 departments)
| Dept (officer) | Trim | Better | Worse |
|---|---|---|---|
| Engineering (Castellan) | Run her hot | speed +10% | heat build-up +15% |
| | Quiet the bearings | drive noise −20% | no redline; top speed −5% |
| | Tune the breach spool | spool time −25% | louder and hotter while spooling |
| Thermal (Dace) | Plumb the reserve tanks | sink size +20% | venting 20% slower |
| | Fast fins | venting 25% faster | fins glow 30 s after retracting |
| | Cold analysts | analysts add 30% less heat | reads 15% slower |
| Sensors and ECM (Quill) | Long ears | passive range +15% | classification 12% slower |
| | Snap classifier *(loose)* | reads 20% faster | more wrong calls |
| | Narrow ping | ping heat and alert roughly halved | two read rounds instead of three |
| Fire control (Abara) | Drill the solution *(tight)* | solution time −20% | lead 15% less accurate |
| | Lead from judgment *(loose)* | lead error −30% | solutions go stale 25% sooner |
| | Mix the salvo | an EMP and a flare in each salvo | two fewer high-explosive warheads |
| Navigation (Abara) | Quiet approaches | arrive at dog-legs 15% less visible | transit 10% longer |
| | Short legs | transit 15% shorter | less warning of what's waiting |
| Quartermaster (Fenwick) | Ration the galley | +10% funds per leg | everyone's trust −1 per leg |
| | Feast night *(loose)* | everyone's trust +2, style +2 | funds −60 |
| | Trade at the buoy | a spare part | a hidden find in the Tally; patron risk |

## 5. How they connect to the story
- **Every pitch is in the officer's voice** and every objection comes from someone with a reason (Dace guards the heat, Quill guards the reads, Abara guards redline, Fenwick counts meals). Lines are in the data file.
- **They feed trust and style quietly:** choosing Quill's drill over Castellan's hunch is a small statement about how you run the ship.
- **They're where the Tally bites** (Trade at the buoy) and where the audit will look.
- **They can carry clues:** a job near the panel, a reading during Long ears that catches the signal, a buoy trader who mentions a ship that drops food at dead coordinates (Fenwick).

## 6. Wired (2026-10-31)
- **Engine:** `web/trims.js` maps each trim onto `HuntRT.P` and our loadout; five small hooks were added to the engine (`classNoise`, `pingRounds`, `noRedline`, `ventAfterglow`, `leadSpread`). The hunt page reads active trims from `?trims=` or localStorage `interdict.trims` and shows them in a corner badge.
- **Walk demo:** officers pitch their department's trims when you talk to them; one trim per department, stored in localStorage; a button runs a hunt with them.
- **Not wired yet:** *Mix the salvo* needs per-missile warheads (the console picks one warhead per volley today). Navigation and quartermaster trims are underway effects for the story layer.

## 7. First bot check (`node tools/trim_bot.js 240`, 240 hunts per row: plain, redline-burning, and dog-leg spool arenas)
```
trim                       win  1-ship 2-ship  hull   time  wrong   verdict
(none)                      88   94      82      71   25.4   0.03    
eng.run_hot                 88   96      80      70   24.8   0.03    trade
eng.quiet_bearings          86   93      78      73   25.5   0.04    trade
eng.spool_tune              88   94      82      71   25.3   0.03    STRICTLY BETTER
heat.bigger_sink            91   95      87      72   25.5   0.03    trade
heat.fast_fins              88   96      79      70   25.5   0.03    strictly worse
heat.cold_analysts          91   98      85      77   26.3   0.03    trade
sens.long_ears              89   96      83      72   24.7   0.03    STRICTLY BETTER
sens.snap_classifier        85   93      77      70   25.4   0.00    strictly worse
sens.narrow_ping            88   94      83      71   25.3   0.03    STRICTLY BETTER
tac.tight_drill             87   96      78      72   24.8   0.03    trade
tac.judgment_lead           88   95      81      71   25.1   0.03    STRICTLY BETTER
pell.assist_classifier      87   95      79      74   24.3   0.03    trade
pell.assist_lead            89   94      83      72   25.1   0.03    STRICTLY BETTER
pell.assist_heat            89   94      84      72   25.4   0.03    trade
```
**Reading it:** differences of 1-3 points are noise at this sample size, so no trim dominates yet. Three show as "strictly better" only because the bot never pays their cost. It rarely pings (*Narrow ping*), is never under fire while spooling (*Tune the breach spool*), and doesn't exploit stale solutions (*Lead from judgment*). The Pell assists are better by design: their cost is integration and trust, not performance. **Next:** teach the bot to ping and to spool under fire, then re-run after the hunt balance pass.
