import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const componentPath=path.join(root,'src/styles/components/_components.scss');
const themePath=path.join(root,'src/styles/theme/_family.scss');
const css=fs.readFileSync(componentPath,'utf8');
const theme=fs.readFileSync(themePath,'utf8');
const viewportRe=/-?\d*\.?\d+(?:vw|vh|vmin|vmax)\b/ig;

assert.match(css,/\.qxframe9a7c2-modal-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-modal-container\{[^}]*width:min\(35rem,calc\(100% - 3rem\)\);max-height:calc\(100% - 3rem\)/);
assert.match(css,/\.qxframe9a7c2-modal-container\.is-fullscreen\{width:100%;[^}]*height:100%;/);

assert.match(css,/\.qxframe9a7c2-drawer-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\{position:absolute;inset:0;/);
assert.match(css,/\.qxframe9a7c2-drawer\{[^}]*width:min\(26\.25rem,calc\(100% - 2\.5rem\)\);max-width:100%;/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\.is-top>\.qxframe9a7c2-drawer,\.qxframe9a7c2-drawer-wrap\.is-bottom>\.qxframe9a7c2-drawer\{width:100%;height:min\(22\.5rem,70%\);max-height:100%\}/);

assert.match(css,/\.qxframe9a7c2-notice-stack\{[\s\S]*?position:fixed;[^}]*width:100%;height:100%;/);
assert.match(css,/\.qxframe9a7c2-message-stack\{[\s\S]*?width:min\(100%,calc\(var\(--qxframe9a7c2-notice-rail-width\)/);
assert.match(css,/\.qxframe9a7c2-notification-stack\{[\s\S]*?width:min\(100%,calc\(var\(--qxframe9a7c2-notice-rail-width\)/);

assert.doesNotMatch(theme,viewportRe,'Theme layer must no longer contain viewport units.');
assert.match(theme,/\.qxframe9a7c2-overflow-scroll-host\{[^}]*width:22rem;min-width:0;max-width:100%;/);

const remaining=[];
css.split(/\r?\n/).forEach((line,index)=>{
  const matches=line.match(viewportRe);
  if(!matches) return;
  for(const raw of matches) remaining.push({line:index+1,raw,text:line.trim()});
});
assert.equal(remaining.length,23,'Viewport closeout inventory changed; update the evidence map before continuing.');
const allowed=/qxframe9a7c2-(?:upload-preview|image-preview|notification|message|notice)/;
for(const item of remaining) assert.match(item.text,allowed,'Only preview-media and Notice zero-width geometry may retain viewport units at this checkpoint.');

assert.doesNotMatch(css,/qxframe9a7c2-(?:popover-root|menu-submenu-panel|tooltip-root|popconfirm-root|dropdown-panel|dropdown-submenu-panel|cascader-panel|cascader-search-results|date-picker-composite|color-picker-panel|table-filter-popup)[^\n]*(?:vw|vh|vmin|vmax)/);
assert.doesNotMatch(css,/qxframe9a7c2-(?:tags-overflow-scroll-host|tabs-overflow-scroll-host|loading-progress|sort\.is-horizontal)[^\n]*(?:vw|vh|vmin|vmax)/);

console.log(JSON.stringify({
  ok:true,
  removedViewportConsumers:31,
  remainingViewportConsumers:remaining.length,
  remainingFamilies:['Upload preview','Image preview','Notice zero-width geometry']
}));
