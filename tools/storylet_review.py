"""Review queue for storylets: a markdown page grouped by character, a decisions CSV, and an apply step.

  python3 -I tools/storylet_review.py                  write docs/review_batch_01.md (every draft storylet of the batch) and
                                                       data/narrative/review/decisions.csv (only created if missing)
  python3 -I tools/storylet_review.py --batch NAME     another batch (meta.batch)
  python3 -I tools/storylet_review.py --apply          read decisions.csv and set status in the storylet files:
                                                       approve -> "approved", reject -> "rejected" (reason is logged to
                                                       data/narrative/review/negative_examples.json so the next prompt pack
                                                       shows the authoring pass what NOT to write), edit/blank -> unchanged
  python3 -I tools/storylet_review.py --diff           show what a re-generated review page would change against the one on disk

The reviewer ticks boxes in the markdown or fills the CSV; either is fine, the CSV is what --apply reads.
CSV columns: id,decision,note      decision is one of approve, reject, edit (blank = undecided).
"""
import csv, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storylet_lib as L

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVDIR = os.path.join(ROOT, 'data', 'narrative', 'review')
DECISIONS = os.path.join(REVDIR, 'decisions.csv')
NEGATIVE = os.path.join(REVDIR, 'negative_examples.json')

NAMES = {'abara': 'Abara', 'quill': 'Quill', 'dace': 'Dace', 'castellan': 'Castellan', 'fenwick': 'Fenwick', 'pell': 'Pell', 'corvane': 'Corvane', 'narr': 'Narration'}
STAGE_ORDER = ['abara', 'castellan', 'dace', 'fenwick', 'pell', 'quill', 'corvane']

OPEN_QUESTIONS = [
    ('steward_name (new fact)', 'knowledge.csv now has `steward_name` ("the patron\'s voice is called the Steward", known by patron, steward, pell, introduced P4). Lines that use the word are gated on knows.steward_name. Confirm the fact id and the P4 timing.'),
    ('pell.nick, command.band (new state)', 'Two derived variables were added to state.json and marked PROPOSED: `command.band` (very_tight..very_loose, written by the runtime from command.style with hysteresis) and `pell.nick` (string, default "Captain", stays "Captain" on the murder route). Pell and Abara lines read them. Do these belong in the engine, and who writes pell.nick?'),
    ('logs deleted on the killed route', 'call.pell.logs: what does a deleted-logs index yield on the killed route, and who delivers "her grandfather wasn\'t lying" to Abara there? I wrote no line for it.'),
    ('quiet hour ended, what is unlocked', 'call.pell.quiet_hour grants clue.pell.1 only. act1_pell_night.md mentions a deferred Pell signal (callback pell_signal_deferred); I removed the Quill-signal line from the call because canon does not say what Quill hears. What should an ended-route quiet hour unlock beyond clue.pell.1?'),
    ('how `leg` increments', 'Calls use `leg>=1` and cooldown_legs. I assumed leg increments once per sailing leg between ports. Confirm, or give the real counter.'),
    ('engine trigger names', 'Chatter and react storylets are not in batch 01 because the real engine event names are not in the docs. lint.json "triggers" lists proposed names (marked proposed). Please supply the real list from hunt_rt_engine.js.'),
    ('seen.fenwick.hook1', 'Does scene 1.2e set a seen flag for Fenwick\'s hook? I did not rely on one.'),
    ('cabin opened flag', 'call.corvane.cabin_key is gated on clue.loyalist.0 as a stand-in for "the cabin has been opened". An explicit flag (for example seen.cabin.opened) would be cleaner.'),
    ('murder-route ambient tone', 'On the murder route every officer gets a muted, formal line set (Abara: "Anything else, Captain?"; Fenwick feeds you and does not ask; Quill reports contacts and keeps her hands still). Confirm that is the intended tone for the first week, or ask for it to be harsher or softer.'),
]


# ---------------------------------------------------------------------------
# plain-English conditions
# ---------------------------------------------------------------------------
def plain(expr, labels):
    if not expr:
        return 'always'
    t = expr
    reps = [
        (r'\bknows\.(\w+)', lambda m: 'you know "%s"' % m.group(1).replace('_', ' ')),
        (r'\btold\.(\w+)\.(\w+)', lambda m: '%s was told "%s"' % (NAMES.get(m.group(2), m.group(2)), m.group(1).replace('_', ' '))),
        (r'\bseen\.([\w.]+)', lambda m: 'scene %s played' % m.group(1)),
        (r'\bclue\.([\w.]+)', lambda m: 'clue %s found' % m.group(1)),
    ]
    for rx, fn in reps:
        t = re.sub(rx, fn, t)
    for name in sorted(labels, key=len, reverse=True):
        t = re.sub(r'(?<![\w.])' + re.escape(name) + r'(?![\w.])', labels[name], t)
    t = t.replace('>=', ' at least ').replace('<=', ' at most ').replace('!=', ' is not ').replace('==', ' is ')
    t = re.sub(r'(?<![<>])>(?!=)', ' above ', t)
    t = re.sub(r'(?<![<>])<(?!=)', ' below ', t)
    t = re.sub(r'\bnot\b', 'NOT', t)
    t = re.sub(r'\band\b', 'AND', t)
    t = re.sub(r'\bor\b', 'OR', t)
    return re.sub(r'\s+', ' ', t).strip()


# ---------------------------------------------------------------------------
# rendering
# ---------------------------------------------------------------------------
def render_lines(lines, W, indent=''):
    out = []
    for ln in lines or []:
        if 'text' not in ln:
            continue
        who = ln.get('who', '')
        cond = (' *(only if %s)*' % plain(ln['needs'], W.lint['labels'])) if ln.get('needs') else ''
        if who == 'narr':
            out.append('%s> *%s*%s' % (indent, ln['text'], cond))
        else:
            out.append('%s> **%s:** %s%s' % (indent, NAMES.get(who, who), ln['text'], cond))
    return out


def render_node(node, W, depth=0):
    out = []
    ind = '  ' * depth
    out += render_lines(node.get('lines'), W, ind)
    for c in node.get('choices') or []:
        cond = (' *(only if %s)*' % plain(c['needs'], W.lint['labels'])) if c.get('needs') else ''
        out.append('%s- Player picks: "%s"%s' % (ind, c.get('label', ''), cond))
        out += render_node(c, W, depth + 1)
        if c.get('effects'):
            out.append('%s  - sets: `%s`' % (ind, '`, `'.join(c['effects'])))
    if node.get('after'):
        out.append('%s- Then, whichever was chosen:' % ind)
        out += render_node(node['after'], W, depth + 1)
        if node['after'].get('effects'):
            out.append('%s  - sets: `%s`' % (ind, '`, `'.join(node['after']['effects'])))
    return out


def render_storylet(s, W):
    sid = s['id']
    out = []
    out.append('- [ ] **`%s`**   priority %s%s%s' % (sid, s.get('priority', 50), ('   once' if s.get('once') else ''), ('   cooldown %d legs' % s['cooldown_legs'] if s.get('cooldown_legs') else '')))
    out.append('  - %s' % s.get('summary', ''))
    out.append('  - **Plays when:** %s' % plain(s.get('needs', ''), W.lint['labels']))
    if s.get('station'):
        out.append('  - **Where:** %s' % s['station'])
    flags = []
    if s.get('mentions'):
        flags.append('mentions facts: ' + ', '.join(s['mentions']))
    if s.get('echoes'):
        flags.append('echoes clues: ' + ', '.join(s['echoes']))
    if s.get('reveals'):
        flags.append('REVEALS: ' + ', '.join(s['reveals']))
    if s.get('effects'):
        flags.append('sets: ' + ', '.join('`%s`' % e for e in s['effects']))
    for f in flags:
        out.append('  - %s' % f)
    out.append('')
    for l in render_node(s, W, 1):
        out.append('  ' + l if not l.startswith('  ') else l)
    for v in s.get('variants') or []:
        out.append('')
        out.append('  - *Variant, when %s:*' % plain(v.get('needs', ''), W.lint['labels']))
        for l in render_lines(v.get('lines'), W, '    '):
            out.append(l)
    out.append('')
    return out


def collect(batch):
    items = []
    for path, s in L.load_storylets():
        if (s.get('meta') or {}).get('batch') == batch or (batch is None):
            items.append((path, s))
    return items


def group_key(s):
    return STAGE_ORDER.index(s['speaker']) if s['speaker'] in STAGE_ORDER else 99


def build_page(batch, W):
    items = collect(batch)
    live = [s for _, s in items]
    by = {}
    for s in live:
        by.setdefault(s['speaker'], []).append(s)
    out = []
    P = out.append
    P('# Review: %s' % batch.replace('_', ' '))
    P('')
    P('Generated by `tools/storylet_review.py`. Do not edit the storylet text here; edit the JSON in `data/narrative/storylets/` or tell me what to change.')
    P('')
    P('**How to review.** Tick `[x]` to approve. Leave unticked to hold. To reject or ask for a rewrite, put the id and a one-line reason in `data/narrative/review/decisions.csv` (decision `reject` or `edit`). Then run `python3 -I tools/storylet_review.py --apply`. Rejections are kept as negative examples and shown to the next writing pass.')
    P('')
    P('What to look for: does it sound like them (pov_sheets.md), is it something they could know at that point, does it tell the player something they should not have learned yet, is it dull. Every line here already passed the automatic checks, so a rejection is about taste and canon, which the checks cannot judge.')
    P('')
    counts = ', '.join('%s %d' % (NAMES.get(k, k), len(v)) for k, v in sorted(by.items(), key=lambda kv: group_key(kv[1][0])))
    P('**%d storylets:** %s.' % (len(live), counts))
    P('')
    P('## Open questions for Dave')
    P('')
    for i, (t, q) in enumerate(OPEN_QUESTIONS, 1):
        P('%d. **%s.** %s' % (i, t, q))
    P('')
    for who in sorted(by, key=lambda k: STAGE_ORDER.index(k) if k in STAGE_ORDER else 99):
        lst = by[who]
        P('## %s (%d)' % (NAMES.get(who, who), len(lst)))
        P('')
        if who == 'corvane' or any(s['kind'] == 'call' for s in lst):
            calls = [s for s in lst if s['kind'] == 'call']
        for kind in ('call', 'banter'):
            ks = [s for s in lst if s['kind'] == kind]
            if not ks:
                continue
            P('### %s' % ('Return calls' if kind == 'call' else 'Ambient banter'))
            P('')
            for s in sorted(ks, key=lambda x: (x.get('station', ''), -x.get('priority', 50), x['id'])):
                out += render_storylet(s, W)
    return '\n'.join(out) + '\n'


# ---------------------------------------------------------------------------
# decisions
# ---------------------------------------------------------------------------
def ensure_csv(batch):
    os.makedirs(REVDIR, exist_ok=True)
    have = {}
    if os.path.exists(DECISIONS):
        with open(DECISIONS, newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                have[r['id']] = r
    ids = [s['id'] for _, s in collect(batch)]
    rows = [have.get(i, {'id': i, 'decision': '', 'note': ''}) for i in ids]
    rows += [r for i, r in have.items() if i not in ids]
    with open(DECISIONS, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'decision', 'note'])
        w.writeheader()
        for r in rows:
            w.writerow({'id': r['id'], 'decision': r.get('decision', ''), 'note': r.get('note', '')})
    return len(rows)


def ticked_from_page(page_path):
    ticked = set()
    if os.path.exists(page_path):
        for ln in open(page_path, encoding='utf-8'):
            m = re.match(r'- \[x\] \*\*`([^`]+)`', ln, re.I)
            if m:
                ticked.add(m.group(1))
    return ticked


def set_status(path_text, sid, status):
    """Textual patch so the hand-formatted JSON keeps its layout."""
    pat = re.compile(r'(\{"id": "%s",)((?: "status": "\w+",)?)' % re.escape(sid))
    new, n = pat.subn(lambda m: '%s "status": "%s",' % (m.group(1), status), path_text, count=1)
    return new, n


def apply(batch, page_path):
    decisions = {}
    if os.path.exists(DECISIONS):
        with open(DECISIONS, newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                if r['decision'].strip():
                    decisions[r['id']] = (r['decision'].strip().lower(), r.get('note', ''))
    for sid in ticked_from_page(page_path):
        decisions.setdefault(sid, ('approve', ''))
    texts = {}
    changed = {'approved': 0, 'rejected': 0}
    neg = []
    if os.path.exists(NEGATIVE):
        neg = json.load(open(NEGATIVE, encoding='utf-8'))
    by_id = {s['id']: (p, s) for p, s in L.load_storylets()}
    for sid, (dec, note) in sorted(decisions.items()):
        if sid not in by_id or dec not in ('approve', 'reject'):
            continue
        p, s = by_id[sid]
        status = 'approved' if dec == 'approve' else 'rejected'
        if s.get('status', 'draft') == status:
            continue
        texts.setdefault(p, open(p, encoding='utf-8').read())
        texts[p], n = set_status(texts[p], sid, status)
        if not n:
            print('could not patch %s (id not at the start of an object line); edit status by hand' % sid)
            continue
        changed[status] += 1
        if status == 'rejected':
            neg.append({'id': sid, 'speaker': s['speaker'], 'reason': note, 'lines': [t for _, _, t in L.line_texts(s)][:6]})
    for p, t in texts.items():
        open(p, 'w', encoding='utf-8').write(t)
    if changed['rejected']:
        os.makedirs(REVDIR, exist_ok=True)
        json.dump(neg, open(NEGATIVE, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('applied: %d approved, %d rejected. Run tools/storylet_check.py and tools/storylet_bundle.py next.' % (changed['approved'], changed['rejected']))
    return 0


def main(argv):
    batch = 'batch_01'
    if '--batch' in argv:
        batch = argv[argv.index('--batch') + 1]
    page_path = os.path.join(ROOT, 'docs', 'review_%s.md' % batch)
    if '--apply' in argv:
        return apply(batch, page_path)
    W = L.World()
    page = build_page(batch, W)
    if '--diff' in argv:
        import difflib
        old = open(page_path, encoding='utf-8').read() if os.path.exists(page_path) else ''
        d = list(difflib.unified_diff(old.splitlines(), page.splitlines(), 'on disk', 'regenerated', lineterm='', n=0))
        print('\n'.join(d) if d else 'no changes')
        return 0
    # keep any ticks the reviewer already made
    ticked = ticked_from_page(page_path)
    for sid in ticked:
        page = page.replace('- [ ] **`%s`**' % sid, '- [x] **`%s`**' % sid)
    open(page_path, 'w', encoding='utf-8').write(page)
    n = ensure_csv(batch)
    print('wrote %s (%d storylets) and %s' % (os.path.relpath(page_path, ROOT), n, os.path.relpath(DECISIONS, ROOT)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
