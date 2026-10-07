# Generate per-style parity operands from the measured shadcn spec -> JS object literal.
import json, re, sys
d = json.load(open(sys.argv[1]))
ST = ['vega','nova','maia','lyra','mira','luma','sera','rhea']
BASE_R = 10.0  # shadcn default --radius .625rem
def px(v):
    v = str(v); 
    if 'e+' in v: return 'F'
    m = re.match(r'^(-?[\d.]+)px$', v); return float(m.group(1)) if m else v
def rem(v):
    v = float(v) if isinstance(v, (int, float)) else px(v)
    return f"{round(v/16, 5):g}rem" if isinstance(v, float) else v
def lvl(v):
    v = px(v)
    if v == 'F': return 'F'
    return round(v / BASE_R, 3)
out = {}
for s in ST:
    g = d[s]; t = {}
    def put(k, v): t[k] = v
    for sz, key in [('xs','xs'),('sm','sm'),('md','default'),('lg','lg')]:
        b = g[f'button-{key}-default']
        put(f'button-padding-{sz}', rem(b['pl'])); put(f'button-font-size-{sz}', rem(b['fs'])); put(f'button-line-height-{sz}', rem(b['lh']))
        put(f'button-gap-{sz}', rem(b['gap'])); put(f'button-radius-level-{sz}', lvl(b['rad']))
    bd = g['badge-default']
    put('badge-height', rem(bd['h'])); put('badge-padding-inline', rem(bd['pl'])); put('badge-padding-block', rem(bd['pt']))
    put('badge-font-size', rem(bd['fs'])); put('badge-line-height', rem(bd['lh'])); put('badge-font-weight', bd['fw'])
    r = lvl(bd['rad']); put('badge-radius-level', 0 if r == 'F' else r); put('badge-radius-full', 1 if r == 'F' else 0)
    put('badge-text-transform', bd['tt']); put('badge-letter-spacing', bd['ls'] if bd['ls'] == 'normal' else rem(bd['ls']))
    put('badge-fill-weight', '0%' if px(bd['pl']) == 0 else '100%')
    for sz, key in [('', 'default'), ('-sm', 'sm')]:
        c = g[f'card-{key}']; put(f'card-padding{sz}', rem(c['pt']) if px(c['pt']) else rem(g[f'card-header-{key}']['pl']))
        ti = g[f'card-title-{key}']; put(f'card-title-font-size{sz}', rem(ti['fs'])); put(f'card-title-line-height{sz}', rem(ti['lh']))
    c = g['card-default']; put('card-font-size', rem(c['fs'])); put('card-line-height', rem(c['lh']))
    put('card-title-font-weight', g['card-title-default']['fw'])
    de = g['card-desc-default']; put('card-description-font-size', rem(de['fs'])); put('card-description-line-height', rem(de['lh']))
    f = g['card-footer-default']; solid = px(f['bw']) > 0
    put('card-footer-border-width', '1px' if solid else '0px'); put('card-footer-solid', 1 if solid else 0)
    for sz, key in [('md','default'),('sm','sm'),('xs','xs')]:
        it = g[f'item-outline-{key}']
        put(f'item-padding-block-{sz}', rem(it['pt'])); put(f'item-padding-inline-{sz}', rem(it['pl'])); put(f'item-gap-{sz}', rem(it['cgap']))
        put(f'item-content-gap-{sz}', rem(g[f'item-content-outline-{key}']['gap']))
        de = g[f'item-desc-outline-{key}']; put(f'item-description-font-size-{sz}', rem(de['fs'])); put(f'item-description-line-height-{sz}', rem(de['lh']))
    ti = g['item-title-outline-default']; put('item-title-font-size', rem(ti['fs'])); put('item-title-line-height', rem(ti['lh'])); put('item-title-font-weight', ti['fw'])
    put('item-radius-level', lvl(g['item-outline-default']['rad']))
    tl, tt = g['tabs-list'], g['tabs-trigger-active']
    put('tabs-list-height', rem(tl['h'])); put('tabs-list-padding', rem(tl['pt']))
    r = lvl(tl['rad']); put('tabs-list-radius-level', 0 if r == 'F' else r); put('tabs-list-radius-full', 1 if r == 'F' else 0)
    r = lvl(tt['rad']); put('tabs-trigger-radius-level', 0 if r == 'F' else r); put('tabs-trigger-radius-full', 1 if r == 'F' else 0)
    put('tabs-trigger-padding-block', rem(tt['pt'])); put('tabs-trigger-padding-inline', rem(tt['pl'])); put('tabs-trigger-font-size', rem(tt['fs'])); put('tabs-trigger-font-weight', tt['fw'])
    put('tabs-active-shadow', 1 if 'rgba(0, 0, 0, 0.1)' in tt['sh'] else 0)
    put('field-group-gap', rem(g['field-group']['gap'])); put('field-gap', rem(g['field']['gap']))
    fl = g['field-label']; put('field-label-font-size', rem(fl['fs'])); put('field-label-line-height', rem(fl['lh'])); put('field-label-font-weight', fl['fw'])
    fd = g['field-desc']; put('field-description-font-size', rem(fd['fs'])); put('field-description-line-height', rem(fd['lh']))
    put('table-head-height', rem(g['table-head']['h'])); put('table-cell-padding', rem(g['table-cell']['pt'])); put('table-font-size', rem(g['table-cell']['fs']))
    put('checkbox-size', rem(g['checkbox']['h'])); put('checkbox-radius-level', lvl(g['checkbox']['rad']))
    k = g['kbd']; put('kbd-height', rem(k['h'])); put('kbd-padding-inline', rem(k['pl'])); put('kbd-font-size', rem(k['fs'])); put('kbd-radius-level', lvl(k['rad']))
    put('skeleton-radius-level', lvl(g['skeleton']['rad']))
    p = g['progress']; put('progress-height', rem(p['h'])); r = lvl(p['rad']); put('progress-radius-level', 0 if r == 'F' else r); put('progress-radius-full', 1 if r == 'F' else 0)
    e = g['empty']; put('empty-padding', rem(e['pl'])); em = g['empty-media']; put('empty-media-size', rem(em['h'])); put('empty-media-radius-level', lvl(em['rad']))
    et = g['empty-title']; put('empty-title-font-size', rem(et['fs'])); put('empty-title-line-height', rem(et['h'])); put('empty-title-font-weight', et['fw'])
    ed = g['empty-desc']; put('empty-description-font-size', rem(ed['fs'])); put('empty-description-line-height', rem(px(ed['lh'])) if False else rem(ed['lh']))
    a = g['alert']; put('alert-padding-block', rem(a['pt'])); put('alert-padding-inline', rem(a['pl'])); put('alert-radius-level', lvl(a['rad']))
    put('alert-font-size', rem(g['alert-desc']['fs'])); put('alert-line-height', rem(g['alert-desc']['lh'])); put('alert-title-font-weight', g['alert-title']['fw'])
    put('textarea-padding-block', rem(g['textarea']['pt'])); put('textarea-padding-inline', rem(g['textarea']['pl']))
    put('select-padding-inline', rem(g['select-trigger']['pl']))
    put('input-padding-inline', rem(g['input']['pl'])); put('input-padding-block', rem(g['input']['pt']))
    out[s] = t
def surf(bg):
    bg = str(bg)
    if bg.startswith('oklch(1 0 0)') or bg == 'oklch(0.145 0 0)': return ('100%', '0%')
    m = re.match(r'oklab\(([\d.]+) 0 0 / ([\d.]+)\)', bg)
    if m:
        a = float(m.group(2)); L = float(m.group(1))
        if L > .99: return ('0%', f"{round(a / .15 * 100):g}%")   # dark input = white/15%
        return ('0%', f"{round(a * 100):g}%")
    return ('0%', '0%')
mode = {}
for s in ST:
    mode[s] = {}
    for m, key in [('light', s), ('dark', s + '-dark')]:
        g = d[key]; o = g['button-default-outline']; bw, iw = surf(o['bg'])
        bo = g['badge-outline']; bbw, biw = surf(bo['bg'])
        mode[s][m] = {'button-outline-background-weight': bw, 'button-outline-input-weight': iw,
                      'button-outline-edge-input-weight': '100%' if ('0.15' in o['bc'] or (m == 'light' and False)) else '0%',
                      'badge-outline-input-weight': biw}
keys = list(out['nova'].keys())
print('/* Generated by tools/genparity.py from the measured shadcn Create spec (8 styles). Do not hand-edit values. */')
print('const PARITY=Object.freeze({')
for s in ST:
    print(f" {s}:{{" + ','.join(f"'{k}':{json.dumps(v)}" for k, v in out[s].items()) + '},')
print('});')
print('const PARITY_MODE=Object.freeze(' + json.dumps(mode, separators=(',', ':')) + ');')
print(f'/* {len(keys)} operands per style */', file=sys.stderr)
