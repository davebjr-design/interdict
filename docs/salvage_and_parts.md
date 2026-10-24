# Salvage, parts and modules (2026-10-24)

Rules (Dave): derelicts are looted in the after-action report only. Salvage is measured in kg of old circuit boards and other technology. A derelict may also drop a **module** (small buff with a matching cost) or, more rarely, a **component** from the part sets. Parts and modules are fitted only at a space dock (not built yet). Cargo hold persists in the browser (localStorage `interdict_hold`).

## Yield by class
| Class | kg | Module chance | Component chance | Component pool |
|---|---|---|---|---|
| Destroyer | 80-140 | 35% | 12% | recon, freighter |
| Cruiser | 200-340 | 50% | 20% | freighter, station, recon |
| Battleship | 450-800 | 70% | 30% | battleship, station |

Leaving by breach drive halves kg and drop chances.

## Components (16 parts, 4 slots, 3 makers)
| Part | Slot | Tier | Maker | Origin | Stats |
|---|---|---|---|---|---|
| Wisp drive | drive | light | Orrin | recon | eff 1.2, thrust 7, noise 0.75, draw 2 |
| Maul drive | drive | heavy | Vask | battleship | eff 0.85, thrust 12, noise 1.4, draw 7 |
| Plod drive | drive | medium | Halden | freighter | eff 1.0, thrust 8, noise 1.0, draw 3 |
| Anchor thrusters | drive | medium | Halden | station | eff 0.8, thrust 4, noise 0.5, draw 1, creep 0.5 |
| Fin radiator | sink | light | Orrin | recon | cap 0.85, draw 1 |
| Bastion radiator | sink | heavy | Vask | battleship | cap 1.5, draw 4 |
| Haul coil | sink | medium | Halden | freighter | cap 1.0, draw 2 |
| Reservoir | sink | medium | Halden | station | cap 1.55, draw 3, coldplus 14 |
| Whisper array | sensor | light | Orrin | recon | track 6, draw 1, warn 0.95 |
| Fire director | sensor | heavy | Vask | battleship | track 11, draw 5, warn 0.35 |
| Cargo scanner | sensor | medium | Halden | freighter | track 3, draw 1, warn 0.5 |
| Station array | sensor | medium | Halden | station | track 7, draw 3, warn 0.7 |
| Dart rack | weapon | light | Orrin | recon | kill -2, exposure -6, draw 1, unaware 4 |
| Lance battery | weapon | heavy | Vask | battleship | kill 16, exposure 5, draw 7 |
| Hauler tube | weapon | medium | Halden | freighter | kill 4, exposure 0, draw 2 |
| Fixed station mount | weapon | medium | Halden | station | kill 6, exposure 1, draw 4 |

Set bonus 10/20/30% for 2/3/4 same-maker parts; friction 0.07 per extra maker and 0.04 per extra origin (lower efficiency, parasitic heat). Weight is not modeled yet: proposed mass by tier light 1, medium 2, heavy 4.

## Modules (in `MODULES` in the engine)
See the engine list: 12 small modules across drive, sink, sensor, weapon and hull slots, each a modest buff with a cost.
