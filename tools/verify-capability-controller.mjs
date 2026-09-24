import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActionContext } from '../src/core/actionContext.js';
import { CapabilityController } from '../src/core/capabilityController.js';
import { InteractionPolicy } from '../src/core/interactionPolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const state = { disabled: false, readOnly: false, loading: false };
const capability = CapabilityController.create({ getState: () => state });
const context = ActionContext.create('select', { source: 'keyboard' });

assert.deepEqual(CapabilityController.resolve(state), InteractionPolicy.resolve(state), 'The controller must delegate policy calculation.');
assert.equal(capability.can('edit'), true);
assert.equal(capability.authorize('select', context).status, 'unchanged', 'Authorization alone does not mutate selection.');
state.readOnly = true;
assert.equal(capability.can('navigate'), true);
assert.equal(capability.can('select'), false, 'readOnly must block user selection by default.');
assert.equal(capability.can('edit'), false);
assert.equal(capability.authorize('select', context).status, 'blocked');
assert.equal(capability.can('external-sync'), true, 'An external authority may update a readOnly component.');
assert.equal(CapabilityController.allows('select', state, { selectWhenReadOnly: true }), true, 'An authored readOnly selection profile may opt in.');
state.readOnly = false;
state.loading = true;
assert.equal(capability.can('focus'), true, 'A busy component retains focus.');
assert.equal(capability.can('edit'), false);
assert.equal(capability.can('close'), true, 'Cleanup must remain available while busy.');
state.loading = false;
state.disabled = true;
assert.equal(capability.can('focus'), false);
assert.equal(capability.can('navigate'), false);
assert.equal(capability.can('external-sync'), true, 'External sync must be available while disabled.');
assert.throws(() => capability.can('unknown'), /Unknown capability operation/);
assert.throws(() => capability.updateOptions({ getState: null }), /getState is required/);
assert.equal(capability.getState().disabled, true, 'A rejected adapter update must preserve the live source.');
assert.equal(capability.destroy(), true);
assert.equal(capability.destroy(), false);
assert.equal(capability.authorize('edit', context).status, 'disposed');

const componentFiles = fs.readdirSync(path.join(root, 'src/components')).filter(name => name.endsWith('.js'));
for (const name of componentFiles) {
  const source = fs.readFileSync(path.join(root, 'src/components', name), 'utf8');
  assert.ok(!/from ['"]\.\.\/core\/interactionPolicy\.js['"]/.test(source), `${name} must enter user capability checks through CapabilityController.`);
}
console.log(JSON.stringify({ ok: true, owner: 'InteractionPolicy', entry: 'CapabilityController', componentFiles: componentFiles.length }));
