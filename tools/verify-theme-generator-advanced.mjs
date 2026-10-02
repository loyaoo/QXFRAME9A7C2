import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {applyPaletteSeed,applyAdvancedProfile,inferAdvancedProfile,PROFILE_OVERRIDES} from '../docs/assets/theme-generator/advanced-engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

let config={name:'advanced'};
config=applyPaletteSeed(config,'blue','#0ea5e9');
assert.equal(config.palette.blue,'#0ea5e9');
let theme=generateTheme(manifest,recipes,config);
assert.notEqual(theme.tokens.light['--qxframe9a7c2-palette-blue-5'],manifest.tokens.find(t=>t.name==='--qxframe9a7c2-palette-blue-5').defaults.light);
assert.notEqual(theme.tokens.light['--qxframe9a7c2-theme-primary-5'],manifest.tokens.find(t=>t.name==='--qxframe9a7c2-theme-primary-5').defaults.light,'default primary=blue must follow physical blue seed customization');

config=applyAdvancedProfile(config,'shadow','elevated');
assert.equal(inferAdvancedProfile(config,'shadow'),'elevated');
assert.equal(config.advanced.overrides['--qxframe9a7c2-theme-card-shadow-blur-lg'],PROFILE_OVERRIDES.shadow.elevated['--qxframe9a7c2-theme-card-shadow-blur-lg']);
theme=generateTheme(manifest,recipes,config);
assert.equal(theme.tokens.light['--qxframe9a7c2-theme-card-shadow-blur-lg'],'var(--qxframe9a7c2-size-12)');

config=applyAdvancedProfile(config,'motion','none');
assert.equal(inferAdvancedProfile(config,'motion'),'none');
theme=generateTheme(manifest,recipes,config);
for(const id of [1,2,3,5])assert.equal(theme.tokens.light['--qxframe9a7c2-theme-motion-duration-'+id],'0ms');

config=applyAdvancedProfile(config,'border','hairline');
assert.equal(inferAdvancedProfile(config,'border'),'hairline');
theme=generateTheme(manifest,recipes,config);
assert.equal(theme.tokens.light['--qxframe9a7c2-family-control-border-width'],'1px');
assert.equal(theme.tokens.dark['--qxframe9a7c2-family-control-border-width'],'1px');

const manual=JSON.parse(JSON.stringify(config));
manual.advanced.overrides['--qxframe9a7c2-theme-motion-duration-2']='111ms';
assert.equal(inferAdvancedProfile(manual,'motion'),'custom');
const reset=applyAdvancedProfile(manual,'motion','default');
assert.equal(inferAdvancedProfile(reset,'motion'),'default');
assert.equal(reset.advanced.overrides['--qxframe9a7c2-theme-motion-duration-2'],undefined);
assert.equal(reset.advanced.overrides['--qxframe9a7c2-family-control-border-width'],'1px','Resetting one advanced group must preserve other explicit groups.');

assert.throws(()=>applyPaletteSeed(config,'azure','#fff'),/Unknown physical Palette seed/);
assert.throws(()=>applyAdvancedProfile(config,'motion','warp'),/Unknown motion profile/);

console.log(JSON.stringify({
  phase:'TG-D-advanced-profiles',
  physicalPaletteSeed:true,
  shadowProfiles:Object.keys(PROFILE_OVERRIDES.shadow),
  borderProfiles:Object.keys(PROFILE_OVERRIDES.border),
  motionProfiles:Object.keys(PROFILE_OVERRIDES.motion),
  overridesRemainSourceOfTruth:true
}));
