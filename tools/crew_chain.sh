#!/bin/bash
# usage: crew_chain.sh name...   (from preview: refine -> remesh -> rig -> walk.glb download); run in design/assets/meshy_output/crew
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
M="npm exec --yes --package=meshy-cli@0.4.0 -- meshy"
W=/home/claude/interdict/tools/crew_wait.sh
save() { python3 - "$1" "$2" "$3" <<'PY'
import sys,json
d=json.load(open('ids.json'));d[sys.argv[1]][sys.argv[2]]=sys.argv[3];json.dump(d,open('ids.json','w'),indent=1)
PY
}
get() { python3 -c "import json;print(json.load(open('ids.json'))['$1']['$2'])"; }
mk() { # stage resource prev_key args...
  local key=$1 res=$2 prev=$3; shift 3
  for n in "${NAMES[@]}"; do
    id=$($M $res create "$@" --input-task-id $(get $n $prev) --async --output-schema v1 --format json --no-update-check 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['task_id'])")
    save $n $key $id; echo "$n $key $id"
  done
  $W $key $res "${NAMES[@]}" | tail -1
}
NAMES=("$@")
for n in "${NAMES[@]}"; do
  id=$($M text-to-3d create --mode refine --preview-task-id $(get $n preview) --enable-pbr true --texture-resolution 2k --target-formats glb --async --output-schema v1 --format json --no-update-check 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['task_id'])")
  save $n refine $id; echo "$n refine $id"
done
$W refine text-to-3d "${NAMES[@]}" | tail -1
mk remesh remesh refine --topology triangle --target-polycount 15000 --target-formats glb
mk rig rigging remesh --height-meters 1.7
for n in "${NAMES[@]}"; do
  $M rigging get $(get $n rig) --output-schema v1 --format json --no-update-check 2>/dev/null > $n.rig.json
  mkdir -p $n; $M download --task-json $n.rig.json --asset result.basic_animations.walking_glb_url --output $n/walk.glb --no-update-check >/dev/null 2>&1; ls -la $n/walk.glb
done
