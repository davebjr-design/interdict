# Nav planner and screen transitions (Dave, 2026-11-21)

## Plotted g
Every **leg** has a burn g and every **elbow** (waypoint) a flip g, set in **half-g detents** (0.25, 0.5, 1 ... 6 g). Bands: quiet 0.25-1, firm 1.5-2, combat 2.5-3, emergency 3.5-6. The 2 g strain line (fatigue starts) and the weakest officer's blackout limit are marked on the slider.
- Engine: route points carry `g` (burn g of the leg that ends at the point) and `flip` (flip g at its elbow). `FL.plan` gives each rotation its own limits (`waypoint.flip`); each rotate segment keeps them in `seg.R`.
- `E.previewRoute(s, pts)` costs a draft without committing: time, propellant, peak g, flips, strain-line crossings, forecast fatigue, warnings, path.
- `E.autoRoute(s, pt, style, via)` and `E.NAV_STYLES` (stealth 0.2 g burn / 0.25 g flip, standard 1 / 0.25, combat 3 / 3, emergency 6 / 6) are Auto navigate. `E.snapG`, `E.gBand`, `E.G_DETENTS`.
- Heat: engine heat is zero below 0.2 g, so a stealth burn is dark.

## The NAV PLANNER screen (F7, console 5 second screen)
Map (north up, ship centred, zoom +/-), the flown plan in cyan, the draft in amber, legs coloured by burn band, elbows by flip band. Click empty map: add a waypoint (takes the current style). Click a marker: edit its flip g. Click a leg: edit its burn g. Auto navigate buttons set the style and re-plot every drafted point. Right panel: slider, route cost, fatigue forecast bar (white tick = current crew fatigue). ENGAGE sends the route as a Helm order (autonomy rules apply); UNDO and CLEAR edit the draft. Clicking a contact marker selects it.

## Screen transitions
One selected contact, shared by every screen (and ringed on the scope and nav map). Contact Picture row, by where you click:
| Click | Goes to | Why |
|---|---|---|
| Icon and S-number | Main scope, three white flashes on the contact | where is it |
| STATE (FIRMING, SOL RDY ...) | Target ID, or Fire Control if the contact is locked | the next step for what it is now |
| BRG, RNG, AGE | Scanning panel (waterfall) | those are sensor readings |
| ID GUESS (WARSHIP 80%) | Target ID | classify it |
| Row, double-click | same as STATE | a fast next step |
| Row, single click | select only | |
The selector bar (and [ ] / Tab) steps through contacts on any screen. F-keys jump straight to a station screen. Contact markers on the nav map select the contact.
Open: a back/breadcrumb action, and the hit-probability readout on Fire Control linking to the solution detail.
