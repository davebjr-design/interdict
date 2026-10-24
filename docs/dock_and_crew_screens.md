# Space dock and crew screens (Dave, 2026-10-24; reference: Silent Hunter crew and equipment screens)

## Decisions
- Part tier (light, medium, heavy) changes engine heat output: light 0.8x, medium 1.0x, heavy 1.35x (`TIER_HEAT` in the engine, not applied until fitting exists). Tier also trades effectiveness and, later, weight.
- No casualty reports for now. Crew numbers and injuries may become a mechanic later.
- Components and modules are changed only at the space dock.

## Space dock equipment screen (modeled on Silent Hunter's loadout screen)
Tabbed list across the middle (Ship, Drives, Sinks, Sensors, Weapons, Missiles/warheads, Modules). A cutaway or side view of our ship in the center with slots drawn on it; click a slot to see candidate parts from the cargo hold; a detail panel shows stats (efficiency, thrust, noise, draw, heat, tier, maker) with set-bonus and friction preview; the missile loadout (Standard, EMP, Flare counts) is chosen here too. Cargo hold (kg, modules, spare components) is already tracked in the browser.

## Crew and damage screen (later)
Officers attached to stations, enlisted crew supporting them, hull sections colored by damage, injured crew marked. Maps to our officers (Dace heat, Castellan reactor, Quill eclipse, Abara weapons/helm) and to section damage that degrades the matching system. Deferred; the current model has hull points only.
