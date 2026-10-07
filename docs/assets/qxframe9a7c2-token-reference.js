// Token Reference: the closed --qxframe9a7c2-theme-* list (createApp v3 §5) with the values the
// default theme built into qxframe.css resolves to in light and dark mode. Customise themes in
// createApp (docs/create/), which exports the same list.
import { THEME_TOKENS, TOKEN_PREFIX } from '../create/tokens.js';

const app = document.getElementById('qxframe9a7c2-token-reference-app');
const docsTheme = window.QXFRAME9A7C2_DOCS_THEME || null;

const GROUPS = [
  { title: '颜色', test: token => token.mode === 'color' },
  { title: '字体与文字', test: token => token.kind === 'font' || /^(text|control-weight|control-tracking|control-transform|heading)/.test(token.name) },
  { title: '控件尺寸', test: token => /^(control-|field-sides|radio-fill|border-width)/.test(token.name) },
  { title: '容器', test: token => token.name.startsWith('card-') },
  { title: '圆角', test: token => token.name.startsWith('radius') },
  { title: '部件', test: token => /^(switch|slider|progress|choice)/.test(token.name) },
  { title: '阴影', test: token => token.kind === 'shadow' || token.name === 'menu-blur' },
  { title: '焦点', test: token => /^(focus|pointer)/.test(token.name) },
  { title: '动效', test: token => token.kind === 'time' }
];

const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Read a token's value as resolved inside a light or dark probe element.
function probeValues() {
  const make = dark => {
    const el = document.createElement('div');
    el.className = dark ? 'dark' : '';
    el.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(el);
    return el;
  };
  const light = make(false), dark = make(true);
  const read = (el, name) => getComputedStyle(el).getPropertyValue(TOKEN_PREFIX + name).trim();
  const values = {};
  for (const token of THEME_TOKENS) values[token.name] = { light: read(light, token.name), dark: token.mode === 'color' ? read(dark, token.name) : '' };
  light.remove(); dark.remove();
  return values;
}

function swatch(value) {
  return `<span class="qxframe9a7c2-token-swatch" style="background:${esc(value)}"></span>`;
}

function render() {
  const values = probeValues();
  const used = new Set();
  const sections = GROUPS.map(group => {
    const tokens = THEME_TOKENS.filter(token => !used.has(token.name) && group.test(token));
    tokens.forEach(token => used.add(token.name));
    const rows = tokens.map(token => {
      const v = values[token.name];
      const color = token.mode === 'color';
      return `<tr>
        <td><code>${esc(TOKEN_PREFIX + token.name)}</code></td>
        <td>${esc(token.note)}</td>
        <td>${color ? swatch(v.light) : ''}<code>${esc(v.light)}</code></td>
        <td>${color ? swatch(v.dark) + `<code>${esc(v.dark)}</code>` : '<span class="qxframe9a7c2-token-muted">同亮色</span>'}</td>
      </tr>`;
    }).join('');
    return `<section class="qxframe9a7c2-card qxframe9a7c2-token-section">
      <div class="qxframe9a7c2-card-header"><div class="qxframe9a7c2-card-heading"><div class="qxframe9a7c2-card-title">${esc(group.title)}</div><div class="qxframe9a7c2-card-description">${tokens.length} 个</div></div></div>
      <div class="qxframe9a7c2-card-content"><div class="qxframe9a7c2-table-wrap"><table class="qxframe9a7c2-table is-sm">
        <thead><tr><th>Token</th><th>用途</th><th>亮色</th><th>暗色</th></tr></thead><tbody>${rows}</tbody>
      </table></div></div>
    </section>`;
  }).join('');
  const mode = docsTheme ? docsTheme.getState().effectiveMode : 'light';
  app.innerHTML = `<main class="qxframe9a7c2-token-page">
    <header class="qxframe9a7c2-card qxframe9a7c2-token-hero-copy">
      <div class="qxframe9a7c2-card-header"><div class="qxframe9a7c2-card-heading">
        <div class="qxframe9a7c2-card-title">主题 Token 清单</div>
        <div class="qxframe9a7c2-card-description">qxframe.css 的全部主题输入：共 ${THEME_TOKENS.length} 个 <code>${TOKEN_PREFIX}*</code>，只写在 <code>:root</code> 与 <code>.dark</code>。下表为内置默认主题（Nova + neutral）的取值。</div>
      </div></div>
      <div class="qxframe9a7c2-card-footer qxframe9a7c2-token-control-card">
        <a class="qxframe9a7c2-button is-primary is-solid is-sm qxframe9a7c2-token-button" href="create/"><span class="qxframe9a7c2-button-label">在 createApp 中定制主题</span></a>
        <button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-token-mode><span class="qxframe9a7c2-button-label">${mode === 'dark' ? '切换为亮色' : '切换为暗色'}</span></button>
      </div>
    </header>
    ${sections}
  </main>`;
  const toggle = app.querySelector('[data-token-mode]');
  if (toggle && docsTheme) toggle.addEventListener('click', () => docsTheme.setState({ mode: docsTheme.getState().effectiveMode === 'dark' ? 'light' : 'dark' }));
}

if (app) {
  render();
  window.addEventListener('qxframe9a7c2:docs-theme-change', render);
}
