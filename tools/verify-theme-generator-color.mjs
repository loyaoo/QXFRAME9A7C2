import assert from 'node:assert/strict';
import {
  parseColor,
  colorToCss,
  colorToTuple,
  colorToHex,
  rgbToOklch,
  generateColorScale,
  generateNeutralScale,
  relativeLuminance,
  contrastRatio,
  chooseOnColor,
  mixSrgb,
  mixOklab,
  chartPalette
} from '../docs/assets/theme-generator/color-engine.mjs';

function approx(a,b,epsilon=0.006){assert.ok(Math.abs(a-b)<=epsilon, String(a)+' ≈ '+String(b));}
function assertColor(value){
  const c=parseColor(value);
  for(const key of ['r','g','b','a'])assert.ok(Number.isFinite(c[key])&&c[key]>=0&&c[key]<=1,key+' out of gamut');
  return c;
}

const hex=parseColor('#165dff');
const rgb=parseColor('rgb(22 93 255)');
approx(hex.r,rgb.r,1/255);approx(hex.g,rgb.g,1/255);approx(hex.b,rgb.b,1/255);
assert.equal(colorToHex('#165dff'),'#165dff');
assert.equal(colorToTuple('#165dff'),'22, 93, 255');
assert.equal(colorToCss('#165dff'),'rgb(22, 93, 255)');

const redHsl=parseColor('hsl(0 100% 50%)');
assert.equal(colorToHex(redHsl),'#ff0000');
const translucent=parseColor('rgb(22 93 255 / 50%)');
approx(translucent.a,0.5,0.001);
assert.match(colorToCss(translucent),/^rgba\(22, 93, 255, 0\.5\)$/);

for(const sample of ['#5b5bd6','rgb(22 93 255)','hsl(271 81% 56%)','oklch(62% 0.2 260)','oklab(62% 0.02 -0.18)']){
  assertColor(sample);
}

const scale=generateColorScale('#165dff');
assert.equal(scale.length,13);
scale.forEach(assertColor);
const scaleL=scale.map(item=>rgbToOklch(item).l);
for(let i=1;i<scaleL.length;i+=1)assert.ok(scaleL[i]>scaleL[i-1]-0.002,'colored scale lightness must be monotonic');
const seedL=rgbToOklch('#165dff').l;
approx(rgbToOklch(scale[4]).l,Math.min(0.86,Math.max(0.28,seedL)),0.012);

for(const preset of ['neutral','stone','zinc','mauve','olive','mist','taupe']){
  const neutral=generateNeutralScale(preset);
  assert.equal(neutral.length,13);
  neutral.forEach(assertColor);
  const ls=neutral.map(item=>rgbToOklch(item).l);
  for(let i=1;i<ls.length;i+=1)assert.ok(ls[i]>ls[i-1],'neutral scale lightness must be strictly monotonic');
}
const customNeutral=generateNeutralScale('neutral','#7b7168');
assert.equal(customNeutral.length,13);
customNeutral.forEach(assertColor);

assert.ok(relativeLuminance('#fff')>relativeLuminance('#000'));
assert.ok(contrastRatio('#000','#fff')>20);
assert.equal(chooseOnColor('#ffffff').css,'rgb(10, 10, 10)');
assert.equal(chooseOnColor('#000000').css,'rgb(255, 255, 255)');
assert.ok(chooseOnColor('#5b5bd6').ratio>1);

assertColor(mixSrgb('#ff0000','#0000ff',0.5));
assertColor(mixOklab('#ff0000','#0000ff',0.5));

for(const preset of ['balanced','cool','warm','mixed','mono']){
  const light=chartPalette(preset,'#165dff',8,'light');
  const dark=chartPalette(preset,'#165dff',8,'dark');
  assert.equal(light.length,8);assert.equal(dark.length,8);
  light.concat(dark).forEach(assertColor);
  assert.notEqual(light.map(colorToHex).join(','),dark.map(colorToHex).join(','),'chart palette must have a distinct dark rendering');
}

assert.throws(()=>parseColor('not-a-color'),/Unsupported color syntax/);
assert.throws(()=>generateNeutralScale('unknown'),/Unknown neutral preset/);
assert.throws(()=>chartPalette('unknown'),/Unknown chart preset/);

console.log(JSON.stringify({
  phase:'TG-C-color-foundation',
  colorInputs:['HEX','RGB','HSL','OKLCH','OKLab'],
  coloredScaleSteps:13,
  neutralAlgorithms:7,
  chartPresets:5,
  gamutMapped:true,
  onColorContrast:true
}));
