import { ActionContext } from './actionContext.js';
import { InteractionPolicy } from './interactionPolicy.js';
import { OperationResult } from './operationResult.js';

const OPERATION_FIELDS = Object.freeze({
  focus: 'focusable', navigate: 'navigable', open: 'expandable',
  activate: 'activatable', edit: 'editable', select: 'selectable',
  clear: 'clearable', remove: 'editable', drag: 'draggable',
  drop: 'droppable', submit: 'activatable', inspect: 'navigable',
  copy: 'navigable'
});
const ALWAYS_ALLOWED = Object.freeze(['close', 'abort', 'external-sync']);

function resolve(state, capabilities) {
  return InteractionPolicy.resolve(state, capabilities);
}

function allows(operation, state, capabilities) {
  const name = String(operation || '');
  if (ALWAYS_ALLOWED.includes(name)) return true;
  const field = OPERATION_FIELDS[name];
  if (!field) throw new TypeError('[QXFRAME9A7C2] Unknown capability operation: ' + name);
  return resolve(state, capabilities)[field] === true;
}

function create(options) {
  let settings = options || {};
  if (typeof settings.getState !== 'function') throw new TypeError('[QXFRAME9A7C2] CapabilityController getState is required.');
  let destroyed = false;
  let revision = 0;
  const currentState = () => InteractionPolicy.stateFromOptions(settings.getState() || {});
  const currentCapabilities = () => typeof settings.getCapabilities === 'function' ? settings.getCapabilities() || {} : settings.capabilities || {};
  const snapshot = () => Object.freeze({ ...resolve(currentState(), currentCapabilities()), revision, destroyed });
  const can = operation => !destroyed && allows(operation, currentState(), currentCapabilities());
  const authorize = (operation, context) => {
    const action = ActionContext.isContext(context) ? context : ActionContext.create(operation, context || {});
    return OperationResult.create(destroyed ? 'disposed' : can(operation) ? 'unchanged' : 'blocked', action, { reason: operation, revision });
  };
  const updateOptions = patch => {
    if (destroyed) return false;
    const next = { ...settings, ...(patch || {}) };
    if (typeof next.getState !== 'function') throw new TypeError('[QXFRAME9A7C2] CapabilityController getState is required.');
    settings = next;
    revision += 1;
    return true;
  };
  const destroy = () => {
    if (destroyed) return false;
    destroyed = true;
    revision += 1;
    return true;
  };
  return Object.freeze({ getState: snapshot, can, authorize, updateOptions, destroy });
}

// Existing public predicates remain bounded forwarding adapters. InteractionPolicy
// is the sole calculation authority and remains available for compatibility.
export const CapabilityController = Object.freeze({
  create, resolve, allows,
  stateFromOptions: InteractionPolicy.stateFromOptions,
  mutationLocked: InteractionPolicy.mutationLocked,
  activationLocked: InteractionPolicy.activationLocked,
  selectionLocked: InteractionPolicy.selectionLocked,
  canActivate: InteractionPolicy.canActivate,
  canEdit: InteractionPolicy.canEdit,
  canNavigate: InteractionPolicy.canNavigate,
  canFocus: InteractionPolicy.canFocus,
  canSelect: InteractionPolicy.canSelect,
  canCheck: InteractionPolicy.canCheck,
  canExpand: InteractionPolicy.canExpand,
  canDrag: InteractionPolicy.canDrag,
  canDrop: InteractionPolicy.canDrop
});
export { create, resolve, allows };
