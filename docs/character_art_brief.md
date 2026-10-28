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

## Crew generation run (2026-10-28)
Five named crew previews started on Meshy (text-to-3d preview, a-pose, 20 credits each): Abara, Dace, Castellan, Quill, Fenwick. Prompts follow the tightened pattern: style first ("Chunky hand-painted stylized game character, exaggerated proportions, big hands and boots"), concrete look, wardrobe in the crew accent color, then exclusions ("no hood, no hat, no holsters, no straps, no belt pouches, no weapons"). Prompt text and task IDs are in design/assets/meshy_output/crew/ids.json (git-ignored; IDs are repeated below once results are known). Full profiles: docs/crew_profiles.md.

### Crew task IDs (2026-10-28)
Style learning: Meshy ignores 'no X' exclusions; body type words matter ('lean slim' vs 'soft rounded shapes' gave a chubby result). Also: `meshy download --output` silently keeps an existing file, so use new filenames when re-downloading thumbnails. Render all sprite sheets with tools/sprites/sprite.py (args: _ OUT.png) while serving render.html, three.min.js, GLTFLoader.js and walk.glb on port 8765. Rig height was 1.7 m for all; scale sprites in the demo by true height (Abara 1.72, Quill 1.80, Castellan 1.83, Dace 1.78, Fenwick 1.70).
- abara: preview_v1 01a1841d-d89f-71a0-9e83-ac8e3800a9ff, preview 01a1842d-f6a3-777d-9102-6aec637c86b3, refine 01a1843b-8499-7689-a4f1-baff37045719, remesh 01a1843d-51e7-76e8-b97a-276bbadaa294, rig 01a1843e-cd65-73f3-bca1-95d74e3d079b
- dace: preview_v1 01a1841d-e5a5-77f2-ac8d-43b30d2aea39, preview_v2 01a1842e-0308-74ad-ae8b-29fc75bf6f7e, refine_v2 01a1843b-8ac4-737f-b5a6-359a28f16013, preview 01a1843d-5c55-76f0-b92e-01fc917d9560
- castellan: preview_v1 01a1841d-f2c4-73b8-a30f-90076c13ea2c, preview 01a1842e-101f-70b7-ac94-f44a91eb504f, refine 01a1843b-9033-7166-9363-bf2c95f9c92b, remesh 01a1843d-5703-7483-87ab-79d9270a5b60, rig 01a1843e-ddef-700e-bbe8-a97dc11e8df0
- quill: preview 01a1841d-ffa9-7627-8bfa-d9890c6bbc3b, refine 01a1842e-26f9-7541-a501-85353ccdbb33, remesh 01a1843d-4c79-7169-9599-80961daa2f77, rig 01a1843e-b9fd-7602-b2c0-38f3e4926456
- fenwick: preview_v1 01a1841e-0d67-75b1-a5a4-055315568f66, preview_v2 01a1842e-1b1f-7620-bb61-5fca2621a0b1, refine_v2 01a1843b-95e7-752d-ba9b-69fde193b07c, preview 01a1843d-6815-71ff-ba22-097e0be90663
