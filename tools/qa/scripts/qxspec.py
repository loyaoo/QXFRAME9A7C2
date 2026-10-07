# qxspec.py base out.json [styles]
import asyncio, json, sys
from playwright.async_api import async_playwright
base, outp = sys.argv[1], sys.argv[2]
STYLES = sys.argv[3].split(',') if len(sys.argv) > 3 else ['vega','nova','maia','lyra','mira','luma','sera','rhea']
SPEC = open('/tmp/claude-0/-home-claude/33a9dde6-00ca-5a12-b42c-ad88ecb4bf0a/scratchpad/tools/spec.py').read().split('JS = """')[1].split('"""')[0]
RETAG = """() => { const t=(sel,id)=>{const e=document.querySelector(sel); if(e) e.dataset.spec=id};
 t('[data-spec=select-trigger] .qxframe9a7c2-select','select-trigger'); t('[data-spec=select-trigger-sm] .qxframe9a7c2-select','select-trigger-sm');
 t('[data-spec=tabs-host] .qxframe9a7c2-tabs-list','tabs-list'); t('[data-spec=tabs-host] .qxframe9a7c2-tabs-tab.is-active','tabs-trigger-active');
 const tt=document.querySelectorAll('[data-spec=tabs-host] .qxframe9a7c2-tabs-tab'); if(tt[1]) tt[1].dataset.spec='tabs-trigger';
 t('[data-spec=tabs-host-line] .qxframe9a7c2-tabs-list','tabs-list-line'); t('[data-spec=tabs-host-line] .qxframe9a7c2-tabs-tab.is-active','tabs-trigger-line-active');
 t('[data-spec=table-host] table','table'); t('[data-spec=table-host] th','table-head'); t('[data-spec=table-host] tbody tr','table-row'); t('[data-spec=table-host] td','table-cell');
 t('[data-qx-runtime=control] .qxframe9a7c2-input','input-group'); t('[data-qx-runtime=control] input','input-group-input');
 t('[data-spec=slider] .qxframe9a7c2-slider','slider'); t('[data-spec=progress] .qxframe9a7c2-progress-inner','progress'); }"""
INIT = "window.addEventListener('message',e=>{if(e.data&&e.data.type==='qx-create-theme')window.__lastTheme=e.data},true)"
async def main():
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg0 = await b.new_page(viewport={'width': 1600, 'height': 1000}); await pg0.add_init_script(INIT)
        await pg0.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        await pg0.goto(base + '/index.html'); await pg0.wait_for_timeout(1500)
        pg = await b.new_page(viewport={'width': 1300, 'height': 1000})
        await pg.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        for st in STYLES:
            await pg0.evaluate("s=>{window.OfflineThemeApp.setConfig({style:s})}", st); await pg0.wait_for_timeout(700)
            fr = [f for f in pg0.frames if '/preview/' in f.url][0]
            theme = await fr.evaluate("window.__lastTheme")
            for dark in [False, True]:
                th = dict(theme); th['mode'] = 'dark' if dark else 'light'
                await pg.goto(base + '/examples/parity-gallery.html'); await pg.wait_for_timeout(600)
                await pg.evaluate("t=>window.postMessage(t,'*')", th); await pg.wait_for_timeout(500)
                await pg.evaluate(RETAG)
                out[st + ('-dark' if dark else '')] = await pg.evaluate(SPEC)
        await b.close()
    json.dump(out, open(outp, 'w'))
asyncio.run(main())
