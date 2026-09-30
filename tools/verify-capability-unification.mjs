import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');

const popup=read('src/components/popup.js');
assert.match(popup,/function createPopupFrame/,'PopupFrame must be the canonical popup Scroll/surface resource owner.');
assert.match(popup,/Trigger\.create\s*\(/,'PopupRuntime must be the sole component-level physical Trigger construction path.');
assert.match(popup,/Scroll\.attachViewport\s*\(/,'PopupFrame must own attached popup viewports.');
assert.match(popup,/Scroll\.create\s*\(/,'PopupFrame must own constructed popup Scroll surfaces.');

for(const rel of [
  'src/components/select.js','src/components/autocomplete.js','src/components/tree-select.js','src/components/cascader.js',
  'src/components/dropdown.js','src/components/menu.js','src/components/table.js','src/components/tooltip.js',
  'src/components/popover.js','src/components/popup-field.js','src/components/picker-field.js'
]){
  const source=read(rel);
  assert.doesNotMatch(source,/Trigger\.create\s*\(/,rel+' must not bypass PopupRuntime with direct Trigger creation.');
}

const select=read('src/components/select.js');
const autocomplete=read('src/components/autocomplete.js');
const treeSelect=read('src/components/tree-select.js');
const cascader=read('src/components/cascader.js');
for(const [name,source] of [['Select',select],['Autocomplete',autocomplete],['TreeSelect',treeSelect],['Cascader',cascader]]){
  assert.match(source,/setupPopupFrame\s*\(/,name+' must acquire its popup resource owner from PopupFieldComponent.');
  assert.doesNotMatch(source,/\bScroll\.(?:create|attachViewport)\s*\(/,name+' must not create popup Scroll directly.');
}
assert.match(cascader,/popupFrame\.attachViewport\s*\(/,'Cascader popup columns must be PopupFrame-owned.');

const dropdown=read('src/components/dropdown.js');
assert.match(dropdown,/PopupRuntime\.create\s*\(/,'Dropdown root/submenu surfaces must enter PopupRuntime.');
assert.match(dropdown,/PopupFrame\.create\s*\(/,'Dropdown recursive submenu surfaces must own PopupFrame resources.');
assert.doesNotMatch(dropdown,/\bScroll\.(?:create|attachViewport)\s*\(/,'Dropdown must not own popup Scroll directly.');

const menu=read('src/components/menu.js');
assert.match(menu,/PopupRuntime\.create\s*\(/,'Menu submenu/overflow surfaces must enter PopupRuntime.');
assert.match(menu,/PopupFrame\.create\s*\(/,'Menu submenu/overflow surfaces must own PopupFrame resources.');
assert.match(menu,/rootScroll = Scroll\.attachViewport\s*\(/,'Menu root list remains an intentional non-popup Scroll owner.');

const table=read('src/components/table.js');
assert.match(table,/filterPopupFrame = PopupFrame\.create\s*\(/,'Table filter popup must own PopupFrame.');
assert.match(table,/filterScroll = filterPopupFrame\.attachViewport\s*\(/,'Table filter Scroll must be PopupFrame-owned.');
assert.match(table,/scrollSurface = Scroll\.attachViewport\s*\(/,'Table main viewport remains an intentional non-popup Scroll owner.');

const tags=read('src/components/tags.js');
assert.match(tags,/overflowPopover\.getPopupFrame\(\)\.createScroll\s*\(/,'Tags overflow Scroll must be owned by Popover PopupFrame.');
assert.match(tags,/containerScroll = Scroll\.create\s*\(/,'Tags scroll mode remains an intentional non-popup Scroll owner.');
assert.doesNotMatch(tags,/overflowScroll\s*=\s*Scroll\.create/,'Tags overflow popup must not create Scroll directly.');

const tabs=read('src/components/tabs.js');
assert.match(tabs,/overflowPopover\.getPopupFrame\(\)\.createScroll\s*\(/,'Tabs overflow Scroll must be owned by Popover PopupFrame.');
assert.match(tabs,/scroll = Scroll\.create\s*\(/,'Tabs main navigation remains an intentional non-popup Scroll owner.');

const datePicker=read('src/components/date-picker.js');
assert.match(datePicker,/selectionScroll = popupFrame\.attachViewport\s*\(/,'DatePicker selection strip must be PopupFrame-owned.');
assert.match(datePicker,/presetsScroll = popupFrame\.attachViewport\s*\(/,'DatePicker preset strip must be PopupFrame-owned.');
assert.doesNotMatch(datePicker,/\bScroll\.(?:create|attachViewport)\s*\(/,'DatePicker must not create popup Scroll directly.');

const tooltip=read('src/components/tooltip.js');
assert.match(tooltip,/PopupRuntime\.create\s*\(/,'Tooltip physical singleton/independent overlays must enter PopupRuntime.');
assert.match(tooltip,/PopupFrame\.create\s*\(/,'Tooltip singleton physical surface must share one PopupFrame.');

const tree=read('src/components/tree.js');
const reorder=read('src/core/reorderInteraction.js');
assert.match(tree,/ReorderInteraction\.create\s*\(/,'Tree drag/drop must consume ReorderInteraction.');
assert.doesNotMatch(tree,/\bdragSession\b/,'Tree must not retain a second drag-session truth.');
assert.doesNotMatch(tree,/DOM\.listen\(root,\s*['"](?:dragstart|dragover|drop|dragend)['"]/,'Tree must not retain a second raw drag lifecycle.');
assert.match(reorder,/typeof source\.resolveDrop === 'function'/,'ReorderInteraction must support hierarchical domain drop resolution.');
assert.doesNotMatch(reorder,/Tree|tree-select|TreeSelect/,'ReorderInteraction must stay component-name agnostic.');

const modal=read('src/components/modal.js');
const drawer=read('src/components/drawer.js');
const frame=read('src/components/overlay-frame-runtime.js');
for(const [name,source] of [['Modal',modal],['Drawer',drawer]]){
  assert.match(source,/OverlayFrameRuntime\.create\s*\(/,name+' must consume shared OverlayFrameRuntime.');
  assert.doesNotMatch(source,/OverlayController\.create\s*\(/,name+' must not create component-local overlay resources.');
  assert.doesNotMatch(source,/OverlayFrameShell\.create\s*\(/,name+' must not create component-local frame shells.');
  assert.doesNotMatch(source,/PopupSurface\.create\s*\(/,name+' must not create component-local popup surfaces.');
  assert.doesNotMatch(source,/Scroll\.create\s*\(/,name+' must not create component-local body Scroll.');
}
assert.match(frame,/OverlayController\.create\s*\(/,'OverlayFrameRuntime must own OverlayController.');
assert.match(frame,/OverlayFrameShell\.create\s*\(/,'OverlayFrameRuntime must own OverlayFrameShell.');
assert.match(frame,/PopupSurface\.create\s*\(/,'OverlayFrameRuntime must own PopupSurface.');
assert.match(frame,/Scroll\.create\s*\(/,'OverlayFrameRuntime must own body Scroll.');

console.log(JSON.stringify({
  ok:true,
  popupPhysicalOwner:'PopupRuntime→Trigger',
  popupResourceOwner:'PopupFrame',
  treeReorderOwner:'ReorderInteraction',
  overlayFrameOwner:'OverlayFrameRuntime'
}));
