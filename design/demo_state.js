/* Shared demo state for the walk demo and the hunt page (localStorage 'interdict.state'), until the dialogue runner and
 * save/load (act1_completion_plan.md C.1, C.4) replace it. Names follow data/narrative/state.json where a variable exists there.
 *   pell.wiring_seen   1.6b has been played (the gate for every Pell control in the hunt)
 *   pell.key           'live' | 'waiting' | 'dead' | 'none'   (1.6b: turned / Pell asked, pending / declined)
 *   pell.link_recent   hunts with the shallow link in use since the last dock (read by the dock inspection roll)
 *   tally.trace        hidden; never shown anywhere. Default 10 = Corvane's dead runs behind the pedestal (1.6b)
 *   tally.declared     the Tally's declared count; unchanged by 1.6b under PROVISIONAL logging ruling (a)
 *   command.style      0 tight .. 100 loose, starts 50; command.band is the committed band (hysteresis, command_model.md §2)
 * Inlined into web/hunt_rt.html by web/build_hunt_rt.sh; copied to design/demo_state.js by tools/build_demo.sh. */
var DemoState = (function () {
  const K = 'interdict.state';
  const DEF = () => ({ pell: { wiring_seen: false, key: 'none', link_recent: 0, integration_cap: 24 }, tally: { trace: 10, declared: 0, ruling: 'a' }, command: { style: 50, band: 'neutral' }, seen: {}, trust: {}, dock: {}, flags: {}, hunts: 0, moments: {} });
  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  function load() { let v = null; try { v = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} return merge(DEF(), v && typeof v === 'object' ? v : {}); }
  function save(st) { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} return st; }
  function update(fn) { const st = load(); fn(st); return save(st); }
  function clear() { try { localStorage.removeItem(K); } catch (e) {} }
  // Committed band with hysteresis: enter tight at <= 35 (very tight <= 15), loose at >= 65 (very loose >= 85); leave only past
  // the exit margin of 8 (tight held until > 43, very tight until > 23, loose until < 57, very loose until < 77).
  const BANDS = { '-2': 'very_tight', '-1': 'tight', '0': 'neutral', '1': 'loose', '2': 'very_loose' }, RANK = { very_tight: -2, tight: -1, neutral: 0, loose: 1, very_loose: 2 };
  function entry(x) { return x <= 15 ? -2 : x <= 35 ? -1 : x >= 85 ? 2 : x >= 65 ? 1 : 0; }
  function bandStep(prevName, x) {
    const p = RANK[prevName] || 0, e = entry(x); let r = e;
    if (p !== 0 && !(e !== 0 && Math.sign(e) === Math.sign(p) && Math.abs(e) >= Math.abs(p))) {
      if (p === -2) r = x <= 23 ? -2 : x <= 43 ? -1 : e; else if (p === -1) r = x <= 43 ? -1 : e;
      else if (p === 2) r = x >= 77 ? 2 : x >= 57 ? 1 : e; else if (p === 1) r = x >= 57 ? 1 : e;
    }
    return BANDS[r];
  }
  function nudgeStyle(st, d) { st.command.style = Math.max(0, Math.min(100, st.command.style + d)); st.command.band = bandStep(st.command.band, st.command.style); return st; }
  return { K, load, save, update, clear, bandStep, nudgeStyle, DEF };
})();
if (typeof module !== 'undefined') module.exports = DemoState;
