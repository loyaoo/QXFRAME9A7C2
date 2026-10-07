import sys, asyncio, json
from playwright.async_api import async_playwright
# usage: shotqx.py baseurl preview(01|02) out.png [jsonconfig] [dark] [runtime]
base, pv, out = sys.argv[1], sys.argv[2], sys.argv[3]
cfg = json.loads(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else {}
dark = len(sys.argv) > 5 and sys.argv[5] == 'dark'
RT = sys.argv[6] if len(sys.argv) > 6 else None
INIT = "window.addEventListener('message',e=>{if(e.data&&e.data.type==='qx-create-theme')window.__lastTheme=e.data},true)"
async def setup(pg):
    if RT:
        data = open(RT, 'rb').read()
        await pg.route('**/loyaoo.github.io/**', lambda r: r.fulfill(body=data, content_type='application/javascript'))
    await pg.route('**/*', lambda r: r.abort() if not any(h in r.request.url for h in ('localhost', 'loyaoo', 'data:')) else r.continue_())
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1600, 'height': 1000})
        await pg.add_init_script(INIT); await setup(pg)
        await pg.goto(base + '/index.html', wait_until='load'); await pg.wait_for_timeout(2000)
        if cfg or dark:
            await pg.evaluate("([c,d])=>{const A=window.OfflineThemeApp||window.QXCreateApp||window.CreateApp; if(A&&A.setConfig&&Object.keys(c).length)A.setConfig(c); if(d){const t=document.querySelector('[data-mode-toggle],#mode-toggle,.app-mode-toggle'); }}", [cfg, dark])
            await pg.wait_for_timeout(1500)
        fr = [f for f in pg.frames if 'preview-01' in f.url or 'preview-02' in f.url][0]
        theme = await fr.evaluate("window.__lastTheme")
        if dark and theme: theme['mode'] = 'dark'
        pg2 = await b.new_page(viewport={'width': 3000, 'height': 1200})
        msgs = []; pg2.on('pageerror', lambda e: msgs.append(str(e)))
        await setup(pg2)
        await pg2.goto(base + f'/preview/preview-{pv}.html', wait_until='load'); await pg2.wait_for_timeout(1500)
        await pg2.evaluate("t=>window.postMessage(t,'*')", theme); await pg2.wait_for_timeout(1500)
        await pg2.screenshot(path=out, full_page=True)
        print('ok', bool(theme), msgs[:5])
        await b.close()
asyncio.run(main())
