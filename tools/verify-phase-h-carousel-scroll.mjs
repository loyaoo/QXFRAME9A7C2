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
assert.match(scroll,/var sequentialFocusEnabled = opts\.disabled !== true && opts\.focusable !== false;/,'Scroll focusable must own sequential-focus participation.');
assert.match(scroll,/if \(!sequentialFocusEnabled\) viewport\.tabIndex = -1;/,'Scroll focusable=false must explicitly remove the native overflow viewport from Tab order.');
assert.match(scroll,/else if \(originalViewportTabindex === null\) viewport\.removeAttribute\('tabindex'\);/,'Scroll focusable=true must restore default viewport Tab behavior instead of leaving an owned -1.');
assert.match(wheelPanel,/keyboard:\s*false,[\s\S]*focusable:\s*false,/,'WheelPanel columns must opt out through Scroll focusable=false.');
assert.doesNotMatch(wheelPanel,/scrollRoot\.tabIndex|scrollViewport\.tabIndex/,'WheelPanel must not patch Scroll tabindex ownership itself.');

console.log(JSON.stringify({
  ok:true,
  accepted:['Carousel','Scroll'],
  carouselOwners:['ValueController','FocusController','InteractionController','CapabilityController','MotionController'],
  scrollOwners:['FocusController','InteractionController','CapabilityController','MotionController']
}));
