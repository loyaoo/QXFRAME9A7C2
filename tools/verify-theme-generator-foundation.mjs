import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,STYLE_PRESETS,normalizeConfig,parseConfig,serializeConfig,
  readSchema,createTokenMaps,validateTokenMaps,serializeCss,generateFoundationTheme
} from '../docs/assets/theme-generator/engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const schema=readSchema(manifest);
assert.equal(schema.schema,1);
assert.equal(schema.order.length,4028);
assert.equal(schema.optionalSet.size,462);
assert.equal(schema.interfaceHash,'421bad21f47d6c90555b994664ef399051f1bf69fad4119f3dcee44c790c399c');

const defaults=normalizeConfig({});
assert.equal(defaults.schema,1);
assert.equal(defaults.style,'nova');
assert.equal(defaults.radius,'default');
assert.equal(defaults.chart.color,'primary');
assert.equal(Object.prototype.hasOwnProperty.call(defaults,'density'),false);
assert.deepEqual(Object.keys(STYLE_PRESETS),['vega','nova','maia','lyra','mira','luma','sera','rhea']);
assert.deepEqual(parseConfig(serializeConfig(DEFAULT_CONFIG)),normalizeConfig(DEFAULT_CONFIG));

for(const style of Object.keys(STYLE_PRESETS))assert.equal(normalizeConfig({style}).style,style);
for(const radius of ['default','none','small','medium','large'])assert.equal(normalizeConfig({radius}).radius,radius);
for(const color of ['primary','neutral','red','orange','yellow','lime','green','teal','cyan','blue','purple','pink','grey'])assert.equal(normalizeConfig({chart:{color}}).chart.color,color);

assert.throws(()=>normalizeConfig({typo:true}),/Unknown config key/);
assert.throws(()=>normalizeConfig({schema:2}),/Unsupported Theme Config schema/);
assert.throws(()=>normalizeConfig({density:'compact'}),/Unknown config key/);
assert.throws(()=>normalizeConfig({radius:'giant'}),/radius must be one of/);
assert.throws(()=>normalizeConfig({roles:{primary:'not-a-color'}}),/palette id or HEX\/RGB\/HSL\/OKLCH/);
assert.throws(()=>normalizeConfig({advanced:{overrides:{'--_qxframe9a7c2-private':'1'}}}),/non-public token/);
assert.throws(()=>normalizeConfig({advanced:{overrides:{'--qxframe9a7c2-theme-primary':'red!important'}}}),/safe CSS/);

const maps=createTokenMaps(schema);
assert.equal(Object.keys(maps.light).length,4028);
assert.equal(Object.keys(maps.dark).length,4028);
assert.equal(validateTokenMaps(maps,schema),true);
const config=normalizeConfig({name:'foundation-test'});
const css1=serializeCss(maps,schema,config),css2=serializeCss(createTokenMaps(schema),schema,config);
assert.equal(css1,css2);
assert.match(css1,/Theme Schema: 1/);
assert.ok(!css1.includes('--_qxframe9a7c2-'));
assert.ok(!css1.includes('!important'));
assert.ok(!css1.includes('.qxframe9a7c2-'));
assert.ok(!css1.includes('color(srgb'));
assert.equal((css1.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length,8056);

const publicOverride=manifest.optionalComponentOverrides[0];
const overridden=generateFoundationTheme(manifest,{name:'override-test',advanced:{overrides:{[publicOverride]:'1rem'}}});
assert.equal(overridden.tokens.light[publicOverride],'1rem');
assert.equal(overridden.tokens.dark[publicOverride],'1rem');
assert.ok(overridden.css.includes(publicOverride+': 1rem;'));
assert.throws(()=>generateFoundationTheme(manifest,{advanced:{overrides:{'--qxframe9a7c2-not-in-schema':'1rem'}}}),/Unknown public token override/);

console.log(JSON.stringify({
  phase:'TG-A/TG-B/TG-E-foundation',
  schema:1,requiredPublicInputs:4028,optionalPublicOverrides:462,
  styles:Object.keys(STYLE_PRESETS).length,radiusOptions:5,chartColorFamilies:13,
  deterministic:true,privateOutputBlocked:true,componentSelectorsBlocked:true
}));
