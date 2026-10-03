import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../docs/theme-playground.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../docs/assets/qxframe9a7c2-theme-studio.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../docs/assets/qxframe9a7c2-theme-studio.js',import.meta.url),'utf8');

assert.match(html,/qxframe9a7c2-theme-studio\.css/);
assert.match(html,/qxframe9a7c2-theme-studio\.js/);
assert.ok(html.indexOf('qxframe9a7c2-theme-playground.css')<html.indexOf('qxframe9a7c2-theme-studio.css'),'Studio CSS must load after the legacy docs playground CSS.');
assert.ok(html.indexOf('qxframe9a7c2-theme-playground.js')<html.indexOf('qxframe9a7c2-theme-studio.js'),'Studio JS must load after the canonical playground runtime.');

new Function(js);

for(const forbidden of [
  /display\s*:\s*grid/i,
  /grid-template/i,
  /\b\d+(?:\.\d+)?fr\b/i,
  /\b\d+(?:\.\d+)?v[wh]\b/i,
  /@layer\b/i,
  /:is\(/i,
  /:where\(/i
]) assert.ok(!forbidden.test(css),'Theme Studio docs CSS contains forbidden layout/syntax: '+forbidden);

assert.ok(!/document\.documentElement\.style\.setProperty\s*\(/.test(js),'Studio must not update Theme tokens one by one with root inline setProperty.');
assert.match(js,/data-qxframe9a7c2-generated-theme/);
assert.match(js,/ensureThemeStyle\(\)\.textContent=currentTheme\.css/);
assert.match(js,/setTimeout\(generateNow,80\)/);
assert.match(js,/Randomize/);
assert.match(js,/Export CSS/);
assert.match(js,/Export JSON/);
assert.match(js,/Import JSON/);
assert.match(js,/data-studio-lock/);
assert.match(js,/data-studio-add-override/);
assert.match(js,/data-studio-remove-override/);
assert.match(js,/renderAudit\(currentTheme\.reports\.readability\)/);
assert.match(js,/allowedOverride\(name\)/);
assert.match(js,/data-studio-apply-palette/);
assert.match(js,/data-studio-advanced-profile="shadow"/);
assert.match(js,/data-studio-advanced-profile="border"/);
assert.match(js,/data-studio-advanced-profile="motion"/);
assert.match(js,/runtime\.advanced\.applyPaletteSeed/);
assert.match(js,/runtime\.advanced\.applyAdvancedProfile/);

for(const style of ['Vega','Nova','Maia','Lyra','Mira','Luma','Sera','Rhea'])assert.ok(js.includes("['"+style.toLowerCase()+"','"+style+"']"),'Studio missing Style '+style);
assert.match(js,/\['default','Default'\],\['none','None'\],\['small','Small'\],\['medium','Medium'\],\['large','Large'\]/,'Radius must expose five choices.');
assert.ok(!/data-studio-input="density"/.test(js),'Density must not remain a first-class Studio control; Style owns density.');
assert.match(js,/field\('Chart color'/);
assert.match(js,/\['primary','Primary'\]/);
assert.ok(!/\['mixed','Mixed'\]/.test(js),'Chart color must not expose rainbow/mixed palettes.');


const scenes=[...js.matchAll(/scene\('([^']+)'/g)].map(match=>match[1]);
assert.ok(scenes.length>=20,'Commercial Preview requires at least 20 real business scenes; found '+scenes.length);
for(const expected of [
  'Analytics overview','Transactions','CRM opportunity','Billing plan','Invoice #1048',
  'Invite teammate','Workspace preferences','Schedule review','Brand assets','Workspace navigation',
  'Project workspace','Notifications','Support inbox','Subscription','Security','Empty state',
  'Error state','Activity','Checkout'
]) assert.ok(scenes.includes(expected),'Missing commercial scene: '+expected);

assert.match(css,/\.qxframe9a7c2-studio-column\{display:flex;/,'Commercial showcase must use Flex columns.');
for(const slot of ['qxframe9a7c2-card-heading','qxframe9a7c2-card-description','qxframe9a7c2-card-action','qxframe9a7c2-card-content','qxframe9a7c2-card-footer','qxframe9a7c2-card-section is-muted is-inset']) assert.ok(js.includes(slot),'Commercial showcase must exercise Card visual-recipe slot '+slot+'.');
assert.ok(js.includes('is-headerless'),'Showcase must include content-led Card compositions without a forced header band.');
assert.ok(js.includes('is-borderless is-shadow'),'Showcase must mix boundary treatments instead of rendering every Card as the same outlined box.');

for(const component of ['Table','Select','Progress','DatePicker','Upload','Menu','Tabs']){
  assert.ok(js.includes('C.'+component),'Commercial preview must mount real QXFRAME '+component+'.');
}
for(const className of ['qxframe9a7c2-card','qxframe9a7c2-button','qxframe9a7c2-form-input','qxframe9a7c2-switch','qxframe9a7c2-badge']){
  assert.ok(js.includes(className),'Commercial preview must consume framework class '+className+'.');
}

for(const path of [
  'theme-generator/generator.mjs',
  'theme-generator/engine.mjs',
  'theme-generator/io.mjs',
  'theme-generator/color-engine.mjs',
  'theme-generator/presets.mjs',
  'theme-generator/advanced-engine.mjs',
  '../generated/theme-public-schema-v1.json',
  '../generated/theme-color-recipes-v1.json'
]) assert.ok(js.includes(path),'Studio runtime missing frozen-generator dependency '+path);

assert.ok(js.includes("localStorage.setItem(STORAGE_KEY"),'Studio must persist Theme Config source state.');
assert.ok(js.includes('runtime.io.importConfigJson'),'Studio import must use the Config JSON source-of-truth parser.');
assert.ok(js.includes('runtime.io.exportArtifacts'),'Studio export must use the generator IO contract.');
assert.ok(js.includes('runtime.presets.applyThemePreset'),'Studio must expose the QX Theme preset library.');
assert.ok(js.includes('currentTheme=runtime.generator.generateTheme'),'Studio preview must consume the real generator result.');

console.log(JSON.stringify({
  phase:'TG-G-studio-static-v2',
  commercialScenes:scenes.length,
  runtimeComponents:7,
  commercialFlexColumns:3,
  cardVisualRecipeSlots:true,
  generatedStylesheetReplacement:true,
  rootPerTokenMutation:false,
  flexOnlyStudioCss:true,
  canonicalGalleryPreserved:/id="all-components"/.test(html)
}));
