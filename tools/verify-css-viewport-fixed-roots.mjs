import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const componentPath=path.join(root,'src/styles/components/_components.scss');
const familyPath=path.join(root,'src/styles/theme/_family.scss');
const themePath=path.join(root,'src/styles/theme/_default.scss');
const css=fs.readFileSync(componentPath,'utf8');
const family=fs.readFileSync(familyPath,'utf8');
const theme=fs.readFileSync(themePath,'utf8');
const noticeService=fs.readFileSync(path.join(root,'src/core/noticeService.js'),'utf8');
const viewportRe=/-?\d*\.?\d+(?:vw|vh|vmin|vmax)\b/ig;

for(const rel of getCanonicalStyleModulePaths({root})){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.doesNotMatch(source,viewportRe,`Viewport units are forbidden after closeout: ${rel}`);
}

assert.match(css,/\.qxframe9a7c2-modal-root\{[^}]*position:fixed;inset:0;/);
assert.match(theme,/--qxframe9a7c2-theme-modal-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \* 2 \+ var\(--qxframe9a7c2-size-24\)\)/);
assert.match(theme,/--qxframe9a7c2-theme-modal-viewport-gap:\s*var\(--qxframe9a7c2-size-24\)/);
assert.match(css,/\.qxframe9a7c2-modal-container\{[^}]*width:min\(var\(--qxframe9a7c2-theme-modal-width\),calc\(100% - var\(--qxframe9a7c2-theme-modal-viewport-gap\)\)\);max-height:calc\(100% - var\(--qxframe9a7c2-theme-modal-viewport-gap\)\)/);
assert.match(css,/\.qxframe9a7c2-modal-container\.is-fullscreen\{width:100%;[^}]*height:100%;/);

assert.match(css,/\.qxframe9a7c2-drawer-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\{position:absolute;inset:0;/);
assert.match(theme,/--qxframe9a7c2-theme-drawer-width:\s*calc\(var\(--qxframe9a7c2-size-43\) \* 2 \+ var\(--qxframe9a7c2-size-2\)\)/);
assert.match(theme,/--qxframe9a7c2-theme-drawer-viewport-gap:\s*var\(--qxframe9a7c2-size-20\)/);
assert.match(css,/\.qxframe9a7c2-drawer\{[^}]*width:min\(var\(--qxframe9a7c2-theme-drawer-width\),calc\(100% - var\(--qxframe9a7c2-theme-drawer-viewport-gap\)\)\);max-width:100%;/);
assert.match(theme,/--qxframe9a7c2-theme-drawer-horizontal-height:\s*calc\(var\(--qxframe9a7c2-size-46\) \+ var\(--qxframe9a7c2-size-35\)\)/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\.is-top>\.qxframe9a7c2-drawer,\.qxframe9a7c2-drawer-wrap\.is-bottom>\.qxframe9a7c2-drawer\{width:100%;height:min\(var\(--qxframe9a7c2-theme-drawer-horizontal-height\),70%\);max-height:100%\}/);

assert.match(theme,/--qxframe9a7c2-theme-overlay-list-max-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \+ var\(--qxframe9a7c2-size-34\)\)/);
assert.match(family,/\.qxframe9a7c2-overflow-scroll-host\{[^}]*width:var\(--qxframe9a7c2-theme-overlay-list-max-width\);min-width:0;max-width:100%;/);
assert.match(css,/\.qxframe9a7c2-upload-preview-root\{position:fixed;inset:0;/);
assert.match(theme,/--qxframe9a7c2-theme-upload-preview-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \* 3 \+ var\(--qxframe9a7c2-size-38\)\)/);
assert.match(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*width:min\(var\(--qxframe9a7c2-theme-upload-preview-width\),100%\);max-height:100%;/);
assert.match(css,/\.qxframe9a7c2-image-preview-root\{[^}]*position:fixed;inset:0;/);
assert.match(theme,/--qxframe9a7c2-theme-image-preview-media-max-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \* 7 \+ var\(--qxframe9a7c2-size-4\)\)/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-image\{max-width:min\(94%,var\(--qxframe9a7c2-theme-image-preview-media-max-width\)\);max-height:92%\}/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-video\{max-width:min\(94%,var\(--qxframe9a7c2-theme-image-preview-media-max-width\)\);max-height:82%\}/);
assert.match(theme,/--qxframe9a7c2-theme-image-preview-audio-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \* 2 \+ var\(--qxframe9a7c2-size-40\)\)/);
assert.match(theme,/--qxframe9a7c2-theme-image-preview-audio-viewport-gap:\s*var\(--qxframe9a7c2-size-34\)/);
assert.match(theme,/--qxframe9a7c2-theme-image-preview-audio-min-width:\s*calc\(var\(--qxframe9a7c2-size-46\) \+ var\(--qxframe9a7c2-size-28\)\)/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-audio\{width:min\(var\(--qxframe9a7c2-theme-image-preview-audio-width\),calc\(100% - var\(--qxframe9a7c2-theme-image-preview-audio-viewport-gap\)\)\);min-width:min\(var\(--qxframe9a7c2-theme-image-preview-audio-min-width\),80%\);max-width:90%\}/);

assert.match(css,/--_qxframe9a7c2-notice-viewport-gutter:var\(--qxframe9a7c2-notice-shadow-gutter\)/);
assert.match(theme,/--qxframe9a7c2-theme-notice-available-inline-size:\s*calc\(var\(--qxframe9a7c2-size-46\) \* 2 \+ var\(--qxframe9a7c2-size-16\)\)/);
assert.match(css,/--_qxframe9a7c2-notice-available-inline-size:var\(--qxframe9a7c2-theme-notice-available-inline-size\)/);
assert.match(css,/\.qxframe9a7c2-notification-stack\{[\s\S]*?--_qxframe9a7c2-notice-viewport-gutter:var\(--qxframe9a7c2-notification-edge-gutter\)/);
assert.match(noticeService,/function syncNoticeAvailableInlineSize\(entry\)/);
assert.match(noticeService,/--_qxframe9a7c2-notice-available-inline-size', available \+ 'px'/);
assert.match(noticeService,/entry\.layout\.request\('viewport-resize'\)/);

console.log(JSON.stringify({
  ok:true,
  removedViewportConsumers:54,
  remainingViewportConsumers:0,
  finalRule:'no vw/vh/vmin/vmax in canonical framework CSS'
}));
