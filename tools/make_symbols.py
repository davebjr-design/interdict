#!/usr/bin/env python3
"""Source of truth for the map symbols. Writes web/assets/symbols/*.svg and web/symbols.js (inlined by build_hunt_rt.sh).
64x64 viewBox, nose up, single colour. mode: fill | evenodd | stroke."""
import json, os
C = lambda cx, cy, r: f"M{cx-r} {cy}a{r} {r} 0 1 0 {2*r} 0a{r} {r} 0 1 0 {-2*r} 0Z"
SYM = {
 'ships_destroyer': {'name': 'Destroyer', 'items': [
   ['M32 4L39 24L37 46L45 60L32 53L19 60L27 46L25 24Z', 'fill'],
   ['M32 18V44', 'stroke_cut']]},
 'ships_cruiser': {'name': 'Cruiser', 'items': [
   ['M32 3L41 16L51 30L47 50L41 58L32 51L23 58L17 50L13 30L23 16Z', 'fill'],
   ['M32 14V46M24 32H40', 'stroke_cut']]},
 'ships_battleship': {'name': 'Battleship', 'items': [
   ['M32 2L43 9L47 22L57 28V47L48 53L46 62H18L16 53L7 47V28L17 22L21 9Z', 'fill'],
   ['M32 12V50M22 28H42M20 42H44', 'stroke_cut']]},
 'stations_base': {'name': 'Base', 'items': [
   [C(32, 32, 21) + C(32, 32, 15), 'evenodd'], [C(32, 32, 6), 'fill'],
   ['M30.5 8V26M30.5 38V56M8 30.5H26M38 30.5H56', 'stroke_thick']]},
 'stations_outpost': {'name': 'Outpost', 'items': [
   ['M22 26H42V44H22Z', 'fill'], ['M31 6H33V26H31Z', 'fill'], ['M24 8Q32 0 40 8', 'stroke'],
   ['M16 50H48V56H16Z', 'fill'], ['M27 44H37V50H27Z', 'fill']]},
 'debrisfield': {'name': 'Debris field', 'items': [
   ['M10 14L20 10L22 20L13 24Z', 'fill'], ['M36 8L46 14L40 22Z', 'fill'], ['M50 28L58 34L51 40Z', 'fill'],
   ['M24 30L34 28L36 38L26 40Z', 'fill'], ['M8 44L18 40L20 50L10 54Z', 'fill'], ['M38 48L46 46L48 56L40 58Z', 'fill'], ['M28 52L32 50L33 55Z', 'fill']]},
 'derelict': {'name': 'Derelict', 'items': [
   ['M29 6L23 24L25 44L18 58L27 53L31 38L28 24Z', 'stroke'],
   ['M35 10L40 24L37 40L46 58L36 52L33 40L35 26Z', 'stroke'],
   ['M30 4V4', 'stroke'], ['M12 20L16 24M50 34L54 30M44 12L47 16', 'stroke']]},
 'anomaly': {'name': 'Anomaly', 'items': [
   ['M32 4L60 32L32 60L4 32Z', 'stroke'], [C(32, 32, 9), 'stroke'], [C(32, 32, 2.5), 'fill'],
   ['M32 4V14M32 50V60M4 32H14M50 32H60', 'stroke']]},
}
here = os.path.dirname(os.path.abspath(__file__)); web = os.path.join(here, '..', 'web'); os.makedirs(os.path.join(web, 'assets', 'symbols'), exist_ok=True)
for k, v in SYM.items():
    parts = []
    for d, m in v['items']:
        if m == 'fill': parts.append(f'<path d="{d}" fill="currentColor"/>')
        elif m == 'evenodd': parts.append(f'<path d="{d}" fill="currentColor" fill-rule="evenodd"/>')
        elif m == 'stroke': parts.append(f'<path d="{d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>')
        elif m == 'stroke_thick': parts.append(f'<path d="{d}" fill="none" stroke="currentColor" stroke-width="3"/>')
        elif m == 'stroke_cut': parts.append(f'<path d="{d}" fill="none" stroke="#0a0e0d" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round"/>')
    open(os.path.join(web, 'assets', 'symbols', k + '.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" color="#cfe3da"><title>{v["name"]}</title>{"".join(parts)}</svg>\n')
open(os.path.join(web, 'symbols.js'), 'w').write('const SYM = ' + json.dumps(SYM) + ';\n')
print('wrote', len(SYM), 'symbols')
