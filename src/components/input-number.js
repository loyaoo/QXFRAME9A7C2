import { FieldComponent, fieldHooks } from './field.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Scheduler } from '../core/scheduler.js';
import { NumericInput } from '../core/numericInput.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { Utils } from '../utils/utils.js';

const state = new WeakMap();
const own = Utils.own;
function modeName(value) {
    const mode = String(value == null ? 'input' : value).toLowerCase();
    if (mode !== 'input' && mode !== 'button') throw new TypeError('[QXFRAME9A7C2] InputNumber mode must be "input" or "button".');
    return mode;
}

export class InputNumber extends FieldComponent {
    static contract = getContract('InputNumber');
    static immutableOptions = Object.freeze(['target', 'container', 'formField']);
    static optionNormalizers = Object.freeze({ mode: modeName });
    static create(source, overrides) { return new this(source, overrides).render(); }
    static enhance(input, options) { return this.create(input, options || {}); }

    constructor(source = {}, overrides) {
        const fieldInit = Control.resolveFieldOptions(source, overrides);
        const incoming = fieldInit.options;
        const nativeInput = fieldInit.formField;
        if (nativeInput) {
            if (!own(incoming, 'value')) incoming.value = fieldInit.nativeValue;
            for (const name of ['min','max','step']) if (!own(incoming, name) && nativeInput.hasAttribute(name)) incoming[name] = nativeInput.getAttribute(name);
        }
        const opts = { step:1, controls:true, keyboard:true, changeOnWheel:false, changeOnBlur:true, stringMode:false, mode:'input', ...incoming };
        if (!opts.container && !opts.formField) throw new TypeError('[QXFRAME9A7C2] InputNumber requires target/container or formField.');
        opts.mode = modeName(opts.mode);
        super(opts);
        state.set(this, {
            fieldInit,
            doc: opts.document || (opts.container && opts.container.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || globalThis.document,
            numeric: null, control: null, field: null, frame: null, actions: null, upButton: null, downButton: null,
            composing:false, repeatState:{active:false,up:true,event:null}, repeatScheduler:null, rendered:false
        });
    }

    #numericOptions(includeInitial, sourceOptions) {
        const source = sourceOptions || this.options;
        const next = {
            step:source.step,min:source.min,max:source.max,precision:source.precision,stringMode:source.stringMode===true,
            formatter:source.formatter,parser:source.parser,decimalSeparator:source.decimalSeparator,
            disabled:source.disabled===true,readOnly:source.readOnly===true,
            onInput:(display,detail)=>{if(typeof this.options.onInput==='function')this.options.onInput(display,{...detail,instance:this});},
            onChange:(value,detail)=>{this.setFieldValue(value,{silent:true,force:true});if(typeof this.options.onChange==='function')this.options.onChange(value,{...detail,instance:this});},
            onStep:(value,detail)=>{if(typeof this.options.onStep==='function')this.options.onStep(value,{...detail,instance:this});}
        };
        if (includeInitial) {
            if (own(source,'value')) next.value=source.value;
            else if (own(source,'defaultValue')) next.defaultValue=source.defaultValue;
        }
        return next;
    }

    #syncNumericFromLiveEditor(meta) {
        const record=state.get(this); if(!record.field)return false;
        const live=String(record.field.value==null?'':record.field.value);
        if(record.numeric.getState().inputValue===live)return false;
        record.numeric.collectInput(live,{reason:'live-editor-sync',source:'input',composing:false,...(meta||{})});return true;
    }
    #renderActions() {
        const record=state.get(this), opts=this.options, actions=record.actions, up=record.upButton, down=record.downButton;
        const hasControls=opts.controls!==false, side=opts.mode==='button'&&hasControls, root=record.control.getRootElement(), frame=record.frame, doc=record.doc;
        actions.classList.toggle('is-sides',side);root.classList.toggle('is-mode-button',opts.mode==='button');root.classList.toggle('has-controls',hasControls);root.classList.toggle('has-side-controls',side);actions.hidden=!hasControls;actions.classList.toggle('is-hidden',!hasControls);
        if(hasControls){if(actions.parentNode!==frame)frame.appendChild(actions);}else if(actions.parentNode)actions.parentNode.removeChild(actions);
        up.textContent='';down.textContent='';
        const ug=doc.createElement('span');ug.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+(side?'plus':'small-caret-up')+' is-line is-round is-stroke-3'+(side?'':' is-half-height');up.appendChild(ug);
        const dg=doc.createElement('span');dg.className='qxframe9a7c2-icon qxframe9a7c2-icon-'+(side?'minus':'small-caret-down')+' is-line is-round is-stroke-3'+(side?'':' is-half-height');down.appendChild(dg);
    }
    #syncProjection(preserveDOMValue, meta) {
        const record=state.get(this); if(this.destroyed||!record.numeric||!record.control)return;
        const current=record.numeric.getState();
        if(!preserveDOMValue||record.field.value!==current.inputValue)record.control.setInputValue(current.inputValue);
        record.control.setCommittedValue(current.stringValue,meta||{silent:true,source:'numeric',reason:'projection'});
        record.control.setHasValue(current.inputValue!==''||current.stringValue!=='');record.control.setDraftVisual(current.userTyping===true);
        record.upButton.disabled=current.upDisabled;record.downButton.disabled=current.downDisabled;
    }
    #step(up, source='api', emitter=source, event=null) {
        const record=state.get(this); if(this.destroyed)return false;
        const did=up?record.numeric.stepUp({reason:'step',source,emitter,originalEvent:event,multiplier:event&&event.shiftKey?10:1}):record.numeric.stepDown({reason:'step',source,emitter,originalEvent:event,multiplier:event&&event.shiftKey?10:1});
        if(did){this.#syncProjection(false,{source,reason:'step'});record.control.focus();}return did;
    }
    #stopRepeat() { const r=state.get(this);r.repeatState.active=false;r.repeatState.event=null;if(r.repeatScheduler)r.repeatScheduler.cancel(); }
    #startRepeat(up,event){if(!this.#step(up,'pointer','handler',event))return false;this.#stopRepeat();const r=state.get(this);r.repeatState.active=true;r.repeatState.up=up;r.repeatState.event=event||null;r.repeatScheduler.request(600,'initial-repeat');return true;}

    [componentHooks.render]() {
        const record=state.get(this); if(record.rendered)return record.control.getRootElement();
        const numeric=this.own(NumericInput.create(this.#numericOptions(true))), initial=numeric.getState();
        const control=this.own(Control.create({
            container:this.options.container,formField:this.options.formField,mode:'input',inputValue:initial.inputValue,committedValue:initial.stringValue,
            editable:true,clearable:false,disabled:this.disabled,readOnly:this.readOnly,required:this.options.required===true,size:this.options.size,status:this.options.status,variant:this.options.variant,focusOutline:this.options.focusOutline,classNames:this.options.classNames,styles:this.options.styles,placeholder:this.options.placeholder,prefix:this.options.prefix,suffix:this.options.suffix,name:this.options.name,
            onInput:(display,event)=>{numeric.collectInput(display,{reason:'input',source:'input',originalEvent:event,composing:record.composing});this.#syncProjection(true,{source:'input',reason:'input'});},
            onFocus:event=>{if(typeof this.options.onFocus==='function')this.options.onFocus(event,this);},
            onKeydown:event=>{if(event.key==='Enter'){if(!record.composing){this.#syncNumericFromLiveEditor({reason:'enter-live-editor',source:'keyboard',originalEvent:event});numeric.flush({reason:'enter',source:'keyboard',originalEvent:event});this.#syncProjection(false,{source:'keyboard',reason:'enter'});}if(typeof this.options.onPressEnter==='function')this.options.onPressEnter(event,{value:numeric.getState().value,instance:this});return;}if(this.options.keyboard===false||record.composing)return;if(event.key==='ArrowUp'||event.key==='Up'){event.preventDefault();this.#step(true,'keyboard','keyboard',event);}else if(event.key==='ArrowDown'||event.key==='Down'){event.preventDefault();this.#step(false,'keyboard','keyboard',event);}}
        }));
        record.numeric=numeric;record.control=control;record.frame=control.getControlElement();record.field=control.getInputElement();
        const root=control.getRootElement(), frame=record.frame, field=record.field, doc=record.doc;root.classList.add('qxframe9a7c2-input-number');frame.classList.add('qxframe9a7c2-input-number-frame');field.classList.add('qxframe9a7c2-input-number-input');DOM.configureTextInput(field,{mode:'numeric',inputMode:this.options.inputMode||'decimal'});
        const actions=doc.createElement('span'),up=doc.createElement('button'),down=doc.createElement('button');actions.className='qxframe9a7c2-input-number-actions';up.type=down.type='button';up.tabIndex=down.tabIndex=-1;up.className='qxframe9a7c2-input-number-action is-up';down.className='qxframe9a7c2-input-number-action is-down';actions.appendChild(up);actions.appendChild(down);frame.appendChild(actions);record.actions=actions;record.upButton=up;record.downButton=down;this.own(()=>actions.remove());
        const repeat=this.own(Scheduler.createDelayScheduler(()=>{if(!record.repeatState.active||this.destroyed)return;this.#step(record.repeatState.up,'pointer','handler',record.repeatState.event);if(record.repeatState.active&&!this.destroyed)repeat.request(200,'repeat');}));record.repeatScheduler=repeat;this.own(()=>this.#stopRepeat());
        this.own(DOM.listen(frame,'blur',event=>{const next=event.relatedTarget;if(next&&frame.contains(next))return;if(!record.composing)this.#syncNumericFromLiveEditor({reason:'blur-live-editor',source:'blur',originalEvent:event});if(this.options.changeOnBlur!==false)numeric.flush({reason:'blur',source:'blur',originalEvent:event});else numeric.restoreInput({reason:'blur-restore',source:'blur',originalEvent:event});this.#syncProjection(false,{source:'blur',reason:this.options.changeOnBlur!==false?'blur':'blur-restore'});if(typeof this.options.onBlur==='function')this.options.onBlur(event,this);},true));
        const bindAction=(button,isUp)=>{let pointerStepped=false;const suppress=this.own(Scheduler.createDelayScheduler(()=>{pointerStepped=false;}));this.own(DOM.listen(button,'pointerdown',event=>{event.preventDefault?.();pointerStepped=this.#startRepeat(isUp,event)===true;}));this.own(DOM.listen(button,'pointerup',()=>{this.#stopRepeat();suppress.request(0,'pointerup');}));this.own(DOM.listen(button,'pointercancel',()=>{pointerStepped=false;suppress.cancel();this.#stopRepeat();}));this.own(DOM.listen(button,'pointerleave',()=>{pointerStepped=false;suppress.cancel();this.#stopRepeat();}));this.own(DOM.listen(button,'click',event=>{event.preventDefault?.();event.stopPropagation?.();if(pointerStepped){pointerStepped=false;suppress.cancel();return;}this.#step(isUp,DOM.activationSource(event),'action',event);}));};bindAction(up,true);bindAction(down,false);
        this.own(DOM.listen(field,'compositionstart',()=>{record.composing=true;}));this.own(DOM.listen(field,'compositionend',event=>{record.composing=false;numeric.collectInput(field.value,{reason:'compositionend',source:'input',originalEvent:event,composing:false});this.#syncProjection(true,{source:'input',reason:'compositionend'});}));
        this.own(DOM.listen(frame,'wheel',event=>{if(this.options.changeOnWheel!==true||InteractionPolicy.mutationLocked(this.options))return;event.preventDefault?.();event.stopPropagation?.();this.#step(event.deltaY<0,'wheel','wheel',event);},{passive:false}));
        if(control.onFormReset)control.onFormReset(()=>{numeric.setValue(initial.value,{silent:true,source:'form',reason:'reset'});this.#syncProjection(false);});
        this.#renderActions();this.#syncProjection(false);record.rendered=true;this.bindFocusTarget(field);this.setFieldValue(initial.value,{silent:true,force:true});return root;
    }

    [componentHooks.beforeOptionsUpdate](patch, previous) {
        for(const name of ['target','container','formField'])if(own(patch,name))throw new Error('[QXFRAME9A7C2] InputNumber option "'+name+'" is immutable; destroy and recreate to change it.');
        const record=state.get(this);if(!record.numeric)return;
        const candidate={...previous,...patch};if(own(patch,'mode'))candidate.mode=modeName(patch.mode);
        record.numeric.updateOptions({...this.#numericOptions(false,candidate),...(own(patch,'value')?{value:patch.value}:{})});
    }
    [fieldHooks.fieldOptionsUpdated](next) {
        const r=state.get(this);if(!r.control)return;r.control.updateOptions({disabled:next.disabled===true,readOnly:next.readOnly===true,required:next.required===true,size:next.size,status:next.status,variant:next.variant,focusOutline:next.focusOutline,classNames:next.classNames,styles:next.styles,placeholder:next.placeholder,prefix:next.prefix,suffix:next.suffix,name:next.name});DOM.configureTextInput(r.field,{mode:'numeric',inputMode:next.inputMode||'decimal'});this.#renderActions();this.#syncProjection(false);
    }
    setValue(value,config={}){if(this.destroyed)return false;const r=state.get(this);r.numeric.setValue(value,{reason:config.reason||'api',source:config.source||'api',silent:config.silent===true,strict:config.strict===true});this.#syncProjection(false,{silent:config.silent===true,source:config.source||'api',reason:config.reason||'api'});return this;}
    getValue(){return state.get(this).numeric.getState().value;}
    stepUp(config={}){this.#step(true,config.source||'api',config.emitter||'api',config.event||null);return this;}
    stepDown(config={}){this.#step(false,config.source||'api',config.emitter||'api',config.event||null);return this;}
    flush(config={}){if(this.destroyed)return false;const r=state.get(this);if(!r.composing)this.#syncNumericFromLiveEditor({reason:(config.reason||'api')+'-live-editor',source:config.source||'api',originalEvent:config.event||null,silent:config.silent===true});r.numeric.flush({reason:config.reason||'api',source:config.source||'api',originalEvent:config.event||null,silent:config.silent===true});this.#syncProjection(false,{silent:config.silent===true,source:config.source||'api',reason:config.reason||'flush'});return this;}
    focus(){const c=state.get(this).control;return this.destroyed||!c?false:c.focus();}
    blur(){const c=state.get(this).control;return this.destroyed||!c?false:c.blur();}
    getState(){const r=state.get(this),n=r.numeric?r.numeric.getState():null,c=r.control?r.control.getState():null;return Object.freeze({value:n?n.value:this.value,stringValue:n?n.stringValue:'',inputValue:n?n.inputValue:'',focused:c?c.focused:false,userTyping:n?n.userTyping:false,disabled:n?n.disabled:this.disabled,readOnly:n?n.readOnly:this.readOnly,upDisabled:n?n.upDisabled:false,downDisabled:n?n.downDisabled:false,destroyed:this.destroyed});}
    getControl(){return state.get(this).control;}
    getNumericInput(){return state.get(this).numeric;}
    getRootElement(){const c=state.get(this).control;return c?c.getRootElement():this.root;}
    getInputElement(){const c=state.get(this).control;return c?c.getInputElement():null;}
    getActionsElement(){return state.get(this).actions;}
}
