
var activeProjections = 0, activeEntries = 0, writes = 0, dedupedWrites = 0, restores = 0, skippedRestores = 0;
  function sameStyle(left, right) { return !!left && !!right && left.value === right.value && left.priority === right.priority; }
  function create() {
    var entries = [];
    var entryIndex = typeof WeakMap === 'function' ? new WeakMap() : null;
    var destroyed = false;
    activeProjections += 1;
    function bucket(node) { var map = entryIndex && entryIndex.get(node); if (!map && entryIndex) { map = Object.create(null); entryIndex.set(node, map); } return map; }
    function entryKey(kind, name) { return kind + '\u0000' + name; }
    function indexed(node, kind, name) { var map = entryIndex && entryIndex.get(node); return map && map[entryKey(kind, name)] || null; }
    function indexEntry(entry) { var map = bucket(entry.node); if (map) map[entryKey(entry.kind, entry.name)] = entry; }
    function unindexEntry(entry) { var map = entryIndex && entryIndex.get(entry.node); if (map && map[entryKey(entry.kind, entry.name)] === entry) delete map[entryKey(entry.kind, entry.name)]; }
    function remember(node, kind, name, original, applied) {
      var entry = { node: node, kind: kind, name: name, original: original, applied: applied, active: true };
      entries.push(entry); indexEntry(entry); activeEntries += 1; return entry;
    }
    function current(entry) {
      var node = entry.node;
      if (entry.kind === 'style' && node && node.style) return { value: node.style.getPropertyValue(entry.name), priority: node.style.getPropertyPriority(entry.name) };
      if (entry.kind === 'attribute' && node && node.getAttribute) return { had: node.hasAttribute ? node.hasAttribute(entry.name) : node.getAttribute(entry.name) !== null, value: node.getAttribute(entry.name) };
      if (entry.kind === 'property' && node) return node[entry.name];
      if (entry.kind === 'class' && node && node.classList) return node.classList.contains(entry.name);
      return undefined;
    }
    function owns(entry) {
      if (!entry || !entry.active) return false;
      var value = current(entry);
      if (entry.kind === 'style') return sameStyle(value, entry.applied);
      if (entry.kind === 'attribute') return value && value.had === entry.applied.had && value.value === entry.applied.value;
      return value === entry.applied;
    }
    function abandon(entry) { if (!entry || !entry.active) return; entry.active = false; unindexEntry(entry); activeEntries = Math.max(0, activeEntries - 1); }
    function setStyle(node, name, value, priority) {
      if (destroyed || !node || !node.style) return false;
      var prop = String(name || ''); if (!prop) return false;
      var desired = { value: value == null || value === '' ? '' : String(value), priority: priority || '' };
      var existing = indexed(node, 'style', prop);
      if (existing && owns(existing)) {
        if (sameStyle(existing.applied, desired)) { dedupedWrites += 1; return false; }
        if (desired.value === '') node.style.removeProperty(prop); else node.style.setProperty(prop, desired.value, desired.priority);
        existing.applied = { value: node.style.getPropertyValue(prop), priority: node.style.getPropertyPriority(prop) }; writes += 1; return true;
      }
      if (existing) abandon(existing);
      var original = { value: node.style.getPropertyValue(prop), priority: node.style.getPropertyPriority(prop), had: node.style.getPropertyValue(prop) !== '' };
      if (original.value === desired.value && original.priority === desired.priority) { dedupedWrites += 1; return false; }
      if (desired.value === '') node.style.removeProperty(prop); else node.style.setProperty(prop, desired.value, desired.priority);
      remember(node, 'style', prop, original, { value: node.style.getPropertyValue(prop), priority: node.style.getPropertyPriority(prop) }); writes += 1; return true;
    }
    function setAttribute(node, name, value) {
      if (destroyed || !node || !node.getAttribute || !node.setAttribute) return false;
      var attr = String(name || ''); if (!attr) return false;
      var desired = value === undefined || value === null || value === false ? { had: false, value: null } : { had: true, value: String(value) };
      var existing = indexed(node, 'attribute', attr);
      if (existing && owns(existing)) {
        if (existing.applied.had === desired.had && existing.applied.value === desired.value) { dedupedWrites += 1; return false; }
        if (!desired.had) node.removeAttribute(attr); else node.setAttribute(attr, desired.value);
        existing.applied = { had: node.hasAttribute ? node.hasAttribute(attr) : node.getAttribute(attr) !== null, value: node.getAttribute(attr) }; writes += 1; return true;
      }
      if (existing) abandon(existing);
      var original = { had: node.hasAttribute ? node.hasAttribute(attr) : node.getAttribute(attr) !== null, value: node.getAttribute(attr) };
      if (original.had === desired.had && original.value === desired.value) { dedupedWrites += 1; return false; }
      if (!desired.had) node.removeAttribute(attr); else node.setAttribute(attr, desired.value);
      remember(node, 'attribute', attr, original, { had: node.hasAttribute ? node.hasAttribute(attr) : node.getAttribute(attr) !== null, value: node.getAttribute(attr) }); writes += 1; return true;
    }
    function setProperty(node, name, value) {
      if (destroyed || !node) return false;
      var prop = String(name || ''); if (!prop) return false;
      var existing = indexed(node, 'property', prop);
      if (existing && owns(existing)) {
        if (existing.applied === value) { dedupedWrites += 1; return false; }
        node[prop] = value; existing.applied = value; writes += 1; return true;
      }
      if (existing) abandon(existing);
      var original = { had: prop in node, value: node[prop] };
      if (original.value === value) { dedupedWrites += 1; return false; }
      node[prop] = value; remember(node, 'property', prop, original, value); writes += 1; return true;
    }
    function setClass(node, name, on) {
      if (destroyed || !node || !node.classList) return false;
      var className = String(name || ''); if (!className) return false;
      var desired = on !== false;
      var existing = indexed(node, 'class', className);
      if (existing && owns(existing)) {
        if (existing.applied === desired) { dedupedWrites += 1; return false; }
        node.classList.toggle(className, desired); existing.applied = desired; writes += 1; return true;
      }
      if (existing) abandon(existing);
      var original = node.classList.contains(className);
      if (original === desired) { dedupedWrites += 1; return false; }
      node.classList.toggle(className, desired); remember(node, 'class', className, original, desired); writes += 1; return true;
    }
    function restoreEntry(entry) {
      if (!entry || !entry.active) return false;
      if (!owns(entry)) { skippedRestores += 1; abandon(entry); return false; }
      var node = entry.node;
      if (entry.kind === 'style' && node.style) { if (entry.original.had) node.style.setProperty(entry.name, entry.original.value, entry.original.priority); else node.style.removeProperty(entry.name); }
      else if (entry.kind === 'attribute' && node.getAttribute) { if (entry.original.had) node.setAttribute(entry.name, entry.original.value); else node.removeAttribute(entry.name); }
      else if (entry.kind === 'property') { if (entry.original.had) node[entry.name] = entry.original.value; else { try { delete node[entry.name]; } catch (_) { node[entry.name] = undefined; } } }
      else if (entry.kind === 'class' && node.classList) node.classList.toggle(entry.name, entry.original === true);
      else { abandon(entry); return false; }
      restores += 1; abandon(entry); return true;
    }
    function restore() { if (destroyed) return 0; var count = 0; entries.slice().reverse().forEach(function (entry) { if (restoreEntry(entry)) count += 1; }); return count; }
    function destroy() { if (destroyed) return false; restore(); destroyed = true; activeProjections = Math.max(0, activeProjections - 1); return true; }
    return Object.freeze({ setStyle: setStyle, setAttribute: setAttribute, setProperty: setProperty, setClass: setClass, addClass: function (node, name) { return setClass(node, name, true); }, removeClass: function (node, name) { return setClass(node, name, false); }, restore: restore, destroy: destroy });
  }

export const DOMProjection = Object.freeze({ create, getStats: function () { return Object.freeze({ activeProjections: activeProjections, activeEntries: activeEntries, writes: writes, dedupedWrites: dedupedWrites, restores: restores, skippedRestores: skippedRestores }); } });
export { create };
