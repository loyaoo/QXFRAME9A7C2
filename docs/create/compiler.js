// createApp theme compiler (v3 §5). Turns a resolved configuration into the complete
// closed token list (tokens.js): every token in :root, every color token again in .dark.
// Only fixed values are produced here; qxframe.css owns every formula (size curve,
// color-mix states, concentric radii). Values with a shadcn source follow the measured
// table (tools/qa/spec.json, shadcn 295a1f114a138f23b5dfee0e0c6812394dfeb90c); values
// marked QX are QX extensions.
import { THEMES, FONTS, HEADING_FONTS, RADII, isTranslucentMenu, isInvertedMenu } from './data.js';
import { THEME_TOKENS, TOKEN_PREFIX } from './tokens.js';

/* ---------------------------------------------------------------- */
/* Color helpers (oklch literals only; shadcn themes are all oklch)  */
/* ---------------------------------------------------------------- */

const round = (value, digits = 4) => String(Math.round(value * 10 ** digits) / 10 ** digits);

function parseOklch(color) {
  const match = /^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/)]+)\s*(?:\/\s*([^)]+))?\)$/.exec(color.trim());
  if (!match) throw new Error('Unsupported color literal: ' + color);
  let a = 1;
  if (match[4] !== undefined) a = match[4].trim().endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]);
  return { l: match[1], c: match[2], h: match[3], a };
}

// color/percent: the same color with its alpha scaled (Tailwind `bg-input/30`).
export function alpha(color, percent) {
  if (color === 'transparent' || percent === 0) return 'transparent';
  const { l, c, h, a } = parseOklch(color);
  const next = a * percent / 100;
  return next >= 1 ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${round(next)})`;
}

// Expression → literal. 'role', 'role/NN', 'transparent', or a literal color.
function evaluate(expr, palette) {
  if (expr === 'transparent') return 'transparent';
  if (/^(oklch|rgb|#)/.test(expr)) return expr;
  const [role, pct] = expr.split('/');
  const base = palette[role];
  if (!base) throw new Error('Unknown palette role: ' + role);
  return pct === undefined ? base : alpha(base, Number(pct));
}

const pair = (light, dark = light) => ({ light, dark });

/* ---------------------------------------------------------------- */
/* QX constants (not in shadcn)                                      */
/* ---------------------------------------------------------------- */

const QX_COLORS = {
  success: pair('oklch(0.6271 0.1699 149.21)', 'oklch(0.8003 0.1821 151.71)'),
  'success-foreground': pair('oklch(1 0 0)', 'oklch(0.2046 0 0)'),
  warning: pair('oklch(0.7686 0.1647 70.08)', 'oklch(0.8369 0.1644 84.43)'),
  'warning-foreground': pair('oklch(0.2046 0 0)', 'oklch(0.2046 0 0)'),
  info: pair('oklch(0.6089 0.1109 221.72)', 'oklch(0.7971 0.1339 211.53)'),
  'info-foreground': pair('oklch(1 0 0)', 'oklch(0.2046 0 0)'),
  'palette-grey': pair('oklch(0.4386 0 0)', 'oklch(0.5284 0 0)'),
  'palette-cyan': pair('oklch(0.6552 0.1104 212.17)', 'oklch(0.7104 0.0928 212.17)'),
  'palette-teal': pair('oklch(0.6573 0.1374 164.37)', 'oklch(0.7121 0.1154 164.36)'),
  'palette-green': pair('oklch(0.6738 0.1885 145.42)', 'oklch(0.726 0.1583 145.42)'),
  'palette-lime': pair('oklch(0.7371 0.1928 128)', 'oklch(0.7792 0.1619 128)'),
  'palette-yellow': pair('oklch(0.7702 0.1658 71.01)', 'oklch(0.807 0.1393 71.01)'),
  'palette-orange': pair('oklch(0.6851 0.1954 44.57)', 'oklch(0.7355 0.1642 44.57)'),
  'palette-red': pair('oklch(0.5829 0.1941 25.59)', 'oklch(0.6496 0.163 25.59)'),
  'palette-pink': pair('oklch(0.5881 0.201 5.25)', 'oklch(0.654 0.1689 5.25)'),
  'palette-purple': pair('oklch(0.5783 0.2186 319.15)', 'oklch(0.6458 0.1836 319.16)'),
  'palette-blue': pair('oklch(0.5494 0.249 263.05)', 'oklch(0.6215 0.2092 263.05)'),
  'palette-azure': pair('oklch(0.6512 0.1909 252.79)', 'oklch(0.707 0.1604 252.79)'),
  'palette-white': pair('oklch(1 0 0)', 'oklch(1 0 0)'),
  'palette-black': pair('oklch(0 0 0)', 'oklch(0.16 0 0)'),
  'palette-foreground': pair('oklch(1 0 0)', 'oklch(1 0 0)')
};

/* ---------------------------------------------------------------- */
/* Style-only looks (no extension axis; shadcn style sources)        */
/* ---------------------------------------------------------------- */

const STYLE_LOOKS = {
  //        overlay  switch-track         track-border  slider-rail         thumb      thumb-border  choice                  choice-border  radio-fill  thumb-shadow  switch-shadow  meta-gap   progress
  vega: { overlay: 10, switchTrack: ['input', 'input/80'], switchBorder: 'transparent', rail: 'muted', thumb: 'white', thumbBorder: 'primary', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 100, thumbShadow: 'sm', switchShadow: 'none', metaGap: 0.25, progress: 0.375 },
  nova: { overlay: 10, switchTrack: ['input', 'input/80'], switchBorder: 'transparent', rail: 'muted', thumb: 'white', thumbBorder: 'ring', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 100, thumbShadow: 'none', switchShadow: 'none', metaGap: 0.25, progress: 0.25 },
  maia: { overlay: 80, switchTrack: ['input', 'input/80'], switchBorder: 'transparent', rail: 'muted', thumb: 'white', thumbBorder: 'primary', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 100, thumbShadow: 'sm', switchShadow: 'none', metaGap: 0.5, progress: 0.75 },
  lyra: { overlay: 10, switchTrack: ['input', 'input/80'], switchBorder: 'transparent', rail: 'muted', thumb: 'white', thumbBorder: 'ring', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 100, thumbShadow: 'none', switchShadow: 'none', metaGap: 0.25, progress: 0.25 },
  mira: { overlay: 80, switchTrack: ['input', 'input/80'], switchBorder: 'transparent', rail: 'muted', thumb: 'white', thumbBorder: 'ring', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 100, thumbShadow: 'none', switchShadow: 'none', metaGap: 0.25, progress: 0.25 },
  luma: { overlay: 30, switchTrack: ['input/90', 'input/90'], switchBorder: 'transparent', rail: 'input/90', thumb: 'white', thumbBorder: 'transparent', choice: ['input/90', 'input/90'], choiceBorder: 'transparent', radioFill: 100, thumbShadow: 'md', switchShadow: 'sm', metaGap: 0.375, progress: 0.75 },
  sera: { overlay: 20, switchTrack: ['input', 'input'], switchBorder: 'input/50', rail: 'input/50', thumb: 'primary', thumbBorder: 'transparent', choice: ['transparent', 'input/30'], choiceBorder: 'input', radioFill: 0, thumbShadow: 'none', switchShadow: 'none', metaGap: 0.375, progress: 0.125 },
  rhea: { overlay: 30, switchTrack: ['input/90', 'input/90'], switchBorder: 'transparent', rail: 'input/90', thumb: 'white', thumbBorder: 'transparent', choice: ['input/90', 'input/90'], choiceBorder: 'transparent', radioFill: 100, thumbShadow: 'md', switchShadow: 'sm', metaGap: 0.375, progress: 0.5 }
};
const SLIDER_THUMB = { vega: 1, nova: 0.75, maia: 1, lyra: 0.75, mira: 0.75, luma: 1, sera: 0.75, rhea: 1 };

/* ---------------------------------------------------------------- */
/* Extension axis levels                                             */
/* ---------------------------------------------------------------- */

// Tailwind v4 shadow scale (rem; color is the theme's own black tint).
const SHADOWS = {
  none: 'none',
  xs: '0 0.0625rem 0.125rem 0 oklch(0 0 0 / 0.05)',
  sm: '0 0.0625rem 0.1875rem 0 oklch(0 0 0 / 0.1), 0 0.0625rem 0.125rem -0.0625rem oklch(0 0 0 / 0.1)',
  md: '0 0.25rem 0.375rem -0.0625rem oklch(0 0 0 / 0.1), 0 0.125rem 0.25rem -0.125rem oklch(0 0 0 / 0.1)',
  lg: '0 0.625rem 0.9375rem -0.1875rem oklch(0 0 0 / 0.1), 0 0.25rem 0.375rem -0.25rem oklch(0 0 0 / 0.1)',
  xl: '0 1.25rem 1.5625rem -0.3125rem oklch(0 0 0 / 0.1), 0 0.5rem 0.625rem -0.375rem oklch(0 0 0 / 0.1)',
  '2xl': '0 1.5625rem 3.125rem -0.75rem oklch(0 0 0 / 0.25)'
};
// Shadow axis: low / mid / high tiers move together (card, popup, dialog).
const SHADOW_TIERS = {
  none: ['none', 'md', 'none'],
  light: ['xs', 'md', 'none'],
  medium: ['sm', 'lg', 'xl'],
  strong: ['md', 'lg', 'xl'],
  heavy: ['lg', 'xl', '2xl']
};

// Density: md height / inline padding / gap / icon (rem).
const DENSITY = {
  dense: [1.75, 0.5, 0.25, 0.875],
  compact: [2, 0.625, 0.375, 1],
  standard: [2.25, 0.625, 0.375, 1],
  loose: [2.5, 1.5, 0.375, 1],
  touch: [2.75, 1, 0.5, 1.25] // QX
};
const PADDING = { p12: 0.75, p16: 1, p20: 1.25, p24: 1.5, p28: 1.75, p32: 2 };
// Typography: body, meta, heading, kpi, card body, control font, control line box (rem).
const TYPOGRAPHY = {
  compact: [0.75, 0.75, 0.875, 1.75, 0.75, 0.75, 1],
  standard: [0.875, 0.75, 1, 2.25, 0.875, 0.875, 1.25],
  roomy: [1, 0.875, 1.125, 2.5, 1, 1, 1.5] // QX
};
const SWITCH = { standard: [2, 1.15], compact: [1.75, 1.0375], wide: [2.75, 1.25], tall: [2, 1.25], square: [2.0625, 1.125] };
const SLIDER = { t2: 0.125, t4: 0.25, t6: 0.375, t8: 0.5, t12: 0.75 };
const MOTION = { none: [0, 0, 0, 0], fast: [50, 100, 150, 200], standard: [100, 150, 200, 300], relaxed: [150, 250, 300, 450] };

// Control look (v3 §4.3): outline button [light bg, dark bg], hover, border, extra shadow.
const CONTROL_LOOK = {
  solid: { bg: ['background', 'input/30'], hover: ['muted', 'input/50'], border: ['border', 'input'], shadow: false },
  'solid-shadow': { bg: ['background', 'input/30'], hover: ['muted', 'input/50'], border: ['border', 'input'], shadow: true },
  tinted: { bg: ['input/30', 'input/30'], hover: ['input/50', 'input/50'], border: ['border', 'border'], shadow: false },
  transparent: { bg: ['transparent', 'input/30'], hover: ['input/50', 'input/50'], border: ['border', 'border'], shadow: false },
  'light-solid': { bg: ['background', 'transparent'], hover: ['muted', 'input/30'], border: ['border', 'border'], shadow: false },
  ghost: { bg: ['transparent', 'transparent'], hover: ['muted', 'input/30'], border: ['border', 'border'], shadow: false }
};
// Input look: [light bg, dark bg], rest border, side/top weight.
const INPUT_LOOK = {
  outline: { bg: ['transparent', 'input/30'], border: 'input', sides: 100 },
  tinted: { bg: ['input/30', 'input/30'], border: 'input', sides: 100 },
  subtle: { bg: ['input/20', 'input/30'], border: 'input', sides: 100 },
  soft: { bg: ['input/50', 'input/50'], border: 'transparent', sides: 100 },
  underline: { bg: ['transparent', 'transparent'], border: 'input', sides: 0 },
  borderless: { bg: ['transparent', 'transparent'], border: 'transparent', sides: 100 } // QX
};
// Surface edge: card ring, popup ring [light, dark] (foreground alpha %).
const EDGE = { none: [0, 0], faint: [5, 10], clear: [10, 10], strong: [15, 15] };

// Radius allocation: Tailwind radius-scale step per category (×base). 'full' = pill; numbers in
// the checkbox column are absolute px from the style source (non-zero base only).
const SCALE = { sm: 0.6, md: 0.8, lg: 1, xl: 1.4, '2xl': 1.8, '3xl': 2.2, '4xl': 2.6, full: 'full' };
const ALLOCATION = {
  //            button  field  badge   tabs   item   checkbox switch  thumb   track   avatar  card   popup  dialog
  standard: ['md', 'md', '4xl', 'lg', 'sm', 4, 'full', 'full', 'full', 'full', 'xl', 'md', 'xl'],
  balanced: ['lg', 'lg', '4xl', 'lg', 'md', 4, 'full', 'full', 'full', 'full', 'xl', 'lg', 'xl'],
  rounded: ['4xl', '4xl', '4xl', '4xl', 'xl', 6, 'full', '4xl', '4xl', 'full', '2xl', '2xl', '4xl'],
  compact: ['md', 'md', 'full', 'lg', 'md', 4, 'full', 'md', 'md', 'full', 'lg', 'lg', 'xl'],
  soft: ['4xl', '3xl', '3xl', 'full', '2xl', 5, 'full', 'full', 'full', 'full', '4xl', '3xl', '4xl'],
  smooth: ['2xl', '2xl', '2xl', '2xl', 'xl', 5, '2xl', '2xl', '2xl', 'full', '4xl', '2xl', '4xl']
};
const ALLOCATION_KEYS = ['button', 'field', 'badge', 'tabs', 'item', 'choice', 'switch', 'thumb', 'track', 'avatar', 'card', 'popup', 'dialog'];
const PILL = '62.5rem';
const CONTAINER_CAP_PX = 24; // shadcn Rhea: rounded-[min(var(--radius-4xl),24px)]

const rem = value => (value === 0 ? '0' : round(value) + 'rem');
const px = value => rem(value / 16);

/* ---------------------------------------------------------------- */
/* Palette (shadcn buildRegistryTheme)                               */
/* ---------------------------------------------------------------- */

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
  light.white = 'oklch(1 0 0)'; dark.white = 'oklch(1 0 0)';
  return { light, dark };
}

/* ---------------------------------------------------------------- */
/* Token values                                                      */
/* ---------------------------------------------------------------- */

function radiusFor(step, basePx, cap) {
  if (basePx === 0) return '0';
  if (step === 'full') return PILL;
  const value = typeof step === 'number' ? step : basePx * SCALE[step];
  return px(cap ? Math.min(value, cap) : value);
}

function shapeRadius(shape, followValue, controlShape) {
  switch (shape) {
    case 'control': return controlShape === 'pill' ? PILL : followValue;
    case 'radius': return followValue;
    case 'pill': case 'circle': return PILL;
    case 'square': return '0';
    default: return followValue;
  }
}

// resolved: resolveConfig() output (every axis filled from the style).
export function themeTokens(resolved) {
  const { style, ext } = resolved;
  const looks = STYLE_LOOKS[style];
  const palette = buildPalette(resolved);
  const light = {}, dark = {}, root = {};
  const color = (name, lightExpr, darkExpr = lightExpr) => {
    light[name] = evaluate(lightExpr, palette.light);
    dark[name] = evaluate(darkExpr, palette.dark);
  };

  // shadcn semantic colors.
  for (const role of ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary',
    'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
    'destructive', 'border', 'input', 'ring', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'sidebar', 'sidebar-foreground']) {
    color(role, role);
  }
  light['destructive-foreground'] = 'oklch(1 0 0)';
  dark['destructive-foreground'] = 'oklch(1 0 0)';
  for (const [name, value] of Object.entries(QX_COLORS)) { light[name] = value.light; dark[name] = value.dark; }

  // Border clarity (QX): thin pulls hairlines toward the page, clear toward the text. Literal
  // oklch only: opaque hairlines move their lightness, translucent ones scale their alpha.
  if (ext.hairline !== 'standard') {
    const thin = ext.hairline === 'thin';
    for (const role of ['border', 'input']) {
      for (const [target, mode] of [[light, 'light'], [dark, 'dark']]) {
        const c = parseOklch(target[role]);
        if (c.a < 1) {
          target[role] = alpha(target[role], thin ? 60 : 150);
        } else {
          const goal = parseOklch(palette[mode][thin ? 'background' : 'foreground']);
          const w = thin ? 0.4 : 0.2;
          const l = Number(c.l) + (Number(goal.l) - Number(c.l)) * w;
          target[role] = `oklch(${round(l)} ${c.c} ${c.h})`;
        }
      }
    }
  }
  const pal = { light: { ...palette.light, border: light.border, input: light.input }, dark: { ...palette.dark, border: dark.border, input: dark.input } };
  const look = (name, lightExpr, darkExpr = lightExpr) => {
    light[name] = evaluate(lightExpr, pal.light);
    dark[name] = evaluate(darkExpr, pal.dark);
  };

  // Overlay (style).
  light.overlay = dark.overlay = `oklch(0 0 0 / ${round(looks.overlay / 100)})`;

  // Menu color + accent.
  const inverted = isInvertedMenu(resolved.menuColor);
  const translucent = isTranslucentMenu(resolved.menuColor);
  const menuSource = inverted ? { light: palette.dark, dark: palette.dark } : palette;
  for (const mode of ['light', 'dark']) {
    const target = mode === 'light' ? light : dark;
    const src = menuSource[mode];
    target.menu = translucent ? alpha(src.popover, 80) : src.popover;
    target['menu-foreground'] = src['popover-foreground'];
    target['menu-accent'] = src.accent;
    target['menu-accent-foreground'] = src['accent-foreground'];
  }
  root['menu-blur'] = translucent ? '1.5rem' : '0';

  // Surface edge + partition.
  const [edgeLight, edgeDark] = EDGE[ext.edge];
  look('card-edge', edgeLight ? `foreground/${edgeLight}` : 'transparent', edgeDark ? `foreground/${edgeDark}` : 'transparent');
  look('popup-edge', edgeLight ? `foreground/${edgeLight}` : 'transparent', edgeDark ? `foreground/${edgeDark}` : 'transparent');
  look('card-section', ext.sections === 'muted' ? 'muted/50' : 'transparent');
  look('card-section-border', ext.sections === 'none' ? 'transparent' : 'border');

  // Control look + input look.
  const control = CONTROL_LOOK[ext.controlLook];
  look('outline', control.bg[0], control.bg[1]);
  look('outline-hover', control.hover[0], control.hover[1]);
  look('outline-border', control.border[0], control.border[1]);
  const input = INPUT_LOOK[ext.inputLook];
  look('field', input.bg[0], input.bg[1]);
  look('field-border', input.border);
  // Nova / Lyra source: disabled:bg-input/50 dark:disabled:bg-input/80; other styles keep the field.
  if (style === 'nova' || style === 'lyra') look('field-disabled', 'input/50', 'input/80');
  else look('field-disabled', input.bg[0], input.bg[1]);
  root['field-sides'] = input.sides + '%';

  // Choice, switch, slider (style looks).
  look('choice', looks.choice[0], looks.choice[1]);
  look('choice-border', looks.choiceBorder);
  root['radio-fill'] = looks.radioFill + '%';
  look('switch-track', looks.switchTrack[0], looks.switchTrack[1]);
  look('switch-track-border', looks.switchBorder);
  look('slider-rail', looks.rail);
  look('thumb', looks.thumb);
  look('thumb-border', looks.thumbBorder);

  // Focus color: mono = black in light, white in dark (QX); theme = primary.
  if (ext.focusColor === 'theme') look('focus', 'primary');
  else { light.focus = 'oklch(0 0 0)'; dark.focus = 'oklch(1 0 0)'; }

  // Typography.
  const body = FONTS.find(f => f.value === resolved.font).stack;
  root['font-sans'] = body;
  root['font-heading'] = resolved.fontHeading === 'inherit' ? body : HEADING_FONTS.find(f => f.value === resolved.fontHeading).stack;
  root['font-mono'] = FONTS.find(f => f.value === 'mono').stack;
  const [textSize, metaSize, headingSize, kpiSize, cardSize, controlFont, controlLine] = TYPOGRAPHY[ext.typography];
  root['text-size'] = rem(textSize);
  root['text-size-meta'] = rem(metaSize);
  root['text-size-heading'] = rem(headingSize);
  root['text-size-kpi'] = rem(kpiSize);
  root['text-weight'] = '400';
  root['text-weight-label'] = editorial ? '600' : resolved.font === 'mono' ? '400' : '500';
  const editorial = ext.textStyle === 'editorial';
  root['control-weight'] = editorial ? '600' : '500';
  root['control-tracking'] = editorial ? '0.1em' : 'normal';
  root['control-transform'] = editorial ? 'uppercase' : 'none';
  root['heading-tracking'] = editorial ? '0.05em' : 'normal';
  root['heading-transform'] = editorial ? 'uppercase' : 'none';

  // Control size.
  const [height, padding, gap, icon] = DENSITY[ext.density];
  const roundAllocation = ['rounded', 'soft', 'smooth'].includes(ext.radiusAlloc);
  root['control-height'] = rem(height);
  root['control-padding'] = rem(padding + (roundAllocation && padding < 1 ? 0.125 : 0));
  root['control-gap'] = rem(gap);
  root['control-icon'] = rem(icon);
  // Editorial (Sera) controls use text-xs uppercase labels.
  root['control-font-size'] = rem(editorial ? Math.min(controlFont, 0.75) : controlFont);
  root['control-line-height'] = rem(editorial ? Math.min(controlLine, 1) : controlLine);
  root['border-width'] = '1px';

  // Containers.
  root['card-padding'] = rem(PADDING[ext.padding]);
  // shadcn Empty uses a compact 24px or spacious 48px surface. The
  // existing padding axis selects the tier; media/title scale derives in CSS.
  root['empty-inset'] = rem(PADDING[ext.padding] <= 1 ? 1.5 : 3);
  // The shadcn Item/Field recipes share the existing container and typography
  // axes; use five semantic anchors rather than per-style CSS or five size slots.
  const itemSpace = PADDING[ext.padding] <= 1 ? 0.625 : 0.875;
  const fieldSpace = PADDING[ext.padding] <= 1 ? 0.5 : 0.75;
  const groupSpace = PADDING[ext.padding] + 0.25
    + (PADDING[ext.padding] >= 2 ? 0.25 : 0)
    - (height <= 1.75 ? 0.25 : 0);
  root['item-space'] = rem(itemSpace);
  // Vega's measured regular Item description is 21/14, unlike other spacious
  // regular styles. Keep the style's source recipe here, never in component CSS.
  root['item-description-leading'] = String(ext.textStyle === 'editorial' || ext.typography === 'compact'
    ? 1.625 : style === 'vega' || PADDING[ext.padding] <= 1 ? 1.5 : 20 / 14);
  root['field-group-gap'] = rem(groupSpace);
  root['field-gap'] = rem(fieldSpace);
  root['field-label-line-height'] = rem(editorial ? 1.21875 : Math.min(textSize, controlFont));
  root['card-gap'] = rem(PADDING[ext.padding]);
  root['card-meta-gap'] = rem(looks.metaGap);
  root['card-title-delta'] = editorial ? '0.25rem' : '0.125rem';
  root['card-font-size'] = rem(cardSize);
  root['card-border-width'] = '1px';
  root['card-section-inset'] = ext.sections === 'none' ? '0' : rem(PADDING[ext.padding]);
  root['card-section-width'] = ext.sections === 'none' ? '0' : '1px';
  root['text-leading'] = ext.typography === 'compact' ? '1.625' : String(20 / 14);
  root['heading-leading'] = editorial ? String(28 / 18) : ext.typography === 'compact' ? String(20 / 14) : style === 'nova' ? '1.375' : '1.5';
  root['description-leading'] = editorial || ext.typography === 'compact' ? '1.625' : String(20 / 14);

  // Radius.
  const radius = RADII.find(r => r.value === resolved.radiusValue);
  const basePx = radius.px;
  root.radius = px(basePx);
  const alloc = {};
  ALLOCATION[ext.radiusAlloc].forEach((step, index) => {
    const key = ALLOCATION_KEYS[index];
    alloc[key] = radiusFor(step, basePx, ['card', 'dialog'].includes(key) && ext.radiusAlloc === 'smooth' ? CONTAINER_CAP_PX : 0);
  });
  const controlShape = ext.controlShape;
  // The global zero-radius shortcut wins over style FOLLOW defaults; explicit
  // per-category shape selections remain authoritative (v3 §4.5).
  const roundShape = key => basePx === 0 && resolved.radius === 'none' && resolved.explicit?.[key] === undefined ? 'radius' : ext[key];
  root['radius-button'] = shapeRadius(ext.shapeButton, alloc.button, controlShape);
  root['radius-field'] = shapeRadius(ext.shapeInput, alloc.field, controlShape);
  root['radius-select'] = shapeRadius(ext.shapeSelect, alloc.field, controlShape);
  root['radius-badge'] = shapeRadius(ext.shapeBadge, alloc.badge, controlShape);
  root['radius-tabs'] = shapeRadius(ext.shapeTabs, alloc.tabs, controlShape);
  root['radius-item'] = alloc.item;
  root['radius-choice'] = alloc.choice;
  root['radius-radio'] = shapeRadius(roundShape('shapeRadio'), alloc.button, controlShape);
  root['radius-switch'] = shapeRadius(roundShape('shapeSwitch'), alloc.switch, controlShape);
  root['radius-thumb'] = shapeRadius(roundShape('shapeThumb'), alloc.thumb, controlShape);
  root['radius-track'] = roundShape('shapeThumb') === 'circle' ? PILL : root['radius-thumb'];
  root['radius-avatar'] = shapeRadius(roundShape('shapeAvatar'), alloc.button, controlShape);
  const container = ext.shapeContainer === 'square' ? () => '0' : value => value;
  // Source-locked Empty rounded roles per shared radius-allocation recipe.
  // Values scale with the selected radius; global straight corners stay zero.
  const emptyRadiusRoles = {
    standard: [1, 1], balanced: [1.4, 1], rounded: [1, 1],
    compact: [1.4, .8], soft: [1.8, 1.4], smooth: [2.2, 1.4]
  };
  const [emptyRootScale, emptyMediaScale] = emptyRadiusRoles[ext.radiusAlloc];
  root['radius-empty'] = container(px(basePx * emptyRootScale));
  root['radius-empty-media'] = px(basePx * emptyMediaScale);
  root['radius-card'] = container(alloc.card);
  root['radius-popup'] = container(alloc.popup);
  root['radius-dialog'] = container(alloc.dialog);

  // Parts.
  const [switchWidth, switchHeight] = SWITCH[ext.switchLook];
  root['switch-width'] = rem(switchWidth);
  root['switch-height'] = rem(switchHeight);
  root['switch-inset'] = '0.125rem';
  root['switch-thumb-extra'] = style === 'luma' ? '0.5rem' : '0rem';
  // Concentric thumb: outer radius − inset, never below zero (v3 §4.5 rule 3).
  const switchRadius = root['radius-switch'];
  root['radius-switch-thumb'] = switchRadius === PILL ? PILL : rem(Math.max(0, parseFloat(switchRadius) - 0.125));
  root['slider-track'] = rem(SLIDER[ext.sliderLook]);
  root['slider-thumb'] = rem(SLIDER_THUMB[style]);
  // shadcn Luma thumb is h-4 w-6 (a horizontal capsule); other styles are square.
  root['slider-thumb-width'] = rem(style === 'luma' ? 1.5 : SLIDER_THUMB[style]);
  root['progress-track'] = resolved.explicit && resolved.explicit.sliderLook ? rem(SLIDER[ext.sliderLook]) : rem(looks.progress);
  root['progress-ring'] = '7.5rem';
  root['choice-size'] = style === 'sera' ? '1.125rem' : '1rem';

  // Elevation.
  const [cardTier, popupTier, dialogTier] = SHADOW_TIERS[ext.shadow];
  root['shadow-control'] = control.shadow ? SHADOWS.xs : 'none';
  root['shadow-card'] = SHADOWS[cardTier];
  root['shadow-popup'] = SHADOWS[popupTier];
  root['shadow-dialog'] = SHADOWS[dialogTier];
  root['shadow-thumb'] = SHADOWS[looks.thumbShadow];
  root['shadow-switch-thumb'] = SHADOWS[looks.switchShadow];

  // Focus (v3 §4.6): outline = 2px / 100% / -1px (QX keyboard default), ring = 3px / 40% / 0;
  // pointer "follow" keeps the QX pointer look (no outline).
  const FOCUS = { outline: ['0.125rem', '100%', '-0.0625rem'], ring: ['0.1875rem', '40%', '0'], none: ['0', '100%', '0'] };
  const [kWidth, kOpacity, kOffset] = FOCUS[ext.keyboardFocus === 'ring' ? 'ring' : 'outline'];
  const [pWidth, pOpacity, pOffset] = FOCUS[ext.pointerFocus === 'qx' ? 'none' : ext.pointerFocus];
  root['focus-width'] = kWidth; root['focus-opacity'] = kOpacity; root['focus-offset'] = kOffset;
  root['pointer-width'] = pWidth; root['pointer-opacity'] = pOpacity; root['pointer-offset'] = pOffset;

  // Motion.
  const motion = MOTION[ext.motion];
  ['xs', 'sm', 'md', 'lg'].forEach((step, index) => { root['duration-' + step] = motion[index] + 'ms'; });

  // Colors go to both blocks; everything else to :root only.
  const rootBlock = {}, darkBlock = {};
  for (const token of THEME_TOKENS) {
    if (token.mode === 'color') {
      if (light[token.name] === undefined || dark[token.name] === undefined) throw new Error('Missing color token: ' + token.name);
      rootBlock[token.name] = light[token.name];
      darkBlock[token.name] = dark[token.name];
    } else {
      if (root[token.name] === undefined) throw new Error('Missing token: ' + token.name);
      rootBlock[token.name] = root[token.name];
    }
  }
  return { root: rootBlock, dark: darkBlock };
}

export function themeBody(resolved) {
  const { root, dark } = themeTokens(resolved);
  const lines = block => Object.entries(block).map(([name, value]) => `  ${TOKEN_PREFIX}${name}: ${value};`).join('\n');
  return `:root {\n${lines(root)}\n}\n.dark {\n${lines(dark)}\n}\n`;
}
