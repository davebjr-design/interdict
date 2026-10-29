#!/usr/bin/env python3
"""Update fields of design/rooms/<id>.json: setroom.py <id> key=<json> ... then rebuild. Example: setroom.py eng_upper Ni=13 'floor=[[0,0],...]'"""
import json, sys, subprocess
i = sys.argv[1]; p = f'design/rooms/{i}.json'; d = json.load(open(p))
for a in sys.argv[2:]:
    k, v = a.split('=', 1); d[k] = json.loads(v)
json.dump(d, open(p, 'w'), indent=1); subprocess.run(['python3', 'tools/build_rooms.py'], capture_output=True)
