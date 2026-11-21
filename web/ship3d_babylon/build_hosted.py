#!/usr/bin/env python3
"""Package the Babylon ship spine for the hosted artifact page: the page cannot serve .glb, so each GLB becomes a base64 .js file (window.GLB_DATA[file]).
Usage: build_hosted.py <out_dir> [template.html]. Writes glb_*.js, the page, and copies ship3d_bjs.js + hunt/*.js. babylon*.js are copied once by hand (large, unchanged)."""
import base64, json, os, shutil, sys
src = os.path.dirname(os.path.abspath(__file__)); out = sys.argv[1]; os.makedirs(out + '/hunt', exist_ok=True)
man = json.load(open(src + '/assets_manifest.json')); files = sorted({v['file'] for k, v in man.items() if isinstance(v, dict)})
for f in files:
    b = base64.b64encode(open(src + '/glb/' + f, 'rb').read()).decode()
    open(out + '/glb_' + f[:-4] + '.js', 'w').write("window.GLB_DATA=window.GLB_DATA||{};window.GLB_DATA['%s']='%s';" % (f, b))
tpl = open(sys.argv[2] if len(sys.argv) > 2 else out + '/ship_spine.html').read()
i, j = tpl.index('<script>window.SHIP_MANIFEST='), tpl.index('<script src="babylon.js">')
hunt = ['flight_model', 'hunt_rt_engine', 'station_model', 'salvo_presets', 'station_adapter', 'annunciator', 'live_screens', 'nav_screen', 'audio', 'ctl_bjs', 'airlock_sys', 'ship_systems', 'passive_screens']
tags = '<script src="babylon.js"></script><script src="babylonjs.loaders.min.js"></script>' + ''.join('<script src="glb_%s.js"></script>' % f[:-4] for f in files) + ''.join('<script src="hunt/%s.js"></script>' % h for h in hunt) + '<script src="ship3d_bjs.js"></script>'
open(out + '/ship_spine.html', 'w').write(tpl[:i] + '<script>window.SHIP_MANIFEST=' + json.dumps(man) + ';</script>\n' + tags + '\n')
shutil.copy(src + '/ship3d_bjs.js', out + '/ship3d_bjs.js')
for h in hunt: shutil.copy(src + '/hunt/%s.js' % h, out + '/hunt/%s.js' % h)
print(len(files), 'glb files;', sum(os.path.getsize(out + '/' + x) for x in os.listdir(out) if x.endswith('.js')) // 1024, 'KB top-level js')
