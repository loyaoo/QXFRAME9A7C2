import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export const V2_STYLE_MODULE = 'src/styles/main/theme-visual-v2.css';
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
  // createApp v3: theme inputs are the closed --qxframe9a7c2-theme-* list; style-specific fills
  // are compiled into tokens, so only the shared (style-independent) formulas remain here.
  const p='--qxframe9a7c2-theme-',t='--_qxframe9a7c2-v2-type';
  const allowed=new Set();
  const alpha=(name,weights)=>weights.forEach(n=>allowed.add('color-mix(inoklab,var('+name+')'+n+'%,transparent)'));
  alpha(t,[10,20,30,40,70,80,90]);alpha(p+'muted',[50]);alpha(p+'destructive',[10,20,50]);
  alpha(p+'primary',[10,20,30,80]);alpha(p+'ring',[50]);alpha(p+'success',[10,20]);alpha(p+'info',[10,20]);alpha(p+'warning',[20]);
  allowed.add('color-mix(inoklch,var('+p+'secondary)95%,var('+p+'foreground)5%)');
  const fill='var('+p+'radio-fill)';
  allowed.add('color-mix(inoklab,var('+t+',var('+p+'primary))'+fill+',transparent)');
  allowed.add('color-mix(inoklab,var('+t+',var('+p+'primary))'+fill+',var('+p+'foreground))');
  allowed.add('color-mix(inoklab,var('+t+'-foreground,var('+p+'primary-foreground))'+fill+',var('+p+'foreground))');
  const expressions=[];
  for(let start=source.indexOf('color-mix(');start>=0;start=source.indexOf('color-mix(',start+1)){
    let end=start+'color-mix('.length,depth=1;for(;end<source.length&&depth;end++){if(source[end]==='(')depth++;if(source[end]===')')depth--;}
    assert.equal(depth,0,'Unclosed color-mix expression');
    const expression=source.slice(start,end).replace(/\s+/g,'');
    assert.ok(allowed.has(expression),'Unmapped or modified source formula: '+expression);expressions.push(expression);
  }
  assert.ok(expressions.length>0);
  assert.doesNotMatch(source,/var\(\s*--qxframe9a7c2-palette-|rgb\(\s*var\(|--qxframe9a7c2-theme-v2-|@layer|:is\(|:where\(|display\s*:\s*grid|\d(?:vw|vh|fr)\b/);
  // v3 §5.4: no style selectors at runtime; top-level rules are :root / .dark base rules and one @scope (:root).
  assert.doesNotMatch(source,/data-qxframe9a7c2-style/,'Styles must not appear at runtime');
  let cursor=0,scopes=0;
  while(cursor<source.length){
    while(/\s/.test(source[cursor]??'')&&cursor<source.length)cursor++;
    if(cursor===source.length)break;
    const open=source.indexOf('{',cursor);assert.ok(open>cursor);
    const prelude=source.slice(cursor,open).trim();
    assert.match(prelude,/^(?:@scope \(:root\)|:root|\.dark)$/,'No ungated top-level rules in the canonical Theme system: '+prelude);
    let depth=1,end=open+1;for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
    assert.equal(depth,0);cursor=end;if(prelude.startsWith('@scope'))scopes++;
  }
  assert.equal(scopes,1);
  assert.doesNotMatch(source,/(?:^|[;{}])\s*(?:background(?:-color)?|color|border-color)\s*:\s*(?:#|rgba?\(|oklch\()/,'Consumer colors must come from Theme roles');
  return {source,expressions,sourceSha:fixture.sha,canonical:true};
}
