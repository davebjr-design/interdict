# Room art standard (lighting, camera, background, staging)

Use this exact language in every room prompt so the ship stays consistent. Update it when a lesson is learned.

## Camera
"Wide floating isometric room cutaway (floor plus two back walls), true 2:1 isometric camera, same angle and scale as the Engineering reference."

## Lighting standard (paste into every prompt)
"Even neutral mid-dark base lighting from the upper left with soft ambient occlusion and readable floor detail. Light comes only from small distinct fixtures: 4 to 6 warm amber recessed strip lights in the walls and under counters, and small cool cyan indicator lamps on doors and consoles. No strong colored spotlights, no light shafts, no baked glow halos, no fog. Fixtures are small, crisp and separate so animated glow can be added in code on top of them."

## Palette and style
"Hand-painted stylized sci-fi, muted charcoal and deep teal metal, worn orange accents, warm amber glow, small cyan accents, chunky readable shapes."

## Background
"Plain solid flat magenta (#FF00FF) background outside the room, no gradients, no shadow on the background." Key the magenta to alpha in post. (Black backgrounds eat dark wall edges.)

## Staging areas (see ship_inventory_and_art_plan.md section 4)
"Keep two blank flat wall panels, two clear empty shelf or desk tops, and one clear empty floor patch. No posters, no text, no clutter, no people." Shelves matter more in small rooms; large rooms (Mess) can skip them.

## Light animation (code, not generated)
Generated art is a still. Flicker is added in the demo engine: each fixture gets a pixel position and a glow sprite (additive radial gradient) with a pattern: steady, slow pulse (reactor and projector), or fault flicker (random dropouts). A room-wide brightness multiply can flicker slightly for faults. Damage zones can switch a fixture to fault or dark.

## Pipeline
Meshy image-to-image (gpt-image-2) with the Engineering art as the first reference and an earlier room as the second for layout; 3:2 aspect ratio; about 12 credits per image; then key the background, measure floor corners, and scale to Engineering's cell size.
