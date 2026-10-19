import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const V2_STYLE_MODULE = 'src/styles/main/semantic-cascade.css';
export const SEMANTIC_RULE_MODULES=Object.freeze([ 'src/styles/main/semantic-cascade.css', 'src/styles/components/semantic-status-modifiers.css', 'src/styles/components/feedback-theme-states.css', 'src/styles/components/data-control-states.css', 'src/styles/components/input-action-states.css', 'src/styles/components/overlay-picker-states.css', 'src/styles/components/menu-selection-states.css', 'src/styles/components/component-sizing.css' ]);
export function readSemanticRuleSource(root){return SEMANTIC_RULE_MODULES.map(rel=>fs.readFileSync(path.join(root,rel),'utf8')).join('\n');}
export function verifySemanticRuleSource(root,{sourceText=null}={}){
  const source=(sourceText??readSemanticRuleSource(root)).replace(/\/\*[\s\S]*?\*\//g,'');
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
  const p='--qxframe9a7c2-theme-',t='--_qxframe9a7c2-type';
  const allowed=new Set();
  const alpha=(name,weights)=>weights.forEach(n=>allowed.add('color-mix(inoklab,var('+name+')'+n+'%,transparent)'));
  alpha(t,[10,20,30,40,70,80,90]);alpha(p+'muted',[50]);alpha(p+'destructive',[10,20,50]);
  alpha(p+'primary',[10,20,30,80]);alpha(p+'pointer-focus',[50]);alpha(p+'success',[10,20]);alpha(p+'info',[10,20]);alpha(p+'warning',[20]);
  allowed.add('color-mix(inoklch,var('+p+'secondary)95%,var('+p+'foreground)5%)');
  // Shared Menu state overlays are alpha-composited on whichever Popup
  // surface the generator emits (opaque or translucent); no mode-specific skins.
  alpha(p+'menu-foreground',[12,26]);alpha(p+'menu-accent',[84]);
  // QX base-neutral hover: the user's neutral base (Mist/Olive/Mauve/etc.),
  // not saturated Theme Primary, supplies shared Calendar/Item/Menu tint.
  // Register exactly these three neutral formulas, not arbitrary CSS mixes.
  const baseHover='color-mix(inoklab,var('+p+'muted)78%,var('+p+'muted-foreground))';
  allowed.add(baseHover);
  allowed.add('color-mix(inoklab,var('+p+'muted)65%,var('+p+'muted-foreground))');
  allowed.add('color-mix(inoklab,'+baseHover+'70%,transparent)');
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
  const permittedTopLevel=new Set([
    '@scope (:root)', ':root', '.dark', '* *', '* *[class*="qxframe9a7c2-"][class]',
    '.qxframe9a7c2-popup-surface:not(.qxframe9a7c2-popover-container), .qxframe9a7c2-menu-submenu-panel, .qxframe9a7c2-menu-overflow-panel'
  ]);
  // R5 scoped-role migration: only these 153 B0-reviewed qualified selectors
  // may appear at the top level, and only in this exact source order.
  // The hash freezes the full selector list; unforeseen new top-level CSS
  // remains a hard failure, not an open-ended relaxation of the gate.
  const approvedUnscopedPreludesHash='3378a85bbad1acca5f23029e692c353e528ac79d6fbb478702b016492473fe7d';
  const unscopedPreludes=[];
  let cursor=0,scopes=0;
  while(cursor<source.length){
    while(/\s/.test(source[cursor]??'')&&cursor<source.length)cursor++;
    if(cursor===source.length)break;
    const open=source.indexOf('{',cursor);assert.ok(open>cursor);
    const prelude=source.slice(cursor,open).trim();
    if(!permittedTopLevel.has(prelude)) unscopedPreludes.push(prelude);
    let depth=1,end=open+1;for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
    assert.equal(depth,0);cursor=end;if(prelude.startsWith('@scope'))scopes++;
  }
  assert.equal(scopes,1);
  // A real owner-retirement gate: the remaining root scope contains exactly
  // 39 qualified rules after deleting eight proven duplicate component
  // painters. This does NOT broaden the 153 plain-selector whitelist.
  const scopePrelude=source.indexOf('@scope (:root)');
  const scopeOpen=source.indexOf('{',scopePrelude);
  assert.ok(scopePrelude>=0 && scopeOpen>scopePrelude);
  let scopeDepth=1,scopeEnd=scopeOpen+1;
  for(;scopeEnd<source.length && scopeDepth;scopeEnd++){
    if(source[scopeEnd]==='{')scopeDepth++;
    if(source[scopeEnd]==='}')scopeDepth--;
  }
  assert.equal(scopeDepth,0,'Core root scope must be balanced');
  const scopedBodies=[...source.slice(scopeOpen+1,scopeEnd-1).matchAll(/[^{}]+\{[^{}]*\}/g)];
  assert.equal(scopedBodies.length,17,'Root scope retains exactly 17 precedence-sensitive owners');
  // Four owner closures have exact selectors and Theme expressions in their
  // late, domain-specific files. No arbitrary unscoped core exceptions.
  const lateTag=fs.readFileSync(path.join(root,'src/styles/components/feedback-theme-states.css'),'utf8').replace(/\\s+/g,'');
  assert.ok(lateTag.includes('.qxframe9a7c2-tag{background-color:var(--qxframe9a7c2-theme-secondary);color:var(--qxframe9a7c2-theme-secondary-foreground);border-color:transparent;}'),'Tag default must retain neutral Theme paint');
  assert.ok(lateTag.includes('.qxframe9a7c2-tags.is-variant-solid.qxframe9a7c2-tag,.qxframe9a7c2-badge.is-solid{background-color:var(--_qxframe9a7c2-type);color:var(--_qxframe9a7c2-type-foreground);}'),'Tag solid type/foreground must retain the original recipe');
  const lateTable=fs.readFileSync(path.join(root,'src/styles/components/data-control-states.css'),'utf8').replace(/\\s+/g,'');
  assert.ok(lateTable.includes('.qxframe9a7c2-table,.qxframe9a7c2-table-wrap{background-color:var(--qxframe9a7c2-theme-background);color:var(--qxframe9a7c2-theme-foreground);border-color:var(--qxframe9a7c2-theme-border);}'),'Table surface must retain Theme-owned background/foreground/edge');
  const lateAction=fs.readFileSync(path.join(root,'src/styles/components/input-action-states.css'),'utf8').replace(/\\s+/g,'');
  assert.ok(lateAction.includes('.qxframe9a7c2-button.is-filled{--_qxframe9a7c2-button-focus-border:color-mix(inoklab,var(--_qxframe9a7c2-type)40%,transparent);}'),'Filled Button focus border alpha must be unchanged');
  // Zero-specificity root-excluding projection of the original 62 semantic roles.
  const descendantRoles=source.match(/\*\s+\*\s*\{([^{}]+)\}/);
  assert.ok(descendantRoles,'Descendant semantic roles must exist outside root scope');
  assert.equal((descendantRoles[1].match(/--_qxframe9a7c2-[\w-]+\s*:/g)||[]).length,62);
  assert.equal(createHash('sha256').update(descendantRoles[1].replace(/\s+/g,'')).digest('hex'),
    'ad84c66458f5556bd0c06394784b40d4d6751b2d93e49a1d72c2538ab8b766c2',
    'All 62 original semantic role formulae must remain exact');
  // This is an exact, root-excluding generic Type projection. Require all
  // thirteen original variable formulas rather than treating a new plain
  // selector as an unrestricted source exception.
  const genericRoles=source.match(/\* \*\[class\*="qxframe9a7c2-"\]\[class\]\s*\{([^{}]+)\}/);
  assert.ok(genericRoles,'Descendant Type mapping requires its exact root-excluding owner');
  assert.equal((genericRoles[1].match(/--_qxframe9a7c2-[\w-]+\s*:/g)||[]).length,13);
  assert.equal(createHash('sha256').update(genericRoles[1].replace(/\s+/g,'')).digest('hex'),
    '1ec4ab33cb54965e45a5ab6eb8057e75d12c64fb9a24f19596f535fa427e4f0f',
    'All thirteen original generic Type formulae must remain exact');
  // Component-sizing now partitions the former shared default declaration:
  // its six actual Control owners are late Theme-driven, while the OTHER 47
  // framework sizing roots still retain precisely the B0 1px default.
  // This is ONE named and fingerprinted owner, not a general exception.
  const separateDefaultHash='d5d0ff9ea95673a8f5ccc87b7061a568060153e9360150872a6f4142e60ba222';
  const normalizedPrelude=s=>s.replace(/\s+/g,'');
  const isSizedDefault=prelude=>createHash('sha256').update(normalizedPrelude(prelude)).digest('hex')===separateDefaultHash;
  const partitioned=unscopedPreludes.filter(isSizedDefault);
  assert.equal(partitioned.length,1,'Exactly one B0-preserving 47-selector default-border-width owner');
  assert.equal(partitioned[0].split(',').length,47,'Only non-Control roots share default border-width');
  const sizingSource=fs.readFileSync(path.join(root,'src/styles/components/component-sizing.css'),'utf8');
  const onePixelOwners=[...sizingSource.matchAll(/([^{}]+)\{\s*--_qxframe9a7c2-control-border-width:\s*1px;\s*\}/g)]
    .filter(x=>isSizedDefault(x[1].trim()));
  assert.equal(onePixelOwners.length,1,'All 47 non-Control defaults must retain the exact 1px declaration');
  // Exactly three former B0 scoped roles are now authored in their late
  // actual component families. Their SELECTORS are frozen here; this does
  // not open the original 153-selector hash to arbitrary additional CSS.
  const approvedOwnerSelectorKeys=new Set([
    '.qxframe9a7c2-notification-root',
    '.qxframe9a7c2-menu',
    '.qxframe9a7c2-input.is-textarea',
    '.qxframe9a7c2-menu-item.is-danger.is-disabled,.qxframe9a7c2-menu-item.is-danger:disabled,.qxframe9a7c2-menu-item.is-disabled,.qxframe9a7c2-menu-item:disabled,.qxframe9a7c2-menu.is-disabled.qxframe9a7c2-menu-item'
  ]);
  const compactOwnerSelector=s=>s.replace(/\s+/g,'');
  const transferredOwners=unscopedPreludes.filter(x=>approvedOwnerSelectorKeys.has(compactOwnerSelector(x)));
  assert.equal(transferredOwners.length,4,'Only the four exact transferred component selectors are newly permitted');
  const noticeOwner=fs.readFileSync(path.join(root,'src/styles/components/feedback-theme-states.css'),'utf8');
  const menuOwner=fs.readFileSync(path.join(root,'src/styles/components/menu-selection-states.css'),'utf8');
  assert.match(noticeOwner,/\.qxframe9a7c2-notification-root\s*\{\s*background-color:\s*var\(--qxframe9a7c2-theme-card\);\s*color:\s*var\(--_qxframe9a7c2-type\);\s*border-color:\s*var\(--qxframe9a7c2-theme-card-edge\);\s*\}/,'Notification keeps B0 exact final Theme surface');
  assert.match(menuOwner,/\.qxframe9a7c2-menu\s*\{\s*background-color:\s*var\(--qxframe9a7c2-theme-sidebar,\s*var\(--qxframe9a7c2-theme-background\)\);\s*color:\s*var\(--qxframe9a7c2-theme-sidebar-foreground,\s*var\(--qxframe9a7c2-theme-foreground\)\);\s*\}/,'Menu final surface must keep B0 Theme fallbacks');
  assert.match(menuOwner,/\.qxframe9a7c2-menu-item\.is-danger\.is-disabled[^{}]*\{\s*--_qxframe9a7c2-menu-item-bg:\s*transparent;\s*--_qxframe9a7c2-navigation-text:\s*inherit;\s*opacity:\s*\.5;\s*\}/,'Menu disabled must keep all three original declarations');
  // Final Textarea padding is the fourth transferred owner and must stay
  // AFTER shared Control geometry so multiline padding remains exactly zero.
  const sizingOwner=fs.readFileSync(path.join(root,'src/styles/components/component-sizing.css'),'utf8');
  assert.ok(sizingOwner.replace(/\s+/g,'').includes('.qxframe9a7c2-input.is-textarea{padding:0}'),
    'Textarea zero padding must be owned by final Control sizing');
  const nativeInputSource=fs.readFileSync(path.join(root,'src/styles/components/native-input.css'),'utf8');
  assert.doesNotMatch(nativeInputSource,/\.qxframe9a7c2-input\.is-textarea\{[^{}]*padding\s*:/,
    'Textarea zero padding must not be duplicated by early native input');
  const originalConsumers=unscopedPreludes.filter(x=>!isSizedDefault(x) && !approvedOwnerSelectorKeys.has(compactOwnerSelector(x)));
  assert.equal(originalConsumers.length,153,'No unexpected or missing B0-approved unscoped rules');
  assert.equal(createHash('sha256').update(originalConsumers.join('\n')).digest('hex'),approvedUnscopedPreludesHash,'The original 153 B0-owned selector list and order must stay frozen');
  assert.doesNotMatch(source,/(?:^|[;{}])\s*(?:background(?:-color)?|color|border-color)\s*:\s*(?:#|rgba?\(|oklch\()/,'Consumer colors must come from Theme roles');
  return {source,expressions,sourceSha:fixture.sha,canonical:true};
}
