const SCHEMA_VERSION = 1;
const GENERATOR_VERSION = '1.0.0-dev';

const PALETTE_KEYS = Object.freeze(['red','orange','yellow','lime','green','teal','cyan','blue','purple','pink','grey']);
const STYLE_IDS = Object.freeze(['vega','nova','maia','lyra','mira','luma','sera','rhea']);
const BASE_COLOR_IDS = Object.freeze(['neutral','stone','zinc','mauve','olive','mist','taupe','custom']);
const CHART_COLOR_IDS = Object.freeze(['primary','neutral','blue','cyan','teal','green','lime','yellow','orange','red','pink','purple']);
const BODY_FONT_IDS = Object.freeze(['system-ui','inter','humanist','serif']);
const HEADING_FONT_IDS = Object.freeze(['inherit','system-ui','inter','humanist','serif','mono']);
const MONO_FONT_IDS = Object.freeze(['ui-monospace','system-mono']);
const RADIUS_IDS = Object.freeze(['default','none','small','medium','large']);
const DENSITY_IDS = Object.freeze(['compact','default','comfortable']);
const MENU_COLOR_IDS = Object.freeze(['default','primary','inverted','neutral']);
const MENU_APPEARANCE_IDS = Object.freeze(['solid','soft','translucent']);
const MENU_ACCENT_IDS = Object.freeze(['subtle','balanced','strong']);

const DEFAULT_CONFIG = deepFreeze({
  schema: SCHEMA_VERSION,
  name: 'qxframe-theme',
  style: 'balanced',
  baseColor: 'neutral',
  palette: Object.fromEntries(PALETTE_KEYS.map(key => [key, null])),
  roles: {
    primary: 'blue',
    success: 'green',
    warning: 'orange',
    error: 'red',
    info: 'cyan'
  },
  chart: { color: 'primary' },
  typography: {
    body: 'system-ui',
    heading: 'inherit',
    mono: 'ui-monospace',
    baseSize: 14
  },
  radius: 'medium',
  density: 'default',
  components: {
    menu: {
      color: 'default',
      appearance: 'solid',
      accent: 'subtle'
    }
  },
  advanced: {
    overrides: {}
  }
});

const STYLE_PRESETS = deepFreeze({
  vega: { label:'Vega', description:'Clean, neutral, and familiar.', defaultRadius:'medium' },
  nova: { label:'Nova', description:'Reduced padding and margins.', defaultRadius:'medium' },
  maia: { label:'Maia', description:'Rounded, with generous spacing.', defaultRadius:'medium' },
  lyra: { label:'Lyra', description:'Boxy and sharp. For mono fonts.', defaultRadius:'none', radiusLocked:true },
  mira: { label:'Mira', description:'Made for compact interfaces.', defaultRadius:'medium' },
  luma: { label:'Luma', description:'Fluid, luminous, and soft.', defaultRadius:'medium' },
  sera: { label:'Sera', description:'Editorial and typographic.', defaultRadius:'none', radiusLocked:true },
  rhea: { label:'Rhea', description:'Like Luma but compact.', defaultRadius:'medium', disallowLargeRadius:true }
});

const TOP_KEYS = new Set(['schema','name','style','baseColor','palette','roles','chart','typography','radius','density','components','advanced']);
const ROLE_KEYS = new Set(['primary','success','warning','error','info']);
const CHART_KEYS = new Set(['color','preset']);
const TYPE_KEYS = new Set(['body','heading','mono','baseSize']);
const COMPONENT_KEYS = new Set(['menu']);
const MENU_KEYS = new Set(['color','appearance','accent']);
const ADVANCED_KEYS = new Set(['overrides']);

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone);
  if (!plain(value)) return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) out[key] = deepClone(item);
  return out;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) deepFreeze(item);
  return value;
}

function assertObject(value, path) {
  if (!plain(value)) throw new TypeError(path + ' must be an object.');
}

function assertKnownKeys(value, allowed, path) {
  assertObject(value, path);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError('Unknown config key: ' + path + '.' + key);
  }
}

function enumValue(value, allowed, fallback, path) {
  const next = value == null ? fallback : String(value);
  if (!allowed.includes(next)) throw new TypeError(path + ' must be one of: ' + allowed.join(', '));
  return next;
}

function normalizeName(value) {
  const next = String(value == null ? DEFAULT_CONFIG.name : value).trim();
  if (!next || next.length > 64 || /[\r\n]/.test(next) || next.includes('*/')) {
    throw new TypeError('name must be 1-64 characters without line breaks or CSS comment terminators.');
  }
  return next;
}

function looksLikeColor(value) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{3,8}$/i.test(text)
    || /^rgba?\(/i.test(text)
    || /^hsla?\(/i.test(text)
    || /^oklch\(/i.test(text)
    || /^oklab\(/i.test(text);
}

function normalizeColorOrPalette(value, path) {
  const text = String(value == null ? '' : value).trim().toLowerCase();
  if (PALETTE_KEYS.includes(text) || ['azure','gray','white','black'].includes(text)) return text;
  if (looksLikeColor(value)) return String(value).trim();
  throw new TypeError(path + ' must be a palette id or HEX/RGB/HSL/OKLCH color.');
}
function normalizeSeedColor(value,path){
  if(looksLikeColor(value))return String(value).trim();
  throw new TypeError(path + ' must be a HEX/RGB/HSL/OKLCH color seed.');
}

function normalizePalette(input) {
  const source = input == null ? {} : input;
  assertKnownKeys(source, new Set(PALETTE_KEYS), 'palette');
  const result = {};
  for (const key of PALETTE_KEYS) {
    const value = source[key];
    result[key] = value == null || value === '' ? null : normalizeSeedColor(value, 'palette.' + key);
  }
  return result;
}

function normalizeRoles(input) {
  const source = input == null ? {} : input;
  assertKnownKeys(source, ROLE_KEYS, 'roles');
  const result = {};
  for (const key of ROLE_KEYS) {
    result[key] = normalizeColorOrPalette(source[key] == null ? DEFAULT_CONFIG.roles[key] : source[key], 'roles.' + key);
  }
  return result;
}

function normalizeOverrides(input) {
  const source = input == null ? {} : input;
  assertObject(source, 'advanced.overrides');
  const result = {};
  for (const key of Object.keys(source).sort()) {
    if (!/^--qxframe9a7c2-/.test(key) || /^--_qxframe9a7c2-/.test(key)) {
      throw new TypeError('advanced.overrides contains a non-public token: ' + key);
    }
    const value = String(source[key] == null ? '' : source[key]).trim();
    if (!value || /[{};]/.test(value) || /!important/i.test(value)) {
      throw new TypeError('advanced.overrides.' + key + ' is not a safe CSS custom-property value.');
    }
    result[key] = value;
  }
  return result;
}

function normalizeStyleRadius(config) {
  const preset = STYLE_PRESETS[config.style];
  if (!preset) return config;
  if (preset.radiusLocked) config.radius = 'none';
  else if (preset.disallowLargeRadius && config.radius === 'large') config.radius = 'medium';
  return config;
}

function normalizeConfig(input = {}) {
  assertKnownKeys(input, TOP_KEYS, 'config');
  if (input.schema != null && Number(input.schema) !== SCHEMA_VERSION) {
    throw new TypeError('Unsupported Theme Config schema: ' + input.schema + '. Expected ' + SCHEMA_VERSION + '.');
  }
  const provided = new Set(Object.keys(input));
  const config = deepClone(DEFAULT_CONFIG);
  config.name = normalizeName(input.name);
  config.style = enumValue(input.style, STYLE_IDS, DEFAULT_CONFIG.style, 'style');
  config.baseColor = enumValue(input.baseColor, BASE_COLOR_IDS, DEFAULT_CONFIG.baseColor, 'baseColor');
  config.palette = normalizePalette(input.palette);
  config.roles = normalizeRoles(input.roles);

  if (input.chart != null) assertKnownKeys(input.chart, CHART_KEYS, 'chart');
  const legacyChart = input.chart && input.chart.preset;
  const legacyMap = { balanced:'primary', cool:'blue', warm:'orange', mixed:'purple', mono:'neutral' };
  const chartValue = input.chart && input.chart.color != null ? input.chart.color : (legacyChart != null ? (legacyMap[legacyChart] || legacyChart) : DEFAULT_CONFIG.chart.color);
  config.chart.color = enumValue(chartValue, CHART_COLOR_IDS, DEFAULT_CONFIG.chart.color, 'chart.color');

  if (input.typography != null) assertKnownKeys(input.typography, TYPE_KEYS, 'typography');
  config.typography.body = enumValue(input.typography && input.typography.body, BODY_FONT_IDS, DEFAULT_CONFIG.typography.body, 'typography.body');
  config.typography.heading = enumValue(input.typography && input.typography.heading, HEADING_FONT_IDS, DEFAULT_CONFIG.typography.heading, 'typography.heading');
  config.typography.mono = enumValue(input.typography && input.typography.mono, MONO_FONT_IDS, DEFAULT_CONFIG.typography.mono, 'typography.mono');
  const size = Number(input.typography && input.typography.baseSize != null ? input.typography.baseSize : DEFAULT_CONFIG.typography.baseSize);
  if (!Number.isInteger(size) || size < 12 || size > 20 || size % 2 !== 0) throw new TypeError('typography.baseSize must be an even integer between 12 and 20.');
  config.typography.baseSize = size;

  config.radius = enumValue(input.radius, RADIUS_IDS, DEFAULT_CONFIG.radius, 'radius');
  config.density = enumValue(input.density, DENSITY_IDS, DEFAULT_CONFIG.density, 'density');

  if (input.components != null) assertKnownKeys(input.components, COMPONENT_KEYS, 'components');
  const menu = input.components && input.components.menu;
  if (menu != null) assertKnownKeys(menu, MENU_KEYS, 'components.menu');
  config.components.menu.color = enumValue(menu && menu.color, MENU_COLOR_IDS, DEFAULT_CONFIG.components.menu.color, 'components.menu.color');
  config.components.menu.appearance = enumValue(menu && menu.appearance, MENU_APPEARANCE_IDS, DEFAULT_CONFIG.components.menu.appearance, 'components.menu.appearance');
  config.components.menu.accent = enumValue(menu && menu.accent, MENU_ACCENT_IDS, DEFAULT_CONFIG.components.menu.accent, 'components.menu.accent');

  if (input.advanced != null) assertKnownKeys(input.advanced, ADVANCED_KEYS, 'advanced');
  config.advanced.overrides = normalizeOverrides(input.advanced && input.advanced.overrides);
  normalizeStyleRadius(config);
  return deepFreeze(config);
}

function parseConfig(text) {
  let parsed;
  try { parsed = JSON.parse(String(text)); }
  catch (error) { throw new SyntaxError('Theme Config JSON is invalid: ' + error.message); }
  return normalizeConfig(parsed);
}

function serializeConfig(config) {
  return JSON.stringify(normalizeConfig(config), null, 2) + '\n';
}

function readSchema(manifest) {
  assertObject(manifest, 'manifest');
  if (Number(manifest.schema) !== SCHEMA_VERSION) {
    throw new TypeError('Unsupported Theme Manifest schema: ' + manifest.schema + '. Expected ' + SCHEMA_VERSION + '.');
  }
  if (!Array.isArray(manifest.tokens) || manifest.tokens.length === 0) throw new TypeError('manifest.tokens must be a non-empty array.');
  if (!Array.isArray(manifest.optionalComponentOverrides)) throw new TypeError('manifest.optionalComponentOverrides must be an array.');

  const order = [];
  const tokenSet = new Set();
  const defaults = { light: {}, dark: {} };
  for (const entry of manifest.tokens) {
    if (!entry || typeof entry.name !== 'string' || !/^--qxframe9a7c2-/.test(entry.name) || /^--_qxframe9a7c2-/.test(entry.name)) {
      throw new TypeError('Manifest contains an invalid public token.');
    }
    if (tokenSet.has(entry.name)) throw new TypeError('Manifest contains a duplicate token: ' + entry.name);
    if (!entry.defaults || typeof entry.defaults.light !== 'string' || typeof entry.defaults.dark !== 'string') {
      throw new TypeError('Manifest token is missing Light/Dark defaults: ' + entry.name);
    }
    tokenSet.add(entry.name);
    order.push(entry.name);
    defaults.light[entry.name] = entry.defaults.light;
    defaults.dark[entry.name] = entry.defaults.dark;
  }

  const optionalSet = new Set();
  for (const name of manifest.optionalComponentOverrides) {
    if (typeof name !== 'string' || !/^--qxframe9a7c2-/.test(name) || /^--_qxframe9a7c2-/.test(name)) {
      throw new TypeError('Manifest contains an invalid optional public override.');
    }
    optionalSet.add(name);
  }

  return deepFreeze({
    schema: SCHEMA_VERSION,
    state: manifest.state || '',
    interfaceHash: String(manifest.interfaceHash || ''),
    order,
    tokenSet,
    optionalSet,
    defaults
  });
}

function createTokenMaps(schema) {
  if (!schema || schema.schema !== SCHEMA_VERSION || !Array.isArray(schema.order)) throw new TypeError('A validated Theme Schema v1 contract is required.');
  return {
    light: Object.fromEntries(schema.order.map(name => [name, schema.defaults.light[name]])),
    dark: Object.fromEntries(schema.order.map(name => [name, schema.defaults.dark[name]]))
  };
}

function applyExplicitOverrides(tokenMaps, schema, config) {
  const overrides = config.advanced.overrides;
  for (const [name, value] of Object.entries(overrides)) {
    if (!schema.tokenSet.has(name) && !schema.optionalSet.has(name)) {
      throw new TypeError('Unknown public token override: ' + name);
    }
    tokenMaps.light[name] = value;
    tokenMaps.dark[name] = value;
  }
  return tokenMaps;
}

function validateTokenMaps(tokenMaps, schema, options = {}) {
  assertObject(tokenMaps, 'tokenMaps');
  for (const mode of ['light','dark']) {
    assertObject(tokenMaps[mode], 'tokenMaps.' + mode);
    for (const name of schema.order) {
      if (!Object.prototype.hasOwnProperty.call(tokenMaps[mode], name)) throw new TypeError(mode + ' theme is missing token: ' + name);
      const value = String(tokenMaps[mode][name] == null ? '' : tokenMaps[mode][name]).trim();
      if (!value || /[{};]/.test(value) || /!important/i.test(value)) throw new TypeError(mode + ' token has an unsafe value: ' + name);
      if (/--_qxframe9a7c2-/.test(value)) throw new TypeError(mode + ' token resolves through a private variable: ' + name);
    }
    for (const name of Object.keys(tokenMaps[mode])) {
      if (!schema.tokenSet.has(name) && !schema.optionalSet.has(name)) throw new TypeError(mode + ' theme contains unknown public token: ' + name);
      if (/^--_qxframe9a7c2-/.test(name)) throw new TypeError(mode + ' theme contains a private token: ' + name);
    }
  }
  if (options.requireComplete !== false) {
    if (schema.order.some(name => !Object.prototype.hasOwnProperty.call(tokenMaps.light, name) || !Object.prototype.hasOwnProperty.call(tokenMaps.dark, name))) {
      throw new TypeError('Complete Theme output must contain every required public token in both modes.');
    }
  }
  return true;
}

function orderedNames(tokenMaps, schema) {
  const extras = new Set();
  for (const mode of ['light','dark']) {
    for (const name of Object.keys(tokenMaps[mode])) if (!schema.tokenSet.has(name)) extras.add(name);
  }
  return schema.order.concat(Array.from(extras).sort());
}

function cssBlock(selectors, mode, names, tokenMaps) {
  const lines = [selectors + ' {'];
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(tokenMaps[mode], name)) continue;
    lines.push('  ' + name + ': ' + tokenMaps[mode][name] + ';');
  }
  lines.push('}');
  return lines.join('\n');
}

function serializeCss(tokenMaps, schema, config, options = {}) {
  validateTokenMaps(tokenMaps, schema);
  const normalized = normalizeConfig(config);
  const names = orderedNames(tokenMaps, schema);
  const header = [
    '/*',
    ' * QXFRAME9A7C2 Theme',
    ' * Theme Schema: ' + SCHEMA_VERSION,
    ' * Generator Version: ' + GENERATOR_VERSION,
    ' * Theme Name: ' + normalized.name,
    ' * Public Interface: ' + schema.interfaceHash,
    ' * Complete Theme: yes',
    ' */'
  ].join('\n');
  const light = cssBlock(':root,\n[data-qxframe9a7c2-theme="light"]', 'light', names, tokenMaps);
  const dark = cssBlock('[data-qxframe9a7c2-theme="dark"]', 'dark', names, tokenMaps);
  const css = header + '\n' + light + '\n\n' + dark + '\n';
  if (/--_qxframe9a7c2-|!important|\.qxframe9a7c2-|\bhtml:root\b/.test(css)) {
    throw new TypeError('Serialized Theme CSS violated the public low-specificity output contract.');
  }
  return css;
}

function generateFoundationTheme(manifest, input = {}) {
  const schema = readSchema(manifest);
  const config = normalizeConfig(input);
  const maps = createTokenMaps(schema);
  applyExplicitOverrides(maps, schema, config);
  validateTokenMaps(maps, schema);
  return deepFreeze({
    schema,
    config,
    tokens: {
      light: deepFreeze({ ...maps.light }),
      dark: deepFreeze({ ...maps.dark })
    },
    css: serializeCss(maps, schema, config)
  });
}

function configOptions() {
  return deepFreeze({
    styles: STYLE_IDS.slice(),
    baseColors: BASE_COLOR_IDS.slice(),
    chartColors: CHART_COLOR_IDS.slice(),
    bodyFonts: BODY_FONT_IDS.slice(),
    headingFonts: HEADING_FONT_IDS.slice(),
    monoFonts: MONO_FONT_IDS.slice(),
    radii: RADIUS_IDS.slice(),
    densities: DENSITY_IDS.slice(),
    menuColors: MENU_COLOR_IDS.slice(),
    menuAppearances: MENU_APPEARANCE_IDS.slice(),
    menuAccents: MENU_ACCENT_IDS.slice(),
    paletteKeys: PALETTE_KEYS.slice()
  });
}

export {
  SCHEMA_VERSION,
  GENERATOR_VERSION,
  DEFAULT_CONFIG,
  STYLE_PRESETS,
  configOptions,
  normalizeConfig,
  parseConfig,
  serializeConfig,
  readSchema,
  createTokenMaps,
  applyExplicitOverrides,
  validateTokenMaps,
  serializeCss,
  generateFoundationTheme
};
