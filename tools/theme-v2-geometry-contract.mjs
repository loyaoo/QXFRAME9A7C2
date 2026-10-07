import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

// createApp v3 geometry contract: md anchors are closed-list theme tokens written by the createApp
// compiler (no style selectors); the shared five-size curve (xs–xl from md) lives in the consumer CSS.
export const GEOMETRY_TOKENS=['control-height','control-padding','control-gap','control-icon','control-font-size','control-line-height',
  'card-padding','card-gap','switch-width','switch-height','switch-inset','slider-track','slider-thumb','progress-track','progress-ring','choice-size',
  'radius-button','radius-field','radius-choice','radius-card','radius-popup'];
const STYLES=['vega','nova','maia','lyra','mira','luma','sera','rhea'];

export async function verifyGeometryRuleSource(root,{sourceText=null}={}){
  const source=(sourceText??fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'');
  for(const match of source.matchAll(/(-?\d*\.?\d+)(rem|px)\b/g)){
    const px=Math.abs(Number(match[1]))*(match[2]==='rem'?16:1);
    assert.ok(px===1||Number.isInteger(px/2),'geometry must use even reference lengths or 1px borders: '+match[0]);
  }
  assert.doesNotMatch(source,/var\(--qxframe9a7c2-(?:theme-v2-[a-z-]+|(?:button|card|switch|slider|progress)-[a-z-]*-(?:xs|sm|md|lg|xl))\b/,'Legacy five-size inputs must not become hidden overrides');
  assert.doesNotMatch(source,/data-qxframe9a7c2-style/,'Styles must not appear at runtime (v3 §5.4).');
  const model=await import(pathToFileURL(path.join(root,'docs/create/model.js')).href);
  for(const style of STYLES){
    const body=model.compileTheme(model.normalizeConfig({style})).body;
    for(const token of GEOMETRY_TOKENS)assert.match(body,new RegExp('--qxframe9a7c2-theme-'+token+': [^;]+;'),'Compiled '+style+' theme lacks '+token);
  }
  assert.match(source,/control-height: calc\(var\(--qxframe9a7c2-theme-control-height\) \+ var\(--_qxframe9a7c2-v2-size-index\) \* \.25rem\)/);
  assert.match(source,/v2-size-ratio: calc\(1 \+ var\(--_qxframe9a7c2-v2-size-index\) \* \.125\)/);
  assert.match(source,/control-padding-block: round\(down, max\(0rem,/);
  assert.match(source,/v2-font-step: clamp\(-1, var\(--_qxframe9a7c2-v2-size-index\), 1\)/);
  for(const [size,index]of [['xs',-2],['sm',-1],['md',0],['lg',1],['xl',2]])assert.match(source,new RegExp('\\.qxframe9a7c2-button\\.is-'+size+'[^{}]+\\{ --_qxframe9a7c2-v2-size-index: '+index+'; \\}'));
  return {schema:3,rules:'qx-md-3',inputNames:GEOMETRY_TOKENS.length,evenLengths:true,legacyFiveSizeOverrides:false,styleSelectors:false};
}
