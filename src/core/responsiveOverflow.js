
import { ObserverHub } from './observerHub.js';
import { Scheduler } from './scheduler.js';
import { DOM } from './dom.js';

const global = globalThis;

function finiteLength(value) { var number=Number(value); return Number.isFinite(number)&&number>0?number:0; }
  function requiredSize(lengths,count,gap,tailWidths) {
    var source=Array.isArray(lengths)?lengths:[], limit=Math.max(0,Math.min(source.length,Number.isFinite(Number(count))?Math.floor(Number(count)):source.length));
    var tails=Array.isArray(tailWidths)?tailWidths:[], total=0, elements=0, spacing=Math.max(0,Number(gap)||0);
    for(var i=0;i<limit;i+=1){total+=finiteLength(source[i]);elements+=1;}
    tails.forEach(function(value){total+=finiteLength(value);elements+=1;});
    return total+Math.max(0,elements-1)*spacing;
  }
  function fitPrefix(options) {
    var opts=options||{}, lengths=Array.isArray(opts.lengths)?opts.lengths:[], available=Number(opts.available), gap=Math.max(0,Number(opts.gap)||0), tolerance=Math.max(0,Number(opts.tolerance)||0);
    if(!(available>0))return lengths.length;
    var start=opts.maxCount===undefined?lengths.length:Math.max(0,Math.min(lengths.length,Math.floor(Number(opts.maxCount)||0)));
    for(var candidate=start;candidate>=0;candidate-=1){
      var tails=typeof opts.tailWidths==='function'?opts.tailWidths(candidate):opts.tailWidths;
      if(requiredSize(lengths,candidate,gap,Array.isArray(tails)?tails:[])<=available+tolerance)return candidate;
    }
    return 0;
  }
  function create(options) {
    var opts=options||{}, element=opts.element||null, enabled=opts.enabled!==false, destroyed=false, stopResize=null, stopWindow=null;
    var scheduler=Scheduler.createFrameScheduler(function(_time,reason){ if(!destroyed&&enabled&&typeof opts.onMeasure==='function') opts.onMeasure(reason||'layout'); });
    function detach() { if(stopResize){stopResize();stopResize=null;} if(stopWindow){stopWindow();stopWindow=null;} }
    function attach() {
      detach();
      if(destroyed||!enabled||!element) return false;
      stopResize=ObserverHub.resize(element,function(){scheduler.request('resize');});
      var primary=Array.isArray(element)?element[0]:element, doc=primary&&primary.ownerDocument||global.document, view=doc&&doc.defaultView||global;
      if((!stopResize||typeof (view&&view.ResizeObserver)!=='function')&&view&&typeof view.addEventListener==='function') stopWindow=DOM.listen(view,'resize',function(){scheduler.request('window-resize');},{passive:true});
      return true;
    }
    function setElement(next){ if(element===next) return api; element=next||null; attach(); return api; }
    function setEnabled(next){ var value=next!==false; if(value===enabled) return api; enabled=value; attach(); if(enabled)scheduler.request('enabled'); return api; }
    function request(reason){ if(destroyed||!enabled)return false; return scheduler.request(reason||'layout'); }
    function destroy(){if(destroyed)return false;destroyed=true;detach();scheduler.dispose();element=null;return true;}
    var api=Object.freeze({request:request,refresh:request,setElement:setElement,setEnabled:setEnabled,destroy:destroy,getState:function(){return Object.freeze({enabled:enabled,destroyed:destroyed,element:element});}});
    attach();
    return api;
  }

export const ResponsiveOverflow = Object.freeze({ create, requiredSize, fitPrefix });
export { create, requiredSize, fitPrefix };
