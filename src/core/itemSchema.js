// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { ItemAccessors } from './itemAccessors.js';

function validateItems(items, options) {
  var opts = options || {}, label = String(opts.label || 'items'), childrenOf = Utils.isFunction(opts.childrenOf) ? opts.childrenOf : ItemAccessors.children;
  if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] ' + label + ' must be an array.');
  var seen = Object.create(null);
  function visit(list, path) {
    list.forEach(function (item, index) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError('[QXFRAME9A7C2] ' + label + ' item at ' + path.concat(index).join('.') + ' must be an object.');
      var key = Utils.isFunction(opts.keyOf) ? opts.keyOf(item, index) : ItemAccessors.key(item, index);
      if (Utils.isFunction(opts.validateItem)) opts.validateItem(item, Object.freeze({ index:index, path:path.slice(), key:key }));
      if (opts.uniqueKeys !== false) {
        var normalized = String(key);
        if (seen[normalized]) throw new TypeError('[QXFRAME9A7C2] ' + label + ' contains duplicate key/value: ' + normalized + '.');
        seen[normalized] = true;
      }
      var children = childrenOf(item, index);
      if (children !== undefined && children !== null && !Array.isArray(children)) throw new TypeError('[QXFRAME9A7C2] ' + label + ' children must be an array.');
      if (Array.isArray(children) && children.length) visit(children, path.concat(index));
    });
  }
  visit(items, []);
  return items;
}

export const ItemSchema = Object.freeze({ validate: validateItems });
export { validateItems };
