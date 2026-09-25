
import { Utils } from '../utils/utils.js';
import { DOM } from './dom.js';
import { URLPolicy } from '../utils/url.js';
import { Renderer } from './renderer.js';
import { AsyncAction } from './asyncAction.js';
import { PressInteraction } from './pressInteraction.js';
import { InteractionController } from './interactionController.js';
import { FeedbackController } from './feedbackController.js';

function renderValue(host,value,context,doc){var output=typeof value==='function'?value(context):value;Renderer.replace(host,output==null?'':output,doc);}
function applyStyle(element,style){if(!style||typeof style!=='object')return;Object.keys(style).forEach(function(key){if(Utils.safeOwnKey(key))element.style[key]=style[key]==null?'':String(style[key]);});}
function create(config) {
  var cfg=config||{}, doc=cfg.document, root=cfg.root, wrap=cfg.wrap, surface=cfg.surface, header=cfg.header, title=cfg.title, body=cfg.body, footer=cfg.footer, closeButton=cfg.closeButton;
  var actionCleanups=[], actionCapabilities=[], actionFeedback=[], closeGuard=false;
  var interactionController=InteractionController.create();
  var closePress=null;
  function options(){return typeof cfg.getOptions==='function'?cfg.getOptions():(cfg.options||{});}
  function api(){return typeof cfg.getApi==='function'?cfg.getApi():cfg.api;}
  function buttons(){var value=typeof cfg.getButtons==='function'?cfg.getButtons():cfg.buttons;return Array.isArray(value)?value:[];}
  function closeConfig(){var opts=options();return opts.closeOptions&&typeof opts.closeOptions==='object'?opts.closeOptions:{};}
  function syncCloseButton(){
    var opts=options(), close=closeConfig(), icon=Object.prototype.hasOwnProperty.call(close,'closeIcon')?close.closeIcon:opts.closeIcon;
    var visible=opts.closable===true&&icon!==false&&icon!==null;
    closeButton.hidden=!visible; closeButton.disabled=close.disabled===true; closeButton.textContent='';
    if(visible){if(icon!==undefined)Renderer.append(closeButton,icon,doc);else{var glyph=doc.createElement('span');glyph.className='qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3 is-sm';closeButton.appendChild(glyph);}}
    if(cfg.closePlacement===true){var place=close.placement||'end';closeButton.classList.toggle('is-close-start',place==='start');closeButton.classList.toggle('is-close-end',place!=='start');}
    return visible;
  }
  function syncChrome(){
    var opts=options(), close=closeConfig(), closeVisible=syncCloseButton();
    var showHeader=opts.header!==false&&(closeVisible||title.childNodes.length>0);
    var customFooter=opts.footer!==undefined&&opts.footer!==true&&opts.footer!==false&&opts.footer!==null&&!Array.isArray(opts.footer);
    var showFooter=opts.footer!==false&&opts.footer!==null&&(buttons().length>0||customFooter);
    surface.replaceChildren();
    if(showHeader){header.replaceChildren();if(closeVisible&&cfg.closePlacement===true&&(close.placement||'end')==='start')header.appendChild(closeButton);header.appendChild(title);if(closeVisible&&(cfg.closePlacement!==true||(close.placement||'end')!=='start'))header.appendChild(closeButton);surface.appendChild(header);}
    else if(closeVisible)surface.appendChild(closeButton);
    surface.appendChild(body); if(showFooter)surface.appendChild(footer); if(surface.parentNode!==wrap)wrap.appendChild(surface);
    header.hidden=!showHeader; footer.hidden=!showFooter; closeButton.classList.toggle('is-standalone',closeVisible&&!showHeader); surface.classList.toggle('is-headerless',!showHeader); surface.classList.toggle('is-footerless',!showFooter);
    return {closeVisible:closeVisible,showHeader:showHeader,showFooter:showFooter};
  }
  function initialFocus(){
    var opts=options(), instance=api(); if(opts.autoFocus===false)return null;
    if(typeof opts.autoFocus==='string')return DOM.resolveElement(opts.autoFocus,surface);
    if(opts.autoFocus&&opts.autoFocus.nodeType===1)return opts.autoFocus;
    if(typeof opts.autoFocus==='function')return opts.autoFocus(instance);
    return surface.querySelector('button:not([disabled]),a[href]:not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')||surface;
  }
  function overlayOptions(extra){var opts=options(), add=extra||{};return Utils.assignOwn({floating:root,document:doc,portalContainer:cfg.portalContainer,position:false,closeOnOutsidePress:false,closeOnEscape:opts.closeOnEscape,trapFocus:opts.focusTrap,lockScroll:opts.lockScroll,initialFocus:initialFocus,focusOnActivate:opts.autoFocus!==false,restoreFocus:opts.restoreFocus,destroyOnDeactivate:opts.destroyOnHidden===true,zIndex:opts.zIndex,layerKind:'modal',componentType:cfg.componentType||'Overlay'},add);}
  function clearActions(){actionCleanups.splice(0).forEach(function(dispose){try{dispose();}catch(error){}});actionCapabilities.length=0;actionFeedback.length=0;}
  function buttonDisabled(buttonConfig,data){return typeof buttonConfig.disabled==='function'?buttonConfig.disabled(data)!==false:buttonConfig.disabled===true;}
  function createActionButton(buttonConfig){
    var link=!!buttonConfig.href, element=doc.createElement(link?'a':'button');
    element.className=('qxframe9a7c2-button is-sm '+(buttonConfig.type==='primary'?'is-primary':(buttonConfig.type==='error'||buttonConfig.type==='danger'?'is-error':'is-default'))+' '+(buttonConfig.className||'')).trim();
    element.setAttribute('data-button-key',buttonConfig.key);
    if(link){var safeHref=URLPolicy.sanitize(buttonConfig.href,'navigation');if(safeHref)element.href=safeHref;else element.removeAttribute('href');if(buttonConfig.target)element.target=buttonConfig.target;if(buttonConfig.rel)element.rel=buttonConfig.rel;else if(buttonConfig.target==='_blank')element.rel='noopener noreferrer';}
    else element.type=buttonConfig.buttonType||'button';
    if(buttonConfig.attrs&&typeof buttonConfig.attrs==='object')DOM.applySafeAttributes(element,buttonConfig.attrs,{blocked:['href','target','rel']});
    applyStyle(element,buttonConfig.style);
    var action=null, feedback=null;
    var data={instance:api(),event:null,button:element,config:buttonConfig,buttonConfig:buttonConfig,close:function(reason){if(typeof cfg.close==='function')return cfg.close(reason||buttonConfig.role||'button',data.event);},setLoading:function(active){element.classList.toggle('is-loading',active===true);if(!link)element.disabled=active===true||buttonDisabled(buttonConfig,data);}};
    var disabled=buttonDisabled(buttonConfig,data);
    if(link){element.classList.toggle('is-disabled',disabled);if(disabled)element.tabIndex=-1;else element.removeAttribute('tabindex');}
    else element.disabled=disabled;
    renderValue(element,buttonConfig.content,data,doc);
    function projectFeedback(snapshot){
      var pending=snapshot.status==='pending'||snapshot.status==='progress';
      data.setLoading(pending);
      return element;
    }
    if(buttonConfig.autoLoading){
      feedback=FeedbackController.createForProjector(Object.freeze({
        show:function(snapshot){return projectFeedback(snapshot);},
        update:function(_handle,snapshot){return projectFeedback(snapshot);},
        close:function(){data.setLoading(false);return true;}
      }),{ownerId:String((api()&&api().id)||cfg.componentType||'overlay')+':button:'+String(buttonConfig.key)},'local');
      actionFeedback.push(feedback);
    }
    function publishFeedback(state,detail){
      if(!feedback)return;
      var status=String(state&&state.state||'idle');
      if(status==='cancelled'||status==='destroyed')status='idle';
      feedback.publish({
        operation:String(buttonConfig.role||buttonConfig.key||'button'),
        status:status,
        requestId:String(state&&state.requestId||0),
        generation:Number(state&&state.requestId)||0,
        message:String(buttonConfig.content==null?'':buttonConfig.content),
        target:'local'
      },{source:detail&&detail.source||'programmatic',reason:'overlay-action-'+status});
    }
    action=AsyncAction.create({
      action:function(input){data.event=input&&input.event||null;if(buttonDisabled(buttonConfig,data))return false;if(typeof buttonConfig.onClick==='function')return buttonConfig.onClick(data);if(typeof cfg.invokeCallback==='function'&&(buttonConfig.role==='confirm'||buttonConfig.role==='ok'||buttonConfig.role==='submit'))return cfg.invokeCallback('onConfirm',data);if(typeof cfg.invokeCallback==='function'&&(buttonConfig.role==='cancel'||buttonConfig.role==='close'))return cfg.invokeCallback('onCancel',data);return true;},
      onStateChange:function(state,detail){if(!(typeof cfg.isDestroyed==='function'&&cfg.isDestroyed()))publishFeedback(state,detail);},
      onError:function(error){if(typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())return;var detail={error:error,role:buttonConfig.role||'button',key:buttonConfig.key,button:element,config:buttonConfig,instance:api()};if(typeof buttonConfig.onError==='function')buttonConfig.onError(error,detail);if(typeof cfg.emitActionError==='function')cfg.emitActionError(detail);}
    });
    function runAction(event,source){
      data.event=event||null;
      if(buttonDisabled(buttonConfig,data)||action.snapshot().pending)return false;
      action.run({event:event||null},{source:source||DOM.activationSource(event)}).then(function(resolved){if((typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())||action.snapshot().destroyed)return;if(resolved!==false&&buttonConfig.closeOnClick&&typeof cfg.close==='function')cfg.close(buttonConfig.role||'button',event||null);},function(){});
      return true;
    }
    var press=PressInteraction.create({
      target:element,
      interactionController:interactionController,
      getState:function(){return {disabled:buttonDisabled(buttonConfig,data),loading:!!(action&&action.snapshot().pending)};},
      capabilities:{activatable:true,preserveFocusWhileLoading:true,tabbableWhileLoading:true},
      onPress:function(detail){return runAction(detail&&detail.originalEvent||null,detail&&detail.source||'programmatic');}
    });
    actionCapabilities.push(press.getCapabilityController());
    actionCleanups.push(function(){press.destroy();});
    actionCleanups.push(function(){action.destroy();});
    if(feedback)actionCleanups.push(function(){feedback.destroy();});
    return element;
  }
  function renderFooter(resolveButtons){
    clearActions();Renderer.replace(footer,'',doc);
    var list=typeof resolveButtons==='function'?resolveButtons(options()):(Array.isArray(resolveButtons)?resolveButtons.slice():[]);
    if(typeof cfg.setButtons==='function')cfg.setButtons(list);
    var opts=options(), custom=opts.footer!==undefined&&opts.footer!==true&&opts.footer!==false&&opts.footer!==null&&!Array.isArray(opts.footer);
    if(custom)renderValue(footer,opts.footer,{instance:api(),close:cfg.close,buttons:list.slice()},doc);else list.forEach(function(buttonConfig){footer.appendChild(createActionButton(buttonConfig));});
    return list;
  }
  function requestClose(reason,event){
    if((typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())||(typeof cfg.isOpen==='function'&&!cfg.isOpen())||closeGuard)return false;
    closeGuard=true;
    try{
      if(typeof cfg.beforeClose==='function'&&cfg.beforeClose(reason,event)===false)return false;
      if((typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())||(typeof cfg.isOpen==='function'&&!cfg.isOpen()))return false;
      if(typeof cfg.acceptClose==='function')cfg.acceptClose(reason,event);
      return true;
    }finally{closeGuard=false;}
  }
  closePress=PressInteraction.create({
    target:closeButton,
    interactionController:interactionController,
    getState:function(){return {disabled:closeButton.disabled===true||closeButton.hidden===true};},
    capabilities:{activatable:true,preserveFocusWhileLoading:true,tabbableWhileLoading:true},
    onPress:function(detail){if(typeof cfg.close==='function')cfg.close('x',detail&&detail.originalEvent||null);}
  });
  function disposeFrame(reason){
    clearActions();
    if(closePress){closePress.destroy();closePress=null;}
    interactionController.destroy();
    var why=reason||'destroy', contentHost=typeof cfg.getContentHost==='function'?cfg.getContentHost():cfg.contentHost;
    Renderer.dispose(title);if(contentHost)Renderer.dispose(contentHost);Renderer.dispose(footer);Renderer.dispose(closeButton);
    var scope=typeof cfg.getScope==='function'?cfg.getScope():cfg.scope;if(scope&&typeof scope.dispose==='function')scope.dispose();
    var scroll=typeof cfg.getScroll==='function'?cfg.getScroll():cfg.scroll;if(scroll&&typeof scroll.destroy==='function')scroll.destroy();
    var popupSurface=typeof cfg.getSurface==='function'?cfg.getSurface():cfg.popupSurface;if(popupSurface&&typeof popupSurface.hide==='function')popupSurface.hide({reason:why});
    var overlay=typeof cfg.getOverlay==='function'?cfg.getOverlay():cfg.overlay;if(overlay&&typeof overlay.destroy==='function')overlay.destroy();
    if(popupSurface&&typeof popupSurface.destroy==='function')popupSurface.destroy();
    var emitter=typeof cfg.getEmitter==='function'?cfg.getEmitter():cfg.emitter;if(emitter&&typeof emitter.dispose==='function')emitter.dispose();
    if(root&&root.parentNode)root.parentNode.removeChild(root);
    if(typeof cfg.afterDestroy==='function')cfg.afterDestroy(why);
    return true;
  }
  function destroy(){clearActions();if(closePress){closePress.destroy();closePress=null;}interactionController.destroy();}
  return Object.freeze({closeConfig:closeConfig,syncCloseButton:syncCloseButton,syncChrome:syncChrome,initialFocus:initialFocus,overlayOptions:overlayOptions,renderValue:function(host,value,context){renderValue(host,value,context,doc);},applyStyle:applyStyle,clearActions:clearActions,createActionButton:createActionButton,renderFooter:renderFooter,requestClose:requestClose,isClosing:function(){return closeGuard;},getInteractionController:function(){return interactionController;},getCapabilityControllers:function(){var result=[];if(closePress&&closePress.getCapabilityController)result.push(closePress.getCapabilityController());return Object.freeze(result.concat(actionCapabilities));},getFeedbackControllers:function(){return Object.freeze(actionFeedback.slice());},disposeFrame:disposeFrame,destroy:destroy});
}

export const OverlayFrameShell = Object.freeze({ create });
export { create };
