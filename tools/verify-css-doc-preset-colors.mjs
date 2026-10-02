import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { browserProbes } from './audit-css-schema-acceptance.mjs';

const colors=JSON.parse(fs.readFileSync(new URL('./manifests/css-static-color-baseline.json',import.meta.url),'utf8'));
const baseline=JSON.parse(fs.readFileSync(new URL('./manifests/css-doc-preset-baseline.json',import.meta.url),'utf8'));
const docs=fs.readFileSync(new URL('../docs/assets/qxframe9a7c2-docs-theme-state.js',import.meta.url),'utf8');
const originalCss=zlib.gunzipSync(Buffer.from(fs.readFileSync(new URL('./fixtures/css-schema-color/baseline.css.gz.base64',import.meta.url),'utf8').trim(),'base64')).toString();
const presets={nova:'#5b5bd6',ocean:'#2563eb',violet:'#7c3aed',emerald:'#059669',amber:'#d97706',rose:'#e11d48'};

const roleResult=await browserProbes({expression:`(() => {
  (0,eval)(${JSON.stringify(docs)});
  const entries=${JSON.stringify(colors.entries)},rows=${JSON.stringify(baseline.rows)},presets=${JSON.stringify(presets)};
  const scope=document.getElementById('scope'),probe=document.createElement('div'),reference=document.createElement('div');
  probe.style.setProperty('transition','none','important');probe.style.setProperty('animation','none','important');scope.appendChild(probe);document.body.appendChild(reference);
  let checks=0;const failures=[];
  for(const row of rows){
    QXFRAME9A7C2_DOCS_THEME.setState({preset:row.preset,primarySeed:presets[row.preset],base:row.base,mode:row.mode});
    scope.setAttribute('data-qxframe9a7c2-theme',row.mode);
    probe.className='qxframe9a7c2-button'+(row.axis==='bare'?'':' is-'+row.axis);
    entries.forEach((entry,i)=>{
      if(entry.normalized.includes('accent-seed)'))return;
      probe.style.backgroundColor='var('+entry.resolvedToken+',var('+entry.modeFallback+'))';
      reference.style.backgroundColor=row.values[i];
      const actual=getComputedStyle(probe).backgroundColor,expected=getComputedStyle(reference).backgroundColor;
      checks++;if(actual!==expected)failures.push({preset:row.preset,base:row.base,mode:row.mode,axis:row.axis,role:entry.id,actual,expected});
    });
  }
  return {checks,failures};
})()`});
console.log(JSON.stringify({docsColorRoles:{checks:roleResult.checks,failures:roleResult.failures.slice(0,20),failureCount:roleResult.failures.length}}));
assert.equal(roleResult.failures.length,0,'Existing docs preset roles must retain their old computed colors.');

function buttonExpression(useDocs){return `(() => {
  ${useDocs?'(0,eval)('+JSON.stringify(docs)+');':''}
  const presets=${JSON.stringify(presets)},result=[],root=document.documentElement,scope=document.getElementById('scope');
  const probe=document.createElement('button');probe.style.setProperty('transition','none','important');probe.style.setProperty('animation','none','important');scope.appendChild(probe);
  for(const [preset,seed] of Object.entries(presets))for(const base of ['grey','mixed','gray'])for(const mode of ['light','dark']){
    ${useDocs?"QXFRAME9A7C2_DOCS_THEME.setState({preset,primarySeed:seed,base,mode});":`root.setAttribute('data-qxframe9a7c2-theme',mode);root.style.setProperty('--qxframe9a7c2-theme-primary',seed);
    for(let i=1;i<=13;i++){root.style.removeProperty('--qxframe9a7c2-theme-primary-'+i);if(base==='grey')root.style.removeProperty('--qxframe9a7c2-theme-neutral-'+i);else root.style.setProperty('--qxframe9a7c2-theme-neutral-'+i,base==='gray'?'rgb(var(--qxframe9a7c2-palette-gray-'+i+'))':'var(--_qxframe9a7c2-auxiliary-'+i+')');}`}
    scope.setAttribute('data-qxframe9a7c2-theme',mode);
    for(const axis of ['default','primary'])for(const variant of ['solid','outlined','dashed','soft','text','link'])for(const state of ['','is-hover','is-focus','is-active','is-disabled']){
      probe.className='qxframe9a7c2-button is-'+axis+' is-'+variant+' '+state;
      const cs=getComputedStyle(probe);
      result.push({preset,base,mode,axis,variant,state,background:cs.backgroundColor,color:cs.color,border:cs.borderTopColor,shadow:cs.boxShadow,outline:cs.outlineColor});
    }
  }
  return result;
})()`;}
const before=await browserProbes({cssText:originalCss,expression:buttonExpression(false)});
const after=await browserProbes({expression:buttonExpression(true)});
const failures=after.flatMap((row,i)=>Object.keys(row).filter(key=>row[key]!==before[i][key]).map(key=>({preset:row.preset,base:row.base,mode:row.mode,axis:row.axis,variant:row.variant,state:row.state,property:key,actual:row[key],expected:before[i][key]})));
console.log(JSON.stringify({docsButtonRegression:{cases:before.length,failures:failures.slice(0,20),failureCount:failures.length}}));
assert.equal(failures.length,0,'Actual default/preset Button state properties must preserve the pre-staticization graph.');
