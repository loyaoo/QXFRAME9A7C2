# specdiff.py ref.json qx.json [styles] [keys-filter]
import json, sys, re
R = json.load(open(sys.argv[1])); Q = json.load(open(sys.argv[2]))
styles = sys.argv[3].split(',') if len(sys.argv) > 3 and sys.argv[3] else ['vega','nova','maia','lyra','mira','luma','sera','rhea']
filt = sys.argv[4] if len(sys.argv) > 4 else ''
F = ['h','rad','pt','pl','pb','bw','bbw','fs','fw','lh','gap','bg','bc','tt','ls','sh']
def num(v):
    m = re.match(r'^(-?[\d.e+]+)px$', str(v)); return float(m.group(1)) if m else None
IGN = {'button-xs','button-sm','button-default','button-lg','badge','select','controls','misc','tabs','input','input-group'}
def col(c):
    c = str(c).strip()
    if c in ('transparent',) or re.search(r'(rgba\(0, 0, 0, 0\)|/ 0\)$)', c): return 'T'
    m = re.match(r'okl(?:ch|ab)\(([\d.]+) 0 0( / ([\d.]+))?\)$', c)
    if m: return f"L{float(m.group(1)):.3f}a{m.group(3) or 1}"
    return c
def shn(v):
    v = str(v)
    if v == 'none': return 'none'
    parts = re.split(r',\s*(?![^()]*\))', v)
    keep = [x for x in parts if not re.search(r'(rgba\(0, 0, 0, 0\)|/ 0\))', x) and not re.search(r' 0px 0px 0px 0px', x)]
    return 'none' if not keep else 'sh'
def same(f, a, b):
    if f in ('bg','bc'): return col(a) == col(b)
    if f == 'sh': return shn(a) == shn(b)
    if f == 'rad':
        a, b = min(num(a) or 0, 999), min(num(b) or 0, 999); return abs(a - b) <= 0.6
    na, nb = num(a), num(b)
    if na is not None and nb is not None: return abs(na - nb) <= (1.1 if f == 'h' else 0.6)
    return a == b
tot = 0
for st in styles:
    r, q = R[st], Q.get(st, {})
    bad = []
    for k in r:
        if filt and not re.search(filt, k): continue
        if k not in q: bad.append(f"  {k}: MISSING"); continue
        if k in IGN: continue
        ff = [f for f in F if not (f == 'bc' and num(r[k]['bw']) == 0 and num(q[k]['bw']) == 0)]
        d = [f"{f}:{r[k][f]}→{q[k][f]}" for f in ff if not same(f, r[k][f], q[k][f])]
        if d: bad.append(f"  {k}: " + '  '.join(x[:70] for x in d))
    tot += len(bad); print(f"== {st}: {len(bad)} slots differ"); print('\n'.join(bad))
print('TOTAL', tot)
