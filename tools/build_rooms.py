#!/usr/bin/env python3
"""Bundle design/rooms/*.json into design/rooms_spec.js (window.ROOM_SPEC). Run from the repo root after editing any room."""
import json, os
order = json.load(open('design/rooms/_order.json'))
spec = {k: json.load(open(f'design/rooms/{k}.json')) for k in order}
open('design/rooms_spec.js', 'w').write('window.ROOM_SPEC = ' + json.dumps(spec, separators=(',', ':')) + ';\n')
print('wrote design/rooms_spec.js with', len(spec), 'rooms')
