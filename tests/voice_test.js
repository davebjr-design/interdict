// Voice queue tests with a stubbed speech engine (no audio needed). node tests/voice_test.js
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const spoken = []; let pending = null;
globalThis.SpeechSynthesisUtterance = function (t) { this.text = t; };
globalThis.speechSynthesis = {
  getVoices: () => [{ name: 'Daniel', lang: 'en-GB' }, { name: 'Samantha', lang: 'en-US' }, { name: 'Anna', lang: 'de-DE' }],
  speak(u) { spoken.push({ text: u.text, voice: u.voice && u.voice.name, pitch: u.pitch }); pending = u; setTimeout(() => { if (pending === u) { pending = null; u.onend && u.onend(); } }, 20); },
  cancel() { pending = null; }
};
const V = require('../web/voice.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // order: higher priority first, FIFO within a priority; the first line is already speaking
  const log = [];
  const a = V.speak({ who: 'Quill', text: 'one', priority: 2 }).then(() => log.push('one'));
  const b = V.speak({ who: 'Quill', text: 'two', priority: 2 }).then(() => log.push('two'));
  const c = V.speak({ who: 'Abara', text: 'three', priority: 3 }).then(() => log.push('three'));
  await Promise.all([a, b, c]);
  ok(log.join() === 'one,three,two', 'urgent call jumps the queue (' + log.join() + ')');
  ok(spoken[0].voice === 'Samantha' && spoken.find(s => s.text === 'three').voice !== undefined, 'profiles pick a voice, English only');
  ok(!spoken.some(s => s.voice === 'Anna'), 'never picks a non-English voice when English exists');
  // critical interrupts the line being spoken
  spoken.length = 0;
  let firstEnded = null;
  V.speak({ who: 'Dace', text: 'long routine line here', priority: 2, onEnd: o => firstEnded = o });
  await sleep(5);
  await V.speak({ who: 'Abara', text: 'Vampire', priority: 4 });
  ok(firstEnded === false, 'critical call cuts in on the line being spoken');
  ok(spoken[spoken.length - 1].text === 'Vampire', 'critical line spoken');
  // routine chatter is dropped when the queue is backed up
  V.cancel(); let dropped = 0;
  V.speak({ who: 'Quill', text: 'hold', priority: 2 });
  const rs = []; for (let i = 0; i < 10; i++) rs.push(V.speak({ who: 'Quill', text: 'r' + i, priority: 1 }).then(v => { if (v === false) dropped++; }));
  await sleep(300); V.cancel(); await Promise.all(rs);
  ok(dropped >= 3, 'backed-up routine lines dropped (' + dropped + ')');
  // disabled: timed fallback still resolves, nothing spoken
  spoken.length = 0; V.set({ enabled: false });
  const t0 = Date.now(); const r = await V.speak({ who: 'Quill', text: 'silent fallback line', priority: 2 });
  ok(r === false && spoken.length === 0 && Date.now() - t0 >= 700, 'muted: timed fallback resolves, nothing spoken');
  // no speech engine at all
  V.set({ enabled: true }); const keep = globalThis.speechSynthesis; globalThis.speechSynthesis = undefined;
  const r2 = await V.speak({ who: 'Pell', text: 'no engine', priority: 3 });
  ok(r2 === false, 'no speech engine: still resolves'); globalThis.speechSynthesis = keep;
  ok(V._estMs('a b c d e', 1) > 1000, 'fallback length scales with words');
  console.log(fails ? 'FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
