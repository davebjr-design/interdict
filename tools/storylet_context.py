"""Prompt-pack builder: everything an authoring pass needs to write a batch of storylets for one speaker, assembled from canon files.

  python3 -I tools/storylet_context.py --speaker quill --kind banter --station control --n 8 [--focus "murder route, post shakedown"] [--out FILE]

The pack is plain markdown. It holds, in this order: the task; the storylet schema and a worked example; the character's card and
POV sheet; voice rules from lint.json; what the speaker knows and must not mention; the state variables a `needs` may read (and the
ones a banter line must not write); banned words; the speaker's existing lines (so the pass avoids repeating them); and rejected
lines from past reviews (what NOT to write). It never contains hidden canon the speaker is not allowed to voice: the card's `hides`
field is shown as "private, do not reveal" for the writer's understanding only when the speaker themselves holds it.
Validate whatever comes back with tools/storylet_check.py before it goes anywhere near review.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storylet_lib as L

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXAMPLE = {
    "id": "banter.abara.control.example", "kind": "banter", "speaker": "abara", "station": "control", "priority": 50,
    "summary": "One line saying what this does, for the reviewer.",
    "needs": "trust.abara>=60 and not murdered",
    "lines": [{"who": "abara", "text": "First line."}, {"who": "narr", "text": "A beat of narration, in italics on screen."}],
    "variants": [{"needs": "murdered", "lines": [{"who": "abara", "text": "The same moment, written for a route where the player shot Corvane."}]}],
    "echoes": ["clue.id.if.the.line.recalls.a.clue.already.met"], "mentions": ["fact_id_if_a_known_fact_is_named"],
    "meta": {"batch": "batch_NN", "source": ["docs file the idea comes from"]}}


def pov_section(speaker):
    p = os.path.join(ROOT, 'docs', 'pov_sheets.md')
    if not os.path.exists(p):
        return ''
    txt = open(p, encoding='utf-8').read()
    name = speaker.capitalize()
    m = re.search(r'^### %s\b.*?(?=^###? |\Z)' % re.escape(name), txt, re.M | re.S)
    return m.group(0).strip() if m else ''


def card(W, speaker):
    cards = L.jload(os.path.join(L.NARR, 'crew_cards.json'))['cards']
    for c in cards:
        if c['id'] == speaker:
            return c
    return None


def build(W, speaker, kind, station, n, focus):
    cfg = W.lint['kinds'][kind]
    voice = W.lint['voice'].get(speaker, {})
    out = []
    P = out.append
    P('# Authoring pack: %s, %s%s' % (speaker, kind, (' at ' + station) if station else ''))
    P('')
    P('## Task')
    P('')
    P('Write %d new `%s` storylets for **%s**%s.%s' % (n, kind, speaker, (' at the `%s` station' % station) if station else '', (' Focus: %s.' % focus) if focus else ''))
    P('')
    P('Kind rules: %s Max %s sentences per line, max %s words per line. Reveals allowed: %s. Choices allowed: %s.' % (cfg['doc'], cfg['max_sentences'], cfg['max_line_words'], cfg['reveals_allowed'], cfg['choices_allowed']))
    P('')
    P('Be specific over general. A line that fires in a narrow state (a trust band, a route, a scene already played) is worth three universals. Every storylet that is not murder-route-safe needs `not murdered` or a `murdered` variant; the first week must work for every route. Do not explain the plot. Do not write a line that would make sense for any officer. Prefer an odd concrete detail to a summary of feeling.')
    P('')
    P('Output one JSON object per storylet, in the shape below, and nothing else.')
    P('')
    P('```json')
    P(json.dumps(EXAMPLE, indent=1, ensure_ascii=False))
    P('```')
    P('')
    P('`needs` is a condition over state names (`and`, `or`, `not`, `== != >= <= > <`, parentheses). `who` is a speaker id or `narr`. Token `{pell.nick}` and spoken-time tokens exist; no hard-coded clock times, spell out relative time ("an hour ago"). Banter may only set `seen.*` and nudge trust or command.style by at most 2; leave `effects` out unless the idea needs it.')
    P('')
    c = card(W, speaker)
    P('## Who %s is' % speaker)
    P('')
    if c:
        for k in ('role', 'background', 'voice', 'habits', 'likes', 'wants', 'fear', 'rel', 'line'):
            if c.get(k):
                P('- **%s:** %s' % (k, c[k]))
        if c.get('hides'):
            P('- **private (colour only, never state it, never hint at it directly):** %s' % c['hides'])
    sec = pov_section(speaker)
    if sec:
        P('')
        P('POV sheet extract (docs/pov_sheets.md):')
        P('')
        P('\n'.join('> ' + l for l in sec.splitlines()))
    P('')
    P('## Voice rules (checked automatically)')
    P('')
    P('- Max %s sentences per line; exclamation marks: %s.' % (voice.get('max_sentences', cfg['max_sentences']), 'none' if not voice.get('exclaim') else 'up to %s' % voice['exclaim']))
    for r in voice.get('would_never', []):
        P('- Would never say (pattern): `%s`' % r)
    for r in voice.get('never_words', []):
        P('- Never use: `%s`' % r)
    P('- Use contractions in anything over %s words.' % W.lint['contractions'].get('min_words', 16))
    P('')
    P('## What %s knows, and what is off limits' % speaker)
    P('')
    knows = [f for f, d in W.facts.items() if speaker in d['known_by'] or 'crew' in d['known_by'] and speaker in W.crew]
    P('Facts %s holds at the start (they may be mentioned, via `mentions`, but may not be REVEALED in banter): %s' % (speaker, ', '.join(sorted(knows)) or 'none'))
    P('')
    P('Facts %s does NOT hold (never mention, never hint): %s' % (speaker, ', '.join(sorted(f for f in W.facts if f not in knows)) or 'none'))
    P('')
    P('The player may be assumed to know only: %s. Any other fact needs the gate `knows.<fact>` in `needs`, and the speaker needs it too (known_by_at_start or a `told.<fact>.%s` gate).' % (', '.join(W.lint['baseline_player_knows']), speaker))
    P('')
    P('Gated words (the checker rejects them below the act shown, or from the wrong speaker):')
    for g in W.lint['gated_terms']:
        P('- `%s`: %s' % (g['term'], g.get('note', '')))
    P('')
    P('Banned phrases and exposition tells: ' + '; '.join('`%s`' % b if isinstance(b, str) else '`%s`' % b.get('pattern', b) for b in (W.lint.get('banned_phrases', []) + W.lint.get('exposition_tells', []))))
    P('')
    P('## State you may read in `needs`')
    P('')
    P('| name | type | values / range | meaning |')
    P('|---|---|---|---|')
    for name, v in sorted(W.vars.items()):
        vals = v.get('values') or ('%s..%s' % (v.get('min'), v.get('max')) if 'min' in v else '')
        P('| `%s` | %s | %s | %s |' % (name, v['type'], vals if not isinstance(vals, list) else ' / '.join(map(str, vals)), (v.get('doc') or v.get('desc') or W.lint['labels'].get(name, ''))[:90]))
    P('')
    P('Also: `knows.<fact>`, `told.<fact>.<speaker>`, `seen.<scene.id>`, `clue.<id>`.')
    P('')
    live = [s for _, s in L.load_storylets() if s['speaker'] == speaker and s.get('status', 'draft') != 'rejected']
    P('## Existing %s lines (do not repeat the idea, the opening words or the joke shape)' % speaker)
    P('')
    for s in live:
        txt = ' / '.join(t for _, w, t in L.line_texts(s) if w == speaker)[:160]
        P('- `%s`: %s' % (s['id'], txt))
    P('')
    negp = os.path.join(ROOT, 'data', 'narrative', 'review', 'negative_examples.json')
    neg = json.load(open(negp, encoding='utf-8')) if os.path.exists(negp) else []
    neg = [x for x in neg if x.get('speaker') == speaker]
    if neg:
        P('## Rejected in review (do not write these again)')
        P('')
        for x in neg:
            P('- %s Reason: %s' % (' / '.join(x.get('lines', []))[:200], x.get('reason') or 'no reason given'))
        P('')
    P('## Before you hand back')
    P('')
    P('- Ids are `%s.%s.%s.<slug>` and unique.' % (kind, speaker, station or 'any'))
    P('- Every `needs` name exists in state.json; every fact you mention is one the speaker holds.')
    P('- Nothing a first-week player should not know yet. If you want to say something the canon does not cover, write a question in `meta.question` instead of inventing the answer.')
    P('- Read each line aloud. If a different officer could say it, rewrite it.')
    return '\n'.join(out) + '\n'


def main(argv):
    def arg(name, default=None):
        return argv[argv.index(name) + 1] if name in argv else default
    speaker = arg('--speaker')
    if not speaker:
        print(__doc__)
        return 2
    W = L.World()
    if speaker not in W.speakers:
        print('unknown speaker %s (known: %s)' % (speaker, ', '.join(sorted(W.speakers))))
        return 2
    text = build(W, speaker, arg('--kind', 'banter'), arg('--station'), int(arg('--n', '8')), arg('--focus'))
    out = arg('--out')
    if out:
        open(out, 'w', encoding='utf-8').write(text)
        print('wrote %s (%d lines)' % (out, text.count('\n')))
    else:
        sys.stdout.write(text)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
