import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {getCanonicalStyleModulePaths,readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const noticeService=fs.readFileSync(path.join(root,'src/core/noticeService.js'),'utf8');
const viewportRe=/-?\d*\.?\d+(?:vw|vh|vmin|vmax)\b/ig;

for(const rel of getCanonicalStyleModulePaths({root})){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.doesNotMatch(source,viewportRe,`Viewport units are forbidden after closeout: ${rel}`);
}

for(const selector of ['modal-root','drawer-root','upload-preview-root','image-preview-root'])assert.match(css,new RegExp('\\.qxframe9a7c2-'+selector+'\\{[^}]*position:fixed;inset:0;'),'Viewport overlay root must stay fixed/inset: '+selector);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\{position:absolute;inset:0;/,'Drawer wrap must stay scoped to the fixed root.');
assert.match(css,/\.qxframe9a7c2-modal-container\{[^}]*width:min\([^;]+,calc\(100% - [^)]+\)\);max-height:calc\(100% - [^)]+\)/,'Modal must remain percentage-bounded without viewport units.');
assert.match(css,/\.qxframe9a7c2-modal-container\.is-fullscreen\{width:100%;[^}]*height:100%;/,'Fullscreen modal must remain percentage-based.');
assert.match(css,/\.qxframe9a7c2-drawer\{[^}]*width:min\([^;]+,calc\(100% - [^)]+\)\);max-width:100%;/,'Drawer width must remain percentage-bounded.');
assert.match(css,/\.qxframe9a7c2-drawer-wrap\.is-top>\.qxframe9a7c2-drawer,\.qxframe9a7c2-drawer-wrap\.is-bottom>\.qxframe9a7c2-drawer\{width:100%;height:min\([^;]+,70%\);max-height:100%\}/,'Horizontal drawer must remain percentage-bounded.');
assert.match(css,/\.qxframe9a7c2-upload-preview-panel\{[^}]*width:min\([^;]+,100%\);max-height:100%;/,'Upload preview must remain container-bounded.');
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-image\{max-width:min\(94%,[^)]+\);max-height:92%\}/,'Image preview image bounds must stay percentage-based.');
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-video\{max-width:min\(94%,[^)]+\);max-height:82%\}/,'Image preview video bounds must stay percentage-based.');
assert.match(css,/\.qxframe9a7c2-image-preview-motion\.is-media-audio\{width:min\([^;]+,calc\(100% - [^)]+\)\);min-width:min\([^;]+,80%\);max-width:90%\}/,'Audio preview must stay percentage/container bounded.');
assert.match(noticeService,/function syncNoticeAvailableInlineSize\(entry\)/);
assert.match(noticeService,/entry\.layout\.request\('viewport-resize'\)/);

console.log(JSON.stringify({ok:true,remainingViewportConsumers:0,fixedRoots:4,finalRule:'no vw/vh/vmin/vmax in canonical framework CSS'}));
