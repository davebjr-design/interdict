#!/usr/bin/env python3
"""Generates the static console mockups for design/ui_v2 (no game code is touched).

Run:  python3 build_mocks.py            -> mock_1366.html, mock_1920.html, mock_target.html
      python3 shoot.py                  -> PNG screenshots next to them

Layout is a fixed stage of 160 x 90 "u" (1u = 12 px at 1920x1080, 8.5375 px at 1366x768).
Every widget is absolutely placed in u on a 6 x 4 grid (columns of 6u, rows of 4u), so a
background art plate can be authored at 1920x1080 and every slot lands on a known rectangle.
"""
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- palette (matches the shipped game)
AMBER, CYAN, RED, GREEN, VIOLET, ORANGE = '#ffb454', '#6fc3d0', '#ff6b5a', '#8fd694', '#b79cff', '#ff8a4c'
CH = {'H': ORANGE, 'R': CYAN, 'V': VIOLET}

CSS = r"""
:root{--u:12px;--bg:#05080a;--plate:#0e1513;--plate2:#121b18;--edge:#2b3c36;--edge2:#0a0f0d;--ink:#cfe3da;--dim:#6f877d;--faint:#3a4b45;
--amber:#ffb454;--cyan:#6fc3d0;--red:#ff6b5a;--green:#8fd694;--violet:#b79cff;--orange:#ff8a4c;
--lab:'Bahnschrift','Arial Narrow','Liberation Sans Narrow','DejaVu Sans Condensed',sans-serif;--mono:'DejaVu Sans Mono','IBM Plex Mono',ui-monospace,Menlo,monospace;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;background:#020405;color:var(--ink);font-family:var(--lab)}
body{min-height:100vh;display:grid;place-items:center;overflow:auto}
.stage{position:relative;width:calc(var(--u)*160);height:calc(var(--u)*90);background:
 radial-gradient(ellipse at 50% 30%,#0f1816 0%,#080d0c 70%),var(--bg);overflow:hidden;font-size:calc(var(--u)*1.3);letter-spacing:.04em;text-transform:uppercase}
/* --- zone plates (these are the slots a background art layer fills) --- */
.zone{position:absolute;left:calc(var(--x)*var(--u));top:calc(var(--y)*var(--u));width:calc(var(--w)*var(--u));height:calc(var(--h)*var(--u));
 background:linear-gradient(180deg,var(--plate2),var(--plate));border-radius:calc(var(--u)*.5);
 box-shadow:inset 0 0 0 calc(var(--u)*.14) var(--edge),inset 0 calc(var(--u)*.4) calc(var(--u)*1.2) rgba(0,0,0,.55),0 0 0 calc(var(--u)*.12) #000}
.zone::before,.zone::after{content:"";position:absolute;top:calc(var(--u)*.55);width:calc(var(--u)*.5);height:calc(var(--u)*.5);border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a5d56,#16201c);box-shadow:0 0 0 calc(var(--u)*.08) #000}
.zone::before{left:calc(var(--u)*.55)}.zone::after{right:calc(var(--u)*.55)}
.zt{position:absolute;left:calc(var(--u)*1.7);right:calc(var(--u)*1.7);top:calc(var(--u)*.35);height:calc(var(--u)*2.2);display:flex;align-items:center;gap:calc(var(--u)*.7);color:var(--dim);font-weight:700;letter-spacing:.16em;font-size:calc(var(--u)*1.2)}
.zt::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--edge),transparent)}
.zt em{font-style:normal;color:var(--faint);letter-spacing:.06em;font-weight:400}
/* --- widget slot --- */
.w{position:absolute;left:calc(var(--x)*var(--u));top:calc(var(--y)*var(--u));width:calc(var(--w)*var(--u));height:calc(var(--h)*var(--u));padding:calc(var(--u)*.3)}
.w>.f{position:relative;width:100%;height:100%;border-radius:calc(var(--u)*.35);background:linear-gradient(180deg,#0a100e,#0c1311);box-shadow:inset 0 0 0 1px #1c2a25,inset 0 2px 5px rgba(0,0,0,.7);overflow:hidden}
.lg{display:block;color:var(--dim);font-size:calc(var(--u)*1.15);line-height:1;white-space:nowrap}
.lamp .lg{letter-spacing:.02em;font-size:calc(var(--u)*1.1)}
/* S lamp */
.lamp .f{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*.35)}
.led{width:calc(var(--u)*1.7);height:calc(var(--u)*1.7);border-radius:50%;background:radial-gradient(circle at 35% 30%,#202b27,#080c0b);box-shadow:inset 0 0 0 1px #000,0 0 0 calc(var(--u)*.15) #1b2723}
.led.g{background:radial-gradient(circle at 35% 30%,#e4ffe6,#6fd27d 45%,#1f6a2c);box-shadow:0 0 calc(var(--u)*1.1) rgba(143,214,148,.85),0 0 0 calc(var(--u)*.15) #1b2723}
.led.a{background:radial-gradient(circle at 35% 30%,#fff1d4,#ffb454 45%,#8a4f0c);box-shadow:0 0 calc(var(--u)*1.1) rgba(255,180,84,.85),0 0 0 calc(var(--u)*.15) #1b2723}
.led.r{background:radial-gradient(circle at 35% 30%,#ffd9d3,#ff6b5a 45%,#8a1e12);box-shadow:0 0 calc(var(--u)*1.2) rgba(255,107,90,.9),0 0 0 calc(var(--u)*.15) #1b2723}
.led.c{background:radial-gradient(circle at 35% 30%,#dcf8ff,#6fc3d0 45%,#1b5a66);box-shadow:0 0 calc(var(--u)*1.1) rgba(111,195,208,.85),0 0 0 calc(var(--u)*.15) #1b2723}
.led.v{background:radial-gradient(circle at 35% 30%,#efe6ff,#b79cff 45%,#4a3590);box-shadow:0 0 calc(var(--u)*1.1) rgba(183,156,255,.85),0 0 0 calc(var(--u)*.15) #1b2723}
.led.o{background:radial-gradient(circle at 35% 30%,#ffe3d0,#ff8a4c 45%,#8a3a0c);box-shadow:0 0 calc(var(--u)*1.1) rgba(255,138,76,.85),0 0 0 calc(var(--u)*.15) #1b2723}
.led.dim{opacity:.35}.led.fl{animation:bl 0.9s steps(2,jump-none) infinite}@keyframes bl{50%{opacity:.25}}
.lamp.on .lg{color:var(--ink)}
/* K key */
.key .f{background:linear-gradient(180deg,#1b2622,#0f1613);box-shadow:inset 0 1px 0 #34463f,inset 0 -2px 0 #050807,0 0 0 1px #000;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:calc(var(--u)*.45)}
.key .kt{font-weight:700;letter-spacing:.08em;color:#8ea59b;font-size:calc(var(--u)*1.45);line-height:1;white-space:nowrap}
.key .ks{color:var(--faint);font-size:calc(var(--u)*1.05);line-height:1.1;margin-top:calc(var(--u)*.2);white-space:nowrap}
.key .kl{position:absolute;left:calc(var(--u)*.4);top:18%;bottom:18%;width:calc(var(--u)*.4);border-radius:2px;background:#0a0f0d}
.key.lit .kt{color:var(--kc,var(--amber));text-shadow:0 0 calc(var(--u)*.8) var(--kc,var(--amber))}
.key.lit .kl{background:var(--kc,var(--amber));box-shadow:0 0 calc(var(--u)*.9) var(--kc,var(--amber))}
.key.lit .f{background:linear-gradient(180deg,#22302a,#121b17)}
.key.av .kt{color:var(--kc)}.key.dis .kt{color:#33423c}.key.dis .ks{color:#27332e}
.key.rec .f{box-shadow:inset 0 0 0 calc(var(--u)*.2) var(--amber),0 0 calc(var(--u)*1.4) rgba(255,180,84,.55);animation:pulse 1.4s ease-in-out infinite}@keyframes pulse{50%{box-shadow:inset 0 0 0 calc(var(--u)*.2) #a8681f,0 0 0 rgba(255,180,84,0)}}
.key.guard .f{background:repeating-linear-gradient(135deg,#2a1610 0 calc(var(--u)*.8),#3b1d14 calc(var(--u)*.8) calc(var(--u)*1.6));box-shadow:inset 0 0 0 calc(var(--u)*.2) #7a2a1c}
.key.guard .kt{color:#d8806f}
.key.hv .f{box-shadow:inset 0 0 0 calc(var(--u)*.22) var(--cyan),0 0 calc(var(--u)*1.2) rgba(111,195,208,.6)}
/* T readout */
.ro .f{background:#050908;display:flex;flex-direction:column;justify-content:center;padding:0 calc(var(--u)*.7)}
.ro .lg{font-size:calc(var(--u)*1.1);margin-bottom:calc(var(--u)*.1)}
.ro .v{position:relative;font-family:var(--mono);font-weight:700;font-size:calc(var(--u)*2.3);line-height:1;color:var(--vc,var(--green));text-shadow:0 0 calc(var(--u)*.7) var(--vc,var(--green));letter-spacing:.02em;white-space:nowrap}
.ro .v u{text-decoration:none;position:absolute;left:0;top:0;color:rgba(255,255,255,.05);text-shadow:none;z-index:0}
.ro .v span{position:relative;z-index:1}
.ro .v small{font-size:.5em;color:var(--dim);text-shadow:none;margin-left:.3em}
/* M gauge + L dial hold an SVG */
.g .f svg,.l .f svg{position:absolute;inset:0;width:100%;height:100%}
svg text{font-family:var(--lab);text-transform:uppercase;letter-spacing:.06em}
svg .m{font-family:var(--mono);letter-spacing:0}
/* contact slips */
.slip .f{background:linear-gradient(180deg,#0f1714,#0b1210)}
.slip.sel .f{box-shadow:inset 0 0 0 calc(var(--u)*.22) var(--amber),0 0 calc(var(--u)*1) rgba(255,180,84,.35)}
.slip.lk .f{box-shadow:inset 0 0 0 calc(var(--u)*.22) var(--red)}
.slip.ally .f{box-shadow:inset 0 0 0 calc(var(--u)*.18) #2d6a38}
.slip.out .f{opacity:.55}
.slip .w .f{box-shadow:none;background:none}
.id .f{display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:700;font-size:calc(var(--u)*2.4);color:var(--amber);background:#060a09}
.st .f{display:flex;align-items:center;gap:calc(var(--u)*.6);padding:0 calc(var(--u)*.5);background:none}
.st b{font-size:calc(var(--u)*1.25);letter-spacing:.1em;white-space:nowrap}
.st .led{width:calc(var(--u)*1.3);height:calc(var(--u)*1.3);flex:none}
.cls .f{display:flex;align-items:center;justify-content:center;background:none}
.cls svg{width:80%;height:80%}
.od .f{background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.od b{font-family:var(--mono);font-size:calc(var(--u)*1.9);color:var(--ink)}.od .lg{font-size:calc(var(--u)*1)}
.ch .f{display:flex;align-items:center;gap:calc(var(--u)*.4);padding:0 calc(var(--u)*.4);background:none}
.ch b{flex:none;width:calc(var(--u)*1.8);height:calc(var(--u)*1.8);border-radius:3px;display:grid;place-items:center;font-size:calc(var(--u)*1.2);color:#04100d;background:var(--cc)}
.ch .bar{position:relative;flex:1;height:calc(var(--u)*1.5);background:#050807;border-radius:2px;box-shadow:inset 0 0 0 1px #1d2b26}
.ch .bar i{position:absolute;left:0;top:0;bottom:calc(var(--u)*.45);background:var(--cc);border-radius:2px 0 0 0;opacity:.85}
.ch .bar u{position:absolute;left:0;bottom:0;height:calc(var(--u)*.35);background:#cfe3da;text-decoration:none}
.ch .bar s{position:absolute;right:0;top:0;bottom:0;border-right:2px solid #1f6a2c}
.ch.done .bar u{background:var(--green)}
.ch .n{flex:none;width:calc(var(--u)*2.1);font-family:var(--mono);font-size:calc(var(--u)*1.3);text-align:right;color:var(--ink)}
.ch.off .bar{background:repeating-linear-gradient(135deg,#0a100e 0 4px,#141d1a 4px 8px)}
.ch.off .n{color:var(--faint)}
.ch.on .n{color:var(--green)}
.ch.hold::after{content:"";position:absolute;inset:calc(var(--u)*.2);border:1px dashed var(--cyan);border-radius:3px}
.micro .f{display:flex;gap:calc(var(--u)*.3);align-items:center;padding:0 calc(var(--u)*.2);background:none}
.micro i{flex:1;height:calc(var(--u)*1.4);background:#050807;border-radius:2px;position:relative;box-shadow:inset 0 0 0 1px #1d2b26}
.micro i b{position:absolute;left:0;top:0;bottom:0;background:var(--cc);opacity:.85;border-radius:2px}
.micro i.off{background:repeating-linear-gradient(135deg,#0a100e 0 3px,#141d1a 3px 6px)}
.rng .f{display:flex;align-items:center;justify-content:flex-end;padding-right:calc(var(--u)*.6);font-family:var(--mono);font-size:calc(var(--u)*1.3);color:var(--dim);background:none}
/* beacon */
.beacon .f{background:#0b0805;display:flex;align-items:center;gap:calc(var(--u)*.9);padding:0 calc(var(--u)*1);box-shadow:inset 0 0 0 1px #4a3210}
.beacon b{color:var(--amber);letter-spacing:.14em;font-size:calc(var(--u)*1.25)}
.beacon span{color:var(--ink);font-size:calc(var(--u)*1.35);white-space:nowrap}
.beacon span em{font-style:normal;color:var(--amber);font-weight:700}
/* log */
.log .f{background:#050908;padding:calc(var(--u)*.5) calc(var(--u)*.8);font-family:var(--mono);text-transform:none;letter-spacing:0;font-size:calc(var(--u)*1.2);line-height:1.5;color:var(--dim);display:flex;flex-direction:column;justify-content:flex-end}
.log div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.log div b{color:var(--ink);font-weight:400}.log .u b{color:var(--amber)}
.plate .f{background:none;box-shadow:none;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--faint);font-size:calc(var(--u)*1.05);line-height:1.2;letter-spacing:.1em}
.tip{position:absolute;z-index:9;background:#10201c;border:calc(var(--u)*.2) solid var(--cyan);border-radius:calc(var(--u)*.5);padding:calc(var(--u)*.6) calc(var(--u)*1);font-size:calc(var(--u)*1.25);line-height:1.5;box-shadow:0 0 calc(var(--u)*2) #000;text-transform:none;letter-spacing:.02em}
.tip b{color:var(--cyan)}.tip em{font-style:normal;color:var(--amber);font-family:var(--mono)}
/* slot overlay (checkbox, no JS) */
#slots{position:fixed;right:8px;bottom:8px;z-index:99;accent-color:#6fc3d0}
#slotl{position:fixed;right:30px;bottom:6px;z-index:99;font:12px var(--lab);color:#6f877d;text-transform:none}
#slots:checked~.stage .w>.f{outline:1px solid rgba(111,195,208,.55)}
#slots:checked~.stage .w::after{content:attr(data-size);position:absolute;left:2px;bottom:1px;font:calc(var(--u)*.95) var(--mono);color:#6fc3d0;background:rgba(0,0,0,.7);padding:0 2px;z-index:5;text-transform:none;letter-spacing:0}
#slots:checked~.stage .zone{outline:1px dashed rgba(255,180,84,.7)}
#slots:checked~.stage .zone .zt::before{content:attr(data-z);color:var(--amber);font-family:var(--mono);letter-spacing:0;font-weight:400}
#slots:checked~.stage .sub::after{display:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""

# ---------------------------------------------------------------- tiny HTML helpers
def W(kind, x, y, w, h, inner, cls='', tag=None):
    tag = tag or f'{kind.upper()} {w}x{h}u'
    return (f'<div class="w {kind} {cls}" data-size="{tag}" style="--x:{x};--y:{y};--w:{w};--h:{h}">'
            f'<div class="f">{inner}</div></div>')

def Wraw(kind, x, y, w, h, inner, cls='', tag=None, style=''):
    tag = tag or f'{kind.upper()} {w}x{h}u'
    return (f'<div class="w {kind} {cls}" data-size="{tag}" style="--x:{x};--y:{y};--w:{w};--h:{h};{style}">{inner}</div>')

def Z(name, x, y, w, h, title, body, sub=''):
    t = f'<div class="zt" data-z="{name} {w}x{h}u">{title}<em>{sub}</em></div>' if title else ''
    return f'<div class="zone" style="--x:{x};--y:{y};--w:{w};--h:{h}">{t}{body}</div>'

def lamp(x, y, label, color=None, on=False, fl=False, dim=False, w=6, h=4, tag=None):
    c = f'{color} ' if color else ''
    d = ' dim' if dim else ''
    f = ' fl' if fl else ''
    return W('lamp', x, y, w, h, f'<i class="led {c if on else ""}{d}{f}"></i><span class="lg">{label}</span>', 'on' if on else '', tag or f'S {w}x{h}u')

def key(x, y, w, h, title, sub='', state='', color=None, tag=None):
    st = f' style="--kc:{color}"' if color else ''
    return (f'<div class="w key {state}" data-size="{tag or ("K %dx%du" % (w, h))}" style="--x:{x};--y:{y};--w:{w};--h:{h}">'
            f'<div class="f"{st}><i class="kl"></i><span class="kt"' + (' style="font-size:calc(var(--u)*1.15);letter-spacing:.02em"' if len(title.replace('&middot;','.').replace('&frac12;','x').replace('&times;','x').replace('&#9656;','>')) > 9 else '') + f'>{title}</span>' + (f'<span class="ks">{sub}</span>' if sub else '') + '</div></div>')

def ro(x, y, label, value, color=GREEN, ghost='88:88', w=12, h=4, unit=''):
    u = f'<small>{unit}</small>' if unit else ''
    return W('ro', x, y, w, h, f'<span class="lg">{label}</span><div class="v" style="--vc:{color}"><u>{ghost}</u><span>{value}</span>{u}</div>', '', f'T {w}x{h}u')

# ---------------------------------------------------------------- SVG dial toolkit (viewBox = 10 units per u)
def pol(cx, cy, r, a):
    rad = math.radians(a - 90)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)

def arc(cx, cy, r, a0, a1):
    x0, y0 = pol(cx, cy, r, a0); x1, y1 = pol(cx, cy, r, a1)
    return f'M{x0:.1f} {y0:.1f}A{r} {r} 0 {1 if abs(a1-a0) > 180 else 0} {1 if a1 > a0 else 0} {x1:.1f} {y1:.1f}'

def dial_svg(vang, zones, ticks, readout, label, unit='', ghost=None, rcol=AMBER, sub='', cx=120, cy=82, r=42, vb=(240, 160)):
    s = [f'<svg viewBox="0 0 {vb[0]} {vb[1]}" preserveAspectRatio="xMidYMid meet">']
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r+28}" fill="#0b1210" stroke="#22322d" stroke-width="3"/>')
    for a0, a1, col in zones:
        s.append(f'<path d="{arc(cx, cy, r, a0, a1)}" stroke="{col}" stroke-width="7" fill="none" opacity=".85"/>')
    for a, lab, major in ticks:
        x0, y0 = pol(cx, cy, r + 5, a); x1, y1 = pol(cx, cy, r + (11 if major else 8), a)
        s.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="#7d948a" stroke-width="{2 if major else 1}"/>')
        if lab:
            tx, ty = pol(cx, cy, r + 19, a)
            s.append(f'<text x="{tx:.1f}" y="{ty+3.5:.1f}" text-anchor="middle" font-size="10" fill="#8fa89d">{lab}</text>')
    if ghost is not None:
        gx, gy = pol(cx, cy, r + 4, ghost)
        s.append(f'<line x1="{cx}" y1="{cy}" x2="{gx:.1f}" y2="{gy:.1f}" stroke="{CYAN}" stroke-width="3" stroke-dasharray="5 4"/>')
    nx, ny = pol(cx, cy, r + 4, vang)
    s.append(f'<line x1="{cx}" y1="{cy}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="{AMBER}" stroke-width="4" stroke-linecap="round"/>')
    s.append(f'<circle cx="{cx}" cy="{cy}" r="6" fill="#1b2622" stroke="#4a5d56" stroke-width="2"/>')
    s.append(f'<rect x="{cx-30}" y="{cy+16}" width="60" height="24" rx="3" fill="#050908" stroke="#22322d"/>')
    s.append(f'<text class="m" x="{cx}" y="{cy+34}" text-anchor="middle" font-size="16" font-weight="700" fill="{rcol}">{readout}</text>')
    if unit:
        s.append(f'<text x="{cx}" y="{cy+53}" text-anchor="middle" font-size="9" fill="#566b62">{unit}</text>')
    s.append(f'<text x="10" y="18" font-size="12" font-weight="700" fill="#9db4a9">{label}</text>')
    if sub:
        s.append(f'<text x="{vb[0]-10}" y="18" text-anchor="end" font-size="9" fill="#566b62">{sub}</text>')
    s.append('</svg>')
    return ''.join(s)

def lin_dial(vmin, vmax, val, tick_vals, label, unit, fmt, zones_frac=None, ghost=None, rcol=AMBER, sub=''):
    a = lambda v: -120 + 240 * (v - vmin) / (vmax - vmin)
    zones = [(a(vmin) if f0 is None else a(f0), a(vmax) if f1 is None else a(f1), c) for f0, f1, c in (zones_frac or [(None, None, '#2b6b66')])]
    ticks = [(a(t), fmt(t), True) for t in tick_vals]
    return dial_svg(a(val), zones, ticks, fmt(val), label, unit, None if ghost is None else a(ghost), rcol, sub)

def compass_svg(hdg=90, bug=118, label='HEADING'):
    cx, cy, r = 120, 82, 54
    s = ['<svg viewBox="0 0 240 160">', f'<circle cx="{cx}" cy="{cy}" r="{r+10}" fill="#0b1210" stroke="#22322d" stroke-width="3"/>']
    for a in range(0, 360, 10):
        major = a % 30 == 0
        x0, y0 = pol(cx, cy, r - (9 if major else 5), a); x1, y1 = pol(cx, cy, r, a)
        s.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="#7d948a" stroke-width="{2 if major else 1}"/>')
    for a, t in ((0, 'N'), (90, 'E'), (180, 'S'), (270, 'W')):
        x, y = pol(cx, cy, r - 19, a)
        s.append(f'<text x="{x:.1f}" y="{y+4:.1f}" text-anchor="middle" font-size="12" font-weight="700" fill="{RED if t == "N" else "#9db4a9"}">{t}</text>')
    bx, by = pol(cx, cy, r + 2, bug)
    s.append(f'<polygon points="{bx:.1f},{by:.1f} {pol(cx,cy,r+11,bug-5)[0]:.1f},{pol(cx,cy,r+11,bug-5)[1]:.1f} {pol(cx,cy,r+11,bug+5)[0]:.1f},{pol(cx,cy,r+11,bug+5)[1]:.1f}" fill="{CYAN}"/>')
    s.append(f'<g transform="rotate({hdg} {cx} {cy})"><polygon points="{cx},{cy-30} {cx+11},{cy+14} {cx},{cy+7} {cx-11},{cy+14}" fill="{AMBER}"/></g>')
    s.append(f'<rect x="{cx-26}" y="{cy+22}" width="52" height="20" rx="3" fill="#050908" stroke="#22322d"/><text class="m" x="{cx}" y="{cy+37}" text-anchor="middle" font-size="15" font-weight="700" fill="{AMBER}">{hdg:03d}</text>')
    s.append(f'<text x="10" y="18" font-size="12" font-weight="700" fill="#9db4a9">{label}</text><text x="230" y="18" text-anchor="end" font-size="9" fill="#566b62">BUG = NEXT WAYPOINT</text></svg>')
    return ''.join(s)

def heat_rate_dial(rate=15, ghost=None):
    """Log-ish scale: left = draining (vent), right = filling. Needle position = sign*log1p(|x|)/log1p(250)."""
    def ang(v): return 120 * math.copysign(math.log1p(abs(v)) / math.log1p(250), v) if v else 0
    zones = [(-120, -2, '#2c6f66'), (2, ang(40), '#7c6a2a'), (ang(40), ang(100), '#a8681f'), (ang(100), 120, '#a1362a')]
    ticks = [(-120, '', True), (ang(-30), '', False), (0, '0', True), (ang(15), '15', True), (ang(40), '', False), (ang(80), '80', True), (120, '', True)]
    sign = '+' if rate >= 0 else ''
    svg = dial_svg(ang(rate), zones, ticks, f'{sign}{rate}', 'HEAT RATE', '% of sink per minute', None if ghost is None else ang(ghost), AMBER, 'LOG SCALE')
    return svg.replace('</svg>', '<text x="10" y="150" font-size="10" font-weight="700" fill="#2c8f9c">&#9664; VENT</text><text x="230" y="150" text-anchor="end" font-size="10" font-weight="700" fill="#d8806f">REDLINE &#9654;</text></svg>')

def tank_svg(pct=27, ghost=None):
    h = 240; y0 = 52
    def Y(p): return y0 + h * (1 - p / 100)
    s = ['<svg viewBox="0 0 120 320">']
    s.append(f'<text x="12" y="18" font-size="13" font-weight="700" fill="#9db4a9">HEAT SINK</text>')
    s.append(f'<text class="m" x="12" y="40" font-size="22" font-weight="700" fill="{AMBER}">{pct}%</text>')
    s.append(f'<rect x="14" y="{y0-6}" width="40" height="{h+12}" rx="10" fill="#050908" stroke="#2b3c36" stroke-width="3"/>')
    s.append('<defs><linearGradient id="hg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2c8f9c"/><stop offset=".6" stop-color="#d79a3a"/><stop offset="1" stop-color="#ff6b5a"/></linearGradient><clipPath id="tc"><rect x="18" y="%s" width="32" height="%s" rx="6"/></clipPath></defs>' % (y0 - 2, h + 4))
    if ghost is not None:
        s.append(f'<g clip-path="url(#tc)"><rect x="18" y="{Y(ghost):.1f}" width="32" height="{h*ghost/100:.1f}" fill="{CYAN}" opacity=".35"/></g><line x1="14" y1="{Y(ghost):.1f}" x2="54" y2="{Y(ghost):.1f}" stroke="{CYAN}" stroke-width="3" stroke-dasharray="4 3"/><text class="m" x="66" y="{Y(ghost)+4:.1f}" font-size="11" fill="{CYAN}">+1M {ghost}</text>')
    s.append(f'<g clip-path="url(#tc)"><rect x="18" y="{Y(pct):.1f}" width="32" height="{h*pct/100+4:.1f}" fill="url(#hg)" opacity=".92"/><rect x="18" y="{Y(pct):.1f}" width="32" height="3" fill="#fff" opacity=".5"/></g>')
    for p, col, lab in [(60, '#d79a3a', '60'), (80, '#ff8a4c', '80'), (95, RED, '95')]:
        yy = Y(p)
        s.append(f'<line x1="10" y1="{yy:.1f}" x2="62" y2="{yy:.1f}" stroke="{col}" stroke-width="2"/><text class="m" x="66" y="{yy+4:.1f}" font-size="11" fill="{col}">{lab}</text>')
    for p in (0, 25, 50, 75, 100):
        yy = Y(p); s.append(f'<line x1="54" y1="{yy:.1f}" x2="60" y2="{yy:.1f}" stroke="#566b62"/>')
    s.append(f'<text x="66" y="{Y(0)+4:.1f}" font-size="11" fill="#8fa89d">0</text>')
    s.append(f'<text x="74" y="{Y(25)+4:.1f}" font-size="10" fill="#2c8f9c">SAFE</text>')
    s.append('</svg>')
    return ''.join(s)

def trend_svg(ghost=False):
    x0, x1, y0, y1 = 16, 228, 30, 138
    def X(m): return x0 + (x1 - x0) * (m + 5) / 10          # -5..+5 minutes, now in the middle
    def Y(p): return y1 - (y1 - y0) * p / 100
    hist = [(-5, 9), (-4.2, 10), (-3.4, 12), (-2.6, 12.5), (-1.8, 15), (-1, 19), (-0.4, 24), (0, 27)]
    s = ['<svg viewBox="0 0 240 160">', '<text x="14" y="16" font-size="13" font-weight="700" fill="#9db4a9">SINK TREND</text>',
         '<text x="226" y="16" text-anchor="end" font-size="10" fill="#566b62">-5M . NOW . +5M</text>']
    for p in (25, 50, 75, 100):
        s.append(f'<line x1="{x0}" y1="{Y(p):.1f}" x2="{x1}" y2="{Y(p):.1f}" stroke="#1d2b26"/>')
    for p, col in ((60, '#6a5522'), (80, '#7a3d1a'), (95, '#7a2a1c')):
        s.append(f'<line x1="{x0}" y1="{Y(p):.1f}" x2="{x1}" y2="{Y(p):.1f}" stroke="{col}" stroke-dasharray="3 3"/>')
    s.append(f'<line x1="{X(0)}" y1="{y0}" x2="{X(0)}" y2="{y1}" stroke="#cfe3da" stroke-width="1.5"/>')
    pts = ' '.join(f'{X(m):.1f},{Y(p):.1f}' for m, p in hist)
    s.append(f'<polyline points="{pts}" fill="none" stroke="{AMBER}" stroke-width="3"/>')
    s.append(f'<polygon points="{X(-5):.1f},{y1} {pts} {X(0):.1f},{y1}" fill="{AMBER}" opacity=".12"/>')
    full_m = 5.0
    s.append(f'<line x1="{X(0)}" y1="{Y(27)}" x2="{X(full_m):.1f}" y2="{Y(100):.1f}" stroke="{AMBER}" stroke-width="2.5" stroke-dasharray="6 4"/>')
    if ghost:
        s.append(f'<line x1="{X(0)}" y1="{Y(27)}" x2="{X(1.74):.1f}" y2="{Y(100):.1f}" stroke="{CYAN}" stroke-width="2.5" stroke-dasharray="6 4"/>')
        s.append(f'<text class="m" x="{X(1.74)-5:.1f}" y="{Y(100)+4:.1f}" text-anchor="end" font-size="11" fill="{CYAN}">1:44</text>')
    s.append(f'<circle cx="{X(full_m):.1f}" cy="{Y(100):.1f}" r="4" fill="{RED}"/><text class="m" x="{X(full_m)-6:.1f}" y="{Y(100)+14:.1f}" text-anchor="end" font-size="11" fill="{RED}">5:01</text>')
    s.append('</svg>')
    return ''.join(s)

def band_gauge(label, val, w=24, h=8, zones=(('COLD', 30, '#1d4f55'), ('WARM', 30, '#6a5522'), ('HOT', 40, '#7a2a1c')), numtxt=None, sub=''):
    VW, VH = w * 10, h * 10
    s = [f'<svg viewBox="0 0 {VW} {VH}">', f'<text x="10" y="18" font-size="13" font-weight="700" fill="#9db4a9">{label}</text>']
    if sub:
        s.append(f'<text x="{VW-10}" y="18" text-anchor="end" font-size="10" fill="#566b62">{sub}</text>')
    bx, bw, by, bh = 10, VW - 20, 36, 18
    x = bx
    for name, pct, col in zones:
        ww = bw * pct / 100
        s.append(f'<rect x="{x:.1f}" y="{by}" width="{ww:.1f}" height="{bh}" fill="{col}"/><text x="{x+ww/2:.1f}" y="{by+bh+14}" text-anchor="middle" font-size="10" fill="#566b62">{name}</text>')
        x += ww
    mx = bx + bw * val / 100
    s.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="none" stroke="#2b3c36" stroke-width="2"/>')
    s.append(f'<polygon points="{mx-7:.1f},{by-6} {mx+7:.1f},{by-6} {mx:.1f},{by+4}" fill="{AMBER}"/><line x1="{mx:.1f}" y1="{by}" x2="{mx:.1f}" y2="{by+bh}" stroke="{AMBER}" stroke-width="3"/>')
    s.append(f'<text class="m" x="{VW-10}" y="20" text-anchor="end" font-size="19" font-weight="700" fill="{AMBER}">{numtxt or str(val)+"%"}</text>')
    s.append('</svg>')
    return ''.join(s)

def seg_gauge(label, frac, color, txt, w=12, h=8, marks=(), segs=10, sub=''):
    VW, VH = w * 10, h * 10
    s = [f'<svg viewBox="0 0 {VW} {VH}">', f'<text x="8" y="18" font-size="13" font-weight="700" fill="#9db4a9">{label}</text>']
    if sub:
        s.append(f'<text x="{VW-8}" y="18" text-anchor="end" font-size="10" fill="#566b62">{sub}</text>')
    bx, bw, by, bh = 8, VW - 16, 28, VH - 52
    sw = bw / segs
    for i in range(segs):
        on = (i + 1) / segs <= frac + 1e-6
        s.append(f'<rect x="{bx+i*sw+1:.1f}" y="{by}" width="{sw-2:.1f}" height="{bh}" fill="{color if on else "#101917"}" opacity="{.95 if on else 1}" stroke="#22322d"/>')
    for m in marks:
        s.append(f'<line x1="{bx+bw*m:.1f}" y1="{by-3}" x2="{bx+bw*m:.1f}" y2="{by+bh+3}" stroke="#cfe3da" stroke-width="2"/>')
    s.append(f'<text class="m" x="{VW/2}" y="{VH-8}" text-anchor="middle" font-size="17" font-weight="700" fill="{color}">{txt}</text>')
    s.append('</svg>')
    return ''.join(s)

def glyph(kind, col='#8fa89d'):
    if kind == 'ship':
        return f'<svg viewBox="0 0 40 40"><polygon points="8,31 20,7 32,31 20,25" fill="{col}"/></svg>'
    if kind == 'decoy':
        return f'<svg viewBox="0 0 40 40"><polygon points="20,6 34,20 20,34 6,20" fill="none" stroke="{col}" stroke-width="3.5"/><circle cx="20" cy="20" r="2.5" fill="{col}"/></svg>'
    if kind == 'static':
        return f'<svg viewBox="0 0 40 40" fill="{col}"><circle cx="11" cy="24" r="3"/><circle cx="21" cy="13" r="3"/><circle cx="29" cy="27" r="3"/><circle cx="20" cy="30" r="2"/></svg>'
    if kind == 'ally':
        return f'<svg viewBox="0 0 40 40"><polygon points="20,6 34,20 20,34 6,20" fill="{GREEN}"/></svg>'
    return f'<svg viewBox="0 0 40 40"><text x="20" y="29" text-anchor="middle" font-size="26" font-weight="700" fill="{col}" font-family="monospace">?</text></svg>'

# ---------------------------------------------------------------- contact slips (36 wide; Full 36x8, Compact 36x4)
def channel(x, y, ch, name, sig, prog, state='', num=None, w=12, h=4):
    done = prog >= 100
    cls = ('done ' if done else '') + state
    shown = '--' if 'off' in state else (num if num is not None else sig)
    n = '&#10003;' if (done and 'off' not in state) else shown
    bar = f'<div class="bar"><i style="width:{sig}%"></i><u style="width:{prog}%"></u><s></s></div>'
    return Wraw('ch sub', x, y, w, h, f'<div class="f"><b>{ch}</b>{bar}<span class="n">{n}</span></div>', cls, f'ch {w}x{h}u', f'--cc:{CH[ch]}')

def slip_full(y, n, state, scol, klass, odds, rng, chans, cls='', fl=False):
    inner = ''
    inner += W('id sub', 0, 0, 4, 4, str(n), '', 'id 4x4u')
    inner += W('st sub', 4, 0, 14, 4, f'<i class="led {scol}{" fl" if fl else ""}"></i><b style="color:{ {"g":GREEN,"a":AMBER,"r":RED,"c":CYAN,"o":ORANGE,"":"#6f877d"}[scol] }">{state}</b>', '', 'st 14x4u')
    inner += W('cls sub', 18, 0, 4, 4, glyph(klass), '', 'cls 4x4u')
    inner += W('od sub', 22, 0, 6, 4, f'<b>{odds}</b><span class="lg">ODDS</span>', '', 'od 6x4u')
    inner += W('rng sub', 28, 0, 8, 4, f'{rng}<small style="font-size:.7em;margin-left:.2em">km</small>', '', 'rng 8x4u')
    for i, c in enumerate(chans):
        inner += channel(i * 12, 4, *c)
    return Wraw('slip', 0, y, 36, 8, f'<div class="f"></div>{inner}', cls, 'P 36x8u')

def slip_compact(y, n, scol, klass, rng, bars, cls='', fl=False, word=''):
    inner = W('id sub', 0, 0, 4, 4, str(n), '', 'id 4x4u')
    inner += W('st sub', 4, 0, 5, 4, f'<i class="led {scol}{" fl" if fl else ""}"></i>', '', 'S 5x4u')
    inner += W('cls sub', 9, 0, 4, 4, glyph(klass), '', 'cls 4x4u')
    mi = ''.join(f'<i class="{"off" if o else ""}" style="--cc:{CH[c]}"><b style="width:{v}%"></b></i>' for c, v, o in bars)
    inner += W('micro sub', 13, 0, 14, 4, mi, '', 'micro 14x4u')
    inner += W('rng sub', 27, 0, 9, 4, (f'<span style="color:{ORANGE};margin-right:.6em">{word}</span>' if word else '') + f'{rng}', '', 'rng 9x4u')
    return Wraw('slip', 0, y, 36, 4, f'<div class="f"></div>{inner}', cls, 'P 36x4u')

# ---------------------------------------------------------------- scope (XL 50x50u viewport)
def scope_svg():
    S = ['<svg viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">',
         '<defs><radialGradient id="sg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2c8" stop-opacity=".95"/><stop offset=".18" stop-color="#ffcf7a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="bk" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb454" stop-opacity=".16"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="pl" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#6a4a2a"/><stop offset="1" stop-color="#1c120a"/></radialGradient>'
         '<linearGradient id="rt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6fc3d0"/><stop offset="1" stop-color="#ffb454"/></linearGradient></defs>',
         '<rect width="500" height="500" fill="#04090a"/>']
    # backlit zone (where the Visual channel works)
    S.append('<circle cx="405" cy="95" r="150" fill="url(#bk)"/><circle cx="405" cy="95" r="118" fill="none" stroke="#ffb454" stroke-opacity=".35" stroke-dasharray="4 6"/>')
    S.append('<circle cx="405" cy="95" r="52" fill="url(#sg)"/><circle cx="405" cy="95" r="9" fill="#fff7dc"/>')
    S.append('<text x="405" y="238" text-anchor="middle" font-size="11" fill="#b8883f" opacity=".85">BACKLIT: VISUAL WORKS</text>')
    # planet
    S.append('<circle cx="86" cy="404" r="48" fill="url(#pl)" stroke="#3a2a1a"/><circle cx="86" cy="404" r="62" fill="none" stroke="#8a6a3a" stroke-opacity=".4" stroke-dasharray="3 5"/>')
    # grid and rings
    for r in (95, 190, 285):
        S.append(f'<circle cx="250" cy="250" r="{r}" fill="none" stroke="#1e3a36" stroke-width="2"/>')
    S.append('<text x="250" y="150" text-anchor="middle" font-size="11" fill="#3f6a63">20 km</text><text x="250" y="55" text-anchor="middle" font-size="11" fill="#3f6a63">40 km</text>')
    S.append('<line x1="250" y1="0" x2="250" y2="500" stroke="#173028"/><line x1="0" y1="250" x2="500" y2="250" stroke="#173028"/>')
    for a in range(0, 360, 30):
        x0, y0 = pol(250, 250, 238, a); x1, y1 = pol(250, 250, 250, a)
        S.append(f'<line x1="{x0:.0f}" y1="{y0:.0f}" x2="{x1:.0f}" y2="{y1:.0f}" stroke="#3f6a63" stroke-width="2"/>')
    # fan (afterlight wedge) for contact 3 (decision needed) and last-known of 4
    S.append('<circle cx="150" cy="118" r="58" fill="#ff8a4c" opacity=".09"/><circle cx="150" cy="118" r="58" fill="none" stroke="#ff8a4c" stroke-opacity=".35" stroke-dasharray="2 5"/>')
    # analyst pointing lines
    S.append('<line x1="250" y1="250" x2="338" y2="342" stroke="#6fc3d0" stroke-opacity=".5" stroke-dasharray="2 5"/>')
    # route legs (cyan -> amber -> red by drive setting)
    S.append('<polyline points="250,250 330,250" stroke="#6fc3d0" stroke-width="4" fill="none"/><polyline points="330,250 392,318" stroke="#ffb454" stroke-width="4" fill="none" stroke-dasharray="10 5"/><polyline points="392,318 430,400" stroke="#ff6b5a" stroke-width="4" fill="none" stroke-dasharray="10 5"/>')
    for (x, y, t) in ((330, 250, '60%'), (392, 318, '100%'), (430, 400, 'RED')):
        S.append(f'<rect x="{x-6}" y="{y-6}" width="12" height="12" fill="#04090a" stroke="#cfe3da" stroke-width="2"/><text x="{x+10}" y="{y+4}" font-size="11" fill="#cfe3da">{t}</text>')
    # own ship
    S.append('<circle cx="250" cy="250" r="38" fill="none" stroke="#ffb454" stroke-width="3" opacity=".9"/><polygon points="236,262 262,250 236,238 242,250" fill="#6fc3d0"/>'
             '<text x="250" y="304" text-anchor="middle" font-size="12" fill="#6fc3d0">YOU</text>')
    # contacts
    def num(x, y, n, col='#cfe3da'):
        return f'<text x="{x}" y="{y}" font-size="15" font-weight="700" fill="{col}" class="m">{n}</text>'
    # 1 locked (LIVE bracket, solid) with velocity
    S.append('<g stroke="#ff6b5a" stroke-width="3" fill="none"><path d="M330 120v-14h14M368 106h14v14M382 144v14h-14M344 158h-14v-14"/></g><polygon points="348,146 356,124 364,146 356,141" fill="#ff6b5a"/><line x1="356" y1="132" x2="396" y2="112" stroke="#ff6b5a" stroke-dasharray="3 4"/>'
             + num(372, 104, '1', '#ff6b5a') + '<text x="342" y="176" font-size="11" fill="#ff6b5a">LIVE</text>')
    # 3 decision needed (dot, dashed bracket, pulse ring)
    S.append('<circle cx="150" cy="118" r="20" fill="none" stroke="#ffb454" stroke-width="3"/><circle cx="150" cy="118" r="31" fill="none" stroke="#ffb454" stroke-opacity=".4" stroke-dasharray="4 5"/><circle cx="150" cy="118" r="5" fill="#cfe3da"/>' + num(176, 112, '3', '#ffb454') + '<text x="112" y="164" font-size="11" fill="#ffb454">DECISION</text>')
    # 4 unresolved
    S.append('<circle cx="338" cy="342" r="14" fill="none" stroke="#6f877d" stroke-dasharray="3 3"/><circle cx="338" cy="342" r="4" fill="#8fa89d"/>' + num(356, 338, '4?', '#8fa89d'))
    # 5 not read yet (faint)
    S.append('<circle cx="200" cy="440" r="3" fill="#566b62"/>' + num(210, 444, '5', '#566b62'))
    # 6 ruled out
    S.append('<g stroke="#46574f" stroke-width="2"><line x1="40" y1="250" x2="54" y2="264"/><line x1="54" y1="250" x2="40" y2="264"/></g>' + num(62, 262, '6', '#46574f'))
    # 7 venting (thermal blaze)
    S.append('<circle cx="72" cy="150" r="30" fill="#ff8a4c" opacity=".25"/><circle cx="72" cy="150" r="14" fill="#ff8a4c" opacity=".55"/><circle cx="72" cy="150" r="5" fill="#fff0dc"/>' + num(92, 146, '7', '#ff8a4c') + '<text x="40" y="196" font-size="11" fill="#ff8a4c">VENTING</text>')
    # 2 friendly
    S.append('<polygon points="440,296 452,308 440,320 428,308" fill="#8fd694"/>' + num(458, 306, '2', '#8fd694'))
    S.append('</svg>')
    return ''.join(S)

# ---------------------------------------------------------------- shared shell: rail + R column (identical in every view)
def rail(view='tac', hov=False):
    b = ''
    b += ro(1, 2, 'MISSION', '02:18', GREEN, '88:88', 14, 5)
    b += key(15.5, 2, 10, 5, 'PAUSE', 'P', '', None, 'K 10x5u')
    for i, (t, on) in enumerate((('&frac12;', ''), ('1&times;', ''), ('2&times;', 'lit'))):
        b += key(27 + i * 6, 2, 6, 5, t, '', on, CYAN, 'K 6x5u')
    for i, (lab, col, on) in enumerate((('MASTER', 'r', False), ('INCOMING', 'r', False), ('FINS OUT', 'o', False), ('QUIET', 'c', False), ('SPOOL', 'a', False), ('SOLUTION', 'a', True))):
        b += lamp(50 + i * 8, 2, lab, col, on, w=8, h=5, tag='S 8x5u')
    b += W('plate', 99, 2, 12, 5, 'MASTER CAUTION<br>EVENTS ONLY', '', 'plate 12x5u')
    b += key(112.5, 2, 6, 5, '&#9776;', 'MENU', '', None, 'K 6x5u')
    for i, (t, k, on) in enumerate((('TACTICAL', '1', view == 'tac'), ('STRATEGIC', '2', view == 'str'), ('TARGET', '3', view == 'tgt'))):
        sub = k if not (view == 'tgt' and i == 2) else 'C1 &middot; 3'
        b += key(120 + i * 13.3, 2, 13, 5, t, k, 'lit' if on else '', AMBER, 'K 13x5u')
    return Z('RAIL', 0, 0, 160, 8, '', b)

def heat_zone(hov=False):
    g = ''
    g += W('g tank', 0, 3, 12, 32, tank_svg(27, 69 if hov else None), '', 'M-tall 12x32u')
    g += W('l', 12, 3, 24, 16, heat_rate_dial(15, 42 if hov else None), '', 'L 24x16u')
    g += W('g', 12, 19, 24, 16, trend_svg(hov), '', 'L 24x16u')
    g += ro(36, 3, 'FULL IN', '01:44' if hov else '05:01', CYAN if hov else AMBER, '88:88', 12, 4)
    g += key(36, 7, 12, 8, 'VENT', 'FINS OUT &middot; V', 'av', RED, 'K 12x8u')
    g += key(36, 15, 12, 4, 'GO QUIET', 'Q', 'av', CYAN, 'K 12x4u')
    for i, (lab, col, on) in enumerate((('FINS', 'c', False), ('PEG', 'r', False), ('60', 'a', False), ('80', 'o', False), ('95', 'r', False), ('MELT', 'r', False))):
        g += lamp(36 + (i % 2) * 6, 19 + (i // 2) * 4, lab, col, on)
    g += ro(36, 31, 'QUIET CD', 'READY', GREEN, 'READY', 12, 4)
    srcs = (('DRIVE', 'o', 2), ('SENSE', 'c', 1), ('PING', 'a', 0), ('PELL', 'v', 0), ('SPOOL', 'a', 0), ('BLAST', 'r', 0))
    for i, (lab, col, lv) in enumerate(srcs):
        g += lamp(i * 6, 35, lab, col, lv > 0, dim=(lv == 1))
    g += W('plate', 36, 35, 12, 4, 'HEAT SOURCES<br>BRIGHT = BIGGEST', '', 'plate 12x4u')
    return Z('HEAT', 112, 8, 48, 40, 'HEAT', g, 'sink &middot; rate &middot; clock')

def stealth_zone():
    g = ''
    g += W('g', 0, 3, 24, 8, band_gauge('SEEN BY ENEMY', 28, 24, 8, numtxt='28%'), '', 'M 24x8u')
    # enemy fix plate: 3 big pips
    pip = ''.join(f'<i class="led {"" }" style="margin:0 calc(var(--u)*.6)"></i>' for _ in range(3))
    g += W('lamp', 24, 3, 24, 8, f'<span class="lg" style="color:#9db4a9;font-weight:700;font-size:calc(var(--u)*1.3)">ENEMY FIX</span><div style="display:flex">{pip}</div><span class="lg" style="font-size:calc(var(--u)*1)">AWARE &middot; CLOSING &middot; FIRM</span>', '', 'M 24x8u')
    for i, (lab, col, on) in enumerate((('COVER', 'c', False), ('ECLIPSE', 'c', False), ('CALM', 'g', False), ('ALERT', 'a', True), ('SILENT', 'r', False))):
        g += lamp(i * 6, 11, lab, col, on)
    g += W('plate', 30, 11, 18, 4, 'HUNTER ATTITUDE (THIS ARENA)', '', 'plate 18x4u')
    return Z('STEALTH', 112, 48, 48, 17, 'SIGNATURE', g, 'what they see of us')

def ship_zone():
    g = ''
    g += W('g', 0, 3, 12, 8, seg_gauge('HULL', 1.0, GREEN, '100%', 12, 8), '', 'M 12x8u')
    for i, (lab, col) in enumerate((('SENS', 'g'), ('DRIVE', 'g'), ('WEAPON', 'g'), ('BREACH', 'g'))):
        g += lamp(12 + (i % 2) * 6, 3 + (i // 2) * 4, lab, col, True)
    g += key(24, 3, 12, 4, 'PELL ASSIST', 'RUNS HOT', '', VIOLET, 'K 12x4u')
    g += key(24, 7, 12, 4, 'PELL ACTS', 'NO ASKING', 'dis', VIOLET, 'K 12x4u')
    g += W('g', 36, 3, 12, 8, seg_gauge('INTEGRATION', 0.0, VIOLET, '0%', 12, 8, marks=(.25, .5, .75)), '', 'M 12x8u')
    g += W('g', 0, 11, 24, 8, seg_gauge('BREACH SPOOL', 0.0, AMBER, 'IDLE', 24, 8, segs=20, marks=(3/11.25,)), '', 'M 24x8u')
    g += key(24, 11, 12, 8, 'BREACH', 'BREAK CONTACT', 'guard', RED, 'K 12x8u')
    g += ro(36, 11, 'SPOOL ETA', '--:--', GREEN, '88:88', 12, 4)
    g += lamp(36, 15, 'JUMP RDY', 'g', True)
    g += lamp(42, 15, 'DOGLEG', 'a', False)
    return Z('SHIP', 112, 65, 48, 25, 'SHIP &amp; AI', g, 'hull &middot; systems &middot; Pell &middot; breach')

# ---------------------------------------------------------------- Tactical view
def tactical(hov=False):
    out = []
    out.append(rail('tac'))
    # --- left column: sensor deck (analysts), contacts, action bank
    d = ''
    for i, (nm, role, col, tgt, stt, sc) in enumerate((('DACE', 'HEAT', ORANGE, '4', 'SWEEP', 'o'), ('CASTELLAN', 'REACTOR', CYAN, '4', 'FOCUS', 'c'), ('QUILL', 'VISUAL', VIOLET, '--', 'BLIND', 'a'))):
        inner = (f'<div style="position:absolute;left:7%;top:8%;font-weight:700;font-size:calc(var(--u)*1.25);color:{col};letter-spacing:.06em">{nm}</div>'
                 f'<div style="position:absolute;left:7%;top:36%;font-size:calc(var(--u)*1.05);color:#566b62">{role}</div>'
                 f'<div style="position:absolute;right:7%;bottom:6%;font-family:var(--mono);font-weight:700;font-size:calc(var(--u)*2.7);line-height:1;color:{AMBER if tgt!="--" else "#33423c"}">{("C"+tgt) if tgt!="--" else "--"}</div>'
                 f'<div style="position:absolute;left:7%;bottom:10%;display:flex;gap:calc(var(--u)*.5);align-items:center"><i class="led {sc}" style="width:calc(var(--u)*1.2);height:calc(var(--u)*1.2)"></i><span class="lg" style="color:var(--ink)">{stt}</span></div>')
        d += W('an', i * 12, 3, 12, 8, inner, '', 'M 12x8u')
    out.append(Z('SENSORS', 0, 8, 36, 12, 'ANALYSTS', d, 'who is looking at what'))
    # contacts
    c = ''
    y = 3
    c += slip_full(y, 3, 'DECISION', 'a', 'decoy', '96%', '118', [('H', 'HEAT', 100, 100, 'done', 100), ('R', 'REACT', 100, 100, 'done', 100), ('V', 'VISUAL', 96, 100, 'done on', 96)], 'sel', fl=True); y += 8.5
    c += slip_full(y, 1, 'SOLVING 23%', 'r', 'ship', '82%', '131', [('H', 'HEAT', 70, 100, 'done', 70), ('R', 'REACT', 58, 64, '', 58), ('V', 'VISUAL', 0, 0, 'off', None)], 'lk'); y += 8.5
    c += slip_full(y, 4, 'UNRESOLVED', 'c', 'q', '69%', '133', [('H', 'HEAT', 88, 100, 'done', 88), ('R', 'REACT', 84, 52, 'hold', 84), ('V', 'VISUAL', 0, 0, 'off', None)], ''); y += 8.5
    c += slip_compact(y, 7, 'o', 'ship', '58', [('H', 100, False), ('R', 14, False), ('V', 0, True)], '', True, 'VENT'); y += 4.5
    c += slip_compact(y, 5, '', 'q', '116', [('H', 0, False), ('R', 0, False), ('V', 0, True)], ''); y += 4.5
    c += slip_compact(y, 2, 'g', 'ally', '34', [('H', 0, True), ('R', 0, True), ('V', 0, True)], 'ally'); y += 4.5
    c += slip_compact(y, 6, '', 'static', '103', [('H', 22, False), ('R', 12, False), ('V', 0, True)], 'out'); y += 4.5
    c += slip_compact(y, 8, '', 'q', '141', [('H', 31, False), ('R', 0, False), ('V', 0, True)], '')
    out.append(Z('CONTACTS', 0, 20, 36, 56, 'CONTACTS', c, 'numbers match the scope'))
    # action bank (acts on the selected contact)
    a = ''
    a += key(0, 3, 12, 4, 'INVESTIGATE', 'ALL 3 ANALYSTS', 'lit', CYAN, 'K 12x4u')
    a += key(12, 3, 12, 4, 'ACTIVE PING', 'LOUD &middot; HEAT', 'lit', AMBER, 'K 12x4u')
    a += key(24, 3, 12, 4, 'LOCK ON', 'C3 &middot; RECOMMENDED', 'lit rec', AMBER, 'K 12x4u')
    a += key(0, 7, 12, 4, 'DISMISS', 'RULE OUT', 'lit', GREEN, 'K 12x4u')
    a += key(12, 7, 12, 4, 'RE-ANALYZE', 'RULED OUT ONLY', 'dis', CYAN, 'K 12x4u')
    a += key(24, 7, 12, 4, 'RELEASE', 'ANALYSTS', '', CYAN, 'K 12x4u')
    out.append(Z('ACTIONS', 0, 76, 36, 14, 'ORDERS FOR C3', a, ''))
    # --- scope
    s = ''
    s += Wraw('beacon', 0, 0.2, 52, 2.8, '<div class="f" style="display:flex;align-items:center;gap:calc(var(--u)*.9);padding:0 calc(var(--u)*1)"><i class="led a fl"></i><b>NEXT</b><span>C3: 3 SENSORS AGREE, <em>LOCK ON</em> OR <em>DISMISS</em></span></div>', '', 'beacon 52x3u')
    s += W('scope', 0, 3, 52, 52, scope_svg(), '', 'XL 52x52u (50u view)')
    sh = ''
    sh += ro(0, 55, 'ZOOM', '3.0&times;', CYAN, '8.8&times;', 12, 4)
    sh += ro(12, 55, 'RING', '20', CYAN, '88', 12, 4, 'km')
    sh += key(24, 55, 12, 4, 'FOLLOW', 'SHIP', 'lit', CYAN, 'K 12x4u')
    sh += key(36, 55, 12, 4, 'FIT', 'WHOLE ARENA', '', None, 'K 12x4u')
    sh += lamp(48, 55, 'BACKLIT', 'v', True)
    # helm strip
    sh += W('l', 52, 3, 24, 16, compass_svg(90, 118), '', 'L 24x16u')
    sh += ro(52, 19, 'SPEED', '3.6', CYAN, '8.8', 12, 4, 'km/m')
    sh += ro(64, 19, 'LEG 1/3', '01:08', CYAN, '88:88', 12, 4)
    drv = (('20%', '1.2', CYAN), ('40%', '2.4', CYAN), ('60%', '3.6', '#9ad06b'), ('80%', '4.8', AMBER), ('100%', '6.0', ORANGE), ('REDLINE', '9.0', RED))
    for i, (t, sp, col) in enumerate(drv):
        st = 'lit' if t == '60%' else ('guard' if t == 'REDLINE' else '')
        if hov and t == '100%':
            st += ' hv'
        sh += key(52 + (i % 2) * 12, 23 + (i // 2) * 4, 12, 4, t, sp + ' KM/M', st, col, 'K 12x4u')
    sh += key(52, 35, 12, 4, 'HOLD STILL', 'STANCE', 'lit', GREEN, 'K 12x4u')
    sh += key(64, 35, 12, 4, 'EVASIVE', 'STANCE', '', AMBER, 'K 12x4u')
    sh += key(52, 39, 12, 4, 'CLEAR PLAN', '', '', None, 'K 12x4u')
    sh += key(64, 39, 12, 4, 'EDIT PLAN', 'STRATEGIC MAP', '', None, 'K 12x4u')
    sh += W('plate', 52, 43, 24, 4, 'RIGHT-CLICK: GO HERE<br>SHIFT: QUEUE A WAYPOINT', '', 'plate 24x4u')
    sh += lamp(52, 47, 'WPT 1', 'c', True); sh += lamp(58, 47, 'WPT 2', 'a', True); sh += lamp(64, 47, 'WPT 3', 'r', True); sh += lamp(70, 47, 'WPT 4', None, False)
    sh += W('plate', 52, 51, 24, 4, 'COURSE LEGS COLORED BY DRIVE SETTING', '', 'plate 24x4u')
    out.append(Z('SCOPE', 36, 8, 76, 62, 'SCOPE &amp; HELM', s + sh, 'who is where, and how we move'))
    # --- weapons
    wp = ''
    for i in range(3):
        rl = (i == 2)
        wp += W('g', i * 12, 3, 12, 8, seg_gauge(f'SALVO {i+1}', .4 if rl else 1.0, AMBER if rl else GREEN, 'RELOAD 0:19' if rl else 'READY', 12, 8, segs=8), '', 'M 12x8u')
    wp += W('g', 36, 3, 12, 8, seg_gauge('COILGUN', 1.0, GREEN, 'READY', 12, 8, segs=8), '', 'M 12x8u')
    wp += ro(0, 11, 'IN FLIGHT', '--:--', GREEN, '88:88', 12, 4)
    wp += key(12, 11, 12, 4, 'TARGET &#9656;', 'C1 SOLVING', 'lit', AMBER, 'K 12x4u')
    wp += lamp(24, 11, 'LIVE', 'r', True); wp += lamp(30, 11, 'STALE', 'a', False); wp += lamp(36, 11, 'IN RNG', None, False); wp += lamp(42, 11, 'FRIEND', 'g', False)
    wp += W('plate', 0, 15, 48, 4, 'FIRE ONLY FROM THE TARGET VIEW', '', 'plate 48x4u')
    out.append(Z('WEAPONS', 36, 70, 48, 20, 'WEAPONS', wp, 'tubes &middot; coilgun'))
    # --- comms log
    cm = Wraw('log', 0, 3, 28, 13, '<div class="f"><div><b>2:12</b> Quill C2 starlight blocked</div><div><b>2:05</b> Dace C7 fins out, blaze</div><div><b>1:58</b> Castellan C4 neutrino line</div><div class="u"><b>1:51</b> Abara C1 solving, 1:08</div><div><b>1:44</b> Dace C3 thermal, strong</div></div>', '', 'LOG 28x13u')
    cm += key(0, 16, 12, 4, 'VOICE', 'NORMAL', 'lit', GREEN, 'K 12x4u') + key(12, 16, 12, 4, 'KEY CALLS', 'ALL', '', None, 'K 12x4u')
    out.append(Z('COMMS', 84, 70, 28, 20, 'COMMS', cm, 'mostly voiced'))
    out.append(heat_zone(hov))
    out.append(stealth_zone())
    out.append(ship_zone())
    if hov:
        out.append('<div class="tip" style="left:calc(var(--u)*53);top:calc(var(--u)*41);width:calc(var(--u)*33)"><b>HOVER PREVIEW &middot; 100% DRIVE</b><br>'
                   'HEAT RATE <em>+15</em> &rarr; <em>+42</em> %/MIN<br>FULL IN <em>05:01</em> &rarr; <em>01:44</em><br>SEEN BY ENEMY <em>28</em> &rarr; <em>55</em>%<br>'
                   '<span style="color:var(--dim)">GHOST NEEDLE, GHOST TANK LEVEL AND DASHED TREND LINE SHOW IT. NOTHING IS COMMITTED UNTIL CLICK.</span></div>')
    return ''.join(out)

# ---------------------------------------------------------------- Target view
def plot_svg():
    S = ['<svg viewBox="0 0 640 640" preserveAspectRatio="xMidYMid slice"><rect width="640" height="640" fill="#04090a"/>']
    for i in range(0, 641, 64):
        S.append(f'<line x1="{i}" y1="0" x2="{i}" y2="640" stroke="#10201c"/><line x1="0" y1="{i}" x2="640" y2="{i}" stroke="#10201c"/>')
    S.append('<circle cx="70" cy="560" r="96" fill="none" stroke="#ff6b5a" stroke-opacity=".45" stroke-dasharray="4 6"/><text x="70" y="684" font-size="12" fill="#ff6b5a"></text><text x="30" y="672" font-size="11" fill="#ff6b5a"></text>')
    S.append('<circle cx="70" cy="560" r="120" fill="none" stroke="#ffb454" stroke-opacity=".5" stroke-dasharray="4 6"/><text x="150" y="486" font-size="12" fill="#b8883f">COILGUN 18 KM</text>')
    S.append('<polygon points="58,574 86,560 58,546 64,560" fill="#6fc3d0"/><text x="70" y="598" text-anchor="middle" font-size="12" fill="#6fc3d0">YOU</text><text x="70" y="528" text-anchor="middle" font-size="11" fill="#ff6b5a">SELF-HIT ZONE</text>')
    S.append('<line x1="70" y1="560" x2="420" y2="214" stroke="#ffb454" stroke-opacity=".35" stroke-dasharray="3 6"/>')
    S.append('<polygon points="318,262 560,210 520,372" fill="#ffb454" opacity=".13" stroke="#ffb454" stroke-opacity=".7"/>')
    S.append('<ellipse cx="450" cy="268" rx="62" ry="40" transform="rotate(-18 450 268)" fill="#ffb454" opacity=".28" stroke="#ffb454" stroke-width="2"/>')
    S.append('<circle cx="450" cy="268" r="130" fill="none" stroke="#ffb454" stroke-opacity=".25" stroke-dasharray="4 6"/>')
    for (x, y) in ((430, 262), (446, 252), (462, 270), (440, 284), (470, 256), (452, 290), (418, 276)):
        S.append(f'<circle cx="{x}" cy="{y}" r="3" fill="#ffd9a0"/>')
    S.append('<g stroke="#ff6b5a" stroke-width="3" fill="none" stroke-dasharray="7 5"><path d="M296 240v-16h16M340 224h16v16M356 284v16h-16M312 300h-16v-16"/></g>')
    S.append('<polygon points="316,282 328,252 340,282 328,275" fill="#ff6b5a" opacity=".85"/><text x="268" y="322" font-size="12" font-weight="700" fill="#ff6b5a">1 PROJECTED</text>')
    S.append('<g stroke="#cfe3da" stroke-width="2"><circle cx="450" cy="268" r="12" fill="none"/><line x1="428" y1="268" x2="472" y2="268"/><line x1="450" y1="246" x2="450" y2="290"/></g><text x="478" y="272" font-size="12" fill="#cfe3da">AIM</text>')
    S.append('<text x="12" y="22" font-size="12" fill="#566b62">GRID 10 KM &middot; WHEEL = CONE &middot; DRAG = AIM POINT</text></svg>')
    return ''.join(S)

def target(hov=False):
    out = [rail('tgt')]
    # solution strip (zone content origin; strip is 10u tall, widgets start at y=1)
    t = slip_full(1, 1, 'SOLVING 23%', 'r', 'ship', '82%', '131', [('H', 'HEAT', 70, 100, 'done', 70), ('R', 'REACT', 58, 64, '', 58), ('V', 'VISUAL', 0, 0, 'off', None)], 'lk')
    for i, (lab, col, on) in enumerate((('READY', 'g', False), ('SOLVING', 'a', True), ('STALE', 'r', False), ('PAUSED', 'c', False))):
        t += lamp(37 + i * 6, 1, lab, col, on)
    t += W('g', 37, 5, 24, 4, seg_gauge('', 0.23, AMBER, '23% . 1:08 LEFT', 24, 4, segs=24), '', 'M 24x4u')
    t += ro(62, 1, 'SCAN AGE', '00:19', GREEN, '88:88', 12, 4)
    t += key(62, 5, 12, 4, 'REFRESH', 'NEW SOLUTION', '', AMBER, 'K 12x4u')
    t += lamp(75, 1, 'LIVE', 'r', False); t += lamp(81, 1, 'PROJ', 'a', True)
    t += W('plate', 75, 5, 12, 4, 'SOLID = LIVE<br>DASHED = PROJECTED', '', 'plate 12x4u')
    t += W('plate', 88, 1, 12, 8, 'ONE SOLUTION<br>PER LOCKED<br>CONTACT', '', 'plate 12x8u')
    t += key(100, 1, 12, 8, 'BACK', 'ESC', '', None, 'K 12x8u')
    out.append(Z('SOLUTION', 0, 8, 112, 10, '', t))
    # plot
    p = W('scope', 0, 3, 64, 64, plot_svg(), '', 'XL 64x64u')
    p += ro(0, 67, 'AIM PT', '156', AMBER, '888', 12, 4, 'km')
    p += ro(12, 67, 'ARRIVE', '04:54', AMBER, '88:88', 12, 4)
    p += ro(24, 67, 'TGT 1M', '7.3', CYAN, '8.8', 12, 4, 'km')
    p += lamp(36, 67, 'GRID', None, False); p += lamp(42, 67, 'DANGER', 'g', True); p += lamp(48, 67, 'COIL', None, False); p += lamp(54, 67, 'FRIEND', 'g', False)
    out.append(Z('PLOT', 0, 18, 64, 72, 'FIRE SOLUTION', p, 'contact 1'))
    # dials
    d = ''
    ds = [
        lin_dial(-180, 180, -32, (-180, -90, 0, 90, 180), 'BEARING', 'degrees off our bow', lambda v: f'{int(v)}', None, None, CYAN),
        lin_dial(0, 240, 131, (0, 60, 120, 180, 240), 'RANGE', 'km', lambda v: f'{int(v)}', None, None, CYAN),
        lin_dial(0, 360, 179, (0, 90, 180, 270), 'BOW ANGLE', 'degrees, crossing right', lambda v: f'{int(v)}', None, None, CYAN),
        lin_dial(0, 12, 7.3, (0, 3, 6, 9, 12), 'TARGET SPEED', 'km per minute', lambda v: (f'{v:.1f}' if v % 1 else f'{int(v)}'), [(None, 6, '#2b6b66'), (6, None, '#a8681f')], None, CYAN),
        lin_dial(0, 240, 34, (0, 60, 120, 180, 240), 'AIM LEAD', 'km along path', lambda v: f'{int(v)}', [(None, None, '#a8681f')], None, AMBER, 'DRAG PLOT'),
        lin_dial(0, 24, 8, (0, 6, 12, 18, 24), 'CONE WIDTH', 'km spread', lambda v: f'{int(v)}', [(None, None, '#a8681f')], None, AMBER, 'WHEEL'),
    ]
    nm = ['L 24x16u'] * 6
    for i, s in enumerate(ds):
        d += W('l', (i % 2) * 24, 3 + (i // 2) * 16, 24, 16, s, '', nm[i])
    d += key(0, 51, 12, 4, 'FOLLOW ABARA', 'AUTO LEAD', 'lit', GREEN, 'K 12x4u')
    d += key(12, 51, 12, 4, 'HOMING', 'EASY TO SPOT', '', AMBER, 'K 12x4u')
    d += key(24, 51, 8, 4, 'HE', 'STANDARD', 'lit', AMBER, 'K 8x4u'); d += key(32, 51, 8, 4, 'EMP', '', '', AMBER, 'K 8x4u'); d += key(40, 51, 8, 4, 'FLARE', '', '', AMBER, 'K 8x4u')
    d += W('g', 0, 55, 24, 8, seg_gauge('HIT CHANCE', 0.38, AMBER, '38%', 24, 8, segs=20), '', 'M 24x8u')
    d += lamp(24, 55, 'SALVO 1', 'g', True); d += lamp(30, 55, 'SALVO 2', 'g', True); d += lamp(36, 55, 'SALVO 3', 'g', True); d += lamp(42, 55, 'COIL', None, False)
    d += lamp(24, 59, 'DET HEAT', 'a', True); d += lamp(30, 59, 'WARNED', None, False); d += lamp(36, 59, 'NEAR US', 'g', False); d += lamp(42, 59, 'GRID', None, False)
    d += key(0, 63, 36, 8, 'FIRE SALVO', 'NEEDS A READY SOLUTION', 'guard', RED, 'K-XL 36x8u')
    d += key(36, 63, 12, 8, 'COILGUN', 'UNDER 18 KM', 'dis', AMBER, 'K 12x8u')
    out.append(Z('AIM', 64, 18, 48, 72, 'AIM &amp; FIRE', d, ''))
    out.append(heat_zone(False)); out.append(stealth_zone()); out.append(ship_zone())
    return ''.join(out)

# ---------------------------------------------------------------- page assembly
def page(title, body, u):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title>'
            f'<meta name="viewport" content="width=device-width,initial-scale=1"><style>{CSS}\n:root{{--u:{u}px}}</style></head>'
            f'<body><input type="checkbox" id="slots"><label id="slotl" for="slots">show widget slots</label>'
            f'<div class="stage">{body}</div></body></html>')

if __name__ == '__main__':
    open(os.path.join(HERE, 'mock_1366.html'), 'w').write(page('Interdict console v2, Tactical, 1366x768', tactical(False), 8.5375))
    open(os.path.join(HERE, 'mock_1920.html'), 'w').write(page('Interdict console v2, Tactical, 1920x1080 (hover preview shown)', tactical(True), 12))
    open(os.path.join(HERE, 'mock_target.html'), 'w').write(page('Interdict console v2, Target view, 1920x1080', target(), 12))
    print('ok')
