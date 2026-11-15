# Probe workflow: from "I need a fix" to "recover the set" (draft, 2026-11-15)

Status: proposal for Dave to mark up. Builds on `docs/station_model.md` s8.3 and s8.4 (decided), `docs/mechanics_probes.md` (what the engine does today) and `docs/station_screens.md` (screens). Nothing here is built unless it says so.

Principle (decided): probes are not a placement minigame. The player gives intent ("get me a fix on S3"); the crew offer two or three approaches with costs; manual placement is a Hands-on option at Sensors only.

## 1. The workflow, stage by stage

| Stage | What happens | Who acts | Built? |
|---|---|---|---|
| 1. Need | A contact we care about has a thin fix: bearing only, a wide range band, or two candidate positions. | Engine notices (the trigger rule, s2) | no |
| 2. Offer | Sensors raises call **S9 "Fix offered"** with chips: Fix with probes (set, link, cost shown), Fix with a baseline burn, Not yet (default). | Quill proposes; the captain answers or the doctrine answers | no (S9 not built) |
| 3. Choose | Set (A or B), link (laser if the set can and we are steady, else radio) and contact. The captain can override from the contact's radial menu ("Probe"). | Captain, or Auto picks the best set | yes (`probes_deploy`) |
| 4. Launch | One set leaves for one contact within the set's reach. Small alert at launch. A set cannot be reloaded. | Sensors | yes |
| 5. Link | Laser: silent, needs steady course and speed (3 degrees, 5 percent). Radio: works always, is an emission. | Engine | yes |
| 6. Operate | A pulse every 0.4 game minutes refines the contact; a locked contact gets a fresh anchor fix. A 10 s buffer rides out a brief break. | Engine | yes (buffer: check) |
| 7. Interference | A manoeuvre while a laser link is up raises **H2P**; a break raises **S10**; hunters may see the probes or direction-find the radio link. | Captain; enemy | H2P and S10 yes; enemy reaction no |
| 8. End | Battery ends: the set is lost. Or recover by radio hail (loud, one game minute). The crew recover on their own when nothing hostile remains. | Sensors | recover yes; auto-recover no |

Every call has a default after its timer, so nothing pauses the hunt.

## 2. The trigger rule for S9 (needs your choice)

Proposed rule, all must hold:

1. **The contact matters.** It is selected, locked, or flagged as a probable hostile.
2. **The fix is thin.** Position confidence under 0.5, or the range band wider than one third of the contact's distance, or bearing-only for more than 1.5 game minutes (24 s).
3. **We can do it.** A set is in the rack, the contact is inside its reach, and no hostile salvo is in the air.
4. **Not nagging.** One offer per contact per 3 game minutes, at most 3 offers a hunt, and none inside the first 1.5 game minutes (same pacing as the decision moments).

Probe policy knob (the doctrine; **Ask** is the default):

| Policy | What the crew do |
|---|---|
| Never | No offers. The captain launches from the radial menu if he wants. |
| Ask | Raise S9 when the rule fires. Default chip is Not yet. |
| On ambiguity | Launch without asking when the rule fires **and** there are two or more candidate positions (a decoy question) **and** the ship is steady enough for laser. Otherwise ask. |

## 3. The interface

* **On the contact (radial menu):** Probe, with the set and link already proposed. One click launches, a second picks another set or link.
* **F7 Payload Readiness (probe sets panel):** one card per set: lineage, size, links, reach, a battery bar, and state (in rack, out, link up, link broken, lost, recovered). Buttons: Deploy, Radio, Recover.
* **F1 Tactical Nav:** the laser-link tolerance as a ring around the heading and speed marker, so a turn that breaks the link is visible before it is ordered. (The station docs put probe control on F4 in one place and F7 in another; this proposal makes F7 the home and F4 only shows the fix.)
* **Calls:** S9 (offer), S10 (link lost), H2P (turning breaks the link), plus a new quiet **S11 "Probes recovered"** (priority 1) so the loop closes.
* **Annunciator:** PRB OUT, PRB LINK, PRB LOST (built). The 3D CIC reads the same state.
* **Hands-on at Sensors:** manual placement (choose the spread of the set around the contact) is a later option, not in this pass.

## 4. How probes behave (rules that make them a decision)

* **Quality of fix:** four probes give a full 3D fix, three leave candidates, two a circle (built).
* **Age:** the fix ages if the target manoeuvres hard or the set is lost (built for lost; hard-manoeuvre ageing: check).
* **Visibility (to build):** probes are detectable (launch impulse, small heat, link emissions). A hunter that notices a radio link can direction-find the ship. A hunter that reads where a laser beam points can find us only if it is in the beam's path, which is rare and costs it a scan.
* **Shooting and recovering (later):** a hunter may shoot a set (partial loss: the set drops one probe at a time, and the fix degrades with it) or recover it (the enemy gets our set, which is the lineage loot loop).
* **Endings:** a set lost to battery is gone; recovered sets cannot be redeployed this hunt (built).

## 5. Decisions needed from you

1. **The S9 rule in s2:** accept as written, or change the thresholds (thin fix, offers per hunt)?
2. **Default policy:** Ask (my recommendation) or On ambiguity?
3. **Where probe control lives:** F7 as proposed, or F4 as the older screen doc said?
4. **Enemy reaction depth:** only "radio can be direction-found" in this pass (recommended), or also shooting and recovery now?
5. **Partial loss of a set:** later (recommended), or part of this pass?
6. **Manual placement at Sensors Hands-on:** later (recommended), or now?

## 6. Build workflow (when the decisions above are made)

1. **Engine** (mechanics agent): `probeNeed(s, contactId)` as the S9 trigger, offers counter, policy in the hunt state, enemy direction-finding of radio links, auto-recover. Tests in `tests/probes_test.js`.
2. **Station layer:** S9 and S11 rows in `station_model.js`, adapter verbs for the policy and the S9 chips, `cfg.probes` policy knob.
3. **UI** (3D CIC agent): radial "Probe" entry with proposed set and link, F7 cards, F1 tolerance ring, tutorial step.
4. **Balance:** the bots gain a policy (Never / Ask / On ambiguity); compare win rate and hull; require that Ask costs the competent bot nothing it would not spend anyway.
5. **Review:** you play a hunt with each policy and say which feels like a decision rather than a chore.
