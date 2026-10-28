#!/bin/bash
# usage: crew_wait.sh KEY RESOURCE   (polls ids.json[name][KEY] tasks until done)
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
M="npm exec --yes --package=meshy-cli@0.4.0 -- meshy"
KEY=$1; RES=$2; shift 2
for i in $(seq 1 150); do all=1; out=""
  for n in "$@"; do id=$(python3 -c "import json;print(json.load(open('ids.json'))['$n']['$KEY'])")
    st=$($M $RES get $id --output-schema v1 --format json --no-update-check 2>/dev/null | python3 -c "import sys,json;t=json.load(sys.stdin)['result']['task'];print(t.get('status'),t.get('progress'))")
    out="$out $n:$st"; case "$st" in SUCCEEDED*|FAILED*) ;; *) all=0;; esac; done
  echo "$(date +%T)$out"; [ $all = 1 ] && break; sleep 20
done
