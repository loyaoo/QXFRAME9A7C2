
import { Utils } from '../utils/utils.js';
import { ItemAccessors } from './itemAccessors.js';

function createHierarchy(options) {
  var opts = options || {}, childrenOf = Utils.isFunction(opts.childrenOf) ? opts.childrenOf : ItemAccessors.children, keyOf = Utils.isFunction(opts.keyOf) ? opts.keyOf : ItemAccessors.key, disabledOf = Utils.isFunction(opts.disabledOf) ? opts.disabledOf : ItemAccessors.disabled;
  function childList(item, index) { var value = childrenOf(item, index); return Array.isArray(value) ? value : []; }
  function itemKey(item, index) { return String(keyOf(item, index)); }
  function blocked(item, index) { return disabledOf(item, index) === true; }
  function walk(items, visit, parents) {
    (Array.isArray(items) ? items : []).forEach(function (item, index) {
      var path = (parents || []).slice(), key = itemKey(item, index);
      visit(item, key, path, index);
      var children = childList(item, index);
      if (children.length) walk(children, visit, path.concat(key));
    });
  }
  function descendants(item, includeSelf) { var out=[]; function visit(node,index){ if (blocked(node,index)) return; if (!childList(node,index).length || opts.leavesOnly !== true) out.push(itemKey(node,index)); childList(node,index).forEach(visit); } if(includeSelf!==false) visit(item,0); else childList(item,0).forEach(visit); return out; }
  function leafKeys(item) { var out=[]; function visit(node,index){ if (blocked(node,index)) return; var children=childList(node,index), leaf=Utils.isFunction(opts.isLeaf) ? opts.isLeaf(node,index,children) === true : !children.length; if(leaf){ out.push(itemKey(node,index)); return; } children.forEach(visit); } visit(item,0); return out; }
  function stateFor(item, selected) { var set = selected instanceof Set ? selected : new Set((selected || []).map(String)), leaves=leafKeys(item); var count=leaves.filter(function(key){return set.has(key);}).length; return Object.freeze({ checked: leaves.length>0 && count===leaves.length, indeterminate: count>0 && count<leaves.length, selectedCount:count, total:leaves.length, keys:leaves }); }
  function toggle(item, selected, checked) { var set = selected instanceof Set ? new Set(selected) : new Set((selected || []).map(String)), leaves=leafKeys(item), state=stateFor(item,set), next = checked === undefined ? !state.checked : checked === true; leaves.forEach(function(key){ if(next) set.add(key); else set.delete(key); }); return Array.from(set); }
  function findPath(items, targetKey) {
    var found = null;
    function visit(list, path) {
      if (found) return;
      (Array.isArray(list) ? list : []).some(function (item, index) {
        var key = itemKey(item, index), nextPath = path.concat([{ item:item, index:index, key:key }]);
        if (key === targetKey) { found = nextPath; return true; }
        if (blocked(item, index)) return false;
        visit(childList(item, index), nextPath);
        return !!found;
      });
    }
    visit(items, []);
    return found || [];
  }
  function normalizeCascade(items, selected, config) {
    var settings = config || {}, strict = settings.strict === true;
    var requested = selected instanceof Set ? new Set(Array.from(selected, String)) : new Set((Array.isArray(selected) ? selected : []).map(String));
    var checked = new Set(), mixed = new Set();
    // Use a local recursive form so caller-provided index-sensitive accessors keep the original sibling index.
    function seedList(list) {
      (Array.isArray(list) ? list : []).forEach(function (item, index) {
        if (blocked(item, index)) return;
        var key = itemKey(item, index), children = childList(item, index);
        if (requested.has(key)) {
          checked.add(key);
          if (!strict) {
            (function addDescendants(nodes) {
              (Array.isArray(nodes) ? nodes : []).forEach(function (child, childIndex) {
                if (blocked(child, childIndex)) return;
                checked.add(itemKey(child, childIndex));
                addDescendants(childList(child, childIndex));
              });
            })(children);
          }
        }
        seedList(children);
      });
    }
    seedList(items);
    if (!strict) {
      function settle(list) {
        (Array.isArray(list) ? list : []).forEach(function (item, index) {
          if (blocked(item, index)) return;
          var children = childList(item, index).filter(function (child, childIndex) { return !blocked(child, childIndex); });
          settle(children);
          if (!children.length) return;
          var all = children.every(function (child, childIndex) { return checked.has(itemKey(child, childIndex)); });
          var some = children.some(function (child, childIndex) { var key=itemKey(child, childIndex); return checked.has(key) || mixed.has(key); });
          var key = itemKey(item, index);
          if (all) { checked.add(key); mixed.delete(key); }
          else if (some) { checked.delete(key); mixed.add(key); }
          else { checked.delete(key); mixed.delete(key); }
        });
      }
      settle(items);
    }
    return Object.freeze({ checkedKeys:Array.from(checked), indeterminateKeys:Array.from(mixed) });
  }
  function toggleCascade(items, item, selected, checked, config) {
    var settings = config || {}, targetKey = typeof item === 'string' ? String(item) : itemKey(item, 0), current = selected instanceof Set ? new Set(Array.from(selected, String)) : new Set((Array.isArray(selected) ? selected : []).map(String));
    var path = findPath(items, targetKey), target = path.length ? path[path.length - 1].item : item;
    if (!target || blocked(target, path.length ? path[path.length - 1].index : 0)) return normalizeCascade(items, current, settings);
    var normalizedBefore = normalizeCascade(items, current, settings), beforeSet = new Set(normalizedBefore.checkedKeys), shouldCheck = checked === undefined ? !beforeSet.has(targetKey) : checked === true;
    if (settings.strict === true) {
      if (shouldCheck) current.add(targetKey); else current.delete(targetKey);
    } else {
      var targetIndex = path.length ? path[path.length - 1].index : 0;
      (function mutateBranch(node, index) {
        if (!node || blocked(node, index)) return;
        var key = itemKey(node, index);
        if (shouldCheck) current.add(key); else current.delete(key);
        childList(node, index).forEach(function (child, childIndex) { mutateBranch(child, childIndex); });
      })(target, targetIndex);
      if (!shouldCheck) path.slice(0, -1).forEach(function (entry) { current.delete(entry.key); });
    }
    return normalizeCascade(items, current, settings);
  }
  return Object.freeze({ walk:walk, descendants:descendants, leafKeys:leafKeys, stateFor:stateFor, toggle:toggle, normalizeCascade:normalizeCascade, toggleCascade:toggleCascade });
}

export const HierarchicalSelection = Object.freeze({ create: createHierarchy });
export { createHierarchy };
