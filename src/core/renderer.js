// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';

const global = globalThis;

function isNodeLike(value) {
    return !!value && typeof value === 'object' && typeof value.nodeType === 'number';
  }
  function isOwnedInstance(value) {
    return !!value && typeof value === 'object' && typeof value.getRootElement === 'function' && typeof value.destroy === 'function';
  }
  function ownerForNode(node) {
    return node && DOM && typeof DOM.getPrivate === 'function' ? DOM.getPrivate(node, 'renderOwner') : null;
  }
  function outputNode(value) {
    if (isNodeLike(value)) return value;
    if (isOwnedInstance(value)) {
      var node = value.getRootElement();
      if (!isNodeLike(node)) throw new TypeError('[QXFRAME9A7C2] Render-owned component getRootElement() must return a Node.');
      return node;
    }
    if (value && typeof value === 'object' && isNodeLike(value.node) && typeof value.destroy === 'function') return value.node;
    return null;
  }
  function directOwner(value) {
    if (isOwnedInstance(value)) return value;
    if (value && typeof value === 'object' && isNodeLike(value.node) && typeof value.destroy === 'function') return value;
    var node = isNodeLike(value) ? value : null;
    return node ? ownerForNode(node) : null;
  }
  function collectNodeOwners(node, owners) {
    if (!node) return owners;
    var children = node.childNodes ? Array.prototype.slice.call(node.childNodes) : [];
    children.forEach(function (child) { collectNodeOwners(child, owners); });
    var owner = ownerForNode(node);
    if (owner && typeof owner.destroy === 'function' && owners.indexOf(owner) < 0) owners.push(owner);
    return owners;
  }
  function collectOutputOwners(output, owners) {
    owners = owners || [];
    if (Array.isArray(output)) { output.forEach(function (part) { collectOutputOwners(part, owners); }); return owners; }
    var owner = directOwner(output);
    if (owner && owners.indexOf(owner) < 0) owners.push(owner);
    var node = outputNode(output);
    if (node) collectNodeOwners(node, owners);
    return owners;
  }
  function disposeOwners(owners, keepOwners) {
    (owners || []).forEach(function (owner) {
      if (!owner || (keepOwners && keepOwners.indexOf(owner) >= 0) || typeof owner.destroy !== 'function') return;
      try { owner.destroy('renderer-replace'); } catch (error) { global.setTimeout(function () { throw error; }, 0); }
    });
  }
  function dispose(container, keepOutput) {
    if (!container) return false;
    var owners = [];
    Array.prototype.slice.call(container.childNodes || []).forEach(function (child) { collectNodeOwners(child, owners); });
    var keepOwners = keepOutput === undefined ? [] : collectOutputOwners(keepOutput, []);
    disposeOwners(owners, keepOwners);
    return owners.length > 0;
  }

  function append(container, output, documentRef) {
    if (!container || output == null || output === false) return container;
    var doc = documentRef || container.ownerDocument || global.document;

    if (Array.isArray(output)) {
      output.forEach(function (part) { append(container, part, doc); });
      return container;
    }

    var node = outputNode(output);
    if (node) {
      var owner = directOwner(output);
      if (owner && DOM && typeof DOM.setPrivate === 'function') DOM.setPrivate(node, 'renderOwner', owner);
      container.appendChild(node);
      return container;
    }

    if (!doc || typeof doc.createTextNode !== 'function') {
      throw new Error('Renderer requires a document with createTextNode() for primitive output');
    }

    container.appendChild(doc.createTextNode(String(output)));
    return container;
  }

  function replace(container, output, documentRef) {
    if (!container) return container;
    dispose(container, output);
    while (container.firstChild) container.removeChild(container.firstChild);
    return append(container, output, documentRef);
  }

  function cloneTemplate(template) {
    if (!template || !template.content || typeof template.content.cloneNode !== 'function') {
      throw new TypeError('Renderer.cloneTemplate(template) requires a native <template> element');
    }
    return template.content.cloneNode(true);
  }

export const Renderer = Object.freeze({ append, replace, dispose, cloneTemplate, isNodeLike, isOwnedInstance });
export { append, replace, dispose, cloneTemplate, isNodeLike, isOwnedInstance };
