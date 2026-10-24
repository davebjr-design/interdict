# Salvo and warhead design (Dave, 2026-10-24)

## Core tradeoff
Cone size is the player's dial. A tight salvo risks missing outright but concentrates damage; a wide one is more likely to touch the target but spreads the damage thin (area-of-effect dropoff per missile). Dropoff scale (killR and curve) is tuned by playtesting, mostly by the sub-agent playtester.

## Hit difficulty
A tight, high-damage hit should be hard to get, except against a sitting target that does not see the warheads in time to react.

## Missile stealth and homing (new feature)
- Missiles have a stealth rating like ships. Supercooled, non-maneuvering missiles are very hard to see.
- Enabling homing raises hit chance but makes them detectable (a warned target can react: burn, vent, grid).
- Warning time depends on detection; a surprised target does not dodge.

## Hit cutscenes (four outcomes)
1. Miss: the ship rocks a little.
2. Low damage: shrapnel hits.
3. Medium damage.
4. Destruction (becomes derelict).
Art may later be generated with an image/video model. Placeholders are canvas animations for now.
