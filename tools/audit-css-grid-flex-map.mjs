import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const clean=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\s+/g,' ').trim();

export function generateCssGridFlexMap({rootDir=root}={}){
  const source=getCanonicalStyleModulePaths({root:rootDir}).map(rel=>fs.readFileSync(path.join(rootDir,rel),'utf8')).join('');
  const rules=[],ruleRe=/([^{}]+)\{([^{}]*)\}/g;let match;
  function declarations(body){
    const out=[];let found;
    const display=/(?:^|;)\s*display\s*:\s*((?:inline-)?grid)\s*(?=;|$)/ig;
    while((found=display.exec(body)))out.push({kind:'display-grid',property:'display',value:found[1].trim()});
    const prop=/(?:^|;)\s*(grid-(?:template(?:-columns|-rows|-areas)?|column(?:-start|-end)?|row(?:-start|-end)?|area|auto-(?:columns|rows|flow)))\s*:\s*([^;]+)/ig;
    while((found=prop.exec(body)))out.push({kind:/^grid-(?:column|row|area|auto-)/i.test(found[1])?'grid-placement':'grid-template',property:found[1].trim(),value:found[2].trim()});
    const fr=[...body.matchAll(/(-?\d*\.?\d+)fr\b/ig)].map(item=>item[0]);
    if(fr.length)out.push({kind:'fr-unit',property:null,value:[...new Set(fr)].join(',')});
    return out;
  }
  function family(selector){
    const found=selector.match(/\.qxframe9a7c2-([a-z0-9-]+)/i);
    if(!found)return 'other';
    const name=found[1],known=['native-form','form-selectgroup','color-panel','color-picker','descriptions','card','upload','image-preview','table','date-picker','calendar','period-panel','time-panel','menu','tabs','result','empty','loading','json','rate','slider','input-otp','transfer','carousel','avatar','image','tree','picker','form'];
    return known.find(prefix=>name.startsWith(prefix))||name.split('-')[0];
  }
  function strategy(selector,body,decls){
    const text=(selector+' '+body).toLowerCase();
    if(/grid-template-areas/.test(text))return {strategy:'manual-structure',risk:'high'};
    if(/grid-area\s*:\s*1\s*\/\s*1/.test(text))return {strategy:'absolute-stack',risk:'medium'};
    if(/grid-(?:column|row)(?:-start|-end)?\s*:/.test(text))return {strategy:'manual-flex-span',risk:'high'};
    if(/repeat\s*\(/.test(text))return {strategy:'flex-wrap-basis',risk:'medium'};
    if(/max-content\s+minmax\(0\s*,\s*1fr\)/.test(text))return {strategy:'flex-label-content',risk:'medium'};
    if(/minmax\(/.test(text)||/\bfr\b/.test(text))return {strategy:'manual-flex-sizing',risk:'medium'};
    if(/place-(?:items|content)\s*:\s*center/.test(text)||/align-items\s*:\s*center/.test(text))return {strategy:/inline-grid/.test(text)?'inline-flex-center':'flex-center',risk:'low'};
    if(decls.some(item=>item.kind==='display-grid'))return {strategy:/inline-grid/.test(text)?'inline-flex':'flex',risk:'low'};
    return {strategy:'manual-review',risk:'medium'};
  }
  while((match=ruleRe.exec(source))){
    const selector=clean(match[1]);
    if(!selector||selector.startsWith('@'))continue;
    const decls=declarations(match[2]);
    if(!decls.length)continue;
    const decision=strategy(selector,match[2],decls);
    rules.push({selector:selector.slice(0,700),family:family(selector),declarations:decls,suggestedStrategy:decision.strategy,risk:decision.risk,approved:false,finalStrategy:null});
  }
  const countBy=key=>{const out={};for(const rule of rules)out[rule[key]]=(out[rule[key]]||0)+1;return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));};
  const protectedMatches=rules.filter(rule=>/\.qxframe9a7c2-(?:row|col(?:-|[.{:#])|g-|gx-|gy-)/.test(rule.selector));
  return {
    schemaVersion:1,generatedAt:'2026-10-01',
    policy:{finalLayout:'Flex-only; CSS Grid and fr are migration targets.',protected:'QXFRAME 24-column Grid remains a Flex layout system and its span/breakpoint math is not part of CSS Grid conversion.',automaticConversionApproved:false,note:'Suggested strategies are planning hints only. Every rule remains approved:false until component-level visual/interaction verification.'},
    baseline:{phaseBWideCssGridMatches:436,actualGridRuleCount:rules.length,actualGridDeclarationCount:rules.reduce((sum,rule)=>sum+rule.declarations.length,0)},
    summary:{byRisk:countBy('risk'),byStrategy:countBy('suggestedStrategy'),byFamily:countBy('family'),protected24ColumnFlexGridRulesMatched:protectedMatches.length},
    rules
  };
}
const arg=process.argv.find(value=>value.startsWith('--write='));
if(arg){const target=path.resolve(root,arg.slice('--write='.length));fs.mkdirSync(path.dirname(target),{recursive:true});const report=generateCssGridFlexMap();fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,wrote:path.relative(root,target).replaceAll('\\','/'),baseline:report.baseline,summary:report.summary}));}
else{const report=generateCssGridFlexMap();console.log(JSON.stringify({ok:true,baseline:report.baseline,summary:report.summary}));}
