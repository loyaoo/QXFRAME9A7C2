import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Image } from '../src/components/image.js';
import { ComponentProfile } from '../src/core/componentProfile.js';

const source=fs.readFileSync(new URL('../src/components/image.js',import.meta.url),'utf8');
const overlayRuntime=fs.readFileSync(new URL('../src/core/overlayRuntime.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/qxframe9a7c2.css',import.meta.url),'utf8');
const profile=ComponentProfile.define(Image.profile);
const expected=['focus','interaction','capability','motion','overlay','feedback'];
const owners={
  focus:'FocusController',
  interaction:'InteractionController',
  capability:'CapabilityController',
  motion:'MotionController',
  overlay:'OverlayController',
  feedback:'FeedbackController'
};

assert.equal(profile.name,'Image');
assert.deepEqual(expected.filter(key=>profile[key]!=null).sort(),expected.slice().sort(),'Image must declare exact F/I/C/M/O/B target.');
assert.deepEqual(Object.keys(profile.ownership).sort(),expected.slice().sort(),'Image ownership must match exact handbook target.');
for(const key of expected)assert.equal(profile.ownership[key],owners[key],key+' must use canonical owner '+owners[key]);

assert.match(source,/InteractionController\.create\s*\(/,'Image preview keyboard semantics must enter InteractionController.');
assert.match(source,/interactionController\.registerScope\s*\(/,'Image preview must register one semantic interaction scope.');
assert.match(source,/interactionController\.dispatch\s*\(/,'Image preview keydown must dispatch through InteractionController.');
assert.doesNotMatch(source,/event\.key\s*===\s*['"]Arrow(?:Left|Right)['"]/,'Image must not retain direct Arrow key semantic branches.');
assert.match(source,/CapabilityController\.create\s*\(/,'Image must own one CapabilityController.');
assert.match(source,/capabilityController\.can\('open'\)/,'Image preview open must be gated by CapabilityController.');
assert.match(source,/capabilityController\.can\(operation\)/,'Image preview actions must be gated by CapabilityController.');
assert.match(source,/FeedbackController\.createForProjector\s*\(/,'Image loading/error classes must enter FeedbackController.');
assert.match(source,/feedbackController\.publish\s*\(/,'Image source lifecycle must publish visible feedback through FeedbackController.');
assert.doesNotMatch(source,/root\.classList\.toggle\('is-loading',\s*loading\)/,'Image must not keep a parallel direct loading class projector.');
assert.doesNotMatch(source,/root\.classList\.toggle\('is-error',\s*error\)/,'Image must not keep a parallel direct error class projector.');
assert.match(source,/OverlayController\.create\s*\(/,'Image preview resource must remain OverlayController-owned.');
assert.match(source,/Transition\.create\s*\(/,'Image preview presence must remain Transition→MotionController-owned.');
assert.match(source,/static semanticElements = Object\.freeze\(\['root','image','preview','mask','stage','trajectory','media'\]\)/,'Image preview must publish canonical semantic elements.');
assert.match(source,/trajectory:Object\.freeze\([\s\S]*--qxframe9a7c2-motion-image-preview-trajectory-enter-duration[\s\S]*--qxframe9a7c2-motion-image-preview-trajectory-leave-duration/,'Image preview semantic motion slots must map duration overrides to CSS.');
assert.match(source,/mask:Object\.freeze\([\s\S]*--qxframe9a7c2-motion-image-preview-mask-enter-duration[\s\S]*--qxframe9a7c2-motion-image-preview-mask-leave-duration/,'Image preview mask duration must share the semantic registry.');
assert.doesNotMatch(source,/transitionDuration\s*:|transitionTimingFunction\s*:|motion-duration-(?:fast|mid|slow)|easing-(?:standard|out|in)/,'Image Preview JS must not select default visual timing.');
assert.match(css,/--qxframe9a7c2-motion-image-preview-trajectory-enter-duration:\s*var\(--qxframe9a7c2-motion-duration-3\)/,'Image trajectory enter default must be CSS semantic token → primitive duration-3.');
assert.match(css,/--qxframe9a7c2-motion-image-preview-mask-leave-duration:\s*var\(--qxframe9a7c2-motion-duration-2\)/,'Image mask leave default must be CSS semantic token → primitive duration-2.');
assert.match(source,/classList\.toggle\('is-pannable',\s*state\.scale\s*>\s*1\.001\s*&&\s*cfg\('draggable',\s*opts\.draggable\)\s*!==\s*false\)/,'Image grab cursor capability must require both zoom and draggable permission.');
assert.match(css,/\.qxframe9a7c2-image-preview-image\.is-pannable\{cursor:grab\}/,'Image preview grab cursor must follow pannable capability.');
assert.match(source,/previewNodeByAction\.set\(String\(action\), button\)/,'Image preview chrome must retain action identity across media rerenders.');
assert.match(source,/chromeOwnedFocus[\s\S]*FocusOrigin\.prepare\(nextFocus, focusOrigin[\s\S]*DOM\.focusElement\(nextFocus/,'Image preview media switching must restore focus when the active chrome node is rebuilt.');
assert.match(css,/\.qxframe9a7c2-image-preview-mask\.qxframe9a7c2-motion-fade-enter-from,[\s\S]*qxframe9a7c2-motion-fade-leave-to\{opacity:0\}/,'Image preview mask fade-from/leave-to state must override its steady mask opacity.');
assert.match(css,/\.qxframe9a7c2-image-preview-mask\.qxframe9a7c2-motion-fade-enter-to,[\s\S]*qxframe9a7c2-motion-fade-leave-from\{opacity:var\(--qxframe9a7c2-image-preview-mask-opacity,82%\)\}/,'Image preview mask fade-to state must restore configured opacity.');
assert.doesNotMatch(css,/\.qxframe9a7c2-image-preview-image\.is-zoomed\{cursor:grab\}/,'Image zoom state alone must not advertise draggable cursor.');
assert.doesNotMatch(source,/\bFocusManager\b|\bFocusScope\b/,'Image must not create parallel focus resources.');
assert.match(overlayRuntime,/FocusController\.createManager\s*\(/,'Image overlay focus manager must enter FocusController through OverlayRuntime.');
assert.match(overlayRuntime,/FocusController\.createScope\s*\(/,'Image overlay focus scope must enter FocusController through OverlayRuntime.');

console.log(JSON.stringify({
  ok:true,
  component:'Image',
  ownership:expected.map(key=>owners[key]),
  overlayFocusFacade:true,
  semanticKeyboard:true,
  visibleFeedbackProjection:true
}));
