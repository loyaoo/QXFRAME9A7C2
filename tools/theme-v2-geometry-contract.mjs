import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {GEOMETRY_ROLES,normalizeGeometryConfig,STYLE_GEOMETRY} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';

export function verifyGeometryRuleSource(root,{sourceText=null}={}){
  const source=(sourceText??fs.readFileSync(path.join(root,'src/styles/theme/_visual-v2.scss'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'');
  for(const match of source.matchAll(/(-?\d*\.?\d+)(rem|px)\b/g)){
    const px=Math.abs(Number(match[1]))*(match[2]==='rem'?16:1);
    assert.ok(px===1||Number.isInteger(px/2),'v2 geometry must use even reference lengths or 1px borders: '+match[0]);
  }
  assert.doesNotMatch(source,/var\(--qxframe9a7c2-(?:theme-(?!v2-)[a-z-]*(?:height|padding|radius|size|gap)|(?:button|card|switch|slider|progress)-[a-z-]*-(?:xs|sm|md|lg|xl))\b/,'Legacy five-size inputs must not become hidden v2 overrides');
  const inputNames=[...source.matchAll(/--qxframe9a7c2-theme-v2-([a-z-]+)\s*:\s*(-?\d*\.?\d+rem)\s*;/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(inputNames)].sort(),[...GEOMETRY_ROLES].sort());
  for(const style of Object.keys(STYLE_GEOMETRY)){
    const marker=style==='vega'?'@scope (:root)':'@scope ([data-qxframe9a7c2-style="'+style+'"]';
    const start=source.indexOf(marker);
    assert.ok(start>=0,'Missing canonical Style scope: '+style);
    const boundary=source.indexOf('@scope',start+marker.length),section=source.slice(start,boundary<0?undefined:boundary);
    for(const [role,value]of Object.entries(normalizeGeometryConfig({style}).geometry))assert.ok(section.includes('--qxframe9a7c2-theme-v2-'+role+': '+value+';'),'Style/md default drift: '+style+'/'+role);
  }
  assert.match(source,/control-height: calc\(var\(--qxframe9a7c2-theme-v2-control-min-block-md\) \+ var\(--_qxframe9a7c2-v2-size-index\) \* \.25rem\)/);
  assert.match(source,/v2-size-ratio: calc\(1 \+ var\(--_qxframe9a7c2-v2-size-index\) \* \.125\)/);
  assert.match(source,/control-padding-block: round\(down, max\(0rem,/);
  assert.match(source,/v2-font-step: clamp\(-1, var\(--_qxframe9a7c2-v2-size-index\), 1\)/);
  for(const [size,index]of [['xs',-2],['sm',-1],['md',0],['lg',1],['xl',2]])assert.match(source,new RegExp('\\.qxframe9a7c2-button\\.is-'+size+'[^{}]+\\{ --_qxframe9a7c2-v2-size-index: '+index+'; \\}'));
  return {schema:2,rules:'qx-md-1',inputNames:GEOMETRY_ROLES.length,evenLengths:true,legacyFiveSizeOverrides:false,canonicalScopes:true};
}
