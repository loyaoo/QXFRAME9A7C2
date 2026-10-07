import sys, asyncio
from playwright.async_api import async_playwright
RUNTIME = sys.argv[4] if len(sys.argv)>4 else None
async def main(url, out, w):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':int(w),'height':1000})
        msgs=[]
        pg.on('console', lambda m: msgs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: msgs.append('ERR '+str(e)))
        if RUNTIME:
            data=open(RUNTIME,'rb').read()
            await pg.route('**/loyaoo.github.io/**/qxframe9a7c2.js', lambda r: r.fulfill(body=data, content_type='application/javascript'))
        await pg.route('**/*', lambda r: r.abort() if not any(h in r.request.url for h in ('localhost','127.0.0.1','loyaoo','data:')) else r.continue_())
        await pg.goto(url, wait_until='load')
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=out, full_page=True)
        print('\n'.join(msgs[:30]))
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3]))
