import { Utils } from '../utils/utils.js';
import { mergeOptions } from '../core/options.js';
import { ItemCollection } from './item-collection.js';

const own=Utils.own;
function create(options){
  var opts=mergeOptions({},options);
  if(own(opts,'renderItem'))throw new TypeError('[QXFRAME9A7C2] List uses itemRender(item, ctx), not renderItem.');
  var bordered=opts.bordered!==false,inset=opts.inset!==false;
  delete opts.bordered;delete opts.inset;
  opts.ownerPrefix='list';
  opts.itemSemanticClasses=function(){return['qxframe9a7c2-list-item'];};
  var collection=ItemCollection.create(opts),root=collection.getRootElement&&collection.getRootElement(),api={};
  function syncFrame(){root=collection.getRootElement&&collection.getRootElement();if(!root)return;root.classList.add('qxframe9a7c2-list','qxframe9a7c2-list-frame');root.classList.toggle('is-borderless',bordered!==true);root.classList.toggle('is-inset',inset===true);root.classList.toggle('is-flush',inset!==true);}
  function updateOptions(nextOptions){var next=mergeOptions({},nextOptions);if(own(next,'bordered')){bordered=next.bordered!==false;delete next.bordered;}if(own(next,'inset')){inset=next.inset!==false;delete next.inset;}collection.updateOptions(next);syncFrame();return api;}
  function getState(){var state=collection.getState(),projected={};Object.keys(state).forEach(function(name){projected[name]=state[name];});projected.bordered=bordered===true;projected.inset=inset===true;return Object.freeze(projected);}
  Object.keys(collection).forEach(function(name){if(name==='updateOptions'||name==='getState'||typeof collection[name]!=='function')return;api[name]=function(){var result=collection[name].apply(collection,arguments);return result===collection?api:result;};});
  api.updateOptions=updateOptions;api.getState=getState;
  Object.defineProperties(api,{mounted:{enumerable:true,get:function(){return collection.mounted;}},destroyed:{enumerable:true,get:function(){return collection.destroyed;}}});
  syncFrame();return api;
}
export const List=Object.freeze({create,createDefaultDOM:ItemCollection.createDefaultDOM});
export {create};
