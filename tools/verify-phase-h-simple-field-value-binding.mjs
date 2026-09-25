import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const cases=[
  ['Autocomplete','src/components/autocomplete.js',/ValueController\.create\s*\(/,/instance\.bindValueController\(valueState\)/],
  ['InputOTP','src/components/input-otp.js',/ValueController\.create\s*\(/,/this\.bindValueController\(valueState(?:\s*,|\))/],
  ['Rate','src/components/rate.js',/ValueController\.create\s*\(/,/this\.bindValueController\(valueState(?:\s*,|\))/],
  ['Slider','src/components/slider.js',/ValueController\.create\s*\(/,/instance\.bindValueController\(valueState\s*,/]
];

for(const [name,file,createPattern,bindPattern] of cases){
  const source=fs.readFileSync(new URL(file,root),'utf8');
  assert.match(source,createPattern,name+' must retain its specialized canonical ValueController.');
  assert.match(source,bindPattern,name+' must bind that controller into FieldComponent.');
  const bindCount=(source.match(/bindValueController\(valueState(?:\s*,|\))/g)||[]).length;
  assert.equal(bindCount,1,name+' must bind exactly one specialized ValueController into FieldComponent.');
}

const fieldSource=fs.readFileSync(new URL('src/components/field.js',root),'utf8');
assert.match(fieldSource,/detail\.sync\s*!==\s*true/,'FieldComponent must support projection sync from an already-updated shared ValueController.');
assert.match(fieldSource,/if \(!same && detail\.sync !== true\) \{/,'FieldComponent sync must not rewrite an already-updated shared ValueController.');
assert.match(fieldSource,/readCommittedValue/,'FieldComponent must project the bound canonical value without a second committed store.');
assert.match(fieldSource,/settings\.projectValue/,'FieldComponent must support a pure external-value projector for canonical controllers with internal normalized shapes.');
assert.doesNotMatch(fieldSource,/\b(?:record|state)\.value\b/,'FieldComponent must remain free of a parallel committed-value mirror.');

for(const [name,file] of cases){
  const source=fs.readFileSync(new URL(file,root),'utf8');
  assert.match(source,/setFieldValue\([^\n]*sync:\s*true/ ,name+' must project shared-controller writes through FieldComponent without creating a second write owner.');
}

const sliderSource=fs.readFileSync(new URL('src/components/slider.js',root),'utf8');
assert.match(sliderSource,/bindValueController\(valueState,\s*\{\s*projectValue:/,'Slider must project its canonical handle-array value to the public scalar/range field value.');
assert.doesNotMatch(sliderSource,/bindValueController\(valueState\);/,'Slider must not expose the internal handle-array shape as the FieldComponent public value.');


console.log(JSON.stringify({
  ok:true,
  components:cases.map(entry=>entry[0]),
  sharedValueController:true,
  duplicateCommittedValueStore:false
}));
