"""Python helper: from rs import setroom; setroom('control', Ni=14, ...)  (values are python objects)"""
import json, subprocess
def setroom(i, **kw):
    p = f'design/rooms/{i}.json'; d = json.load(open(p)); d.update(kw); json.dump(d, open(p, 'w'), indent=1)
    subprocess.run(['python3', 'tools/build_rooms.py'], capture_output=True)
def overlay(*rooms):
    r = subprocess.run(['node', 'tools/room_overlay.js', '/tmp/claude-0/-home-claude/dbd627fa-e303-5272-aa05-75a59f64ae3e/scratchpad/ov2', *rooms], capture_output=True, text=True, env={**__import__('os').environ, 'NODE_PATH': subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()})
    print(r.stdout, r.stderr[:300])
