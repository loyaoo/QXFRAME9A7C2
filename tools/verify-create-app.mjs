// createApp (docs/create) static + model gate, v3 §2–§5. Fast, no browser.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs/create');
const read = rel => fs.readFileSync(path.join(dir, rel), 'utf8');
const ONLINE_JS = 'https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js';
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

const FILES = ['index.html', 'app.css', 'app.js', 'model.js', 'data.js', 'themes.js', 'preview-01.html', 'preview-02.html', 'preview.css', 'preview.js', 'preview-cards.js'];
check('files', () => { for (const f of FILES) assert.ok(fs.existsSync(path.join(dir, f)), 'missing docs/create/' + f); });

check('pages load the online qxframe.js and the local qxframe.css only', () => {
  for (const page of ['index.html', 'preview-01.html', 'preview-02.html']) {
    const html = read(page);
    const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    assert.ok(refs.includes(ONLINE_JS), page + ' must load ' + ONLINE_JS);
    assert.ok(refs.includes('../../dist/qxframe9a7c2.css'), page + ' must load ../../dist/qxframe9a7c2.css');
    const external = refs.filter(r => /^https?:/i.test(r) && r !== ONLINE_JS);
    assert.deepEqual(external, [], page + ' must not load other network resources (v3 §3.2: no online fonts)');
    for (const ref of refs.filter(r => !/^(https?:|#|data:|mailto:)/i.test(r))) {
      assert.ok(fs.existsSync(path.resolve(dir, ref.split(/[?#]/)[0])), page + ' references a missing file: ' + ref);
    }
  }
});

check('no network fonts or @import in createApp styles', () => {
  for (const css of ['app.css', 'preview.css']) {
    const text = read(css);
    assert.doesNotMatch(text, /@import|@font-face|url\(\s*["']?https?:/i, css + ' must not load remote fonts or stylesheets');
  }
});

check('createApp private styles never enter qxframe.css', () => {
  const dist = path.join(root, 'dist/qxframe9a7c2.css');
  const source = fs.existsSync(dist) ? fs.readFileSync(dist, 'utf8') : '';
  assert.doesNotMatch(source, /\.(?:create|pv)-[a-z]/, 'qxframe.css must not contain createApp-private .create-* / .pv-* rules (v3 §2)');
});

const model = await import(pathToFileURL(path.join(dir, 'model.js')).href);
const data = await import(pathToFileURL(path.join(dir, 'data.js')).href);

check('option tables match v3 §4', () => {
  assert.deepEqual(data.STYLES.map(s => s.value), ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea']);
  assert.deepEqual(data.BASE_COLORS, ['neutral', 'stone', 'zinc', 'mauve', 'olive', 'mist', 'taupe']);
  assert.equal(Object.keys(data.THEMES).length, 24);
  assert.deepEqual(data.FONTS.map(f => f.value), ['system', 'sans', 'serif', 'mono']);
  assert.deepEqual(data.RADII.map(r => r.rem), [null, '0rem', '0.25rem', '0.45rem', '0.625rem', '0.875rem', '1.125rem']);
  for (const axis of data.ALL_EXT_AXES) {
    assert.ok(axis.options.length <= 7, axis.key + ' has more than 7 levels');
    for (const style of Object.keys(data.STYLE_PRESETS)) assert.ok(axis.defaults[style] !== undefined, axis.key + ' lacks a default for ' + style);
  }
  for (const axis of data.EXT_AXES.filter(a => !['keyboardFocus', 'pointerFocus'].includes(a.key))) {
    for (const [style, value] of Object.entries(axis.defaults)) assert.ok(axis.options.some(o => o.value === value), `${axis.key}.${style} default ${value} is not an option`);
  }
});

check('default configuration is Nova + neutral (v3 §5.10)', () => {
  const c = model.defaultConfig();
  assert.equal(c.style, 'nova'); assert.equal(c.baseColor, 'neutral'); assert.equal(c.theme, 'neutral');
  assert.equal(model.serializeConfig(c), '');
});

check('normalization follows shadcn rules', () => {
  const c = model.normalizeConfig({ baseColor: 'stone', theme: 'neutral', chartColor: 'zinc', menuColor: 'default-translucent', menuAccent: 'bold', ext: { density: 'nope', padding: 'p28' } });
  assert.equal(c.theme, 'stone', 'theme outside the base color list falls back to the base color');
  assert.equal(c.chartColor, 'stone');
  assert.equal(c.menuAccent, 'subtle', 'translucent menu forces the subtle accent');
  assert.deepEqual(c.ext, { padding: 'p28' }, 'unknown extension values are dropped');
  assert.equal(model.normalizeConfig({ style: 'bogus' }).style, 'nova');
});

check('URL parameters round-trip readable configuration', () => {
  const c = model.normalizeConfig({ style: 'sera', radius: 'md', theme: 'rose', ext: { density: 'compact', shapeSwitch: 'square' } });
  const query = model.serializeConfig(c, '02');
  assert.equal(query, 'style=sera&theme=rose&radius=md&density=compact&shape-switch=square&item=02');
  const parsed = model.parseConfig('?' + query);
  assert.equal(model.serializeConfig(parsed.config), model.serializeConfig(c));
  assert.equal(parsed.item, '02');
});

check('follow-style resolution keeps explicit values', () => {
  const c = model.normalizeConfig({ style: 'mira', ext: { padding: 'p32' } });
  const r = model.resolveConfig(c);
  assert.equal(r.ext.density, 'dense', 'Mira follows the 28 density');
  assert.equal(r.ext.padding, 'p32', 'explicit value survives the style');
  const r2 = model.resolveConfig({ ...c, style: 'sera' });
  assert.equal(r2.ext.density, 'loose', 'unset axes follow the new style');
  assert.equal(r2.ext.padding, 'p32');
  assert.equal(model.resolveConfig(model.normalizeConfig({ style: 'lyra' })).radiusValue, 'none');
});

check('export header carries version, time and full readable configuration; import restores it', () => {
  const c = model.normalizeConfig({ style: 'luma', baseColor: 'mauve', theme: 'violet', chartColor: 'yellow', font: 'serif', fontHeading: 'mono', radius: 'xl', menuColor: 'inverted', menuAccent: 'bold', ext: { inputLook: 'borderless', motion: 'fast' } });
  const { css } = model.compileTheme(c, { version: '9.9.9', generatedAt: '2026-10-07T00:00:00.000Z' });
  assert.match(css, /^\/\*!\n \* QXFRAME9A7C2 THEME\n \* 框架版本: 9\.9\.9\n \* 生成时间: 2026-10-07T00:00:00\.000Z/);
  for (const param of [...Object.values(model.MAIN_PARAMS), ...data.ALL_EXT_AXES.map(a => a.param)]) assert.match(css, new RegExp(`\\(${param}\\): `), 'header lacks ' + param);
  const back = model.parseThemeHeader(css);
  assert.ok(back.ok, JSON.stringify(back.errors));
  assert.equal(model.serializeConfig(back.config), model.serializeConfig(c));
});

check('import reports reasons and never returns a config on error', () => {
  const none = model.parseThemeHeader(':root{--x:1}');
  assert.equal(none.ok, false); assert.match(none.errors[0], /头部注释/);
  const css = model.compileTheme(model.defaultConfig()).css;
  const bad = model.parseThemeHeader(css.replace('(density): follow', '(density): huge').replace('(style): nova', '(style): zeta'));
  assert.equal(bad.ok, false); assert.equal(bad.config, undefined);
  assert.ok(bad.errors.some(e => e.includes('density') && e.includes('huge')));
  assert.ok(bad.errors.some(e => e.includes('style') && e.includes('zeta')));
  const unknown = model.parseThemeHeader(css.replace('(density): follow', '(densty): follow'));
  assert.equal(unknown.ok, false); assert.ok(unknown.errors.some(e => e.includes('densty')));
});

check('shuffle: main panel only, locks kept, shadcn biases', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const base = model.normalizeConfig({ style: 'lyra', ext: { density: 'touch' } });
  for (let i = 0; i < 200; i++) {
    const next = model.randomizeConfig(base, new Set(['style', 'baseColor']), rand);
    assert.equal(next.style, 'lyra'); assert.equal(next.baseColor, 'neutral');
    assert.deepEqual(next.ext, { density: 'touch' }, 'shuffle never touches extension axes');
    assert.equal(next.font, 'mono', 'Lyra shuffles to the mono font');
    assert.equal(next.radius, 'none', 'Lyra shuffles to the square radius');
    assert.ok(data.themesForBaseColor(next.baseColor).includes(next.theme));
    const pairing = data.CHART_COLOR_PAIRINGS[next.theme];
    if (pairing) assert.ok(pairing.includes(next.chartColor), `chart ${next.chartColor} not paired with ${next.theme}`);
    if (data.isTranslucentMenu(next.menuColor)) assert.equal(next.menuAccent, 'subtle');
  }
});

check('reset: style preset + follow-style axes; locks kept', () => {
  const c = model.normalizeConfig({ style: 'sera', theme: 'rose', font: 'mono', radius: 'xl', ext: { density: 'touch', motion: 'none' } });
  const r = model.resetConfig(c, new Set(['font', 'motion']));
  assert.equal(r.style, 'sera'); assert.equal(r.baseColor, 'taupe'); assert.equal(r.theme, 'taupe'); assert.equal(r.fontHeading, 'serif');
  assert.equal(r.font, 'mono', 'locked main option is not reset');
  assert.equal(r.radius, 'default');
  assert.deepEqual(r.ext, { motion: 'none' }, 'unlocked axes return to follow-style, locked ones stay');
});

console.log(JSON.stringify({ ok: true, checks: checks.length, names: checks }));
