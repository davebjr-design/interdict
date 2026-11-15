# Brace: the crew's body state as a game rule (2026-11-15)

Design: `docs/station_screens.md` s8.5 (approved). Code: `web/hunt_rt_engine.js` (state machine, load, penalties, injuries), `web/station_adapter.js` (order, H4 gate, doctrine, hands-on block), `web/station_model.js` (calls H4, H5, D4), `web/annunciator.js` (BRACE, UNSECURE, CREW INJ lamps). Tests: `tests/brace_test.js`. Times below are game minutes; one game minute is 16 real seconds (`RULES.secPerMin`).

## The state: `s.brace`

`'free'` | `'bracing'` | `'secure'`. The field name is stable (`web/cic3d` reads it; `E.setBrace(s, on)` is its entry point). Also on the hunt state: `s.braceBy` (`'co'` or `'auto'`), `s.gLoad` (g now), `s.unsecure` (load at or over the threshold, or a hit due inside the brace time, and the crew not secure), `s.crew` (below), `s.braceAuto` (`'vampire'` default, `'all'`, `'off'`), `s.braceRule` (false switches every penalty off).

* **free to bracing**: `E.brace(s, true, who)`. Pell calls "All hands, brace." It takes `me.braceTime` = 0.4 min (about 6.4 s), varied 85 to 115 percent by the hunt's own stream.
* **bracing to secure**: after that time; event `brace_complete` `{ by }`.
* **any state to free**: `E.brace(s, false)`, instant ("Stand easy").
* The engine does not stop a burn that is ordered unbraced: it makes it cost something (below). The adapter is where the order is held and asked about.

## Load, and what needs a brace

`GLOAD` is a stub for Newtonian thrust: load by speed rung (20% 0 g, 40% 0.05, 60% 0.15, 80% 0.35, 100% 0.5, redline 1.5), hard evasion 0.6, the jump spool 0.8, an impact 1.5. The threshold is `me.gThresh` = 0.3 g. `E.braceNeeded(s, 'redline' | 'burn' | 'evade' | 'spool')` returns `false` or `{ why, g }`, and is false once the crew are secure.

## What it costs to be unsecure under load (`s.unsecure`)

| Effect | Value |
|---|---|
| Work rate (`bodyRate`: analysts, reads) | x0.75 loaded and not secure (`rateLoaded`); x0.9 while bracing (`rateBracing`); x0.95 secure (`rateSecure`) |
| Injury hazard above 0.5 g (redline 1.5 g, spool 0.8 g, evasion 0.6 g) | `1 - exp(-0.5 x (g - 0.5) x dt)` per step, from the hunt's own stream `s.rBrace` |
| A hit that lands (`impactInjury`) | 60% chance (30% while bracing, scaled by damage) of one injury, two if the hit was 30 or more; a secure crew are never hurt |
| The `unsecure` event (once per episode, 2 minutes apart) | raises call H4 |

Secure is not free: braced crew work at x0.95 (Auto crew keep working from the couches) and **cannot do Hands-on station actions** (the adapter blocks them while braced; `A.handsOnBlocked(station)`).

## Injuries: `s.crew`

`s.crew = { Quill, Abara, Castellan, Dace, Fenwick }`, each `{ inj, at, treatUntil }`. An injury (`injury` event `{ officer, station, cause }`, raises call D4) makes that officer work at 60% (`E.crewEff(s, officer)`; the adapter turns it into slower acks: the station model's reaction time is divided by it) and has a station effect until treated:

| Hurt | Effect |
|---|---|
| Abara (attack) | firing solutions take x1.4 as long (`hurtAbara`) |
| Quill (sensors) | the crew's reading rate x0.8 (`hurtQuill`) |
| Dace (thermal) | vents drain x0.8 as fast (`hurtVent`), reading rate x0.9 (`hurtDace`) |
| Castellan (engineering) | the jump spool takes x1.3 as long (`hurtSpool`) |
| Fenwick (damage) | treatment of anyone else takes x1.6 as long |

`E.treat(s, officer)` (call D4 chip "Send Fenwick") clears it after one game minute; `treated` event. Nobody dies of an injury; the cost is a slower, worse crew for a few minutes, which is what the rhythm of a hunt can absorb once and not three times.

## Auto brace and doctrine

* **Engine default (`braceAuto: 'vampire'`)**: the crew brace on their own when an enemy volley is in the air (`s.inc`), and stand easy a game minute after the load and the threat have gone. Surprise is the cost: a volley fired from close range gives less time than the brace takes, so the hit lands on a crew who are still bracing.
* **`'all'`**: the crew also brace whenever the load is over the threshold. **`'off'`**: only on order.
* **Adapter doctrine** `cfg.brace` / `M.setDoctrine({ brace })`: `'ask'` (default: `braceAuto = 'vampire'`; a hard order with the crew free is held and raised as H4), `'auto'` (`braceAuto = 'all'`: the crew brace first, no call) or `'manual'` (`'off'`).

## The adapter

* `A.order('helm', 'brace', 'Brace', { on: true })` straps in; `{ on: false }` releases. Brace on an order from the CO; a station set to Hands-on is refused while braced (`{ type: 'blocked' }` out event).
* **Gate**: an `evade`, `redline` or `spool` order with the crew not secure is held. The adapter raises **H4** "Crew not secure for the burn. Brace first?" with chips **Brace first** (the default after 8 s; the crew brace, then the order runs), **Go now** (runs now: injury risk, no second H4) and **Cancel**. While bracing the order waits for secure and is dropped after 1.5 game minutes if the crew never get there.
* **H5** "Brace complete. Crew secure." (priority 1) from `brace_complete`; **D4** "<Officer> is hurt" from `injury`.
* H4 and the decision moments have their own caps and do not spend the attention bucket; `stats().urgent` leaves them out (`stats().own` counts them).

## Annunciator

BRACE (advisory while bracing or secure), UNSECURE (caution under load with the crew not secure, "load 1.5 g, crew not secure"), CREW INJ (caution while anyone is hurt). `web/cic3d` needs nothing more: it reads `s.brace` and calls `E.setBrace`.

## Balance effect (sim, normal, 240 paired hunts)

| Bot (normal) | Before brace | **With brace** (1 / 2 / 3 ships) | Hull on wins |
|---|---|---|---|
| steady | 65 | **60** (95 / 64 / 23) | 88 |
| reader | 63 | 59 (95 / 60 / 23) | 88 |
| pinger | 57 | **53** (93 / 51 / 14) | 72 |
| pingfire | 48 | 48 (85 / 48 / 10) | 61 |
| camper | 3 | 3 | 100 |
| random | 2 | 2 | 33 |

Easy: steady 68 (was 68), pinger 65 (65). Hard: steady 53 (54), pinger 32 (34). The harness bots use the engine's default (`braceAuto: 'vampire'`: the crew brace on their own for a volley) and never order a brace; the steady bot treats the injured (`E.treat`), the others do not.

How the 5-point cost to the competent bot splits (n = 240, normal): with every brace penalty off it wins 65 (identical to the run before the brace code, so the state machine itself changes nothing); the loaded and unsecure rate alone costs about 4 points, the bracing and secure rate alone about 5, injuries alone none. A hunt-to-hunt difference under 4 points is inside the noise of 240 paired hunts (the same what-if run twice with a different single constant moved the competent bot between 57 and 61).

The aggressive pinger loses 4 points: it redlines with the crew free all the time, but its play is limited by pings and the coilgun, not by reading rate, so the brace rule barely touches it. **The brace mechanic is a cost for a human player who burns without bracing, not a balance lever for a bot that does not read calls.** If the pinger must be clearly weaker than the competent bot, the lever is its approach, not the crew's body: for example hunters that close faster on a ship that is making noise (the noise of a redline burn is already in the exposure model).
