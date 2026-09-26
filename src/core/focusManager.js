import { DOM } from './dom.js';
import { FocusOrigin } from './focusOrigin.js';
const global=globalThis;
var selector=['a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])','[contenteditable="true"]'].join(',');
function create(options){
  var settings=options||{},doc=settings.document||global.document,captured=null,destroyed=false; FocusOrigin.setup(doc);
  function canFocus(node){return !destroyed&&DOM.canFocus(node);}
  function focus(node,focusOptions){if(destroyed||!node)return false;var local={...(focusOptions||{})};var origin=local.origin||(local.inheritOrigin===false?'programmatic':FocusOrigin.inherited(doc)),source=local.source||'focus-manager';delete local.origin;delete local.source;delete local.inheritOrigin;FocusOrigin.prepare(node,origin,{source});var focused=DOM.focusElement(node,Object.keys(local).length?local:{preventScroll:true});if(!focused)FocusOrigin.cancelPending(node);return focused;}
  function capture(){if(destroyed)return null;captured=FocusOrigin.capture(doc);return captured;}
  function isTabbable(node){if(!node||typeof node.matches!=='function')return false;var explicit=node.getAttribute&&node.getAttribute('tabindex');if(explicit!==null&&Number(explicit)<0)return false;if(!node.matches(selector))return false;if(!canFocus(node)||node.hidden===true)return false;return true;}
  function tabbable(container){if(!container||typeof container.querySelectorAll!=='function')return[];return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(isTabbable);}
  function focusFirst(container,options){var nodes=tabbable(container);return nodes.length?focus(nodes[0],options):focus(container,options);}
  function focusLast(container,options){var nodes=tabbable(container);return nodes.length?focus(nodes[nodes.length-1],options):focus(container,options);}
  function restore(options){if(destroyed||!captured)return false;var snapshot=captured;captured=null;var target=snapshot.element;if(!target||('isConnected'in target&&target.isConnected===false))return false;return focus(target,{...(options||{}),origin:snapshot.origin,source:(options&&options.source)||'focus-restore'});}
  function destroy(){if(destroyed)return false;captured=null;destroyed=true;return true;}
  return{capture,focus,isTabbable,tabbable,focusFirst,focusLast,restore,destroy};
}
export const FocusManager=Object.freeze({create}); export{create};
