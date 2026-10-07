// QXFRAME9A7C2 createApp (v3 §3–§4): customizer UI and interactions. The configuration model
// and theme compiler live in model.js.
import {
  THEMES, STYLES, BASE_COLORS, themesForBaseColor, FONTS, HEADING_FONTS, RADII,
  MENU_COLORS, MENU_ACCENTS, isTranslucentMenu, isInvertedMenu, EXT_AXES, SHAPE_AXES, EXT_GROUPS, ALL_EXT_AXES
} from './data.js';
import {
  PREVIEW_ITEMS, defaultConfig, normalizeConfig, serializeConfig, parseConfig, compileTheme, parseThemeHeader,
  randomizeConfig, resetConfig, resolveConfig
} from './model.js';

const Q = window.QXFRAME9A7C2;
const STORAGE_CONFIG = 'qxframe9a7c2-create-config';
const STORAGE_MODE = 'qxframe9a7c2-create-mode';
const STORAGE_EXT_OPEN = 'qxframe9a7c2-create-ext-open';
const OVERRIDE_DEBOUNCE_MS = 50;
const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);


/* ------------------------------------------------------------------ */
/* Application state                                                   */
/* ------------------------------------------------------------------ */

const state = {
  config: defaultConfig(),
  override: null,
  locks: new Set(),
  history: [],
  index: -1,
  item: '01',
  mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  version: 'unknown'
};
const listeners = new Set();
let overrideTimer = 0;

function emit() { for (const listener of listeners) listener(state); }

function readStorage(key) { try { return localStorage.getItem(key); } catch (error) { return null; } }
function writeStorage(key, value) { try { localStorage.setItem(key, value); } catch (error) {} }

function persist() {
  const query = serializeConfig(state.config, state.item);
  const url = new URL(window.location.href);
  url.search = query;
  window.history.replaceState(null, '', url);
  writeStorage(STORAGE_CONFIG, query);
}

function commit(next, { record = true } = {}) {
  const normalized = normalizeConfig(next);
  const before = serializeConfig(state.config);
  state.config = normalized;
  state.override = null;
  const after = serializeConfig(normalized);
  if (record && after !== before) {
    state.history = state.history.slice(0, state.index + 1);
    state.history.push(after);
    state.index = state.history.length - 1;
  }
  persist();
  emit();
}

function setMain(key, value) { commit({ ...state.config, [key]: value }); }
function setExt(key, value) {
  const ext = { ...state.config.ext };
  if (value === undefined) delete ext[key]; else ext[key] = value;
  commit({ ...state.config, ext });
}

function setOverride(patch) {
  clearTimeout(overrideTimer);
  overrideTimer = setTimeout(() => {
    state.override = patch;
    emit();
  }, OVERRIDE_DEBOUNCE_MS);
}
function clearOverride() {
  clearTimeout(overrideTimer);
  if (state.override) { state.override = null; emit(); }
}

function effectiveConfig() {
  if (!state.override) return state.config;
  const { ext, ...main } = state.override;
  return normalizeConfig({ ...state.config, ...main, ext: { ...state.config.ext, ...(ext || {}) } });
}

function undo() {
  if (state.index <= 0) return;
  state.index -= 1;
  commit(parseConfig(state.history[state.index]).config, { record: false });
}
function redo() {
  if (state.index >= state.history.length - 1) return;
  state.index += 1;
  commit(parseConfig(state.history[state.index]).config, { record: false });
}
function toggleLock(key) {
  if (state.locks.has(key)) state.locks.delete(key); else state.locks.add(key);
  emit();
}
function setMode(mode) {
  state.mode = mode;
  document.documentElement.classList.toggle('dark', mode === 'dark');
  writeStorage(STORAGE_MODE, mode);
  emit();
}
function toggleMode() { setMode(state.mode === 'dark' ? 'light' : 'dark'); }
function setItem(item) {
  if (!PREVIEW_ITEMS[item] || item === state.item) return;
  state.item = item;
  persist();
  emit();
}
function randomize() { commit(randomizeConfig(state.config, state.locks)); }

/* ------------------------------------------------------------------ */
/* Icons (inline SVG, v3 §3.2: one fixed icon set)                     */
/* ------------------------------------------------------------------ */

const ICONS = {
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  unlock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 7.75-1.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  follow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4v4.7h4.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  radius: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20v-5C4 8.925 8.925 4 15 4h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  type: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5h16v2M9 19h6M12 5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  accent: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12.13 12.94 18.2c-1.78 1.79-2.67 2.68-3.77 2.78a3.9 3.9 0 0 1-.54 0c-1.1-.1-1.99-.99-3.77-2.78l-2.02-2.03a2.86 2.86 0 0 1 0-4.04M19 12.13 10.92 4.03M19 12.13H2.84m8.08-8.1-8.08 8.1m8.08-8.1L8.9 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  style: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  axis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 17h6M18 7h2M14 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
};

/* ------------------------------------------------------------------ */
/* Pickers                                                             */
/* ------------------------------------------------------------------ */

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'text') el.textContent = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) if (child) el.appendChild(child);
  return el;
}

const pickers = [];

// A picker = trigger card + QX Dropdown (radio list). Hovering/arrowing an item previews it,
// leaving the menu or closing it reverts, clicking commits (menu stays open, like shadcn).
function createPicker(spec) {
  const trigger = h('button', { type: 'button', class: 'create-picker-trigger', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'data-create-picker': spec.id }, [
    h('span', { class: 'create-picker-label', text: spec.label }),
    h('span', { class: 'create-picker-value' }),
    h('span', { class: 'create-picker-icon' })
  ]);
  const lock = h('button', { type: 'button', class: 'create-picker-tool', 'data-create-lock': spec.id, 'aria-label': '锁定', title: '锁定（随机和重置时保持不变）', html: ICONS.unlock });
  const tools = h('div', { class: 'create-picker-tools' }, [lock]);
  let follow = null;
  if (spec.ext) {
    follow = h('button', { type: 'button', class: 'create-picker-tool', 'data-create-follow': spec.id, 'aria-label': '恢复跟随风格', title: '恢复跟随风格', html: ICONS.follow, hidden: true });
    tools.insertBefore(follow, lock);
    follow.addEventListener('click', () => setExt(spec.id, undefined));
  }
  const root = h('div', { class: 'create-picker', 'data-create-picker-root': spec.id }, [trigger, tools]);
  lock.addEventListener('click', () => toggleLock(spec.id));

  let dropdown = null;
  let open = false;
  const ensure = () => {
    if (dropdown) return dropdown;
    dropdown = Q.Components.Dropdown.create({
      reference: trigger,
      placement: 'right-start',
      offset: 20,
      closeOnSelect: false,
      flipOnOverflow: true,
      items: spec.items(state),
      value: spec.value(state.config),
      onOpenChange(isOpen) {
        open = isOpen;
        trigger.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) decoratePopup(dropdown, value => setOverride(spec.preview(value, state.config)), () => spec.items(state));
        else clearOverride();
      },
      onActiveChange(detail) {
        if (!open || !detail || detail.key === undefined || detail.key === null) return;
        const value = keyToValue(detail.key);
        if (value === undefined) return;
        setOverride(spec.preview(value, state.config));
      },
      onChange(value) {
        const next = Array.isArray(value) ? value[0] : value;
        if (next === undefined || next === null) return;
        spec.commit(next, state.config);
      }
    });
    return dropdown;
  };
  const keyToValue = key => {
    const item = flatItems(spec.items(state)).find(entry => entry.key === key);
    return item ? item.value : undefined;
  };
  // Create on first interaction so the panel paints without 28 popup runtimes.
  trigger.addEventListener('pointerdown', ensure, { once: true });
  trigger.addEventListener('keydown', ensure, { once: true });
  trigger.addEventListener('focus', ensure, { once: true });

  const picker = {
    id: spec.id, root, trigger,
    update(current) {
      const config = current.config;
      const view = spec.display(config);
      const valueEl = trigger.querySelector('.create-picker-value');
      valueEl.textContent = view.text;
      valueEl.classList.toggle('is-follow', Boolean(view.follow));
      if (view.tag) valueEl.appendChild(h('span', { class: 'create-picker-tag', text: view.tag }));
      trigger.querySelector('.create-picker-icon').innerHTML = view.icon || '';
      const locked = current.locks.has(spec.id);
      lock.setAttribute('data-locked', String(locked));
      lock.setAttribute('aria-label', locked ? '解锁' : '锁定');
      lock.innerHTML = locked ? ICONS.lock : ICONS.unlock;
      if (follow) follow.hidden = config.ext[spec.id] === undefined;
      trigger.disabled = Boolean(spec.disabled && spec.disabled(current));
      if (dropdown) {
        dropdown.setItems(spec.items(current));
        dropdown.setValue(spec.value(config));
      }
    },
    close() { if (dropdown && open) dropdown.close(); }
  };
  pickers.push(picker);
  return root;
}

function flatItems(items) {
  const out = [];
  for (const item of items) {
    if (item.items) out.push(...flatItems(item.items));
    else out.push(item);
  }
  return out;
}

// QX Dropdown moves its active item on keyboard navigation and press, not on hover, so pointer
// previews are derived here: the hovered item element is matched to its leaf item by order.
function decoratePopup(dropdown, onPreview, getItems) {
  const popup = dropdown.getPopupElement && dropdown.getPopupElement();
  if (!popup) return;
  popup.classList.add('create-picker-menu');
  popup.classList.add('dark');
  popup.__createPreview = onPreview;
  popup.__createItems = getItems;
  if (popup.__createWired) return;
  popup.__createWired = true;
  popup.addEventListener('mouseleave', clearOverride);
  popup.addEventListener('pointermove', event => {
    if (!popup.__createPreview || event.pointerType === 'touch') return;
    const element = event.target instanceof Element ? event.target.closest('.qxframe9a7c2-dropdown-item') : null;
    if (!element || element.getAttribute('aria-disabled') === 'true') return;
    const elements = [...popup.querySelectorAll('.qxframe9a7c2-dropdown-item')];
    const leaves = flatItems(popup.__createItems()).filter(item => item.type !== 'divider' && item.type !== 'title');
    const item = leaves[elements.indexOf(element)];
    if (item && !item.disabled) popup.__createPreview(item.value);
  });
}

const radio = (value, label, extra = {}) => ({ key: value, value, label, ...extra });
const divider = id => ({ key: 'divider-' + id, type: 'divider' });
const title = (id, label) => ({ key: 'title-' + id, type: 'title', label });
const swatch = color => `<span class="create-swatch" style="--create-swatch:${color}"></span>`;

function mainPickerSpecs() {
  const themeItems = current => {
    const list = themesForBaseColor(current.config.baseColor);
    const [base, ...accents] = list;
    return [radio(base, THEMES[base].title), divider('accents'), ...accents.map(name => radio(name, THEMES[name].title))];
  };
  const dotColor = name => BASE_COLORS.includes(name) ? THEMES[name].dark['muted-foreground'] : THEMES[name].dark.primary;
  return [
    {
      id: 'style', label: '风格',
      items: () => STYLES.map(s => radio(s.value, s.label, { shortcut: s.description })),
      value: c => c.style,
      display: c => ({ text: STYLES.find(s => s.value === c.style).label, icon: ICONS.style }),
      preview: value => ({ style: value }),
      commit: value => setMain('style', value)
    },
    { separator: true },
    {
      id: 'baseColor', label: '基础色',
      items: () => BASE_COLORS.map(name => radio(name, THEMES[name].title)),
      value: c => c.baseColor,
      display: c => ({ text: THEMES[c.baseColor].title, icon: swatch(THEMES[c.baseColor].dark['muted-foreground']) }),
      preview: value => ({ baseColor: value }),
      commit: value => setMain('baseColor', value)
    },
    {
      id: 'theme', label: '主题色',
      items: themeItems,
      value: c => c.theme,
      display: c => ({ text: THEMES[c.theme].title, icon: swatch(dotColor(c.theme)) }),
      preview: value => ({ theme: value }),
      commit: value => setMain('theme', value)
    },
    {
      id: 'chartColor', label: '图表色',
      items: themeItems,
      value: c => c.chartColor,
      display: c => ({ text: THEMES[c.chartColor].title, icon: swatch(dotColor(c.chartColor)) }),
      preview: value => ({ chartColor: value }),
      commit: value => setMain('chartColor', value)
    },
    { separator: true },
    {
      id: 'fontHeading', label: '标题字体',
      items: () => [radio('inherit', '跟随正文'), divider('fonts'), ...FONTS.map(f => radio(f.value, f.label))],
      value: c => c.fontHeading,
      display: c => ({ text: HEADING_FONTS.find(f => f.value === c.fontHeading).label, icon: ICONS.type }),
      preview: value => ({ fontHeading: value }),
      commit: value => setMain('fontHeading', value)
    },
    {
      id: 'font', label: '正文字体',
      items: () => FONTS.map(f => radio(f.value, f.label)),
      value: c => c.font,
      display: c => ({ text: FONTS.find(f => f.value === c.font).label, icon: ICONS.type }),
      preview: value => ({ font: value }),
      commit: value => setMain('font', value)
    },
    { separator: true },
    {
      id: 'radius', label: '圆角',
      items: () => [radio('default', '跟随风格'), divider('radii'), ...RADII.filter(r => r.value !== 'default').map(r => radio(r.value, r.label + (r.qx ? '（QX 扩展）' : '')))],
      value: c => c.radius,
      display: c => {
        const option = RADII.find(r => r.value === c.radius);
        if (c.radius === 'default') return { text: '跟随风格', follow: true, icon: ICONS.radius };
        return { text: option.label, tag: option.qx ? 'QX' : '', icon: ICONS.radius };
      },
      preview: value => ({ radius: value }),
      commit: value => setMain('radius', value)
    },
    { separator: true },
    {
      id: 'menuColor', label: '菜单',
      items: current => {
        const inverted = isInvertedMenu(current.config.menuColor);
        const translucent = isTranslucentMenu(current.config.menuColor);
        const dark = current.mode === 'dark';
        const value = (color, surface) => (color === 'inverted' ? 'inverted' : 'default') + (surface === 'translucent' ? '-translucent' : '');
        return [
          title('color', '颜色'),
          radio(value('default', translucent ? 'translucent' : 'solid'), '默认', { key: 'color-default' }),
          radio(value('inverted', translucent ? 'translucent' : 'solid'), '反色', { key: 'color-inverted', disabled: dark }),
          divider('surface'),
          title('surface', '表面'),
          radio(value(inverted ? 'inverted' : 'default', 'solid'), '实色', { key: 'surface-solid' }),
          radio(value(inverted ? 'inverted' : 'default', 'translucent'), '半透明', { key: 'surface-translucent' })
        ];
      },
      value: c => c.menuColor,
      display: c => ({ text: MENU_COLORS.find(m => m.value === c.menuColor).label, icon: ICONS.menu }),
      preview: value => isTranslucentMenu(value) ? { menuColor: value, menuAccent: 'subtle' } : { menuColor: value },
      commit: value => commit({ ...state.config, menuColor: value, ...(isTranslucentMenu(value) ? { menuAccent: 'subtle' } : {}) })
    },
    {
      id: 'menuAccent', label: '菜单强调',
      items: current => MENU_ACCENTS.map(a => radio(a.value, a.label, { disabled: a.value === 'bold' && isTranslucentMenu(current.config.menuColor) })),
      value: c => c.menuAccent,
      display: c => ({ text: MENU_ACCENTS.find(a => a.value === c.menuAccent).label, icon: ICONS.accent }),
      preview: value => ({ menuAccent: value }),
      commit: value => setMain('menuAccent', value)
    }
  ];
}

function extPickerSpec(axis) {
  const optionLabel = value => (axis.options.find(o => o.value === value) || {}).label || value;
  return {
    id: axis.key, label: axis.label, ext: true,
    items: current => {
      const resolved = axis.defaults[current.config.style];
      return [
        radio('follow', `${axis.followLabel || '跟随风格'}（${optionLabel(resolved) || 'QX 默认'}）`),
        divider(axis.key),
        ...axis.options.map(o => radio(o.value, o.label + (o.qx ? '（QX 扩展）' : '')))
      ];
    },
    value: c => c.ext[axis.key] ?? 'follow',
    display: c => {
      const explicit = c.ext[axis.key];
      if (explicit === undefined) {
        const resolved = axis.defaults[c.style];
        const known = axis.options.find(o => o.value === resolved);
        return { text: '跟随 · ' + (known ? known.label : 'QX 默认'), follow: true, icon: ICONS.axis };
      }
      const option = axis.options.find(o => o.value === explicit);
      return { text: option.label, tag: option.qx ? 'QX' : '', icon: ICONS.axis };
    },
    preview: value => ({ ext: { [axis.key]: value === 'follow' ? undefined : value } }),
    commit: value => setExt(axis.key, value === 'follow' ? undefined : value)
  };
}

function renderPanel(container) {
  const group = h('div', { class: 'create-field-group' });
  for (const spec of mainPickerSpecs()) {
    group.appendChild(spec.separator ? h('div', { class: 'create-separator' }) : createPicker(spec));
  }
  group.appendChild(h('div', { class: 'create-separator' }));
  const extOpen = readStorage(STORAGE_EXT_OPEN) !== '0';
  const toggle = h('button', { type: 'button', class: 'create-section-toggle', 'aria-expanded': String(extOpen), 'data-create-ext-toggle': true }, [
    h('span', { text: '扩展（QX）' }), h('span', { html: ICONS.chevron })
  ]);
  const body = h('div', { class: 'create-ext-body', 'data-create-ext-body': true, hidden: !extOpen });
  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(next));
    body.hidden = !next;
    writeStorage(STORAGE_EXT_OPEN, next ? '1' : '0');
  });
  const followAll = h('button', { type: 'button', class: 'create-follow-all', text: '全部恢复跟随风格', 'data-create-follow-all': true });
  followAll.addEventListener('click', () => {
    const ext = {};
    for (const axis of ALL_EXT_AXES) if (state.locks.has(axis.key) && state.config.ext[axis.key] !== undefined) ext[axis.key] = state.config.ext[axis.key];
    commit({ ...state.config, ext });
  });
  body.appendChild(followAll);
  for (const extGroup of EXT_GROUPS) {
    const axes = EXT_AXES.filter(axis => axis.group === extGroup.key);
    if (!axes.length) continue;
    body.appendChild(h('div', { class: 'create-subgroup-label', text: extGroup.label + (extGroup.key === 'advanced' ? '（QX 扩展）' : '') }));
    for (const axis of axes) body.appendChild(createPicker(extPickerSpec(axis)));
    if (extGroup.key === 'shape') {
      body.appendChild(h('div', { class: 'create-subgroup-label', text: '形状按类别覆盖（QX 扩展）' }));
      const allRadius = h('button', { type: 'button', class: 'create-follow-all', text: '全局：所有部件跟随圆角', 'data-create-shape-all': true });
      allRadius.addEventListener('click', () => {
        const ext = { ...state.config.ext };
        for (const axis of SHAPE_AXES) if (!state.locks.has(axis.key)) ext[axis.key] = 'radius';
        commit({ ...state.config, ext });
      });
      body.appendChild(allRadius);
      for (const axis of SHAPE_AXES) body.appendChild(createPicker(extPickerSpec(axis)));
    }
  }
  group.appendChild(toggle);
  group.appendChild(body);
  container.appendChild(group);
}

/* ------------------------------------------------------------------ */
/* Main menu, dialogs, shortcuts                                        */
/* ------------------------------------------------------------------ */

function mainMenuItems() {
  return [
    { key: 'import', value: 'import', label: '导入主题…', shortcut: 'O' },
    { key: 'random', value: 'random', label: '随机', shortcut: 'R' },
    { key: 'mode', value: 'mode', label: '明暗切换', shortcut: 'D' },
    { key: 'divider-1', type: 'divider' },
    { key: 'undo', value: 'undo', label: '撤销', shortcut: IS_MAC ? '⌘Z' : 'Ctrl+Z', disabled: state.index <= 0 },
    { key: 'redo', value: 'redo', label: '重做', shortcut: IS_MAC ? '⇧⌘Z' : 'Ctrl+Shift+Z', disabled: state.index >= state.history.length - 1 },
    { key: 'divider-2', type: 'divider' },
    { key: 'reset', value: 'reset', label: '重置…', shortcut: '⇧R' }
  ];
}

let mainMenu = null;
function setupMainMenu() {
  const trigger = document.querySelector('[data-create-main-menu]');
  mainMenu = Q.Components.Dropdown.create({
    reference: trigger,
    placement: 'right-start',
    offset: 20,
    selectable: false,
    items: mainMenuItems(),
    onOpenChange(isOpen) {
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) { mainMenu.setItems(mainMenuItems()); decoratePopup(mainMenu, null, mainMenuItems); }
    },
    onSelect(detail) { runAction(detail && (detail.value || detail.key)); }
  });
}

let resetModal = null;
let resetOpen = false;
function openReset() {
  if (!resetModal) {
    resetModal = Q.Components.Modal.create({
      autoOpen: false,
      title: '恢复默认设置？',
      content: '主面板恢复为当前风格的默认值，扩展轴全部恢复“跟随风格”。已锁定的选项保持不变。',
      width: 400,
      buttons: [{ content: '取消', role: 'cancel' }, { content: '重置', role: 'confirm' }],
      onConfirm() { confirmReset(); },
      onOpenChange(isOpen) { resetOpen = isOpen; }
    });
  }
  resetModal.open('reset');
}
function confirmReset() {
  commit(resetConfig(state.config, state.locks));
  if (resetModal && resetOpen) resetModal.close('confirm');
}

let codeModal = null;
function openCode() {
  const { css } = compileTheme(state.config, { version: state.version });
  const pre = h('pre', { class: 'create-code', 'data-create-code': true, text: css });
  const note = h('p', { class: 'create-dialog-note', text: '主题 CSS 写在 qxframe9a7c2.css 之后引入即可生效。头部注释记录了完整配置，可通过“导入”还原。' });
  const content = h('div', {}, [note, pre]);
  if (codeModal) codeModal.destroy();
  codeModal = Q.Components.Modal.create({
    autoOpen: false,
    title: '获取代码',
    content,
    width: 720,
    buttons: [
      { content: '下载 .css', role: 'cancel', onClick() { download(css); return false; } },
      { content: '复制', role: 'confirm', onClick() { copy(css); return false; } }
    ]
  });
  codeModal.open('code');
}
function download(css) {
  const url = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
  const a = h('a', { href: url, download: `qxframe9a7c2-theme-${state.config.style}-${state.config.theme}.css` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function copy(css) {
  const done = () => Q.Components.Message && Q.Components.Message.success ? Q.Components.Message.success('已复制主题 CSS') : null;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(css).then(done, () => {});
}

let importModal = null;
function openImport() {
  const textarea = h('textarea', { class: 'qxframe9a7c2-form-textarea create-import-input', 'data-create-import-input': true, placeholder: '粘贴之前通过“获取代码”导出的主题 CSS…', spellcheck: 'false' });
  const errorBox = h('div', { class: 'create-import-error', 'data-create-import-error': true, hidden: true });
  const content = h('div', {}, [h('p', { class: 'create-dialog-note', text: '从头部注释还原配置。格式有误时会提示原因，当前配置保持不变。' }), textarea, errorBox]);
  if (importModal) importModal.destroy();
  importModal = Q.Components.Modal.create({
    autoOpen: false,
    title: '导入主题',
    content,
    width: 640,
    buttons: [
      { content: '取消', role: 'cancel' },
      {
        content: '导入', role: 'confirm',
        onClick() {
          const result = parseThemeHeader(textarea.value);
          if (!result.ok) {
            errorBox.hidden = false;
            errorBox.className = 'qxframe9a7c2-alert is-error create-import-error';
            errorBox.replaceChildren(h('strong', { text: '无法导入' }), h('ul', {}, result.errors.map(message => h('li', { text: message }))));
            return false;
          }
          commit(result.config);
          return true;
        }
      }
    ]
  });
  importModal.open('import');
  setTimeout(() => textarea.focus(), 50);
}

function runAction(action) {
  switch (action) {
    case 'undo': undo(); break;
    case 'redo': redo(); break;
    case 'mode': toggleMode(); break;
    case 'random': randomize(); break;
    case 'reset': openReset(); break;
    case 'import': openImport(); break;
    case 'code': openCode(); break;
    default: break;
  }
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement);
}

// Shared by the host page and keys forwarded from the preview iframe.
export function handleShortcut(event) {
  if (isTypingTarget(event.target)) return false;
  const key = String(event.key || '').toLowerCase();
  const mod = event.metaKey || event.ctrlKey;
  if (mod && ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey))) { redo(); return true; }
  if (mod && key === 'z') { undo(); return true; }
  if (mod || event.altKey) return false;
  if (key === 'r' && event.shiftKey) { if (resetOpen) confirmReset(); else openReset(); return true; }
  if (key === 'r') { randomize(); return true; }
  if (key === 'd') { toggleMode(); return true; }
  if (key === 'o') { openImport(); return true; }
  return false;
}

/* ------------------------------------------------------------------ */
/* Preview iframe                                                      */
/* ------------------------------------------------------------------ */

const frame = document.querySelector('[data-create-frame]');
let frameReady = false;
let lastSent = '';

function previewPayload() {
  const config = effectiveConfig();
  return {
    type: 'qxframe9a7c2-create:apply',
    css: compileTheme(config, { version: state.version, generatedAt: '' }).body,
    style: config.style,
    mode: state.mode,
    labels: (() => {
      const style = STYLES.find(item => item.value === config.style).label;
      const body = FONTS.find(item => item.value === config.font).label;
      const heading = config.fontHeading === 'inherit' ? null : HEADING_FONTS.find(item => item.value === config.fontHeading).label;
      return {
        'style-font': `${style} - ${heading && heading !== body ? heading : body}`,
        'heading-body': `${heading && heading !== body ? heading : 'Inherit'} - ${body}`
      };
    })(),
    menuInverted: isInvertedMenu(config.menuColor),
    menuTranslucent: isTranslucentMenu(config.menuColor)
  };
}

function sendPreview(force) {
  if (!frameReady || !frame.contentWindow) return;
  const payload = previewPayload();
  const key = JSON.stringify(payload);
  if (!force && key === lastSent) return;
  lastSent = key;
  frame.contentWindow.postMessage(payload, window.location.origin === 'null' ? '*' : window.location.origin);
}

function loadPreview() {
  frameReady = false;
  lastSent = '';
  frame.src = PREVIEW_ITEMS[state.item];
}

window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'qxframe9a7c2-create:ready') { frameReady = true; sendPreview(true); }
  if (event.data.type === 'qxframe9a7c2-create:key') handleShortcut({ ...event.data, target: null });
  if (event.data.type === 'qxframe9a7c2-create:pointer') {
    for (const picker of pickers) picker.close();
    if (mainMenu) mainMenu.close();
  }
});

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function updateChrome() {
  for (const picker of pickers) picker.update(state);
  const undoButton = document.querySelector('[data-create-action="undo"]');
  const redoButton = document.querySelector('[data-create-action="redo"]');
  undoButton.disabled = state.index <= 0;
  redoButton.disabled = state.index >= state.history.length - 1;
  for (const button of document.querySelectorAll('[data-create-item]')) {
    button.setAttribute('aria-pressed', String(button.getAttribute('data-create-item') === state.item));
  }
  const expected = new URL(PREVIEW_ITEMS[state.item], window.location.href).href;
  if (frame.src !== expected) loadPreview();
  else sendPreview(false);
}

async function loadVersion() {
  try {
    const response = await fetch('../../dist/qxframe9a7c2-module-manifest.json', { cache: 'no-cache' });
    if (response.ok) state.version = (await response.json()).version || 'unknown';
  } catch (error) {}
}

// The createApp chrome itself always uses the default theme (Nova + neutral), independent of the
// configuration being edited.
function applyChromeTheme() {
  const el = document.createElement('style');
  el.id = 'qxframe9a7c2-create-chrome-theme';
  el.textContent = compileTheme(defaultConfig(), { generatedAt: '' }).body;
  document.head.appendChild(el);
}

function boot() {
  applyChromeTheme();
  const fromUrl = parseConfig(window.location.search);
  const stored = readStorage(STORAGE_CONFIG);
  const initial = fromUrl.hasParams ? fromUrl : (stored !== null ? parseConfig(stored) : fromUrl);
  state.config = initial.config;
  state.item = initial.item || '01';
  state.history = [serializeConfig(state.config)];
  state.index = 0;

  renderPanel(document.querySelector('[data-create-pickers]'));
  setupMainMenu();
  for (const button of document.querySelectorAll('[data-create-action]')) {
    button.addEventListener('click', () => runAction(button.getAttribute('data-create-action')));
  }
  for (const button of document.querySelectorAll('[data-create-item]')) {
    button.addEventListener('click', () => setItem(button.getAttribute('data-create-item')));
  }
  document.addEventListener('keydown', event => { if (handleShortcut(event)) event.preventDefault(); });
  listeners.add(updateChrome);
  persist();
  updateChrome();
  loadVersion();
  window.QXFRAME9A7C2_CREATE = { state, commit, undo, redo, randomize, toggleLock, setItem, setMode, compileTheme, parseThemeHeader, resolveConfig, serializeConfig };
}

if (Q && Q.Components) boot();
else document.body.insertAdjacentHTML('afterbegin', '<p style="padding:1rem">无法加载 qxframe9a7c2.js，请检查网络后刷新。</p>');
