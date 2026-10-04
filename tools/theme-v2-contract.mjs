import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export const V2_STYLE_MODULE = 'src/styles/theme/_visual-v2.scss';
export function verifySemanticRuleSource(root,{sourceText=null}={}){
  const source=(sourceText??fs.readFileSync(path.join(root,V2_STYLE_MODULE),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'');
  const fixture=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/theme-v2/shadcn-source.json'),'utf8'));
  assert.equal(fixture.sha,'295a1f114a138f23b5dfee0e0c6812394dfeb90c');
  assert.match(fixture.bases.button.class,/disabled:opacity-50/);
  assert.equal(fixture.tailwind.version,'4.3.0');
  assert.equal(fixture.tailwind.shadows.xs,'0 1px 2px 0 rgb(0 0 0 / 0.05)');
  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
    const entries=fixture.styles[style].entries;
    const get=selector=>entries.find(e=>e.selector===selector)?.apply??'';
    assert.match(get('.cn-button-variant-default'),/hover:bg-primary\/80/);
    assert.ok(get('.cn-button-variant-secondary').includes('color-mix(in_oklch,var(--secondary),var(--foreground)_5%)'));
    assert.match(get('.cn-button-variant-destructive'),/bg-destructive\/10.*hover:bg-destructive\/20.*dark:bg-destructive\/20.*dark:hover:bg-destructive\/30/);
    assert.match(get('.cn-dropdown-menu-item'),/focus:bg-accent focus:text-accent-foreground/);
    assert.match(get('.cn-card'),/bg-card text-card-foreground/);
    assert.match(get('.cn-dialog-content'),/bg-popover text-popover-foreground/);
  }
  for(const style of ['nova','mira','lyra'])assert.match(fixture.styles[style].entries.find(e=>e.selector==='.cn-slider-thumb').apply,/border-ring/);
  assert.match(fixture.styles.luma.entries.find(e=>e.selector==='.cn-checkbox').apply, /bg-input\/90/);
  assert.match(fixture.styles.sera.entries.find(e=>e.selector==='.cn-badge-variant-destructive').apply, /hover:text-destructive\/70/);
  const p='--qxframe9a7c2-theme-v2-',t='--_qxframe9a7c2-v2-type';
  const allowed=new Set();
  const alpha=(name,weights)=>weights.forEach(n=>allowed.add('color-mix(inoklab,var('+name+')'+n+'%,transparent)'));
  alpha(t,[10,20,30,40,70,80,90]);alpha('--_qxframe9a7c2-v2-shadow-color',[5,10,25]);alpha(p+'input',[20,30,50,80,90]);alpha(p+'muted',[50]);alpha(p+'foreground',[5,10]);alpha(p+'error',[10,20,50]);
  allowed.add('color-mix(inoklch,var('+p+'secondary)95%,var('+p+'foreground)5%)');
  const expressions=[];
  for(let start=source.indexOf('color-mix(');start>=0;start=source.indexOf('color-mix(',start+1)){
    let end=start+'color-mix('.length,depth=1;for(;end<source.length&&depth;end++){if(source[end]==='(')depth++;if(source[end]===')')depth--;}
    assert.equal(depth,0,'Unclosed color-mix expression');
    const expression=source.slice(start,end).replace(/\s+/g,'');
    assert.ok(allowed.has(expression),'Unmapped or modified source formula: '+expression);expressions.push(expression);
  }
  assert.ok(expressions.length>0);
  assert.doesNotMatch(source,/var\(\s*--qxframe9a7c2-palette-|rgb\(\s*var\(|--qxframe9a7c2-theme-v2-[a-z-]+-(?:xs|sm|lg|xl)\b|@layer|:is\(|:where\(|display\s*:\s*grid|\d(?:vw|vh|fr)\b/);
  assert.equal((source.match(/@scope \(/g)||[]).length,8,'Every Theme rule must remain within one of the eight reviewed Style scopes');
  assert.match(source,/^\s*@scope \(:root\)\s*\{/,'Canonical Vega/default Theme scope is missing');
  let cursor=0,scopes=0;
  while(cursor<source.length){
    while(/\s/.test(source[cursor]??'')&&cursor<source.length)cursor++;
    if(cursor===source.length)break;
    const open=source.indexOf('{',cursor);assert.ok(open>cursor);
    assert.match(source.slice(cursor,open).trim(),/^@scope \((?::root|\[data-qxframe9a7c2-style="(?:maia|mira|luma|sera|lyra|rhea|nova)"\])\)$/,'No ungated top-level rules in the canonical Theme system');
    let depth=1,end=open+1;for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
    assert.equal(depth,0);cursor=end;scopes++;
  }
  assert.equal(scopes,8);
  assert.doesNotMatch(source,/(?:^|[;{}])\s*(?:background(?:-color)?|color|border-color)\s*:\s*(?:#|rgba?\(|oklch\()/,'Consumer colors must come from Theme roles');
  return {source,expressions,sourceSha:fixture.sha,canonical:true};
}
