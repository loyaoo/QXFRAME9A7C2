import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const componentPath=path.join(root,'src/styles/components/_components.scss');
const themePath=path.join(root,'src/styles/theme/_family.scss');
const css=fs.readFileSync(componentPath,'utf8');
const theme=fs.readFileSync(themePath,'utf8');
const noticeService=fs.readFileSync(path.join(root,'src/core/noticeService.js'),'utf8');
const viewportRe=/-?\d*\.?\d+(?:vw|vh|vmin|vmax)\b/ig;

for(const rel of getCanonicalStyleModulePaths({root})){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.doesNotMatch(source,viewportRe,`Viewport units are forbidden after closeout: ${rel}`);
}

assert.match(css,/\.qxframe9a7c2-modal-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-modal-container\{[^}]*width:min\(35rem,calc\(100% - 3rem\)\);max-height:calc\(100% - 3rem\)/);
assert.match(css,/\.qxframe9a7c2-modal-container\.is-fullscreen\{width:100%;[^}]*height:100%;/);

assert.match(css,/\.qxframe9a7c2-drawer-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\{position:absolute;inset:0;/);
assert.match(css,/\.qxframe9a7c2-drawer\{[^}]*width:min\(26\.25rem,calc\(100% - 2\.5rem\)\);max-width:100%;/);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\.is-top>\.qxframe9a7c2-drawer,\.qxframe9a7c2-drawer-wrap\.is-bottom>\.qxframe9a7c2-drawer\{width:100%;height:min\(22\.5rem,70%\);max-height:100%\}/);

assert.match(theme,/\.qxframe9a7c2-overflow-scroll-host\{[^}]*width:22rem;min-width:0;max-width:100%;/);
assert.match(css,/\.qxframe9a7c2-upload-preview-root\{position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*width:min\(56rem,100%\);max-height:100%;/);
assert.match(css,/\.qxframe9a7c2-image-preview-root\{[^}]*position:fixed;inset:0;/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-image\{max-width:min\(94%,112\.5rem\);max-height:92%\}/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-video\{max-width:min\(94%,112\.5rem\);max-height:82%\}/);
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-audio\{width:min\(42rem,calc\(100% - 6rem\)\);min-width:min\(20rem,80%\);max-width:90%\}/);

assert.match(css,/--_qxframe9a7c2-notice-viewport-gutter:var\(--qxframe9a7c2-notice-shadow-gutter\)/);
assert.match(css,/--_qxframe9a7c2-notice-available-inline-size:34rem/);
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
