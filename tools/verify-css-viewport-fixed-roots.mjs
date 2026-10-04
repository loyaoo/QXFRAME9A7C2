import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {getCanonicalStyleModulePaths,readCanonicalStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const noticeService=fs.readFileSync(path.join(root,'src/core/noticeService.js'),'utf8');
const viewportRe=/-?\d*\.?\d+(?:vw|vh|vmin|vmax)\b/ig;
const ruleBody=selector=>{
  const start=css.indexOf(selector+'{');
  assert.notEqual(start,-1,'Missing viewport closeout selector: '+selector);
  const bodyStart=start+selector.length+1,end=css.indexOf('}',bodyStart);
  assert.notEqual(end,-1,'Unclosed viewport closeout selector: '+selector);
  return css.slice(bodyStart,end);
};

for(const rel of getCanonicalStyleModulePaths({root})){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.doesNotMatch(source,viewportRe,`Viewport units are forbidden after closeout: ${rel}`);
}

for(const selector of ['modal-root','drawer-root','upload-preview-root','image-preview-root'])assert.match(css,new RegExp('\\.qxframe9a7c2-'+selector+'\\{[^}]*position:fixed;inset:0;'),'Viewport overlay root must stay fixed/inset: '+selector);
assert.match(css,/\.qxframe9a7c2-drawer-wrap\{position:absolute;inset:0;/,'Drawer wrap must stay scoped to the fixed root.');

const modal=ruleBody('.qxframe9a7c2-modal-container');
assert.ok(modal.includes('width:min(var(--_qxframe9a7c2-fixed-modal-width),calc(100% - var(--_qxframe9a7c2-fixed-modal-viewport-gap)))'),'Modal width must remain private-fixed and percentage-bounded without viewport units.');
assert.ok(modal.includes('max-height:calc(100% - var(--_qxframe9a7c2-fixed-modal-viewport-gap))'),'Modal max-height must remain percentage-bounded without viewport units.');
const modalFullscreen=ruleBody('.qxframe9a7c2-modal-container.is-fullscreen');
assert.match(modalFullscreen,/width:100%;[^}]*height:100%;/,'Fullscreen modal must remain percentage-based.');

const drawer=ruleBody('.qxframe9a7c2-drawer');
assert.ok(drawer.includes('width:min(var(--_qxframe9a7c2-fixed-drawer-width),calc(100% - var(--_qxframe9a7c2-fixed-drawer-viewport-gap)))'),'Drawer width must remain private-fixed and percentage-bounded.');
assert.ok(drawer.includes('max-width:100%'),'Drawer must remain container-bounded.');
const drawerHorizontal=ruleBody('.qxframe9a7c2-drawer-wrap.is-top>.qxframe9a7c2-drawer,.qxframe9a7c2-drawer-wrap.is-bottom>.qxframe9a7c2-drawer');
assert.ok(drawerHorizontal.includes('width:100%'),'Horizontal drawer width must stay percentage-based.');
assert.ok(drawerHorizontal.includes('height:min(var(--_qxframe9a7c2-fixed-drawer-horizontal-height),70%)'),'Horizontal drawer height must stay private-fixed and percentage-bounded.');
assert.ok(drawerHorizontal.includes('max-height:100%'),'Horizontal drawer max-height must stay percentage-based.');

const uploadPreview=ruleBody('.qxframe9a7c2-upload-preview-panel');
assert.ok(uploadPreview.includes('width:min(var(--_qxframe9a7c2-fixed-upload-preview-width),100%)'),'Upload preview must remain private-fixed and container-bounded.');
assert.ok(uploadPreview.includes('max-height:100%'),'Upload preview max-height must remain container-bounded.');

const imagePreview=ruleBody('.qxframe9a7c2-image-preview-motion.is-media-image');
assert.ok(imagePreview.includes('max-width:min(94%,var(--_qxframe9a7c2-fixed-image-preview-media-max-width))'),'Image preview image width must stay percentage/private-fixed bounded.');
assert.ok(imagePreview.includes('max-height:92%'),'Image preview image height must stay percentage-based.');
const videoPreview=ruleBody('.qxframe9a7c2-image-preview-motion.is-media-video');
assert.ok(videoPreview.includes('max-width:min(94%,var(--_qxframe9a7c2-fixed-image-preview-media-max-width))'),'Image preview video width must stay percentage/private-fixed bounded.');
assert.ok(videoPreview.includes('max-height:82%'),'Image preview video height must stay percentage-based.');
const audioPreview=ruleBody('.qxframe9a7c2-image-preview-motion.is-media-audio');
assert.ok(audioPreview.includes('width:min(var(--_qxframe9a7c2-fixed-image-preview-audio-width),calc(100% - var(--_qxframe9a7c2-fixed-image-preview-audio-viewport-gap)))'),'Audio preview width must stay private-fixed and percentage-bounded.');
assert.ok(audioPreview.includes('min-width:min(var(--_qxframe9a7c2-fixed-image-preview-audio-min-width),80%)'),'Audio preview minimum width must stay private-fixed and percentage-bounded.');
assert.ok(audioPreview.includes('max-width:90%'),'Audio preview max-width must stay percentage-bounded.');

assert.match(noticeService,/function syncNoticeAvailableInlineSize\(entry\)/);
assert.match(noticeService,/entry\.layout\.request\('viewport-resize'\)/);

console.log(JSON.stringify({ok:true,remainingViewportConsumers:0,fixedRoots:4,finalRule:'no vw/vh/vmin/vmax in canonical framework CSS'}));
