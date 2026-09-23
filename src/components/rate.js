import { FieldComponent, fieldHooks } from './field.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Renderer } from '../core/renderer.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { StateController } from '../core/stateController.js';
import { Utils } from '../utils/utils.js';

export const RATE_SIZES = Object.freeze(['xs','sm','md','lg','xl']);
const state = new WeakMap();
const own = Utils.own;

function normalizeCount(value) {
    const count = Number(value == null ? 5 : value);
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new TypeError('[QXFRAME9A7C2] Rate count must be an integer between 1 and 100.');
    return count;
}
function normalizeSize(value) { return Utils.normalizeEnum(value == null ? 'md' : value, RATE_SIZES, undefined, 'Rate size'); }
function normalizeMode(value) {
    const mode = String(value == null ? 'interactive' : value).toLowerCase();
    if (mode !== 'interactive' && mode !== 'display') throw new TypeError('[QXFRAME9A7C2] Rate mode must be "interactive" or "display".');
    return mode;
}
function quantize(value, count, half) {
    let number = Number(value == null || value === '' ? 0 : value);
    if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] Rate value must be a finite number.');
    number = Math.max(0, Math.min(count, number));
    const step = half ? 0.5 : 1;
    return Math.round(number / step) * step;
}
function renderOutput(container, output, doc) { Renderer.replace(container, output == null ? '' : output, doc); }
function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Rate instance.');
    return record;
}

export class Rate extends FieldComponent {
    static contract = getContract('Rate');
    static options = Object.freeze({ count:5, half:false, clearable:true, character:null, tooltips:null, keyboard:true, size:'md', mode:'interactive', disabled:false, readOnly:false, required:false });
    static immutableOptions = Object.freeze(['target','container','formField']);
    static optionNormalizers = Object.freeze({ count:normalizeCount, size:normalizeSize, mode:normalizeMode });
    static create(source, overrides) { return new this(source, overrides).render(); }
    static enhance(input, options) { return this.create(input, options || {}); }

    constructor(source = {}, overrides) {
        const fieldInit = Control.resolveFieldOptions(source, overrides);
        const incoming = fieldInit.options;
        if (own(incoming, 'direction')) throw new TypeError('[QXFRAME9A7C2] Rate does not support direction; layout is LTR-only.');
        if (fieldInit.hasNativeValue && !own(incoming, 'value') && !own(incoming, 'defaultValue')) incoming.value = fieldInit.nativeValue;
        super(incoming);
        const opts = this.options;
        const doc = fieldInit.document || opts.document || (opts.container && opts.container.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || globalThis.document;
        const initial = own(opts, 'value') ? opts.value : (own(opts, 'defaultValue') ? opts.defaultValue : 0);
        const valueState = StateController.create({ value:quantize(initial, opts.count, opts.half === true), controlled:own(incoming, 'value'), normalizeValue:next => quantize(next, this.options.count, this.options.half === true) });
        const record = { fieldInit, doc, root:null, items:[], hoverValue:0, valueState, formBridge:null, itemScope:Lifecycle.createScope(), rendered:false, initialValue:valueState.value };
        state.set(this, record);
        this.own(valueState);
        this.own(() => record.itemScope.dispose());
        this.own(() => { if (record.root) DOM.removeNode(record.root); record.items=[]; record.root=null; });
        this.setFieldValue(valueState.value, { silent:true, force:true });
    }

    #interactionPolicy() { const opts=this.options; return InteractionPolicy.resolve({ disabled:this.destroyed||opts.disabled===true, readOnly:opts.readOnly===true }, { focusable:opts.mode==='interactive', tabbable:opts.mode==='interactive', activatable:opts.mode==='interactive', editable:false, selectable:false }); }
    #interactive() { return this.#interactionPolicy().activatable; }
    #stepSize() { return this.options.half === true ? 0.5 : 1; }
    #context(index, layer) { const r=recordFor(this); return Object.freeze({ index, position:index+1, value:r.valueState.value, hoverValue:r.hoverValue, layer, instance:this }); }
    #characterOutput(index, layer) { const opts=this.options,r=recordFor(this); if(typeof opts.character==='function')return opts.character(this.#context(index,layer));if(opts.character!==null&&opts.character!==undefined&&opts.character!=='')return opts.character;const icon=r.doc.createElement('span');icon.className='qxframe9a7c2-icon qxframe9a7c2-icon-star is-fill is-round is-stroke-3';return icon; }
    #tooltipFor(index) { const tips=this.options.tooltips;if(!Array.isArray(tips))return '';const tip=tips[index];return tip==null?'':String(tip); }
    #displayValue() { const r=recordFor(this); return r.hoverValue>0?r.hoverValue:r.valueState.value; }
    #emitHover(next,event,reason) { const r=recordFor(this);if(r.hoverValue===next)return;r.hoverValue=next;this.#renderValue();if(typeof this.options.onHoverChange==='function')this.options.onHoverChange(next,{reason:reason||'hover',originalEvent:event||null,value:r.valueState.value,instance:this}); }
    #setCommitted(next, config={}) {
        if(this.destroyed)return false;
        const r=recordFor(this),opts=this.options,normalized0=quantize(next,opts.count,opts.half===true);
        if(config.user===true&&!this.#interactive())return false;
        let normalized=normalized0;if(config.toggle===true&&opts.clearable===true&&normalized===r.valueState.value)normalized=0;
        const previous=r.valueState.value,changed=!Object.is(normalized,previous);if(!changed){r.hoverValue=0;this.#renderValue();return false;}
        if(config.user===true&&r.valueState.controlled)r.valueState.requestChange(normalized,{silent:true,reason:config.reason||'set-value',source:config.source||'api',originalEvent:config.originalEvent||null});
        else r.valueState.setValue(normalized,{silent:true,reason:config.reason||'set-value',source:config.source||'api',originalEvent:config.originalEvent||null});
        r.hoverValue=0;this.setFieldValue(r.valueState.value,{silent:true,force:true});this.#renderValue();if(r.formBridge)r.formBridge.setValue(r.valueState.value,config);
        if(config.silent!==true&&typeof opts.onChange==='function')opts.onChange(normalized,{reason:config.reason||'set-value',source:config.source||'api',originalEvent:config.originalEvent||null,previousValue:previous,controlled:r.valueState.controlled,instance:this});
        return true;
    }
    #renderValue() { const r=recordFor(this),current=this.#displayValue();r.root.style.setProperty('--qxframe9a7c2-rate-value',String(current));r.items.forEach((entry,index)=>{const fill=Math.max(0,Math.min(1,current-index));entry.item.classList.toggle('is-active',fill>0);entry.item.classList.toggle('is-half',fill>0&&fill<1);entry.active.style.width=(fill*100)+'%';}); }
    #bindHit(node,nextValue,reason) { const r=recordFor(this);r.itemScope.add(DOM.listen(node,'pointerenter',event=>{if(this.#interactive())this.#emitHover(nextValue,event,'pointer');}));r.itemScope.add(DOM.listen(node,'click',event=>{if(!this.#interactive())return;event.preventDefault?.();this.#setCommitted(nextValue,{user:true,toggle:true,reason,source:'pointer',originalEvent:event});})); }
    #buildItems() {
        const r=recordFor(this),opts=this.options,doc=r.doc;r.itemScope.dispose();r.itemScope=Lifecycle.createScope();while(r.root.firstChild)r.root.removeChild(r.root.firstChild);r.items=[];
        for(let index=0;index<opts.count;index+=1){const item=doc.createElement('span'),base=doc.createElement('span'),active=doc.createElement('span'),baseChar=doc.createElement('span'),activeChar=doc.createElement('span'),halfHit=doc.createElement('span'),fullHit=doc.createElement('span');item.className='qxframe9a7c2-rate-item';base.className='qxframe9a7c2-rate-star is-base';active.className='qxframe9a7c2-rate-star is-active';baseChar.className=activeChar.className='qxframe9a7c2-rate-character';halfHit.className='qxframe9a7c2-rate-hit is-half';fullHit.className='qxframe9a7c2-rate-hit is-full';renderOutput(baseChar,this.#characterOutput(index,'base'),doc);renderOutput(activeChar,this.#characterOutput(index,'active'),doc);base.appendChild(baseChar);active.appendChild(activeChar);item.append(base,active,halfHit,fullHit);const tip=this.#tooltipFor(index);if(tip)item.title=tip;r.root.appendChild(item);r.items.push({item,base,active,halfHit,fullHit});this.#bindHit(fullHit,index+1,'pointer-select');if(opts.half===true)this.#bindHit(halfHit,index+0.5,'pointer-select-half');else{halfHit.style.display='none';fullHit.style.left='0';fullHit.style.right='0';}}
    }
    #renderRoot() { const r=recordFor(this),opts=this.options;RATE_SIZES.forEach(size=>r.root.classList.remove('is-'+size));r.root.classList.add('is-'+opts.size);r.root.classList.toggle('is-disabled',opts.disabled===true);r.root.classList.toggle('is-readonly',opts.readOnly===true);r.root.classList.toggle('is-display',opts.mode==='display');r.root.classList.toggle('is-interactive',opts.mode==='interactive');r.root.tabIndex=this.#interactionPolicy().tabbable?0:-1; }
    #rebuild() { this.#renderRoot();this.#buildItems();this.#renderValue(); }

    [componentHooks.render]() {
        const r=recordFor(this);if(r.rendered)return r.root;const opts=this.options,doc=r.doc;const root=doc.createElement('div');root.className='qxframe9a7c2-rate';r.root=root;if(opts.container)opts.container.appendChild(root);else Control.placeFieldRoot(root,null,opts.formField);
        this.own(DOM.listen(root,'pointerleave',event=>{if(r.hoverValue>0)this.#emitHover(0,event,'leave');}));
        this.own(DOM.listen(root,'keydown',event=>{if(!this.#interactive()||this.options.keyboard===false)return;const key=event.key,step=this.#stepSize();let next=null;if(key==='ArrowUp'||key==='Up'||key==='ArrowRight'||key==='Right')next=r.valueState.value+step;else if(key==='ArrowDown'||key==='Down'||key==='ArrowLeft'||key==='Left')next=r.valueState.value-step;else if(key==='Home')next=this.options.clearable===true?0:step;else if(key==='End')next=this.options.count;else if((key==='Delete'||key==='Backspace')&&this.options.clearable===true)next=0;if(next===null)return;event.preventDefault?.();this.#setCommitted(next,{user:true,reason:'keyboard',source:'keyboard',originalEvent:event});}));
        r.formBridge=this.own(Control.createFormFieldBridge({root,target:opts.container,formField:opts.formField,document:doc,moveIntoRoot:false,projectLayout:Control.projectFormFieldLayout,name:opts.name,disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,value:r.valueState.value,serializeValue:opts.serializeValue,getValue:()=>r.valueState.value,onReset:()=>this.#setCommitted(r.initialValue,{silent:true,source:'form',reason:'reset'})}));
        this.#rebuild();r.rendered=true;this.bindFocusTarget(root);return root;
    }

    [componentHooks.beforeOptionsUpdate](patch) { if(own(patch,'direction'))throw new TypeError('[QXFRAME9A7C2] Rate does not support direction; layout is LTR-only.'); }
    [fieldHooks.fieldOptionsUpdated](next, previous, patch) {
        const r=recordFor(this);r.valueState.updateOptions({normalizeValue:candidate=>quantize(candidate,next.count,next.half===true)});if(own(patch,'value')){r.valueState.setControlled(true);r.valueState.syncExternal(next.value,{silent:true,source:'options',reason:'external-sync'});}else r.valueState.setValue(r.valueState.value,{silent:true,source:'options',reason:'requantize'});this.setFieldValue(r.valueState.value,{silent:true,force:true});r.hoverValue=0;if(!r.rendered)return;const rebuildNeeded=own(patch,'count')||own(patch,'half')||own(patch,'character')||own(patch,'tooltips');if(rebuildNeeded)this.#rebuild();else{this.#renderRoot();this.#renderValue();}if(r.formBridge){r.formBridge.updateOptions({name:next.name,disabled:next.disabled===true,readOnly:next.readOnly===true,required:next.required===true,serializeValue:next.serializeValue});r.formBridge.setValue(r.valueState.value,{silent:true});}
    }

    setValue(next,config={}){this.#setCommitted(next,{...config,reason:config.reason||'set-value',source:config.source||'api'});return this;}
    getValue(){return recordFor(this).valueState.value;}
    clear(config={}){this.#setCommitted(0,{...config,reason:config.reason||'clear',source:config.source||'api'});return this;}
    focus(focusOptions){const r=recordFor(this);if(this.destroyed||!r.root||r.root.tabIndex<0)return false;DOM.focusElement(r.root,focusOptions||{preventScroll:true});return r.doc.activeElement===r.root;}
    blur(){const r=recordFor(this);if(this.destroyed||!r.root)return false;r.root.blur();return r.doc.activeElement!==r.root;}
    getState(){const r=recordFor(this),opts=this.options;return Object.freeze({value:r.valueState.value,hoverValue:r.hoverValue,count:opts.count,half:opts.half===true,clearable:opts.clearable===true,keyboard:opts.keyboard!==false,size:opts.size,mode:opts.mode,disabled:opts.disabled===true,readOnly:opts.readOnly===true,destroyed:this.destroyed});}
    getRootElement(){return recordFor(this).root;}
    getFormField(){const b=recordFor(this).formBridge;return b?b.getFormField():null;}
    getFormBridge(){return recordFor(this).formBridge;}
    getItems(){return recordFor(this).items.map(entry=>entry.item);}
}
