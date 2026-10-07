import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1300,'height':1000})
        await pg.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        await pg.goto(sys.argv[1]); await pg.wait_for_timeout(1500)
        for sel in sys.argv[2:]:
            print('=====', sel)
            print(await pg.evaluate("s=>{const e=document.querySelector(s);return e?e.outerHTML.replace(/<svg[\\s\\S]*?<\\/svg>/g,'<svg/>').slice(0,2500):'none'}", sel))
        await b.close()
asyncio.run(main())
