# Systems contract: engine events, station calls, doctrine and numbers (2026-11-14)

Phase 1 companion to `docs/station_model.md`. This is the **contract between the hunt engine and the station layer**: what the engine says, which station hears it, what the CO is asked, what happens if they say nothing, and the numbers that are decided versus still guesses. It is a living table, not a manual. Code: `web/station_model.js`; tests: `tests/station_model_test.js`.

Status tags: **[have]** the engine already produces it; **[new]** needs an engine change; **[tune]** a number to be set by playtest.

## 1. How the layer plugs into the engine

- The engine already funnels almost everything through `report(s, who, text, kind, urgent)` into `s.log` (kind: info, good, bad, danger; `urgent` flag; speaker = a crew name). **The station layer reads that log** (`Stations.ingest(s.log, from)`) and classifies each entry into a call, so it works with no engine edit on day one.
- Structured events [new] are better than parsing text: add `evt(s, type, data)` beside `report` for the events marked [new] below. The model accepts both (`Stations.onEvent({type, ...})`).
- The model never touches engine state. It returns **orders** (`{verb, args}`); an adapter (`web/station_adapter.js`, later) maps them onto engine calls (`E.fire`, `E.setRoute`, `E.startVent`, ...). That keeps the model testable headlessly and reusable for the walk demo.
- Time: the engine clock is **game minutes** and one minute is **16 real seconds** (`RULES.secPerMin`). The station layer runs on **real seconds** and takes `secPerMin` from the engine.

## 2. Priority and default rules (apply to every row)

| Priority | Name | CO sees | If unanswered |
|---|---|---|---|
| 1 | Routine | Log only (no chip, no ring) | Nothing |
| 2 | Notable | Spoken line, chips, no timer | Crew run the default after a long patience (about 45 s) or when superseded |
| 3 | Urgent | Spoken line, chips, visible timer | Default runs when the timer ends (about 12-20 s, by call) |
| 4 | Critical | Interrupts speech, short timer | Default runs fast (about 6-8 s) and other timers shorten |

- **Default** = what a competent crew does on their own. It always exists, so ignoring a call is never a crash, but it carries a **cost of default** (shown in the table).
- **Batching:** same-station priority 1-2 calls within 4 s merge ("Three new returns, S3 to S5").
- **Stand by** (Backspace) extends a priority 2-3 timer by the officer's **patience** once (tight crew 12 s, loose crew 6 s; tune).
- **One officer, one call at a time:** an officer busy speaking or acting delays their next call (Abara holds three stations, so she is the bottleneck by design).
- **Autonomy** (per station): Auto raises only priority 3+ and open decisions; Supervised turns consequential actions into recommendation calls (default = hold); Hands-on routes calls to the player's station screen and the officer only acks.

## 3. Event to call catalog

`Source` is today's engine hook. `Opts` are the chips (the first is the crew's recommendation unless marked). Defaults act as if the CO said nothing.

### 3.1 Sensors (Quill; Dace and Castellan feed readings)
| # | Event | Source | Pri | Line (example) | Opts | Default | Cost of default |
|---|---|---|---|---|---|---|---|
| S1 | New contact appears | [have] log "Contact n: thermal bloom / faint thermal" | 2 | "New thermal return, Sierra N." | Isolate and classify; Mark and continue; Ignore | Mark and continue | Slower identification |
| S2 | Reading firms (reactor, occlusion) | [have] "Contact n: ..." | 1-2 | "Sierra N firming: reactor signature." | none (log) | n/a | none |
| S3 | Contact identified (class known) | [have] class text | 2 | "Sierra N is a warship." | Track her; Keep scanning | Keep scanning | none |
| S4 | Track off after course change | [have] "changed course, track off" | 2 | "Lost her bearing. Rescan?" | Rescan; Hold | Hold | Stale solution |
| S5 | Track lost (aged out, ghost) | [new] | 2 | "Lost contact on Sierra N, marking as thermal ghost." | none | mark ghost | none |
| S6 | Enemy pinged (we hear it) | [have] "just pinged us" | 3 | "Sierra N just pinged. She is hunting." | Go quiet; Run; Hold | Hold | Higher exposure |
| S7 | Our ping done | [have] "Active ping on contact" | 2 | "Ping result: fresh fix on Sierra N." | none | n/a | none (the emission already happened) |
| S8 | Ping offered by doctrine | [new] | 3 | "I can ping Sierra N. She will know." | Ping; Probe salvo; Not yet | Not yet | Slower fix |

### 3.2 Fire control and weapons (Abara)
| # | Event | Source | Pri | Line | Opts | Default | Cost |
|---|---|---|---|---|---|---|---|
| W1 | Bearing-only track, range unknown | [new] (TMA) | 2 | "Bearing only on Sierra N. I need a leg to range her." | Give a baseline; Hold silent; Wait | Hold silent | Fuzzy range, no shot |
| W2 | Solution ready | [have] solution bar | 2-3 | "Solution good on Sierra N. Tubes ready." | Fire (preset); Probe; Hold | Hold | Solution may go stale |
| W3 | Solution stale | [have] stale flag | 2 | "Solution on Sierra N is going stale." | Refresh; Hold | Hold | Poor odds |
| W4 | We fired (confirmation) | [have] ours event | 1 | "Salvo away, N missiles." | none | n/a | none |
| W5 | **Incoming missile (V-track)** | [have, bug] enemy launches are not announced (`foes()` comment swallows the code); [new] fix first | **4** | "Vampire, bearing B, impact in T." | Go active; Stay cold | **Stay cold if PD not armed, else Go active** (see s5) | A false Go active reveals us; a late one is a hit |
| W6 | Hit report (ours landed) | [have] "hull destroyed", ours event | 2 | "Hit. Sierra N is adrift." | none | n/a | none |
| W7 | Friendly fire / hit on us | [have] hurtPlayer, fratricide | 3-4 | "Hull integrity N percent." | none (status) | n/a | n/a |
| W8 | Magazine low | [new] | 2 | "Eight salvos left." | none | n/a | n/a |
| W9 | Probe reaction seen | [new] | 2 | "She lit her point defence. She is real." | Mark hostile; Keep probing | Mark hostile | none |

### 3.3 Helm and engineering (Abara, Castellan, Dace)
| # | Event | Source | Pri | Line | Opts | Default | Cost |
|---|---|---|---|---|---|---|---|
| H1 | Burn will exceed sink | [new] (Newtonian burn preview) | 3 | "Burn runs hot. Recommend shorter." | Burn as ordered; Shorter burn; Abort | Shorter burn | Less delta-v |
| H2 | Course change breaks wire | [new] | 3 | "Turning now cuts the wire." | Turn anyway; Hold course | Hold course | Delay |
| H3 | Burn complete / maneuver complete | [have] | 1 | "Maneuver complete. Coasting." | none | n/a | none |
| E1 | Running hot (sink over threshold) | [have] heat state change | 3 | "Running hot. Anything listening can hear us." | Vent now; Cut thrust; Hold | Cut thrust | Lost speed |
| E2 | Forced vent imminent | [new] (sink 100%) | 3 | "Forced vent in N seconds." | Vent now (controlled); Hold | Vent now | none |
| E3 | Vent started / ended | [have] | 1 | "Venting." | none | n/a | none |
| E4 | Drive redline offered | [have] redline burn | 2 | "Redline available." | Redline; No | No | none |

### 3.4 Damage control (Fenwick, Pell) and comms
| # | Event | Source | Pri | Line | Opts | Default | Cost |
|---|---|---|---|---|---|---|---|
| D1 | Hull below 60 percent | [have] hullWarned | 3 | "Hull at N. Sensor mounts fouling." | Save the sink; Save the drive; Seal and sacrifice | Save the sink | Drive degraded |
| D2 | Two systems hit | [new] | 4 | "Fire in stores and breach aft. Which first?" | Save the sink; Save the drive | Save the sink | The other burns |
| D3 | Hull failed (breach drive) | [have] over=breach | 4 | "Emergency breach drive." | none | n/a | n/a |
| C1 | Ally link offer | [new] | 2 | "An ally offers a link. It is an emission." | Accept; Decline | Decline | none |
| C2 | Patron or Pell speaks | [new] | 2 | per narrative | per scene | none | none |
| C3 | Pell offers to take a station | [new] | 2 | "I can run the sensors. It would be seen." | Do it; Not yet | Not yet | none (Tally unchanged) |

### 3.5 Enemy-behaviour calls (Dace's old lines, re-voiced to Sensors)
| # | Event | Source | Pri | Opts | Default |
|---|---|---|---|---|---|
| X1 | Contact noticed us | [have] 'has noticed us' | 3 | Go quiet; Evade; Hold | Go quiet |
| X2 | Contact closing, fix tightening | [have] st===2 | 3 | Evade; Hold; Ready salvo | Evade |
| X3 | Firm solution on us | [have] st===3 | 4 | Evade; Fire first; Hold | Evade |
| X4 | Contact lost us | [have] 'lost us' | 2 | none | none |
| X5 | Contact vented | [have] 'folded its fins' / vent seen | 2 | Mark hostile | Mark hostile |

## 4. Doctrine (standing rules the crew follow without asking)

| Doctrine | Choices | Default | Used by |
|---|---|---|---|
| Rules of engagement | Hold fire; Fire on solution; Free | Hold fire | Weapons |
| Point-defence posture | Off; Armed; Active-on-vampire; Active-on-any-launch | Active-on-vampire | Weapons |
| Ping policy | Never; Ask; On ambiguity | Ask | Sensors |
| Vent policy | Manual; At 90 percent; At 80 percent | At 90 percent | Thermal |
| Damage priority | Sink; Drive; Weapons; Hull | Sink | Damage control |
| Reporting | Terse; Standard; Verbose | Standard | All |
- Doctrine is set between hunts and changeable in a hurry through presets (Ambush, Snap shot, Probe, Saturation, and the quiet or loud posture packages).
- Enemy crews use the same doctrines. **Crew quality** (`cunning`, `notice`, `crew`) picks how tightly they follow them: a veteran holds point defence cold until sure; a green crew lights up at a shadow.

## 5. Point defence, probes and the V-track (rules)

- PD states: **Off**, **Armed** (cold, slow, near-silent), **Active** (bright emission, all sensors see it). Active is a **visibility event** (adds to exposure and can alert hunters).
- Armed to Active takes **2 s** [tune]; an Active PD intercepts with the existing `intercept(a, cone)` grid factor; Armed with no warning uses `hot = 0.3` (existing unaware-target factor).
- A **V-track** carries `{bearing, eta}`. Default for the CO's PD choice at priority 4: if the doctrine is Active-on-vampire, go Active at `eta <= 12 s` [tune]; otherwise stay cold.
- **Probe salvo** (feint): small salvo (1-2 missiles) aimed at a region; costs real missiles from the magazine; produces a launch alert (weight about 0.15, existing); the target's reaction (PD up, burn, vent) is returned as event W9. A veteran crew may not react.

## 6. Numbers

| Item | Value | Status |
|---|---|---|
| Magazine | 10 salvos of 6 = **60 missiles** | decided (Dave) |
| Salvo parameters | pattern (spread, snake, circle, line); run-to-enable (dark time); homing on/off; wire on/off; warhead kind | decided shape, values [tune] |
| Run-to-enable range | 3-30 s dark run | [tune] |
| PD arm time | 2 s; PD detect range scales with `grid` (none 0, light 1, heavy 2) | [tune] |
| Active ping reach | alert radius = **2x** detection radius | [new] |
| TMA baseline | a velocity change of at least 0.5 km/s over 10 s resolves range uncertainty by half | [tune] |
| Ghost fade | 30 s without a reading | decided (from the brief) |
| Call patience | tight crew 12 s, loose 6 s | [tune] |
| Call rhythm target | at most 1 priority 3+ call per 20 s on average in a normal hunt | decided target |
| Order latency | officer reaction 1.0-2.5 s (by skill) plus queue delay | [tune] |

## 7. Engine changes this contract needs (smallest first)

1. Fix `foes()` so enemy launches are announced (W5). **Blocking for V-tracks.**
2. Add `evt()` structured events for the [new] rows; keep `report()` text as is.
3. Active ping alert reach 2x detection.
4. Missile stock (`s.mag`) with decrement on fire and probe.
5. Point-defence state and posture on the player and the enemy.
6. Anisotropic range uncertainty and baseline (TMA) when Newtonian motion lands.
7. Newtonian burn preview (H1, H2) when the helm is reworked.
Items 1-5 can be done without the scope view; 6-7 follow the hunt rework.

## 8. Acceptance tests (what `tests/station_model_test.js` checks)

1. A call has a default and an expiry; an unanswered priority 3+ call runs its default and records its cost.
2. Priority order, batching, stand-by (once), and critical interrupt behave as in section 2.
3. One officer cannot raise two calls at once; the second waits (Abara bottleneck).
4. Autonomy: Auto raises only 3+ and open decisions; Supervised raises recommendations; Hands-on routes to the player.
5. Order lifecycle: issued, acked, executing, reported, with the right officer and latency.
6. Mapping: real engine log lines map to the catalog rows above (spot checks on S1, S6, X1, X3, E1, D1).
7. **Rhythm:** a headless full hunt on all-Auto produces at most 1 priority 3+ call per 20 s on average and no flood (more than 3 calls in any 5 s).

## 9. Implementation notes (2026-11-14)
- `web/station_model.js` implements s2-s4: priorities, batching, **cooldown** (the same row about the same contact is said once per 15-25 s), and an **attention budget** (urgent calls draw from a bucket of 2 that refills one per 20 s; with none left a priority 3 call is demoted to a notice). The budget is what makes the rhythm target hold by construction. Priority 4 always passes.
- Auto settles non-open priority 2 decisions by doctrine (state `settled`, an `info` event so the UI can still voice a short report); open decisions and priority 3+ are raised.
- Measured on six real engine hunts (all-Auto, nobody answering, 24 game minutes each): worst 0.73 urgent calls per 20 s, at most 3 raised calls in any 5 s, about 16 raised calls per hunt, with about 190 routine readings logged and not raised.
- Still to do from s7: engine fixes 1-5, then `web/station_adapter.js` to turn orders into engine calls.
