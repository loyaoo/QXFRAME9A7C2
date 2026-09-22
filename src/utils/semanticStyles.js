// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOMProjection } from '../core/domProjection.js';

function isPlainObject(value){if(!value||Object.prototype.toString.call(value)!=='[object Object]')return false;var proto=Object.getPrototypeOf(value);return proto===Object.prototype||proto===null;}
  function own(object,key){return Object.prototype.hasOwnProperty.call(object||{},key);}
  function stylePropertyName(prop){var name=String(prop||''); if(name.indexOf('--')===0)return name; return name.replace(/[A-Z]/g,function(letter){return '-'+letter.toLowerCase();});}
  function normalizeClasses(value){
    if (value===undefined || value===null || value===false) return [];
    var source=Array.isArray(value)?value:[value], out=[];
    source.forEach(function(item){String(item||'').split(/\s+/).forEach(function(name){if(name&&out.indexOf(name)<0)out.push(name);});});
    return out;
  }
  function validateMap(map,slots,label){
    if (map===undefined || map===null) return {};
    if (!isPlainObject(map)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles '+label+' must be a plain object keyed by semantic slot.');
    var out={};
    Object.keys(map).forEach(function(slot){
      if (!own(slots,slot)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles unknown slot: '+slot+'.');
      if (label==='classNames') out[slot]=normalizeClasses(map[slot]);
      else { if (map[slot]!==null && !isPlainObject(map[slot])) throw new TypeError('[QXFRAME9A7C2] SemanticStyles styles.'+slot+' must be a plain object.'); out[slot]=Object.assign({},map[slot]||{}); }
    });
    return out;
  }
  function create(options){
    var opts=options||{}, slots=opts.slots||{};
    if (!isPlainObject(slots)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles slots must be a plain object.');
    Object.keys(slots).forEach(function(key){var node=slots[key]; if (node!==null && node!==undefined && (!node.classList || !node.style)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles slot '+key+' must resolve to an Element or null.');});
    var classNames=validateMap(opts.classNames,slots,'classNames'), styles=validateMap(opts.styles,slots,'styles'), destroyed=false, projection=DOMProjection.create();
    function apply(){
      if(projection)projection.destroy(); projection=DOMProjection.create();
      Object.keys(classNames).forEach(function(slot){var node=slots[slot]; if(!node)return; classNames[slot].forEach(function(name){projection.addClass(node,name);});});
      Object.keys(styles).forEach(function(slot){var node=slots[slot]; if(!node)return; Object.keys(styles[slot]).forEach(function(rawProp){var prop=stylePropertyName(rawProp); if(!prop)return; var value=styles[slot][rawProp]; projection.setStyle(node,prop,value===undefined||value===null?'':String(value));});});
    }
    function update(next){
      if(destroyed)return api; next=next||{}; if(!isPlainObject(next))throw new TypeError('[QXFRAME9A7C2] SemanticStyles update expects a plain object.');
      var nextClasses=own(next,'classNames')?validateMap(next.classNames,slots,'classNames'):classNames;
      var nextStyles=own(next,'styles')?validateMap(next.styles,slots,'styles'):styles;
      Object.keys(next).forEach(function(key){if(key!=='classNames'&&key!=='styles')throw new TypeError('[QXFRAME9A7C2] SemanticStyles update does not accept '+key+'.');});
      classNames=nextClasses; styles=nextStyles; apply(); return api;
    }
    function state(){return Object.freeze({classNames:JSON.parse(JSON.stringify(classNames)),styles:JSON.parse(JSON.stringify(styles)),slots:Object.keys(slots),destroyed:destroyed});}
    function destroy(){if(destroyed)return false; destroyed=true; if(projection){projection.destroy();projection=null;} return true;}
    var api=Object.freeze({update:update,getState:state,destroy:destroy}); apply(); return api;
  }

export const SemanticStyles = Object.freeze({ create });
export { create };
