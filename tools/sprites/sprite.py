import base64,io,json,sys
from playwright.sync_api import sync_playwright
from PIL import Image
S=sys.argv[1]
dirs={'se':90,'sw':0,'ne':180,'nw':-90}
import math
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']); pg=b.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8765/render.html'); pg.wait_for_function('window.ready||window.err',timeout=120000)
    print('err',pg.evaluate('window.err'),'info',pg.evaluate('window.info'),'feet',pg.evaluate('feet()'),'dur',pg.evaluate('dur'))
    NF=8; sheet=Image.new('RGBA',(256*NF,320*5),(0,0,0,0))
    for ri,(k,deg) in enumerate(dirs.items()):
        th=math.radians(deg)
        for f in range(NF):
            u=pg.evaluate(f'shot({th},{f}*dur/{NF})'); im=Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA'); sheet.paste(im,(f*256,ri*320))
        u=pg.evaluate(f'shot({th},0)'); im=Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA'); sheet.paste(im,(ri*256,4*320))
    sheet.save('/home/claude/interdict/design/assets/captain_sheet.png'); print('saved',sheet.size,errs[:3]); b.close()
