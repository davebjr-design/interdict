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

## Not done yet
- The enemy's knowledge of us still uses the older single visibility number; `ourSigCat` exists for the per-category version (their sensors vs our four signatures).
- Rail-launch spike with a wide bearing wedge versus a thermal launch with a tight one (bearingErr is per total level only).
- Bots in sim read s.an directly and see everything; they need a search behaviour before the balance numbers mean anything with the flag on.
- Lures are louder (thermal 0.55) than a quiet real ship, so with the flag on lures appear first. Retune lure signature or treat it as a tell.
- The transient bearing wedge is not drawn on the scope; transients appear in the lists like contacts.
- Gauges: "what we know of it" starts at zero for a transient.
