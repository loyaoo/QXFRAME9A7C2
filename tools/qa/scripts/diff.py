import json, sys, re
from collections import defaultdict
R = json.load(open(sys.argv[1])); Q = json.load(open(sys.argv[2])); mode = sys.argv[3] if len(sys.argv) > 3 else 'all'
def k(c): return re.sub(r'\W', '', c['key'])[:14]
qc = {k(c): c for c in Q['cards']}
def px(v):
    try: return float(str(v).replace('px', ''))
    except: return v
if mode in ('all', 'cards'):
    print('CARD                     |  ref h / qx h | rad ref/qx | ring(ref) vs qx | title fs/fw ref->qx | desc fs | footer bg/bdt ref->qx')
    for c in R['cards']:
        q = qc.get(k(c))
        if not q: print('MISSING', c['key']); continue
        t = lambda x, f: (x[f] if x else '-')
        print(f"{c['key'][:24]:24} | {c['h']:6.0f}/{q['h']:6.0f} | {c['rad']:>5}/{q['rad']:>5} | {'ring' if 'rgba' in c['ring'] or 'rgb' in c['ring'] else 'none'}->{'sh' if q['ring'] and q['ring']!='none' else 'none'} bd={q['bd'][:20]} | {t(c['title'],'fs')}/{t(c['title'],'fw')}->{t(q['title'],'fs')}/{t(q['title'],'fw')} | {t(c['desc'],'fs')}->{t(q['desc'],'fs')} | {(c['footer'] or {}).get('bg','-')[:22]} {(c['footer'] or {}).get('bdt','-')[:5]} -> {(q['footer'] or {}).get('bg','-')[:22]} {(q['footer'] or {}).get('bdt','-')[:5]}")
if mode in ('all', 'texts'):
    qt = defaultdict(list)
    for x in Q['texts']: qt[x['t']].append(x)
    used = defaultdict(int)
    print('\nTEXT                         | fs ref/qx | fw | box h ref/qx | rad ref/qx | pad ref | pad qx | bg ref | bg qx')
    for x in R['texts']:
        L = qt.get(x['t']); 
        if not L: print(f"  [missing in qx] {x['t'][:40]}"); continue
        q = L[min(used[x['t']], len(L)-1)]; used[x['t']] += 1
        rb, qb = x['box'] or {}, q['box'] or {}
        issues = []
        if x['fs'] != q['fs']: issues.append('fs')
        if x['fw'] != q['fw']: issues.append('fw')
        if rb and qb and abs(rb['h'] - qb['h']) > 1.5 and rb['h'] < 80: issues.append('h')
        if rb and qb and rb['rad'] != qb['rad'] and rb['h'] < 80: issues.append('rad')
        if bool(rb) != bool(qb): issues.append('box')
        if not issues: continue
        print(f"{x['t'][:28]:28} | {x['fs']}/{q['fs']} | {x['fw']}/{q['fw']} | {rb.get('h','-')}/{qb.get('h','-')} | {rb.get('rad','-')}/{qb.get('rad','-')} | {rb.get('pad','-')} | {qb.get('pad','-')} | {rb.get('bg','-')[:18]} | {qb.get('bg','-')[:18]} {','.join(issues)}")
