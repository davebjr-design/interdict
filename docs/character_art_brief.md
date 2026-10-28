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
- Captain v1 generated on Meshy (text-to-3d preview 01a18363-742d-7490-9a72-2fa6c8bef78c, refine 01a18365-f140-76b2-be85-3a0860e8488c; 30 credits). GLB downloaded (37 MB, git-ignored) and rejected: hooded, tactical gear, too realistic. Regenerating with a tightened prompt. Not rigged.
- Meshy task files contain signed URLs, so design/assets/meshy_output/ is git-ignored.

## Pipeline learnings (captain v1, 2026-10-28) - keep consistent for the whole crew
Workflow that worked: Meshy text-to-3d preview (20 credits) -> refine/texture (10) -> remesh to ~15k triangles (5) -> rig (5, includes walk and run clips) -> render sprite sheets from the room camera. Total about 40 credits per character.
- **Account and network:** the free plan cannot create tasks through the API; a paid plan is needed. The workspace allowlist must include api.meshy.ai, www.meshy.ai and assets.meshy.ai. The Meshy CLI (node) needs NODE_USE_ENV_PROXY=1 and NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt to use the proxy. Login is a device-code flow.
- **API tasks are separate:** models made through the API show under Meshy's developer mode, not the normal Assets list. Task IDs are recorded here instead; Meshy task files hold signed URLs and are git-ignored.
- **Prompt lessons:** Meshy returned a realistic, tactical figure (hood, holsters, straps) even though the prompt said no hat and stylized. For the next crew member put the style first and name exclusions as concrete items: "chunky stylized game character, big hands and boots, bare head, no hood, no holsters, no straps, no belt pouches". Keep prompts under 600 characters. Use --pose-mode a-pose. Use 2k textures.
- **File sizes:** the raw refined model is 37 MB; remeshed and rigged GLBs are about 15 MB each (embedded PBR textures). They are too big to publish, so we render sprite sheets instead (about 1.3 MB).
- **Rig quality:** the humanoid rig has 24 joints and a clean 1.07 s walk loop. Skin deformation at 8 frames per direction looks fine at game size. Idle is the A-pose, used as a static frame for now.
- **Sprite rendering (tools/sprites/):** headless Chromium with three.js r128, orthographic camera at 26.565 degrees elevation (true 2:1), 45 degrees azimuth, light from the upper left, sRGB output, transparent background. Cell 256 x 320, 8 walk frames x 4 directions (rows se, sw, ne, nw) plus an idle row; feet anchor at pixel (128, 280). Character scale in the room demo: 0.62. The GLB root has a 0.01 scale and skinned-mesh bounding boxes lie about height: measure the bones instead (the character is 1.75 m).
- **Direction mapping on the room grid:** +i = screen down-right (se), +j = down-left (sw), -j = up-right (ne), -i = up-left (nw).
- **Room art lessons:** the generator returned an animated, dithered 640 x 360 GIF; frames were averaged to clean it up and the background keyed to alpha. Next time ask for a larger, still, transparent PNG with the same camera angle, floor corners near T(320,131) R(515,230) L(125,230) in a 640 x 360 frame, and props against the walls.
