// QXFRAME9A7C2 theme token closed list (v3 §5.1). The only theme inputs are the
// `--qxframe9a7c2-theme-*` names below; every theme (the default block inside
// qxframe.css and every createApp export) writes the whole list: `:root` holds
// every token, `.dark` repeats every `mode: 'color'` token with its dark value.
// New tokens are added here only (registered), never ad hoc in CSS.
//
// kind:  color | length | number | percent | font | keyword | shadow | time
// mode:  'color' → written in :root and .dark;  'root' → written in :root only.

export const TOKEN_PREFIX = '--qxframe9a7c2-theme-';

const C = (name, note) => ({ name, kind: 'color', mode: 'color', note });
const L = (name, note, kind = 'length') => ({ name, kind, mode: 'root', note });

export const THEME_TOKENS = [
  // shadcn semantic colors (base color + theme + chart + menu accent).
  C('background', 'Page background'),
  C('foreground', 'Page text'),
  C('card', 'Card surface'),
  C('card-foreground', 'Card text'),
  C('popover', 'Popup surface'),
  C('popover-foreground', 'Popup text'),
  C('primary', 'Primary action'),
  C('primary-foreground', 'Text on primary'),
  C('secondary', 'Secondary action'),
  C('secondary-foreground', 'Text on secondary'),
  C('muted', 'Muted surface'),
  C('muted-foreground', 'Muted text'),
  C('accent', 'Hover / highlight surface'),
  C('accent-foreground', 'Text on accent'),
  C('destructive', 'Destructive / error'),
  C('destructive-foreground', 'Text on destructive'),
  C('border', 'Hairline border'),
  C('input', 'Control border'),
  C('ring', 'Focus ring source'),
  C('chart-1', 'Chart series 1'),
  C('chart-2', 'Chart series 2'),
  C('chart-3', 'Chart series 3'),
  C('chart-4', 'Chart series 4'),
  C('chart-5', 'Chart series 5'),
  C('sidebar', 'Sidebar surface'),
  C('sidebar-foreground', 'Sidebar text'),
  // QX status colors (not in shadcn; QX constants).
  C('success', 'Success'),
  C('success-foreground', 'Text on success'),
  C('warning', 'Warning'),
  C('warning-foreground', 'Text on warning'),
  C('info', 'Info'),
  C('info-foreground', 'Text on info'),
  // QX categorical palette used by the is-<color> classes.
  C('palette-grey', 'Palette grey'),
  C('palette-cyan', 'Palette cyan'),
  C('palette-teal', 'Palette teal'),
  C('palette-green', 'Palette green'),
  C('palette-lime', 'Palette lime'),
  C('palette-yellow', 'Palette yellow'),
  C('palette-orange', 'Palette orange'),
  C('palette-red', 'Palette red'),
  C('palette-pink', 'Palette pink'),
  C('palette-purple', 'Palette purple'),
  C('palette-blue', 'Palette blue'),
  C('palette-azure', 'Palette azure'),
  C('palette-white', 'Palette white'),
  C('palette-black', 'Palette black'),
  C('palette-foreground', 'Text on palette colors'),
  // Surfaces chosen by the style / extension axes.
  C('overlay', 'Modal / drawer mask'),
  C('menu', 'Menu surface (menu color axis)'),
  C('menu-foreground', 'Menu text'),
  C('menu-accent', 'Menu item highlight'),
  C('menu-accent-foreground', 'Menu item highlight text'),
  C('card-edge', 'Card ring (surface edge axis)'),
  C('popup-edge', 'Popup / dialog ring (surface edge axis)'),
  C('card-section', 'Card footer band (surface partition axis)'),
  C('card-section-border', 'Card footer divider (surface partition axis)'),
  C('outline', 'Outline button background (control look axis)'),
  C('outline-hover', 'Outline button hover background'),
  C('outline-border', 'Outline button border'),
  C('field', 'Input background (input look axis)'),
  C('field-border', 'Input border at rest'),
  C('choice', 'Checkbox / radio unchecked background'),
  C('choice-border', 'Checkbox / radio unchecked border'),
  C('switch-track', 'Switch unchecked track'),
  C('switch-track-border', 'Switch unchecked track border'),
  C('slider-rail', 'Slider / progress rail'),
  C('thumb', 'Slider thumb'),
  C('thumb-border', 'Slider thumb border'),
  C('focus', 'Focus color (focus color axis)'),

  // Typography.
  L('font-sans', 'Body font stack', 'font'),
  L('font-heading', 'Heading font stack', 'font'),
  L('font-mono', 'Monospace font stack', 'font'),
  L('text-size', 'Body text size (typography axis)'),
  L('text-size-meta', 'Meta / description text size'),
  L('text-size-heading', 'Card title size'),
  L('text-size-kpi', 'Large numeric size'),
  L('text-weight', 'Body weight', 'number'),
  L('text-weight-label', 'Label weight', 'number'),
  L('control-weight', 'Control label weight (text style axis)', 'number'),
  L('control-tracking', 'Control letter spacing'),
  L('control-transform', 'Control text transform', 'keyword'),
  L('heading-tracking', 'Heading letter spacing'),
  L('heading-transform', 'Heading text transform', 'keyword'),

  // Control size (md anchors; xs–xl follow the shared size curve).
  L('control-height', 'Control md height (density axis)'),
  L('control-padding', 'Control md inline padding'),
  L('control-gap', 'Control md gap'),
  L('control-icon', 'Control md icon size'),
  L('control-font-size', 'Control md font size'),
  L('control-line-height', 'Control md line box'),
  L('field-sides', 'Input side/top border weight (underline = 0%)', 'percent'),
  L('radio-fill', 'Checked radio fill (0% = outlined ring + dot)', 'percent'),
  L('border-width', 'Control border width'),

  // Containers.
  L('card-padding', 'Card padding (container padding axis)'),
  L('card-gap', 'Card section gap'),
  L('card-meta-gap', 'Card title/description gap'),
  L('card-title-delta', 'Card title size step'),
  L('card-font-size', 'Card body size'),
  L('card-border-width', 'Card ring width'),

  // Radius (base × allocation multiplier, shape axes, caps resolved by the compiler).
  L('radius', 'Radius base'),
  L('radius-button', 'Buttons, toggles'),
  L('radius-field', 'Inputs, selects, textareas'),
  L('radius-badge', 'Badges, tags'),
  L('radius-tabs', 'Tabs list / trigger'),
  L('radius-item', 'Menu / list items, compact chips'),
  L('radius-choice', 'Checkbox'),
  L('radius-radio', 'Radio'),
  L('radius-switch', 'Switch track'),
  L('radius-switch-thumb', 'Switch thumb (concentric)'),
  L('radius-thumb', 'Slider thumb'),
  L('radius-track', 'Slider / progress track'),
  L('radius-avatar', 'Avatar'),
  L('radius-card', 'Cards, alerts'),
  L('radius-popup', 'Popovers, menus, tooltips'),
  L('radius-dialog', 'Dialogs, drawers'),

  // Parts.
  L('switch-width', 'Switch width (switch look axis)'),
  L('switch-height', 'Switch height'),
  L('switch-inset', 'Switch thumb inset'),
  L('slider-track', 'Slider track thickness (slider look axis)'),
  L('slider-thumb', 'Slider thumb size'),
  L('progress-track', 'Progress bar thickness'),
  L('progress-ring', 'Circular progress size'),
  L('choice-size', 'Checkbox / radio size'),

  // Elevation (shadow axis; three linked tiers).
  L('shadow-control', 'Outline controls', 'shadow'),
  L('shadow-card', 'Cards (low tier)', 'shadow'),
  L('shadow-popup', 'Popovers, menus (mid tier)', 'shadow'),
  L('shadow-dialog', 'Dialogs, drawers (high tier)', 'shadow'),
  L('shadow-thumb', 'Slider thumb', 'shadow'),
  L('shadow-switch-thumb', 'Switch thumb', 'shadow'),
  L('menu-blur', 'Translucent menu backdrop blur'),

  // Focus (v3 §4.6).
  L('focus-outline-width', 'Keyboard focus outline width (0 = none)'),
  L('focus-ring-width', 'Keyboard focus ring width (0 = none)'),
  L('pointer-outline-width', 'Pointer focus outline width (0 = none)'),
  L('pointer-ring-width', 'Pointer focus ring width (0 = none)'),

  // Motion.
  L('duration-xs', 'Motion 1', 'time'),
  L('duration-sm', 'Motion 2', 'time'),
  L('duration-md', 'Motion 3', 'time'),
  L('duration-lg', 'Motion 5', 'time')
];

export const THEME_TOKEN_NAMES = THEME_TOKENS.map(token => TOKEN_PREFIX + token.name);
export const COLOR_TOKENS = THEME_TOKENS.filter(token => token.mode === 'color').map(token => token.name);
export const ROOT_TOKENS = THEME_TOKENS.filter(token => token.mode === 'root').map(token => token.name);
