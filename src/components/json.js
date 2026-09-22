// Stage 88→92/legacy-tail: canonical ESM json authority extracted from frozen HOTFIX6.
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { KeyboardRegion } from '../core/keyboardRegion.js';
import { Utils } from '../utils/utils.js';
import { Tree } from './tree.js';

const global = globalThis;

var REMOVED_OPTIONS = Object.freeze(['target', 'el', 'mount']);
var SUPPORTED_OPTIONS = Object.freeze(['container','document','data','collapsed','sortKeys','toolbar','copy','maxDepth','indent','showLine','virtual','virtualThreshold','height','maxHeight','editable','readOnly','onChange']);
var own = Utils.own;
function rejectRemoved(options) {
  Object.keys(options || {}).forEach(function (name) {
    if (REMOVED_OPTIONS.indexOf(name) >= 0) throw new TypeError('[QXFRAME9A7C2] JSON removed option "' + name + '".');
    if (SUPPORTED_OPTIONS.indexOf(name) < 0) throw new TypeError('[QXFRAME9A7C2] JSON unsupported option "' + name + '".');
  });
}
function normalizeDepth(value) {
  if (value === undefined || value === null || value === Infinity) return Infinity;
  var number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] JSON maxDepth must be a non-negative integer or Infinity.');
  return number;
}
function normalizeIndent(value) {
  var number = Number(value === undefined || value === null ? 2 : value);
  if (!Number.isInteger(number) || number < 0 || number > 10) throw new TypeError('[QXFRAME9A7C2] JSON indent must be an integer from 0 to 10.');
  return number;
}
function normalizeOptions(options, previous) {
  var source = Object.assign({}, previous || {}, options || {});
  rejectRemoved(options || {});
  source.collapsed = source.collapsed === true;
  source.sortKeys = source.sortKeys === true;
  source.toolbar = source.toolbar !== false;
  source.copy = source.copy !== false;
  source.maxDepth = normalizeDepth(source.maxDepth);
  source.indent = normalizeIndent(source.indent);
  source.editable = source.editable === true;
  source.readOnly = source.readOnly === true;
  if (source.onChange !== undefined && source.onChange !== null && typeof source.onChange !== 'function') throw new TypeError('[QXFRAME9A7C2] JSON onChange must be a function or null.');
  return source;
}
function valueClass(value) {
  if (value === null) return 'qxframe9a7c2-json-null';
  if (typeof value === 'string') return 'qxframe9a7c2-json-string';
  if (typeof value === 'number') return 'qxframe9a7c2-json-number';
  if (typeof value === 'boolean') return 'qxframe9a7c2-json-boolean';
  return 'qxframe9a7c2-json-meta';
}
function primitive(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return global.JSON.stringify(value);
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
  if (typeof value === 'bigint') return String(value) + 'n';
  return String(value);
}
function escapePathKey(key) { return String(key).replace(/~/g, '~0').replace(/\//g, '~1'); }
function unescapePathKey(key) { return String(key).replace(/~1/g, '/').replace(/~0/g, '~'); }
function pathSegments(path) {
  var text = String(path || '$');
  if (text === '$') return [];
  if (text.slice(0, 2) !== '$/') return null;
  return text.slice(2).split('/').map(unescapePathKey);
}
function jsonEditablePrimitive(value) { return value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)); }
    
function create(options) {
  var opts = normalizeOptions(Object.assign({ data: null, collapsed: false, maxDepth: Infinity, sortKeys: false, toolbar: true, copy: true, indent: 2, showLine: true, editable: false, readOnly: false }, options || {}));
  if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] JSON container must be an Element.');
  var doc = opts.document || opts.container.ownerDocument || global.document;
  opts.document = doc;
    
  var root = doc.createElement('div');
  var toolbar = doc.createElement('div');
  var treeHost = doc.createElement('div');
  var tree = null;
  var scope = Lifecycle.createScope();
  var keyboard = null;
  var regionController = null;
  var toolbarDomain = null;
  var keyboardZone = 'tree';
  var editSession = null;
  var pendingEditKey = null;
  var pendingEditReason = null;
  var treeRenderDispose = null;
  var treeVirtualRenderDispose = null;
  var destroyed = false;
  var api = null;
    
  root.className = 'qxframe9a7c2-json-root';
  root.tabIndex = 0;
  root.classList.toggle('is-editable', opts.editable === true && opts.readOnly !== true);
  toolbar.className = 'qxframe9a7c2-json-toolbar';
  treeHost.className = 'qxframe9a7c2-json-tree';
  root.appendChild(treeHost); opts.container.appendChild(root);
  scope.add(DOM.listen(root, 'keydown', handleEditorKeydownCapture, true));
    
  function keysOf(value) {
    var keys = Array.isArray(value) ? value.map(function (_, index) { return String(index); }) : Object.keys(value || {});
    return opts.sortKeys && !Array.isArray(value) ? keys.sort() : keys;
  }
  function makeNode(value, key, path, depth) {
    var objectLike = !!value && typeof value === 'object';
    var truncated = objectLike && depth >= opts.maxDepth;
    var keys = objectLike && !truncated ? keysOf(value) : [];
    var kind = Array.isArray(value) ? 'array' : (objectLike ? 'object' : 'primitive');
    var label = key === null ? '$' : String(key);
    var item = { key: path, value: path, label: label, jsonKey: key, raw: value, kind: kind, count: keys.length, truncated: truncated, depth: depth, items: [] };
    if (objectLike && !truncated) {
      item.items = keys.map(function (childKey) { return makeNode(value[childKey], childKey, path + '/' + escapePathKey(childKey), depth + 1); });
    }
    return item;
  }
  function treeItems() { return [makeNode(opts.data, null, '$', 0)]; }
  function branchKeys(items, output) {
    (items || []).forEach(function (item) { if (item.items && item.items.length) { output.push(String(item.key)); branchKeys(item.items, output); } });
    return output;
  }
  function makePrimitiveEditor(item) {
    var input = doc.createElement('input');
    var text = primitive(item.raw);
    input.type = 'text';
    input.tabIndex = -1;
    DOM.configureTextInput(input, 'text');
    input.className = 'qxframe9a7c2-json-editor ' + valueClass(item.raw);
    input.value = text;
    input.size = Math.max(1, Math.min(48, text.length + 1));
    DOM.setPrivate(input, 'jsonEditKey', String(item.key));
    scope.add(DOM.listen(input, 'focus', function (event) { beginEdit(String(item.key), 'json-edit-pointer', event, input, 'pointer'); }));
    scope.add(DOM.listen(input, 'input', function () { input.classList.remove('is-invalid'); }));
    scope.add(DOM.listen(input, 'blur', function (event) { if (editSession && editSession.key === String(item.key) && editSession.editor === input) commitEdit('json-edit-blur', event, false); }));
    return input;
  }
  function renderTreeItem(item) {
    var row = doc.createElement('span');
    row.className = 'qxframe9a7c2-json-row';
    if (item.jsonKey !== null) {
      var key = doc.createElement('span'); key.className = 'qxframe9a7c2-json-key'; key.textContent = global.JSON.stringify(String(item.jsonKey)) + ': '; row.appendChild(key);
    }
    var value = null;
    if (item.kind === 'array') { value = doc.createElement('span'); value.className = 'qxframe9a7c2-json-meta qxframe9a7c2-json-collection'; value.textContent = item.truncated ? '[ … ]  // ' + (Array.isArray(item.raw) ? item.raw.length : 0) + ' items' : '[  ' + item.count + (item.count === 1 ? ' item' : ' items') + '  ]'; }
    else if (item.kind === 'object') { value = doc.createElement('span'); value.className = 'qxframe9a7c2-json-meta qxframe9a7c2-json-collection'; value.textContent = item.truncated ? '{ … }' : '{  ' + item.count + (item.count === 1 ? ' key' : ' keys') + '  }'; }
    else if (opts.editable === true && opts.readOnly !== true && jsonEditablePrimitive(item.raw)) value = makePrimitiveEditor(item);
    else { value = doc.createElement('span'); value.className = valueClass(item.raw); value.textContent = primitive(item.raw); }
    row.appendChild(value);
    return row;
  }
  function editorFromEvent(event) {
    var target = event && event.target;
    var editor = target && target.closest ? target.closest('.qxframe9a7c2-json-editor') : null;
    return editor && root && root.contains(editor) ? editor : null;
  }
  function handleEditorKeydownCapture(event) {
    var editor = editorFromEvent(event);
    if (!editor) return;
    /* Tree and ItemCollection own capture-phase navigation below this root. Shield
       the temporary native editor before those owners see the key. stopPropagation
       preserves the browser default (text/caret/Tab/IME); only explicit edit
       commands preventDefault. */
    if (!event || DOM.isComposingEvent(event)) { if (event && event.stopPropagation) event.stopPropagation(); return; }
    if (event.key === 'Enter') {
      if (event.preventDefault) event.preventDefault(); if (event.stopPropagation) event.stopPropagation(); commitEdit('json-edit-enter', event, true); return;
    }
    if (event.key === 'Escape') {
      if (event.preventDefault) event.preventDefault(); if (event.stopPropagation) event.stopPropagation(); cancelEdit('json-edit-escape', event, true); return;
    }
    if (event.key === 'F6') {
      if (event.preventDefault) event.preventDefault(); if (event.stopPropagation) event.stopPropagation();
      if (commitEdit('json-edit-f6', event, true)) {
        if (event.shiftKey) activateTreeCursor('json-edit-f6-back', event);
        else if (opts.toolbar !== false && toolbarButtons().length) moveToolbar(1, 'first');
        else activateTreeCursor('json-edit-f6-tree', event);
      }
      return;
    }
    if (event.stopPropagation) event.stopPropagation();
  }
    
  function clipboard() {
    var nav = doc.defaultView && doc.defaultView.navigator ? doc.defaultView.navigator : global.navigator;
    return nav && nav.clipboard && typeof nav.clipboard.writeText === 'function' ? nav.clipboard : null;
  }
  function makeToolbarButton(key, text, action, extraClass) {
    var button = doc.createElement('button'); button.type = 'button'; button.tabIndex = -1; button.className = 'qxframe9a7c2-json-action qxframe9a7c2-button is-default is-outlined is-sm' + (extraClass ? ' ' + extraClass : ''); button.textContent = text; button.setAttribute('data-json-action', key);
    scope.add(DOM.listen(button, 'pointerdown', function (event) { if (event.preventDefault) event.preventDefault(); DOM.focusElement(root, { preventScroll:true }); keyboardZone = 'toolbar'; if (toolbarDomain) toolbarDomain.activate(key, { source:'pointer', reason:'json-toolbar-pointer', originalEvent:event, ensureVisible:false }); }));
    scope.add(DOM.listen(button, 'click', action)); return button;
  }
  function renderToolbar() {
    toolbar.replaceChildren();
    if (opts.toolbar === false) { if (toolbar.parentNode) toolbar.parentNode.removeChild(toolbar); return; }
    if (toolbar.parentNode !== root || toolbar.nextSibling !== treeHost) root.insertBefore(toolbar, treeHost);
    toolbar.appendChild(makeToolbarButton('expand', '展开全部', function () { api.expandAll(); }));
    toolbar.appendChild(makeToolbarButton('collapse', '折叠全部', function () { api.collapseAll(); }));
    if (opts.copy !== false && clipboard()) toolbar.appendChild(makeToolbarButton('copy', '复制 JSON', function () { api.copy(); }, 'qxframe9a7c2-json-copy'));
    if (toolbarDomain) toolbarDomain.refresh({ reconcile:true });
  }
  function cloneObject(object) {
    var output = Object.getPrototypeOf(object) === null ? Object.create(null) : {};
    Object.keys(object).forEach(function (key) { Object.defineProperty(output, key, { value: object[key], writable: true, enumerable: true, configurable: true }); });
    return output;
  }
  function replaceValueAtPath(source, path, value) {
    var segments = pathSegments(path);
    if (!segments) throw new TypeError('[QXFRAME9A7C2] JSON edit path must use canonical $/segment syntax.');
    function visit(current, index) {
      if (index >= segments.length) return value;
      if (!current || typeof current !== 'object') throw new Error('[QXFRAME9A7C2] JSON edit path no longer exists.');
      var key = segments[index], output;
      if (Array.isArray(current)) {
        var arrayIndex = Number(key);
        if (!Number.isInteger(arrayIndex) || arrayIndex < 0 || arrayIndex >= current.length || String(arrayIndex) !== String(key)) throw new Error('[QXFRAME9A7C2] JSON edit array path is invalid.');
        output = current.slice(); output[arrayIndex] = visit(current[arrayIndex], index + 1); return output;
      }
      if (!own(current, key)) throw new Error('[QXFRAME9A7C2] JSON edit object path no longer exists.');
      output = cloneObject(current); Object.defineProperty(output, key, { value: visit(current[key], index + 1), writable: true, enumerable: true, configurable: true }); return output;
    }
    return visit(source, 0);
  }
  function editableItem(key) {
    if (opts.editable !== true || opts.readOnly === true || !tree) return null;
    var item = tree.getItem(String(key || ''));
    return item && item.kind === 'primitive' && jsonEditablePrimitive(item.raw) ? item : null;
  }
  function editElement(key) {
    if (!tree || !tree.getList) return null;
    var list = tree.getList(), row = list && list.getItemElement ? list.getItemElement(String(key || '')) : null;
    if (!row) return null;
    var editor = row.querySelector('.qxframe9a7c2-json-editor');
    return editor && DOM.getPrivate(editor, 'jsonEditKey') === String(key || '') ? editor : null;
  }
  function activateTreeKey(key, source, reason, event, ensureVisible) {
    if (!tree || !key) return false;
    tree.setActiveKey(String(key), { source: source || 'keyboard', reason: reason || 'json-tree-active', originalEvent: event || null });
    var domain = tree.getVirtualFocusDomain && tree.getVirtualFocusDomain();
    if (domain) domain.activate(String(key), { source: source || 'keyboard', reason: reason || 'json-tree-active', originalEvent: event || null, ensureVisible: ensureVisible !== false });
    keyboardZone = 'tree';
    return true;
  }
  function beginEdit(key, reason, event, knownEditor, source) {
    key = String(key || '');
    var item = editableItem(key);
    if (!item) return false;
    if (editSession && editSession.key === key && editSession.editor && editSession.editor.isConnected !== false) return true;
    activateTreeKey(key, source || 'keyboard', reason || 'json-edit-enter', event, true);
    var editor = knownEditor || editElement(key);
    if (!editor) { pendingEditKey = key; pendingEditReason = reason || 'json-edit-pending'; return true; }
    pendingEditKey = null; pendingEditReason = null;
    editSession = { key: key, editor: editor };
    editor.classList.add('is-editing'); editor.classList.remove('is-invalid');
    if (doc.activeElement !== editor && !DOM.focusElement(editor, { preventScroll: true })) { editSession = null; return false; }
    if ((source || 'keyboard') === 'keyboard' && typeof editor.select === 'function') editor.select();
    return true;
  }
  function completePendingEdit() {
    if (!pendingEditKey || destroyed) return false;
    var key = pendingEditKey, editor = editElement(key);
    if (!editor) return false;
    var reason = pendingEditReason; pendingEditKey = null; pendingEditReason = null;
    return beginEdit(key, reason || 'json-edit-mounted', null, editor, 'keyboard');
  }
  function bindTreeRenderSignals() {
    if (treeRenderDispose) treeRenderDispose();
    if (treeVirtualRenderDispose) treeVirtualRenderDispose();
    treeRenderDispose = null; treeVirtualRenderDispose = null;
    if (!tree || !tree.getList) return false;
    var list = tree.getList();
    if (!list) return false;
    if (list.on) treeRenderDispose = list.on('render', function () { completePendingEdit(); });
    var virtualList = list.getVirtualList && list.getVirtualList();
    if (virtualList && virtualList.on) treeVirtualRenderDispose = virtualList.on('render', function () { completePendingEdit(); });
    return true;
  }
  function emitChange(nextData, detail) {
    if (typeof opts.onChange === 'function') opts.onChange(nextData, Object.freeze(Object.assign({ data: nextData, json: api }, detail || {})));
  }
  function commitEdit(reason, event, restoreFocus) {
    if (!editSession) return false;
    var session = editSession, item = editableItem(session.key), editor = session.editor;
    if (!item || !editor) { editSession = null; return false; }
    var nextValue;
    try { nextValue = global.JSON.parse(String(editor.value)); }
    catch (_) {
      editor.classList.add('is-invalid');
      if (reason === 'json-edit-blur') { editor.value = primitive(item.raw); editor.classList.remove('is-invalid','is-editing'); editSession = null; }
      return false;
    }
    var previousValue = item.raw, key = session.key, nextData;
    try { nextData = replaceValueAtPath(opts.data, key, nextValue); }
    catch (_) { editor.classList.add('is-invalid'); return false; }
    editSession = null; pendingEditKey = null; pendingEditReason = null;
    opts.data = nextData;
    if (tree) tree.setItems(treeItems(), { source: 'json', reason: reason || 'json-edit-commit' });
    if (restoreFocus !== false) { DOM.focusElement(root, { preventScroll: true }); activateTreeKey(key, 'keyboard', reason || 'json-edit-commit', event, true); }
    emitChange(nextData, { path: key, previousValue: previousValue, value: nextValue, source: 'edit', reason: reason || 'json-edit-commit', originalEvent: event || null });
    return true;
  }
  function cancelEdit(reason, event, restoreFocus) {
    if (!editSession) return false;
    var session = editSession, item = editableItem(session.key), key = session.key, editor = session.editor;
    editSession = null; pendingEditKey = null; pendingEditReason = null;
    if (editor && item) { editor.value = primitive(item.raw); editor.classList.remove('is-invalid','is-editing'); }
    if (restoreFocus !== false) { DOM.focusElement(root, { preventScroll: true }); activateTreeKey(key, 'keyboard', reason || 'json-edit-cancel', event, true); }
    return true;
  }
  function activeTreeKey() { var state = tree ? tree.getState() : null; return state && state.activeKey ? String(state.activeKey) : ''; }
    
  function treeOptions(items) {
    return {
      container: treeHost,
      items: items,
      selectable: false,
      checkable: false,
      expandOnRowClick: true,
      showLine: opts.showLine !== false,
      blockNode: true,
      keyboardFocusOwner: root,
      defaultExpandedKeys: opts.collapsed ? [] : branchKeys(items, []),
      virtual: opts.virtual,
      virtualThreshold: opts.virtualThreshold,
      height: opts.height,
      maxHeight: opts.maxHeight,
      itemRender: function (item, ctx) { return renderTreeItem(item); }
    };
  }
  function syncTree(reason) {
    var items = treeItems();
    if (!tree) {
      tree = Tree.create(treeOptions(items));
      if (keyboard && tree.bindVirtualFocus) tree.bindVirtualFocus(keyboard.virtualFocus);
      bindTreeRenderSignals();
      return tree;
    }
    tree.updateOptions({
      selectable: false,
      checkable: false,
      expandOnRowClick: true,
      showLine: opts.showLine !== false,
      blockNode: true,
      keyboardFocusOwner: root,
      virtual: opts.virtual,
      virtualThreshold: opts.virtualThreshold,
      height: opts.height,
      maxHeight: opts.maxHeight,
      itemRender: function (item, ctx) { return renderTreeItem(item); }
    });
    tree.setItems(items, { source: 'json', reason: reason || 'json-sync' });
    bindTreeRenderSignals();
    return tree;
  }
  function toolbarButtons() { return Array.prototype.slice.call(toolbar.querySelectorAll('.qxframe9a7c2-json-action:not(:disabled)')); }
  function toolbarKey(button) { return button && button.getAttribute ? String(button.getAttribute('data-json-action') || '') : ''; }
  function toolbarElement(key) { var buttons=toolbarButtons(); for(var i=0;i<buttons.length;i+=1) if(toolbarKey(buttons[i])===String(key||'')) return buttons[i]; return null; }
  function toolbarReconcile(key) { var buttons=toolbarButtons(); if(!buttons.length)return null; var current=toolbarElement(key); return current?toolbarKey(current):toolbarKey(buttons[0]); }
  function moveToolbar(delta, edge) {
    var buttons=toolbarButtons(); if(!buttons.length)return false;
    var state=keyboard.virtualFocus.getState(); var current=state.domain==='json-toolbar'?toolbarElement(state.key):null; var index=current?buttons.indexOf(current):-1;
    if(edge==='first')index=0; else if(edge==='last')index=buttons.length-1; else { if(index<0)index=delta<0?buttons.length-1:0; else index=Math.max(0,Math.min(buttons.length-1,index+delta)); }
    keyboardZone='toolbar'; return toolbarDomain.activate(toolbarKey(buttons[index]),{source:'keyboard',reason:'json-toolbar-nav',ensureVisible:true});
  }
  function activateTreeCursor(reason,event) {
    if(!tree)return false; keyboardZone='tree'; var state=tree.getState(); var key=state.activeKey || (state.visibleKeys&&state.visibleKeys[0]) || null;
    var domain=tree.getVirtualFocusDomain&&tree.getVirtualFocusDomain(); if(key&&domain)domain.activate(key,{source:'keyboard',reason:reason||'json-tree-region',originalEvent:event||null,ensureVisible:true});
    return !!key;
  }
  function cycleKeyboardRegion(backward,event) {
    if(opts.toolbar===false||!toolbarButtons().length){return activateTreeCursor('json-region-tree',event);}
    if(keyboardZone==='tree'){ return moveToolbar(backward?-1:1, backward?'last':'first'); }
    return activateTreeCursor('json-region-tree',event);
  }
  regionController = KeyboardRegion.create({
    root:root,
    navigation:{
      focusRoot:root,
      allowEditableKey:function(){return false;},
      handlers:{
        F6:function(ctx){return cycleKeyboardRegion(ctx.originalEvent&&ctx.originalEvent.shiftKey,ctx.originalEvent);},
        ArrowLeft:function(ctx){if(keyboardZone==='toolbar')return moveToolbar(-1);return tree?tree.handleKeydown(ctx.originalEvent):false;},
        ArrowRight:function(ctx){if(keyboardZone==='toolbar')return moveToolbar(1);return tree?tree.handleKeydown(ctx.originalEvent):false;},
        ArrowUp:function(ctx){if(keyboardZone==='toolbar')return false;return tree?tree.handleKeydown(ctx.originalEvent):false;},
        ArrowDown:function(ctx){if(keyboardZone==='toolbar')return false;return tree?tree.handleKeydown(ctx.originalEvent):false;},
        Home:function(ctx){if(keyboardZone==='toolbar')return moveToolbar(0,'first');return tree?tree.handleKeydown(ctx.originalEvent):false;},
        End:function(ctx){if(keyboardZone==='toolbar')return moveToolbar(0,'last');return tree?tree.handleKeydown(ctx.originalEvent):false;},
        PageUp:function(ctx){return keyboardZone==='tree'&&tree?tree.handleKeydown(ctx.originalEvent):false;},
        PageDown:function(ctx){return keyboardZone==='tree'&&tree?tree.handleKeydown(ctx.originalEvent):false;},
        Enter:function(ctx){if(keyboardZone==='toolbar'){var state=keyboard.virtualFocus.getState(),button=toolbarElement(state.key);if(button){button.click();return true;}return false;}var key=activeTreeKey();if(opts.editable===true&&key&&beginEdit(key,'json-edit-enter',ctx.originalEvent,null,'keyboard'))return true;return tree?tree.handleKeydown(ctx.originalEvent):false;},
        F2:function(ctx){if(keyboardZone!=='tree'||opts.editable!==true)return false;var key=activeTreeKey();return key?beginEdit(key,'json-edit-f2',ctx.originalEvent,null,'keyboard'):false;},
        ' ':function(ctx){if(keyboardZone==='toolbar'){var state=keyboard.virtualFocus.getState(),button=toolbarElement(state.key);if(button){button.click();return true;}return false;}return tree?tree.handleKeydown(ctx.originalEvent):false;},
        Escape:function(){if(keyboardZone==='toolbar'){keyboardZone='tree';keyboard.virtualFocus.clear({reason:'json-toolbar-escape'});return true;}return false;}
      }
    },
    onEnter:function(detail){ activateTreeCursor('json-region-enter', detail.originalEvent); }
  });
  keyboard = regionController.keyboard;
  toolbarDomain = keyboard.virtualFocus.registerDomain({name:'json-toolbar',getElement:toolbarElement,reconcile:toolbarReconcile,ensureVisible:function(){return true;}});
  scope.add(function(){ if(toolbarDomain) toolbarDomain.destroy(); toolbarDomain=null; if(regionController) regionController.destroy(); regionController=null; keyboard=null; });
    
  function render(reason) {
    if (destroyed) return false;
    root.classList.toggle('is-editable', opts.editable === true && opts.readOnly !== true);
    syncTree(reason); renderToolbar(); completePendingEdit(); return api;
  }
  function serialize() {
    try { var output = global.JSON.stringify(opts.data, null, opts.indent); return output === undefined ? String(opts.data) : output; }
    catch (_) { return String(opts.data); }
  }
  function setData(data) { if (destroyed) return false; if (editSession) cancelEdit('json-set-data', null, true); opts.data = data; render('set-data'); return api; }
  function copy() { if (destroyed) return Promise.resolve(false); var target = clipboard(); if (!target) return Promise.resolve(api); return target.writeText(serialize()).then(function () { return api; }); }
  function updateOptions(nextOptions) {
    if (destroyed) return false;
    var next = nextOptions || {}; rejectRemoved(next);
    if (own(next, 'container') && next.container !== opts.container) throw new Error('[QXFRAME9A7C2] JSON container is immutable.');
    if (own(next, 'document') && next.document !== opts.document) throw new Error('[QXFRAME9A7C2] JSON document is immutable.');
    var hadCollapsed = own(next, 'collapsed'), normalized = normalizeOptions(next, opts);
    if (editSession) cancelEdit('json-options-update', null, true);
    opts = normalized; render('update-options');
    if (hadCollapsed && tree) {
      if (opts.collapsed) tree.collapseAll({ source: 'json', reason: 'collapsed-option' });
      else tree.expandAll({ source: 'json', reason: 'collapsed-option' });
    }
    return api;
  }
  function getState() {
    var state = tree ? tree.getState() : { expandedKeys: [], visibleKeys: [] };
    var totalBranches = tree ? branchKeys(treeItems(), []).length : 0;
    return Object.freeze({ data: opts.data, collapsed: opts.collapsed, maxDepth: opts.maxDepth, sortKeys: opts.sortKeys, toolbar: opts.toolbar, copy: opts.copy, indent: opts.indent, editable: opts.editable === true, readOnly: opts.readOnly === true, activePath: state.activeKey || null, editingPath: editSession ? editSession.key : null, detailCount: totalBranches, expandedCount: state.expandedKeys.length, visibleCount: state.visibleKeys.length, destroyed: destroyed });
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true; pendingEditKey = null; pendingEditReason = null; editSession = null; if(treeRenderDispose)treeRenderDispose();treeRenderDispose=null;if(treeVirtualRenderDispose)treeVirtualRenderDispose();treeVirtualRenderDispose=null;scope.dispose();toolbarDomain=null;regionController=null;keyboard=null;if (tree) tree.destroy('json-destroy'); tree = null; DOM.removeNode(root); root = toolbar = treeHost = null; return true;
  }
    
  api = Object.freeze({
    setData: setData,
    getData: function () { return opts.data; },
    toJSON: serialize,
    expandAll: function () { if (tree) tree.expandAll({ source: 'api', reason: 'json-expand-all' }); return api; },
    collapseAll: function () { if (tree) tree.collapseAll({ source: 'api', reason: 'json-collapse-all' }); return api; },
    copy: copy,
    enterEdit: function (path) { var key = path === undefined || path === null ? activeTreeKey() : String(path); if (!key || !editableItem(key)) return false; DOM.focusElement(root, { preventScroll: true }); return beginEdit(key, 'json-enter-edit', null, null, 'keyboard'); },
    commitEdit: function () { return commitEdit('json-commit-edit', null, true); },
    cancelEdit: function () { return cancelEdit('json-cancel-edit', null, true); },
    getEditElement: function (path) { var key = path === undefined || path === null ? activeTreeKey() : String(path); return key ? editElement(key) : null; },
    updateOptions: updateOptions,
    getState: getState,
    getTree: function () { return tree; },
    getKeyboardNavigation: function () { return keyboard; },
    getKeyboardRegion: function () { return regionController; },
    getRootElement: function () { return root; },
    getTreeElement: function () { return tree ? tree.getRootElement() : null; },
    getToolbarElement: function () { return toolbar; },
    destroy: destroy
  });
  render('initial'); return api;
}

export const JSONComponent = Object.freeze({
    definition: Object.freeze({ initializer: Object.freeze({ mode: 'create', bind: 'container' }) }),
    create
});
export { JSONComponent as JSON, create };
export default JSONComponent;
