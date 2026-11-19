/* Audio for the 3D CIC. AUD.play(name): small synthesised cues (WebAudio, no files). AUD.say(who, text, priority): crew and captain lines through web/voice.js,
 * using the rendered neural clips in web/voice_clips/manifest.json when the exact line exists (same id scheme as call_deck.js), else browser speech, else timed text.
 * Annunciator onsets (new caution / warning) and bracing sound the klaxon. ?mute=1 or the K key silences everything. Audio starts on the first click or key. */
'use strict';
(function () {
  let ctx = null, master = null, muted = false, manifest = {}; const Q = new URLSearchParams(location.search);
  try { muted = Q.get('mute') === '1' || localStorage.getItem('interdict.cic3d.mute') === '1'; } catch (e) { muted = Q.get('mute') === '1'; }
  function init() { if (ctx) return; try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : .5; master.connect(ctx.destination); } catch (e) { ctx = null; } }
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }, { once: false, passive: true }));
  function tone(f0, f1, dur, type, vol, delay) { if (!ctx || muted) return; const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol || .1, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02); }
  function noise(dur, vol, lp, delay) { if (!ctx || muted) return; const t = ctx.currentTime + (delay || 0), n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp || 1200; g.gain.value = vol || .2; s.connect(f); f.connect(g); g.connect(master); s.start(t); }
  const CUE = {
    tick() { tone(900, 700, .03, 'square', .04); }, click() { tone(1300, 900, .04, 'square', .07); }, toggle() { tone(160, 90, .07, 'triangle', .22); noise(.05, .12, 2500); }, guard() { tone(320, 240, .05, 'square', .08); tone(260, 200, .06, 'square', .08, .07); },
    deny() { tone(150, 120, .12, 'sawtooth', .1); tone(130, 100, .14, 'sawtooth', .1, .13); }, lock() { tone(700, 700, .06, 'square', .08); tone(1050, 1050, .1, 'square', .08, .07); },
    fire() { tone(220, 40, .45, 'sawtooth', .22); noise(.4, .3, 900); }, chime() { tone(880, 880, .12, 'sine', .1); tone(1320, 1320, .18, 'sine', .08, .1); }, caution() { tone(660, 660, .12, 'square', .07); tone(660, 660, .12, 'square', .07, .2); },
    klaxon() { for (let i = 0; i < 3; i++) tone(420, 620, .28, 'sawtooth', .09, i * .34); }, hit() { noise(.6, .55, 400); tone(80, 30, .5, 'sine', .35); }, thump() { noise(.25, .25, 300); tone(70, 40, .2, 'sine', .2); } };
  const AUD = { play(n) { init(); try { CUE[n] && CUE[n](); } catch (e) { } }, get muted() { return muted; }, mute(b) { muted = !!b; if (master) master.gain.value = muted ? 0 : .5; try { localStorage.setItem('interdict.cic3d.mute', muted ? '1' : '0'); } catch (e) { } try { if (muted && window.Voice) Voice.cancel(); } catch (e) { } },
    say(who, text, pri) { const V = window.Voice; if (!V || !text || muted) return Promise.resolve(false); try { const Sx = window.Stations, words = Sx.spoken(text), id = Sx.clipId(who, words), has = who === 'Captain' ? !!manifest[id + '_m'] : !!manifest[id]; return V.speak({ id: has ? id : undefined, who, text: words, priority: pri || 2 }); } catch (e) { return Promise.resolve(false); } } };
  window.AUD = AUD;
  if (window.Voice) { fetch('voice_clips/manifest.json').then(r => r.ok ? r.json() : {}).then(m => { manifest = m || {}; try { Voice.loadClips(manifest, 'voice_clips/'); } catch (e) { } }).catch(() => { }); }
  // hooks into the room: shakes, alarms, brace
  AUD.attach = function () { if (window.CIC && !AUD._on) { AUD._on = true; let lastBr = 'free';
    CIC.on('shake', a => { if (a > .4) AUD.play('hit'); else if (a > .2) AUD.play('thump'); });
    CIC.on('frame', () => { const ao = CIC.annOut; if (ao && ao.onset) for (const o of ao.onset) AUD.play(o.state === 'warning' ? 'klaxon' : 'caution'); const b = CIC.braceState(); if (b === 'bracing' && lastBr === 'free') AUD.play('klaxon'); lastBr = b; }); } };
})();
