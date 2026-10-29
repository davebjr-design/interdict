"""Build docs/crew_reference_cards.pdf (US Letter, one page per character) from data/narrative/crew_cards.json
and the model stills in design/assets/stills/. Run: python3 -I tools/build_crew_cards.py"""
import json, base64, os, re, subprocess, html
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = json.load(open(os.path.join(R, 'data/narrative/crew_cards.json')))
CSS = '''@page{size:8.5in 11in;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"DejaVu Sans","Liberation Sans",Arial,sans-serif;color:#1c1f23}
.pg{width:8.5in;height:11in;padding:.42in .5in;page-break-after:always;position:relative;overflow:hidden;background:#fff}
.bar{height:.14in;border-radius:2px;margin-bottom:.14in}h1{margin:0;font-size:32pt;letter-spacing:.5px;line-height:1}.role{font-size:12pt;color:#444;margin-top:4px}
.top{display:flex;gap:.28in;margin-top:.14in}.fig{width:2.55in;min-width:2.55in;height:3.75in;border-radius:8px;background:#e9eaec;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.fig img{height:3.65in}.meta{flex:1;font-size:9.2pt;line-height:1.33}.meta div{margin-bottom:.065in}
.k{font-size:7.2pt;text-transform:uppercase;letter-spacing:.8px;color:#6b7078;display:block;margin-bottom:1px}
.line{margin-top:.13in;padding:.13in .2in;border-left:6px solid;font-size:13.5pt;font-style:italic;background:#f4f5f6;line-height:1.35}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.08in .3in;margin-top:.15in;font-size:9.2pt;line-height:1.33}
.new{font-size:7pt;font-weight:bold;letter-spacing:.5px;color:#a0522d;text-transform:uppercase}
.note{margin-top:.12in;font-size:8.3pt;color:#7a4b00;background:#fff4df;border-radius:4px;padding:.06in .1in}
.foot{position:absolute;left:.5in;right:.5in;bottom:.28in;font-size:7.2pt;color:#8a8f97;border-top:1px solid #ddd;padding-top:4px}
.pl{display:flex;align-items:center;justify-content:center;width:100%;height:100%;text-align:center;font-size:10pt;color:#555;padding:.2in}
.glow{width:2.1in;height:2.1in;border-radius:50%;background:radial-gradient(circle,#ffe2a0 0%,#f0a030 35%,rgba(240,160,48,0) 70%);margin:0 auto .2in}'''
def fmt(s):
    s = html.escape(s)
    return re.sub(r'(?i)\[(new[^\]]*|proposal)\]', lambda m: '<span class=new>%s</span>' % m.group(1), s)
def blk(label, val): return '<div><span class=k>%s</span>%s</div>' % (label, fmt(val)) if val else ''
out = ['<html><meta charset=utf-8><style>' + CSS + '</style><body>']
for c in D['cards']:
    col = c['accent']
    if c['still']:
        b64 = base64.b64encode(open(os.path.join(R, 'design/assets/stills/%s.png' % c['still']), 'rb').read()).decode()
        fig = '<img src="data:image/png;base64,%s">' % b64
    elif c['id'] == 'pell':
        fig = '<div class=pl><div><div class=glow></div>No body. A voice and an amber glow on the control-room pedestal.</div></div>'
    else:
        fig = '<div class=pl style="color:%s"><div><div style="font-size:54pt;line-height:1">&#9679;</div>No model yet.<br>Deep violet jacket,<br>silver streak in dark hair.</div></div>' % col
    out.append('<div class=pg><div class=bar style="background:%s"></div><h1 style="color:%s">%s</h1><div class=role>%s</div>' % (col, col, html.escape(c['name'].upper()), html.escape(c['role'])))
    out.append('<div class=top><div class=fig>%s</div><div class=meta>%s%s%s%s%s%s</div></div>' % (fig,
        blk('Background', c['background']), blk('Look', c['look']), blk('Clothes', c['clothes']), blk('Voice and manner', c['voice']),
        blk('Inspired by (temperament only)', c['inspired']), blk('AI camp', c['camp']) + ('<div class=note><b>Model vs profile:</b> %s</div>' % fmt(c['model_note']) if c.get('model_note') else '')))
    out.append('<div class=line style="border-color:%s">&ldquo;%s&rdquo;<span class=k style="margin-top:6px;font-style:normal">Reference line</span></div>' % (col, html.escape(c['line'])))
    out.append('<div class=grid>%s%s%s%s%s%s%s</div>' % (blk('Wants', c['wants']), blk('Hides', c['hides']), blk('Fear', c['fear']), blk('Hooks', c['hooks']),
        blk('Habits', c['habits']), blk(c.get('likes_label', 'Likes / dislikes'), c['likes']), '<div style="grid-column:1/-1">'+blk('Relationships', c['rel'])+'</div>'))
    out.append('<div class=foot>Interdict crew reference v2 &middot; all characters original; references are temperament profiles only, no likenesses or borrowed names &middot; <span class=new>new</span> = detail added to fit the reference &middot; 2026-10-29</div></div>')
out.append('</body></html>')
tmp = '/tmp/crew_cards.html'; open(tmp, 'w').write(''.join(out))
pdf = os.path.join(R, 'docs/crew_reference_cards.pdf')
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://%s');await p.pdf({path:'%s',format:'Letter',printBackground:true,margin:{top:0,bottom:0,left:0,right:0}});await b.close()})()" % (tmp, pdf)
subprocess.run(['node', '-e', js], check=True); print('wrote', pdf)
