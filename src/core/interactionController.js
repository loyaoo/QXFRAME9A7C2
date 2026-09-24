import { ActionContext } from './actionContext.js';
import { DOM } from './dom.js';
import { LogicalOwnerTree } from './logicalOwnerTree.js';

const DEFAULT_KEYS = Object.freeze({
  ArrowUp: 'MOVE_UP', ArrowDown: 'MOVE_DOWN', ArrowLeft: 'MOVE_LEFT', ArrowRight: 'MOVE_RIGHT',
  Home: 'MOVE_FIRST', End: 'MOVE_LAST', PageUp: 'PAGE_PREVIOUS', PageDown: 'PAGE_NEXT',
  Enter: 'ACTIVATE', ' ': 'ACTIVATE', Spacebar: 'ACTIVATE'
});
const REPEATABLE = Object.freeze(['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_FIRST', 'MOVE_LAST', 'PAGE_PREVIOUS', 'PAGE_NEXT']);
const OUTCOMES = Object.freeze(['pass', 'handled', 'blocked']);
const ACTION_OPERATIONS = Object.freeze({
  ACTIVATE: 'activate', TOGGLE: 'select', OPEN: 'open', CLOSE: 'close',
  SELECT: 'select', UNSELECT: 'select', SELECT_ALL: 'select', CLEAR_SELECTION: 'clear',
  REMOVE: 'remove', RANGE_EXTEND: 'select', ENTER_EDIT: 'edit', COMMIT_EDIT: 'edit',
  CANCEL_EDIT: 'abort', DELETE: 'remove', BACKSPACE: 'remove', CONFIRM: 'submit',
  CANCEL: 'abort', DISMISS: 'close'
});

function operationForAction(action) {
  return ACTION_OPERATIONS[action] || (String(action).startsWith('MOVE_') || String(action).startsWith('PAGE_') ? 'navigate' : 'activate');
}

function isNativeEditor(target) {
  if (!target) return false;
  if (target.isContentEditable === true) return true;
  const tag = String(target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag !== 'input') return false;
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'file', 'color'].includes(String(target.type || 'text').toLowerCase());
}

function resolveKeyboardAction(event, profile) {
  if (!event || event.defaultPrevented === true || DOM.isComposingEvent(event)) return null;
  if ((event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) && !(profile && profile.allowModifiers === true)) return null;
  const key = String(event.key || '');
  const keymap = profile && profile.keymap || null;
  const action = keymap && Object.prototype.hasOwnProperty.call(keymap, key) ? keymap[key] : DEFAULT_KEYS[key];
  if (!action) return null;
  const name = String(action);
  if (event.repeat === true && !REPEATABLE.includes(name) && !(profile && Array.isArray(profile.repeatActions) && profile.repeatActions.includes(name))) return null;
  return name;
}

function create(options) {
  const settings = options || {};
  const ownsTree = !settings.ownerTree;
  const ownerTree = settings.ownerTree || LogicalOwnerTree.create();
  const scopes = new Map();
  let destroyed = false;

  function registerScope(config) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] InteractionController is destroyed.');
    const local = config || {};
    const id = String(local.id || '').trim();
    if (!id || !local.root || typeof local.onAction !== 'function') throw new TypeError('[QXFRAME9A7C2] Interaction scope requires id, root and onAction.');
    if (scopes.has(id)) throw new Error('[QXFRAME9A7C2] Duplicate interaction scope: ' + id);
    const node = ownerTree.registerOwner({ id, parentId: local.parentId, root: local.root, document: local.document, owner: local.owner });
    scopes.set(id, Object.freeze({ ...local, id }));
    let released = false;
    return Object.freeze({ id, node, release() {
      if (released) return false;
      released = true;
      const descendants = [...scopes.keys()].filter(key => key !== id && ownerTree.isLogicalDescendant(key, id));
      descendants.forEach(key => scopes.delete(key));
      scopes.delete(id);
      ownerTree.releaseOwner(id);
      return true;
    } });
  }

  function dispatch(event, options) {
    if (destroyed || !event || event.defaultPrevented === true || DOM.isComposingEvent(event)) return 'pass';
    const local = options || {};
    let node = local.ownerId ? ownerTree.get(local.ownerId) : ownerTree.resolveOwnerFromEvent(event);
    if (!node) return 'pass';
    if (isNativeEditor(event.target)) {
      const ownerScope = scopes.get(node.id);
      const allowed = ownerScope && ownerScope.profile && ownerScope.profile.allowEditableKeys;
      if (allowed !== true && !(Array.isArray(allowed) && allowed.includes(event.key))) return 'pass';
    }
    while (node) {
      const scope = scopes.get(node.id);
      if (scope) {
        const action = typeof scope.resolveAction === 'function' ? scope.resolveAction(event) : resolveKeyboardAction(event, scope.profile);
        if (action) {
          const context = ActionContext.create(action, {
            source: local.source || 'keyboard', originalEvent: event,
            ownerId: node.id, scopeId: node.id, parentActionId: local.parentActionId
          });
          if (scope.capability && scope.capability.can && scope.capability.can(scope.operationOf ? scope.operationOf(action) : operationForAction(action)) === false) return 'blocked';
          const outcome = scope.onAction(action, context);
          if (!OUTCOMES.includes(outcome)) throw new TypeError('[QXFRAME9A7C2] Interaction adapter must return pass, handled or blocked.');
          if (outcome !== 'pass') {
            if (outcome === 'handled' && event.preventDefault) event.preventDefault();
            return outcome;
          }
        }
      }
      node = node.parent;
    }
    return 'pass';
  }

  function destroy() {
    if (destroyed) return false;
    [...scopes.keys()].forEach(id => { if (scopes.has(id)) { scopes.delete(id); ownerTree.releaseOwner(id); } });
    if (ownsTree) ownerTree.destroy();
    destroyed = true;
    return true;
  }
  return Object.freeze({ registerScope, dispatch, getState: () => Object.freeze({ scopeIds: Object.freeze([...scopes.keys()]), destroyed }), destroy });
}

export const InteractionController = Object.freeze({ create, resolveKeyboardAction, outcomes: OUTCOMES });
export { create, resolveKeyboardAction };
