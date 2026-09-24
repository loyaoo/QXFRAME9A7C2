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
}
const timeSource=fs.readFileSync(path.join(root,'src/components/time-panel.js'),'utf8');
assert.ok(/FocusController\.create\s*\(/.test(timeSource),'TimePanel must own its canonical real-focus host through FocusController.');
assert.ok(/wheel\.bindVirtualFocus\(focusController\.virtualFocus, true\)/.test(timeSource),'TimePanel must host WheelPanel virtual focus on the TimePanel real-focus owner.');
assert.ok(/focus: function \(\) \{ return focusController \? focusController\.focus\(\) : false; \}/.test(timeSource),'TimePanel public focus must target its canonical root.');
assert.ok(!/focus: function \(\) \{ return wheel && wheel\.focus/.test(timeSource),'TimePanel must not delegate real focus to the inner WheelPanel root.');

console.log(JSON.stringify({
  ok:true,
  owner:'FocusController',
  delegates:['FocusManager','FocusScope','KeyboardRegion','KeyboardNavigation.virtualFocus'],
  firstPack:['WheelPanel','TimePanel','Calendar','PeriodPanel'],
  timePanelRealFocusOwner:'TimePanel.root'
}));
