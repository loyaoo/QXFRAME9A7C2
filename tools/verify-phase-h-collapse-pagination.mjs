import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Collapse } from '../src/components/collapse.js';
import { Pagination } from '../src/components/pagination.js';
import { PaginationModel } from '../src/core/paginationModel.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const collapseSource=read('src/components/collapse.js');
const paginationSource=read('src/components/pagination.js');
const paginationModelSource=read('src/core/paginationModel.js');
const keyboardSource=read('src/core/keyboardNavigation.js');

function assertProfile(type,name,owners){
  const profile=ComponentProfile.define(type.profile);
  assert.equal(profile.name,name);
  assert.deepEqual(Object.keys(profile.ownership).sort(),owners.slice().sort());
  owners.forEach(capability=>{
    const controller=capability[0].toUpperCase()+capability.slice(1)+'Controller';
    assert.equal(profile.ownership[capability],controller,name+' '+capability+' owner');
  });
}
assertProfile(Collapse,'Collapse',['value','focus','interaction','capability','motion']);
assertProfile(Pagination,'Pagination',['value','focus','interaction','capability']);

assert.match(collapseSource,/ValueController\.create(?:Option)?ValueBinding\s*\(/,'Collapse value must enter canonical ValueController.');
assert.match(collapseSource,/FocusController\.create\s*\(/,'Collapse navigation focus must enter FocusController.');
assert.match(collapseSource,/CapabilityController\.create\s*\(/,'Collapse activation policy must enter CapabilityController.');
assert.match(collapseSource,/Transition\.create\s*\(/,'Collapse panel motion must stay Transition→MotionController.');
assert.match(collapseSource,/capabilityController\.can\('activate'\)/,'Collapse toggle must be capability gated.');
assert.doesNotMatch(collapseSource,/import \{ KeyboardNavigation \}/,'Collapse must not directly own KeyboardNavigation import.');

assert.match(paginationModelSource,/ValueController\.create\s*\(/,'Pagination page value must enter canonical ValueController.');
assert.match(paginationModelSource,/getValueController:\s*function \(\) \{ return pageState; \}/,'PaginationModel must expose the canonical ValueController.');
assert.match(paginationSource,/FocusController\.create\s*\(/,'Pagination focus/keyboard region must enter FocusController.');
assert.match(paginationSource,/CapabilityController\.create\s*\(/,'Pagination mutation policy must enter CapabilityController.');
assert.match(paginationSource,/capabilityController\.can\('edit'\)/,'Pagination jumper edit path must be capability gated.');
assert.doesNotMatch(paginationSource,/import \{ KeyboardNavigation \}/,'Pagination must not directly own KeyboardNavigation import.');

const paginationModel=PaginationModel.create({total:100,page:3,pageSize:10});
let pageSizeDetail=null;
paginationModel.on('change',detail=>{ if(detail.reason==='page-size') pageSizeDetail=detail; });
paginationModel.setPageSize(20,{source:'test'});
assert.equal(paginationModel.page,3,'Pagination page-size change keeps the current page number while it remains valid.');
assert.equal(pageSizeDetail && pageSizeDetail.recommendPage,2,'Pagination exposes the first-item-preserving page only as recommendPage metadata.');
paginationModel.setPage(5,{silent:true,source:'test'});
paginationModel.setPageSize(50,{source:'test'});
assert.equal(paginationModel.page,2,'Pagination page-size change clamps current only when it exceeds the new last page.');
paginationModel.destroy();

assert.match(keyboardSource,/InteractionController\.resolveKeyboardAction\s*\(/,'Shared KeyboardNavigation semantics must enter InteractionController resolver.');

console.log(JSON.stringify({
  ok:true,
  components:['Collapse','Pagination'],
  collapse:['ValueController','FocusController','InteractionController','CapabilityController','MotionController'],
  pagination:['ValueController','FocusController','InteractionController','CapabilityController'],
  sharedInteraction:'FocusController→KeyboardRegion→KeyboardNavigation→InteractionController.resolveKeyboardAction'
}));
