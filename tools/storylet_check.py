"""Validate storylet files in data/narrative/storylets/*.json against the narrative ledgers.
Checks: schema and kind rules; ids unique and matched to calls.csv; preconditions parse and use only names declared in state.json
(or knows./told./clue./seen. patterns); effects obey the per-kind write policy; who-knows-what (knowledge.csv); banned reveals and gated
terms; echoed clues; then the style lint (tools/storylet_lint.py). Run:  python3 -I tools/storylet_check.py [--no-lint] [--strict] [--quiet]
Exit 1 on any error (or any warning with --strict).
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storylet_lib as L
import storylet_lint as LINT

KNOWN_KEYS = {'after', 'id', 'kind', 'speaker', 'station', 'with', 'trigger', 'place', 'proposer', 'objector', 'summary', 'needs', 'priority', 'weight',
              'cooldown_legs', 'cooldown_s', 'once', 'group', 'autoseen', 'mentions', 'reveals', 'echoes', 'clues', 'lines', 'variants', 'choices',
              'effects', 'status', 'meta', 'tags', 'callbacks', 'pov'}
ID_RE = re.compile(r'^[a-z]+(\.[a-z0-9_]+){2,4}$')


class Report:
    def __init__(self):
        self.items = []

    def add(self, lvl, sid, msg):
        self.items.append((lvl, sid, msg))

    @property
    def errors(self):
        return sum(1 for i in self.items if i[0] == 'E')

    @property
    def warnings(self):
        return sum(1 for i in self.items if i[0] == 'W')


def check_cond(W, R, sid, label, expr):
    try:
        ast = L.parse(expr)
    except L.CondError as e:
        R.add('E', sid, '%s: %s' % (label, e))
        return None
    for name, val, vk, op in L.cond_names(ast):
        if not W.name_ok(name):
            R.add('E', sid, '%s: unknown state name %s' % (label, name))
            continue
        v = W.vars.get(name)
        if op is None or v is None:
            continue
        if v['type'] == 'string':
            continue
        if vk == 'name':
            if val not in W.vars and not W.name_ok(val) and not (v['type'] == 'enum' and val in v.get('values', [])):
                R.add('E', sid, '%s: %s compared with unknown value %s' % (label, name, val))
        elif v['type'] == 'enum' and val not in v.get('values', []):
            R.add('E', sid, '%s: %s is not a value of %s %s' % (label, val, name, v.get('values')))
        elif v['type'] == 'int' and isinstance(val, int) and not (v.get('min', -10**9) <= val <= v.get('max', 10**9)):
            R.add('W', sid, '%s: %s %s %s is outside its range %s..%s' % (label, name, op, val, v.get('min'), v.get('max')))
        elif v['type'] == 'int' and vk == 'str':
            R.add('E', sid, '%s: %s is a number, compared with a string' % (label, name))
    return ast


def effect_allowed(policy, name):
    import fnmatch
    for pat in policy.get('forbid', []):
        if fnmatch.fnmatch(name, pat):
            return False
    return any(fnmatch.fnmatch(name, pat) for pat in policy.get('allow', []))


def numeric_cap(policy, name):
    import fnmatch
    for pat, cap in policy.get('numeric', {}).items():
        if fnmatch.fnmatch(name, pat):
            return cap
    return None


def check_effects(W, R, s):
    sid, kind = s['id'], s['kind']
    policy = W.lint['effect_policy'].get(kind, {'allow': [], 'numeric': {}})
    sets_knows = set()
    for label, e in L.walk_effects(s):
        try:
            name, op, val = L.parse_effect(e)
        except L.CondError as ex:
            R.add('E', sid, '%s: %s' % (label, ex))
            continue
        if name == 'play':
            if not re.fullmatch(r'[a-z0-9_]+(\.[a-z0-9_]+)+', str(val)):
                R.add('E', sid, '%s: play: needs a scene id like aftermath.b1' % label)
            continue
        if not W.name_ok(name):
            R.add('E', sid, '%s: effect writes unknown state name %s' % (label, name))
            continue
        v = W.vars.get(name)
        if v and (v.get('derived') or v.get('type') == 'time'):
            R.add('E', sid, '%s: %s is derived/runtime-written, a storylet may not set it' % (label, name))
        if v and v.get('hidden') and kind not in ('call', 'vig'):
            R.add('E', sid, '%s: %s is hidden state' % (label, name))
        if not effect_allowed(policy, name):
            R.add('E', sid, '%s: a %s storylet may not write %s' % (label, kind, name))
        if name.startswith('knows.') and op == '=' and val is True:
            sets_knows.add(name[6:])
        if v and v['type'] == 'enum' and op == '=' and val not in v.get('values', []):
            R.add('E', sid, '%s: %s is not a value of %s' % (label, val, name))
        if v and v['type'] == 'int':
            if op == '=' and not isinstance(val, int):
                R.add('E', sid, '%s: %s needs a number' % (label, name))
            elif op in ('+=', '-=') and isinstance(val, int):
                cap = numeric_cap(policy, name)
                if cap is None:
                    R.add('E', sid, '%s: a %s storylet may not change %s by a number' % (label, kind, name))
                elif abs(val) > cap:
                    R.add('E', sid, '%s: %s %s%s exceeds the cap %d for a %s storylet' % (label, name, op, val, cap, kind))
                if v.get('oneway') and ((op == '-=' and val > 0) or (op == '+=' and val < 0)):
                    R.add('E', sid, '%s: %s is one-way up' % (label, name))
            elif op == '=' and kind in ('banter', 'chatter', 'react', 'dress'):
                R.add('E', sid, '%s: ambient storylets may not assign %s' % (label, name))
    return sets_knows


def player_may_know(W, s, ast, fact):
    """Is the player (or the baseline Act 1 player) guaranteed to know `fact` when this storylet runs?"""
    if ast is not None and ('knows.' + fact) in L.required(ast):
        return True
    if fact in W.lint['baseline_player_knows']:
        return ast is not None and (L.lower_bound(ast, 'act') or 0) >= 1
    return False


def speaker_knows(W, fact, who, ast):
    f = W.facts[fact]
    if who in f['known_by'] or ('crew' in f['known_by'] and who in W.crew):
        return True
    return ast is not None and ('told.%s.%s' % (fact, who)) in L.required(ast)


def check_knowledge(W, R, s, ast, sets_knows):
    sid, kind = s['id'], s['kind']
    kc = W.lint['kinds'][kind]
    who = s['speaker']
    for fact in s.get('mentions', []) or []:
        if fact not in W.facts:
            R.add('E', sid, 'mentions unknown fact %s' % fact)
            continue
        if not speaker_knows(W, fact, who, ast):
            R.add('E', sid, '%s mentions %s but does not know it (knowledge.csv: %s); add told.%s.%s to needs or move the line' % (who, fact, sorted(W.facts[fact]['known_by']), fact, who))
        if not player_may_know(W, s, ast, fact):
            R.add('E', sid, 'banned reveal: mentions %s but needs does not require knows.%s (the player may not know it yet)' % (fact, fact))
    for fact in s.get('reveals', []) or []:
        if fact not in W.facts:
            R.add('E', sid, 'reveals unknown fact %s' % fact)
            continue
        if not kc['reveals_allowed']:
            R.add('E', sid, 'banned reveal: a %s storylet may not reveal facts (%s)' % (kind, fact))
        if not speaker_knows(W, fact, who, ast):
            R.add('E', sid, '%s reveals %s but does not know it (knowledge.csv: %s)' % (who, fact, sorted(W.facts[fact]['known_by'])))
        if fact not in sets_knows:
            R.add('W', sid, 'reveals %s but no effect sets knows.%s' % (fact, fact))
    for fact in sets_knows:
        if kind in ('banter', 'chatter', 'react', 'dress'):
            R.add('E', sid, 'ambient storylets may not set knows.%s' % fact)
        if fact in W.facts and not speaker_knows(W, fact, who, ast) and fact not in (s.get('reveals') or []):
            R.add('W', sid, 'sets knows.%s but %s is not listed as knowing it and it is not under reveals' % (fact, who))
    for cid in s.get('echoes', []) or []:
        if cid not in W.clue_ids:
            R.add('E', sid, 'echoes unknown clue %s' % cid)
        elif ast is None or not any(n.startswith(('seen.', 'knows.', 'clue.')) for n in L.required(ast)):
            R.add('E', sid, 'echoes %s but needs does not require a seen./knows./clue. gate (the player has not met the clue yet)' % cid)
    for cid in s.get('clues', []) or []:
        if cid not in W.clue_ids:
            R.add('E', sid, 'clues lists unknown clue %s (log it in clues.csv first)' % cid)
        if kind in ('banter', 'chatter', 'react', 'dress'):
            R.add('E', sid, 'ambient storylets may not plant new clues; use echoes for repeats of a logged clue')


def check_gated_terms(W, R, s, ast):
    """Banned reveals by wording. A line is allowed to use a gated term when the storylet's needs, an ancestor node's needs,
    the variant's needs or the line's own needs require the fact (or the act)."""
    sid = s['id']
    for label, ln, ctx in L.lines_with_context(s):
        text = ln.get('text')
        who = ln.get('who')
        if not isinstance(text, str):
            continue
        try:
            cast = L.combined_ast(ctx)
        except L.CondError:
            continue
        amin = L.lower_bound(cast, 'act') or 0
        req = L.required(cast)
        for g in W.lint['gated_terms']:
            if not re.search(g['term'], text, re.I):
                continue
            if 'act_min' in g and amin < g['act_min']:
                R.add('E', sid, '%s: banned reveal /%s/ before act %d (%s)' % (label, g['term'], g['act_min'], g['note']))
            if 'speakers' in g and who not in g['speakers'] and who != 'narr':
                R.add('E', sid, '%s: %s may not say /%s/ (%s)' % (label, who, g['term'], g['note']))
            for fact in g.get('facts', []):
                if ('knows.' + fact) not in req and not (fact in W.lint['baseline_player_knows'] and amin >= 1):
                    R.add('E', sid, '%s: banned reveal /%s/ needs knows.%s (%s)' % (label, g['term'], fact, g['note']))


def check_one(W, R, s, ledger):
    sid = s.get('id', '?')
    for k in s:
        if k not in KNOWN_KEYS:
            R.add('W', sid, 'unknown field %r' % k)
    kind = s.get('kind')
    kc = W.lint['kinds'].get(kind)
    if not kc:
        R.add('E', sid, 'kind %r not one of %s' % (kind, sorted(W.lint['kinds'])))
        return
    if not ID_RE.match(sid) or sid.split('.')[0] != kc['prefix']:
        R.add('E', sid, 'id must look like %s.<speaker>.<name> (lowercase, dots)' % kc['prefix'])
    spk = s.get('speaker')
    if spk not in W.speakers:
        R.add('E', sid, 'unknown speaker %r' % spk)
        return
    if sid.split('.')[1:2] and sid.split('.')[1] not in [spk] + list(s.get('with', []) or []) and kind != 'pitch':
        R.add('W', sid, 'id second segment should be the speaker (%s) or a co-speaker/subject listed in with' % spk)
    for w in s.get('with', []) or []:
        if w not in W.speakers:
            R.add('E', sid, 'unknown co-speaker %r' % w)
    st = s.get('station')
    if kc.get('needs_station') and st not in W.lint['rooms']:
        R.add('E', sid, 'station %r is not a room id %s' % (st, W.lint['rooms']))
    if kc.get('needs_trigger') and s.get('trigger') not in W.lint['triggers']['values']:
        R.add('E', sid, 'trigger %r is not in lint.json triggers' % s.get('trigger'))
    if kc.get('needs_summary') and not s.get('summary'):
        R.add('E', sid, 'a %s needs a one-line summary (if you cannot state it in a line it is two storylets)' % kind)
    if kc.get('needs_pair') and not (s.get('proposer') and s.get('objector')):
        R.add('E', sid, 'a pitch needs proposer and objector (one proposer, one or two objectors; seats, not people)')
    for k in ('priority', 'weight', 'cooldown_legs', 'cooldown_s'):
        if k in s and not isinstance(s[k], (int, float)):
            R.add('E', sid, '%s must be a number' % k)
    if not 0 <= s.get('priority', 50) <= 100:
        R.add('E', sid, 'priority must be 0..100')
    if s.get('weight', 1) <= 0:
        R.add('E', sid, 'weight must be > 0')
    if s.get('status', 'draft') not in ('draft', 'approved', 'rejected'):
        R.add('E', sid, 'status must be draft, approved or rejected')
    if not s.get('lines') and not s.get('variants'):
        R.add('E', sid, 'no lines')
    if not s.get('choices_allowed', True) and s.get('choices'):
        pass
    if any(n.get('choices') for _, n in L.iter_nodes(s)) and not kc['choices_allowed']:
        R.add('E', sid, 'a %s storylet may not carry choices' % kind)
    # lines
    for label, ln in L.walk_lines(s):
        who = ln.get('who')
        if who not in W.speakers and who not in ('narr', 'captain'):
            R.add('E', sid, '%s: unknown who %r' % (label, who))
        if who in W.speakers and who not in ([spk] + list(s.get('with', []) or []) + ([s['proposer']] if s.get('proposer') else []) + ([s['objector']] if s.get('objector') else [])):
            R.add('E', sid, '%s: %s speaks but is not the speaker, a co-speaker (with) or a proposer/objector' % (label, who))
        if 'text' not in ln:
            R.add('E', sid, '%s: line has no text' % label)
    # variants
    for vi, v in enumerate(s.get('variants', []) or []):
        if not v.get('needs'):
            R.add('E', sid, 'variants[%d] needs a condition (the base lines are the default)' % vi)
        if not v.get('lines'):
            R.add('E', sid, 'variants[%d] has no lines' % vi)
    # conditions
    ast = None
    for label, expr in L.walk_conditions(s):
        a = check_cond(W, R, sid, label, expr)
        if label == 'needs':
            ast = a
    if 'needs' not in s or not s['needs']:
        ast = L.parse('')
        if kind in ('call', 'vig', 'pitch'):
            R.add('W', sid, 'no needs (always eligible; unusual for a %s)' % kind)
    # callbacks/ledger
    if kind == 'call':
        row = ledger.get(sid)
        if row is None:
            R.add('W', sid, 'call not in calls.csv (add a row so the ledger and picker agree)')
        else:
            if row['speaker'] != spk:
                R.add('E', sid, 'calls.csv says speaker %s' % row['speaker'])
            try:
                if int(row['priority']) != s.get('priority'):
                    R.add('E', sid, 'calls.csv priority %s != %s' % (row['priority'], s.get('priority')))
            except ValueError:
                pass
    sets_knows = check_effects(W, R, s)
    check_knowledge(W, R, s, ast, sets_knows)
    check_gated_terms(W, R, s, ast)
    # choice ids
    for label, node in L.iter_nodes(s):
        for ci, c in enumerate(node.get('choices') or []):
            if not c.get('label'):
                R.add('E', sid, '%s.choice[%d] has no label' % (label, ci))
            if not (c.get('lines') or c.get('effects') or c.get('choices') or c.get('after')):
                R.add('E', sid, '%s.choice[%d] does nothing' % (label, ci))
        if len(node.get('choices') or []) == 1:
            R.add('W', sid, '%s: a single choice is not a choice' % (label or 'root'))
    # group / once sanity
    if s.get('once') and s.get('cooldown_legs'):
        R.add('W', sid, 'once and cooldown_legs together: cooldown is moot')


def main(argv):
    W = L.World()
    R = Report()
    ledger = {r['id']: r for r in L.csv_rows('calls.csv')}
    seen_ids = {}
    nfiles = nst = 0
    for path in L.storylet_files():
        nfiles += 1
        try:
            d = L.jload(path)
        except Exception as e:
            R.add('E', os.path.basename(path), 'invalid JSON: %s' % e)
            continue
        for s in d.get('storylets', []):
            nst += 1
            sid = s.get('id', '?')
            if sid in seen_ids:
                R.add('E', sid, 'duplicate id (also in %s)' % seen_ids[sid])
            seen_ids[sid] = os.path.basename(path)
            try:
                check_one(W, R, s, ledger)
            except Exception as e:  # a malformed storylet must not hide the others
                R.add('E', sid, 'validator crashed on this storylet: %r' % e)
            if '--no-lint' not in argv:
                for lvl, label, msg in LINT.lint_storylet(W, s):
                    R.add(lvl, sid, '%s: %s' % (label, msg))
    if '--no-lint' not in argv:
        live = [s for _, s in L.load_storylets() if s.get('status', 'draft') != 'rejected']
        for lvl, who, msg in LINT.repetition(W, live):
            R.add(lvl, 'repeat.' + who, msg)
    for call_id in ledger:
        if call_id.split('.')[1:2] and any(call_id == k for k in seen_ids):
            pass
    quiet = '--quiet' in argv
    for lvl, sid, msg in R.items:
        if lvl == 'E' or not quiet:
            print('%s %s: %s' % (lvl, sid, msg))
    print('storylets %d in %d files; %d errors, %d warnings' % (nst, nfiles, R.errors, R.warnings))
    bad = R.errors or ('--strict' in argv and R.warnings)
    print('FAILED' if bad else 'OK')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
