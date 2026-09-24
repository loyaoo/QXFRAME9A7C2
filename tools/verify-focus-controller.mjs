import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FocusController } from '../src/core/focusController.js';
import { FocusManager } from '../src/core/focusManager.js';
import { FocusScope } from '../src/core/focusScope.js';
import { KeyboardRegion } from '../src/core/keyboardRegion.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

assert.equal(FocusController.bindVirtualFocus,KeyboardRegion.bindVirtualFocus,'FocusController must reuse KeyboardRegion virtual-focus binding.');
assert.equal(FocusController.forwardHandlers,KeyboardRegion.forwardHandlers,'FocusController must reuse KeyboardRegion key forwarding.');
assert.equal(FocusController.createManager,FocusManager.create,'FocusController must reuse FocusManager.');
assert.equal(FocusController.createScope,FocusScope.create,'FocusController must reuse FocusScope.');

const controllerSource=fs.readFileSync(path.join(root,'src/core/focusController.js'),'utf8');
assert.ok(/KeyboardRegion\.create\(settings\)/.test(controllerSource),'FocusController must compose the canonical KeyboardRegion.');
assert.ok(!/addEventListener\s*\(/.test(controllerSource),'FocusController must not add a parallel DOM event routing layer.');
assert.ok(!/registerDomain\s*\(/.test(controllerSource),'FocusController must not implement a second virtual-focus domain engine.');

for(const file of ['wheel-panel.js','calendar.js','period-panel.js']){
  const source=fs.readFileSync(path.join(root,'src/components',file),'utf8');
  assert.ok(/focusController\.js/.test(source),file+' must enter focus authority through FocusController.');
  assert.ok(!/keyboardRegion\.js/.test(source),file+' must not import KeyboardRegion directly after Phase C migration.');
  assert.ok(!/\.registerDomain\s*\(/.test(source),file+' must delegate virtual-domain binding through FocusController instead of recreating the binding lifecycle.');
}
for(const file of ['select.js','tree-select.js','cascader.js']){
  const source=fs.readFileSync(path.join(root,'src/components',file),'utf8');
  assert.ok(/focusController\.js/.test(source),file+' must enter editable host focus through FocusController.');
  assert.ok(/FocusController\.create\s*\(/.test(source),file+' must create its canonical editable focus host through FocusController.');
  assert.ok(!/KeyboardNavigation\.create\s*\(/.test(source),file+' must not keep a parallel outer KeyboardNavigation owner.');
  assert.ok(/focus:\s*'FocusController'/.test(source),file+' ComponentProfile must declare FocusController ownership.');
  assert.ok(/focusController\s*=\s*null/.test(source),file+' must declare its FocusController runtime owner.');
  assert.ok(/manageTabIndex:\s*false/.test(source),file+' editable host tabindex must remain owned by the existing Control/Field layer.');
}
for(const file of ['menu.js','tags.js']){
  const source=fs.readFileSync(path.join(root,'src/components',file),'utf8');
  assert.ok(/focusController\.js/.test(source),file+' must enter standalone composite focus through FocusController.');
  assert.ok(/FocusController\.create\s*\(/.test(source),file+' must create its canonical composite focus owner through FocusController.');
  assert.ok(!/keyboardRegion\.js/.test(source),file+' must not import KeyboardRegion directly after Phase C migration.');
  assert.ok(/focus:\s*'FocusController'/.test(source),file+' ComponentProfile must declare FocusController ownership.');
}
const menuSource=fs.readFileSync(path.join(root,'src/components/menu.js'),'utf8');
assert.ok(!/\.registerDomain\s*\(/.test(menuSource),'Menu must use FocusController canonical virtual-domain binding instead of registering its domain directly.');
assert.ok(/activeRegion:\s*'menu'/.test(menuSource),'Menu must declare the menu focus region.');
const tagsSource=fs.readFileSync(path.join(root,'src/components/tags.js'),'utf8');
assert.ok(/activeRegion:\s*'tags'/.test(tagsSource),'Tags must declare the tags focus region.');
assert.ok(/focusController\.beginEdit\(input/.test(tagsSource),'Tags standalone add editor must acquire a FocusController edit lease.');
assert.ok(/editLeaseActive/.test(tagsSource),'Tags render state must release the FocusController edit lease when add editing ends.');
const tableSource=fs.readFileSync(path.join(root,'src/components/table.js'),'utf8');
assert.ok(/focusController\.js/.test(tableSource),'Table must enter navigation focus through FocusController.');
assert.ok(/FocusController\.create\s*\(/.test(tableSource),'Table must create its root keyboard owner through FocusController.');
assert.ok(!/KeyboardNavigation\.create\s*\(/.test(tableSource),'Table must not keep a parallel root KeyboardNavigation owner.');
assert.ok(!/\.registerDomain\s*\(/.test(tableSource),'Table cell/header domains must bind through FocusController canonical binding.');
assert.ok(/focus:\s*'FocusController'/.test(tableSource),'Table ComponentProfile must declare FocusController ownership.');
assert.ok(/focusController\.beginEdit\(target/.test(tableSource),'Table Hybrid Edit must acquire a FocusController edit lease.');
assert.ok(/focusController\.endEdit/.test(tableSource),'Table Hybrid Edit must release its FocusController edit lease.');
assert.ok(/activeRegion:\s*'cells'/.test(tableSource),'Table FocusController must start in the cells region.');
assert.ok(/setActiveRegion\('header'/.test(tableSource),'Table header navigation must publish the header region.');
assert.ok(/setActiveRegion\('cells'/.test(tableSource),'Table cell navigation must publish the cells region.');
const timeSource=fs.readFileSync(path.join(root,'src/components/time-panel.js'),'utf8');
assert.ok(/FocusController\.create\s*\(/.test(timeSource),'TimePanel must own its canonical real-focus host through FocusController.');
assert.ok(/var focusController\s*=\s*null/.test(timeSource),'TimePanel must declare its FocusController runtime owner before mount.');
assert.ok(/activeRegion:\s*'column'/.test(timeSource),'TimePanel FocusController must declare the canonical column focus region.');
assert.ok(/wheel\.bindVirtualFocus\(focusController\.virtualFocus, true\)/.test(timeSource),'TimePanel must host WheelPanel virtual focus on the TimePanel real-focus owner.');
assert.ok(/focus: function \(\) \{ return focusController \? focusController\.focus\(\) : false; \}/.test(timeSource),'TimePanel public focus must target its canonical root.');
assert.ok(!/focus: function \(\) \{ return wheel && wheel\.focus/.test(timeSource),'TimePanel must not delegate real focus to the inner WheelPanel root.');

console.log(JSON.stringify({
  ok:true,
  owner:'FocusController',
  delegates:['FocusManager','FocusScope','KeyboardRegion','KeyboardNavigation.virtualFocus'],
  firstPack:['WheelPanel','TimePanel','Calendar','PeriodPanel'],
  popupHostedPack:['Select','TreeSelect','Cascader'],
  standalonePack:['Menu','Tags'],
  hybridEditPack:['Table'],
  timePanelRealFocusOwner:'TimePanel.root'
}));
