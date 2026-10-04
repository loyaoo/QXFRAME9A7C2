import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateThemeV2,serializeThemeV2,parseThemeV2,INTENT_SCHEMA_VERSION} from '../docs/assets/theme-generator/engine-v2.mjs';
import {normalizeStyleConfig,STYLE_RULE_VERSION} from '../docs/assets/theme-generator/style-engine-v2.mjs';
import {GEOMETRY_RULE_VERSION} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';
import {RULE_VERSION,SEMANTIC_SCHEMA} from '../docs/assets/theme-generator/semantic-engine.mjs';

const explicit={
  style:'vega',
  options:{radius:'xl'},
  appearance:{fontBody:'serif',fontHeading:'inherit',shadow:'none'},
  colors:{light:{primary:'rgb(1 2 3)'}}
};
const first=generateThemeV2(explicit);
const serialized=serializeThemeV2(first.config);
const persisted=JSON.parse(serialized);
assert.equal(persisted.intentSchema,INTENT_SCHEMA_VERSION);
assert.equal(persisted.schema,SEMANTIC_SCHEMA);
assert.equal(persisted.rules,RULE_VERSION);
assert.equal(persisted.geometryRules,GEOMETRY_RULE_VERSION);
assert.equal(persisted.styleRules,STYLE_RULE_VERSION);
assert.deepEqual(persisted.options,{radius:'xl'});
assert.deepEqual(persisted.appearance,{fontBody:'serif',fontHeading:'inherit',shadow:'none'});
assert.deepEqual(persisted.colors,{light:{primary:'rgb(1 2 3)'}});
assert.ok(!('geometry' in persisted),'resolved geometry must not be serialized as user intent');

const roundtrip=parseThemeV2(serialized);
assert.deepEqual(roundtrip.intent,persisted);
assert.equal(roundtrip.config.options.radius,'xl');
assert.equal(roundtrip.config.appearance.fontBody,'serif');
assert.equal(roundtrip.config.appearance.shadow,'none');
assert.equal(roundtrip.config.colors.light.primary,'rgb(1 2 3)');

const sera=parseThemeV2(serializeThemeV2({...roundtrip.intent,style:'sera'}));
assert.equal(sera.config.options.radius,'xl','Style changes must retain explicit geometry choices');
assert.equal(sera.config.appearance.fontBody,'serif','Style changes must retain explicit font choices');
assert.equal(sera.config.appearance.shadow,'none','Style changes must retain explicit appearance choices');
assert.equal(sera.config.colors.light.primary,'rgb(1 2 3)','Style changes must retain explicit color choices');
assert.equal(sera.config.colors.light.mask,'rgb(0 0 0 / 0.2)','unconfigured Style-owned values must re-resolve for the new Style');

const minimal=JSON.parse(serializeThemeV2({style:'sera'}));
assert.equal(minimal.style,'sera');
assert.ok(!('options' in minimal));
assert.ok(!('geometry' in minimal));
assert.ok(!('appearance' in minimal));
assert.ok(!('colors' in minimal));
assert.ok(!('overrides' in minimal));

const elevatedDefault=normalizeStyleConfig({style:'vega',appearance:{surface:'elevated'}});
assert.equal(elevatedDefault.style['card-shadow'],'var(--qxframe9a7c2-theme-v2-shadow-elevated)');
const elevatedNoShadow=normalizeStyleConfig({style:'vega',appearance:{surface:'elevated',shadow:'none'}});
assert.equal(elevatedNoShadow.style['card-shadow'],'none','explicit shadow must override Surface default');
const outlinedShadow=normalizeStyleConfig({style:'vega',appearance:{surface:'outlined',shadow:'md'}});
assert.equal(outlinedShadow.style['card-shadow'],'var(--qxframe9a7c2-theme-v2-shadow-md)','explicit shadow must survive outlined Surface');
const borderlessStrong=normalizeStyleConfig({style:'vega',appearance:{surface:'borderless',border:'strong'}});
assert.equal(borderlessStrong.style['card-border-width'],'.25rem','explicit border must override Surface default');
const followingHeading=normalizeStyleConfig({appearance:{fontBody:'serif',fontHeading:'inherit'}});
assert.equal(followingHeading.style['font-family-heading'],'var(--qxframe9a7c2-theme-v2-font-family)','heading inherit must stay a live CSS dependency');

const styleConsumers=await readFile(new URL('../src/styles/theme/_visual-v2-style-consumers.scss',import.meta.url),'utf8');
const cardBlock=styleConsumers.match(/\.qxframe9a7c2-card\[class\]\{([\s\S]*?)\n  \}/)?.[1]??'';
assert.match(cardBlock,/--_qxframe9a7c2-card-padding:var\(--qxframe9a7c2-card-md-padding,var\(--qxframe9a7c2-card-padding,var\(--_qxframe9a7c2-v2-surface-padding\)\)\)/,'Card default padding must keep public Detail ahead of Theme common padding');
assert.match(cardBlock,/--_qxframe9a7c2-card-radius:var\(--qxframe9a7c2-card-radius,var\(--_qxframe9a7c2-surface-radius\)\)/,'Card radius must keep public Detail ahead of Theme common radius');
assert.match(cardBlock,/--_qxframe9a7c2-card-shadow:var\(--qxframe9a7c2-card-shadow,var\(--qxframe9a7c2-theme-v2-card-shadow\)\)/,'Card shadow must keep public Detail ahead of Theme default');
assert.doesNotMatch(cardBlock,/\bbox-shadow\s*:/,'Style consumer must not directly paint Card box-shadow');
for(const size of ['xs','sm','md','lg','xl'])assert.match(styleConsumers,new RegExp('\\.qxframe9a7c2-card\\.is-'+size+'\\[class\\]\\{--_qxframe9a7c2-card-padding:var\\(--qxframe9a7c2-card-'+size+'-padding,var\\(--qxframe9a7c2-card-padding,'),'Card '+size+' padding must retain its existing public compatibility endpoint');

assert.throws(()=>parseThemeV2(JSON.stringify({intentSchema:'future-schema',style:'vega'})),/Unsupported intent schema/);
console.log('Theme v2.8 intent and precedence verification passed.');
