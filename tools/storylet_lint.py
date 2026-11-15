"""Style-guide lint and repetition detector for storylet files (docs/writing_style_guide.md, data/pell_voice.md, docs/pov_sheets.md).
Rules and word lists live in data/narrative/lint.json so Dave can add a tic after a review.
Usage:  python3 -I tools/storylet_lint.py [--repeat] [--all-status] [files...]
   E = error (exit 1), W = warning for review.  --repeat adds the cross-storylet repetition report.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storylet_lib as L

CONTRACTION = re.compile(r"\b\w+(n't|'re|'ll|'d|'ve|'m)\b|\b(it|that|what|here|there|let|who|how|she|he)'s\b|\b[a-z]+in'\b", re.I)
TAGGED = re.compile(r'["\u201d],?\s+(she|he|they|\w+)\s+(said|asked|replied|whispered|muttered|snapped|sighed)\b', re.I)
ANYQ = re.compile('[“”‘’]')


def lint_storylet(W, s):
    """Return [(level, label, message)] for one storylet."""
    out = []
    cfg = W.lint
    kind = s.get('kind')
    kc = cfg['kinds'].get(kind, {})
    maxw = kc.get('max_line_words', 40)
    maxs = kc.get('max_sentences', 4)
    sid = s.get('id', '?')
    seen_texts = set()
    seen_nodes = {}
    banned = [re.compile(p, re.I) for p in cfg['banned_phrases']]
    expo = [re.compile(p, re.I) for p in cfg['exposition_tells']]
    clock = [re.compile(p, re.I) for p in cfg['clock_time_patterns']]
    allowed_tokens = set(cfg['tokens']['allowed']) | {k for k, v in W.vars.items() if v.get('type') == 'time'}
    for label, who, text in L.line_texts(s):
        if not isinstance(text, str) or not text.strip():
            out.append(('E', label, 'empty text'))
            continue
        is_narr = who == 'narr'
        nw = len(L.words(L.strip_tokens(text)))
        lim = 28 if is_narr else maxw
        if nw > lim:
            out.append(('E' if nw > lim * 1.35 else 'W', label, '%d words (limit %d for %s%s)' % (nw, lim, kind, ' narration' if is_narr else '')))
        ns = len(L.sentences(text))
        v = cfg['voice'].get(who, {})
        smax = v.get('call_max_sentences', maxs) if (kind in ('call', 'vig', 'pitch') and who == 'pell') else min(maxs, v.get('max_sentences', maxs))
        if not is_narr and ns > smax:
            out.append(('E' if who == 'pell' else 'W', label, '%d sentences (limit %d for %s)' % (ns, smax, who)))
        if kc.get('narration_only') and not is_narr:
            out.append(('E', label, 'a %s storylet may only carry narration (who: narr)' % kind))
        for p in banned:
            m = p.search(text)
            if m:
                out.append(('E', label, 'banned phrase %r' % m.group(0)))
        for p in expo:
            m = p.search(text)
            if m:
                out.append(('W', label, 'exposition tell %r (the speaker would not say this to someone who lives here)' % m.group(0)))
        for p in clock:
            m = p.search(text)
            if m:
                out.append(('E', label, 'hard-coded clock time %r (use {clock.*} tokens or say nothing)' % m.group(0)))
        for tok in re.findall(r'\{([^}]*)\}', text):
            if tok not in allowed_tokens:
                out.append(('E', label, 'unknown token {%s}' % tok))
        if re.search('[—–]', text) or ' -- ' in text:
            out.append(('E', label, 'dash punctuation (house style: commas, full stops, parentheses)'))
        if ANYQ.search(text):
            out.append(('E', label, 'curly quotes (use straight quotes)'))
        if '  ' in text or text != text.strip():
            out.append(('W', label, 'stray spaces'))
        if text.count('...') > 2:
            out.append(('W', label, 'ellipsis overuse'))
        if re.match(r'^\s*[A-Z][a-z]+:', text) and not is_narr:
            out.append(('E', label, 'text starts with a speaker label'))
        if not is_narr and TAGGED.search(text):
            out.append(('W', label, 'dialogue tag inside spoken text (stage directions go in a narr line)'))
        node_key = label.rsplit('lines[', 1)[0]
        if text in seen_nodes.setdefault(node_key, set()):
            out.append(('W', label, 'same line twice in one scene beat'))
        seen_nodes[node_key].add(text)
        if is_narr:
            continue
        ex = text.count('!')
        if ex > v.get('exclaim', 1):
            out.append(('W', label, '%d exclamation marks (%s allows %d)' % (ex, who, v.get('exclaim', 1))))
        for pat in v.get('would_never', []):
            if re.search(pat, text, re.I):
                out.append(('E', label, '%s would never say this (POV sheet): /%s/' % (who, pat)))
        for pat in v.get('never_words', []):
            if re.search(pat, text, re.I):
                out.append(('E', label, "%s never says /%s/ (voice drift)" % (who, pat)))
        for pat, owners in cfg['signature_tokens'].items():
            if pat.startswith('_'):
                continue
            if who not in owners and re.search(pat, text, re.I):
                out.append(('E', label, "/%s/ belongs to %s, not %s (voice drift)" % (pat, '/'.join(owners), who)))
        cc = cfg['contractions']
        if who not in cc['exempt'] and nw >= cc['min_words_without'] and not CONTRACTION.search(text):
            out.append(('W', label, 'no contraction in %d words (everyone talks like a person)' % nw))
    return out


def corpus(storylets):
    """(sid, speaker, text) for every non-narration line."""
    for s in storylets:
        for label, who, text in L.line_texts(s):
            if who and who != 'narr' and isinstance(text, str):
                yield s['id'], who, text


def shingles(t, n):
    w = [x.lower() for x in L.words(L.strip_tokens(t))]
    return {tuple(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def repetition(W, storylets):
    """Cross-storylet repetition: near duplicates, repeated openings, repeated 4-grams."""
    out = []
    cfg = W.lint['repetition']
    items = list(corpus(storylets))
    sh = [shingles(t, cfg['shingle']) for _, _, t in items]
    for i in range(len(items)):
        if len(sh[i]) < 3:
            continue
        for j in range(i + 1, len(items)):
            if items[i][0] == items[j][0] or len(sh[j]) < 3:
                continue
            inter = len(sh[i] & sh[j])
            if not inter:
                continue
            jac = inter / len(sh[i] | sh[j])
            if jac >= cfg['near_dup_warn']:
                out.append(('E' if jac >= cfg['near_dup_error'] else 'W', items[i][0],
                            'near-duplicate of %s (%.2f): %r / %r' % (items[j][0], jac, items[i][2][:50], items[j][2][:50])))
    by = {}
    for sid, who, t in items:
        by.setdefault(who, []).append((sid, t))
    for who, rows in by.items():
        opens, grams = {}, {}
        for sid, t in rows:
            w = [x.lower() for x in L.words(L.strip_tokens(t))]
            if len(w) >= 3:
                opens.setdefault(tuple(w[:3]), set()).add(sid)
            seen4 = set()
            for i in range(len(w) - 3):
                seen4.add(tuple(w[i:i + 4]))
            for g in seen4:
                grams.setdefault(g, set()).add(sid)
        for g, ids in opens.items():
            if len(ids) > cfg['opening_trigrams_max']:
                out.append(('W', who, 'opens %d lines with %r (%s)' % (len(ids), ' '.join(g), ', '.join(sorted(ids)[:4]))))
        for g, ids in grams.items():
            if len(ids) > cfg['ngram4_max']:
                out.append(('W', who, 'phrase %r appears in %d storylets (a tic?)' % (' '.join(g), len(ids))))
    return out


def main(argv):
    show_repeat = '--repeat' in argv
    all_status = '--all-status' in argv
    files = [a for a in argv if not a.startswith('--')]
    W = L.World()
    sl = [s for p, s in L.load_storylets() if all_status or s.get('status', 'draft') != 'rejected']
    if files:
        sl = [s for s in sl if s.get('id') in files]
    errs = warns = 0
    for s in sl:
        for lvl, label, msg in lint_storylet(W, s):
            print('%s %s %s: %s' % (lvl, s.get('id'), label, msg))
            errs += lvl == 'E'
            warns += lvl == 'W'
    if show_repeat:
        for lvl, who, msg in repetition(W, sl):
            print('%s repeat %s: %s' % (lvl, who, msg))
            errs += lvl == 'E'
            warns += lvl == 'W'
    print('lint: %d storylets, %d errors, %d warnings' % (len(sl), errs, warns))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
