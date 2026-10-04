import fs from 'node:fs';
import path from 'node:path';

// Only the old input/derived-mode layer is poisoned. Current shared semantic
// purposes, v2 complete inputs and every geometry/motion input stay intact.
export function consumerProbeInventory(root){
  const source=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
  const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/generated/theme-public-schema-v1.json')));
  const names=new Set(schema.tokens.filter(t=>t.layer==='palette'||(/^--qxframe9a7c2-theme-(?:(?:light|dark)-)?color-/.test(t.name)&&Object.values(t.defaults).every(value=>/^(?:#|rgba?\(|oklab\(|oklch\(|color\(|transparent$)/.test(value)))).map(t=>t.name));
  for(const match of source.matchAll(/(--_qxframe9a7c2-(?:mode-[a-z0-9-]+|on-[a-z0-9-]+|neutral-\d+|primary(?:-foreground)?))\s*:/g)){if(match[1]!=='--_qxframe9a7c2-mode-popup-shadow')names.add(match[1]);}
  const declarations=[...names].sort().map(name=>name+': '+(name.startsWith('--qxframe9a7c2-palette-')?'17, 239, 71':'rgb(251 0 251)')+' !important;').join('\n');
  const classes=new Set();
  for(const dir of ['src/styles/components','src/styles/theme'])for(const file of fs.readdirSync(path.join(root,dir))){
    if(!file.endsWith('.scss')||file==='_visual-v2.scss')continue;
    const text=fs.readFileSync(path.join(root,dir,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    for(const match of text.matchAll(/\.(qxframe9a7c2-[a-z0-9-]+)/g))classes.add(match[1]);
  }
  return {names:[...names].sort(),classes:[...classes].sort(),css:':root,[data-qxframe9a7c2-theme]{'+declarations+'}'};
}

// Run on the real canonical demo DOM, after the unmodified Schema-1 smoke.
// One Style/mode per CDP evaluation keeps each measurement bounded.
export function consumerPoisonBrowserProbe(inventory,style,mode){
  const body=document.body,known=new Set(inventory.classes),failures=[];
  body.setAttribute('data-qxframe9a7c2-visual','2');
  body.setAttribute('data-qxframe9a7c2-theme',mode);
  body.setAttribute('data-qxframe9a7c2-style',style);
  // Existing explicit nested modes remain boundaries. Apply the tested Style
  // to all v2 roots so the Studio is not an accidental different-style sample.
  document.querySelectorAll('[data-qxframe9a7c2-visual="2"]').forEach(node=>node.setAttribute('data-qxframe9a7c2-style',style));
  if(!document.getElementById('qx-v2-probe-stable')){
    const stable=document.createElement('style');stable.id='qx-v2-probe-stable';stable.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(stable);
  }
  const nodes=[...body.querySelectorAll('*')].filter(node=>[...node.classList].some(cls=>known.has(cls)));
  const properties=['backgroundColor','color','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','boxShadow','textShadow','backgroundImage'];
  const sample=node=>{
    const values=[];
    for(const pseudo of [null,'::before','::after']){
      const computed=getComputedStyle(node,pseudo);
      if(pseudo&&(computed.content==='none'||computed.content==='normal'))continue;
      for(const property of properties)values.push({pseudo,property,value:computed[property]});
    }
    return values;
  };
  const before=nodes.map(sample),poison=document.createElement('style');poison.textContent=inventory.css;document.head.appendChild(poison);
  let checks=0,mismatchCount=0;const reported=new Set();
  nodes.forEach((node,index)=>{
    const after=sample(node);
    before[index].forEach((entry,i)=>{
      checks++;
      if(entry.value!==after[i]?.value){
        mismatchCount++;
        const key=node.getAttribute('class')+'/'+entry.pseudo+'/'+entry.property;
        if(failures.length<60&&!reported.has(key)){reported.add(key);failures.push({style,mode,classes:node.getAttribute('class'),tag:node.tagName,pseudo:entry.pseudo,property:entry.property,before:entry.value,after:after[i]?.value});}
      }
    });
  });
  poison.remove();
  const covered=[...new Set(nodes.flatMap(node=>[...node.classList].filter(cls=>known.has(cls))))].sort();
  return {style,mode,nodes:nodes.length,checks,poisonedInputs:inventory.names.length,coveredClasses:covered,unmountedClasses:inventory.classes.filter(cls=>!covered.includes(cls)),mismatchCount,failures};
}
