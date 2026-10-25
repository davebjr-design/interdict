#!/usr/bin/env python3
"""Screenshots every mock (plus a 'slots' overlay variant). Needs python playwright."""
import asyncio, os
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
JOBS = [('mock_1366.html', 1366, 768, 'mock_1366'), ('mock_1920.html', 1920, 1080, 'mock_1920'), ('mock_target.html', 1920, 1080, 'mock_target'),
        ('mock_1366.html', 1366, 768, 'mock_1366_slots'), ('mock_1920.html', 1920, 1080, 'mock_1920_slots'), ('mock_target.html', 1366, 768, 'mock_target_1366')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f, w, h, out in JOBS:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            await pg.goto('file://' + os.path.join(HERE, f))
            await pg.add_style_tag(content='#slotl,#slots{display:none!important}' if 'slots' not in out else '#slotl{display:none!important}')
            if 'slots' in out:
                await pg.evaluate("document.getElementById('slots').checked=true")
            if f == 'mock_target.html' and w == 1366:
                await pg.evaluate("document.documentElement.style.setProperty('--u','8.5375px')")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(HERE, out + '.png'))
            await pg.close()
        await b.close()
asyncio.run(main())
