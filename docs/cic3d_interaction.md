# 3D CIC: playing it (hunt3d.html)

The captain (CO) sits at the map table. Crew are **Auto** by default. Per station you can switch **Auto / Supv / Hands-on** in the WHO IS DRIVING panel (top left, or the COMMS screen). Hands-on orders execute at once; Auto/Supervised orders wait for the officer's reaction time (adapter orders).

## Controls
Mouse: click a contact (hologram blip, CONTACTS/WATERFALL row, TMA dot) to select; right-click a blip for the radial order menu; click soft keys on any CRT; click toggles, keypad and the FIRE box on the 3D hardware; wheel = out one tier; hover for tooltips (also on annunciator lamps).
Keys: F1 room, F2 sensors, F3 attack, F4 systems, Q/W/E screens, Esc out, Tab/Shift-Tab next contact, C classify, L lock/track, P ping, O probe, X rule out, R refresh, M mark, U quiet, D PD toggle, V vent, H hold still, Z evade, F lift guard / fire, B brace, Space ack annunciator, 1-3 answer a call, Backspace stand by, T time x1/2/4, K mute, ? key list.
Brace: the engine owns `s.brace` ('free'|'bracing'|'secure', docs/mechanics_brace.md). B straps in through the helm order (`A.order('helm','brace')`), B again stands easy (instant). While the crew are braced the adapter blocks Hands-on orders (`A.handsOnBlocked`): the UI toasts it, the order bar stays live for Auto stations. An H4 'Crew not secure' call appears as a normal call card. If the engine has no `s.brace`, the local B state (free -> bracing 2.5 s -> secure) is the fallback.

## FIRE is guarded
Lift the red guard on the 3D fire box (or the guard on the ENGAGE screen, or the order-bar LIFT GUARD / F), then FIRE. The guard closes 12 s after it lifts or after a launch. PD toggle has its own guard. Armed buttons on screens need a second click within 3 s.

## Hardware map (named, via `CIC.hwPx(name, part)`)
`attack.fire` (guard, btn), `attack.tg` (levers t0..t4, guards g0..), per-bench keypads, trackballs, joysticks, rotaries (preset, speed), gauges (live: sink, hull, mag), annunciator ack. Screens: contacts, waterfall, tid, tma, engage, payload, thermal, damage, comms, painted in `live_screens.js` (`LS.regs` hit regions: `CIC.regionPx(screen, id)`).

## Order mapping
classify/lock/refresh/mark/ping/probe/rule/quiet/fire/PD/preset go through `StationAdapter.order`. The adapter has no verbs for speed, dismiss, still/evade and vent stop, so `interact.js` calls the engine directly through a delayed local queue (instant when Hands-on). Move these into the adapter when its owner adds verbs.

## Tutorial
`hunt3d.html?tutorial=1[&return=page]`: seed 4242, one hull among decoys, a guided box (Ostrow) with the next order-bar key pulsing; ten steps from select to fire. Simplified port of P2 (no scripted decoy reads, no surrender cutscene). `TUT3D.skip()` is the tester Skip.

## Audio
`audio.js`: WebAudio cues, caution/warning tones on annunciator onset, bracing klaxon, hit/thump on shakes, crew and captain lines via `web/voice.js` using voice_clips when the exact line exists. `?mute=1` or K.

## Tests and shots
`node tests/cic3d_smoke.js` plays select -> lock -> solve -> guard -> fire with the mouse and asserts engine state (needs playwright, swiftshader). `node tests/cic3d_shots.js '[{"name":"x","q":"shot=attack","wait":1500}]'` writes tests/shots/x.png. URL flags: `scale=` (render scale), `mute=1`, `seed=`, `shot=room|sensors:i|attack|systems|brace`.

## GLB swap
Unchanged: slots keep their hit boxes (`HITM`) when a GLB replaces the fallback; list the slot in `assets/props/glb/manifest.json` (currently `{}`).

## Known gaps
Swiftshader renders ~2 fps here (shared CPU), so frame rate was not verified above 30 on real hardware; use `?scale=` if slow. Section tier text is legible only at screen tier for small fonts. No free-roam, no crew speech animation, tutorial is not the full P2 script.
