"""Shared library for the storylet toolchain (validator, lint, coverage, review, context, bundle).
Stdlib only. Scripts insert this folder on sys.path themselves, so `python3 -I tools/storylet_check.py` works.

The condition grammar here is mirrored in web/storylets.js; tests/storylet_conditions.json holds shared vectors that both sides run.
  expr  := or ;  or := and ('or' and)* ;  and := not (('and' | ',') not)* ;  not := 'not' not | atom
  atom  := '(' expr ')' | NAME [OP value] ;  OP := == != >= <= > < =   (a single '=' means '==')
  value := INT | NAME | "string"      NAME := [A-Za-z_][\\w.]*   (dots allowed)
A bare NAME is true when the variable is true / non-zero / not 'unset' / not empty.
In `NAME OP value`, a value that is a declared state variable is read as that variable; otherwise it is a literal (enum word or int).
"""
import csv, glob, json, os, re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
NARR = os.path.join(ROOT, 'data', 'narrative')
SLDIR = os.path.join(NARR, 'storylets')


def jload(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def csv_rows(name):
    with open(os.path.join(NARR, name), encoding='utf-8') as f:
        return list(csv.DictReader(f))


class World:
    """Everything the validators know about canon: state vars, cast, facts, clues, lint config."""
    def __init__(self):
        self.state = jload(os.path.join(NARR, 'state.json'))
        self.vars = self.state['vars']
        self.cast = jload(os.path.join(NARR, 'cast.json'))
        self.crew = set(self.cast['crew'])
        self.others = set(self.cast.get('others', {}))
        self.speakers = self.crew | self.others
        self.facts = {}
        for r in csv_rows('knowledge.csv'):
            kb = set(x.strip().rstrip('?') for x in (r['known_by_at_start'] or '').split(';') if x.strip())
            self.facts[r['fact']] = {'known_by': kb, 'desc': r['description'], 'via': r['revealed_via']}
        self.clue_ids = {r['clue_id'] for r in csv_rows('clues.csv')}
        self.lint = jload(os.path.join(NARR, 'lint.json'))

    # --- state names -------------------------------------------------------
    def name_ok(self, n):
        if n in self.vars:
            return True
        m = re.fullmatch(r'knows\.(\w+)', n)
        if m:
            return m.group(1) in self.facts
        m = re.fullmatch(r'told\.(\w+)\.(\w+)', n)
        if m:
            return m.group(1) in self.facts and m.group(2) in self.speakers
        if n.startswith('clue.'):
            return n in self.clue_ids
        m = re.fullmatch(r'visitor\.(\w+)', n)
        if m:
            return m.group(1) in ('corvane', 'ames', 'elder', 'inspector', 'believer')
        return bool(re.fullmatch(r'seen\.[\w.]+', n))

    def kind_of(self, n):
        """'int' | 'enum' | 'bool' | 'time' | 'string' for a state name."""
        v = self.vars.get(n)
        if v:
            return v['type']
        return 'bool'


# ---------------------------------------------------------------------------
# conditions
# ---------------------------------------------------------------------------
_TOK = re.compile(r'\s*(?:(?P<op>==|!=|>=|<=|>|<|=)|(?P<num>-?\d+(?![\w.]))|(?P<str>"[^"]*")|(?P<name>[A-Za-z_][\w.]*)|(?P<p>[(),!]))')


class CondError(ValueError):
    pass


def tokenize(src):
    out, pos = [], 0
    src = src.strip()
    while pos < len(src):
        m = _TOK.match(src, pos)
        if not m or m.end() == pos:
            raise CondError('cannot read %r at %r' % (src, src[pos:pos + 12]))
        pos = m.end()
        k = m.lastgroup
        v = m.group(k)
        if k == 'name' and v in ('and', 'or', 'not'):
            k = 'kw'
        out.append((k, v))
    return out


def parse(src):
    """Return an AST: ('and',[..]) ('or',[..]) ('not',x) ('cmp', name, op, value|None, value_kind)."""
    if src is None or not str(src).strip():
        return ('true',)
    toks = tokenize(str(src))
    i = [0]

    def peek():
        return toks[i[0]] if i[0] < len(toks) else (None, None)

    def eat():
        t = toks[i[0]]
        i[0] += 1
        return t

    def p_or():
        a = [p_and()]
        while peek() == ('kw', 'or'):
            eat()
            a.append(p_and())
        return a[0] if len(a) == 1 else ('or', a)

    def p_and():
        a = [p_not()]
        while peek() == ('kw', 'and') or peek() == ('p', ','):
            eat()
            a.append(p_not())
        return a[0] if len(a) == 1 else ('and', a)

    def p_not():
        if peek() == ('kw', 'not') or peek() == ('p', '!'):
            eat()
            return ('not', p_not())
        return p_atom()

    def p_atom():
        k, v = peek()
        if (k, v) == ('p', '('):
            eat()
            e = p_or()
            if peek() != ('p', ')'):
                raise CondError('missing ) in %r' % src)
            eat()
            return e
        if k != 'name':
            raise CondError('expected a name in %r, got %r' % (src, v))
        eat()
        name = v
        k2, v2 = peek()
        if k2 == 'op':
            eat()
            k3, v3 = peek()
            if k3 == 'num':
                eat()
                return ('cmp', name, '==' if v2 == '=' else v2, int(v3), 'int')
            if k3 == 'str':
                eat()
                return ('cmp', name, '==' if v2 == '=' else v2, v3[1:-1], 'str')
            if k3 == 'name':
                eat()
                return ('cmp', name, '==' if v2 == '=' else v2, v3, 'name')
            raise CondError('expected a value after %s %s in %r' % (name, v2, src))
        return ('cmp', name, None, None, None)

    ast = p_or()
    if i[0] != len(toks):
        raise CondError('unexpected %r in %r' % (toks[i[0]][1], src))
    return ast


def cond_names(ast, acc=None):
    """All (name, value, value_kind) references in an AST, including variable-valued right-hand sides."""
    acc = [] if acc is None else acc
    t = ast[0]
    if t in ('and', 'or'):
        for x in ast[1]:
            cond_names(x, acc)
    elif t == 'not':
        cond_names(ast[1], acc)
    elif t == 'cmp':
        acc.append((ast[1], ast[3], ast[4], ast[2]))
    return acc


def specificity(ast):
    t = ast[0]
    if t == 'true':
        return 0
    if t in ('and', 'or'):
        return sum(specificity(x) for x in ast[1])
    if t == 'not':
        return specificity(ast[1])
    return 1


def required(ast):
    """Names that must be truthy for the whole expression to be true (conservative)."""
    t = ast[0]
    if t == 'and':
        s = set()
        for x in ast[1]:
            s |= required(x)
        return s
    if t == 'or':
        sets = [required(x) for x in ast[1]]
        return set.intersection(*sets) if sets else set()
    if t == 'cmp':
        if ast[2] is None or (ast[2] == '==' and ast[3] not in ('unset', 0, False)):
            return {ast[1]}
        if ast[2] in ('>=', '>') and isinstance(ast[3], int) and (ast[3] > 0 or ast[2] == '>'):
            return {ast[1]}
    return set()


def lower_bound(ast, name):
    """Smallest value `name` can take if the expression is true, from required int comparisons (None = unknown)."""
    t = ast[0]
    if t == 'and':
        vals = [lower_bound(x, name) for x in ast[1]]
        vals = [v for v in vals if v is not None]
        return max(vals) if vals else None
    if t == 'or':
        vals = [lower_bound(x, name) for x in ast[1]]
        return None if any(v is None for v in vals) else min(vals)
    if t == 'cmp' and ast[1] == name and ast[4] == 'int':
        if ast[2] in ('>=', '=='):
            return ast[3]
        if ast[2] == '>':
            return ast[3] + 1
    return None


def evaluate(ast, get):
    """get(name) -> value or None. Mirrors web/storylets.js."""
    t = ast[0]
    if t == 'true':
        return True
    if t == 'and':
        return all(evaluate(x, get) for x in ast[1])
    if t == 'or':
        return any(evaluate(x, get) for x in ast[1])
    if t == 'not':
        return not evaluate(ast[1], get)
    _, name, op, val, vk = ast
    cur = get(name)
    if op is None:
        return truthy(cur)
    if vk == 'name':
        other = get(val)
        rhs = other if other is not None else val
    else:
        rhs = val
    if isinstance(rhs, str) and re.fullmatch(r'-?\d+', rhs):
        rhs = int(rhs)
    if op == '==':
        return loose_eq(cur, rhs)
    if op == '!=':
        return not loose_eq(cur, rhs)
    a, b = num(cur), num(rhs)
    return {'>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b}[op]


def truthy(v):
    return not (v is None or v is False or v == 0 or v == '' or v == 'unset')


def num(v):
    if isinstance(v, bool):
        return 1 if v else 0
    if isinstance(v, (int, float)):
        return v
    if isinstance(v, str):
        m = re.fullmatch(r'(\d+):(\d+)', v)
        if m:
            return int(m.group(1)) * 60 + int(m.group(2))
        try:
            return float(v)
        except ValueError:
            return 0
    return 0


def loose_eq(a, b):
    if a is None:
        a = False if isinstance(b, bool) else ('unset' if isinstance(b, str) else 0)
    if isinstance(b, bool) or isinstance(a, bool):
        return truthy(a) == truthy(b)
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a == b
    return str(a) == str(b)


# ---------------------------------------------------------------------------
# effects
# ---------------------------------------------------------------------------
_EFF = re.compile(r'^\s*([A-Za-z_][\w.]*)\s*(?:(\+=|-=|=)\s*("[^"]*"|-?\w[\w.]*))?\s*$')


def parse_effect(s):
    """'trust.abara+=3' -> ('trust.abara', '+=', 3); 'seen.x' -> ('seen.x', '=', True); 'play:scene.id' -> ('play', ':', 'scene.id')."""
    s = s.strip()
    if s.startswith('play:'):
        return ('play', ':', s[5:].strip())
    m = _EFF.match(s)
    if not m:
        raise CondError('cannot read effect %r' % s)
    name, op, val = m.groups()
    if op is None:
        return (name, '=', True)
    if val.startswith('"'):
        val = val[1:-1]
    elif re.fullmatch(r'-?\d+', val):
        val = int(val)
    elif val in ('true', 'false'):
        val = (val == 'true')
    return (name, op, val)


# ---------------------------------------------------------------------------
# storylet files
# ---------------------------------------------------------------------------
def storylet_files():
    return sorted(p for p in glob.glob(os.path.join(SLDIR, '*.json')) if not os.path.basename(p).startswith('_'))


def load_storylets(statuses=None):
    """List of (path, storylet dict). Files that fail to parse raise."""
    out = []
    for p in storylet_files():
        d = jload(p)
        for s in d.get('storylets', []):
            if statuses is None or s.get('status', 'draft') in statuses:
                out.append((p, s))
    return out


def iter_nodes(s):
    """Every node of a storylet's tree: the root, each choice, and each `after` (a gather: lines and choices that play once
    the chosen branch is done). A node may carry lines, choices, after, needs, effects. Yields (label, node)."""
    def rec(node, label):
        yield label, node
        for ci, c in enumerate(node.get('choices') or []):
            yield from rec(c, '%s.choice[%d]' % (label, ci) if label else 'choice[%d]' % ci)
        if node.get('after'):
            yield from rec(node['after'], (label + '.after') if label else 'after')
    yield from rec(s, '')


def lines_with_context(s):
    """Yield (label, line, [needs strings that must all hold for the line to play]) : the storylet's needs, every ancestor
    node's needs, the variant's needs for variant lines, and the line's own needs."""
    root = [s['needs']] if s.get('needs') else []

    def rec(node, label, ctx):
        here = ctx + ([node['needs']] if node.get('needs') and label else [])
        pre = (label + '.') if label else ''
        for i, ln in enumerate(node.get('lines') or []):
            yield '%slines[%d]' % (pre, i), ln, here + ([ln['needs']] if ln.get('needs') else [])
        for ci, c in enumerate(node.get('choices') or []):
            yield from rec(c, '%s.choice[%d]' % (label, ci) if label else 'choice[%d]' % ci, here)
        if node.get('after'):
            yield from rec(node['after'], (label + '.after') if label else 'after', here)
    yield from rec(s, '', root)
    for vi, v in enumerate(s.get('variants', []) or []):
        for i, ln in enumerate(v.get('lines') or []):
            yield 'variants[%d].lines[%d]' % (vi, i), ln, root + ([v['needs']] if v.get('needs') else []) + ([ln['needs']] if ln.get('needs') else [])


def combined_ast(needs_list):
    asts = [parse(n) for n in needs_list]
    return ('and', asts) if asts else ('true',)


def walk_lines(s):
    """Yield (path_label, line_dict) for every line in a storylet: base lines, variants, choices, after-nodes (recursive)."""
    for label, node in iter_nodes(s):
        pre = (label + '.') if label else ''
        for i, ln in enumerate(node.get('lines') or []):
            yield '%slines[%d]' % (pre, i), ln
        if not label:
            for vi, v in enumerate(s.get('variants', []) or []):
                for i, ln in enumerate(v.get('lines') or []):
                    yield 'variants[%d].lines[%d]' % (vi, i), ln


def walk_conditions(s):
    """Yield (label, expr_string) for needs everywhere in a storylet."""
    for label, node in iter_nodes(s):
        pre = (label + '.') if label else ''
        if node.get('needs'):
            yield pre + 'needs', node['needs']
        if not label:
            for vi, v in enumerate(s.get('variants', []) or []):
                if v.get('needs'):
                    yield 'variants[%d].needs' % vi, v['needs']
        for i, ln in enumerate(node.get('lines') or []):
            if ln.get('needs'):
                yield '%slines[%d].needs' % (pre, i), ln['needs']
    for vi, v in enumerate(s.get('variants', []) or []):
        for i, ln in enumerate(v.get('lines') or []):
            if ln.get('needs'):
                yield 'variants[%d].lines[%d].needs' % (vi, i), ln['needs']


def walk_effects(s):
    """Yield (label, effect_string) for effects everywhere."""
    for label, node in iter_nodes(s):
        pre = (label + '.') if label else ''
        for e in node.get('effects') or []:
            yield pre + 'effects', e
    for vi, v in enumerate(s.get('variants', []) or []):
        for e in v.get('effects', []) or []:
            yield 'variants[%d].effects' % vi, e


def line_texts(s):
    """(label, who, text) for spoken/narrated lines only."""
    for label, ln in walk_lines(s):
        if 'text' in ln:
            yield label, ln.get('who', s.get('speaker')), ln['text']


# ---------------------------------------------------------------------------
# text helpers
# ---------------------------------------------------------------------------
def words(t):
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", t)


def strip_tokens(t):
    return re.sub(r'\{[^}]*\}', 'X', t)


def sentences(t):
    t = strip_tokens(t)
    t = re.sub(r'\.\.\.|…', ' ', t)
    parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+', t.strip()) if p.strip()]
    return parts


def band_of_style(x):
    return 'very_tight' if x <= 15 else 'tight' if x <= 35 else 'very_loose' if x >= 85 else 'loose' if x >= 65 else 'neutral'
