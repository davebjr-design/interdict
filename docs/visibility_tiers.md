# Visibility tiers: signature and sensors in shared categories (2026-11-22)

Dave's brief: a ship below a detection threshold is not on the scope at all, so a new contact is an event, and a launch is a spike that either upgrades a ship we already hold or creates a new contact we have to interpret before the missiles go active. Every ship tracks visibility levels and sensor capabilities in the same categories.

## Categories (signature on one side, sensor on the other)
| Category | Signature (what it gives off) | Sensor (what reads it) | Range factor |
|---|---|---|---|
| thermal | heat and light: drive burn, venting, firing, hot sink | IR / optical array | 1.0 |
| em | radio, radar, power pulses: chatter floor, pings, hails, active point defence, a launch pulse | spectrum analyzer, gauss meter | 1.6 |
| reactor | neutrino / radiation line, scales with power and activity | neutrino counter | 0.67 |
| optical | hull shadow against a bright backdrop (eclipse) | optical array | 1.3 |

Level of a category = signature x sensor rating x range falloff x planet block. Total = 1 - product(1 - level). Ship loadouts take an optional `sens` object per category (Hound: sharp em and thermal; Shade: quiet, em-leaning; Brute: weak thermal). Our ship uses the same fields.

## Three states (engine `RULES.visTier = 1`, default OFF)
- **unseen**: total below `visTrans` (0.14). Not on any list or scope. Nothing can be read.
- **transient**: 0.14 to 0.40. A flicker with a bearing and an error that grows as the level falls ("something faint, bearing 107: a heat bloom"). Shown, no reads.
- **contact**: at or above `visOn` (0.40); stays a contact until it falls under `visOff` (0.28), so a ship near the line does not flicker. First time: "New contact, bearing 095. Designating S3." Lost: "We have lost S3."
- Reads (classify, solution) accrue only while a contact.

## Launch spikes
An enemy launch sets `a.spike` (em 0.9, thermal 0.5, 0.5 game min decay); our launch sets `s.emSpike`. A launch from an unseen ship raises its level into transient or contact: a new designation appears before the seekers go active.

## API
E.CATS, E.visBreakdown(s,a) (per-category signature, sensor, level, total, bearingErr), E.ourSigCat(s,cat), E.updateVisibility(s) (called each sub-step), E.isShown(a,s). UI lists (contacts, waterfall, scope, ctl) filter through isShown.

## Update 2026-11-23
- **Enemy side done:** their knowledge of us now uses our four signatures against THEIR per-category sensors (`theirVis`), not the single visibility number. The 3D build turns `visTier` on; the engine default and the tests stay off.
- **Launch types:** `rail` (EM pulse 0.9, thermal 0.1, cycle x1, wide bearing) and `gas` (EM 0.12, thermal puff 0.45, cycle x1.8, +3 percent sink heat, alert x0.45). Our toggle is on the Payload screen. Shade-class enemies launch by gas. Bearing error is weighted by category: EM-led readings point poorly (about 32 deg), heat and shadow point well (3 to 4 deg), reactor lines in between (20 deg), and all widen as the level falls.
- **Phenomena:** ghosts now carry a type with a time signature, so patience separates them from ships: `dust` (one 0.15 min EM and heat flash), `glint` (tumbling debris, optical and heat pulses, 25 percent duty), `plume` (outgassing, steady heat that fades over 9 min, no EM), `burst` (a radio burst source, short EM pulses every 2 to 4 min), `flare` (a particle surge on the reactor channel for 1 min). Target ID shows "LIKELY: ..." once the analysts call it junk.
- **Lures** are quieter in the tier model (thermal 0.36, EM 0.2) so they no longer appear before real ships.
- **Bots** see only contacts (`E.shownAn`). With the flag on (60 hunts): steady 72 percent (68 off), reader 68 (65), pingfire 52 (48), pinger 48 (50), camper 0 (3). A camper never sees anything, which is the intended consequence.
- **Scope filters:** chips down the left side of the main scope: IDENT, UNID, READS (transient wedges), PATHS (our plan and projected tracks), MSL, RINGS. State is kept in localStorage. Transients draw as flickering dashed bearing wedges with a "?" and the wedge width is the bearing error; they no longer show as dots.
- Seen/lost calls are throttled (1.5 game min) so flickering glints do not spam the log.

## Universe notes (for the writers)
**Why not cold gas to launch warheads?** Gas can be stored as a supercold liquid, but keeping it cold needs refrigeration, refrigeration rejects heat, and heat is the one thing the ship cannot get rid of (the sink is the whole game). Cold gas also gives a slow muzzle speed and a visible plume: a puff of expanding gas is a cold spot and a cloud that scatters starlight, so it is quiet on the radio and still not invisible. A rail launcher needs only power, cycles fast and gives a high exit speed, but every shot is a pulse of current, which a spectrum analyzer hears across the arena. The ship chooses which signature to pay.

**What are the non-ship readings?** Dust impacts (a grain at tens of km per second makes a flash and a radio burst, one time only), tumbling debris (glints when a flat face turns to the sun), outgassing ice or a leaking tank (a heat plume that fades), radio bursts from field sources (planetary magnetospheres and pulsar-like objects, repeating on a period), particle surges from a stellar flare (lights up the reactor channel with no ship there), and instrument noise (cosmic-ray hits on the detectors). Each has a different time signature in different categories, so a ship is whatever stays steady, moves like a ship, and shows up in several categories at once.
