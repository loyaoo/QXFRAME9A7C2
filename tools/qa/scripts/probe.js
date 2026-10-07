(() => {
  const cs = (e) => getComputedStyle(e);
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 };
  const bgOf = (s) => s.backgroundColor;
  const hasBox = (e) => { const s = cs(e); return (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') || parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderBottomWidth) > 0 || (s.boxShadow && s.boxShadow !== 'none') };
  const box = (e) => { const r = e.getBoundingClientRect(), s = cs(e); return { x: Math.round(r.x), y: Math.round(r.y), w: +r.width.toFixed(1), h: +r.height.toFixed(1), rad: s.borderTopLeftRadius, pad: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(' '), bg: s.backgroundColor, bd: s.borderTopWidth + ' ' + s.borderTopColor, bdb: s.borderBottomWidth, sh: s.boxShadow === 'none' ? '' : s.boxShadow.slice(0, 60), tag: e.tagName.toLowerCase(), cls: (e.getAttribute('data-slot') || e.className.toString()).slice(0, 80) } };
  const own = (e) => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  const out = { texts: [], cards: [], inputs: [] };
  const isRef = !!document.querySelector('[data-slot=card]');
  const cards = [...document.querySelectorAll(isRef ? '[data-slot=card]' : '.qxframe9a7c2-card')].filter(vis);
  for (const c of cards) {
    const t = c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
    const s = cs(c), b = box(c);
    const footer = c.querySelector(isRef ? '[data-slot=card-footer]' : '.qxframe9a7c2-card-footer');
    const header = c.querySelector(isRef ? '[data-slot=card-header]' : '.qxframe9a7c2-card-header');
    const title = c.querySelector(isRef ? '[data-slot=card-title]' : '.qxframe9a7c2-card-title');
    const desc = c.querySelector(isRef ? '[data-slot=card-description]' : '.qxframe9a7c2-card-description');
    const f = (e) => e ? { ...box(e), fs: cs(e).fontSize, fw: cs(e).fontWeight, lh: cs(e).lineHeight, bdt: cs(e).borderTopWidth + ' ' + cs(e).borderTopColor, fam: cs(e).fontFamily.slice(0, 20), tt: cs(e).textTransform, ls: cs(e).letterSpacing } : null;
    out.cards.push({ key: t, ...b, ring: s.boxShadow.slice(0, 80), outline: s.outline, gap: s.rowGap, header: f(header), title: f(title), desc: f(desc), footer: f(footer) });
  }
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e) || ['SCRIPT', 'STYLE', 'svg', 'path'].includes(e.tagName)) continue;
    const t = own(e); if (!t || t.length > 50) continue;
    let b = e, k = 0; while (b && k < 3 && !hasBox(b) && !['BUTTON', 'INPUT'].includes(b.tagName)) { b = b.parentElement; k++ }
    const s = cs(e);
    out.texts.push({ t, fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, col: s.color, tt: s.textTransform, ls: s.letterSpacing, box: (b && (hasBox(b) || ['BUTTON'].includes(b.tagName))) ? box(b) : null, y: Math.round(e.getBoundingClientRect().y) });
  }
  for (const e of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea')) {
    if (!vis(e)) continue; let b = e, k = 0; while (b && k < 3 && !hasBox(b)) { b = b.parentElement; k++ }
    out.inputs.push({ t: e.placeholder || e.value, tag: e.tagName, fs: cs(e).fontSize, box: box(b || e) });
  }
  return out;
})()
