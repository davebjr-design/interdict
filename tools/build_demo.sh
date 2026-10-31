#!/bin/sh
# Build the walk demo's supporting files: rooms_spec.js, trims_spec.js, and hunt.html (the hunt page with a document skeleton).
cd "$(dirname "$0")/.." && python3 tools/build_rooms.py && python3 tools/build_trims.py && sh web/build_hunt_rt.sh && \
{ printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'; cat web/hunt_rt.html; } > design/hunt.html && echo "built design/hunt.html"
