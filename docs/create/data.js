// createApp option tables (v3 §4). Main-panel options mirror shadcn create
// (shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c, MIT); extension axes are QX.
import { THEMES } from './themes.js';

export { THEMES };

export const STYLES = [
  { value: 'vega', label: 'Vega', description: '简洁、中性、熟悉' },
  { value: 'nova', label: 'Nova', description: '更紧凑的内外边距' },
  { value: 'maia', label: 'Maia', description: '圆润，留白宽松' },
  { value: 'lyra', label: 'Lyra', description: '方正锐利，适合等宽字体' },
  { value: 'mira', label: 'Mira', description: '为高密度界面设计' },
  { value: 'luma', label: 'Luma', description: '流畅、明亮、柔和' },
  { value: 'sera', label: 'Sera', description: '编辑式，重排版' },
  { value: 'rhea', label: 'Rhea', description: '类似 Luma，但更紧凑' }
];

export const BASE_COLORS = ['neutral', 'stone', 'zinc', 'mauve', 'olive', 'mist', 'taupe'];
export const ACCENT_THEMES = Object.keys(THEMES).filter(name => !BASE_COLORS.includes(name));

// shadcn getThemesForBaseColor: the current base color plus every non-base theme.
export function themesForBaseColor(baseColor) {
  return [baseColor, ...ACCENT_THEMES];
}

// Theme → chart color pairings used when shuffling (shadcn randomize-biases).
export const CHART_COLOR_PAIRINGS = {
  red: ['teal', 'sky'], orange: ['teal', 'blue'], amber: ['cyan', 'indigo'], yellow: ['sky', 'violet'],
  lime: ['indigo', 'pink'], green: ['purple', 'rose'], emerald: ['purple', 'red'], teal: ['fuchsia', 'red'],
  cyan: ['rose', 'amber'], sky: ['red', 'yellow'], blue: ['orange', 'yellow'], indigo: ['amber', 'yellow'],
  violet: ['yellow', 'lime'], purple: ['green', 'lime'], fuchsia: ['lime', 'teal'], pink: ['green', 'cyan'],
  rose: ['emerald', 'sky']
};

// v3 §4.4: system fonts only, four categories, Windows first.
export const FONTS = [
  { value: 'system', label: '系统默认', stack: 'system-ui, sans-serif' },
  { value: 'sans', label: '无衬线', stack: '"Segoe UI", Arial, "Helvetica Neue", "Microsoft YaHei", "PingFang SC", sans-serif' },
  { value: 'serif', label: '衬线', stack: 'Georgia, "Times New Roman", Times, SimSun, "Songti SC", serif' },
  { value: 'mono', label: '等宽', stack: 'Consolas, "Cascadia Mono", Menlo, "Microsoft YaHei", monospace' }
];
export const HEADING_FONTS = [{ value: 'inherit', label: '跟随正文', stack: null }, ...FONTS];

// v3 §4.1 radius: "跟随风格" + fixed values; 4px and 18px are QX extensions. No style locks it.
export const RADII = [
  { value: 'default', label: '跟随风格', rem: null },
  { value: 'none', label: '直角', rem: '0rem', px: 0 },
  { value: 'xs', label: '极小', rem: '0.25rem', px: 4, qx: true },
  { value: 'sm', label: '小', rem: '0.45rem', px: 7.2 },
  { value: 'md', label: '中', rem: '0.625rem', px: 10 },
  { value: 'lg', label: '大', rem: '0.875rem', px: 14 },
  { value: 'xl', label: '特大', rem: '1.125rem', px: 18, qx: true }
];

export const MENU_COLORS = [
  { value: 'default', label: '默认 / 实色' },
  { value: 'default-translucent', label: '默认 / 半透明' },
  { value: 'inverted', label: '反色 / 实色' },
  { value: 'inverted-translucent', label: '反色 / 半透明' }
];
export const MENU_ACCENTS = [
  { value: 'subtle', label: '柔和' },
  { value: 'bold', label: '醒目' }
];
export function isTranslucentMenu(value) { return value === 'default-translucent' || value === 'inverted-translucent'; }
export function isInvertedMenu(value) { return value === 'inverted' || value === 'inverted-translucent'; }

// Per-style main-panel defaults (shadcn PRESETS; fonts mapped to the four system categories).
export const STYLE_PRESETS = {
  vega: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' },
  nova: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' },
  maia: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' },
  lyra: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'mono', fontHeading: 'inherit' },
  mira: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' },
  luma: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' },
  sera: { baseColor: 'taupe', theme: 'taupe', chartColor: 'taupe', font: 'sans', fontHeading: 'serif' },
  rhea: { baseColor: 'neutral', theme: 'neutral', chartColor: 'neutral', font: 'sans', fontHeading: 'inherit' }
};
// Radius the style resolves to when the radius picker says "跟随风格".
export const STYLE_RADIUS = { vega: 'md', nova: 'md', maia: 'md', lyra: 'none', mira: 'md', luma: 'md', sera: 'none', rhea: 'md' };

export const MAIN_DEFAULTS = {
  style: 'nova', ...STYLE_PRESETS.nova, radius: 'default', menuColor: 'default', menuAccent: 'subtle'
};
export const MAIN_KEYS = ['style', 'baseColor', 'theme', 'chartColor', 'fontHeading', 'font', 'radius', 'menuColor', 'menuAccent'];

// v3 §4.2 extension axes. Every axis starts with "跟随风格" (stored as undefined); `defaults`
// gives the level each style resolves to. Values marked qx are QX extensions.
const S = (vega, nova, maia, lyra, mira, luma, sera, rhea) => ({ vega, nova, maia, lyra, mira, luma, sera, rhea });
export const EXT_AXES = [
  { key: 'density', param: 'density', label: '控件密度', group: 'size', options: [
    { value: 'dense', label: '高密 28' }, { value: 'compact', label: '紧凑 32' }, { value: 'standard', label: '标准 36' },
    { value: 'loose', label: '宽松 40' }, { value: 'touch', label: '超宽松 44', qx: true }],
    defaults: S('standard', 'compact', 'standard', 'compact', 'dense', 'standard', 'loose', 'compact') },
  { key: 'padding', param: 'padding', label: '容器留白', group: 'size', options: [
    { value: 'p12', label: '极紧凑 12', qx: true }, { value: 'p16', label: '紧凑 16' }, { value: 'p20', label: '适中 20' },
    { value: 'p24', label: '标准 24' }, { value: 'p28', label: '舒展 28', qx: true }, { value: 'p32', label: '宽松 32' }],
    defaults: S('p24', 'p16', 'p24', 'p16', 'p16', 'p24', 'p32', 'p20') },
  { key: 'typography', param: 'type', label: '排版密度', group: 'type', options: [
    { value: 'compact', label: '紧凑 12' }, { value: 'standard', label: '标准 14' }, { value: 'roomy', label: '疏朗 16', qx: true }],
    defaults: S('standard', 'standard', 'standard', 'compact', 'compact', 'standard', 'standard', 'standard') },
  { key: 'textStyle', param: 'text', label: '文字风格', group: 'type', options: [
    { value: 'regular', label: '常规' }, { value: 'editorial', label: '编辑式' }],
    defaults: S('regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'editorial', 'regular') },
  { key: 'controlLook', param: 'control', label: '控件外观', group: 'look', options: [
    { value: 'solid', label: '实底' }, { value: 'solid-shadow', label: '实底带阴影' }, { value: 'tinted', label: '浅着色' },
    { value: 'transparent', label: '透明' }, { value: 'light-solid', label: '亮实暗透' }, { value: 'ghost', label: '全透明' }],
    defaults: S('solid-shadow', 'solid', 'tinted', 'solid', 'transparent', 'light-solid', 'ghost', 'light-solid') },
  { key: 'inputLook', param: 'input', label: '输入外观', group: 'look', options: [
    { value: 'outline', label: '描边' }, { value: 'tinted', label: '浅着色' }, { value: 'subtle', label: '微着色' },
    { value: 'soft', label: '柔和填充' }, { value: 'underline', label: '下划线' }, { value: 'borderless', label: '无边框', qx: true }],
    defaults: S('outline', 'outline', 'tinted', 'outline', 'subtle', 'soft', 'underline', 'soft') },
  { key: 'radiusAlloc', param: 'alloc', label: '圆角分配', group: 'shape', options: [
    { value: 'standard', label: '标准' }, { value: 'balanced', label: '均衡' }, { value: 'compact', label: '精简' },
    { value: 'rounded', label: '圆润' }, { value: 'soft', label: '柔和' }, { value: 'smooth', label: '圆滑' }],
    // Lyra / Sera resolve to a zero radius, so their allocation has no visible effect; aligned in stage 2.
    defaults: S('standard', 'balanced', 'rounded', 'balanced', 'compact', 'soft', 'standard', 'smooth') },
  { key: 'controlShape', param: 'shape', label: '控件形状', group: 'shape', options: [
    { value: 'follow', label: '跟随圆角' }, { value: 'pill', label: '胶囊' }],
    defaults: S('follow', 'follow', 'follow', 'follow', 'follow', 'follow', 'follow', 'follow') },
  { key: 'switchLook', param: 'switch', label: '开关外观', group: 'parts', options: [
    { value: 'standard', label: '标准 32×18.4' }, { value: 'compact', label: '紧凑 28×16.6' }, { value: 'wide', label: '宽体 44×20' },
    { value: 'tall', label: '加高 32×20' }, { value: 'square', label: '方形 33×18' }],
    defaults: S('standard', 'standard', 'standard', 'standard', 'compact', 'wide', 'square', 'tall') },
  { key: 'sliderLook', param: 'slider', label: '滑块外观', group: 'parts', options: [
    { value: 't2', label: '细线 2' }, { value: 't4', label: '纤细 4' }, { value: 't6', label: '标准 6' },
    { value: 't8', label: '粗 8' }, { value: 't12', label: '胶囊 12' }],
    defaults: S('t6', 't4', 't12', 't4', 't4', 't8', 't2', 't4') },
  { key: 'sections', param: 'sections', label: '表面分区', group: 'surface', options: [
    { value: 'none', label: '无分区' }, { value: 'divider', label: '仅分隔线' }, { value: 'muted', label: '灰底分区' }],
    defaults: S('none', 'muted', 'none', 'divider', 'none', 'none', 'none', 'none') },
  { key: 'shadow', param: 'shadow', label: '阴影强度', group: 'surface', options: [
    { value: 'none', label: '无' }, { value: 'light', label: '轻' }, { value: 'medium', label: '适中' },
    { value: 'strong', label: '明显' }, { value: 'heavy', label: '强' }],
    // Card tier from shadcn styles: vega shadow-xs, luma shadow-md, sera/rhea shadow-sm, others none.
    defaults: S('light', 'none', 'none', 'none', 'none', 'strong', 'medium', 'medium') },
  { key: 'edge', param: 'edge', label: '表面边缘', group: 'surface', options: [
    { value: 'none', label: '无描边', qx: true }, { value: 'faint', label: '淡描边' }, { value: 'clear', label: '清晰描边' },
    { value: 'strong', label: '强描边', qx: true }],
    defaults: S('clear', 'clear', 'clear', 'clear', 'clear', 'faint', 'faint', 'faint') },
  // Seven independent Hover/Focus axes. An absent override always means follow Style.
  { key: 'hoverStyle', param: 'hover-style', label: 'Hover 样式', group: 'focus', options: [
    { value: 'border', label: '边框' }, { value: 'background', label: '背景' },
    { value: 'both', label: '边框 + 背景' }, { value: 'none', label: '无' }],
    defaults: S(...Array(8).fill('border')) },
  { key: 'hoverColor', param: 'hover-color', label: 'Hover 颜色', group: 'focus', options: [
    { value: 'neutral', label: '中性色' }, { value: 'theme', label: '主题色' }, { value: 'black-white', label: '黑白' }],
    defaults: S(...Array(8).fill('neutral')) },
  { key: 'keyboardFocus', param: 'kfocus', label: '键盘 Focus 样式', group: 'focus', followLabel: '跟随风格（QX Outline）', options: [
    { value: 'border', label: '边框' }, { value: 'ring', label: '光环' }, { value: 'outline', label: '外轮廓' }],
    defaults: S(...Array(8).fill('outline')) },
  { key: 'keyboardFocusColor', param: 'kfocus-color', label: '键盘 Focus 颜色', group: 'focus', options: [
    { value: 'neutral', label: '中性色' }, { value: 'theme', label: '主题色' }, { value: 'black-white', label: '黑白' }],
    defaults: S(...Array(8).fill('black-white')) },
  { key: 'pointerFocus', param: 'pfocus', label: '鼠标 Focus 样式', group: 'focus', followLabel: '跟随风格（QX Border）', options: [
    { value: 'border', label: '边框' }, { value: 'ring', label: '光环' }, { value: 'outline', label: '外轮廓' }],
    defaults: S(...Array(8).fill('border')) },
  { key: 'pointerFocusColor', param: 'pfocus-color', label: '鼠标 Focus 颜色', group: 'focus', options: [
    { value: 'neutral', label: '中性色' }, { value: 'theme', label: '主题色' }, { value: 'black-white', label: '黑白' }],
    defaults: S(...Array(8).fill('black-white')) },
  { key: 'focusBackground', param: 'focus-bg', label: 'Focus 背景', group: 'focus', options: [
    { value: 'keep', label: '保持当前背景' }, { value: 'parent-surface', label: '父级表面' }],
    defaults: S(...Array(8).fill('keep')) },
  { key: 'hairline', param: 'hairline', label: '边界清晰度', group: 'advanced', qx: true, options: [
    { value: 'thin', label: '细' }, { value: 'standard', label: '标准' }, { value: 'clear', label: '清晰' }],
    defaults: S('standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard') },
  { key: 'motion', param: 'motion', label: '动效', group: 'advanced', qx: true, options: [
    { value: 'none', label: '无' }, { value: 'fast', label: '快速' }, { value: 'standard', label: '标准' }, { value: 'relaxed', label: '舒缓' }],
    defaults: S('standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard') }
];

// v3 §4.5 per-category shape overrides.
const CONTROL_SHAPES = [
  { value: 'control', label: '跟随控件形状' }, { value: 'radius', label: '跟随圆角' }, { value: 'pill', label: '胶囊' }, { value: 'square', label: '直角' }
];
const ROUND_SHAPES = [{ value: 'circle', label: '圆形' }, { value: 'radius', label: '跟随圆角' }, { value: 'square', label: '直角' }];
export const SHAPE_AXES = [
  { key: 'shapeButton', param: 'shape-button', label: '按钮', options: CONTROL_SHAPES, defaults: S(...Array(8).fill('control')) },
  { key: 'shapeInput', param: 'shape-input', label: '输入框', options: CONTROL_SHAPES, defaults: S(...Array(8).fill('control')) },
  { key: 'shapeSelect', param: 'shape-select', label: '选择器', options: CONTROL_SHAPES, defaults: S(...Array(8).fill('control')) },
  { key: 'shapeBadge', param: 'shape-badge', label: '徽章', options: CONTROL_SHAPES, defaults: S(...Array(8).fill('control')) },
  { key: 'shapeTabs', param: 'shape-tabs', label: '标签页', options: CONTROL_SHAPES, defaults: S(...Array(8).fill('control')) },
  { key: 'shapeSwitch', param: 'shape-switch', label: '开关', options: CONTROL_SHAPES, defaults: S('pill', 'pill', 'pill', 'pill', 'pill', 'pill', 'square', 'radius') },
  // shadcn: Rhea radio is rounded-2xl; Maia / Lyra / Mira / Rhea thumbs follow the radius, Sera's is square.
  { key: 'shapeRadio', param: 'shape-radio', label: '单选框', options: ROUND_SHAPES, defaults: S('circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'radius') },
  { key: 'shapeThumb', param: 'shape-thumb', label: '滑块手柄', options: ROUND_SHAPES, defaults: S('circle', 'circle', 'radius', 'radius', 'radius', 'circle', 'square', 'radius') },
  { key: 'shapeAvatar', param: 'shape-avatar', label: '头像', options: ROUND_SHAPES, defaults: S(...Array(8).fill('circle')) },
  { key: 'shapeContainer', param: 'shape-container', label: '容器', options: [{ value: 'radius', label: '跟随圆角' }, { value: 'square', label: '直角' }], defaults: S(...Array(8).fill('radius')) }
];

export const EXT_GROUPS = [
  { key: 'size', label: '尺寸' },
  { key: 'type', label: '文字' },
  { key: 'look', label: '控件' },
  { key: 'shape', label: '形状' },
  { key: 'parts', label: '部件' },
  { key: 'surface', label: '表面' },
  { key: 'focus', label: '焦点' },
  { key: 'advanced', label: '高级' }
];

export const ALL_EXT_AXES = [...EXT_AXES, ...SHAPE_AXES];
