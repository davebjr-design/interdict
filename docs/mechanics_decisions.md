# Decision moments in the engine, and the rulings behind them (2026-11-15)

Implements M01-M04, M07 and M09 as engine triggers with engine consequences, answered through the station layer (calls M01-M09, verbs `m_tight` / `m_loose`), and the underway moments M06, M08, M10 as prep that is passed to `newHunt`. Source: `docs/decision_moments.md` (the design) and `docs/audit_playability.md` findings 20 and 21 (the contradictions, resolved below). Code: `web/hunt_rt_engine.js` (`MOMENTS`, `MOMENT_RULES`, `PREP`, `momentCheck`, `momentPing`, `moment`, `prep`), `web/station_model.js` (rows M01-M09), `web/station_adapter.js` (`applyMoment`). Tests: `tests/moments_engine_test.js`. Acceptance bot: `sim/moment_accept.js`.

## Rulings (audit findings 20 and 21)

**One rule for what tight and loose mean.** *Tight = the drilled procedure: no ceiling, a small cost in speed or reach. Loose = a faster first answer with a ceiling you can see on the button.* Every moment follows it:

| | Tight (default) | Loose (a gamble with a visible ceiling) |
|---|---|---|
| M01 hunch call | full processors, noise x0.85, certainty uncapped | call 40% sooner, certainty capped at 70%, noise x1.5, hunch lock |
| M02 ping | full ping | narrow ping: glow x0.5, alert x0.6, two read rounds, certainty capped at 70% |
| M03 first solution | solution time x0.85, lead at the default (no hand-tuning bonus) | lead error x0.7, goes stale 35% sooner, overcorrects x1.4 if the target manoeuvres |
| M04 stale solution | rework it (re-solve x0.85) | fire on the old numbers: valid 50% longer, cone floor 4 |
| M07 vent | vent now at the standard rate | hold for a quiet moment (ceiling 92% sink), then fast fins x0.75 and 0.8 min afterglow |
| M09 analyst load | throttle: heat x0.8, reads 15% slower | flat out: reads 10% faster, heat x1.25, cut for a minute at 85% sink |

Where the two docs disagreed, the moments doc wins, because it is the one with numbers and the one that is built:

1. **Classification speed and the firing cone.** `command_model.md` s2 says tight classifies x0.85 and loose x1.10, and that loose can tighten the cone further. `decision_moments.md` says the opposite on both (loose is a faster first call, and loose cannot tighten the cone below its default). The rule above settles it: loose is faster to *answer* and has a *ceiling*; the cone floor is a ceiling. The command-model table needs the matching edit (not mine to make: `docs/` outside `mechanics_*` is another agent's).
2. **Thresholds.** The bands with hysteresis from the command model are the thresholds, not 30/70: enter committed tight at 35 or below and leave above 43; enter committed loose at 65 or above and leave below 57. In the engine the band arrives as `momentCheck(s, { drilled })` (the adapter derives it from `cfg.command`). Only M01 uses it now (tight in a committed tight band: `readDone` x0.85, "Already running, Captain").
3. **Very tight.** The loose option is never hidden (the captain can always give the order). Only the *volunteered third option* is hidden. The third options (Castellan's "by ear", Pell's classifier assist, Dace's "behind the nearest body") are **not built** here: they need the band and the integration tier, which live in the hunt page's `DemoState`, not in the engine.
4. **Is pinging tight or loose (finding 21)?** Both, at different levels. **Whether to ping at all** is a judgment call: `decision_cards.json` tags `ping` as `style: any` (the doc retag is the narrative agent's). **How to ping**, once the captain has pinged, is procedure against shortcut: full ping is TIGHT, narrow ping is LOOSE. M02 fires only when the captain has already ordered a ping and a hostile may be listening, so it never asks "should we ping"; Abara's objection to a ping in the cards and her cheer for the full ping in M02 are about different decisions.

## Frequency and triggers (engine, `MOMENT_RULES`)

At most 3 moments a hunt; one per officer except Abara (two); each moment once; nothing in the first 1.5 game minutes; 4 minutes between two moments; none while a spool is running or ordered; never in the tutorial (`s.tut`). Collisions go to the moment that protects the ship: M07 > M04 > M02 > M03 > M01 > M09 (the loser is dropped for this hunt, not queued).

| Moment | Raised when |
|---|---|
| M01 | one channel on an open contact is at 60% of `readDone`, at least 3 contacts are open, none is locked, and the contact is still in doubt (certainty under 85%) |
| M02 | the adapter is about to ping and a real hostile has `know >= 0.3`. The ping is **held** until the captain answers (`momentPing`); an unanswered M02 sends the ping as asked after 1.2 game minutes |
| M03 | the first lock of the hunt, on any contact (so the trigger does not leak whether it is real) |
| M04 | a locked contact's solution has gone stale, a tube is ready, the magazine is not empty and position confidence is at least 0.5 |
| M07 | the sink is at 65% or more, no vent is running, nothing is inbound |
| M09 | the sink is at 50% or more and rising, with two or more analysts tasked |

The call times out after 14 s and runs its default, **tight**: the drilled procedure is what the crew do when the captain says nothing. Nothing pauses; the hunt keeps running while the call is up.

## Engine consequences (all player-only)

Effects go through a per-contact modifier (`a.pm`, read only for our own reads and solutions: `readDone`, `classNoise`, `sensR`, `cap`, `confCap`, `trackCap`, `solveT`, `leadSpread`, `solveStale`, `coneMin`, `overcorrect`) or through `applyPlayer` (the one door for player-only modifiers). Nothing touches the shared rules or an enemy. M07's fast fins are restored when that vent ends. M09's cut drops every analyst's task for one game minute.

## Command style

Tight -3 / loose +3 (M04: -4 / +4), the sum capped at 8 points a hunt. The engine returns the nudge from `E.moment(...)`; the adapter keeps the running total in `A.style` and clamps it. It is hidden from the player; the out event `{type: 'moment', nudge, react, look, trust}` carries it for the host.

## Underway moments (prep)

M06 (bearings), M08 (reserve tanks) and M10 (leg plot) are choices made before the hunt: `E.prep(opts, { M06: 'loose', M08: 'tight' })` returns `opts` for `newHunt` with the player-only modifiers applied through `applyPlayer` and the summed nudge in `opts.prepNudge`. M06 loose: drive noise x0.8, top speed x0.95, no redline. M06 tight: redline heat x0.8. M08 loose: sink x1.2, vent x1.2 slower, forced vent at 90%. M08 tight: vent x0.9. M10 loose: dark window x0.7; M10 tight: arrival hazard x0.85. M05 (short spool) stays shelved.

## Acceptance (sim/moment_accept.js, `docs/decision_moments.md` s1.8.6)

`node sim/moment_accept.js --n 480 --only M03,M07`. The steady bot plays the same paired seeds three ways: no moment, always TIGHT, always LOOSE (M02 uses pingfire, since it only fires on a ping). Normal difficulty, entries mixed. Win % and hull on wins (mean of the wins and the 10th percentile, so lower p10 = a worse worst decile). The standard error of a win rate over 240 paired hunts is about 3 points, over 480 about 2, so differences of 1 to 3 points are at the edge of what the bot can resolve.

| Moment | n | off | tight | loose | loose - tight | mean of the two vs off | p10 hull (loose / tight) |
|---|---|---|---|---|---|---|---|
| M01 | 240 | 60.4 | 60.4 | 59.6 | -0.8 | -0.4 | 61 / 60 |
| M02 (pingfire) | 240 | 47.5 | 45.0 | 45.0 | 0.0 | -2.5 | 26 / 26 |
| M03 | 480 | 64.0 | 59.8 | 63.1 | +3.3 | -2.5 | 65 / 58 |
| M04 | 480 | 64.0 | 64.2 | 63.5 | -0.6 | -0.1 | 62 / 62 |
| M07 | 480 | 64.0 | 63.3 | 65.2 | +1.9 | +0.3 | 64 / 61 |
| M09 | 240 | 60.4 | 59.6 | 62.9 | +3.3 | +0.8 | 60 / 67 |

Reading it:

* **Neither side wins on average**: for five of six moments the mean of tight and loose is within 2.5 points of playing without the moment, and no moment moves the hull on wins by more than a point. M03 is the one that is off (tight costs the steady bot 4 points): a faster solution makes a bot that fires on the first solved bearing fire on thinner data. A captain who waits for the better position would not pay that, so M03 stays as designed and is flagged for a human playtest.
* **Loose wins a little more** on M03, M07 and M09 (+3.3, +1.9, +3.3), in the 2-to-6 point band the design asked for. On M01, M02 and M04 loose and tight are indistinguishable at this sample size (single-contact effects of a point or two).
* **The worse-worst-decile test is not resolved**: p10 differences go both ways within the sample noise (M09 shows the designed shape, loose 60 against tight 67; M03 and M07 show the opposite by 3 to 7 hull points). The sim cannot yet tell the two apart on spread. The visible downside is on the button (the ceiling, the overcorrection, the forced vent), which is the design's real guard.
* **M02 and M09 notes**: M02 is nearly neutral for a bot that pings a locked contact once it is already known (pingfire pays 2.5 points either way for the held ping, a one-step delay that changes nothing but the path); its value is in the exposure, where a hunter is listening. M09 tight was retuned from analyst heat x0.7 to x0.8 because both options beat no moment by about 3 points.
* **M05, M06, M08, M10** have no sim here: M05 is shelved, and the underway three are prep modifiers (the tests check the numbers).
