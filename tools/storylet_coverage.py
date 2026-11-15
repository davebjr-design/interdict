"""Coverage matrix and variety report for the storylet pool.
  1. inventory: kind x speaker (and status);
  2. state dimensions: how many storylets of each speaker react to route, quiet hour, command band, trust, integration, ...;
  3. home-station depth: sampled plausible worlds (stage x route x dials, seeded), count eligible banter lines per officer at their own
     station; the minimum must reach the bar in data/narrative/lint.json coverage.min_eligible (docs/act1_completion_plan.md B.4: 4+);
  4. dead storylets (never eligible in any sampled world) and rare ones;
  5. repetition and variety per speaker (distinct 4-grams, near duplicates).
Usage: python3 -I tools/storylet_coverage.py [--samples N] [--seed S] [--md FILE] [--quiet]     exit 1 if a home-station cell is below the bar or a storylet is dead.
"""
import os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storylet_lib as L
import storylet_lint as LINT

DIMS = [  # (label, regex on needs text)
    ('route (corvane/murdered/ames)', r'\b(corvane|murdered|ames|p3\.round_shot)\b'),
    ('quiet hour', r'\bquiet_hour\b'),
    ('command band', r'\bcommand\.(band|style)\b'),
    ('trust', r'\b(trust\.\w+|pell\.trust)\b'),
    ('integration / wiring', r'\b(integration|seen\.wiring\.\w+)\b'),
    ('hunt result', r'\b(hunts|last_hunt\.\w+)\b'),
    ('shakedown / decoy', r'\b(shakedown\.\w+|seen\.shakedown\.\w+|decoy_turned)\b'),
    ('commission', r'\bcommission\b'),
    ('audit / Vesper', r'\btally\.audit_pending\b'),
    ('player background', r'\bplayer\.background\b'),
    ('secrets known (knows./told.)', r'\b(knows|told)\.\w+'),
    ('earlier scenes seen', r'\bseen\.(?!wiring|shakedown)\w+'),
]


def sample_worlds(W, stage_name, route_name, n, rng):
    cov = W.lint['coverage']
    st = cov['stages'][stage_name]
    base = {k: v.get('default') for k, v in W.vars.items() if 'default' in v}
    worlds = []
    for _ in range(n):
        w = dict(base)
        w.update(cov['routes'][route_name])
        w['act'] = st['act']
        w['leg'] = rng.randint(*st['leg'])
        w['hunts'] = rng.randint(*st['hunts'])
        w['last_hunt.hull'] = rng.choice([25, 40, 55, 65, 80, 100])
        w['quiet_hour'] = rng.choice(['kept_captain', 'ended', 'kept_quill'])
        w['command.style'] = rng.choice([8, 25, 40, 50, 60, 75, 92])
        w['command.band'] = L.band_of_style(w['command.style'])
        for o in ('abara', 'dace', 'castellan', 'quill', 'fenwick'):
            w['trust.' + o] = rng.choice([12, 28, 45, 58, 66, 85])
        w['pell.trust'] = rng.choice([15, 28, 45, 62, 80])
        w['integration'] = rng.choice([0, 0, 3, 5, 8])
        for s in st['seen']:
            w[s] = True
        for s in st.get('maybe_seen', []):
            w[s] = rng.random() < 0.5
        for k, vals in st.get('enum', {}).items():
            w[k] = rng.choice(vals)
        for k in st.get('bool_maybe', []):
            w[k] = rng.random() < 0.5
        for k in st.get('bool_true', []):
            w[k] = True
        for f in st.get('knows_maybe', []):
            w['knows.' + f] = rng.random() < 0.7
        w['player.background'] = rng.choice(['unset', 'unset', 'launch_crew', 'orbital', 'port_authority', 'signals'])
        w['watch.captain_third'] = rng.random() < 0.4
        w['pell.nick'] = 'Captain' if w['murdered'] else rng.choice(['Captain', 'Captain Patience', 'Captain Quick'])
        w['logs'] = rng.choice(['sealed', 'opened', 'deleted', 'deferred']) if w['corvane'] == 'killed' else 'sealed'
        w['corvane.talked'] = (w['corvane'] == 'persuaded') and rng.random() < 0.5
        # consistency rules the real game enforces
        if w.get('seen.wiring.key_turned'):
            w['seen.wiring.declined'] = False
            w['integration'] = max(w['integration'], 10) + rng.choice([0, 3, 5])
        elif w.get('seen.wiring.declined') or w.get('seen.wiring.pell_asked'):
            w['integration'] = min(w['integration'], 5)
        if w.get('seen.wiring.pell_asked'):
            w['seen.wiring.declined'] = False
        if w.get('seen.shakedown.debrief'):
            w['knows.decoy_turned'] = True
        if stage_name != 'first_days':
            w['knows.pell_lost_time'] = (not w['murdered']) and rng.random() < 0.5
        if w['murdered']:
            w['knows.pell_lost_time'] = False
        if w['integration'] > 5 and not w.get('seen.wiring.key_turned'):
            w['integration'] = 5
        if stage_name == 'pre_vesper':
            w['knows.steward_name'] = rng.random() < 0.5
        worlds.append(w)
    return worlds


def getter(w):
    return lambda n: w.get(n)


def run(argv):
    samples = 60
    seed = 20261115
    md = None
    for i, a in enumerate(argv):
        if a == '--samples':
            samples = int(argv[i + 1])
        if a == '--seed':
            seed = int(argv[i + 1])
        if a == '--md':
            md = argv[i + 1]
    W = L.World()
    cov = W.lint['coverage']
    live = [s for _, s in L.load_storylets() if s.get('status', 'draft') != 'rejected']
    out = []
    P = out.append
    bad = 0

    # 1 inventory
    kinds = sorted({s['kind'] for s in live})
    spk = [c for c in list(W.crew) + ['corvane'] if any(s['speaker'] == c for s in live)]
    spk = sorted(spk, key=lambda c: (c == 'corvane', c))
    P('## 1. Inventory (storylets: kind x speaker)')
    P('')
    P('| kind | ' + ' | '.join(spk) + ' | total |')
    P('|---|' + '---|' * (len(spk) + 1))
    for k in kinds:
        row = [sum(1 for s in live if s['kind'] == k and s['speaker'] == c) for c in spk]
        P('| %s | %s | %d |' % (k, ' | '.join(str(x) for x in row), sum(row)))
    stat = {}
    for s in live:
        stat[s.get('status', 'draft')] = stat.get(s.get('status', 'draft'), 0) + 1
    P('')
    P('Status: ' + ', '.join('%s %d' % kv for kv in sorted(stat.items())))
    P('')

    # 2 state dimensions
    P('## 2. State dimensions (storylets whose conditions react to each dimension; zero = that officer ignores it)')
    P('')
    P('| dimension | ' + ' | '.join(spk) + ' |')
    P('|---|' + '---|' * len(spk))
    for label, rx in DIMS:
        row = []
        for c in spk:
            n = 0
            for s in live:
                if s['speaker'] != c:
                    continue
                txt = ' '.join(e for _, e in L.walk_conditions(s))
                if re.search(rx, txt):
                    n += 1
            row.append(n)
        P('| %s | %s |' % (label, ' | '.join(('**0**' if x == 0 else str(x)) for x in row)))
    P('')

    # 3 sampled depth
    P('## 3. Home-station depth (eligible banter lines per officer at their own station, over %d sampled worlds per cell)' % samples)
    P('')
    rng = random.Random(seed)
    asts = {s['id']: L.parse(s.get('needs', '')) for s in live}
    homes = {c: W.cast['crew'][c]['station'] for c in W.crew}
    eligible_hits = {s['id']: 0 for s in live}
    total_worlds = 0
    stages = list(cov['stages'])
    routes = list(cov['routes'])
    bar = cov['min_eligible'].get('banter', 4)
    P('Minimum eligible (worst world in the cell). Bar: %d. Lines are counted as eligible when `needs` holds; once/cooldown/no-repeat are not applied.' % bar)
    P('')
    P('| officer @ station | ' + ' | '.join('%s / %s' % (st, r) for st in stages for r in routes) + ' |')
    P('|---|' + '---|' * (len(stages) * len(routes)))
    cells = {}
    for st in stages:
        for r in routes:
            worlds = sample_worlds(W, st, r, samples, rng)
            total_worlds += len(worlds)
            for w in worlds:
                g = getter(w)
                ok_ids = {s['id'] for s in live if L.evaluate(asts[s['id']], g)}
                for i in ok_ids:
                    eligible_hits[i] += 1
                for c in sorted(W.crew):
                    n = sum(1 for s in live if s['kind'] == 'banter' and s['speaker'] == c and s.get('station') in (homes[c], 'any') and s['id'] in ok_ids)
                    cells.setdefault((c, st, r), []).append(n)
    for c in sorted(W.crew):
        row = []
        for st in stages:
            for r in routes:
                v = cells[(c, st, r)]
                m = min(v)
                if m < bar:
                    bad += 1
                row.append(('**%d**' % m) if m < bar else str(m))
        P('| %s @ %s | %s |' % (c, homes[c], ' | '.join(row)))
    P('')
    # median depth
    P('Median eligible per officer over all sampled worlds: ' + ', '.join('%s %d' % (c, sorted(sum((cells[(c, st, r)] for st in stages for r in routes), []))[total_worlds // 2]) for c in sorted(W.crew)))
    P('')
    P('Lines at other stations (Pell lamps, officers away from home) are not counted toward the bar.')
    P('')

    # 4 dead and rare
    P('## 4. Dead and rare storylets (over %d sampled worlds)' % total_worlds)
    P('')
    dead = [i for i, n in eligible_hits.items() if n == 0]
    rare = [(i, n) for i, n in eligible_hits.items() if 0 < n < total_worlds * 0.02]
    P('Dead (never eligible): ' + (', '.join(dead) if dead else 'none'))
    P('')
    P('Rare (under 2%% of worlds): %s' % (', '.join('%s (%d)' % x for x in rare) if rare else 'none'))
    P('')
    # calls are expected to be rare/context-bound: dead calls matter most
    bad += len([d for d in dead])

    # 5 variety
    P('## 5. Variety per speaker')
    P('')
    P('| speaker | lines | distinct 4-grams / total | opening trigram max |')
    P('|---|---|---|---|')
    by = {}
    for sid, who, t in LINT.corpus(live):
        by.setdefault(who, []).append(t)
    for who in sorted(by):
        g4, tot, opens = set(), 0, {}
        for t in by[who]:
            w = [x.lower() for x in L.words(L.strip_tokens(t))]
            for i in range(len(w) - 3):
                g4.add(tuple(w[i:i + 4]))
                tot += 1
            if len(w) >= 3:
                opens[tuple(w[:3])] = opens.get(tuple(w[:3]), 0) + 1
        P('| %s | %d | %.2f | %d |' % (who, len(by[who]), (len(g4) / tot) if tot else 1, max(opens.values()) if opens else 0))
    reps = LINT.repetition(W, live)
    P('')
    P('Repetition findings: %d (%s)' % (len(reps), ', '.join(sorted({r[0] for r in reps})) or 'clean'))
    P('')
    text = '\n'.join(out)
    if md:
        with open(md, 'w', encoding='utf-8') as f:
            f.write('# Storylet coverage report\n\nGenerated by `tools/storylet_coverage.py`. Seed %d, %d samples per cell.\n\n' % (seed, samples) + text + '\n')
    if '--quiet' not in argv:
        print(text)
    print('coverage: %d cells below the bar or dead storylets' % bad)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(run(sys.argv[1:]))
