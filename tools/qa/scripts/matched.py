# matched.py url selector -> print all matched CSS rules (with source order) for first element matching selector, via CDP
import sys, asyncio, json
from playwright.async_api import async_playwright
url, sel = sys.argv[1], sys.argv[2]; props = sys.argv[3].split(',') if len(sys.argv) > 3 else None
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 3000, 'height': 1200})
        await pg.route('**/*', lambda r: r.abort() if 'localhost' not in r.request.url else r.continue_())
        await pg.goto(url, wait_until='load'); await pg.wait_for_timeout(1500)
        c = await pg.context.new_cdp_session(pg)
        await c.send('DOM.enable'); await c.send('CSS.enable')
        doc = await c.send('DOM.getDocument', {'depth': -1})
        n = await c.send('DOM.querySelector', {'nodeId': doc['root']['nodeId'], 'selector': sel})
        r = await c.send('CSS.getMatchedStylesForNode', {'nodeId': n['nodeId']})
        for m in r['matchedCSSRules']:
            rule = m['rule']; sels = rule['selectorList']['text']
            decl = [(x['name'], x['value']) for x in rule['style']['cssProperties'] if x.get('text') and (not props or x['name'] in props)]
            if decl: print('##', sels[:200]); [print('   ', a, ':', v[:160]) for a, v in decl]
        await b.close()
asyncio.run(main())
