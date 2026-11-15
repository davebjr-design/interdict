# Hunt balance pass (2026-11-15)

Scope: the engine and the scripted captains only. Harness: `sim/balance_hunt.js` with bots in `sim/hunt_bots.js` (copied from `tools/balance_bot.js` and extended for the 60-missile magazine, so the harness does not move when `tools/` does).

```
node sim/balance_hunt.js --n 240 --entry mix --diff all            # the table below (about 10 minutes on 2 cores)
node sim/balance_hunt.js --n 240 --diff normal --bots steady,pinger --set warhead.he.w=95 --set hp.scale=0.8   # a what-if
node sim/balance_hunt.js --dog --n 200 --sus 0.5                   # dog-leg arenas: spool at once versus clear the hunters
HUNT_ENGINE=/path/to/engine_snapshot.js node sim/balance_hunt.js ...   # run against a frozen copy of the engine (before/after)
```

Paired seeds: hunt *i* uses seed 9000+*i*, 1 + *i* mod 3 warships, and the entry (standard, dark, fast) cycles every three hunts, so every bot plays the same 240 hunts. A **win** is every warship crippled. A breach-drive escape, a death and a 90-game-minute timeout all count as losses. The engine is deterministic per seed, so a table is reproducible to the digit.

Bots: **camper** (never moves, never tasks an analyst), **pingfire** (camper plus a ping to hurry the solution), **pinger** (redline at the nearest contact, pings everything, locks on thin odds), **reader** (the old competent bot, written for unlimited ammunition), **steady** (the competent bot for the magazine: reader plus ammunition discipline, i.e. a stricter hit-chance gate as the salvos per surviving ship fall, plus the coilgun to finish a hull at close range), **random**.

## Diagnosis

The 60-missile magazine (10 salvos of 6, decided) was added after the last balance pass and nothing was retuned. Before this pass a competent bot won 32% of normal hunts. Nearly all of its losses were **dry losses**: the HE magazine was empty at the end of a lost hunt (67% of all normal hunts, against a 32% win rate). An unlimited-ammunition bot needs about 11.8 salvos per win and the magazine held 10, 8 of them high-explosive. Bot-side fixes (homing missiles, closing to a shorter stand-off, a stricter fire gate) moved the win rate by about 2 points, so the lever is the engine, not the bot.

## What changed (all in `web/hunt_rt_engine.js`)

| Constant | Before | After | Why |
|---|---|---|---|
| `warhead.he.w` (standard warhead damage) | 46 | 110 | A hull takes fewer salvos, so a win fits the magazine. |
| `HPMAX` destroyer / cruiser / battleship | 70 / 110 / 180 | 56 / 88 / 144 | Hulls x0.8 (with the warhead change: about 2 to 3 hits to cripple one ship, not 4 to 5). |
| `AI.dmgW` (enemy warhead damage) | 31 | 38 | Shorter fights must not make us safer: hits on us hurt a little more. |
| `PLAYER.closeDmg` (coilgun) | 40 | 32 | Scaled with the hulls so the coilgun is still a finisher, not a second main gun. |
| magazine: HE / EMP / flare | 48 / 6 / 6 | 54 / 3 / 3 | HE is what wins hunts; EMP and flare are rare tools. Still 60 missiles. |

The sweeps that picked these (steady bot, normal, n=240): HE 80 / 95 with hulls x1.0 gave 53 / 56%; with hulls x0.85 55%; with hulls x0.8 and HE 95, 63%. Enemy damage 40 / 50 with HE 95 and hulls x0.8 gave 62 / 61% and cost only hull, not wins. HE 110 with enemy damage 38 was the choice that held the competent bot at 65% while leaving the aggressive bot below it.

## Before and after (n = 240 per bot, entry mix)

Win % (1 ship / 2 ships / 3 ships), hull on wins:

| Bot | Easy before | Easy after | Normal before | **Normal after** | Hard before | Hard after | Target (normal) |
|---|---|---|---|---|---|---|---|
| steady | 38 | 68 | 32 (79/18/0, hull 92) | **65** (96 / 69 / 29, hull 87) | 30 | 54 | 60-70 |
| reader | 37 | 66 | 32 | 63 (96 / 61 / 30) | 30 | 53 | below steady |
| pinger | 33 | 65 | 35 | 57 (93 / 56 / 23) | 23 | 34 | clearly lower |
| pingfire | 24 | 50 | 24 | 48 (88 / 48 / 8) | 15 | 26 | clearly lower |
| camper | 3 | 5 | 2 | 3 | 1 | 2 | under 25 |
| random | 1 | 6 | 0 | 2 | 0 | 1 | under 20 |

Normal after, the loss anatomy for the competent bot (share of all hunts): deaths 14%, breach-drive escapes 19%, timeouts 3%; the HE magazine was empty at the end of 30% of hunts (67% before). Mean salvos per win 4.9; about 23 missiles left over on a win. The bot connects (the main target takes damage) on 54% of volleys. Hull on wins 87%: the fights are short, which is what the retune bought.

Reading the table:

* **A competent bot wins about two in three normal hunts** (96% against one ship, 69% against two, 29% against three). Three warships is meant to be the hard case.
* **Passive play is clearly worse**: the camper never wins a real fight (3%), and the patient pinger (pingfire) wins 48%, 17 points under the competent bot.
* **The aggressive pinger is the open item**: 57% against 65% before the brace rule, 53% against 60% with it. Rushing and pinging everything still works too well on one ship (93%). The brace rule does not close the gap (docs/mechanics_brace.md: the pinger is limited by pings and the coilgun, not by reading rate), so the open lever is how hunters answer a noisy approach.
* **Easy is only slightly easier than normal** (68 / 65). That is a preset question for Dave: easy mostly changes how fast enemies find us, not how hard the fights are.
* **Hard is no longer punishing**: 54% (it was 30%, where a good bot lost most of its hunts to an empty magazine).

## After the brace rule (docs/mechanics_brace.md)

The brace mechanic (crew state, rate and injury penalties, auto-brace for a vampire) lands after this retune and costs the competent bot about 5 points at normal. Final numbers with the brace rule in (engine at the commit that adds it), normal, 240 paired hunts:

| Bot | Win % | 1 / 2 / 3 ships | Hull on wins | Target |
|---|---|---|---|---|
| steady | **60** | 95 / 64 / 23 | 88 | 60-70, at the lower edge |
| reader | 59 | 95 / 60 / 23 | 88 | |
| pinger | 53 | 93 / 51 / 14 | 72 | clearly lower |
| pingfire | 48 | 85 / 48 / 10 | 61 | clearly lower |
| camper | 3 | 10 / 0 / 0 | 100 | under 25 |
| random | 2 | 6 / 0 / 0 | 33 | under 20 |

Easy: steady 68, pinger 65. Hard: steady 53, pinger 32. A competent human who braces on the crew's calls and treats the injured will sit where the steady bot sits. Loss anatomy for the steady bot at normal: deaths 11%, breach-drive escapes 25% (the bot breaks off when the magazine is dry with ships left), timeouts 4%.

## After the seen-volley rule, brace timing and stun (docs/mechanics_brace.md)

Three changes land together: a volley is only a vampire when it is **detected** (the launcher is on our plot at launch, or the seeker lights at `AI.seekerActive` = 12 units, about 5 s out), the CO braces when a seen volley is within braceTime x 1.5 (about 10 s) of impact instead of at launch, and a hit on an unsecure crew may **stun** officers for 6 to 12 s (injuries kept for big hits only). The bots read only seen volleys. Normal, 240 paired hunts, entry mix (`HUNT_ENGINE` frozen snapshot, `node sim/balance_hunt.js --n 240 --entry mix --diff normal`):

| Bot | Win % | 1 / 2 / 3 ships | Hull on wins | Dead % | Was (brace rule only) |
|---|---|---|---|---|---|
| steady | **60** | 96 / 64 / 21 | 86 | 13 | 60 (95 / 64 / 23) |
| reader | 58 | 96 / 59 / 20 | 87 | 15 | 59 |
| pinger | **54** | 90 / 60 / 13 | 71 | 46 | 53 (93 / 51 / 14) |
| pingfire | 45 | 86 / 40 / 9 | 63 | 53 | 48 |
| camper | 3 | | 100 | 78 | 3 |
| random | 3 | | 41 | 95 | 2 |

Deaths and hull by ship count (n = 80 each): **pinger** wins 90 / 60 / 13, **dead 10 / 40 / 88 percent**, hull on wins 85 / 56 / 48; **steady** wins 96 / 64 / 21, dead 1 / 10 / 28, hull on wins 95 / 84 / 57. The pinger is **not tuned**: it still loses nearly nine hunts in ten against three warships. Stuns hit the bots almost never (0.00 to 0.06 per hunt): a seen volley gives the crew about 10 s, a launch is seen at flight times of 10 s and more, and once braced the crew stay secure for the rest of the fight.

**The seen-volley rule changes nothing in this harness, because the rule rarely bites here.** In 90 diagnostic hunts per bot, 100 percent of enemy volleys (611 pinger, 653 steady) were fired by a contact that was open or locked on the plot, so every one was seen at launch; the harness bots never rule a contact out and a firing contact is marked hostile and reopened. The seeker route fires only for a launcher that was ruled out or lost. The upper bound, from `--set rules.launchDetect=0` (no launch is ever detected, every volley is first seen about 5 s before impact, 4.8 to 5.1 s measured): pinger **55** (95 / 59 / 13, dead 44), steady **62** (96 / 73 / 18, dead 16); stuns rise to 0.09 (pinger) and 0.63 (steady) per hunt and 30 percent of steady's hits (8 percent of pinger's) land on a bracing crew. So even the worst case moves the bots by two points, because the dodge still has five seconds and a crew that has braced once stays braced.

## Dog-leg arenas: spool at once versus clear the hunters

`--dog --n 200 --sus 0.5` (hunters present half the time):

| Strategy | When hunters are present: hull on exit | close (hull < 60) | dead | jumped out | hostiles left behind | minutes |
|---|---|---|---|---|---|---|
| spool at once | 46 | 64% | 10% | 90% | 1.67 | 11 |
| clear first | 73 | 26% | 18% | 1% | 0.01 | 19 |

Where nobody is present both strategies leave at full hull (11 and 17 minutes). **Spool** is the safer way to leave (10% dead against 18%) but it costs hull (46 against 73) and leaves hunters to warn the next sector; **clear** is cleaner and slower and kills us more. Neither dominates, so no lever was moved. This closes the "spool vs clear" open item in `docs/balance_report.md`.

## Open items for Dave

1. Easy preset: nearly the same as normal. Does easy want fewer ships, a smaller enemy warhead, or more missiles?
2. Hull on wins is high (87). If wins should leave more scars, raise `AI.dmgW` (hull only; wins were flat from 38 to 50).
3. Deaths are 14% and breach-drive escapes 19% of competent-bot hunts at normal: a third of hunts end with the player running. Is that the intended texture, or should a win be easier to finish once the first ship is down?
