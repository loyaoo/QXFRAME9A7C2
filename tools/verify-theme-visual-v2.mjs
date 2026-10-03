import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {generateSemanticTheme,normalizeSemanticConfig,migrateLegacySemanticColors,CORE_ROLES,OPTIONAL_ROLES,OVERRIDE_ROLES,SEMANTIC_STYLES} from '../docs/assets/theme-generator/semantic-engine.mjs';
import {verifySemanticRuleSource,V2_STYLE_MODULE} from './theme-v2-contract.mjs';
import {compileStyles} from './compile-styles.mjs';
import {browserProbes} from './audit-css-schema-acceptance.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/theme-v2/shadcn-source.json')));
const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/generated/theme-public-schema-v2.json')));
const verified=verifySemanticRuleSource(root),generated=generateSemanticTheme();
assert.deepEqual(schema.inputs.map(x=>x.role),CORE_ROLES);
assert.deepEqual(schema.optionalInputs.map(x=>x.role),OPTIONAL_ROLES);
assert.deepEqual(schema.overrides.map(x=>x.role),OVERRIDE_ROLES);
assert.equal(generated.statistics.colorNames,28);
assert.equal(generated.statistics.colorDeclarations,56);
assert.equal(generated.statistics.overrideDeclarations,0);
assert.doesNotMatch(generated.css,/palette-|--_qxframe|color-mix|qxframe9a7c2-button|-(?:xs|sm|lg|xl):/);
assert.deepEqual(generateSemanticTheme(JSON.parse(JSON.stringify(generated.config))),generated);
assert.equal(generateSemanticTheme({colors:{light:{'chart-1':'rgb(1 2 3)'}}}).statistics.colorNames,29);
assert.equal(generateSemanticTheme({overrides:{light:{'action-hover-background':'rgb(4 5 6)'}}}).statistics.overrideDeclarations,1);
for(const invalid of [{schema:1},{rules:'unknown'},{style:'unknown'},{colors:{light:{typo:'red'}}},{colors:{light:{primary:'var(--old-palette)'}}},{colors:{light:{primary:'rgb(1 2 3); display:none'}}},{overrides:{light:{'control-height-xs':'2rem'}}}])assert.throws(()=>generateSemanticTheme(invalid));
const migrated=migrateLegacySemanticColors({'light.primary':'1, 2, 3','light.control-height-xs':'2rem','dark.primary':'oklch(.5 .1 20)'});
assert.equal(migrated.config.colors.light.primary,'rgb(1, 2, 3)');assert.equal(migrated.unmapped.length,1);

// Test the detector itself. A changed ratio, space or ungated module cannot pass
// simply because the legacy audit allows the versioned module path.
const altered=verified.source.replace('80%, transparent','79%, transparent');
assert.notEqual(altered,verified.source);
assert.throws(()=>verifySemanticRuleSource(root,{sourceText:altered}),/Unmapped or modified/);
assert.throws(()=>verifySemanticRuleSource(root,{sourceText:verified.source.replace('in oklch','in oklab')}),/Unmapped or modified/);

// Translate only original source COLOR utilities, independently of QX expressions.
// This fixture compiler does not implement layout, Tailwind, ARIA or interaction.
function sourceColor(style,selector,property,mode,state='normal'){
  const apply=fixture.styles[style].entries.find(e=>e.selector===selector).apply;
  const candidates=[];
  for(const utility of apply.split(/\s+/)){
    const segments=utility.split(/:(?![^\[]*\])/),atom=segments.pop();
    const match=atom.match(new RegExp('^'+property+'-(.+)$'));if(!match)continue;
    const conditions=segments;
    if(conditions.some(c=>!['dark','hover','focus','focus-visible','aria-invalid','aria-expanded','disabled','data-[variant=destructive]'].includes(c)))continue;
    if(conditions.includes('dark')&&mode!=='dark')continue;
    if(conditions.includes('hover')&&state!=='hover')continue;
    if(conditions.includes('focus')&&!['hover','selected'].includes(state))continue;
    if(conditions.includes('focus-visible')&&state!=='focus')continue;
    if(conditions.includes('aria-invalid')&&state!=='invalid')continue;
    if(conditions.includes('aria-expanded')&&state!=='expanded')continue;
    if(conditions.includes('disabled')&&state!=='disabled')continue;
    if(conditions.includes('data-[variant=destructive]')&&state!=='danger')continue;
    const value=match[1];let expression;
    if(value.startsWith('[color-mix('))expression=value.slice(1,-1).replaceAll('_',' ').replaceAll('var(--','var(--source-');
    else{
      const m=value.match(/^(background|foreground|primary|primary-foreground|secondary|secondary-foreground|card|card-foreground|popover|popover-foreground|muted|muted-foreground|accent|accent-foreground|destructive|input|border|ring|black|transparent)(?:\/(\d+))?$/);
      if(!m)continue;
      expression=['black','transparent'].includes(m[1])?m[1]:'var(--source-'+m[1]+')';
      if(m[2])expression='color-mix(in oklab, '+expression+' '+m[2]+'%, transparent)';
    }
    candidates.push({expression,weight:(conditions.includes('dark')?1:0)+(conditions.length-(conditions.includes('dark')?1:0))*2});
  }
  candidates.sort((a,b)=>a.weight-b.weight);
  return candidates.at(-1)?.expression??(property==='bg'?'transparent':property==='text'?'var(--source-foreground)':'transparent');
}
const cases=[];
for(const style of SEMANTIC_STYLES)for(const mode of ['light','dark']){
  for(const type of ['default','primary','secondary','success','warning','error','info'])for(const variant of ['solid','filled','outlined','plain','text','link'])for(const state of ['normal','hover','active','hover-active','loading-hover','disabled-hover']){
    const selector='.cn-button-variant-'+({solid:type==='secondary'?'secondary':'default',filled:'destructive',outlined:'outline',plain:'ghost',text:'ghost',link:'link'}[variant]);
    const sourceState=['hover','hover-active'].includes(state)?'hover':'normal';
    cases.push({style,mode,type,variant,state,kind:'button',expected:{backgroundColor:sourceColor(style,selector,'bg',mode,sourceState),color:sourceColor(style,selector,'text',mode,sourceState),borderColor:sourceColor(style,selector,'border',mode,sourceState)},selector});
  }
  for(const state of ['normal','invalid','disabled'])cases.push({style,mode,state,kind:'input',expected:{backgroundColor:sourceColor(style,'.cn-input','bg',mode,state),borderBottomColor:sourceColor(style,'.cn-input',style==='sera'?'border-b':'border',mode,state)},selector:'.cn-input'});
  cases.push({style,mode,kind:'card',expected:{backgroundColor:sourceColor(style,'.cn-card','bg',mode),color:sourceColor(style,'.cn-card','text',mode),borderColor:sourceColor(style,'.cn-card','ring',mode)},selector:'.cn-card'});
  cases.push({style,mode,kind:'dialog',expected:{backgroundColor:sourceColor(style,'.cn-dialog-content','bg',mode),color:sourceColor(style,'.cn-dialog-content','text',mode)},selector:'.cn-dialog-content'});
  cases.push({style,mode,kind:'mask',expected:{backgroundColor:sourceColor(style,'.cn-dialog-overlay','bg',mode)},selector:'.cn-dialog-overlay'});
  for(const state of ['normal','hover','selected'])cases.push({style,mode,state,kind:'menu',expected:{backgroundColor:sourceColor(style,'.cn-dropdown-menu-item','bg',mode,state),color:sourceColor(style,'.cn-dropdown-menu-item','text',mode,state)},selector:'.cn-dropdown-menu-item'});
}
const css=compileStyles().css;
const report={schema:2,stage:'A/B/C representative chain',sourceSha:fixture.sha,sourceRules:verified.expressions.length,inputs:generated.statistics,themeBytes:Buffer.byteLength(generated.css),themeGzipBytes:zlib.gzipSync(generated.css).length,frameworkBytes:Buffer.byteLength(css),pilotSourceBytes:Buffer.byteLength(verified.source),defaultReplaced:false,allComponentMigration:false,browser:null};
if(process.argv.includes('--browser')){
  report.browser=await browserProbes({cssText:css,expression:`(() => {
    const cases=${JSON.stringify(cases)},scope=document.getElementById('scope'),failures=[];
    const stable=document.createElement('style');stable.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(stable);
    scope.setAttribute('data-qxframe9a7c2-visual','2');
    const host=document.createElement('div'),reference=document.createElement('div');scope.append(host,reference);
    const p='--qxframe9a7c2-theme-v2-',sourceRole=role=>'var('+p+role+')';
    for(const role of ${JSON.stringify(CORE_ROLES)})reference.style.setProperty('--source-'+role,sourceRole(role));
    const pixel=(color,surface=null)=>{const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');if(surface){ctx.fillStyle=surface;ctx.fillRect(0,0,1,1);}ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
    const compare=(id,actual,expected)=>{const surface=getComputedStyle(scope).backgroundColor;if(actual!==expected&&(JSON.stringify(pixel(actual))!==JSON.stringify(pixel(expected))||JSON.stringify(pixel(actual,surface))!==JSON.stringify(pixel(expected,surface))))failures.push({id,actual,expected,surface,actualRGBA:pixel(actual),expectedRGBA:pixel(expected)});};
    const measure=(node,property)=>getComputedStyle(node)[property];
    let checks=0;
    for(const test of cases){
      scope.setAttribute('data-qxframe9a7c2-theme',test.mode);scope.setAttribute('data-qxframe9a7c2-style',test.style);
      const type=test.type??'primary';reference.style.setProperty('--source-primary',sourceRole(type==='default'?'foreground':type));reference.style.setProperty('--source-primary-foreground',sourceRole(type==='default'?'background':type+'-foreground'));reference.style.setProperty('--source-destructive',sourceRole(test.kind==='button'?(type==='default'?'foreground':type):'error'));
      if(test.kind==='button')host.innerHTML='<button class="qxframe9a7c2-button is-'+type+' is-'+test.variant+' '+(test.state==='hover-active'?'is-hover is-active':test.state==='loading-hover'?'is-loading is-hover':test.state==='disabled-hover'?'is-disabled is-hover':test.state==='normal'?'':'is-'+test.state)+'">QX</button>';
      if(test.kind==='input')host.innerHTML='<div class="qxframe9a7c2-input '+(test.state==='invalid'?'is-invalid':test.state==='disabled'?'is-disabled':'')+'"><input class="qxframe9a7c2-input-control"></div>';
      if(test.kind==='card')host.innerHTML='<div class="qxframe9a7c2-card">QX</div>';
      if(test.kind==='dialog')host.innerHTML='<div class="qxframe9a7c2-modal-root"><div class="qxframe9a7c2-modal-container">QX</div></div>';
      if(test.kind==='mask')host.innerHTML='<div class="qxframe9a7c2-modal-root"><div class="qxframe9a7c2-modal-mask"></div></div>';
      if(test.kind==='menu')host.innerHTML='<div class="qxframe9a7c2-menu"><button class="qxframe9a7c2-menu-item '+(test.state==='normal'?'':'is-'+test.state)+'">QX</button></div>';
      const node=host.querySelector(test.kind==='dialog'?'.qxframe9a7c2-modal-container':test.kind==='mask'?'.qxframe9a7c2-modal-mask':test.kind==='menu'?'.qxframe9a7c2-menu-item':':first-child');
      for(const [property,expression]of Object.entries(test.expected)){
        reference.style[property]=expression;const expected=measure(reference,property),actual=measure(node,property);
        compare(test.style+'/'+test.mode+'/'+test.kind+'/'+type+'/'+test.variant+'/'+test.state+'/'+property,actual,expected);checks++;
      }
      if(test.state==='disabled-hover'){if(Number(measure(node,'opacity'))!==.5)failures.push({id:test.style+'/'+test.mode+'/disabled-opacity',actual:measure(node,'opacity'),expected:'.5'});checks++;}
    }
    // Same consumer, locally changed input: detects aliases pre-resolved at root.
    scope.setAttribute('data-qxframe9a7c2-style','vega');scope.setAttribute('data-qxframe9a7c2-theme','light');
    host.innerHTML='<div data-qxframe9a7c2-theme="dark"><div data-qxframe9a7c2-theme="light"><button id="local" class="qxframe9a7c2-button is-primary is-solid is-hover">Local</button><div class="qxframe9a7c2-card">Neutral</div></div></div>';
    const local=host.querySelector('#local');local.style.setProperty(p+'primary','rgb(80 120 160 / .5)');
    reference.style.backgroundColor='color-mix(in oklab, rgb(80 120 160 / .5) 80%, transparent)';
    compare('local-primary-with-alpha-light-in-dark',measure(local,'backgroundColor'),measure(reference,'backgroundColor'));checks++;
    const neutral=host.querySelector('.qxframe9a7c2-card'),before=measure(neutral,'backgroundColor');
    local.style.setProperty(p+'override-action-hover-background','rgb(1 2 3)');compare('local-override',measure(local,'backgroundColor'),'rgb(1, 2, 3)');checks++;
    local.style.removeProperty(p+'override-action-hover-background');compare('delete-override-restores-alpha',measure(local,'backgroundColor'),measure(reference,'backgroundColor'));checks++;
    compare('primary-does-not-dye-card',measure(neutral,'backgroundColor'),before);checks++;
    for(const property of ['backgroundColor','color']){neutral.style.setProperty(p+(property==='color'?'card-foreground':'card'),'rgb(12 34 56)');compare('local-card-'+property,measure(neutral,property),'rgb(12, 34, 56)');checks++;}
    neutral.innerHTML='<div class="qxframe9a7c2-card-title">Title</div><div class="qxframe9a7c2-card-description">Description</div>';
    const title=neutral.querySelector('.qxframe9a7c2-card-title'),description=neutral.querySelector('.qxframe9a7c2-card-description'),descriptionBefore=measure(description,'color');
    neutral.style.setProperty(p+'override-surface-foreground','rgb(61 82 103)');
    for(const node of [neutral,title]){compare('card-surface-foreground-override',measure(node,'color'),'rgb(61, 82, 103)');checks++;}
    compare('card-description-keeps-muted-role',measure(description,'color'),descriptionBefore);checks++;
    neutral.style.removeProperty(p+'override-surface-foreground');
    for(const node of [neutral,title]){compare('delete-card-surface-foreground-restores-role',measure(node,'color'),'rgb(12, 34, 56)');checks++;}
    return {cases:cases.length,checks,failures,renderTolerance:'0 RGBA byte difference both on transparent canvas and after actual mode-surface composition; exact strings retained'};
  })()`});
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/theme-visual-v2.json'),JSON.stringify(report,null,2)+'\n');
  assert.deepEqual(report.browser.failures,[],'Source colors and QX consumer colors differ; details in artifacts/theme-visual-v2.json');
}
console.log(JSON.stringify(report));
