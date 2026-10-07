import sys, asyncio
from playwright.async_api import async_playwright
base, style = sys.argv[1], sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        await pg.goto(base + '/index.html'); await pg.wait_for_timeout(1200)
        await pg.evaluate("s=>{try{localStorage.clear()}catch(e){};window.OfflineThemeApp.setConfig({style:s})}", style); await pg.wait_for_timeout(1000)
        fr = [f for f in pg.frames if '/preview/' in f.url][0]
        print(await fr.evaluate("document.getElementById('theme-vars').textContent")); await b.close()
asyncio.run(main())
