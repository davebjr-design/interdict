/* CREW REPORTS (Dave, 2026-11-24). When the captain gives an order the officer in charge answers in four parts:
 *   ACTION | STATUS CHANGE | CURRENT STATUS | CHANGE CONSEQUENCE      e.g. "Arm tube 1, aye. Radio output up 11 points. Now 18, one tube hot of two. Still negligible."
 * Every number comes from the engine (our signatures in each category, the heat rate, the flight plan), read before and after the order.
 * - LADDER: how visible we are, in words (dark / negligible / elevated / conspicuous / lit up), from the same four-category signature the enemy sensors use.
 * - TIER: low-stakes orders get a curt answer (the action), a rise in visibility or an irreversible act gets more, a big one gets all four parts. Hands-on stations are curt, Auto stations are chatty.
 * - CONFIDENCE: own-ship readings are stated flat; a prediction near a ladder edge, or a read on a contact that is not firm, is hedged in the officer's own words.
 * - VOICE: each officer has 4-5 patterns per interaction (a pattern is the four parts as one template) and picks one at random, never the same one twice running.
 * API: CrewReports.snap(E, s) -> state;  CrewReports.report({E, s, verb, officer?, mode, before, d, rnd}) -> {officer, text, parts, tier, level, conf};  CrewReports.LADDER, CrewReports.PATTERNS */
(function (root) {
  'use strict';
  const LADDER = [{ k: 'dark', max: 0.33 }, { k: 'negligible', max: 0.43 }, { k: 'elevated', max: 0.60 }, { k: 'conspicuous', max: 0.75 }, { k: 'lit', max: 9 }];
  const W = { thermal: 1, em: 1, reactor: 0.5, optical: 0.4 };   // the weights the enemy-view formula uses (engine theirVis)
  const levelOf = t => { for (let i = 0; i < LADDER.length; i++) if (t < LADDER[i].max) return i; return 4; };
  const edgeDist = t => Math.min(...LADDER.slice(0, 4).map(l => Math.abs(t - l.max)));
  const pts = v => Math.max(0, Math.round(v * 70));   // a signature level as "points": 0.1 of signature reads as 7
  const num = v => v < 1 ? 'under one' : String(Math.round(v));

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

  // ---------- the officers' ladder phrases: to[level] = three ways to say the new level, hold[level] = two ways to say "no change"
  const LV = {
    Abara: {
      to: [['Dark as a coal sack.', 'We are dark.', 'Quiet as a church.'], ['Negligible. Nobody out there is losing sleep.', 'Still nothing worth a look.', 'Negligible, kid.'], ['Elevated. Somebody could take an interest.', 'We are warming up. Elevated.', 'Not quiet any more. Elevated.'], ['That is conspicuous, Captain.', 'Anyone with a decent array sees that.', 'We are a lamp on a hill now.'], ['That lights us up.', 'We are lit up. All of us.', 'They will hear that in the next system.']],
      hold: [['Still dark.', 'Dark, no change.'], ['Still negligible.', 'No change. Negligible.'], ['Still elevated.', 'Holding at elevated.'], ['Still conspicuous.', 'No better, no worse. Conspicuous.'], ['Still lit up.', 'Still bright as a flare.']] },
    Quill: {
      to: [['Signature is dark, Captain.', 'We are below the noise floor.', 'Dark, Captain. As designed.'], ['Negligible, Captain.', 'That is within the noise.', 'Negligible. I would call it safe.'], ['Elevated, Captain.', 'Elevated: detectable at close range.', 'That moves us out of the noise. Elevated.'], ['Conspicuous, Captain.', 'Conspicuous: anything with a working array will see it.', 'We are no longer subtle, Captain.'], ['We are lit up, Captain.', 'That is a beacon, Captain.', 'Full signature, Captain. Everyone will have it.']],
      hold: [['No change. Dark.', 'Still dark, Captain.'], ['No change. Negligible.', 'Still negligible, Captain.'], ['Still elevated, Captain.', 'No change. Elevated.'], ['Still conspicuous, Captain.', 'No change. Conspicuous.'], ['Still lit up, Captain.', 'No change. We remain a beacon.']] },
    Dace: {
      to: [['Dark! Properly dark.', 'We are a cold rock. Love it.', 'Dark, which is the good one.'], ['Negligible, so nobody will see it.', 'Negligible. Practically a rounding error.', 'Still negligible, which is lovely.'], ['Elevated, so it is noticeable if they are looking.', 'We are into elevated, which is interesting but not great.', 'That takes us to elevated.'], ['Conspicuous, which is, um, fascinating and bad.', 'We are glowing, Captain. Conspicuous.', 'Conspicuous. Everyone with an IR array will love us.'], ['We are lit up. That is, ah, terrible. Also impressive.', 'Lit up like a furnace, Captain.', 'Lit up. Everybody sees us. Sorry.']],
      hold: [['Still dark.', 'Dark, same as before.'], ['Negligible, no change.', 'Still negligible.'], ['Still elevated.', 'Elevated, same as before.'], ['Still conspicuous.', 'Conspicuous, no change.'], ['Still lit up.', 'Still glowing, I am afraid.']] },
    Castellan: {
      to: [['Dark as a mineshaft.', 'We are running dark, darlin\'.', 'Quiet. Real quiet.'], ['Negligible. She is purring.', 'Nothing to speak of.', 'Negligible, Cap. Barely a whisper.'], ['Elevated. She is getting loud.', 'Elevated, and it will climb if you keep this up.', 'Warm. Elevated.'], ['Conspicuous. She is shouting now.', 'That is conspicuous, Cap. You can hear her in the next county.', 'Conspicuous. Not my favorite.'], ['Lit up. Every sensor out there is hearing that.', 'We are a Christmas tree, Cap.', 'Lit up bright. She is screaming.']],
      hold: [['Still dark.', 'Dark, same as before.'], ['Negligible still.', 'No change, Cap. Negligible.'], ['Still elevated.', 'Holding elevated.'], ['Still conspicuous.', 'Conspicuous, no change.'], ['Still lit up.', 'Still lit up, Cap.']] },
    Pell: {
      to: [['Dark. I give it a nine out of ten.', 'Dark. Spectacularly dull.', 'Dark. I like it.'], ['Negligible. I would rate that a seven.', 'Negligible, I suppose.', 'Negligible, in case you were worried.'], ['Elevated. Two out of ten for subtlety.', 'Elevated, and I did warn you.', 'Elevated. Noted.'], ['Conspicuous. Subtlety: one out of ten.', 'Conspicuous. Everyone will have noticed that.', 'Conspicuous, Captain. Somebody is going to be rude about it.'], ['Lit up. Zero out of ten, for what it is worth.', 'We are lit up, Captain. Do tell me this was the plan.', 'Lit up. I would footnote that but I am a bit busy.']],
      hold: [['Still dark.', 'Dark, unchanged.'], ['Still negligible.', 'Negligible, unchanged.'], ['Still elevated.', 'Elevated, unchanged.'], ['Still conspicuous.', 'Conspicuous, unchanged.'], ['Still lit up.', 'Lit up, unchanged.']] } };
  const HEDGE = {   // trailing hedges: they close any sentence, so the consequence reads naturally whatever the level phrase was
    Abara: { likely: ['Near as I can tell.', 'Give or take.', 'Probably.'], guess: ['But that is a guess.', 'Though I would not bet the ship on it.', 'Do not hold me to it.'] },
    Quill: { likely: ['That is my assessment, Captain.', 'Probable, not certain.', 'I am fairly confident.'], guess: ['Unconfirmed, Captain.', 'Low confidence.', 'I would not rely on that yet.'] },
    Dace: { likely: ['I think!', 'Pretty sure, anyway.', 'Probably.'], guess: ['Honestly, that is a guess.', 'Could be totally wrong, though.', 'Gut feeling, mostly.'] },
    Castellan: { likely: ['Reckon so.', 'Give or take.', 'Near enough.'], guess: ['Wild guess, though.', 'Could be anything, really.', 'Do not quote me.'] },
    Pell: { likely: ['Probably.', 'Within reason.', 'My model agrees. Mostly.'], guess: ['A guess, and I dislike guessing.', 'Very approximately.', 'Do not quote me.'] } };
  const lower = t => t.charAt(0).toLowerCase() + t.slice(1);

  // ---------- who answers, and the patterns. A pattern is "action | change | current | consequence" with {slots}; empty parts drop out.
  const OFFICER = { arm: 'Abara', armall: 'Abara', bleed: 'Abara', bleedall: 'Abara', kind: 'Abara', fire: 'Abara', firequeue: 'Abara', probe: 'Abara', decoy: 'Abara', destruct: 'Abara', lock: 'Abara', refresh: 'Abara', mark: 'Abara', pdon: 'Abara', pdoff: 'Abara', launch: 'Abara', speed: 'Abara', still: 'Abara', evade: 'Abara', route: 'Abara', brace: 'Abara',
    classify: 'Quill', rescan: 'Quill', ping: 'Quill', quiet: 'Quill', rule: 'Quill', vent: 'Dace', ventstop: 'Dace', cut: 'Dace', redline: 'Castellan', hail: 'Pell', challenge: 'Pell' };
  const P = {
    Abara: {
      arm: ['Arm tube {n}, aye.|Capacitors charging, radio output up {d}.|Now {em}, {hot} of {nt} tubes hot.|{cons}', 'Tube {n} coming up.|That is {d} more on the radio.|We sit at {em} with {hot} of {nt} hot.|{cons}', 'Aye, readying tube {n}.|Spikes the radio by {d}.|Radio at {em}. {hot} of {nt} are hot.|{cons}', 'Tube {n}, aye. Whine starts in a second.|Radio up {d}.|Total {em}, {hot} of {nt} hot.|{cons}', 'Charging tube {n}, Captain.|Adds {d} to the whine.|{em} on the radio now.|{cons}'],
      armall: ['All tubes, aye.|Radio up {d} when they are all hot.|That puts us at {em}.|{cons}', 'Readying every tube.|Whine climbs by {d} over {secs} seconds.|Radio will sit at {em}.|{cons}', 'Aye, all hot.|{d} more on the radio.|We will be at {em} in {secs} seconds.|{cons}', 'Everything charging, Captain.|Radio up {d}.|{em} once they are hot.|{cons}', 'All tubes coming up, aye.|That is {d} on the whine.|{em} total.|{cons}'],
      bleed: ['Tube {n} standing down, aye.|Radio down {d}.|Now {em}, {hot} of {nt} hot.|{cons}', 'Bleeding tube {n}.|Takes {d} off the radio.|Radio at {em}.|{cons}', 'Tube {n} cold, aye.|Whine drops by {d}.|{em} now, {hot} hot.|{cons}', 'Dumping the charge on {n}.|Radio down {d}.|{em} on the radio.|{cons}', 'Aye, tube {n} off.|{d} less on the whine.|Sitting at {em}.|{cons}'],
      bleedall: ['All tubes cold, aye.|Radio down {d}.|Now {em}.|{cons}', 'Bleeding the lot.|Whine falls by {d}.|Radio at {em}.|{cons}', 'Dumping every charge, Captain.|Takes {d} off us.|{em} now.|{cons}', 'Aye, standing the tubes down.|That is {d} quieter.|Radio {em}.|{cons}', 'Everything cold.|Radio down {d}.|{em} total.|{cons}'],
      kind: ['Tube {n} to {kind}, aye.|Retooling, {secs} seconds.|{mags} left to load.|', 'Swapping tube {n} over to {kind}.|{secs} seconds.|Missile tubes now {nm}.|', 'Aye, tube {n} takes {kind}.|Busy for {secs} seconds.|{nm} missile tubes left.|', 'Retooling {n} for {kind}, Captain.|About {secs} seconds.|We keep {nm} on missiles.|', 'Tube {n}, {kind}. Give me {secs} seconds.|Cycling the loader.|{nm} missile tubes.|'],
      fire: ['Firing on {t}, aye.|{count} away, spike of {d} on the radio.|Radio now {em}, impact in {eta} seconds.|{cons}', 'Birds away on {t}.|{count} in flight. The launch pulse is {d}.|Radio at {em}. They land in {eta} seconds.|{cons}', 'Fire, aye. {t} is getting a salvo.|{d} on the radio from the launch.|{em} for the moment, impact in {eta}.|{cons}', 'Salvo gone, Captain.|{count} missiles, {d} spike from the {launch}.|Up to {em}. Impact in {eta} seconds.|{cons}', '{t}, firing.|Launch adds {d}.|We read {em}, {eta} to impact.|{cons}'],
      firequeue: ['Fire, aye. Tubes are cold, so I am readying them first.|Charge in {secs} seconds, then the launch spike of {d}.|Radio will read {em} on the shot.|{cons}', 'Tubes cold. Readying, then firing on {t}.|{secs} seconds to hot.|The launch adds {d}.|{cons}', 'Aye. Charging first, Captain.|It goes in {secs} seconds.|Expect {em} on the radio.|{cons}', 'Not hot yet. I will fire the moment they are.|{secs} seconds.|The shot will read {em}.|{cons}', 'Readying, then {t} gets it.|Hot in {secs}.|Spike of {d} when it goes.|{cons}'],
      probe: ['Probe away on {t}, aye.|One probe out, {left} left.|It reaches them in {eta} seconds.|{cons}', 'Probing {t}.|{left} probes in the magazine after this one.|Contact in {eta} seconds.|{cons}', 'Aye, feeler out to {t}.|Tube busy for a bit.|{eta} seconds to arrive, {left} left.|{cons}', 'Probe launched, Captain.|{left} left.|It arrives in {eta}.|{cons}', 'Sending a probe at {t}.|That is a small launch signature.|{eta} seconds out.|{cons}'],
      decoy: ['Decoy away, aye.|{left} left.|It lights up in {secs} seconds.|{cons}', 'Throwing a decoy.|{left} more in the rack.|It goes bright in {secs}.|{cons}', 'Decoy out, Captain.|It starts looking like a ship in {secs} seconds.|{left} remain.|{cons}', 'Aye, decoy launched.|Small launch signature.|{left} left, lit in {secs} seconds.|{cons}', 'Out it goes.|{left} left.|Bright in {secs}.|{cons}'],
      destruct: ['Command-destruct, aye.|{n} volleys down.|That was a radio call, and anyone listening heard it.|{cons}', 'Killing the birds.|{n} volleys gone.|It was a loud call on the radio.|{cons}', 'Destruct sent, Captain.|{n} down.|Everyone on the net heard it.|{cons}', 'Aye, scrubbing the volleys.|{n} gone.|That was a radio command, so we have been heard.|{cons}', 'Birds are dead.|{n} volleys.|The call went out in the clear.|{cons}'],
      lock: ['Locking {t}, aye.|Solution in about {secs} seconds.|Track is {track}.|{cons}', 'Taking a lock on {t}.|{secs} seconds to a solution.|It is a {track} track.|{cons}', '{t} locked, aye.|Solution builds for {secs} seconds.|Track reads {track}.|{cons}', 'Aye, tracking {t}.|About {secs} seconds.|{track} for now.|{cons}', 'Lock on {t}, Captain.|Give me {secs} seconds.|{track} track.|{cons}'],
      refresh: ['Refreshing the solution on {t}, aye.|About {secs} seconds.|It is stale now.|', 'Re-working {t}.|{secs} seconds.|The old one has gone off.|', 'Aye, new solution on {t}.|{secs} seconds to rebuild.|Old numbers are stale.|', 'Rebuilding {t} for you.|Takes {secs} seconds.|Do not fire on the old one.|', 'Fresh solution coming, Captain.|{secs} seconds.|Stale until then.|'],
      mark: ['{t} marked hostile, aye.|||', 'Hostile on {t}.|||', 'Aye, {t} is red.|||', 'Marked, Captain. {t} is hostile.|||', '{t}, hostile. Noted.|||'],
      pdon: ['Point defence active, aye.|Radars lit, radio up {d}, heat up {dth}.|We read {em} on the radio, {th} on heat.|{cons}', 'Going active.|{d} on the radio, {dth} on heat.|{em} radio, {th} heat.|{cons}', 'Aye, lighting the radars.|Everything can see us. Radio up {d}.|{em} on the radio.|{cons}', 'Point defence hot, Captain.|Radio {d} up, heat {dth} up.|Now {em} and {th}.|{cons}', 'Radars up.|That is {d} on the radio.|We are at {em}.|{cons}'],
      pdoff: ['Point defence cold, aye.|Radio down {d}, heat down {dth}.|Now {em} and {th}.|{cons}', 'Radars off.|Takes {d} off the radio.|{em} now.|{cons}', 'Going cold, Captain.|{d} quieter on the radio.|Radio at {em}.|{cons}', 'Aye, standing down the radars.|Radio down {d}.|{em} total.|{cons}', 'Cold again.|{d} off the radio, {dth} off the heat.|{em}, {th}.|{cons}'],
      launch: ['Launch to {launch}, aye.|{em} on the pulse, {th} on the heat puff.|Cycle time {cycle}.|{cons}', 'Switching to {launch}.|Pulse reads {em}, heat puff {th}.|Cycle {cycle}.|{cons}', '{launch} launch, Captain.|Radio {em}, heat {th} on each shot.|{cycle} to cycle.|{cons}', 'Aye, {launch}.|Each shot is {em} on the radio, {th} on heat.|Cycle {cycle}.|{cons}', 'Changing the launcher to {launch}.|{em} radio pulse, {th} heat.|{cycle} cycle.|{cons}'],
      speed: ['Speed {speed}, aye.|Heat rate {rate} per minute.|Sink at {sink}.|{cons}', 'Setting {speed}.|Sink filling at {rate} a minute.|Sink {sink}.|{cons}', 'Aye, {speed} drive.|{rate} a minute into the sink.|{sink} full.|{cons}', 'Coming to {speed}, Captain.|Heat {rate} per minute.|Sink at {sink}.|{cons}', '{speed}, aye.|Net {rate} a minute on the sink.|{sink} full now.|{cons}'],
      still: ['All stop, aye.|Flipping and braking.|Sink at {sink}, {rate} a minute.|{cons}', 'Holding still.|Drive off after the flip.|Sink {sink}.|{cons}', 'Aye, dead in space.|Brake first.|Heat {rate} a minute, sink {sink}.|{cons}', 'Stopping the ship, Captain.|Flip, brake, hold.|Sink at {sink}.|{cons}', 'All stop.|Quietest we can be.|Sink {sink}, {rate} a minute.|{cons}'],
      evade: ['Evasive, aye.|Weaving: analysts read faster, we are about 20 percent louder.|Heat {rate} a minute.|{cons}', 'Going evasive.|We are louder but harder to pin.|Sink {sink}.|{cons}', 'Aye, jinking.|20 percent louder, analysts about 10 percent faster.|Sink at {sink}.|{cons}', 'Evasive course, Captain.|The weave costs us signature.|Sink {sink}, {rate} a minute.|{cons}', 'Weaving.|Louder, but they cannot settle on us.|{sink} on the sink.|{cons}'],
      route: ['New course plotted, aye.|{legs} legs, {mins} minutes, peak {g} g.|{prop} tonnes of propellant, heat {rate} per minute.|{cons}', 'Course laid in.|{legs} legs, about {mins} minutes.|Peak {g} g, first flip in {flip} seconds.|{cons}', 'Aye, new course.|Ahead {speed}, first flip in {flip} seconds.|Accelerating to {g} g, heat {rate} a minute.|{cons}', 'Plotted, Captain.|{mins} minutes, {legs} legs.|{g} g at the hardest, {prop} tonnes of propellant.|{cons}', 'Following the plan.|First flip in {flip} seconds.|Up to {g} g. Heat {rate} per minute.|{cons}'],
      brace: ['Bracing, aye.|Crew strapping in.|{secs} seconds to secure.|', 'Everybody down, Captain.|Strapping in.|Secure in {secs}.|', 'Aye, brace.|Crew are getting to their couches.|{secs} seconds.|', 'Brace, brace.|They are strapping in.|Secure in {secs} seconds.|', 'Bracing the crew.|Couches in {secs}.|Hands-on stations are locked until they are free.|'] },
    Quill: {
      classify: ['Classifying {t}, Captain.|Analysts on it, readings begin now.|Confidence in the call will build from {conf}.|', 'Analysts to {t}, aye.|Heat, reactor and eclipse readings will start to firm up.|Currently {conf}.|', 'Aye. Taking {t} for classification.|It will take a few minutes to settle.|{conf} at present.|', 'Putting everyone on {t}, Captain.|Readings starting.|We hold {conf} for now.|', 'Classification of {t} under way, Captain.|The picture firms up over time.|{conf} for the moment.|'],
      rescan: ['Rescanning {t}, Captain.|An analyst goes back on it.|Last reading is stale.|', 'Aye, {t} again.|Fresh readings coming.|The old ones have aged.|', 'Analyst back on {t}, Captain.|New read in progress.|{conf} at present.|', 'Re-reading {t}.|It will take a few minutes.|The previous read has gone cold.|', 'Another pass at {t}, aye.|I want better numbers.|{conf} so far.|'],
      ping: ['Active ping on {t}, Captain.|Crisp fix in a moment.|We are a flare for a minute, thermal up {dth}, signature {th}.|{cons}', 'Pinging {t}, aye.|The fix is sharp, and everyone heard it.|Signature {th} on heat for the next while.|{cons}', 'Ping sent, Captain.|Position on {t} will tighten.|We read {th} on heat. A warship will have us.|{cons}', 'Aye. Active on {t}.|I will have a fix shortly.|It costs us {dth} on heat. They know where we are.|{cons}', 'Sounding {t}.|One good fix.|Thermal {th} while it echoes, Captain.|{cons}'],
      quiet: ['Going quiet, Captain.|Sensors dark and no launches for {secs} seconds.|Signature down {d}, now {tot}.|{cons}', 'Aye, running quiet.|Emissions down {d} points.|{secs} seconds of silence, signature {tot}.|{cons}', 'Quiet, Captain.|We shed {d} points.|Dark for {secs} seconds.|{cons}', 'Silent running, aye.|Down {d}, to {tot}.|Good for {secs} seconds.|{cons}', 'Sensors dark.|Signature falls {d} points.|{secs} seconds, then we come back up.|{cons}'],
      rule: ['{t} ruled out, Captain.|||', 'Aye, {t} dismissed as junk.|||', '{t} struck from the board, Captain.|||', 'Dismissing {t}.|||', 'Ruled out {t}, aye. If I am wrong we have lost it.|||'] },
    Dace: {
      vent: ['Fins out, aye!|Sink draining {drain} a minute.|Sink at {sink}, clear in {mins} minutes.|{cons}', 'Venting! Opening the fins.|Dropping {drain} per minute.|{sink} full, {mins} minutes to clear.|{cons}', 'Fins out, Captain, and she is bright.|{drain} a minute off the sink.|Sink {sink}, about {mins} minutes.|{cons}', 'Aye, venting.|The sink drains at {drain} a minute.|Currently {sink}, empty in {mins}.|{cons}', 'Dumping heat now.|{drain} a minute, that is a lot.|{sink} full, {mins} minutes to go.|{cons}'],
      ventstop: ['Fins in, aye.|Venting stops.|Sink at {sink}, now {rate} a minute.|{cons}', 'Retracting the fins.|Back to filling at {rate} a minute.|{sink} full.|{cons}', 'Fins are in, Captain.|We stop shining.|Sink {sink}.|{cons}', 'Aye, closing up.|Heat signal drops.|Sink at {sink}.|{cons}', 'Pulling the fins in.|Net {rate} a minute again.|{sink} on the sink.|{cons}'],
      cut: ['Cutting thrust, aye.|Heat rate {rate} a minute.|Sink {sink}.|{cons}', 'Easing the drive.|{rate} a minute into the sink.|{sink} full.|{cons}', 'Aye, backing off.|Heat {rate} per minute now.|Sink at {sink}.|{cons}', 'Throttling down, Captain.|Heat rate drops to {rate}.|{sink} on the sink.|{cons}', 'Dropping the drive a notch.|{rate} a minute.|Sink {sink}.|{cons}'] },
    Castellan: {
      redline: ['Redline, aye. Hold on to something.|Sink fills in about {secs} seconds.|Sink at {sink}, heat {rate} per minute.|{cons}', 'Giving her everything.|Fills the sink in {secs} seconds, Cap.|{sink} now.|{cons}', 'Redline it is, darlin\'.|{secs} seconds of sink at this rate.|Heat {rate} a minute.|{cons}', 'All the way up, Captain.|She will not like it for more than {secs} seconds.|Sink at {sink}.|{cons}', 'Burning hard.|{secs} seconds before the sink is full.|{rate} a minute and climbing.|{cons}'] },
    Pell: {
      hail: ['Hailing {t}, Captain.|Open channel, a small emission.||{cons}', 'Aye, hailing {t}.|The reply is soft evidence at best.||{cons}', 'Voice on the open channel to {t}.|Anyone can lie on a radio, I should point out.||{cons}', 'Hailing {t}. I will be charming.|Small emission on our side.||{cons}', 'Opening a channel to {t}.|We are announcing ourselves, Captain.||{cons}'],
      challenge: ['Challenging {t}, Captain.|Directional beam, so quiet but not silent.||{cons}', 'Aye, transponder challenge to {t}.|A friend answers with the countersign.||{cons}', 'Beam on {t}.|If it is hostile it may notice the beam.||{cons}', 'Challenge sent to {t}.|A tight beam, a small leak.||{cons}', 'Asking {t} who it is.|Politely, on a directional beam.||{cons}'] } };

  function fmt(tpl, v) { return tpl.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? String(v[k]) : ''); }
  const last = {};
  function pick(arr, key, rnd) { let i = Math.floor((rnd || Math.random)() * arr.length); if (arr.length > 1 && last[key] === i) i = (i + 1) % arr.length; last[key] = i; return arr[i]; }

  // ---------- fill the slots for each interaction from the before / after readings
  function slots(x) {
    const { E, s, verb, b, a } = x, d = x.d || {}, v = {}, rs = (E.P && E.P.secPerMin) || 16, R = E.RULES || {};
    let em = a.em, th = a.th || a.thermal, pe = pts(a.em) - pts(b.em);
    const sinkP = Math.round(a.sinkH * 100) + '%', rate = (a.rate >= 0 ? '+' : '') + a.rate.toFixed(1) + '%';
    v.sink = sinkP; v.rate = rate; v.em = pts(em); v.th = pts(a.thermal); v.tot = pts(a.tot) ? Math.round(a.tot * 100) + '%' : ''; v.nm = a.nm; v.hot = a.hot; v.d = num(Math.abs(pe)); v.dth = num(Math.abs(pts(a.thermal) - pts(b.thermal)));
    v.launch = a.launch === 'gas' ? 'cold gas' : 'rail'; v.cycle = a.launch === 'gas' ? 'slow' : 'fast'; v.n = d.n; v.t = d.t; v.speed = (E.SPEED && E.SPEED[a.speed] && E.SPEED[a.speed].label) || a.speed;
    v.nt = a.nm; v.secs = d.secs != null ? Math.round(d.secs) : ''; v.left = d.left; v.count = d.count; v.eta = d.eta != null ? Math.round(d.eta) : ''; v.kind = d.kind; v.mags = a.mag; v.track = d.track; v.conf = d.conf;
    v.drain = Math.abs(a.rate).toFixed(1) + '%'; v.mins = d.mins != null ? d.mins : (a.rate < -0.05 ? (a.sinkH * 100 / -a.rate).toFixed(1) : ''); v.legs = d.legs; v.g = d.g; v.flip = d.flip; v.prop = d.prop;
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

  function report(x) {
    const verb = x.verb, officer = x.officer || OFFICER[verb]; if (!officer || !P[officer] || !P[officer][verb]) return null;
    const b = x.before, a0 = x.after || snap(x.E, x.s); x.b = b; x.a = a0; x.d = x.d || {}; const a = project(Object.assign({}, x, { a: a0 })); x.a = a;
    const tier = tierOf(x, a, b), conf = confidence(x, a, b), pool = LV[officer] || LV.Abara, same = a.lvl === b.lvl;
    const phrase = pick(same ? pool.hold[a.lvl] : pool.to[a.lvl], 'lv:' + officer + (same ? 'h' : 't') + a.lvl, x.rnd);
    let cons = phrase; if (conf !== 'sure' && HEDGE[officer]) cons = phrase + ' ' + pick(HEDGE[officer][conf] || HEDGE[officer].likely, 'hg:' + officer, x.rnd);
    const v = slots(x); v.cons = (x.noLevel || ['mark', 'rule', 'refresh', 'kind', 'classify', 'rescan', 'brace'].includes(verb)) ? '' : cons;
    const tpl = pick(P[officer][verb], 'pt:' + officer + ':' + verb, x.rnd), parts = tpl.split('|').map(p => fmt(p, v).replace(/\s+/g, ' ').trim()).map(p => p.charAt(0).toUpperCase() + p.slice(1));
    const use = tier === 0 ? [0] : tier === 1 ? [0, 1, 3] : [0, 1, 2, 3], text = use.map(i => parts[i]).filter(Boolean).join(' ');
    return { officer, text, parts, tier, level: LADDER[a.lvl].k, conf, verb };
  }
  const API = { report, snap, LADDER, PATTERNS: P, LV, HEDGE, OFFICER, levelOf, pts };
  root.CrewReports = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
