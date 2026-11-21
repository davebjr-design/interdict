# Tactics balance probe (2026-11-20)

Harness: `node sim/tactics_probe.js [--n 120] [--bots steady,dodger,quiet,camper] [--set player.x=...]` (scripted captains from `sim/hunt_bots.js`; `dodger` flies the crazy-Ivan dogleg Evade when a volley is inbound, `quiet` goes dark when fired on, `camper` never moves). 120 paired hunts, 1-3 warships, standard entry, normal difficulty.

| Bot | Win % | Dead % | Game min | Hull lost | Propellant (t) | Peak g-fatigue | Dry tank % |
|---|---|---|---|---|---|---|---|
| steady (old dodge: reroute) | 57 | 16 | 39 | 50 | 124 | 0.00 | 11 |
| dodger (dogleg Evade) | 62 | 18 | 35 | 47 | 136 | 0.03 | 12 |
| quiet (go dark) | 60 | 23 | 35 | 50 | 19 | 0.00 | 0 |
| camper (sit still) | 3 | 78 | 68 | 88 | 0 | 0 | 0 |

Before the 1 g retune (commit f4d4779) steady scored 57 % win, 7 % dead, 60 t propellant, 0 % dry.

## What it says
- **Nothing degenerate.** Sitting still loses (3 %). The three competent styles land within a few points of each other (57-62 %, within noise at n=120: about +/-5). Hunts last 35-39 game minutes (about 9-10 real minutes), not seconds.
- **Dodging helps a little**: +5 points of wins and 3 less hull lost, for 12 t more propellant. **Going dark is nearly as good for 7x less propellant.** Quiet is the cost-efficient answer to a volley; the dogleg is what you do when quiet fails.
- **The 1 g retune doubled propellant use** (60 t to 124 t for the same bot) and 11 % of steady hunts now run the tank dry (0 % before). Decision for Dave: bigger tank, a lower default rung, or accept it as a resource pressure.
- **g-fatigue barely accrues in realistic play** (peak 0.03; even at 5x rate 0.16, at 12x 0.46 with no change in win rate). Evasion bursts are short and flips are brief, so the mechanic is decorative as tuned. Options: raise gFatK, charge fatigue for flips, or accept it as a cost only for sustained redline and crash turns.
- **Dogleg size**: 4 km detour/10 ahead/150 m/s cruise cost 200 t and ran the tank dry 62 % of the time; 3/6/60 costs 136 t at the same win rate. Shipped as the default (`PLAYER.evadeOffKm/evadeAheadKm/evadeCruise`).

## Not testable here (needs playtest)
Whether dodging feels tense and legible, the stealth-turn mechanic (not built), enemy-side evasion limits (enemy g and crew not modelled), and break-contact after detection (needs the per-elbow turn style and a hunter that searches the growing area).
