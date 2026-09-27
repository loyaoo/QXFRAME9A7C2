import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FocusOrigin } from '../src/core/focusOrigin.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function fakeDoc(){
  const handlers=new Map(),classes=new Set();
  const classList={
    contains(n){return classes.has(n);},
    toggle(n,force){if(force===undefined){if(classes.has(n)){classes.delete(n);return false;}classes.add(n);return true;}if(force)classes.add(n);else classes.delete(n);return !!force;},
    remove(n){classes.delete(n);}
  };
  const doc={
    nodeType:9,activeElement:null,documentElement:{classList},defaultView:{setTimeout,clearTimeout},
    addEventListener(n,h){if(!handlers.has(n))handlers.set(n,[]);handlers.get(n).push(h);},
    removeEventListener(n,h){const a=handlers.get(n)||[];const i=a.indexOf(h);if(i>=0)a.splice(i,1);},
    emit(n,e){for(const h of (handlers.get(n)||[]).slice())h(e);}
  };
  return doc;
}
function el(doc,tag='INPUT',type='text'){
  return {nodeType:1,ownerDocument:doc,tagName:tag,type,contains(x){return x===this;},getAttribute(){return null;}};
}

const doc=fakeDoc(),input=el(doc),button=el(doc,'BUTTON');
FocusOrigin.setup(doc);

doc.activeElement=input;
doc.emit('pointerdown',{target:input,pointerType:'mouse',type:'pointerdown'});
doc.emit('focusin',{target:input,type:'focusin'});
assert.equal(FocusOrigin.originOf(input),'pointer');
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),false);

doc.emit('keydown',{target:input,key:'a',defaultPrevented:false,isComposing:false});
assert.equal(FocusOrigin.originOf(input),'pointer');
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),false);

doc.emit('keydown',{target:input,key:'Tab',defaultPrevented:false,isComposing:false});
doc.activeElement=button;
doc.emit('focusin',{target:button,type:'focusin'});
assert.equal(FocusOrigin.originOf(button),'keyboard');
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),true);

doc.emit('pointerdown',{target:button,pointerType:'mouse',type:'pointerdown'});
assert.equal(FocusOrigin.originOf(button),'pointer');
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),false);

doc.emit('keydown',{target:button,key:'Enter',defaultPrevented:false,isComposing:false});
assert.equal(FocusOrigin.originOf(button),'keyboard');
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),true);

FocusOrigin.prepare(input,'keyboard',{source:'programmatic-test'});
doc.activeElement=input;
doc.emit('focusin',{target:input,type:'focusin'});
assert.equal(FocusOrigin.originOf(input),'keyboard');
const cap=FocusOrigin.capture(doc);
assert.equal(cap.element,input);
assert.equal(cap.origin,'keyboard');

const parent=el(doc,'DIV'),child=el(doc,'BUTTON');
parent.contains=x=>x===parent||x===child;
FocusOrigin.set(parent,'keyboard',{source:'nested-setup'});
doc.activeElement=parent;
doc.emit('pointerdown',{target:child,pointerType:'mouse',type:'pointerdown'});
assert.equal(FocusOrigin.originOf(parent),'pointer');
doc.activeElement=child;
doc.emit('focusin',{target:child,type:'focusin'});
assert.equal(FocusOrigin.originOf(child),'pointer');

// Repository-wide focus-origin invariants.
const navigationSource=fs.readFileSync(path.join(root,'src/core/keyboardNavigation.js'),'utf8');
assert.match(
  navigationSource,
  /else nextModality = modality;/,
  'VirtualFocus programmatic activation must preserve current modality instead of defaulting to keyboard.'
);

const css=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const unsafeFocusOutlineRules=[];
const ruleRe=/([^{}]+)\{([^{}]*)\}/g;
let match;
while((match=ruleRe.exec(css))){
  const selector=match[1].trim(),body=match[2];
  if(!/:focus(?!-visible)/.test(selector)) continue;
  const outline=/outline\s*:\s*([^;}]+)/i.exec(body);
  if(!outline) continue;
  const value=String(outline[1]||'').trim().toLowerCase();
  if(value==='none'||value==='0'||value.startsWith('0 ')) continue;
  unsafeFocusOutlineRules.push(selector);
}
assert.deepEqual(
  unsafeFocusOutlineRules,
  [],
  'Mouse/programmatic :focus/:focus-within must never own an outline; use :focus-visible or FocusOrigin-projected keyboard classes.'
);

const componentDir=path.join(root,'src/components');
const directKeyboardClassOwners=[];
for(const name of fs.readdirSync(componentDir).filter(name=>name.endsWith('.js'))){
  const source=fs.readFileSync(path.join(componentDir,name),'utf8');
  if(/classList\.(?:add|toggle)\(\s*['"]is-keyboard-focus['"]/.test(source)) directKeyboardClassOwners.push(name);
}
assert.deepEqual(
  directKeyboardClassOwners.sort(),
  ['control.js','image.js','table.js','tabs.js'],
  'Component-local is-keyboard-focus projection must stay limited to audited FocusOrigin-backed shell/bridge owners; composite item rings belong to VirtualFocus.'
);
for(const name of directKeyboardClassOwners){
  const source=fs.readFileSync(path.join(componentDir,name),'utf8');
  assert.match(source,/FocusOrigin\.isKeyboard\(/,name+' must derive is-keyboard-focus from FocusOrigin, never from click/focus state alone.');
}

FocusOrigin.destroy(doc);
assert.equal(doc.documentElement.classList.contains('qxframe9a7c2-keyboard-focus-origin'),false);

console.log(JSON.stringify({
  ok:true,
  tests:[
    'pointer-editor','tab-editor','same-owner-pointer','discrete-action','capture-restore',
    'nested-pointer-focus-handoff','focus-origin-root-projection','virtual-focus-modality-preservation',
    'all-component-keyboard-class-ownership','no-pointer-focus-outline-css'
  ]
}));
