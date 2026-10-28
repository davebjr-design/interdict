# Character art brief (consistency guide)

Purpose: keep every generated character, prop and room looking like one game. Update as decisions are made.

## World and people
- The player and crew are scavengers, not military. Military characters (enemies, authorities) may wear uniforms; crew do not.
- Base outfit for everyone: t-shirt or long-sleeve shirt, improvised utility vest worn over it, cargo pants, work boots. Mended, patched, lived-in.
- Personality shows in swappable details only: ballcap or eccentric headwear, jewelry, tattoos (bold and simple; they are tiny at isometric scale), vest patches, accent colors.
- The captain (player, male for now) is the blank slate: generic, relaxed, practical, no hat, no tattoos, one plain wristband. Original design; inspired by the easygoing frontier-captain archetype, not a likeness of any existing character.

## Look
- Stylized, chunky, hand-painted game character. Clean readable silhouette at about 100-120 px tall on screen.
- Palette: muted earth and faded navy clothing, worn orange accents (matches reactor and warning lights in the room art). Ship palette: charcoal and deep teal with amber glow and small cyan accents.
- Avoid: capes, long coats, scarves, dangling straps or chains, held weapons or tools, extreme poses, loose flowing sleeves (they clip when rigged).

## Technical
- Model: humanoid, A-pose, about 10,000-20,000 triangles, one texture 2048 px or less, GLB with rig, walk and idle animations, under 5 MB.
- Scale: about 1.8 m tall, feet at the origin.
- Camera: the room art uses true 2:1 isometric (floor diamond 2:1), light from the upper left. Characters are rendered from that same camera.
- Portraits: 512 x 512 PNG, head and shoulders, same style.
- Rooms: match the Engineering room's angle, scale and wall height so they can be joined.

## Prompt template (Meshy text-to-3d, max 600 chars)
"Stylized full-body sci-fi scavenger ship {ROLE}, {AGE/BUILD}, neutral A-pose, arms slightly away from the body, legs slightly apart, facing the camera. {HAIR/FACE}, {HEADWEAR}. Long-sleeve shirt or t-shirt, patched canvas utility vest with small pouches, cargo pants, scuffed work boots, {JEWELRY/TATTOOS}. Mended lived-in clothing in muted earth and faded navy with worn orange accents. Chunky hand-painted game character, clean silhouette, plain background."

## Crew personality slots (to fill)
Abara (weapons/helm), Dace (heat), Castellan (reactor), Quill (eclipse/sensors): headwear, jewelry, tattoo concept, accent color. Pell is an AI (no body).

## Status
- Captain v1 generated on Meshy (text-to-3d preview 01a18363-742d-7490-9a72-2fa6c8bef78c, refine 01a18365-f140-76b2-be85-3a0860e8488c; 30 credits). GLB not yet downloaded: assets.meshy.ai must be on the network allowlist. Not yet rigged.
- Meshy task files contain signed URLs, so design/assets/meshy_output/ is git-ignored.
