# Interdict: status and test-run guide (2026-11-02)

## 1. Big picture

| Track | State |
|---|---|
| Hunt engine (`web/hunt_rt_engine.js`) | Reworked and balanced. Enemy ships have their own parameter block; easy/normal/hard knobs touch enemies only; trims touch only the player's ship. Targets met on normal (`docs/balance_report.md`). |
| Hunt console (`web/hunt_rt.html`, `design/hunt.html`) | Fully playable. Tutorial hunt (`?tutorial=tern`) is unfailable and isolated (no trims, no Pell, no saved state). |
| Decision moments | M01 (hunch call) live as a pause popup. M02-M09, standing settings, underway moments: designed, not built. |
| Walk demo (`design/proto_iso.html`) | Playable: name entry, Tern briefing, tutorial hunt, Ames beat, airlock, boarding, Corvane's ship (12 rooms), red key, dock inspection. |
| Pell | Gated until the wiring scene (1.6b) has been played; debug trigger stands in for the scene. |
| Narrative | Act 1 scenes written and reviewed (docs/scenes/). No dialogue runner yet, so only the wiring panel and some briefing text are playable. |
| Art | Placeholder/prototype only. 17 Meshy credits left. |
| Underway layer, save/load | Not built. Demo state lives in localStorage (`interdict.state`). |

## 2. What is playable for a test run

**A. Walk demo (whole flow)**: open `design/proto_iso.html` (published artifact is the same file).
1. Enter a name (12 chars). 2. Tern control room briefing, then Ostrow's tutorial hunt. 3. Surrender, back on the Tern, junction beat with Ames, airlock. 4. "Begin boarding / Look around first", walk Corvane's ship (tracker "Walk the ship n of 12"). 5. Control room: red key pedestal; choose "[Debug] Play the wiring scene (1.6b)" or the "Debug: play wiring scene" button. This sets `pell.wiring_seen` and the hidden `tally.trace`. 6. "Dock at the next station" rolls an inspection. 7. "Run a hunt" now shows Pell controls and may fire M01.

**B. Plain hunts**: `web/hunt_rt.html` or `design/hunt.html`. Query options: `?difficulty=easy|normal|hard`, `?tutorial=tern`. Keys: 3 = Target view; FIRE SALVO needs two clicks.

**C. Tests (all pass at last run)**: `node tests/*.js` (engine, walk_demo, pell_gate, dock_inspect, moments_test), `python3 tests/smoke4.py`, `python3 tests/hunt_pages.py`, `python3 -I tools/narr_check.py`, `node tools/balance_bot.js 240 normal`.

**Not playable yet**: the P3 standoff, P4 blessing, Act 1 scenes (no Ink runner), moments M02-M09, hunt-witness detection, underway events, save/load.

## 3. Things to look for when testing
- Does the tutorial teach (highlights visible, fire step clear)? Can you get stuck?
- Hunch-call popup: does it feel fair, fire at sensible moments, and are the labeled effects clear?
- Hard preset and 3-ship hunts are too punishing (reader wins 4% on hard); aggressive-pinger margin is thin (43% vs 45% cap); `tac.tight_drill` trim is +9 points and too strong.
- Open audit items: 7, 8, 14-18, 21, 22, 25, 27 (`docs/audit_playability.md`). Item 17: Ostrow's "She asked for you, by name" line.
- Writing flag: Castellan's "Atta girl." assumes a woman captain.

## 4. Decisions awaiting Dave
1. Logging ruling: (a) current, no declare option, or (b) option 4 declarable with `tally.declared +1`. Built to (a); swap is one commented line.
2. Retune trims and soften hard preset?
3. Next build priority: Ink dialogue runner (unlocks Act 1 scenes), more decision moments, or underway buildout (distress call, Pell shifts, mice, quartermaster storylets, pitch seed material).
4. Confirm canon: fire control is not connected to Abara's module.
