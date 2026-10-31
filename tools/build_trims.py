#!/usr/bin/env python3
"""Bundle data/mini_missions.json into design/trims_spec.js (window.TRIM_SPEC) for the walk demo."""
import json
d = json.load(open('data/mini_missions.json'))
open('design/trims_spec.js', 'w').write('window.TRIM_SPEC = ' + json.dumps(d, separators=(',', ':')) + ';\n'); print('wrote design/trims_spec.js')
