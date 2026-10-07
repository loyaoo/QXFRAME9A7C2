# cap.py ref|qx  base  item(preview|preview-02 / 01|02)  style  outprefix  [dark]
import sys, asyncio, json
from playwright.async_api import async_playwright
kind, base, item, style, outp = sys.argv[1:6]; dark = len(sys.argv) > 6 and sys.argv[6] == 'dark'
PROBE = open(__file__.rsplit('/', 1)[0] + '/probe.js').read()
RT = '/tmp/claude-0/-home-claude/33a9dde6-00ca-5a12-b42c-ad88ecb4bf0a/scratchpad/b/qxframe9a7c2-theme-v7.2.0/qxframe/qxframe9a7c2.runtime.js'
INIT = "window.addEventListener('message',e=>{if(e.data&&e.data.type==='qx-create-theme')window.__lastTheme=e.data},true)"
async def setup(pg):
    data = open(RT, 'rb').read()
    await pg.route('**/loyaoo.github.io/**', lambda r: r.fulfill(body=data, content_type='application/javascript'))
    await pg.route('**/*', lambda r: r.abort() if not any(h in r.request.url for h in ('localhost', 'loyaoo', 'data:')) else r.continue_())
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if kind == 'ref':
            pg = await b.new_page(viewport={'width': 3000, 'height': 1200}); await setup(pg)
            await pg.goto(f"{base}/?item={item}&style={style}" + ("&dark=1" if dark else ''), wait_until='load'); await pg.wait_for_timeout(1500)
        else:
            pg0 = await b.new_page(viewport={'width': 1600, 'height': 1000}); await pg0.add_init_script(INIT); await setup(pg0)
            await pg0.goto(base + '/index.html', wait_until='load'); await pg0.wait_for_timeout(1500)
            await pg0.evaluate("s=>{try{localStorage.clear()}catch(e){};window.OfflineThemeApp.setConfig({style:s})}", style); await pg0.wait_for_timeout(1200)
            fr = [f for f in pg0.frames if '/preview/' in f.url][0]
            theme = await fr.evaluate("window.__lastTheme")
            if dark: theme['mode'] = 'dark'
            pg = await b.new_page(viewport={'width': 3000, 'height': 1200}); await setup(pg)
            await pg.goto(f"{base}/preview/preview-{item}.html", wait_until='load'); await pg.wait_for_timeout(1200)
            await pg.evaluate("t=>window.postMessage(t,'*')", theme); await pg.wait_for_timeout(1500)
        data = await pg.evaluate(PROBE)
        json.dump(data, open(outp + '.json', 'w'))
        await pg.screenshot(path=outp + '.png', full_page=True)
        print(outp, len(data['cards']), len(data['texts']))
        await b.close()
asyncio.run(main())
