#!/usr/bin/env node
/* Expand the call catalog (web/station_model.js ROWS) into lines for tools/tts/render.py.
 *   node tools/tts/catalog_lines.js > /tmp/catalog_lines.json && python3 tools/tts/render.py /tmp/catalog_lines.json web/voice_clips
 * For each row: the officer's call (designations Sierra one to Sierra four spelled out), the captain's reply for every chip
 * (who CaptainM and CaptainF; ids end _m / _f), and the officer's repeat-back. Also the radial menu orders (Classify, Track, Probe, Fire).
 * Rows whose words come from the engine log (d.text) or carry numbers (bearings, ETAs) are skipped: the deck speaks those with browser
 * speech or timed text. Ids come from Stations.clipId(who, words), so the deck finds a clip by its exact words.
 */
const S = require('../../web/station_model.js');
const out = [], seen = new Set();
const add = (who, text, castWho) => {
  const words = S.spoken(text); if (!words || /\d/.test(words)) return;   // numbers: not pre-rendered (yet)
  const id = S.clipId(who, words);
  if (who === 'Captain') { for (const g of ['m', 'f']) { const k = id + '_' + g; if (!seen.has(k)) { seen.add(k); out.push({ id: k, who: g === 'm' ? 'CaptainM' : 'CaptainF', text: words }); } } return; }
  if (!seen.has(id)) { seen.add(id); out.push({ id, who: castWho || who, text: words }); }
};
for (const [rid, row] of Object.entries(S.ROWS)) {
  const officer = S.OFFICER[row.st];
  const variants = [];
  for (const n of [1, 2, 3, 4]) { let t; try { t = row.line({ n, how: 'pd' }); } catch (e) { t = null; } if (t && !/undefined/.test(t)) variants.push(t); if (rid === 'W9') variants.push(row.line({ n, how: 'burn' })); }
  if (rid === 'W5') variants.push(row.line({}));   // "Vampire, vampire." (the ETA tail is spoken live)
  for (const t of new Set(variants)) add(officer, t);
  for (const o of row.opts || []) { add('Captain', S.captainLine(o.label)); add(officer, S.ackLine(o.label)); }
}
// radial orders and their officers
for (const [label, st] of [['Classify', 'sensors'], ['Track', 'sensors'], ['Probe', 'weapons'], ['Fire', 'weapons']]) { add('Captain', S.captainLine(label)); add(S.OFFICER[st], S.ackLine(label)); }
// short fixed status phrases the deck uses
for (const [who, t] of [['Abara', 'Standing by.'], ['Quill', 'Standing by.'], ['Castellan', 'Standing by.'], ['Dace', 'Standing by.'], ['Fenwick', 'Standing by.'], ['Abara', 'Probe landed. No reaction.'], ['Abara', 'Magazine empty.']]) add(who, t);
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
if (require.main === module) console.error(`catalog lines: ${out.length} (${out.filter(l => /^Captain/.test(l.who)).length} captain takes)`);
