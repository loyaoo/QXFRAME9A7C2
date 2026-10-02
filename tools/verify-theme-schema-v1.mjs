import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {publicInterface,buildSnapshot,colorRecipes} from './freeze-theme-schema.mjs';
import {compileStyles} from './compile-styles.mjs';
import {browserProbes} from './audit-css-schema-acceptance.mjs';

const manifest=JSON.parse(fs.readFileSync('docs/generated/theme-public-schema-v1.json','utf8'));
assert.equal(manifest.schema,1);
assert.deepEqual(manifest.tokens.map(t=>t.name),publicInterface(),'Public visual interface changed: review and version the manifest first.');
assert.equal(manifest.interfaceHash,crypto.createHash('sha256').update(publicInterface().join('\n')).digest('hex'));
const rebuilt=buildSnapshot();
const candidateRecipes=colorRecipes();
if(JSON.stringify(manifest.tokens)!==JSON.stringify(rebuilt.tokens)||JSON.stringify(JSON.parse(fs.readFileSync('docs/generated/theme-color-recipes-v1.json','utf8')))!==JSON.stringify(candidateRecipes))console.log('QX_SCHEMA_REVIEW_CANDIDATE='+JSON.stringify({manifest:rebuilt,recipes:candidateRecipes}));
assert.deepEqual(manifest.optionalComponentOverrides,rebuilt.optionalComponentOverrides,'Optional override contract changed outside schema review.');
assert.deepEqual(manifest.tokens,rebuilt.tokens,'Frozen defaults changed; the generator cannot infer defaults from current CSS.');
for(const token of manifest.tokens){assert.ok(token.name.startsWith('--qxframe9a7c2-'));for(const mode of ['light','dark'])assert.ok(token.defaults[mode]&&!/--_qxframe|color-mix\(|[{};]/.test(token.defaults[mode]),token.name+' must have a complete public-only static default.');}
const frozenRecipes=JSON.parse(fs.readFileSync('docs/generated/theme-color-recipes-v1.json','utf8'));
assert.deepEqual(frozenRecipes,candidateRecipes,'Frozen design recipes changed outside the schema review.');
assert.ok(frozenRecipes.recipes.dark.bare['r.mode-bg'].includes('theme-dark-bg'),'Dark design recipe must resolve the dark boundary.');
const menuBackground=manifest.tokens.find(t=>t.name==='--qxframe9a7c2-theme-menu-background');
assert.notEqual(menuBackground.defaults.light,menuBackground.defaults.dark,'Optional Menu defaults must retain the distinct dark surface.');
console.log(JSON.stringify({schema:1,publicInputs:manifest.tokens.length,optionalComponentOverrides:manifest.optionalComponentOverrides.length,interfaceHash:manifest.interfaceHash,staticDefaults:true}));

if(process.argv.includes('--browser')){
  const css=compileStyles().css;
  function stripMenuInputs(text){
    let start;while((start=text.search(/var\(--qxframe9a7c2-theme-menu-(?:background|item-(?:background|text)|hover-(?:background|text)|selected-(?:background|hover-background|text|indicator)),/))>=0){let end=start+4,depth=1,comma=-1;for(;depth;end++){if(text[end]==='(')depth++;if(text[end]===')')depth--;if(text[end]===','&&depth===1&&comma<0)comma=end;}text=text.slice(0,start)+text.slice(comma+1,end-1)+text.slice(end);}return text;
  }
  const menuExpression=`(() => {
    const scope=document.getElementById('scope'),out=[];
    const menu=document.createElement('div');menu.className='qxframe9a7c2-menu';
    menu.innerHTML='<div class="qxframe9a7c2-menu-root-scroll"><ul class="qxframe9a7c2-menu-root-level"><li class="qxframe9a7c2-menu-item-wrap"><button class="qxframe9a7c2-menu-item">Overview</button></li></ul></div>';scope.appendChild(menu);
    const item=menu.querySelector('button');item.style.transition='none';
    for(const mode of ['light','dark'])for(const horizontal of [false,true])for(const state of ['','is-hover','is-selected','is-open','is-selected is-hover','is-danger is-selected','is-disabled']){
      scope.setAttribute('data-qxframe9a7c2-theme',mode);menu.className='qxframe9a7c2-menu'+(horizontal?' is-horizontal':'');item.className='qxframe9a7c2-menu-item '+state;item.disabled=state==='is-disabled';const s=getComputedStyle(item);out.push([mode,horizontal,state,s.color,s.backgroundColor,s.outline,s.borderBottomColor]);
    }return out;
  })()`;
  const before=await browserProbes({cssText:stripMenuInputs(css),expression:menuExpression}),after=await browserProbes({expression:menuExpression});
  assert.deepEqual(after,before,'New Menu slots must retain all 28 existing default mode/orientation/state combinations.');
  const roles=await browserProbes({expression:`(() => {
    const scope=document.getElementById('scope'),checks=[];const stable=document.createElement('style');stable.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(stable);
    const add=(name,actual,expected)=>checks.push({name,actual,expected,passed:actual===expected});
    const node=document.createElement('div');node.innerHTML='<label class="qxframe9a7c2-switch is-md"><input class="qxframe9a7c2-switch-input" type="checkbox"><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span></label><div class="qxframe9a7c2-slider"><div class="qxframe9a7c2-slider-rail"></div></div><div class="qxframe9a7c2-menu"><button class="qxframe9a7c2-menu-item is-selected">Selected</button><button class="qxframe9a7c2-menu-item is-hover">Hover</button><button class="qxframe9a7c2-menu-item is-selected" disabled>Disabled</button></div><div class="qxframe9a7c2-list"><div class="qxframe9a7c2-item is-selected">Independent List</div></div>';scope.appendChild(node);
    const by=sel=>node.querySelector(sel),style=sel=>getComputedStyle(by(sel));
    const listBefore=style('.qxframe9a7c2-item').backgroundColor;
    scope.style.setProperty('--qxframe9a7c2-theme-switch-width-md','3rem');scope.style.setProperty('--qxframe9a7c2-theme-switch-height-md','1.5rem');scope.style.setProperty('--qxframe9a7c2-theme-slider-rail-md','.5rem');
    add('switch-width-role',style('.qxframe9a7c2-switch-track').minWidth,'48px');add('switch-height-role',style('.qxframe9a7c2-switch-track').height,'24px');add('slider-rail-role',style('.qxframe9a7c2-slider-rail').height,'8px');
    scope.style.setProperty('--qxframe9a7c2-theme-menu-selected-background','rgb(1, 2, 3)');scope.style.setProperty('--qxframe9a7c2-theme-menu-hover-background','rgb(4, 5, 6)');scope.style.setProperty('--qxframe9a7c2-theme-menu-selected-text','rgb(7, 8, 9)');
    add('menu-selected-slot',style('.qxframe9a7c2-menu-item.is-selected:not(:disabled)').backgroundColor,'rgb(1, 2, 3)');add('menu-selected-text',style('.qxframe9a7c2-menu-item.is-selected:not(:disabled)').color,'rgb(7, 8, 9)');add('menu-hover-slot',style('.qxframe9a7c2-menu-item.is-hover').backgroundColor,'rgb(4, 5, 6)');add('menu-disabled-last',style('.qxframe9a7c2-menu-item:disabled').backgroundColor,'rgba(0, 0, 0, 0)');add('menu-preset-does-not-affect-list',style('.qxframe9a7c2-item').backgroundColor,listBefore);
    return checks;
  })()`});assert.deepEqual(roles.filter(r=>!r.passed),[]);
  // Real popup/overlay components; physical scoped portal ownership, not a
  // copied class/token bridge. Same core UMD build used by canonical docs.
  const umd=fs.readFileSync('dist/qxframe9a7c2.js','utf8');
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/theme-schema-v1-freeze.json',JSON.stringify({schema:1,menuDefaultCases:before.length,roles,portalStatus:'pending'},null,2)+'\n');
  const portals=await browserProbes({expression:`(async () => {
    (0,eval)(${JSON.stringify(umd)});const C=QXFRAME9A7C2.Components,scope=document.getElementById('scope'),checks=[];
    const add=(name,passed)=>checks.push({name,passed});
    scope.setAttribute('data-qxframe9a7c2-theme','dark');
    const host=()=>{const e=document.createElement('div');scope.appendChild(e);return e;};
    const select=C.Select.create({document,container:host(),portalContainer:scope,items:[{value:'a',label:'Alpha'}],destroyOnClose:false,autoUpdate:false});select.open('schema');
    const date=C.DatePicker.create({document,container:host(),portalContainer:scope,defaultValue:'2026-10-02',destroyOnClose:false});date.open('schema');
    const modal=C.Modal.create({document,portalContainer:scope,autoOpen:false,animation:false,duration:{dialog:0,mask:0},title:'Scoped Modal',content:'Body'});modal.open('schema');
    const menu=C.Menu.create({document,container:host(),portalContainer:scope,mode:'vertical',items:[{key:'more',label:'More',items:[{key:'leaf',label:'Leaf'}]}]});menu.openSubmenu('more','schema');
    const drawer=C.Drawer.create({document,portalContainer:scope,autoOpen:false,animation:false,duration:0,title:'Scoped Drawer',content:'Body'});drawer.open('schema');
    await new Promise(r=>setTimeout(r,80));
    const targets=[['Select',select.getPopupElement()],['DatePicker',date.getPopupElement()],['Modal',modal.getDialogElement()],['Drawer',drawer.getPanelElement()],['Menu',menu.getSubmenuElement('more')]];
    for(const [name,target]of targets){add(name+'-physical-scoped-portal',scope.contains(target));const dark=getComputedStyle(target).backgroundColor;scope.setAttribute('data-qxframe9a7c2-theme','light');await new Promise(r=>requestAnimationFrame(r));const light=getComputedStyle(target).backgroundColor;add(name+'-scoped-mode-changes',dark!==light);scope.setAttribute('data-qxframe9a7c2-theme','dark');}
    select.destroy();date.destroy();modal.destroy();drawer.destroy();menu.destroy();return checks;
  })()`});assert.deepEqual(portals.filter(r=>!r.passed),[]);
  const evidence={schema:1,menuDefaultCases:before.length,roles,portals};fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/theme-schema-v1-freeze.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}
