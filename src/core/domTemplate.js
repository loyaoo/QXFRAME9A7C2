// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

const global = globalThis;

var REF_ATTRIBUTE = 'data-qxframe9a7c2-ref';
  var SLOT_ATTRIBUTE = 'data-qxframe9a7c2-slot';

  function normalizeMarkerName(value, label) {
    var name = String(value || '').trim();
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
      throw new Error('[QXFRAME9A7C2] DOMTemplate invalid ' + label + ' marker: ' + name);
    }
    return name.replace(/-([a-z0-9])/g, function (_, letter) { return letter.toUpperCase(); });
  }

  function pathTo(node, boundary) {
    var path = [];
    var current = node;
    while (current && current !== boundary) {
      var parent = current.parentNode;
      if (!parent) throw new Error('[QXFRAME9A7C2] DOMTemplate marker escaped template boundary.');
      var index = 0;
      while (parent.childNodes[index] !== current) index += 1;
      path.unshift(index);
      current = parent;
    }
    return path;
  }

  function resolvePath(boundary, path) {
    var current = boundary;
    for (var i = 0; i < path.length; i += 1) {
      current = current && current.childNodes ? current.childNodes[path[i]] : null;
    }
    if (!current) throw new Error('[QXFRAME9A7C2] DOMTemplate cached node path could not be resolved.');
    return current;
  }

  function walk(node, visit) {
    var child = node.firstChild;
    while (child) {
      visit(child);
      if (child.firstChild) walk(child, visit);
      child = child.nextSibling;
    }
  }

  function createBlueprint(markup) {
    if (typeof markup !== 'string' || !markup.trim()) throw new TypeError('[QXFRAME9A7C2] DOMTemplate requires non-empty static HTML.');
    var perDocument = new WeakMap();

    function compile(documentRef) {
      if (!documentRef || typeof documentRef.createElement !== 'function') throw new TypeError('[QXFRAME9A7C2] DOMTemplate requires a browser Document.');
      var record = perDocument.get(documentRef);
      if (record) return record;
      var template = documentRef.createElement('template');
      if (!template || !('content' in template)) throw new Error('[QXFRAME9A7C2] Native <template> support is required.');
      template.innerHTML = markup;
      var boundary = template.content;
      var refPaths = Object.create(null);
      var slotPaths = Object.create(null);
      walk(boundary, function (node) {
        if (node.nodeType !== 1) return;
        if (node.hasAttribute(REF_ATTRIBUTE)) {
          var refName = normalizeMarkerName(node.getAttribute(REF_ATTRIBUTE), 'ref');
          if (refPaths[refName]) throw new Error('[QXFRAME9A7C2] DOMTemplate duplicate ref: ' + refName);
          refPaths[refName] = pathTo(node, boundary);
          node.removeAttribute(REF_ATTRIBUTE);
        }
        if (node.hasAttribute(SLOT_ATTRIBUTE)) {
          var slotName = normalizeMarkerName(node.getAttribute(SLOT_ATTRIBUTE), 'slot');
          if (slotPaths[slotName]) throw new Error('[QXFRAME9A7C2] DOMTemplate duplicate slot: ' + slotName);
          slotPaths[slotName] = pathTo(node, boundary);
          node.removeAttribute(SLOT_ATTRIBUTE);
        }
        Array.prototype.slice.call(node.attributes || []).forEach(function (attribute) {
          var name = String(attribute && attribute.name || '').toLowerCase();
        });
      });
      if (!refPaths.root) throw new Error('[QXFRAME9A7C2] DOMTemplate requires data-qxframe9a7c2-ref="root".');
      var rootNode = resolvePath(boundary, refPaths.root);
      if (rootNode.parentNode !== boundary || rootNode.nodeType !== 1) throw new Error('[QXFRAME9A7C2] DOMTemplate root ref must mark one top-level Element.');
      var elementRoots = 0;
      for (var n = boundary.firstChild; n; n = n.nextSibling) if (n.nodeType === 1) elementRoots += 1;
      if (elementRoots !== 1) throw new Error('[QXFRAME9A7C2] DOMTemplate canonical blueprint requires exactly one top-level Element.');
      record = {template: template, refPaths: refPaths, slotPaths: slotPaths, compileCount: 1, instanceCount: 0};
      perDocument.set(documentRef, record);
      return record;
    }

    function instantiate(documentRef) {
      var record = compile(documentRef);
      var fragment = record.template.content.cloneNode(true);
      var refs = Object.create(null);
      var slots = Object.create(null);
      Object.keys(record.refPaths).forEach(function (name) { refs[name] = resolvePath(fragment, record.refPaths[name]); });
      Object.keys(record.slotPaths).forEach(function (name) { slots[name] = resolvePath(fragment, record.slotPaths[name]); });
      if (refs.root.parentNode === fragment) fragment.removeChild(refs.root);
      record.instanceCount += 1;
      return {root: refs.root, refs: refs, slots: slots, ownedRoot: true};
    }

    function getStats(documentRef) {
      var record = perDocument.get(documentRef);
      return Object.freeze({compileCount: record ? record.compileCount : 0, instanceCount: record ? record.instanceCount : 0});
    }

    return Object.freeze({instantiate: instantiate, getStats: getStats});
  }

  function staticHTML(strings) {
    if (!Array.isArray(strings) || !Object.prototype.hasOwnProperty.call(strings, 'raw')) throw new TypeError('[QXFRAME9A7C2] DOMTemplate.staticHTML must be used as a tagged template literal.');
    if (arguments.length !== 1 || strings.length !== 1) throw new Error('[QXFRAME9A7C2] DOMTemplate.staticHTML forbids JavaScript interpolation.');
    return createBlueprint(String(strings[0]));
  }

export const DOMTemplate = Object.freeze({ staticHTML });
export { staticHTML };
