import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Sort } from '../src/components/sort.js';
import { Tabs } from '../src/components/tabs.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const sortSource=read('src/components/sort.js');
const tabsSource=read('src/components/tabs.js');
const reorderSource=read('src/core/reorderInteraction.js');
const transitionGroupSource=read('src/core/transitionGroup.js');
const transitionSource=read('src/core/transition.js');

function assertProfile(type,name,owners){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),owners.slice().sort(),name+' ownership must exactly match the handbook target.');
  owners.forEach(capability=>{
    const controller=capability[0].toUpperCase()+capability.slice(1)+'Controller';
    assert.equal(profile.ownership[capability],controller,name+' '+capability+' owner mismatch.');
  });
  return profile;
}

assertProfile(Sort,'Sort',['value','focus','interaction','capability','motion','selection','overlay']);
assert.match(sortSource,/ValueController\.create\s*\(/,'Sort order must enter ValueController.');
assert.match(sortSource,/FocusController\.create\s*\(/,'Sort row focus must enter FocusController.');
assert.match(sortSource,/InteractionController\.create\s*\(/,'Sort key semantics must enter InteractionController.');
assert.match(sortSource,/CapabilityController\.create\s*\(/,'Sort mutation/navigation gates must enter CapabilityController.');
assert.match(sortSource,/SelectionController\.create\s*\(/,'Sort active row/drag projection must enter SelectionController.');
assert.match(sortSource,/interactionController\.dispatch\s*\(/,'Sort keydown must dispatch through InteractionController.');
assert.match(sortSource,/valueController\.setValue\s*\(/,'Sort committed order must be written to ValueController.');
assert.match(sortSource,/valueController\.syncExternal\s*\(/,'Sort option item changes must synchronize ValueController externally.');
assert.match(reorderSource,/OverlayController\.createLayerLease\s*\(/,'Reorder drag ghost must enter OverlayController.');
assert.doesNotMatch(reorderSource,/\bLayerManager\b/,'ReorderInteraction must not bypass OverlayController with LayerManager.');
assert.match(transitionGroupSource,/MotionController\.create\s*\(/,'Sort TransitionGroup motion must enter MotionController.');
assert.doesNotMatch(sortSource,/delegation\.on\('keydown'[\s\S]{0,900}event\.preventDefault\(\)/,'Sort component must not retain a parallel direct keyboard semantic owner.');

assertProfile(Tabs,'Tabs',['value','focus','interaction','capability','motion','selection','overlay']);
assert.match(tabsSource,/ValueController\.create\s*\(/,'Tabs activeKey must enter ValueController.');
assert.match(tabsSource,/SelectionController\.create\s*\(/,'Tabs active selection must enter SelectionController.');
assert.match(tabsSource,/FocusController\.create\s*\(/,'Tabs focus region must enter FocusController.');
assert.match(tabsSource,/InteractionController\.create\s*\(/,'Tabs semantic keys must enter InteractionController.');
assert.match(tabsSource,/CapabilityController\.create\s*\(/,'Tabs activation/edit policy must enter CapabilityController.');
assert.match(tabsSource,/interactionController\.registerScope\s*\(/,'Tabs must register one InteractionController keyboard scope.');
assert.match(tabsSource,/interactionController\.dispatch\s*\(/,'Tabs keydown must dispatch through InteractionController.');
assert.doesNotMatch(tabsSource,/import \{ KeyboardNavigation \}/,'Tabs must not retain a direct KeyboardNavigation owner after InteractionController migration.');
assert.match(tabsSource,/valueController\.syncExternal\s*\(/,'Tabs external activeKey options must synchronize ValueController.');
assert.match(tabsSource,/selectionController\.selected\.replace\s*\(/,'Tabs SelectionController must project committed activeKey.');
assert.match(transitionSource,/MotionController\.create\s*\(/,'Tabs panel Transition must enter MotionController.');
assert.match(tabsSource,/Popover\.create\s*\(/,'Tabs overflow overlay must reuse Popover→Trigger→OverlayController.');
assert.match(tabsSource,/getOverlayController:[\s\S]{0,280}getTrigger[\s\S]{0,180}getOverlayController/,'Tabs must expose the delegated overflow OverlayController.');
assert.doesNotMatch(tabsSource,/\n\s*activeKey\s*=\s*key\s*;/,'Tabs must not write committed activeKey outside ValueController.');

console.log(JSON.stringify({
  ok:true,
  components:['Sort','Tabs'],
  sort:['ValueController','FocusController','InteractionController','CapabilityController','MotionController','SelectionController','OverlayController'],
  tabs:['ValueController','FocusController','InteractionController','CapabilityController','MotionController','SelectionController','OverlayController']
}));
