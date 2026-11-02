"""Validate data/narrative: every name used in calls.csv exists in state.json / knowledge.csv; every reveal has >=3 independent clues.
Run: python3 -I tools/narr_check.py"""
import csv, json, os, re, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'narrative')
st = json.load(open(os.path.join(D, 'state.json'))); cast = json.load(open(os.path.join(D, 'cast.json')))
rows = lambda n: list(csv.DictReader(open(os.path.join(D, n))))
facts = {r['fact'] for r in rows('knowledge.csv')}
clue_ids = {r['clue_id'] for r in rows('clues.csv')}
crew = set(cast['crew']); errs = []
known = set(st['vars'])
def name_ok(n):
    n = n.strip()
    if n in known: return True
    m = re.fullmatch(r'knows\.(\w+)', n)
    if m: return m.group(1) in facts
    m = re.fullmatch(r'told\.(\w+)\.(\w+)', n)
    if m: return m.group(1) in facts and (m.group(2) in crew or m.group(2) in cast.get('others', {}))
    if n.startswith('clue.'): return n in clue_ids
    m = re.fullmatch(r'seen\.([\w.]+)', n)
    return bool(m)
CMP = re.compile(r'([A-Za-z_][\w.]*)\s*(==|!=|>=|<=|>|<|=)\s*([A-Za-z_][\w.]*|-?\d+)')
def check_needs(cid, txt):
    """needs is a condition, not prose: every identifier must be known (dotted or not).
    For name OP value, the value is checked too: a number, a known name, or one of the var's enum values."""
    rest = txt
    for m in CMP.finditer(txt):
        name, val = m.group(1), m.group(3)
        if not name_ok(name): errs.append('%s: unknown state name %s (needs)' % (cid, name))
        if not re.fullmatch(r'-?\d+', val) and not name_ok(val):
            vals = st['vars'].get(name, {}).get('values', [])
            if val not in vals: errs.append('%s: %s compared with unknown value %s (needs)' % (cid, name, val))
        rest = rest.replace(m.group(0), ' ', 1)
    for tok in re.findall(r'[A-Za-z_][\w.]*', rest):
        if tok in ('not', 'and', 'or'): continue
        if not name_ok(tok): errs.append('%s: unknown state name %s (needs)' % (cid, tok))
ids = set()
for r in rows('calls.csv'):
    ids.add(r['id'])
    if r['speaker'] not in crew | {'pell', 'corvane', 'patron'}: errs.append('%s: unknown speaker %s' % (r['id'], r['speaker']))
    check_needs(r['id'], r['needs'] or '')
    for fld in ('effects',):
        for tok in re.findall(r'(?:not\s+)?([A-Za-z_][\w.]*)\s*(?:==|>=|<=|>|<|=)?', r[fld] or ''):
            if tok in ('not', 'and', 'or') or tok.isdigit(): continue
            if '.' in tok or tok in known:
                if not name_ok(tok): errs.append('%s: unknown state name %s (%s)' % (r['id'], tok, fld))
reveals = {}
for r in rows('clues.csv'): reveals.setdefault(r['reveal'], []).append(r)
for k, v in reveals.items():
    if len(v) < 3: errs.append('reveal %s has only %d clues (rule: at least 3 independent)' % (k, len(v)))
for r in rows('callbacks.csv'):
    if r['status'] == 'planted' and not r['payoff_in']: errs.append('callback %s planted with no payoff' % r['callback_id'])
# Derived time variables (type "time", e.g. clock.decision): tokens {clock.x} / {clock.x.spoken} in docs must
# name a declared time var, each using file must be a listed reader, the writer must assign it, and no scene
# may hard-code a decision or send time except in a rendering example (line with "Renders"), a table, or a clock.* line.
DOCS = os.path.join(D, '..', '..', 'docs')
doc_files = {os.path.splitext(f)[0]: os.path.join(DOCS, f) for f in os.listdir(DOCS) if f.endswith('.md')}
doc_files.update({os.path.splitext(f)[0]: os.path.join(DOCS, 'scenes', f) for f in os.listdir(os.path.join(DOCS, 'scenes')) if f.endswith('.md')})
tvars = {k: v for k, v in st['vars'].items() if v.get('type') == 'time'}
for k, v in tvars.items():
    w = v.get('writer')
    if w not in doc_files: errs.append('%s: writer %s is not a doc' % (k, w))
    elif not re.search(re.escape(k) + r'\s*=', open(doc_files[w]).read()): errs.append('%s: writer %s never assigns it' % (k, w))
    for r in v.get('readers', []):
        if r not in doc_files: errs.append('%s: reader %s is not a doc' % (k, r))
        elif k not in open(doc_files[r]).read(): errs.append('%s: reader %s never reads it' % (k, r))
def spoken(hm):
    n = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
    t = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty'}
    w = lambda x: n[x] if x < 20 else t[x // 10] + ('-' + n[x % 10] if x % 10 else '')
    h, m = hm // 60, hm % 60
    return w(h) + (' hundred' if m == 0 else '-oh-' + n[m] if m < 10 else '-' + w(m))
fixed = set()
for start, end in ((22 * 60 + 8, 22 * 60 + 13), (21 * 60 + 57, 22 * 60 + 2)):
    for hm in range(start, end + 1): fixed |= {'%d:%02d' % (hm // 60, hm % 60), spoken(hm)}
hard = re.compile(r'(?<![\d:])(' + '|'.join(sorted(map(re.escape, fixed), key=len, reverse=True)) + r')(?![\d-])', re.I)
for stem, path in doc_files.items():
    is_scene = os.sep + 'scenes' + os.sep in path or stem == 'plot_so_far'
    for ln, line in enumerate(open(path), 1):
        for m in re.finditer(r'\{(clock\.\w+?)(\.spoken)?\}', re.sub(r'`[^`]*`', '', line)):  # backticked tokens are documentation
            if m.group(1) not in tvars: errs.append('%s:%d: token {%s} is not a declared time var' % (stem, ln, m.group(1)))
            elif stem not in tvars[m.group(1)].get('readers', []): errs.append('%s:%d: reads %s but is not in its readers' % (stem, ln, m.group(1)))
        if is_scene and 'Renders' not in line and not line.startswith('|') and 'clock.' not in line:
            for m in hard.finditer(line): errs.append('%s:%d: hard-coded standoff time %r (use {clock.*})' % (stem, ln, m.group(1)))
print('calls %d, facts %d, reveals %d, time vars %d' % (len(ids), len(facts), len(reveals), len(tvars)))
if errs: print('\n'.join(errs)); sys.exit(1)
print('OK')
