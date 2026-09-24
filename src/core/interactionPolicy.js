
function resolve(state, capabilities) {
  var source = state || {};
  var caps = capabilities || {};
  var disabled = source.disabled === true;
  var readOnly = !disabled && source.readOnly === true;
  var loading = !disabled && source.loading === true;
  var preserveFocus = loading && caps.preserveFocusWhileLoading !== false;
  var focusable = disabled ? false : (loading ? preserveFocus || caps.focusableWhileLoading === true : caps.focusable !== false);
  var tabbable = disabled ? false : (loading ? caps.tabbableWhileLoading !== false : caps.tabbable !== false);
  var activatable = !disabled && !loading && caps.activatable !== false && (!readOnly || caps.activateWhenReadOnly === true);
  var editable = !disabled && !loading && !readOnly && caps.editable !== false;
  var navigable = !disabled && caps.navigable !== false;
  var expandable = !disabled && !loading && caps.expandable !== false;
  var selectable = !disabled && !loading && (!readOnly || caps.selectWhenReadOnly === true) && caps.selectable !== false;
  var checkable = !disabled && !loading && !readOnly && caps.checkable !== false;
  var clearable = activatable && !readOnly && caps.clearable !== false;
  var draggable = activatable && !readOnly && caps.draggable !== false;
  var droppable = !disabled && !loading && caps.droppable !== false;
  return Object.freeze({
    disabled: disabled, readOnly: readOnly, loading: loading,
    focusable: focusable, tabbable: tabbable, navigable: navigable,
    activatable: activatable, editable: editable, expandable: expandable,
    selectable: selectable, checkable: checkable, clearable: clearable,
    draggable: draggable, droppable: droppable, preserveFocus: preserveFocus
  });
}
function canActivate(state, capabilities) { return resolve(state, capabilities).activatable; }
function canEdit(state, capabilities) { return resolve(state, capabilities).editable; }
function canNavigate(state, capabilities) { return resolve(state, capabilities).navigable; }
function canFocus(state, capabilities) { return resolve(state, capabilities).focusable; }
function canSelect(state, capabilities) { return resolve(state, capabilities).selectable; }
function canCheck(state, capabilities) { return resolve(state, capabilities).checkable; }
function canExpand(state, capabilities) { return resolve(state, capabilities).expandable; }
function canDrag(state, capabilities) { return resolve(state, capabilities).draggable; }
function canDrop(state, capabilities) { return resolve(state, capabilities).droppable; }
function stateFromOptions(options) {
  var source = options || {};
  return { disabled: source.disabled === true, readOnly: source.readOnly === true, loading: source.loading === true || source.busy === true };
}
function mutationLocked(options, capabilities) {
  var policy = resolve(stateFromOptions(options), capabilities || {});
  return !policy.editable;
}
function activationLocked(options, capabilities) {
  return !resolve(stateFromOptions(options), capabilities || {}).activatable;
}
function selectionLocked(options, capabilities) {
  return !resolve(stateFromOptions(options), capabilities || {}).selectable;
}

export const InteractionPolicy = Object.freeze({ resolve, stateFromOptions, mutationLocked, activationLocked, selectionLocked, canActivate, canEdit, canNavigate, canFocus, canSelect, canCheck, canExpand, canDrag, canDrop });
export { resolve, stateFromOptions, mutationLocked, activationLocked, selectionLocked, canActivate, canEdit, canNavigate, canFocus, canSelect, canCheck, canExpand, canDrag, canDrop };
