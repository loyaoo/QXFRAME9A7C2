import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {browserProbes} from './audit-css-schema-acceptance.mjs';
import {verifySemanticRuleSource,V2_STYLE_MODULE} from './theme-v2-contract.mjs';
import {CORE_ROLES} from '../docs/assets/theme-generator/semantic-engine.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const verified=verifySemanticRuleSource(root);
const source=fs.readFileSync(path.join(root,V2_STYLE_MODULE),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');

// v1.5 has one public full-color Theme. There is no Schema1 static palette
// mirror and no RGB-channel fallback table to preserve.
assert.doesNotMatch(source,/--qxframe9a7c2-palette-/,'Retired public Palette layer must not return.');
assert.doesNotMatch(source,/rgb\(\s*var\(/,'Complete Theme colors must not be treated as RGB channel strings.');
for(const role of CORE_ROLES)assert.ok(source.includes('--qxframe9a7c2-theme-v2-'+role+':'),'Missing canonical full-color Theme role: '+role);
assert.ok(verified.expressions.length>0,'Reviewed shadcn-derived color formulas must remain source-locked.');

if(process.argv.includes('--browser')){
  const roles=CORE_ROLES;
  const expression=`(() => {
    const scope=document.getElementById('scope'),roles=${JSON.stringify(roles)},failures=[];
    let checks=0;
    for(const mode of ['light','dark']){
      scope.setAttribute('data-qxframe9a7c2-theme',mode);
      const cs=getComputedStyle(scope);
      for(const role of roles){
        const value=cs.getPropertyValue('--qxframe9a7c2-theme-v2-'+role).trim();checks++;
        if(!value||value.includes('var(--qxframe9a7c2-palette-'))failures.push({mode,role,value});
      }
      for(const [selector,properties] of [['.qxframe9a7c2-card',['backgroundColor','color']],['.qxframe9a7c2-popup-surface',['backgroundColor','color']],['.qxframe9a7c2-button',['backgroundColor','color']]]){
        const node=document.createElement(selector.includes('button')?'button':'div');node.className=selector.slice(1)+(selector.includes('button')?' is-primary is-solid':'');scope.appendChild(node);const computed=getComputedStyle(node);
        for(const property of properties){checks++;const value=computed[property];if(!value||value.includes('251, 0, 251'))failures.push({mode,selector,property,value});}
        node.remove();
      }
    }
    return {checks,failures};
  })()`;
  const result=await browserProbes({expression});
  console.log(JSON.stringify({colorRegression:result}));
  assert.deepEqual(result.failures,[],'Canonical full-color Theme roles must resolve in Light/Dark consumers.');
}

console.log(JSON.stringify({ok:true,colorAuthority:'theme-v2-full-color',publicColorRoles:CORE_ROLES.length,sourceLockedFormulas:verified.expressions.length,schema1StaticPalette:false}));
