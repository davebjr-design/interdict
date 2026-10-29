"""One-shot: move data/decision_cards.json from the old cast (Pike etc.) to the crew bible cast and seats.
Run once; idempotent (re-running changes nothing once Pike is gone)."""
import json, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'decision_cards.json')
d = json.load(open(P))
if 'Pike' not in d['officers']: raise SystemExit('already recast')
cap = d['officers']['Captain']
d['officers'] = {
 # seat notes: temperament is a label, spread drives the check noise
 'Abara':     {'seat': 'tactical_nav', 'temperament': 'steady',  'spread': 2.0, 'likes': ['conscience', 'secrecy'], 'dislikes': ['loyalty'], 'ratings': {'engineering': 3, 'weapons': 4, 'sensors': 3, 'ai': 1}},
 'Dace':      {'seat': 'thermal',      'temperament': 'anxious', 'spread': 2.3, 'likes': ['caution', 'secrecy'],   'dislikes': ['speed'],   'ratings': {'engineering': 3, 'weapons': 1, 'sensors': 2, 'ai': 4}},
 'Castellan': {'seat': 'engineering',  'temperament': 'bold',    'spread': 2.6, 'likes': ['speed', 'loyalty'],     'dislikes': ['secrecy'], 'ratings': {'engineering': 5, 'weapons': 1, 'sensors': 2, 'ai': 2}},
 'Quill':     {'seat': 'sensors_ecm',  'temperament': 'exact',   'spread': 1.8, 'likes': ['caution', 'conscience'], 'dislikes': ['money'],  'ratings': {'engineering': 1, 'weapons': 2, 'sensors': 5, 'ai': 1}},
 'Fenwick':   {'seat': 'quartermaster','temperament': 'sunny',   'spread': 2.2, 'likes': ['money', 'conscience'],  'dislikes': ['caution'], 'ratings': {'engineering': 2, 'weapons': 1, 'sensors': 1, 'ai': 1}},
 'Captain':   cap,
}
# lever -> new proposer. Speed levers go to Castellan, money to Fenwick, caution/sensor-reading to Quill, thermal/AI-cautious to Dace.
M = {
 ('card8_heat_crisis','rush_fix'):'Castellan', ('card6_firing_solution','fire'):'Castellan', ('card6_firing_solution','ping'):'Castellan',
 ('card10_core','take'):'Fenwick', ('card1_briefing','salvage_run'):'Fenwick', ('card3_route','fast_burn'):'Castellan',
 ('card4_detection','ping'):'Castellan', ('card5_classification','go_active'):'Castellan', ('card7_waiting','vent_now'):'Castellan',
 ('card9_relay_tag','ignore_tag'):'Castellan', ('card11_confrontation','justify_pay'):'Fenwick', ('card12_patron_call','say_wanted'):'Fenwick',
 ('card1_briefing','duty_run'):'Castellan', ('card11_confrontation','explain'):'Castellan',
 ('card4_detection','passive'):'Quill', ('card5_classification','listen'):'Quill', ('card9_relay_tag','log_tag'):'Quill',
 ('card10_core','log_tag'):'Dace', ('card7_waiting','hold_silent'):'Dace',
}
left = []
for cid, c in d['cards'].items():
    for l in c['levers']:
        k = (cid, l['id'])
        if k in M: l['proposer'] = M[k]
        if l['proposer'] == 'Pike': left.append(k)
        if l.get('executor') == 'Pike': l['executor'] = 'Castellan'
assert not left, left
json.dump(d, open(P, 'w'), indent=1); print('recast ok')
