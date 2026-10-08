// createApp configuration model and theme compiler (v3 §3–§5). Pure functions only (no DOM),
// shared by app.js and tools/verify-create-app.mjs.
// compileTheme() writes the closed --qxframe9a7c2-theme-* list (tokens.js) via compiler.js.
import { buildPalette, themeBody } from './compiler.js';
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
  const resolved = { ...config, ext: {}, explicit: { ...config.ext } };
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
/* Theme export                                                        */
/* ------------------------------------------------------------------ */

export { buildPalette };

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
  const body = themeBody({ ...resolveConfig(config), explicit: config.ext });
  const header = [
    '/*!',
    ` * ${HEADER_MARK}`,
    ` * 框架版本: ${version}`,
    ` * 生成时间: ${generatedAt}`,
    ' * 生成工具: QXFRAME9A7C2 Create (docs/create)',
    ' * 配置:',
    ...configSummary(config).map(line => ' *   ' + line),
    ' * 内容: --qxframe9a7c2-theme-* 封闭清单全量输出（:root 和 .dark 各自包含完整 token 清单）。',
    ' */'
  ].join('\n');
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
  const configStart = lines.findIndex(line => /^\s*\*\s*配置:\s*$/.test(line));
  const configEnd = lines.findIndex((line, index) => index > configStart && /^\s*\*\s*内容:/.test(line));
  if (configStart < 0 || configEnd <= configStart) {
    return { ok: false, errors: ['主题头部的配置区块不完整；请导入完整的当前版本主题 CSS。'] };
  }
  for (let i = configStart + 1; i < configEnd; i++) {
    const line = lines[i];
    if (/^\s*\*\s*$/.test(line)) continue;
    const match = /^\s*\*\s+[^\r\n]*?\(([a-z-]+)\):\s*([^\s#]+)(?:\s*(?:#.*)?)?$/.exec(line);
    if (!match) { errors.push(`第 ${i + 1} 行：配置格式无效。`); continue; }
    const [, param, value] = match;
    const target = byParam.get(param);
    if (!target) { errors.push(`第 ${i + 1} 行：未知配置项 "${param}"。`); continue; }
    if (seen.has(param)) { errors.push(`第 ${i + 1} 行：配置项 "${param}" 重复。`); continue; }
    seen.add(param);
    if (target.main) raw[target.main] = value;
    else if (value !== 'follow') raw.ext[target.axis.key] = value;
  }
  for (const param of byParam.keys()) {
    if (!seen.has(param)) errors.push(`缺少必需配置项 "${param}"；不能通过自动填充默认值导入不完整主题。`);
  }
  for (const key of MAIN_KEYS) {
    if (raw[key] === undefined) continue;
    const allowed = mainOptions(key, raw.baseColor ? raw : { baseColor: 'neutral' });
    if (!allowed.includes(raw[key])) errors.push(`${MAIN_LABELS[key]} (${MAIN_PARAMS[key]})：无效取值 "${raw[key]}"，可选：${allowed.join(' / ')}。`);
  }
  for (const [key, value] of Object.entries(raw.ext)) {
    const axis = axisByKey(key);
    if (!axis.options.some(o => o.value === value)) errors.push(`${axis.label} (${axis.param})：无效取值 "${value}"，可选：follow / ${axis.options.map(o => o.value).join(' / ')}。`);
  }
  if (raw.menuColor && isTranslucentMenu(raw.menuColor) && raw.menuAccent === 'bold') {
    errors.push('半透明菜单只支持柔和强调；导入配置项互相冲突。');
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
  // Base color is a domain for theme/chart. Filter it before shuffling so
  // locked values remain intact instead of being silently normalized away.
  if (!keep('baseColor')) {
    const candidates = BASE_COLORS.filter(base => {
      const available = themesForBaseColor(base);
      return (!keep('theme') || available.includes(current.theme))
        && (!keep('chartColor') || available.includes(current.chartColor));
    });
    if (candidates.length) next.baseColor = chooseFrom(candidates);
  }
  const themes = themesForBaseColor(next.baseColor);
  if (!keep('theme')) next.theme = chooseFrom(themes);
  if (!keep('chartColor')) {
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
  // Reset must honor locked theme/chart too: do not choose a base whose
  // derived options would invalidate either locked color.
  const compatible = color => themesForBaseColor(next.baseColor).includes(color);
  if ((locks.has('theme') && !compatible(current.theme))
      || (locks.has('chartColor') && !compatible(current.chartColor))) {
    next.baseColor = current.baseColor;
  }
  if (locks.has('menuAccent') && current.menuAccent === 'bold'
      && isTranslucentMenu(next.menuColor)) next.menuColor = current.menuColor;
  for (const axis of ALL_EXT_AXES) if (locks.has(axis.key) && current.ext[axis.key] !== undefined) next.ext[axis.key] = current.ext[axis.key];
  return normalizeConfig(next);
}

