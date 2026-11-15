# Probe sets: matched sets, radio versus laser (2026-11-15)

The minimum viable engine model of the design in `docs/station_model.md` s8.3 and s8.4 (decided 2026-11-14). Code: `web/hunt_rt_engine.js` (`PSET`, `deployProbes`, `setProbeLink`, `recoverProbes`, `linkNeeded`, state `s.pset`), `web/station_model.js` (rows H2P and S10), `web/station_adapter.js` (verbs `probes_deploy`, `probes_radio`, `probes_radio_go`, `probes_recover`; the H2P gate), `web/annunciator.js` (PRB OUT, PRB LINK, PRB LOST are live). Tests: `tests/probes_test.js`.

The older `E.probe(s, aim, n)` is **not** this: that is the probe *salvo*, a feint of one or two real missiles at a point (W9 reactions). The probe *sets* are sensor arrays.

## The model

* **A rack of two matched sets** (`s.pset`, default Orrin then Halden; `newHunt(seed, { probeSets: ['vask', 'vask'] })` chooses). A set has a lineage, a size (probes in the array), the links it can use, a reach in km, a battery endurance in game minutes and a loudness. Sets are never mixed.

| Set | Size | Links | Reach | Endurance | Loud |
|---|---|---|---|---|---|
| Orrin (recon) | 4 | radio, laser | 70 km | 7 min | 0.35 |
| Halden (utility) | 4 | radio, laser | 80 km | 10 min | 0.6 |
| Vask (line fleet) | 6 | radio only | 110 km | 12 min | 1.0 |

* **Deploy** (`deployProbes(s, 'A', contactId, link?)`): one set on one open or locked contact within the set's reach. Default link is laser if the set can and the ship is steady (not evading, not on a redline burn), otherwise radio. The launch is a small alert (`launchAlert` 0.05). Out sets cannot be reloaded.
* **Pulses**: while the link is up, every 0.4 game minutes the set refines its contact. An **open** contact gets one round of reads on every channel (weight scaled by set size: 6 probes 1.2, 4 probes 1.0, 3 probes 0.7, 2 probes 0.4: the "four gives a full 3D fix, three leaves candidates, two a circle" rule); a **locked** contact gets a fresh anchor fix (`scan`) and its track is held at 2 or better. The first pulse reports "Probe fix on contact N".
* **Radio**: works whatever the ship does. It is an emission: a probes term in the exposure model (loudness x 0.014) and a small alert every game minute (loudness x 0.02) that a hunter can direction-find.
* **Laser**: silent, but the ship must hold course and speed. A speed change of more than 5 percent (of at least 1.2 km/min) or a heading change of more than 3 degrees breaks the link (`probe_link` broken, cause `speed` or `heading`); no pulses while it is broken, so the picture ages. The link returns by itself after the ship has been steady for half a game minute (8 s). `setProbeLink(s, 'A', 'radio')` keeps the picture at once and costs exposure.
* **Endurance**: past its battery a set is **lost** (`probe_lost`, PRB LOST lamp). **Recovery** is by radio hail only (`recoverProbes`): an emission, one game minute, then the set is `recovered` and cannot be deployed again this hunt.

## Station layer

* **H2P** "Turning now breaks the probe link." Raised by the adapter instead of running an evasion, a redline burn or a jump spool while a laser link is up and the crew are already secure (the brace gate comes first). Chips: Hold course (cancel), Turn anyway (run the order), Switch probes to radio (switch every laser set and run the order). Default Hold course after 10 s.
* **S10** "The laser link to set A is broken. Our speed change did it." Raised from the engine event. Chips: Wait for it (default), Switch to radio, Recover the set. A lost set raises it too.
* **Orders**: `A.order('sensors', 'probes_deploy', 'Probes', { id, set?, link? })`.
* **Annunciator**: PRB OUT (advisory while any set is out), PRB LINK (caution while a laser link is broken), PRB LOST (caution after a set is lost).
* Events: `probe_out`, `probe_link` (state `broken` or `up`), `probe_fix`, `probe_lost`, `probe_recovered`.

## Not built (open)

* S9 "Fix offered" (the crew propose probes when a fix is thin) and the probe policy knob (Never / Ask / On ambiguity): needs a trigger rule Dave should choose.
* Newtonian motion: the laser tolerance is on our velocity vector now, so coasting keeps the link, which is the intended feel; the thrust model is a stub.
* An enemy that finds, shoots or recovers our probes; partial loss of a set; scavenged sets with lineage loot (the rack is a loadout option now, not a drop table).
* The probe set's 3D image (class and profile) beyond the refined reads: the symbol logic already shows the class once the reads are done.
