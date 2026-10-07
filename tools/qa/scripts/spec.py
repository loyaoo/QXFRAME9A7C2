import asyncio, json, sys
from playwright.async_api import async_playwright
STYLES = ['vega','nova','maia','lyra','mira','luma','sera','rhea']
JS = """() => { const o = {}; for (const e of document.querySelectorAll('[data-spec]')) { const s = getComputedStyle(e), r = e.getBoundingClientRect();
 o[e.dataset.spec] = { w:+r.width.toFixed(2), h:+r.height.toFixed(2), rad:s.borderTopLeftRadius, pt:s.paddingTop, pr:s.paddingRight, pb:s.paddingBottom, pl:s.paddingLeft,
  bw:s.borderTopWidth, bbw:s.borderBottomWidth, blw:s.borderLeftWidth, bc:s.borderTopColor, bbc:s.borderBottomColor, bg:s.backgroundColor, col:s.color, fs:s.fontSize, fw:s.fontWeight, lh:s.lineHeight,
  gap:s.rowGap, cgap:s.columnGap, sh:s.boxShadow, tt:s.textTransform, ls:s.letterSpacing, ff:s.fontFamily.slice(0,30) } } return o }"""
async def main():
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1300, 'height': 1000})
        await pg.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        for st in STYLES:
            for dk in ['', '&dark=1']:
                await pg.goto(f"http://localhost:8103/?item=gallery&style={st}{dk}"); await pg.wait_for_timeout(500)
                out[st + ('-dark' if dk else '')] = await pg.evaluate(JS)
        await b.close()
    json.dump(out, open(sys.argv[1], 'w'), indent=0)
asyncio.run(main())
