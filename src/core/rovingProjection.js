// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';
import { Utils } from '../utils/utils.js';

function create(options) {
    var opts=options||{}, destroyed=false;
    function entries(){var value=Utils.isFunction(opts.getEntries)?opts.getEntries():opts.entries;return Array.isArray(value)?value:[];}
    function keyOf(entry,index){var value=Utils.isFunction(opts.getKey)?opts.getKey(entry,index):(entry&&entry.key);return value===undefined||value===null?'':String(value);}
    function elementOf(entry,index){return Utils.isFunction(opts.getElement)?opts.getElement(entry,index):entry&&entry.element||null;}
    function disabled(entry,index,element){return Utils.isFunction(opts.isDisabled)?opts.isDisabled(entry,index,element)===true:!!(element&&element.disabled);}
    function activeKey(){var value=Utils.isFunction(opts.getActiveKey)?opts.getActiveKey():opts.activeKey;return value===undefined||value===null?'':String(value);}
    function sync(){if(destroyed)return false;var active=activeKey(),first=null;entries().forEach(function(entry,index){var el=elementOf(entry,index);if(!el)return;var allowed=!disabled(entry,index,el);var key=keyOf(entry,index);if(allowed&&!first)first=el;el.tabIndex=allowed&&key===active?0:-1;});if(!active&&opts.ensureOne!==false&&first)first.tabIndex=0;return true;}
    function focus(key,meta){if(destroyed)return false;var normalized=String(key==null?'':key),found=null;entries().some(function(entry,index){var el=elementOf(entry,index);if(!el||disabled(entry,index,el)||keyOf(entry,index)!==normalized)return false;found=el;return true;});if(!found)return false;if(Utils.isFunction(opts.setActiveKey))opts.setActiveKey(normalized,meta||{});sync();return DOM.focusElement(found,{preventScroll:!(meta&&meta.preventScroll===false)});}
    function destroy(){if(destroyed)return false;destroyed=true;return true;}
    var api=Object.freeze({sync:sync,focus:focus,destroy:destroy,getState:function(){return Object.freeze({activeKey:activeKey(),destroyed:destroyed});}});sync();return api;
  }

export const RovingProjection = Object.freeze({ create });
export { create };
