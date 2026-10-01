import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');

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

const modalBlock=css.match(/\.qxframe9a7c2-modal-container\{[^}]*\}/)?.[0]||'';
const drawerBlock=css.match(/\.qxframe9a7c2-drawer\{[^}]*\}/)?.[0]||'';
const noticeBlock=css.match(/\.qxframe9a7c2-notice-stack\{[\s\S]*?\}/)?.[0]||'';
assert.doesNotMatch(modalBlock,/v[wh]\b/);
assert.doesNotMatch(drawerBlock,/v[wh]\b/);
assert.doesNotMatch(noticeBlock,/v[wh]\b/);

console.log(JSON.stringify({ok:true,removedViewportConsumers:12,remainingViewportConsumers:42,families:['Modal','Drawer','Notice rail']}));