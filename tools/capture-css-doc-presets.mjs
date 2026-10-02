// One-time migration evidence for existing docs presets, not a theme generator.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { browserProbes } from './audit-css-schema-acceptance.mjs';
const baseline = JSON.parse(fs.readFileSync(new URL('./manifests/css-static-color-baseline.json',import.meta.url),'utf8'));
const cssText = zlib.gunzipSync(Buffer.from(fs.readFileSync(new URL('./fixtures/css-schema-color/baseline.css.gz.base64',import.meta.url),'utf8').trim(),'base64')).toString();
const presets = {nova:'#5b5bd6',ocean:'#2563eb',violet:'#7c3aed',emerald:'#059669',amber:'#d97706',rose:'#e11d48'};
const result = await browserProbes({cssText,expression:`(() => {
  const entries=${JSON.stringify(baseline.entries)},presets=${JSON.stringify(presets)},rows=[];
  const root=document.documentElement,scope=document.getElementById('scope'),probe=document.createElement('div');
  probe.style.setProperty('transition','none','important');probe.style.setProperty('animation','none','important');scope.appendChild(probe);
  for(const [preset,seed] of Object.entries(presets)) for(const base of ['grey','mixed','gray']) {
    root.style.setProperty('--qxframe9a7c2-theme-primary',seed);
    for(let i=1;i<=13;i++){
      root.style.removeProperty('--qxframe9a7c2-theme-primary-'+i);
      if(base==='grey')root.style.removeProperty('--qxframe9a7c2-theme-neutral-'+i);
      else root.style.setProperty('--qxframe9a7c2-theme-neutral-'+i,base==='gray'?'rgb(var(--qxframe9a7c2-palette-gray-'+i+'))':'var(--_qxframe9a7c2-auxiliary-'+i+')');
    }
    for(const mode of ['light','dark']){
      root.setAttribute('data-qxframe9a7c2-theme',mode);scope.setAttribute('data-qxframe9a7c2-theme',mode);
      const primary=Array.from({length:13},(_,i)=>{probe.style.backgroundColor='var(--_qxframe9a7c2-primary-'+(i+1)+')';return getComputedStyle(probe).backgroundColor;});
      for(const axis of ['bare','default','primary']){
        probe.className='qxframe9a7c2-button'+(axis==='bare'?'':' is-'+axis);
        const values=entries.map(entry=>{probe.style.backgroundColor=entry.expression;return getComputedStyle(probe).backgroundColor;});
        rows.push({preset,base,mode,axis,values,primary});
      }
    }
  }
  return rows;
})()`});
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/css-doc-preset-colors.json',JSON.stringify(result));
for(const row of result) console.log('DOC_PRESET_ROW '+JSON.stringify(row));
console.log(JSON.stringify({ok:true,presets:6,neutralBases:3,rows:result.length}));
