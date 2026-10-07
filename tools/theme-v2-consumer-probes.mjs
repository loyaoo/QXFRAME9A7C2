import fs from 'node:fs';
import path from 'node:path';

// The old public Theme inputs no longer exist. Poison only private variables that
// are actually CSS <color> values (or aliases to one). Names are intentionally
// NOT used as the type system: e.g. fixed-color-panel-control-border is a length.
// Geometry, shadow geometry, gradients and motion values must stay untouched.
export function consumerProbeInventory(root){
  const source=fs.readFileSync(path.join(root,'src/styles/main/fixed-values.css'),'utf8');
  const values=new Map();
  for(const match of source.matchAll(/(--_qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;]+);/gi))values.set(match[1],match[2].trim());

  const directColor=value=>/^(?:#[0-9a-f]{3,8}\b|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(|transparent\b|currentcolor\b)/i.test(value);
  const soleVar=value=>{
    const match=value.match(/^var\(\s*(--_qxframe9a7c2-[a-z0-9-]+)\s*\)$/i);
    return match?.[1]??null;
  };
  const names=new Set([...values].filter(([,value])=>directColor(value)).map(([name])=>name));
  // Resolve pure aliases transitively. Composite shadow/gradient/length values are
  // deliberately excluded even when one operand happens to be a color.
  let changed=true;
  while(changed){
    changed=false;
    for(const [name,value]of values){
      if(names.has(name))continue;
      const target=soleVar(value);
      if(target&&names.has(target)){names.add(name);changed=true;}
    }
  }

  const declarations=[...names].sort().map(name=>name+': rgb(251 0 251) !important;').join('\n');
  const classes=new Set();
  for(const dir of ['src/styles/components','src/styles/theme'])for(const file of fs.readdirSync(path.join(root,dir))){
    if(!file.endsWith('.scss'))continue;
    const text=fs.readFileSync(path.join(root,dir,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    for(const match of text.matchAll(/\.(qxframe9a7c2-[a-z0-9-]+)/g))classes.add(match[1]);
  }
  return {names:[...names].sort(),classes:[...classes].sort(),css:':root,[data-qxframe9a7c2-theme]{'+declarations+'}',classification:'css-color-value+pure-alias'};
}

// Run on the real canonical demo DOM. One Style/mode per CDP evaluation keeps
// each measurement bounded while proving retired private paint fallbacks cannot
// leak into current component rendering.
export function consumerPoisonBrowserProbe(inventory,style,mode){
  const body=document.body,known=new Set(inventory.classes),failures=[];
  body.setAttribute('data-qxframe9a7c2-theme',mode);
  body.setAttribute('data-qxframe9a7c2-style',style);
  document.querySelectorAll('[data-qxframe9a7c2-theme]').forEach(node=>node.setAttribute('data-qxframe9a7c2-style',style));
  if(!document.getElementById('qx-v2-probe-stable')){
    const stable=document.createElement('style');stable.id='qx-v2-probe-stable';stable.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(stable);
  }
  const nodes=[...body.querySelectorAll('*')].filter(node=>[...node.classList].some(cls=>known.has(cls)));
  const properties=['backgroundColor','color','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','boxShadow','textShadow','backgroundImage'];
  const painted=(computed,property)=>{
    if(property==='borderTopColor')return parseFloat(computed.borderTopWidth)>0&&!['none','hidden'].includes(computed.borderTopStyle);
    if(property==='borderRightColor')return parseFloat(computed.borderRightWidth)>0&&!['none','hidden'].includes(computed.borderRightStyle);
    if(property==='borderBottomColor')return parseFloat(computed.borderBottomWidth)>0&&!['none','hidden'].includes(computed.borderBottomStyle);
    if(property==='borderLeftColor')return parseFloat(computed.borderLeftWidth)>0&&!['none','hidden'].includes(computed.borderLeftStyle);
    if(property==='outlineColor')return parseFloat(computed.outlineWidth)>0&&!['none','hidden'].includes(computed.outlineStyle);
    if(property==='boxShadow')return computed.boxShadow!=='none';
    if(property==='textShadow')return computed.textShadow!=='none';
    if(property==='backgroundImage')return computed.backgroundImage!=='none';
    return true;
  };
  const sample=node=>{
    const values=[],host=getComputedStyle(node),parent=node.parentElement?getComputedStyle(node.parentElement):null;
    for(const pseudo of [null,'::before','::after']){
      const computed=pseudo?getComputedStyle(node,pseudo):host;
      const pseudoPainted=!pseudo||!(computed.content==='none'||computed.content==='normal');
      for(const property of properties)values.push({pseudo,property,value:pseudoPainted&&painted(computed,property)?computed[property]:null});
    }
    return {values,hostColor:host.color,parentColor:parent?.color??null};
  };
  const before=nodes.map(sample),poison=document.createElement('style');poison.textContent=inventory.css;document.head.appendChild(poison);
  let checks=0,mismatchCount=0;const reported=new Set();
  nodes.forEach((node,index)=>{
    const after=sample(node),prior=before[index];
    prior.values.forEach((entry,i)=>{
      const next=after.values[i];
      if(entry.value==null&&next?.value==null)return;
      if(entry.property==='color'&&!entry.pseudo&&prior.parentColor!=null&&entry.value===prior.parentColor&&next?.value===after.parentColor)return;
      if(entry.property==='color'&&entry.pseudo&&entry.value===prior.hostColor&&next?.value===after.hostColor)return;
      checks++;
      if(entry.value!==next?.value){
        mismatchCount++;
        const key=node.getAttribute('class')+'/'+entry.pseudo+'/'+entry.property;
        if(failures.length<120&&!reported.has(key)){reported.add(key);failures.push({style,mode,classes:node.getAttribute('class'),tag:node.tagName,inlineStyle:node.getAttribute('style'),demo:node.closest('[data-slug]')?.dataset.slug,pseudo:entry.pseudo,property:entry.property,before:entry.value,after:next?.value});}
      }
    });
  });
  poison.remove();
  const covered=[...new Set(nodes.flatMap(node=>[...node.classList].filter(cls=>known.has(cls))))].sort();
  return {style,mode,nodes:nodes.length,checks,poisonedInputs:inventory.names.length,classification:inventory.classification,coveredClasses:covered,unmountedClasses:inventory.classes.filter(cls=>!covered.includes(cls)),mismatchCount,failures};
}
