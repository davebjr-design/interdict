#!/usr/bin/env python3
"""Room art with a 100px coordinate grid, for reading floor corners and footprints: ticks.py <room> -> scratch png path printed."""
import sys, json
from PIL import Image, ImageDraw
r = json.load(open(f'design/rooms/{sys.argv[1]}.json'))
im = Image.open('design/assets/rooms/' + r['file']).convert('RGBA'); bg = Image.new('RGBA', im.size, (40, 40, 40, 255)); bg.alpha_composite(im); d = ImageDraw.Draw(bg)
for x in range(0, im.width, 100): d.line([(x, 0), (x, im.height)], fill=(255, 0, 255, 255) if x % 500 == 0 else (200, 0, 200, 140)); d.text((x + 2, 2), str(x), fill=(255, 255, 0, 255))
for y in range(0, im.height, 100): d.line([(0, y), (im.width, y)], fill=(255, 0, 255, 255) if y % 500 == 0 else (200, 0, 200, 140)); d.text((2, y + 2), str(y), fill=(255, 255, 0, 255))
out = f'/tmp/claude-0/-home-claude/dbd627fa-e303-5272-aa05-75a59f64ae3e/scratchpad/tk_{sys.argv[1]}.png'; bg.convert('RGB').save(out); print(out)
