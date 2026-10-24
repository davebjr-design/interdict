# Map symbols and derelicts (2026-10-23)

Symbols (tools/make_symbols.py is the source; it writes web/assets/symbols/*.svg and web/symbols.js): ships_destroyer, ships_cruiser, ships_battleship, stations_base, stations_outpost, debrisfield, derelict, anomaly. 64x64, nose up, single colour, tinted in game by friend / hostile / unknown. Replace any of them by editing the paths in the script and rerunning it, or by dropping in better SVGs (same names, same viewBox).

When a contact earns a symbol (`symbolFor`)
- Dot until the odds that we know what it is reach 80 percent (P.symP) with at least two channels read.
- Static becomes a debris field; a decoy becomes an anomaly mark; a warship becomes a plain arrowhead.
- The arrowhead resolves to its class (destroyer, cruiser, battleship) once total reading weight across the three channels reaches 12 (P.classDen). Decoys mimic a class, so the player cannot tell by symbol alone.
- Allies show their class from the start. A crippled warship becomes a derelict. Stations, outposts and real anomalies are for later missions.
- Classes by loadout: Picket, Hound, Green crew: destroyer. Shade, Veteran: cruiser. Brute: battleship.

Derelicts: a crippled warship gets `derelict = { salvage, looted }` (destroyer 2, cruiser 4, battleship 7). No looting action yet. Proposed rule for later: close inside 3 km and hold still for a time set by class; cutting and tractor work add heat and visibility like any activity; other warships hear the work; risk of booby traps or scavengers by mission; salvage value feeds the dock cycle.
