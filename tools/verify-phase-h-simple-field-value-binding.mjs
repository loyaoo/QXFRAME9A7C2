import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const cases=[
  ['Autocomplete','src/components/autocomplete.js',/ValueController\.create\s*\(/,/instance\.bindValueController\(valueState\)/],
  ['InputOTP','src/components/input-otp.js',/StateController\.create\s*\(/,/this\.bindValueController\(valueState\)/],
  ['Rate','src/components/rate.js',/StateController\.create\s*\(/,/this\.bindValueController\(valueState\)/],
  ['Slider','src/components/slider.js',/StateController\.create\s*\(/,/instance\.bindValueController\(valueState\)/]
];

for(const [name,file,createPattern,bindPattern] of cases){
  const source=fs.readFileSync(new URL(file,root),'utf8');
  assert.match(source,createPattern,name+' must retain its specialized canonical ValueController/StateController.');
  assert.match(source,bindPattern,name+' must bind that controller into FieldComponent.');
  const bindCount=(source.match(/bindValueController\(valueState\)/g)||[]).length;
  assert.equal(bindCount,1,name+' must bind exactly one specialized ValueController into FieldComponent.');
}

const fieldSource=fs.readFileSync(new URL('src/components/field.js',root),'utf8');
assert.match(fieldSource,/detail\.sync\s*!==\s*true/,'FieldComponent must support projection sync from an already-updated shared ValueController.');
assert.match(fieldSource,/if \(!same\) \{/,'FieldComponent sync must not rewrite an already-updated shared ValueController.');
assert.doesNotMatch(fieldSource,/\b(?:record|state)\.value\b/,'FieldComponent must remain free of a parallel committed-value mirror.');

for(const [name,file] of cases){
  const source=fs.readFileSync(new URL(file,root),'utf8');
  assert.match(source,/setFieldValue\([^\n]*sync:\s*true/ ,name+' must project shared-controller writes through FieldComponent without creating a second write owner.');
}

console.log(JSON.stringify({
  ok:true,
  components:cases.map(entry=>entry[0]),
  sharedValueController:true,
  duplicateCommittedValueStore:false
}));
