# Hunt balance report (2026-11-02)

Tool: `node tools/balance_bot.js [hunts] [easy|normal|hard|all] [--diag] [--trims]`. Five scripted captains play the same paired seeds (hunt *i* uses seed 9000+*i* and 1 + *i* mod 3 warships), 240 hunts each, 90-game-minute cap (timeout counts as a loss). Only `win` (every warship crippled) counts as a win; a breach-drive escape is a loss. `BB_SEED=<n>` shifts the seed block.

| Strategy | What it does |
|---|---|
| camper | Never moves, never tasks an analyst. Waits for a vent to mark a ship hostile, locks it, fires at cone 0, goes quiet on incoming. |
| pingfire | Same patience, then pings the locked contact to hurry the solution and fires at cone 0. |
| pinger | Redline toward the nearest contact, pings everything, locks on thin odds (post > 0.45), fires at cone 0, coilgun in range. |
| reader | All analysts on one contact at a time, locks at post > 0.9, keeps an analyst on each lock, creeps in at 40% drive to ~55 km, picks lead and cone from the planner's own estimate, vents when nobody is looking, slips sideways off incoming fire, retreats under 15% hull. |
| random | Presses buttons with no plan. |

## Before (engine at `dc35b9b`, before this work), normal

| Strategy | Win % | 1 / 2 / 3 ships | Hull on wins | Dead % | Target | |
|---|---|---|---|---|---|---|
| camper | 5 | 13 / 4 / 0 | 100 | 32 | < 25 | ok |
| pingfire | 98 | 100 / 95 / 99 | 84 | 1 | < 60 | MISS |
| pinger | 100 | 100 / 100 / 100 | 74 | 0 | < 45 | MISS |
| reader | 86 | 96 / 89 / 73 | 86 | 1 | 65-85, hull 40-75 | MISS |
| random | 8 | 21 / 1 / 0 | 36 | 92 | < 20 | ok |

The camper was already weak before the work: without a tasked analyst a locked contact's position confidence falls below 0.6 and the solve pauses. It never fired. Pinging fixed that instantly, which is why pingfire and the pinger won nearly everything.

## After, normal (the default)

| Strategy | Win % | 1 / 2 / 3 ships | Hull on wins | Dead % | Timeout % | Mean min | Target | |
|---|---|---|---|---|---|---|---|---|
| camper | 2 | 5 / 0 / 0 | 100 | 74 | 24 | 70.5 | < 25 | ok |
| pingfire | 40 | 85 / 36 / 0 | 51 | 57 | 2 | 38.5 | < 60 | ok |
| pinger | 43 | 78 / 45 / 8 | 55 | 57 | 0 | 24.1 | < 45 | ok |
| **reader** | **70** | 98 / 75 / 38 | **69** | 12 | 1 | 38.5 | 65-85, hull 40-75 | ok |
| random | 1 | 3 / 0 / 0 | 28 | 94 | 5 | 45.1 | < 20 | ok |

Second seed block (`BB_SEED=31000`): camper 1, pingfire 41, pinger 38, reader 76 (hull 69), random 0. All within target.

Diagnostics (normal, `--diag`):

| Strategy | Our volleys connecting | Dmg per connecting volley (share of max HP) | Their volleys per hunt | Theirs connecting | Their dmg per connecting volley | Median min to first found |
|---|---|---|---|---|---|---|
| camper | 67% | 20.9 (25%) | 15.7 | 50% | 12.1 | 21.3 |
| pingfire | 63% | 20.1 (22%) | 8.2 | 83% | 12.2 | 10.2 |
| pinger | 74% | 26.8 (29%) | 8.3 | 76% | 10.0 | 0.9 |
| reader | 65% | 24.4 (25%) | 9.0 | 60% | 9.2 | 11.0 |
| random | 28% | 11.5 (15%) | 12.5 | 75% | 11.0 | 5.0 |

A typical warship takes about 4 connecting volleys (3 for a destroyer, 6-7 for the battleship). A clean enemy volley does 25-40 hull; the averages above include near misses. An idle player is found in about 21 minutes, and nobody is found in the first 4 (`tests/combattest.js`).

**Zero cone.** Cone 0 is no longer strictly best. On a fresh track it is usually still the right call (concentrate on a good fix). On a 3-minute-old track against an alert, gridded ship, cone 2-4 wins in most seeds. Every salvo now has guidance scatter (0.8 km + 3% of the flight distance), damage from several detonations on one hull saturates, and a dense salvo is easier for a scatter grid to cut.

## Easy and hard

| Strategy | Easy win % | Easy hull (wins) | Hard win % | Hard hull (wins) |
|---|---|---|---|---|
| camper | 3 | 100 | 1 | 100 |
| pingfire | 81 | 66 | 18 | 41 |
| pinger | 56 | 72 | 20 | 51 |
| reader | 95 | 82 | 41 | 63 |
| random | 1 | 56 | 0 | 0 |

Hard 1 / 2 / 3 ships, reader: 84 / 36 / 4. Easy, reader: 98 / 99 / 89. Passive reading is the strongest approach on every preset. On easy, patience plus pings also works (81%), which seems right for easy. On hard, three warships are close to unwinnable for every bot. If hard should stay a fair fight with three ships, soften `notice` or `punch` on the hard preset (`DIFFICULTY.hard` in the engine).

## Trims (cautious reader, normal, 240 paired hunts, against 70% with no trim)

| Trim | Win % | Δ pts | Trim | Win % | Δ pts |
|---|---|---|---|---|---|
| eng.run_hot | 75 | +5.0 | sens.narrow_ping | 70 | 0.0 |
| eng.quiet_bearings | 70 | +0.4 | tac.tight_drill | 79 | **+9.2** |
| eng.spool_tune | 70 | -0.4 | tac.judgment_lead | 71 | +0.8 |
| heat.bigger_sink | 70 | +0.4 | pell.assist_classifier | 68 | -2.1 |
| heat.fast_fins | 73 | +2.9 | pell.assist_lead | 72 | +2.1 |
| heat.cold_analysts | 70 | +0.4 | pell.assist_heat | 70 | +0.4 |
| sens.long_ears | 74 | +4.2 | | | |
| sens.snap_classifier | 68 | -1.7 | | | |

With paired streams these deltas mean something now. `tac.tight_drill` (a 20% faster solve for 15% more lead spread) is now clearly too strong, and `eng.run_hot` and `sens.long_ears` are on the strong side. The trim numbers are design data and were not retuned here.

## What changed, in tuning terms
- **Our weapon:** `killR` 20 → 7, `dispMin` 0.8 / `dispK` 0.03, HE `w` 40 → 46, saturation `RULES.blastSat` 1.6, reload 3 → 4 min, launch detection rolled on every volley (35%).
- **Enemy weapon:** the same warhead law, `dmgW` 31 per missile × loadout × `punch`, missile speed 30 → 40, `fireRange` 110, aim error × (0.5 + range/120), cone covers our motion (`coneMove`), `fireCd` 4.5 that shortens on a firm fix, `aimSigMin` 3.5.
- **Awareness:** a hit gives the enemy know 0.75, a ping 0.7, a salvo seen 0.5. Pressure clock: `searchStart` 7, `searchRamp` 12, `searchK` 0.05, decay relaxed as the search widens, `closeIn` steering, probes (`probeCd` 7, `probeGain` 0.22, scaled by cunning). While we are quiet, cunning enemies fire at our last-heard position with 4 km/min blur.
- **Ping:** adds 0.4 of a solution on a lock, and weight 2 per round on an open contact (a ping no longer completes a read by itself).

## Not hit, or worth watching
- The pinger's margin is thin on the main seed block (43 against < 45; 38 on the second block).
- Reader 3-ship wins are 38% on normal and 4% on hard. Multi-ship hunts are the hard case.
- The reader's hull on wins is 69 on normal. 32% of its wins (53 of 168) still end at 90% hull or more: a lone ship caught unaware often dies before it answers.
