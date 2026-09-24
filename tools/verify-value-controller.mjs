import assert from 'node:assert/strict';
import { ValueController } from '../src/core/valueController.js';
import { ValueDraft } from '../src/core/valueDraft.js';
import { StateController } from '../src/core/stateController.js';
import { PickerSession } from '../src/core/pickerSession.js';

assert.equal(ValueDraft.create,ValueController.create,'ValueDraft compatibility alias must share the ValueController authority.');

const controller=ValueController.create({value:'A'});
assert.equal(controller.value,'A');
assert.equal(controller.revision,0);
assert.deepEqual(controller.projection({open:false}),{channel:'committed',value:'A',revision:0});
controller.begin({silent:true,source:'popup',reason:'open'});
assert.equal(controller.sessionActive,true);
controller.setDraft('B',{source:'keyboard',reason:'select'});
assert.equal(controller.value,'A');
assert.equal(controller.draftValue,'B');
assert.equal(controller.projection({open:true}).channel,'draft');
assert.equal(controller.projection({open:true}).value,'B');
controller.setPreview('C',{silent:true,source:'pointer',reason:'hover'});
assert.equal(controller.projection({open:true,previewControl:false}).value,'B');
assert.equal(controller.projection({open:true,previewControl:true}).value,'C');
controller.setRawInput('12:34',{silent:true,active:true,source:'input',reason:'typing'});
assert.equal(controller.projection({open:true,previewControl:true}).channel,'rawInput');
assert.equal(controller.projection({open:true,previewControl:true}).value,'12:34');
controller.setRawInput('12:34',{silent:true,active:false});
assert.equal(controller.projection({open:true,previewControl:true}).channel,'preview');
controller.clearPreview({silent:true});
assert.equal(controller.projection({open:true}).channel,'draft');
assert.equal(controller.commit({source:'keyboard',reason:'confirm'}),true);
assert.equal(controller.value,'B');
assert.equal(controller.dirty,false);

const immediateSession=PickerSession.create({controller,needConfirm:false});
immediateSession.open({source:'popup',reason:'open'});
controller.setDraft('C',{silent:true});
immediateSession.close({source:'keyboard',reason:'escape'});
assert.equal(controller.value,'B','close must not secretly commit an immediate-mode dirty draft.');
assert.equal(controller.draftValue,'B','uncommitted close must roll back the dirty draft.');
assert.equal(controller.sessionActive,false);

immediateSession.open({source:'popup',reason:'open'});
controller.setDraft('D',{silent:true});
assert.equal(immediateSession.commit({source:'keyboard',reason:'select-commit'}),true);
immediateSession.close({source:'pointer',reason:'select'});
assert.equal(controller.value,'D','explicit selection-complete commit must survive close.');

const confirmController=ValueController.create({value:'X'});
const confirmSession=PickerSession.create({controller:confirmController,needConfirm:true});
confirmSession.open({source:'popup',reason:'open'});
confirmController.setDraft('Y',{silent:true});
confirmSession.close({source:'keyboard',reason:'escape'});
assert.equal(confirmController.value,'X');
assert.equal(confirmController.draftValue,'X');

const state=StateController.create({value:1});
assert.equal(typeof state.projection,'function');
assert.equal(state.value,1);
state.destroy();
confirmController.destroy();
controller.destroy();

console.log(JSON.stringify({ok:true,valueController:true,valueDraftAlias:true,channels:['committed','draft','preview','rawInput'],sessionAuthority:true,noCloseCommit:true}));
