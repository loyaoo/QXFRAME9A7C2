// createApp configuration model and theme compiler (v3 §3–§5). Pure functions only (no DOM),
// shared by app.js and tools/verify-create-app.mjs.
// Stage 1: compileTheme() maps the configuration onto the existing v2 theme inputs as a
// temporary bridge; stage 2 replaces it with the closed --qxframe9a7c2-theme-* list.
import {
  THEMES, STYLES, BASE_COLORS, themesForBaseColor, CHART_COLOR_PAIRINGS, FONTS, HEADING_FONTS, RADII,
  MENU_COLORS, MENU_ACCENTS, isTranslucentMenu, isInvertedMenu, STYLE_PRESETS, STYLE_RADIUS, MAIN_DEFAULTS,
  MAIN_KEYS, EXT_AXES, SHAPE_AXES, EXT_GROUPS, ALL_EXT_AXES
} from './data.js';

// URL parameter names for the main panel (readable, shareable).
export const MAIN_PARAMS = {
  style: 'style', baseColor: 'base', theme: 'theme', chartColor: 'chart', fontHeading: 'heading',
  font: 'font', radius: 'radius', menuColor: 'menu', menuAccent: 'accent'
};
export const MAIN_LABELS = {
  style: '风格', baseColor: '基础色', theme: '主题色', chartColor: '图表色', fontHeading: '标题字体',
  font: '正文字体', radius: '圆角', menuColor: '菜单', menuAccent: '菜单强调'
};
export const PREVIEW_ITEMS = { '01': './preview-01.html', '02': './preview-02.html' };

/* ------------------------------------------------------------------ */
/* Configuration model                                                 */
/* ------------------------------------------------------------------ */

function mainOptions(key, config) {
  switch (key) {
    case 'style': return STYLES.map(s => s.value);
    case 'baseColor': return BASE_COLORS;
    case 'theme':
    case 'chartColor': return themesForBaseColor(config ? config.baseColor : 'neutral');
    case 'font': return FONTS.map(f => f.value);
    case 'fontHeading': return HEADING_FONTS.map(f => f.value);
    case 'radius': return RADII.map(r => r.value);
    case 'menuColor': return MENU_COLORS.map(m => m.value);
    case 'menuAccent': return MENU_ACCENTS.map(m => m.value);
    default: return [];
  }
}

function axisByKey(key) { return ALL_EXT_AXES.find(axis => axis.key === key); }

export function defaultConfig() {
  return { ...MAIN_DEFAULTS, ext: {} };
}

// Make a configuration self-consistent (shadcn rules): theme/chart must belong to the base
// color's list and a translucent menu forces the subtle accent.
export function normalizeConfig(input) {
  const base = defaultConfig();
  const config = { ...base, ...(input || {}), ext: { ...((input && input.ext) || {}) } };
  for (const key of ['style', 'baseColor', 'font', 'fontHeading', 'radius', 'menuColor', 'menuAccent']) {
    if (!mainOptions(key, config).includes(config[key])) config[key] = base[key];
  }
  const themes = themesForBaseColor(config.baseColor);
  if (!themes.includes(config.theme)) config.theme = config.baseColor;
  if (!themes.includes(config.chartColor)) config.chartColor = config.theme;
  if (isTranslucentMenu(config.menuColor)) config.menuAccent = 'subtle';
  for (const key of Object.keys(config.ext)) {
    const axis = axisByKey(key);
    if (!axis || !axis.options.some(o => o.value === config.ext[key])) delete config.ext[key];
  }
  return config;
}

// Fill "跟随风格" values from the current style.
export function resolveConfig(config) {
  const resolved = { ...config, ext: {} };
  for (const axis of ALL_EXT_AXES) resolved.ext[axis.key] = config.ext[axis.key] ?? axis.defaults[config.style];
  resolved.radiusValue = config.radius === 'default' ? STYLE_RADIUS[config.style] : config.radius;
  return resolved;
}

export function serializeConfig(config, item) {
  const params = new URLSearchParams();
  for (const key of MAIN_KEYS) {
    if (config[key] !== MAIN_DEFAULTS[key]) params.set(MAIN_PARAMS[key], config[key]);
  }
  for (const axis of ALL_EXT_AXES) {
    if (config.ext[axis.key] !== undefined) params.set(axis.param, config.ext[axis.key]);
  }
  if (item && item !== '01') params.set('item', item);
  return params.toString();
}

export function parseConfig(query) {
  const params = new URLSearchParams(query);
  const raw = { ext: {} };
  for (const key of MAIN_KEYS) {
    const value = params.get(MAIN_PARAMS[key]);
    if (value !== null) raw[key] = value;
  }
  for (const axis of ALL_EXT_AXES) {
    const value = params.get(axis.param);
    if (value !== null) raw.ext[axis.key] = value;
  }
  const item = params.get('item');
  return { config: normalizeConfig(raw), item: PREVIEW_ITEMS[item] ? item : null, hasParams: [...params.keys()].length > 0 };
}

/* ------------------------------------------------------------------ */
/* Theme compiler (stage-1 bridge onto the existing v2 theme inputs)   */
/* ------------------------------------------------------------------ */

const V2 = '--qxframe9a7c2-theme-v2-';
const COLOR_ROLE_MAP = {
  background: 'background', foreground: 'foreground', card: 'card', 'card-foreground': 'card-foreground',
  popover: 'popover', 'popover-foreground': 'popover-foreground', primary: 'primary', 'primary-foreground': 'primary-foreground',
  secondary: 'secondary', 'secondary-foreground': 'secondary-foreground', muted: 'muted', 'muted-foreground': 'muted-foreground',
  accent: 'accent', 'accent-foreground': 'accent-foreground', destructive: 'error', border: 'border', input: 'input', ring: 'ring',
  sidebar: 'sidebar', 'sidebar-foreground': 'sidebar-foreground',
  'chart-1': 'chart-1', 'chart-2': 'chart-2', 'chart-3': 'chart-3', 'chart-4': 'chart-4', 'chart-5': 'chart-5'
};

// shadcn buildRegistryTheme: base color + theme overrides + chart colors + menu accent.
export function buildPalette(config) {
  const base = THEMES[config.baseColor];
  const theme = THEMES[config.theme];
  const chart = THEMES[config.chartColor];
  const light = { ...base.light, ...theme.light };
  const dark = { ...base.dark, ...theme.dark };
  for (let i = 1; i <= 5; i++) {
    if (chart.light['chart-' + i]) light['chart-' + i] = chart.light['chart-' + i];
    if (chart.dark['chart-' + i]) dark['chart-' + i] = chart.dark['chart-' + i];
  }
  if (config.menuAccent === 'bold') {
    light.accent = light.primary; light['accent-foreground'] = light['primary-foreground'];
    dark.accent = dark.primary; dark['accent-foreground'] = dark['primary-foreground'];
  }
  return { light, dark };
}

const DENSITY_REM = { dense: 1.75, compact: 2, standard: 2.25, loose: 2.5, touch: 2.75 };
const PADDING_REM = { p12: 0.75, p16: 1, p20: 1.25, p24: 1.5, p28: 1.75, p32: 2 };
const TYPE_REM = { compact: [0.75, 0.875], standard: [0.875, 1], roomy: [1, 1.125] };
const SWITCH_REM = { standard: [2, 1.15], compact: [1.75, 1.0375], wide: [2.75, 1.25], tall: [2, 1.25], square: [2.0625, 1.125] };
const SLIDER_REM = { t2: 0.125, t4: 0.25, t6: 0.375, t8: 0.5, t12: 0.75 };
const SHADOW_CARD = { none: 'none', light: 'var(--qxframe9a7c2-theme-v2-shadow-xs)', medium: 'var(--qxframe9a7c2-theme-v2-shadow-sm)', strong: 'var(--qxframe9a7c2-theme-v2-shadow-md)', heavy: 'var(--qxframe9a7c2-theme-v2-shadow-elevated)' };
const rem = value => (Math.round(value * 10000) / 10000) + 'rem';

function themeDeclarations(config) {
  const resolved = resolveConfig(config);
  const palette = buildPalette(config);
  const decl = [];
  for (const [role, token] of Object.entries(COLOR_ROLE_MAP)) {
    const light = palette.light[role], dark = palette.dark[role];
    if (light && dark) decl.push([V2 + token, `light-dark(${light}, ${dark})`]);
  }
  if (isInvertedMenu(config.menuColor)) {
    decl.push([V2 + 'override-popup-background', `light-dark(${palette.dark.popover}, ${palette.dark.popover})`]);
    decl.push([V2 + 'override-popup-foreground', `light-dark(${palette.dark['popover-foreground']}, ${palette.dark['popover-foreground']})`]);
  }
  if (isTranslucentMenu(config.menuColor)) {
    const source = isInvertedMenu(config.menuColor) ? `light-dark(${palette.dark.popover}, ${palette.dark.popover})` : `light-dark(${palette.light.popover}, ${palette.dark.popover})`;
    decl.push([V2 + 'override-popup-background', `color-mix(in oklab, ${source} 80%, transparent)`]);
  }
  const body = FONTS.find(f => f.value === config.font).stack;
  const heading = config.fontHeading === 'inherit' ? body : HEADING_FONTS.find(f => f.value === config.fontHeading).stack;
  decl.push([V2 + 'font-family', body], [V2 + 'font-family-heading', heading]);
  if (config.radius !== 'default') {
    const radius = RADII.find(r => r.value === resolved.radiusValue);
    const r = parseFloat(radius.rem);
    decl.push([V2 + 'radius-control-md', rem(r * 0.8)], [V2 + 'radius-action-md', rem(r * 0.8)], [V2 + 'radius-choice-md', rem(r * 0.6)],
      [V2 + 'radius-surface-md', rem(r * 1.4)], [V2 + 'radius-popup-md', rem(r * 1.4)]);
  }
  const ext = config.ext;
  if (ext.density) decl.push([V2 + 'control-min-block-md', rem(DENSITY_REM[ext.density])]);
  if (ext.padding) decl.push([V2 + 'surface-padding-md', rem(PADDING_REM[ext.padding])]);
  if (ext.typography) {
    const [bodySize, headingSize] = TYPE_REM[ext.typography];
    decl.push([V2 + 'typography-body-size', rem(bodySize)], [V2 + 'card-font-size', rem(bodySize)], [V2 + 'typography-heading-size', rem(headingSize)]);
  }
  if (ext.textStyle === 'editorial') {
    decl.push([V2 + 'control-text-transform', 'uppercase'], [V2 + 'control-letter-spacing', '0.1em'], [V2 + 'control-font-weight', '600'],
      [V2 + 'heading-text-transform', 'uppercase'], [V2 + 'heading-letter-spacing', '0.05em']);
  } else if (ext.textStyle === 'regular') {
    decl.push([V2 + 'control-text-transform', 'none'], [V2 + 'control-letter-spacing', 'normal'], [V2 + 'heading-text-transform', 'none'], [V2 + 'heading-letter-spacing', 'normal']);
  }
  if (ext.switchLook) {
    const [width, height] = SWITCH_REM[ext.switchLook];
    decl.push([V2 + 'switch-width-md', rem(width)], [V2 + 'switch-height-md', rem(height)]);
  }
  if (ext.sliderLook) decl.push([V2 + 'slider-track-md', rem(SLIDER_REM[ext.sliderLook])]);
  if (ext.shadow) decl.push([V2 + 'card-shadow', SHADOW_CARD[ext.shadow]]);
  return decl;
}

function configSummary(config) {
  const resolved = resolveConfig(config);
  const lines = [];
  const label = (key, value) => {
    switch (key) {
      case 'style': return STYLES.find(s => s.value === value).label;
      case 'baseColor': case 'theme': case 'chartColor': return THEMES[value].title;
      case 'font': return FONTS.find(f => f.value === value).label;
      case 'fontHeading': return HEADING_FONTS.find(f => f.value === value).label;
      case 'radius': return RADII.find(r => r.value === value).label;
      case 'menuColor': return MENU_COLORS.find(m => m.value === value).label;
      case 'menuAccent': return MENU_ACCENTS.find(m => m.value === value).label;
      default: return value;
    }
  };
  for (const key of MAIN_KEYS) lines.push(`${MAIN_LABELS[key]} (${MAIN_PARAMS[key]}): ${config[key]}  # ${label(key, config[key])}`);
  for (const axis of ALL_EXT_AXES) {
    const explicit = config.ext[axis.key];
    const value = explicit ?? resolved.ext[axis.key];
    const optionLabel = (axis.options.find(o => o.value === value) || {}).label || value;
    lines.push(`${axis.label} (${axis.param}): ${explicit === undefined ? 'follow' : explicit}  # ${explicit === undefined ? '跟随风格 → ' : ''}${optionLabel}`);
  }
  return lines;
}

export const HEADER_MARK = 'QXFRAME9A7C2 THEME';

export function compileTheme(config, { version = 'unknown', generatedAt = new Date().toISOString() } = {}) {
  const decl = themeDeclarations(config);
  const header = [
    '/*!',
    ` * ${HEADER_MARK}`,
    ` * 框架版本: ${version}`,
    ` * 生成时间: ${generatedAt}`,
    ' * 生成工具: QXFRAME9A7C2 Create (docs/create)',
    ' * 配置:',
    ...configSummary(config).map(line => ' *   ' + line),
    ' * 注意: 第 1 阶段临时输出，映射到现有 v2 主题输入；第 2 阶段改为 --qxframe9a7c2-theme-* 封闭清单。',
    ' */'
  ].join('\n');
  const body = `@scope (:root) {\n  :scope {\n${decl.map(([prop, value]) => `    ${prop}: ${value};`).join('\n')}\n  }\n}\n`;
  return { css: `${header}\n${body}`, body, header };
}

// Parse a previously exported theme: only the header comment carries the configuration.
export function parseThemeHeader(text) {
  const errors = [];
  const source = String(text || '');
  const start = source.indexOf('/*');
  const end = start >= 0 ? source.indexOf('*/', start) : -1;
  if (start < 0 || end < 0 || !source.slice(start, end).includes(HEADER_MARK)) {
    return { ok: false, errors: ['未找到 QXFRAME9A7C2 主题头部注释（以 "/*! QXFRAME9A7C2 THEME" 开头）。请粘贴从“获取代码”导出的完整 CSS。'] };
  }
  const lines = source.slice(start, end).split(/\r?\n/);
  const raw = { ext: {} };
  const seen = new Set();
  const byParam = new Map([
    ...MAIN_KEYS.map(key => [MAIN_PARAMS[key], { main: key }]),
    ...ALL_EXT_AXES.map(axis => [axis.param, { axis }])
  ]);
  lines.forEach((line, index) => {
    const match = /^\s*\*\s+.*?\(([a-z-]+)\):\s*([^\s#]+)/.exec(line);
    if (!match) return;
    const [, param, value] = match;
    const target = byParam.get(param);
    if (!target) { errors.push(`第 ${index + 1} 行：未知配置项 "${param}"。`); return; }
    seen.add(param);
    if (target.main) raw[target.main] = value;
    else if (value !== 'follow') raw.ext[target.axis.key] = value;
  });
  if (!seen.size) errors.push('头部注释中没有任何配置项。');
  for (const key of MAIN_KEYS) {
    if (raw[key] === undefined) continue;
    const allowed = mainOptions(key, raw.baseColor ? raw : { baseColor: 'neutral' });
    if (!allowed.includes(raw[key])) errors.push(`${MAIN_LABELS[key]} (${MAIN_PARAMS[key]})：无效取值 "${raw[key]}"，可选：${allowed.join(' / ')}。`);
  }
  for (const [key, value] of Object.entries(raw.ext)) {
    const axis = axisByKey(key);
    if (!axis.options.some(o => o.value === value)) errors.push(`${axis.label} (${axis.param})：无效取值 "${value}"，可选：follow / ${axis.options.map(o => o.value).join(' / ')}。`);
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, config: normalizeConfig(raw) };
}

/* ------------------------------------------------------------------ */
/* Shuffle (main panel only; extension axes untouched; locks kept)     */
/* ------------------------------------------------------------------ */


export function randomizeConfig(current, locks, rand = Math.random) {
  const chooseFrom = list => list[Math.floor(rand() * list.length)];
  const next = { ...current, ext: { ...current.ext } };
  const keep = key => locks.has(key);
  if (!keep('style')) next.style = chooseFrom(STYLES).value;
  if (!keep('baseColor')) next.baseColor = chooseFrom(BASE_COLORS);
  const themes = themesForBaseColor(next.baseColor);
  if (!keep('theme') || !themes.includes(next.theme)) next.theme = chooseFrom(themes);
  if (!keep('chartColor') || !themes.includes(next.chartColor)) {
    const pairing = CHART_COLOR_PAIRINGS[next.theme];
    const paired = pairing ? themes.filter(name => pairing.includes(name)) : [];
    next.chartColor = chooseFrom(paired.length ? paired : themes);
  }
  const fonts = next.style === 'lyra' ? FONTS.filter(f => f.value === 'mono') : FONTS;
  if (!keep('font')) next.font = chooseFrom(fonts).value;
  if (!keep('fontHeading')) {
    if (rand() < 0.7) next.fontHeading = 'inherit';
    else {
      const contrast = FONTS.filter(f => f.value !== next.font);
      next.fontHeading = chooseFrom(contrast).value;
    }
  }
  if (!keep('radius')) {
    let radii = RADII;
    if (next.style === 'lyra') radii = RADII.filter(r => r.value === 'none');
    else if (next.style === 'rhea') radii = RADII.filter(r => r.value !== 'lg' && r.value !== 'xl');
    next.radius = chooseFrom(radii).value;
  }
  if (!keep('menuColor')) {
    const menus = keep('menuAccent') && current.menuAccent === 'bold' ? MENU_COLORS.filter(m => !isTranslucentMenu(m.value)) : MENU_COLORS;
    next.menuColor = chooseFrom(menus).value;
  }
  if (isTranslucentMenu(next.menuColor)) next.menuAccent = 'subtle';
  else if (!keep('menuAccent')) next.menuAccent = chooseFrom(MENU_ACCENTS).value;
  return normalizeConfig(next);
}

// Reset: main panel back to the style preset, extension axes back to "跟随风格"; locks kept.
export function resetConfig(current, locks) {
  const preset = { ...STYLE_PRESETS[current.style], radius: 'default', menuColor: 'default', menuAccent: 'subtle' };
  const next = { ...current, ext: {} };
  for (const [key, value] of Object.entries(preset)) if (!locks.has(key)) next[key] = value;
  for (const axis of ALL_EXT_AXES) if (locks.has(axis.key) && current.ext[axis.key] !== undefined) next.ext[axis.key] = current.ext[axis.key];
  return normalizeConfig(next);
}

