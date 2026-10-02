import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {auditReadability} from '../docs/assets/theme-generator/audit-engine.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

const base=generateTheme(manifest,recipes,{name:'readability-base'});
assert.equal(base.reports.readability.checks.length,9);
assert.equal(base.reports.readability.passes,false);
assert.deepEqual(base.reports.readability.warnings.map(item=>item.id),['on-success','on-warning','on-info'],'Frozen Schema v1/Core shared white status foreground must surface its three real default contrast warnings.');
for(const id of ['light-text','light-text-secondary','dark-text','dark-text-secondary','on-primary','on-success','on-warning','on-error','on-info']){
  const check=base.reports.readability.checks.find(item=>item.id===id);
  assert.ok(check,'missing readability check '+id);
  if(['on-success','on-warning','on-info'].includes(id))assert.ok(check.ratio<check.minimum,id+' should expose the frozen shared-status contrast limitation');
  else assert.ok(check.ratio>=check.minimum,id+' should pass default readability');
}
const primary=base.reports.readability.checks.find(item=>item.id==='on-primary');
assert.equal(primary.foreground,base.tokens.light['--qxframe9a7c2-theme-primary-foreground']);
assert.equal(primary.recommendedForeground,primary.foreground);
for(const role of ['success','warning','error','info']){
  const check=base.reports.readability.checks.find(item=>item.id==='on-'+role);
  assert.equal(check.foreground,'rgb('+base.tokens.light['--qxframe9a7c2-palette-white']+')','status audit must inspect the Core shared white status foreground when no explicit optional override exists');
}

const bad=generateTheme(manifest,recipes,{
  name:'readability-warning',
  advanced:{overrides:{'--qxframe9a7c2-theme-light-text-secondary':'rgb(255, 255, 255)'}}
});
assert.equal(bad.reports.readability.passes,false);
assert.ok(bad.reports.readability.warnings.some(item=>item.id==='light-text-secondary'));
assert.ok(bad.css.includes('--qxframe9a7c2-theme-light-text-secondary: rgb(255, 255, 255);'),'Warnings must not silently rewrite explicit user overrides.');

const fixedStatus=generateTheme(manifest,recipes,{
  name:'readability-status-fixed',
  advanced:{overrides:{'--qxframe9a7c2-semantic-on-status':'rgb(0, 0, 0)'}}
});
assert.equal(fixedStatus.tokens.light['--qxframe9a7c2-semantic-on-status'],'rgb(0, 0, 0)');
assert.ok(['success','warning','error','info'].every(role=>!fixedStatus.reports.readability.warnings.some(item=>item.id==='on-'+role)),'explicit shared black status foreground must clear all four default status contrast warnings');

const indirect=generateTheme(manifest,recipes,{
  name:'readability-unverifiable',
  advanced:{overrides:{'--qxframe9a7c2-theme-light-text-secondary':'var(--qxframe9a7c2-theme-light-text)'}}
});
assert.ok(indirect.css.includes('--qxframe9a7c2-theme-light-text-secondary: var(--qxframe9a7c2-theme-light-text);'));
assert.ok(indirect.reports.readability.warnings.some(item=>item.id==='light-text-secondary'&&item.code==='contrast-unverifiable'));

const direct=auditReadability(base.tokens);
assert.deepEqual(direct,base.reports.readability);

console.log(JSON.stringify({
  phase:'TG-I-readability',
  checks:base.reports.readability.checks.length,
  frozenDefaultWarnings:['on-success','on-warning','on-info'],
  explicitOverrideWarning:true,
  sharedStatusForegroundAudited:true,
  nonDestructive:true,
  indirectExpressionNonFatal:true
}));
