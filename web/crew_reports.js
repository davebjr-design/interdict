/* CREW REPORTS (Dave, 2026-11-24). When the captain gives an order the officer in charge answers in four parts:
 *   ACTION | STATUS CHANGE | CURRENT STATUS | CHANGE CONSEQUENCE      e.g. "Arm tube 1, aye. Capacitors charging, EM signature up 11 points. EM at 18, one of two tubes hot. Elevated, so somebody could take an interest."
 * Every number comes from the engine (our signatures in each category, the heat rate, the flight plan), read before and after the order.
 * - LADDER: how visible we are, in words (dark / negligible / elevated / conspicuous / lit up), from the same four-category signature the enemy sensors use.
 * - TIER: low-stakes orders get a curt answer (the action), a rise in visibility or an irreversible act gets more, a big one gets all four parts. Hands-on stations are curt, Auto stations are chatty.
 * - CONFIDENCE: own-ship readings are stated flat; a prediction near a ladder edge, or a read on a contact that is not firm, is hedged in the officer's own words.
 * - VOICE: each officer has 5 patterns per interaction (a pattern is the four parts as one template) and picks one at random, never the same one twice running.
 * - NUMBERS: never bare. A signature is named and given in points ("EM signature up 11 points, to 18"; 0.1 of signature reads as 7 points), heat is a time ("the sink fills in about 40 seconds"), small counts are words.
 * - HEDGES (reworked 2026-11-24): a hedge is not tacked on after the level phrase. HEDGE[officer].likely / .guess are templates that WRAP the plain level clause {L}
 *   ("elevated", or "still elevated" when nothing changed): "{L}, near as I can tell." -> "Elevated, near as I can tell." The flavour phrase from LV is used only when the line is not hedged.
 *   HEDGE[officer].read.likely / .guess are whole sentences about a contact solution (lock): when the doubt is about the target, not about us, that sentence is the consequence.
 * - LV phrases are single sentences, direction-neutral for 'to' (we can fall to a level as well as rise to it). LV and HEDGE may use {slots}.
 * - A reply says 'Captain' (or 'Cap') at most once; later vocatives are dropped when the parts are joined.
 * API: CrewReports.snap(E, s) -> state;  CrewReports.report({E, s, verb, officer?, mode, before, d, rnd, tier?}) -> {officer, text, parts, tier, level, conf};  CrewReports.LADDER, PATTERNS, LV, HEDGE, OFFICER */
(function (root) {
  'use strict';
  const LADDER = [{ k: 'dark', max: 0.33 }, { k: 'negligible', max: 0.43 }, { k: 'elevated', max: 0.60 }, { k: 'conspicuous', max: 0.75 }, { k: 'lit', max: 9 }];
  const LWORD = ['dark', 'negligible', 'elevated', 'conspicuous', 'lit up'];   // the plain level clause a hedge wraps
  const W = { thermal: 1, em: 1, reactor: 0.5, optical: 0.4 };   // the weights the enemy-view formula uses (engine theirVis)
  const levelOf = t => { for (let i = 0; i < LADDER.length; i++) if (t < LADDER[i].max) return i; return 4; };
  const edgeDist = t => Math.min(...LADDER.slice(0, 4).map(l => Math.abs(t - l.max)));
  const pts = v => Math.max(0, Math.round(v * 70));   // a signature level as "points": 0.1 of signature reads as 7
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const word = n => n == null || n === '' ? '' : (Number.isInteger(+n) && +n >= 0 && +n < WORDS.length ? WORDS[+n] : String(n));
  const plural = (n, one, many) => word(n) + ' ' + (+n === 1 ? one : many);
  const ptsW = n => n < 1 ? 'less than a point' : n === 1 ? '1 point' : n + ' points';
  const pct = v => Math.round(v * 100) + '%';
  const dur = sec => sec < 4 ? 'a few seconds' : sec < 90 ? 'about ' + Math.max(5, Math.round(sec / 5) * 5) + ' seconds' : sec < 150 ? 'about two minutes' : 'about ' + Math.round(sec / 60) + ' minutes';

  function snap(E, s) {
    const o = {}; let miss = 1;
    for (const c of E.CATS) { const sg = E.ourSigCat(s, c); o[c] = sg; miss *= 1 - Math.min(1, sg * W[c] * 0.7); }
    o.tot = 1 - miss; o.lvl = levelOf(o.tot); o.vis = E.ourVis(s); o.sinkH = s.sink ? s.sink.h : 0;
    try { o.rate = E.heatRate(s) * 100; } catch (e) { o.rate = 0; }
    o.speed = s.speed; o.posture = s.posture; o.vent = !!(s.vent && s.vent.on); o.pd = s.pd; o.launch = (s.me && s.me.launch) || 'rail';
    const cap = E.capOf ? E.capOf(s) : null; o.hot = cap ? cap.t.filter((u, i) => E.tubeKind(s, i) === 'msl' && u.q >= 0.999).length : 0; o.charging = cap ? cap.t.filter(u => u.on && u.q < 0.999).length : 0;
    o.nm = s.tubes.filter((x, i) => E.tubeKind(s, i) === 'msl').length; o.cap = cap ? cap.t.map(u => ({ on: u.on, q: u.q })) : [];
    o.volleys = s.volleys ? s.volleys.length : 0; o.probes = s.probes ? s.probes.length : 0; o.decoys = s.decoys ? s.decoys.left : 0; o.mag = s.mag ? s.mag.total : 0;
    return o;
  }
  const totFrom = (b, em, th) => { let miss = 1; for (const c of ['thermal', 'em', 'reactor', 'optical']) { const sg = c === 'em' ? em : c === 'thermal' ? th : b[c]; miss *= 1 - Math.min(1, sg * W[c] * 0.7); } return 1 - miss; };

  // ---------- the officers' ladder phrases: to[level] = three ways to say the new level (one sentence, works rising or falling), hold[level] = two ways to say "no change"
  const LV = {
    Abara: {
      to: [['Dark as a coal sack.', 'We are dark.', 'Dark, quiet as a church.'],
        ['Negligible, nobody out there is losing sleep.', 'Negligible, nothing worth a second look.', 'Negligible, which is where I like us.'],
        ['Elevated, so somebody could take an interest.', 'Elevated, we are worth a second look now.', 'Elevated, close in they could pick us out.'],
        ['Conspicuous, anyone with a decent array sees that.', 'Conspicuous, we are a lamp on a hill.', 'That makes us conspicuous.'],
        ['That lights us up.', 'We are lit up, all of us.', 'Lit up, they will hear that in the next system.']],
      hold: [['Still dark.', 'Dark, no change.'], ['Still negligible.', 'Negligible, no change.'], ['Still elevated.', 'Holding at elevated.'], ['Still conspicuous.', 'No better, no worse, still conspicuous.'], ['Still lit up.', 'Still bright as a flare.']] },
    Quill: {
      to: [['Signature is dark.', 'We are below the noise floor.', 'Dark, as designed.'],
        ['Negligible, within the noise.', 'Negligible, Captain.', 'Negligible, which I would call safe, for now.'],
        ['Elevated, detectable at close range.', 'Elevated, Captain.', 'Elevated, which is no longer comfortable.'],
        ['Conspicuous, anything with a working array will see it.', 'Conspicuous; we are no longer subtle.', 'Conspicuous, and I expect it to be noticed.'],
        ['We are lit up, Captain.', 'Lit up; that is a beacon.', 'Full signature, so everyone will have it.']],
      hold: [['No change, still dark.', 'Still dark, Captain.'], ['No change, still negligible.', 'Still negligible, Captain.'], ['Still elevated, Captain.', 'No change, still elevated.'], ['Still conspicuous, Captain.', 'No change, still conspicuous.'], ['Still lit up, Captain.', 'No change; we remain a beacon.']] },
    Dace: {
      to: [['Dark, properly dark!', 'Dark, we are a cold rock, love it.', 'Dark, which is the good one.'],
        ['Negligible, practically a rounding error.', 'Negligible, so nobody will see it.', 'Negligible, which is lovely.'],
        ['Elevated, so they will notice if they are looking.', 'Elevated, which is interesting, and also not great.', 'Elevated, oh, that is not ideal.'],
        ['Conspicuous, which is fascinating and, um, bad.', 'Conspicuous, every IR array out there will love us.', 'Conspicuous, we are glowing.'],
        ['Lit up, which is terrible, and also a bit impressive.', 'Lit up like a furnace, Captain.', 'Lit up, everybody sees us, sorry.']],
      hold: [['Still dark.', 'Dark, same as before.'], ['Still negligible.', 'Negligible, no change.'], ['Still elevated.', 'Elevated, same as before.'], ['Still conspicuous.', 'Conspicuous, no change.'], ['Still lit up.', 'Still glowing, I am afraid.']] },
    Castellan: {
      to: [['Dark as a mineshaft.', 'We are running dark, darlin\'.', 'Dark, and real quiet.'],
        ['Negligible, she is purring.', 'Negligible, nothing to speak of.', 'Negligible, Cap, barely a whisper.'],
        ['Elevated, she is starting to talk.', 'Elevated, and it will climb if you keep this up.', 'Elevated, she is running warm.'],
        ['Conspicuous, she is shouting now.', 'Conspicuous, Cap, you can hear her in the next county.', 'Conspicuous, and that is not my favorite.'],
        ['Lit up, every sensor out there hears that.', 'Lit up like a Christmas tree, Cap.', 'Lit up bright, she is screaming.']],
      hold: [['Still dark.', 'Dark, same as before.'], ['Still negligible.', 'Negligible, no change, Cap.'], ['Still elevated.', 'Holding at elevated.'], ['Still conspicuous.', 'Conspicuous, no change.'], ['Still lit up.', 'Still lit up, Cap.']] },
    Pell: {   // Pell always puts a real number under the joke: {subtle} is our subtlety out of ten, {tot} the overall signature
      to: [['Dark; subtlety {subtle} out of ten.', 'Dark, spectacularly dull, overall signature {tot}.', 'Dark; I give it a {subtle}.'],
        ['Negligible; I would rate our subtlety a {subtle}.', 'Negligible, in case you were worried; overall signature {tot}.', 'Negligible; subtlety {subtle} out of ten.'],
        ['Elevated; subtlety {subtle} out of ten.', 'Elevated, and I did mention it; overall signature {tot}.', 'Elevated; I give our subtlety a {subtle}.'],
        ['Conspicuous; subtlety {subtle} out of ten.', 'Conspicuous, overall signature {tot}, and everyone will have noticed.', 'Conspicuous; somebody is going to be rude about our {subtle} out of ten.'],
        ['Lit up; subtlety {subtle} out of ten, for what it is worth.', 'Lit up at {tot}; do tell me this was the plan.', 'Lit up, overall signature {tot}, and I would footnote that if I were not busy.']],
      hold: [['Still dark, {tot} overall.', 'Dark, unchanged; subtlety {subtle}.'], ['Still negligible, {tot} overall.', 'Negligible, unchanged; subtlety {subtle}.'], ['Still elevated, {tot} overall.', 'Elevated, unchanged; subtlety {subtle}.'], ['Still conspicuous, {tot} overall.', 'Conspicuous, unchanged; subtlety {subtle}.'], ['Still lit up, {tot} overall.', 'Lit up, unchanged; subtlety {subtle}.']] } };
  const HEDGE = {   // likely / guess wrap the plain level clause {L} ("elevated" or "still elevated"); read.* are whole sentences about a contact solution
    Abara: { likely: ['{L}, near as I can tell.', 'Probably {L}.', '{L}, give or take.'], guess: ['Best guess, {L}.', '{L}, but I would not bet the ship on it.', '{L}, maybe; do not hold me to it.'],
      read: { likely: ['The solution is decent, not perfect.', 'Good enough to shoot on, near as I can tell.', 'The track is holding, give or take.'], guess: ['The track is thin, so do not hold me to the numbers.', 'That solution is a guess, and I would not bet the ship on it.', 'Soft numbers for now, Captain.'] } },
    Quill: { likely: ['{L}, in my assessment.', 'Probably {L}, though not certainly.', '{L}, with fair confidence.'], guess: ['{L}, unconfirmed.', 'Possibly {L}; low confidence.', '{L}, though I would not rely on it yet.'],
      read: { likely: ['The solution is probable, not certain.', 'A fair solution, Captain, not a firm one.', 'I would call the solution sound, with reservations.'], guess: ['The solution is unconfirmed.', 'Low confidence in that solution, Captain.', 'I would not rely on that solution yet.'] } },
    Dace: { likely: ['{L}, I think!', 'Pretty sure that is {L}.', '{L}, probably; the numbers twitch right at the edge.'], guess: ['Gut feeling, {L}.', '{L}, maybe, but I could be totally wrong.', 'Honestly guessing here, {L}.'],
      read: { likely: ['The solution looks pretty good, I think!', 'Pretty sure the solution holds.', 'The solution is probably fine.'], guess: ['The solution is honestly a guess.', 'That solution could be totally wrong.', 'Gut feeling on that solution, mostly.'] } },
    Castellan: { likely: ['{L}, I reckon.', '{L}, near enough.', '{L}, more or less, Cap.'], guess: ['{L}, maybe; do not quote me.', 'Wild guess, {L}.', '{L}, but she is hard to read right now.'],
      read: { likely: ['Solution looks right, I reckon.', 'Solution is near enough.', 'Solution is good, more or less.'], guess: ['Solution is a wild guess, darlin\'.', 'That solution could be anything, really.', 'Do not quote me on that solution.'] } },
    Pell: { likely: ['{L}, probably; I would put it at seven in ten.', '{L}, within reason; call it six in ten.', '{L}; my model mostly agrees, about eight in ten.'], guess: ['{L}, very approximately; confidence four in ten.', 'My guess is {L}, and I dislike guessing.', '{L}, possibly; call it three in ten.'],
      read: { likely: ['The solution is probably sound, seven in ten.', 'The solution is good within reason.', 'My model mostly agrees with the solution, eight in ten.'], guess: ['The solution is a guess, four in ten, and I dislike guessing.', 'The solution is very approximate.', 'Three in ten on that solution; do not quote me.'] } } };
  const READ_VERBS = new Set(['lock']);   // a hedge on these is about the contact, not about our own signature

  // ---------- who answers, and the patterns. A pattern is "action | change | current | consequence" with {slots}; empty parts drop out.
  const OFFICER = { arm: 'Abara', armall: 'Abara', bleed: 'Abara', bleedall: 'Abara', kind: 'Abara', fire: 'Abara', firequeue: 'Abara', probe: 'Abara', decoy: 'Abara', destruct: 'Abara', lock: 'Abara', refresh: 'Abara', mark: 'Abara', pdon: 'Abara', pdoff: 'Abara', launch: 'Abara', speed: 'Abara', still: 'Abara', evade: 'Abara', route: 'Abara', brace: 'Abara',
    classify: 'Quill', rescan: 'Quill', ping: 'Quill', quiet: 'Quill', rule: 'Quill', vent: 'Dace', ventstop: 'Dace', cut: 'Dace', redline: 'Castellan', hail: 'Pell', challenge: 'Pell' };
  const P = {
    Abara: {
      arm: ['Arm tube {n}, aye.|Capacitors charging, EM signature up {d}.|EM at {em}, {hot} of {nt} tubes hot.|{cons}', 'Tube {n} coming up.|That is {d} more on our EM signature.|EM reads {em}, with {hot} of {nt} hot.|{cons}', 'Aye, readying tube {n}.|The capacitor whine adds {d} to our EM signature.|EM at {em} now, {hot} of {nt} tubes hot.|{cons}', 'Tube {n}, aye, whine starts in a second.|EM signature up {d}.|We read {em} on EM, {hot} of {nt} hot.|{cons}', 'Charging tube {n}, Captain.|Hot in {secs} seconds, EM signature up {d}.|EM at {em} once it is hot.|{cons}'],
      armall: ['All tubes, aye.|EM signature up {d} once they are hot.|That puts us at {em} on EM.|{cons}', 'Readying every tube.|The whine climbs {d} over {secs} seconds.|EM settles at {em}.|{cons}', 'Aye, all tubes hot.|That is {d} more on our EM signature.|We read {em} on EM in about {secs} seconds.|{cons}', 'Everything charging, Captain.|EM signature up {d}.|EM reads {em} once they are hot.|{cons}', 'All tubes coming up, aye.|Hot in {secs} seconds, {d} more on EM.|EM at {em} total.|{cons}'],
      bleed: ['Tube {n} standing down, aye.|EM signature down {d}.|EM at {em}, {hot} of {nt} tubes hot.|{cons}', 'Bleeding tube {n}.|That takes {d} off our EM signature.|EM reads {em}.|{cons}', 'Tube {n} going cold, aye.|The whine drops, EM signature down {d}.|We read {em} on EM, {hot} of {nt} hot.|{cons}', 'Dumping the charge on tube {n}.|EM signature down {d}.|That leaves {em} on EM.|{cons}', 'Aye, tube {n} off.|EM signature drops {d}.|EM sitting at {em}.|{cons}'],
      bleedall: ['All tubes cold, aye.|EM signature down {d}.|EM reads {em} now.|{cons}', 'Bleeding the lot.|The whine stops, EM signature down {d}.|EM at {em}.|{cons}', 'Dumping every charge, Captain.|That takes {d} off our EM signature.|We read {em} on EM.|{cons}', 'Aye, standing the tubes down.|EM signature drops {d}.|Down to {em} on EM.|{cons}', 'Everything cold, aye.|EM signature down {d}.|EM reads {em}.|{cons}'],
      kind: ['Tube {n} to {kind}, aye.|Retooling, {secs} seconds.|That leaves {nmT}.|', 'Swapping tube {n} over to {kind}.|Give it {secs} seconds.|We keep {nmT}.|', 'Aye, tube {n} takes {kind}.|The kid on the loader needs {secs} seconds.|That leaves {nmT}.|', 'Retooling tube {n} for {kind}, Captain.|About {secs} seconds.|We will have {nmT}.|', 'Tube {n}, {kind}, aye.|Cycling the loader, {secs} seconds.|That leaves {nmT}.|'],
      fire: ['Firing on {t}, aye.|{count} away, and the launch adds {d} to our EM signature.|EM reads {em}, impact in {eta} seconds.|{cons}', 'Birds away on {t}.|{count} in flight, launch pulse of {d} on EM.|We read {em} on EM, and they land in {eta} seconds.|{cons}', 'Fire, aye, {t} gets a salvo.|The launch puts {d} on our EM signature.|EM at {em} for now, impact in {eta} seconds.|{cons}', 'Salvo gone, Captain.|{count} missiles off the {launch}, EM signature up {d}.|EM reads {em}, {eta} seconds to impact.|{cons}', '{t}, firing.|The launch adds {d} on EM.|EM at {em}, {eta} seconds to impact.|{cons}'],
      firequeue: ['Fire, aye, but the tubes are cold, so I am charging first.|Hot in {secs} seconds, then the launch adds {d} to our EM signature.|EM will read {em} on the shot.|{cons}', 'Tubes are cold, readying, then firing on {t}.|Hot in {secs} seconds.|The shot puts us at {em} on EM.|{cons}', 'Aye, charging first, Captain.|It goes in {secs} seconds.|Expect {em} on EM when it does.|{cons}', 'Not hot yet; I fire the moment they are.|About {secs} seconds.|The shot will read {em} on EM.|{cons}', 'Charging, then {t} gets it.|Hot in {secs} seconds, and the launch adds {d} on EM.|EM reads {em} on the shot.|{cons}'],
      probe: ['Probe away on {t}, aye.|One probe out, {left} left.|It reaches them in {eta} seconds.|{cons}', 'Probing {t}.|{left} left in the magazine after this one.|Contact in {eta} seconds.|{cons}', 'Aye, feeler out to {t}.|Small launch signature, {left} probes left.|It arrives in {eta} seconds.|{cons}', 'Probe launched, Captain.|That leaves {left}.|It gets there in {eta} seconds.|{cons}', 'Sending a probe at {t}.|Small launch signature.|{eta} seconds out, {left} left.|{cons}'],
      decoy: ['Decoy away, aye.|{left} left in the rack.|It lights up in {secs} seconds.|{cons}', 'Throwing a decoy.|Small launch signature, {left} left.|It goes bright in {secs} seconds.|{cons}', 'Decoy out, Captain.|It starts looking like a ship in {secs} seconds.|{left} left in the rack.|{cons}', 'Aye, decoy launched.|Small launch signature.|{left} left, lit in {secs} seconds.|{cons}', 'Out it goes.|{left} left.|Bright in {secs} seconds.|{cons}'],
      destruct: ['Command-destruct, aye.|{vols} down.|That was a radio call, short but loud.|{cons}', 'Killing the birds.|{vols} gone.|The call went out on the radio, brief as I could make it.|{cons}', 'Destruct sent, Captain.|{vols} down.|One short burst on the radio.|{cons}', 'Aye, scrubbing the birds.|{vols} gone.|It went out in the clear, but it was brief.|{cons}', 'Birds are dead, aye.|{vols} destroyed.|The call went out in the clear.|{cons}'],
      lock: ['Locking {t}, aye.|Solution in about {secs} seconds.|Track is {track}.|{cons}', 'Taking a lock on {t}.|{secs} seconds to a firing solution.|The track is {track}.|{cons}', '{t} locked, aye.|The solution builds over {secs} seconds.|Track reads {track}.|{cons}', 'Aye, tracking {t}.|About {secs} seconds to a solution.|Track is {track} for now.|{cons}', 'Lock on {t}, Captain.|Give me {secs} seconds for a solution.|Track is {track}.|{cons}'],
      refresh: ['Refreshing the solution on {t}, aye.|About {secs} seconds.|The old one has gone stale.|', 'Reworking {t}.|Give me {secs} seconds.|The old numbers have gone off.|', 'Aye, new solution on {t}.|{secs} seconds to rebuild.|Do not fire on the old one.|', 'Rebuilding {t}.|Takes {secs} seconds.|Stale until then.|', 'Fresh solution coming, Captain.|About {secs} seconds.|Stale until then.|'],
      mark: ['{t} marked hostile, aye.|||', 'Hostile on {t}.|||', 'Aye, {t} is red.|||', 'Marked, Captain, {t} is hostile.|||', '{t}, hostile, noted.|||'],
      pdon: ['Point defence active, aye.|Radars lit, EM signature up {d}, heat up {dth}.|We read {em} on EM and {th} on heat.|{cons}', 'Going active.|That is {d} on our EM signature and {dth} on heat.|EM {em}, heat {th}.|{cons}', 'Aye, lighting the radars.|EM signature up {d}, and every receiver out there sees it.|EM reads {em}.|{cons}', 'Point defence hot, Captain.|EM signature up {d}, heat signature up {dth}.|EM at {em}, heat at {th}.|{cons}', 'Radars up, aye.|That puts {d} on our EM signature.|We read {em} on EM.|{cons}'],
      pdoff: ['Point defence cold, aye.|EM signature down {d}, heat down {dth}.|We read {em} on EM and {th} on heat.|{cons}', 'Radars off.|That takes {d} off our EM signature.|EM reads {em}.|{cons}', 'Going cold, Captain.|EM signature drops {d}.|EM at {em}.|{cons}', 'Aye, standing the radars down.|EM signature down {d}.|Down to {em} on EM.|{cons}', 'Cold again.|EM down {d}, heat down {dth}.|EM at {em}, heat at {th}.|{cons}'],
      launch: ['Launcher to {launch}, aye.|Each shot puts {pulse} on our EM signature and {puff} on heat.|Reload is {cycle}.|{cons}', 'Switching to {launch}.|Launch pulse of {pulse} on EM, {puff} on heat.|The cycle is {cycle}.|{cons}', '{launch} launch, Captain.|Every shot puts {pulse} on our EM signature.|Reload is {cycle}.|{cons}', 'Aye, {launch}.|Each shot costs {pulse} on EM and {puff} on heat.|The cycle is {cycle}.|{cons}', 'Changing the launcher to {launch}.|A shot reads {pulse} on EM, {puff} on heat.|Reload is {cycle}.|{cons}'],
      speed: ['{speed}, aye.|{heat}.|Sink is at {sink}.|{cons}', 'Coming to {speed}.|At that speed {heat}.|Sink reads {sink}.|{cons}', 'Aye, {speed}.|{heat}.|The sink is {sink} full.|{cons}', 'Setting {speed}, Captain.|{heat}.|Sink at {sink}.|{cons}', 'Going to {speed}.|{heat}.|The sink is {sink} full.|{cons}'],
      still: ['All stop, aye.|Flipping and braking, then the drive goes off.|Sink at {sink}, {heatS}.|{cons}', 'Holding still.|Drive off after the flip.|Sink at {sink}.|{cons}', 'Aye, dead in space.|Brake first, then quiet.|Sink at {sink}, {heatS}.|{cons}', 'Stopping the ship, Captain.|Flip, brake, hold.|Sink at {sink}.|{cons}', 'All stop.|Quietest we can be, once we are stopped.|Sink at {sink}, {heatS}.|{cons}'],
      evade: ['Evasive, aye.|The weave makes us about 20 percent louder, but our analysts read about 10 percent faster.|Sink at {sink}, {heatS}.|{cons}', 'Going evasive.|We are louder, but harder to pin.|Sink at {sink}.|{cons}', 'Aye, jinking.|About 20 percent louder; the analysts get new angles and read 10 percent faster.|Sink at {sink}.|{cons}', 'Evasive course, Captain.|The weave costs us signature.|Sink at {sink}, {heatS}.|{cons}', 'Weaving.|Louder, but they cannot settle on us.|The sink is {sink} full.|{cons}'],
      route: ['New course plotted, aye.|{legs}, about {mins} minutes, peak {g} g.|It burns {prop} tonnes of propellant, and {heat}.|{cons}', 'Course laid in.|{legs}, about {mins} minutes.|Peak {g} g, {flipW}.|{cons}', 'Aye, new course.|{flipW}, and up to {g} g.|About {mins} minutes, and {heat}.|{cons}', 'Plotted, Captain.|About {mins} minutes over {legs}.|{g} g at the hardest, {prop} tonnes of propellant.|{cons}', 'Following the plan, aye.|{flipW}.|Up to {g} g, and {heat}.|{cons}'],
      brace: ['Bracing, aye.|Crew strapping in.|Secure in {secs} seconds.|', 'Everybody down, Captain.|Strapping in.|Secure in {secs} seconds.|', 'Aye, brace.|Crew are getting to their couches.|{secs} seconds to secure.|', 'Brace, brace.|They are strapping in.|Secure in {secs} seconds.|', 'Bracing the crew, aye.|Couches in {secs} seconds.|Hands-on stations lock until they unstrap.|'] },
    Quill: {
      classify: ['Classifying {t}, Captain.|Analysts on it, readings begin now.|At present we have {conf}.|', 'Analysts to {t}, aye.|Heat, reactor and eclipse readings will firm up over time.|The board shows {conf}.|', 'Taking {t} for classification.|It will take a few minutes to settle.|Where we stand: {conf}.|', 'Putting everyone on {t}, Captain.|Readings starting; do not expect miracles.|As things are, we have {conf}.|', 'Classification of {t} under way.|The picture firms up with time.|The board shows {conf}, for the moment.|'],
      rescan: ['Rescanning {t}, Captain.|An analyst goes back on it.|The last reading had gone stale.|', 'Aye, {t} again.|Fresh readings coming.|The board shows {conf}.|', 'Analyst back on {t}.|New read in progress.|At present we have {conf}.|', 'Re-reading {t}, Captain.|It will take a few minutes.|The previous read has gone cold.|', 'Another pass at {t}, aye.|I want better numbers.|Where we stand: {conf}.|'],
      ping: ['Active ping on {t}, Captain.|A crisp fix in a moment, and heat signature up {dth}.|We read {th} on heat while it echoes.|{cons}', 'Pinging {t}, aye.|The fix will be sharp, and everyone listening heard it.|Heat signature {th} for the next while.|{cons}', 'Ping sent.|Position on {t} will tighten.|Heat signature reads {th}; a warship will have us.|{cons}', 'Active on {t}, aye.|It costs us {dth} of heat signature.|We read {th} on heat, and they will know where we are.|{cons}', 'Sounding {t}.|One good fix, at a price.|Heat signature {th} while it echoes, Captain.|{cons}'],
      quiet: ['Going quiet, Captain.|Sensors dark and no launches for {secs} seconds.|Overall signature from {tot0} to {tot}.|{cons}', 'Running quiet, aye.|EM signature down {d}.|Overall signature {tot}, good for {secs} seconds.|{cons}', 'Quiet, Captain.|We shed {d} of EM signature.|Silent for {secs} seconds, then we come back up.|{cons}', 'Silent running, aye.|Overall signature drops from {tot0} to {tot}.|It holds for {secs} seconds.|{cons}', 'Sensors dark.|EM signature falls {d}.|{secs} seconds, then we come back up, I am afraid.|{cons}'],
      rule: ['{t} ruled out, Captain.|||', 'Aye, {t} dismissed as junk.|||', '{t} struck from the board.|||', 'Dismissing {t}, Captain.|||', 'Ruled out {t}, aye; if I am wrong, we have lost it.|||'] },
    Dace: {
      vent: ['Fins out, aye!|{heat}.|Sink at {sink} and falling.|{cons}', 'Venting, opening the fins!|Oh, that is fast: {heat}.|Sink at {sink}.|{cons}', 'Fins out, Captain, and she is bright.|{heat}.|Sink reads {sink}.|{cons}', 'Aye, venting.|The fins dump heat straight to space, so {heat}.|We are starting from {sink}.|{cons}', 'Dumping heat now!|{heat}, which is honestly a lot.|Sink at {sink}.|{cons}'],
      ventstop: ['Fins in, aye.|Venting stops, and {heat}.|Sink at {sink}.|{cons}', 'Retracting the fins.|{heat}.|Sink reads {sink}.|{cons}', 'Fins are in, Captain.|We stop shining.|Sink at {sink}, {heatS}.|{cons}', 'Aye, closing up.|Our heat signature drops.|Sink at {sink}.|{cons}', 'Pulling the fins in.|Back to normal, so {heat}.|Sink at {sink}.|{cons}'],
      cut: ['Cutting thrust, aye.|Less engine heat, so {heat}.|Sink at {sink}.|{cons}', 'Easing the drive.|{heat}.|Sink reads {sink}.|{cons}', 'Aye, backing off.|Drive heat drops, and {heat}.|Sink at {sink}.|{cons}', 'Throttling down, Captain.|{heat}, which is better.|Sink at {sink}.|{cons}', 'Dropping the drive a notch.|{heat}.|Sink at {sink}.|{cons}'] },
    Castellan: {
      redline: ['Redline, aye, hold on to something.|The sink fills in about {secs} seconds.|Sink at {sink} now.|{cons}', 'Giving her everything, Cap.|She fills the sink in {secs} seconds at this burn.|Sink is at {sink}.|{cons}', 'Redline it is, darlin\'.|{secs} seconds of sink at this rate.|Starting from {sink}.|{cons}', 'All the way up, Captain.|She will not take it for more than {secs} seconds.|Sink at {sink}.|{cons}', 'Come on, sweetheart, burn.|{secs} seconds before the sink is full.|Sink reads {sink} and climbing.|{cons}'] },
    Pell: {
      hail: ['Hailing {t}, Captain.|Open channel, a small emission.||{cons}', 'Aye, hailing {t}.|Any reply is soft evidence at best.||{cons}', 'Voice on the open channel to {t}.|Anyone can lie on a radio, I should point out.||{cons}', 'Hailing {t}; I will be charming.|Small emission on our side.||{cons}', 'Opening a channel to {t}.|We are announcing ourselves, which I note for the record.||{cons}'],
      challenge: ['Challenging {t}, Captain.|Directional beam, so quiet but not silent.||{cons}', 'Transponder challenge to {t}, aye.|A friend answers with the countersign.||{cons}', 'Beam on {t}.|If it is hostile, it may notice the beam.||{cons}', 'Challenge sent to {t}.|A tight beam, a small leak.||{cons}', 'Asking {t} who it is.|Politely, on a directional beam.||{cons}'] } };

  function fmt(tpl, v) { return tpl.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? String(v[k]) : ''); }
  const last = {};
  function pick(arr, key, rnd) { let i = Math.floor((rnd || Math.random)() * arr.length); if (arr.length > 1 && last[key] === i) i = (i + 1) % arr.length; last[key] = i; return arr[i]; }
  const cap1 = p => p.charAt(0).toUpperCase() + p.slice(1);
  // one 'Captain' (or 'Cap') per reply: later vocatives go, with their commas
  function oneVocative(text) {
    let seen = false;
    return text.replace(/(,\s*)?\b(Captain|Cap)\b(\s*,)?/g, (m, pre, w, post) => { if (!pre) return m; if (!seen) { seen = true; return m; } return post ? ',' : ''; }).replace(/\s+([.,;!?])/g, '$1');
  }

  // ---------- fill the slots for each interaction from the before / after readings
  function slots(x) {
    const { E, s, verb, b, a } = x, d = x.d || {}, v = {}, rs = (E.P && E.P.secPerMin) || 16, R = E.RULES || {};
    const pe = pts(a.em) - pts(b.em), sinkPct = a.sinkH * 100;
    v.sink = Math.round(sinkPct) + '%'; v.rate = Math.abs(a.rate).toFixed(1) + '%'; v.drain = v.rate;
    v.heat = a.rate > 0.05 ? (sinkPct >= 99.5 ? 'the sink is full' : 'the sink fills in ' + dur((100 - sinkPct) / a.rate * rs)) : a.rate < -0.05 ? (sinkPct < 0.5 ? 'the sink stays empty' : 'the sink empties in ' + dur(sinkPct / -a.rate * rs)) : 'the sink holds steady';
    v.heatS = a.rate > 0.05 ? (sinkPct >= 99.5 ? 'full' : 'filling, full in ' + dur((100 - sinkPct) / a.rate * rs)) : a.rate < -0.05 ? (sinkPct < 0.5 ? 'empty' : 'draining, empty in ' + dur(sinkPct / -a.rate * rs)) : 'holding steady';
    v.em = pts(a.em); v.th = pts(a.thermal); v.d = ptsW(Math.abs(pe)); v.dth = ptsW(Math.abs(pts(a.thermal) - pts(b.thermal)));
    v.tot = pct(a.tot); v.tot0 = pct(b.tot); v.subtle = word(Math.max(0, Math.min(10, Math.round(10 * (1 - a.tot / 0.85)))));
    v.nm = a.nm; v.nt = word(a.nm); v.hot = word(a.hot); v.nmT = a.nm ? plural(a.nm, 'missile tube', 'missile tubes') : 'no missile tubes';
    const L = (E.LAUNCH || {})[a.launch] || { em: 0.9, th: 0.1 }; v.pulse = ptsW(pts(L.em)); v.puff = ptsW(pts(L.th));
    v.launch = a.launch === 'gas' ? 'cold gas' : 'rail'; v.cycle = a.launch === 'gas' ? 'slow' : 'fast'; v.n = d.n; v.t = d.t || 'the contact';
    const sp = E.SPEED && E.SPEED[a.speed] && E.SPEED[a.speed].label; v.speed = !sp ? a.speed : /redline/i.test(sp) ? 'redline' : sp + ' drive';
    v.secs = d.secs != null ? Math.round(d.secs) : (['arm', 'armall'].includes(verb) ? Math.round((R.capTime || 0.5) * rs) : '');
    v.left = d.left == null ? '' : +d.left === 0 ? 'none' : word(d.left); v.count = word(d.count); v.eta = d.eta != null ? Math.round(d.eta) : '';
    const kd = String(d.kind || '').toLowerCase(); v.kind = !kd ? 'the other load' : /s$/.test(kd) ? kd : kd + 's'; v.mags = a.mag;
    v.track = ({ passive: 'passive only', track: 'firm', lock: 'locked' })[d.track] || d.track || 'passive only'; v.conf = d.conf || 'no call yet';
    v.mins = d.mins != null ? d.mins : (a.rate < -0.05 ? Math.max(1, Math.round(a.sinkH * 100 / -a.rate)) : '');
    v.legs = d.legs != null ? plural(d.legs, 'leg', 'legs') : ''; v.g = d.g; v.flip = d.flip; v.prop = d.prop; v.flipW = d.flip ? 'first flip in ' + d.flip + ' seconds' : 'no flip on this one';
    v.vols = d.n != null ? plural(d.n, 'volley', 'volleys') : 'the volleys';
    return v;
  }

  // ---------- projected "after" for orders whose effect ramps in (capacitors, launch spikes)
  function project(x) {
    const { E, s, verb } = x, a = Object.assign({}, x.a), R = E.RULES || {};
    if (['arm', 'armall', 'bleed', 'bleedall'].includes(verb) && E.capOf) {
      const cap = E.capOf(s), q = cap.t.map((u, i) => E.tubeKind(s, i) === 'msl' ? (u.on ? 1 : (u.q > 0 && verb.startsWith('bleed') ? 0 : u.q)) : 0), sum = q.reduce((p, c) => p + c, 0);
      const target = Math.min((R.capHold || 0.32) * 1.3, (R.capHold || 0.32) * sum / 2), now = E.capEm(s); a.em = a.em + (target - now); a.hot = verb.startsWith('bleed') ? 0 : q.filter(c => c >= 0.999).length || Math.min(a.nm, Math.round(sum));
      if (verb === 'arm' && !x.d.n) a.hot = Math.round(sum); a.hot = Math.min(a.nm, a.hot); if (verb.startsWith('bleed')) a.hot = a.cap.filter((u, i) => u.q >= 0.999).length; a.tot = totFrom(a, a.em, a.thermal); a.lvl = levelOf(a.tot);
    }
    if (verb === 'fire' || verb === 'firequeue') { const L = (E.LAUNCH || {})[a.launch] || { em: 0.9, th: 0.1 }, capNow = verb === 'firequeue' ? 0.32 * 0.65 : 0; a.em = Math.min(1.5, a.em + L.em + capNow); a.thermal = Math.min(1.5, a.thermal + L.th); a.tot = totFrom(a, a.em, a.thermal); a.lvl = levelOf(a.tot); x.d.dpts = pts(L.em); }
    return a;
  }

  // ---------- confidence and stakes
  function confidence(x, a, b) {
    let c = 'sure'; const marg = edgeDist(a.tot);
    if (marg < 0.05) c = 'likely';
    if (x.d.conf0) c = x.d.conf0;   // a contact read set by the caller: 'sure' | 'likely' | 'guess'
    return c;
  }
  const IRREVERSIBLE = new Set(['fire', 'firequeue', 'destruct', 'ping', 'redline', 'vent', 'pdon', 'decoy', 'probe']);
  function tierOf(x, a, b) { let k = 0; if (a.lvl > b.lvl) k += 2; if (a.lvl >= 3) k += 2; if (IRREVERSIBLE.has(x.verb)) k += 1; if (Math.abs(a.tot - b.tot) > 0.08) k += 1; if (x.mode === 'hands-on') k -= 1; if (x.mode === 'auto') k += 0; return k <= 0 ? 0 : k <= 2 ? 1 : 2; }

  // ---------- the consequence: the officer's level phrase, or, when unsure, a hedge wrapped round the plain level clause (or a sentence about the contact read)
  function consequence(x, officer, a, b, conf, v) {
    const same = a.lvl === b.lvl, H = HEDGE[officer] || HEDGE.Abara;
    if (conf !== 'sure' && READ_VERBS.has(x.verb)) { const rd = H.read || HEDGE.Abara.read; return fmt(pick(rd[conf] || rd.likely, 'hr:' + officer + conf, x.rnd), v); }
    if (conf !== 'sure') { v.L = (same ? 'still ' : '') + LWORD[a.lvl]; return fmt(pick(H[conf] || H.likely, 'hg:' + officer + conf, x.rnd), v); }
    const pool = LV[officer] || LV.Abara;
    return fmt(pick(same ? pool.hold[a.lvl] : pool.to[a.lvl], 'lv:' + officer + (same ? 'h' : 't') + a.lvl, x.rnd), v);
  }

  function report(x) {
    const verb = x.verb, officer = x.officer || OFFICER[verb]; if (!officer || !P[officer] || !P[officer][verb]) return null;
    const b = x.before, a0 = x.after || snap(x.E, x.s); x.b = b; x.a = a0; x.d = x.d || {}; const a = project(Object.assign({}, x, { a: a0 })); x.a = a;
    const tier = x.tier != null ? x.tier : tierOf(x, a, b), conf = confidence(x, a, b);
    const v = slots(x), noCons = x.noLevel || ['mark', 'rule', 'refresh', 'kind', 'classify', 'rescan', 'brace'].includes(verb);
    v.cons = noCons ? '' : consequence(x, officer, a, b, conf, v);
    const tpl = pick(P[officer][verb], 'pt:' + officer + ':' + verb, x.rnd), parts = tpl.split('|').map(p => cap1(fmt(p, v).replace(/\s+/g, ' ').trim()));
    const use = tier === 0 ? [0] : tier === 1 ? [0, 1, 3] : [0, 1, 2, 3], text = oneVocative(use.map(i => parts[i]).filter(Boolean).join(' '));
    return { officer, text, parts, tier, level: LADDER[a.lvl].k, conf, verb };
  }
  const API = { report, snap, LADDER, PATTERNS: P, LV, HEDGE, OFFICER, levelOf, pts };
  root.CrewReports = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
