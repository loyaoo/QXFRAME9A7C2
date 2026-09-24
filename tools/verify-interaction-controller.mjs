import assert from 'node:assert/strict';
import fs from 'node:fs';
import { InteractionController } from '../src/core/interactionController.js';
import { PointerSession } from '../src/core/pointerSession.js';

const parentRoot = { nodeType: 1 };
const portalRoot = { nodeType: 1 };
const calls = [];
let childOutcome = 'blocked';
const controller = InteractionController.create();
const parent = controller.registerScope({
  id: 'parent', root: parentRoot,
  onAction(action, context) { calls.push(['parent', action, context.ownerId]); return 'handled'; }
});
const child = controller.registerScope({
  id: 'child', parentId: 'parent', root: portalRoot,
  profile: { keymap: { ' ': 'TOGGLE' } },
  capability: { can(operation) { return operation !== 'select'; } },
  onAction(action, context) { calls.push(['child', action, context.ownerId]); return childOutcome; }
});

function key(keyName, root = portalRoot, target = root, extra = {}) {
  return {
    type: 'keydown', key: keyName, target, defaultPrevented: false,
    composedPath: () => [target, root],
    preventDefault() { this.defaultPrevented = true; },
    ...extra
  };
}

const blocked = key(' ');
assert.equal(controller.dispatch(blocked), 'blocked', 'A child capability veto must stop logical parent routing.');
assert.equal(blocked.defaultPrevented, false, 'Blocked routing must not consume the browser default unless the adapter does.');
assert.equal(calls.length, 0);
const enter = key('Enter');
assert.equal(controller.dispatch(enter), 'blocked', 'A child action veto must stop parent routing.');
assert.deepEqual(calls, [['child', 'ACTIVATE', 'child']]);
assert.equal(enter.defaultPrevented, false);
childOutcome = 'pass';
const pass = key('Enter');
assert.equal(controller.dispatch(pass), 'handled', 'A passing child must route through the logical parent across a portal.');
assert.deepEqual(calls.slice(-2), [['child', 'ACTIVATE', 'child'], ['parent', 'ACTIVATE', 'parent']]);
assert.equal(pass.defaultPrevented, true);
const before = calls.length;
assert.equal(controller.dispatch(key('Enter', portalRoot, { tagName: 'TEXTAREA', isContentEditable: false })), 'pass', 'Native editing has priority.');
assert.equal(controller.dispatch(key('Enter', portalRoot, portalRoot, { isComposing: true })), 'pass', 'IME composition has priority.');
assert.equal(controller.dispatch(key('Enter', portalRoot, portalRoot, { repeat: true })), 'pass', 'Activation repeat is disabled by default.');
assert.equal(calls.length, before);
assert.equal(controller.dispatch(key('ArrowDown', portalRoot, portalRoot, { repeat: true })), 'handled', 'Navigation repeat stays available.');
assert.equal(InteractionController.resolveKeyboardAction(key('Enter', portalRoot, portalRoot, { repeat: true }), { repeatActions: ['ACTIVATE'] }), 'ACTIVATE', 'A profile may opt into repeat.');
assert.equal(child.release(), true);
assert.equal(child.release(), false);
assert.equal(controller.dispatch(key('Enter', portalRoot)), 'pass');
assert.equal(parent.release(), true);
assert.equal(controller.destroy(), true);
assert.equal(controller.destroy(), false);

const view = new EventTarget();
const target = new EventTarget();
target.ownerDocument = { defaultView: view };
let pointerEnd = null;
const pointer = PointerSession.create({ target, document: target.ownerDocument, threshold: 0, onEnd(detail) { pointerEnd = detail; } });
assert.equal(pointer.begin({ pointerId: 7, clientX: 10, clientY: 20, button: 0, isPrimary: true }), true);
view.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 7, clientX: 0, clientY: 0 }));
assert.equal(pointerEnd.x, 0, 'Pointer coordinate zero must not fall back to the previous position.');
assert.equal(pointerEnd.y, 0);
assert.equal(pointerEnd.deltaX, -10);
assert.equal(pointerEnd.deltaY, -20);
pointer.destroy();

const keyboardSource = fs.readFileSync(new URL('../src/core/keyboardNavigation.js', import.meta.url), 'utf8');
assert.match(keyboardSource, /InteractionController\.resolveKeyboardAction/, 'KeyboardNavigation must consume canonical key resolution.');
assert.match(keyboardSource, /allowActivationRepeat/, 'Default activation must reject long-press repetition.');
console.log(JSON.stringify({ ok: true, owner: 'InteractionController', delegates: ['KeyboardNavigation', 'LogicalOwnerTree'], portalRoute: true }));
