"""Negative tests for the storylet validator: each mutation of a clean storylet must trip the named rule, and the clean one must pass.
Run: python3 -I tests/storylet_check_test.py"""
import copy, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import storylet_lib as L
import storylet_check as C
import storylet_lint as LINT

W = L.World()
ledger = {r['id']: r for r in L.csv_rows('calls.csv')}
BASE = {"id": "banter.abara.control.fixture", "kind": "banter", "speaker": "abara", "station": "control", "priority": 40,
        "summary": "fixture", "needs": "not murdered",
        "lines": [{"who": "abara", "text": "Tea's on. It's strong enough to strip paint."}]}


def run(s):
    R = C.Report()
    C.check_one(W, R, s, ledger)
    msgs = ['%s: %s' % (lvl, m) for lvl, _, m in R.items]
    for lvl, label, m in LINT.lint_storylet(W, s):
        msgs.append('%s: %s: %s' % (lvl, label, m))
    return msgs


def mut(f):
    s = copy.deepcopy(BASE)
    f(s)
    return s


CASES = [
    ('unknown state name', lambda s: s.update(needs='nonsense.var>3'), 'unknown state name'),
    ('bad enum value', lambda s: s.update(needs='corvane==sleeping'), 'unknown value'),
    ('hard-coded clock time', lambda s: s['lines'][0].update(text='Meet me on the bridge at 14:30.'), 'clock'),
    ('gated term before its act', lambda s: s['lines'][0].update(text='The Choir is listening, kid.'), 'banned reveal'),
    ('speaker does not know the fact', lambda s: s.update(mentions=['dace_expulsion'], needs='knows.dace_expulsion'), 'does not know it'),
    ('mentions a fact without the player gate', lambda s: s.update(mentions=['decoy_turned']), 'banned reveal'),
    ('banter may not reveal', lambda s: s.update(reveals=['module_box']), 'may not reveal'),
    ('banter may not set knows', lambda s: s.update(effects=['knows.module_box']), 'may not'),
    ('effect writes unknown name', lambda s: s.update(effects=['made.up=3']), 'unknown state name'),
    ('trust nudge over the cap', lambda s: s.update(effects=['trust.abara+=9']), 'exceeds the cap'),
    ('banned stock phrase', lambda s: s['lines'][0].update(text='She felt a sense of dread, and said nothing at all.'), 'sense of'),
    ('line from a non-participant', lambda s: s['lines'].append({"who": "quill", "text": "Captain."}), 'speaks but is not'),
    ('station is not a room', lambda s: s.update(station='kitchen'), 'not a room'),
    ('id prefix does not match kind', lambda s: s.update(id='call.abara.control.fixture'), 'id must look like'),
    ('banter may not carry choices', lambda s: s.update(choices=[{"label": "a", "lines": [{"who": "abara", "text": "x"}]}, {"label": "b", "lines": [{"who": "abara", "text": "y"}]}]), 'may not carry choices'),
    ('voice: Abara never speaks of grief', lambda s: s['lines'][0].update(text="I miss her. I miss her more than I can say."), 'would never'),
    ('unknown speaker', lambda s: s.update(speaker='nobody'), 'unknown speaker'),
    ('priority out of range', lambda s: s.update(priority=400), 'priority must be'),
]

fails = 0


def ok(c, m):
    global fails
    print(('ok   ' if c else 'FAIL ') + m)
    if not c:
        fails += 1


clean = run(copy.deepcopy(BASE))
ok(not [m for m in clean if m.startswith('E')], 'the clean fixture has no errors (%s)' % ('; '.join(clean) or 'none'))
for name, f, needle in CASES:
    msgs = run(mut(f))
    errs = [m for m in msgs if m.startswith('E')]
    hit = [m for m in errs if needle.lower() in m.lower()]
    ok(bool(hit), '%s -> error containing "%s"%s' % (name, needle, '' if hit else '  (got: %s)' % ('; '.join(msgs) or 'nothing')))
print('%d failures' % fails)
sys.exit(1 if fails else 0)
