import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../docs/theme-playground.html',import.meta.url),'utf8');
const studio=fs.readFileSync(new URL('../docs/assets/theme-generator/studio-v2.mjs',import.meta.url),'utf8');
const playground=fs.readFileSync(new URL('../docs/assets/qxframe9a7c2-theme-playground.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../docs/assets/theme-studio-v2.css',import.meta.url),'utf8');

assert.equal(fs.existsSync(new URL('../docs/assets/qxframe9a7c2-theme-studio.js',import.meta.url)),false,'Legacy Theme Studio JS must be deleted.');
assert.equal(fs.existsSync(new URL('../docs/assets/qxframe9a7c2-theme-studio.css',import.meta.url)),false,'Legacy Theme Studio CSS must be deleted.');
assert.doesNotMatch(html,/qxframe9a7c2-theme-studio\.(?:js|css)/,'Playground must not load legacy Studio assets.');
assert.match(html,/data-theme-studio-v2/);
assert.match(html,/assets\/theme-generator\/studio-v2\.mjs/);
assert.doesNotMatch(html,/data-qxframe9a7c2-visual=/,'Canonical Theme must not require a retired visual opt-in marker.');
assert.doesNotMatch(studio,/data-qxframe9a7c2-visual=/,'Studio previews must use the canonical Theme without a retired visual opt-in marker.');

assert.doesNotMatch(playground,/qxframe9a7c2-play-settings/,'Legacy .qxframe9a7c2-play-settings control area must be removed.');
for(const retired of ['PRESETS','BASES','FONTS','primarySeed','mixRatio','focusRing','themeCss','applyTheme','setPublic','data-qxframe9a7c2-reset','data-qxframe9a7c2-shuffle','data-qxframe9a7c2-export'])assert.equal(playground.includes(retired),false,'Legacy playground theme configurator remains: '+retired);
assert.match(playground,/主题配置已统一/);
assert.match(playground,/只负责组件目录、筛选和(?: canonical)? Demo 挂载/);

for(const text of ['主题生成器','视觉风格','控件密度','圆角程度','容器留白','非颜色外观','排版密度','文字风格','编辑式','控件外观','描边','着色描边','轻着色描边','柔和填充','下划线','正文字体','标题字体','等宽字体','边界强度','投影强度','动效节奏','表面形态','颜色与可选覆盖','明暗模式','颜色用途','完整颜色值','恢复默认关联','浅色','深色'])assert.ok(studio.includes(text),'New Studio user-facing configuration must include Chinese label: '+text);
for(const englishLabel of ['>Style<','>Shape ','>light<','>dark<','Theme v2 Studio','Primary Seed','Neutral Palette','Focus Ring'])assert.equal(studio.includes(englishLabel),false,'User-facing legacy/English configuration label remains: '+englishLabel);
for(const style of ['Vega（均衡）','Nova（紧凑）','Maia（圆润宽松）','Lyra（方正等宽）','Mira（高密度）','Luma（柔和抬升）','Sera（编辑风格）','Rhea（圆润紧凑）'])assert.ok(studio.includes(style),'Missing Chinese Style explanation: '+style);
for(const type of ['灰色','青色','蓝绿色','绿色','青柠色','黄色','橙色','红色','粉色','紫色','蓝色','天蓝色','白色','黑色'])assert.ok(studio.includes(type),'Missing physical Type Chinese label: '+type);

// Style is a compile-time recipe. Studio state stores sparse user intent: changing
// Style must not delete explicit axes and changing one axis must not materialize
// every resolved Style default as an explicit override.
assert.doesNotMatch(studio,/delete\s+next\.(?:options|geometry|appearance)/,'Style changes must preserve explicit configuration.');
assert.match(studio,/next\.options=\{\.\.\.\(next\.options\?\?\{\}\),\[option\]:control\.value\}/,'Options must update sparse intent, not resolved config.');
assert.match(studio,/next\.appearance=\{\.\.\.\(next\.appearance\?\?\{\}\),\[control\.dataset\.v2Appearance\]:control\.value\}/,'Appearance must update sparse intent.');
assert.match(studio,/generated\.intent/,'Studio must retain compiler-normalized intent separately from resolved config.');

// :root/.dark Theme CSS cannot represent two independent generated themes in one
// document. Studio therefore previews light/dark in separate documents and injects
// the compiler bytes without selector rewriting.
assert.match(studio,/createElement\('iframe'\)/,'Studio preview must use isolated documents.');
assert.match(studio,/theme\.textContent=result\.css/,'Preview must inject the exact compiler CSS bytes.');
assert.doesNotMatch(studio,/sheet\.textContent\s*=\s*['"]@scope/,'Studio must not rewrite root/dark Theme CSS into a private scope.');
assert.match(css,/\.qxframe9a7c2-v2-preview-frame/,'Isolated preview frame style is missing.');

for(const forbidden of [/display\s*:\s*grid/i,/grid-template/i,/\b\d+(?:\.\d+)?fr\b/i,/\b\d+(?:\.\d+)?v[wh]\b/i,/@layer\b/i,/:is\(/i,/:where\(/i])assert.equal(forbidden.test(css),false,'Theme Studio docs CSS contains forbidden layout/syntax: '+forbidden);

console.log(JSON.stringify({task:'THEME-VISUAL-V2-001',legacyStudioDeleted:true,legacyPlaySettingsDeleted:true,soleStudio:'theme-generator/studio-v2.mjs',chineseConfiguration:true,editorialControl:true,controlAppearance:true,visualOptInRetired:true,sparseIntent:true,isolatedPreview:true,canonicalGalleryPreserved:/id="qxframe9a7c2-theme-playground-app"/.test(html)}));
