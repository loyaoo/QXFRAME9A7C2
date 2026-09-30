import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Carousel } from '../src/components/carousel.js';
import { Scroll } from '../src/components/scroll.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
function exactProfile(type,name,owners){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  const expected=Object.fromEntries(owners.map(owner=>[owner.replace('Controller','').replace(/^./,c=>c.toLowerCase()),owner]));
  assert.deepEqual(Object.keys(profile.ownership).sort(),Object.keys(expected).sort());
  Object.keys(expected).forEach(capability=>{
    assert.equal(profile.ownership[capability],expected[capability],name+' '+capability+' owner mismatch');
  });
}

exactProfile(Carousel,'Carousel',['ValueController','FocusController','InteractionController','CapabilityController','MotionController']);
exactProfile(Scroll,'Scroll',['FocusController','InteractionController','CapabilityController','MotionController']);

const carousel=read('src/components/carousel.js');
const scroll=read('src/components/scroll.js');
const wheelPanel=read('src/components/wheel-panel.js');
const itemCollection=read('src/components/item-collection.js');
const virtualList=read('src/components/virtual-list.js');
const menu=read('src/components/menu.js');
const table=read('src/components/table.js');
const cascader=read('src/components/cascader.js');
const datePicker=read('src/components/date-picker.js');
const transfer=read('src/components/transfer.js');
const sort=read('src/components/sort.js');
const upload=read('src/components/upload.js');
const css=read('src/qxframe9a7c2.css');
assert.match(carousel,/ValueController\.createValueBinding\s*\(/);
assert.match(carousel,/FocusController\.create\s*\(/);
assert.match(carousel,/InteractionController\.create\s*\(/);
assert.match(carousel,/CapabilityController\.create\s*\(/);
assert.match(carousel,/MotionController\.waitMotionEnd\s*\(/);
assert.match(carousel,/interactionController\.dispatch\s*\(/);
assert.match(carousel,/capabilityController\.can\('navigate'\)/);
assert.match(carousel,/root\.tabIndex = -1;/,'Carousel root must not compete with the active slide for Tab ownership.');
assert.match(carousel,/slide\.tabIndex = active && opts\.keyboard !== false && opts\.disabled !== true \? 0 : -1;/,'Only the active Carousel slide outer may enter Tab order.');
assert.match(carousel,/dot\.tabIndex = -1;/,'Carousel dots must stay out of Tab order.');
assert.match(carousel,/prev\.tabIndex = -1;[\s\S]*next\.tabIndex = -1;/,'Carousel arrow controls must stay out of Tab order.');
assert.match(carousel,/focusActiveSlide\('carousel-keyboard-switch'\)/,'Carousel keyboard switching must move real focus to the new active slide.');
assert.match(css,/\.qxframe9a7c2-carousel-slide:focus-visible\{outline:var\(--_qxframe9a7c2-focus-visible-outline\);outline-offset:-2px\}/,'Carousel active-slide focus ring must remain visible inside the clipped viewport.');
assert.doesNotMatch(carousel,/transitionDelay/,'Carousel must not retain a second transition-completion timer.');
assert.doesNotMatch(carousel,/addEventListener\(['"]transitionend|DOM\.listen\([^\n]*['"]transitionend/,'Carousel transition completion must stay under MotionController.');
assert.doesNotMatch(carousel,/current\s*=\s*resolved/,'Carousel runtime current writes must enter ValueController.');

assert.match(scroll,/FocusController\.create\s*\(/);
assert.match(scroll,/if \(input\.focusable === undefined\) input\.focusable = true;/,'Scroll.attachViewport must inherit the public default focusable:true behavior.');
assert.match(scroll,/if \(!sequentialFocusEnabled\) viewport\.tabIndex = -1;/,'Scroll focusable:false must explicitly remove the native overflow viewport from Tab order.');
assert.match(scroll,/root\.tabIndex = sequentialFocusEnabled \? 0 : -1;/,'Scroll focusable must remain the single owner of root sequential-focus participation.');
assert.match(scroll,/InteractionController\.create\s*\(/);
assert.match(scroll,/CapabilityController\.create\s*\(/);
assert.match(scroll,/MotionController\.create\(\{\s*core:motionCoreAdapter/);
assert.match(scroll,/motionController\.show\s*\(/,'Scroll imperative motion must start through MotionController.');
assert.match(scroll,/motionController\.cancel\s*\(/,'Scroll imperative motion cancel/destroy must enter MotionController.');
assert.match(scroll,/interactionController\.dispatch\s*\(/);
assert.match(scroll,/capabilityController\.can\('edit'\)/);
assert.doesNotMatch(scroll,/function\s+onKeyDown\s*\(/,'Scroll must not keep a parallel direct keyboard semantic owner.');
assert.doesNotMatch(scroll,/CapabilityController\.mutationLocked\s*\(/,'Scroll runtime mutation gate must use its canonical CapabilityController instance.');
assert.doesNotMatch(scroll,/DOM\.focusElement\(root/,'Scroll root focus must enter FocusController.');
assert.match(scroll,/focusable:\s*true,/,'Scroll must remain keyboard-focusable by default for existing callers.');
assert.match(scroll,/Object\.freeze\(\['scroll', 'always', 'hover', 'hidden'\]\)/,'Scroll visibility contract must expose exactly scroll/always/hover/hidden.');
assert.match(scroll,/scrollbarVisibility:\s*'scroll',/,'Scroll default visibility must be scroll.');
assert.match(scroll,/if \(input\.scrollbarVisibility === undefined\) input\.scrollbarVisibility = 'scroll';/,'Scroll.attachViewport must inherit the scroll visibility default.');
assert.match(scroll,/opts\.scrollbarVisibility !== 'scroll'/,'Auto-activation must belong only to scroll visibility mode.');
assert.doesNotMatch(scroll,/scrollbarVisibility[^\n]*'auto'|is-scrollbar-auto/,'Legacy auto scrollbar visibility must be removed.');
assert.match(css,/\.qxframe9a7c2-scroll\.is-scrollbar-scroll:not\(\.is-scrollbar-active\):not\(\.is-scrollbar-manual-show\) \.qxframe9a7c2-scroll-track/,'scroll mode must hide chrome while idle.');
assert.match(css,/\.qxframe9a7c2-scroll\.is-scrollbar-hover:hover \.qxframe9a7c2-scroll-track:not\(\[hidden\]\)/,'hover mode must reveal chrome while the Scroll root is hovered.');
assert.match(css,/\.qxframe9a7c2-scroll\.is-scrollbar-always \.qxframe9a7c2-scroll-track:not\(\[hidden\]\)/,'always mode must keep chrome visible.');
assert.match(css,/\.qxframe9a7c2-scroll\.is-scrollbar-hidden:not\(\.is-scrollbar-manual-show\) \.qxframe9a7c2-scroll-track[\s\S]*display:\s*none/,'hidden mode must suppress custom chrome.');
assert.match(css,/\.qxframe9a7c2-scroll-viewport[\s\S]*overflow:\s*auto/,'hidden mode must not disable the scrollable viewport itself.');

assert.match(scroll,/var sequentialFocusEnabled = opts\.disabled !== true && opts\.focusable !== false;/,'Scroll focusable must own sequential-focus participation.');
assert.match(scroll,/if \(!sequentialFocusEnabled\) viewport\.tabIndex = -1;/,'Scroll focusable=false must explicitly remove the native overflow viewport from Tab order.');
assert.match(scroll,/else if \(originalViewportTabindex === null\) viewport\.removeAttribute\('tabindex'\);/,'Scroll focusable=true must restore default viewport Tab behavior instead of leaving an owned -1.');
assert.match(wheelPanel,/keyboard:\s*false,[\s\S]*focusable:\s*false,/,'WheelPanel columns must opt out through Scroll focusable=false.');
assert.doesNotMatch(wheelPanel,/scrollRoot\.tabIndex|scrollViewport\.tabIndex/,'WheelPanel must not patch Scroll tabindex ownership itself.');
assert.match(itemCollection,/return Utils\.isFunction\(opts\.scrollAdapter\) \? opts\.scrollAdapter : Scroll\.attachViewport;/,'ItemCollection must default its scroll adapter to framework Scroll.');
assert.match(virtualList,/return Utils\.isFunction\(options\.scrollAdapter\) \? options\.scrollAdapter : Scroll\.attachViewport;/,'VirtualList must default its scroll adapter to framework Scroll.');
assert.match(menu,/PopupFrame\.create\(\{\s*panel:panel,[\s\S]*popupFrame\.attachViewport\(\{/,'Menu popup levels must use PopupFrame-owned Scroll.');
assert.match(menu,/rootScroll = Scroll\.attachViewport\(\{/,'Menu root navigation remains a business-owned non-popup Scroll surface.');
assert.match(table,/scrollSurface = Scroll\.attachViewport\(\{[\s\S]*viewport:scrollViewport/,'Table main viewport must use framework Scroll.');
assert.match(table,/filterScroll = filterPopupFrame\.attachViewport\(\{/,'Table filter options must use PopupFrame-owned Scroll.');
assert.match(cascader,/columnsScroll = popupFrame\.attachViewport\(\{/,'Cascader popup columns must use PopupFrame-owned Scroll.');
assert.match(datePicker,/selectionScroll = popupFrame\.attachViewport\(\{/,'DatePicker selection overflow must use PopupFrame-owned Scroll.');
assert.match(datePicker,/presetsScroll = popupFrame\.attachViewport\(\{/,'DatePicker preset overflow must use PopupFrame-owned Scroll.');
assert.doesNotMatch(datePicker,/\bScroll\.attachViewport\s*\(/,'DatePicker must not create popup Scroll directly.');
assert.match(transfer,/pagerScroll = Scroll\.attachViewport\(\{/,'Transfer pagination overflow must use framework Scroll.');
assert.match(sort,/r\.scrollSurface = Scroll\.attachViewport\(\{/,'Sort runtime overflow must use framework Scroll.');
assert.match(upload,/previewScroll = Scroll\.attachViewport\(\{/,'Upload preview overflow must use framework Scroll.');
assert.match(css,/--qxframe9a7c2-native-scrollbar-size:\s*var\(--qxframe9a7c2-scroll-track-size\)/,'Native fallback scrollbar size must consume the Scroll geometry token.');
assert.match(css,/--qxframe9a7c2-native-scrollbar-radius:\s*var\(--qxframe9a7c2-scroll-track-radius\)/,'Native fallback scrollbar radius must consume the Scroll geometry token.');
assert.match(css,/--qxframe9a7c2-native-scrollbar-thumb-inset:\s*var\(--qxframe9a7c2-scroll-thumb-inset\)/,'Native fallback thumb inset must consume the Scroll geometry token.');
assert.doesNotMatch(css,/::-webkit-scrollbar\{width:8px;height:8px\}/,'Native fallback scrollbar geometry must not duplicate hard-coded Scroll sizing.');

console.log(JSON.stringify({
  ok:true,
  accepted:['Carousel','Scroll'],
  carouselOwners:['ValueController','FocusController','InteractionController','CapabilityController','MotionController'],
  scrollOwners:['FocusController','InteractionController','CapabilityController','MotionController']
}));
