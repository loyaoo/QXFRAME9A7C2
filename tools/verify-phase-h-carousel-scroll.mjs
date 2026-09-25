import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Carousel } from '../src/components/carousel.js';
import { Scroll } from '../src/components/scroll.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
function exactProfile(type,name,owners){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),owners.slice().sort());
  owners.forEach(owner=>{
    const capability=owner.replace('Controller','').replace(/^./,c=>c.toLowerCase());
    assert.equal(profile.ownership[capability],owner,name+' '+capability+' owner mismatch');
  });
}

exactProfile(Carousel,'Carousel',['ValueController','FocusController','InteractionController','CapabilityController','MotionController']);
exactProfile(Scroll,'Scroll',['FocusController','InteractionController','CapabilityController','MotionController']);

const carousel=read('src/components/carousel.js');
assert.match(carousel,/ValueController\.createValueBinding\s*\(/);
assert.match(carousel,/FocusController\.create\s*\(/);
assert.match(carousel,/InteractionController\.create\s*\(/);
assert.match(carousel,/CapabilityController\.create\s*\(/);
assert.match(carousel,/MotionController\.waitMotionEnd\s*\(/);
assert.match(carousel,/interactionController\.dispatch\s*\(/);
assert.match(carousel,/capabilityController\.can\('navigate'\)/);
assert.doesNotMatch(carousel,/transitionDelay/,'Carousel must not retain a second transition-completion timer.');
assert.doesNotMatch(carousel,/addEventListener\(['"]transitionend|DOM\.listen\([^\n]*['"]transitionend/,'Carousel transition completion must stay under MotionController.');
assert.doesNotMatch(carousel,/current\s*=\s*resolved/,'Carousel runtime current writes must enter ValueController.');

const scroll=read('src/components/scroll.js');
assert.match(scroll,/FocusController\.create\s*\(/);
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

console.log(JSON.stringify({
  ok:true,
  accepted:['Carousel','Scroll'],
  carouselOwners:['ValueController','FocusController','InteractionController','CapabilityController','MotionController'],
  scrollOwners:['FocusController','InteractionController','CapabilityController','MotionController']
}));
