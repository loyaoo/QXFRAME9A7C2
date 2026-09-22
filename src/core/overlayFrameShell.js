// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';
import { URLPolicy } from '../utils/url.js';
import { Renderer } from './renderer.js';
import { AsyncAction } from './asyncAction.js';

function renderValue(host,value,context,doc){var output=typeof value==='function'?value(context):value;Renderer.replace(host,output==null?'':output,doc);}
function applyStyle(element,style){if(!style||typeof style!=='object')return;Object.keys(style).forEach(function(key){element.style[key]=style[key]==null?'':String(style[key]);});}
function create(config) {
  var cfg=config||{}, doc=cfg.document, root=cfg.root, wrap=cfg.wrap, surface=cfg.surface, header=cfg.header, title=cfg.title, body=cfg.body, footer=cfg.footer, closeButton=cfg.closeButton;
  var actionCleanups=[], closeGuard=false;
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
  function overlayOptions(extra){var opts=options(), add=extra||{};return Object.assign({floating:root,document:doc,portalContainer:cfg.portalContainer,position:false,closeOnOutsidePress:false,closeOnEscape:opts.closeOnEscape,trapFocus:opts.focusTrap,lockScroll:opts.lockScroll,initialFocus:initialFocus,focusOnActivate:opts.autoFocus!==false,restoreFocus:opts.restoreFocus,destroyOnDeactivate:opts.destroyOnHidden===true,zIndex:opts.zIndex,layerKind:'modal',componentType:cfg.componentType||'Overlay'},add);}
  function clearActions(){actionCleanups.splice(0).forEach(function(dispose){try{dispose();}catch(error){}});}
  function buttonDisabled(buttonConfig,data){return typeof buttonConfig.disabled==='function'?buttonConfig.disabled(data)!==false:buttonConfig.disabled===true;}
  function createActionButton(buttonConfig){
    var link=!!buttonConfig.href, element=doc.createElement(link?'a':'button');
    element.className=('qxframe9a7c2-button is-sm '+(buttonConfig.type==='primary'?'is-primary':(buttonConfig.type==='error'||buttonConfig.type==='danger'?'is-error':'is-default'))+' '+(buttonConfig.className||'')).trim();
    element.setAttribute('data-button-key',buttonConfig.key);
    if(link){var safeHref=URLPolicy.sanitize(buttonConfig.href,'navigation');if(safeHref)element.href=safeHref;else element.removeAttribute('href');if(buttonConfig.target)element.target=buttonConfig.target;if(buttonConfig.rel)element.rel=buttonConfig.rel;else if(buttonConfig.target==='_blank')element.rel='noopener noreferrer';}
    else element.type=buttonConfig.buttonType||'button';
    if(buttonConfig.attrs&&typeof buttonConfig.attrs==='object')Object.keys(buttonConfig.attrs).forEach(function(name){var lower=String(name).toLowerCase();if(/^on/.test(lower)||lower==='href'||lower==='src'||lower==='xlink:href')return;if(buttonConfig.attrs[name]!=null)element.setAttribute(name,String(buttonConfig.attrs[name]));});
    applyStyle(element,buttonConfig.style);
    var data={instance:api(),event:null,button:element,config:buttonConfig,buttonConfig:buttonConfig,close:function(reason){if(typeof cfg.close==='function')return cfg.close(reason||buttonConfig.role||'button',data.event);},setLoading:function(active){element.classList.toggle('is-loading',active===true);if(!link)element.disabled=active===true||buttonDisabled(buttonConfig,data);}};
    var disabled=buttonDisabled(buttonConfig,data);
    if(link){element.classList.toggle('is-disabled',disabled);if(disabled)element.tabIndex=-1;else element.removeAttribute('tabindex');}
    else element.disabled=disabled;
    renderValue(element,buttonConfig.content,data,doc);
    var action=AsyncAction.create({
      action:function(input){data.event=input&&input.event||null;if(buttonDisabled(buttonConfig,data))return false;if(typeof buttonConfig.onClick==='function')return buttonConfig.onClick(data);if(typeof cfg.invokeCallback==='function'&&(buttonConfig.role==='confirm'||buttonConfig.role==='ok'||buttonConfig.role==='submit'))return cfg.invokeCallback('onConfirm',data);if(typeof cfg.invokeCallback==='function'&&(buttonConfig.role==='cancel'||buttonConfig.role==='close'))return cfg.invokeCallback('onCancel',data);return true;},
      onStateChange:function(state){if(!(typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())&&buttonConfig.autoLoading)data.setLoading(state.pending===true);},
      onError:function(error){if(typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())return;var detail={error:error,role:buttonConfig.role||'button',key:buttonConfig.key,button:element,config:buttonConfig,instance:api()};if(typeof buttonConfig.onError==='function')buttonConfig.onError(error,detail);if(typeof cfg.emitActionError==='function')cfg.emitActionError(detail);}
    });
    actionCleanups.push(function(){action.destroy();});
    actionCleanups.push(DOM.listen(element,'click',function(event){data.event=event;if(buttonDisabled(buttonConfig,data)||action.snapshot().pending){event.preventDefault();return;}action.run({event:event},{source:DOM.activationSource(event)}).then(function(resolved){if((typeof cfg.isDestroyed==='function'&&cfg.isDestroyed())||action.snapshot().destroyed)return;if(resolved!==false&&buttonConfig.closeOnClick&&typeof cfg.close==='function')cfg.close(buttonConfig.role||'button',event);},function(){});}));
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
  function disposeFrame(reason){
    clearActions();
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
  function destroy(){clearActions();}
  return Object.freeze({closeConfig:closeConfig,syncCloseButton:syncCloseButton,syncChrome:syncChrome,initialFocus:initialFocus,overlayOptions:overlayOptions,renderValue:function(host,value,context){renderValue(host,value,context,doc);},applyStyle:applyStyle,clearActions:clearActions,createActionButton:createActionButton,renderFooter:renderFooter,requestClose:requestClose,isClosing:function(){return closeGuard;},disposeFrame:disposeFrame,destroy:destroy});
}

export const OverlayFrameShell = Object.freeze({ create });
export { create };
