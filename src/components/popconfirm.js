import { PopupComponent } from './popup.js';
import { Popover } from './popover.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { AsyncAction } from '../core/asyncAction.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FeedbackController } from '../core/feedbackController.js';
import { DOM } from '../core/dom.js';
import { Utils } from '../utils/utils.js';

const SIZES = Object.freeze(['xs','sm','md','lg','xl']);
const state = new WeakMap();
const own = Utils.own;
function normalizeSize(value) { return Utils.normalizeEnum(value == null || value === '' ? 'md' : value, SIZES, undefined, 'Popconfirm size'); }
function renderValue(target, value, context) {
    while (target.firstChild) target.removeChild(target.firstChild);
    const output = Utils.isFunction(value) ? value(context) : value;
    if (output === undefined || output === null || output === '') return false;
    if (output && typeof output === 'object' && typeof output.nodeType === 'number') target.appendChild(output); else target.textContent = String(output);
    return true;
}
function requireState(instance) { const record = state.get(instance); if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Popconfirm instance.'); return record; }

function createActionFeedbackProjector(record) {
    const apply = snapshot => {
        const pending = snapshot.status === 'pending' || snapshot.status === 'progress';
        record.confirmButton.classList.toggle('is-loading', pending);
        return record.confirmButton;
    };
    return Object.freeze({
        show: snapshot => apply(snapshot),
        update: (_handle, snapshot) => apply(snapshot),
        close: () => { record.confirmButton.classList.remove('is-loading'); return true; }
    });
}

export class Popconfirm extends PopupComponent {
    static contract = ComponentContracts.get('Popconfirm');
    static profile = Object.freeze({
        name: 'Popconfirm',
        focus: Object.freeze({ mode: 'trigger-overlay-scope' }),
        interaction: Object.freeze({ keymap: 'trigger-activation' }),
        capability: Object.freeze({ open: true, activate: true }),
        motion: Object.freeze({ mode: 'presence' }),
        overlay: Object.freeze({ mode: 'popup' }),
        feedback: Object.freeze({ mode: 'confirm-action' }),
        ownership: Object.freeze({
            focus: 'FocusController',
            interaction: 'InteractionController',
            capability: 'CapabilityController',
            motion: 'MotionController',
            overlay: 'OverlayController',
            feedback: 'FeedbackController'
        })
    });
    static options = Object.freeze({
        trigger:'click', placement:'top', showArrow:true, arrowPadding:8, size:'md', open:false, disabled:false,
        confirmText:'确认', cancelText:'取消', danger:false, closeOnOutsidePress:true, closeOnFocusOutside:true, closeOnTabExit:true, closeOnEscape:true
    });
    static optionNormalizers = Object.freeze({ size: normalizeSize });

    [componentHooks.beforeOptionsUpdate](patch, previous) {
        if (own(patch,'reference') && patch.reference !== previous.reference) throw new Error('[QXFRAME9A7C2] Popconfirm reference is immutable; destroy and recreate to change it.');
        if (own(patch,'portalContainer') && patch.portalContainer !== previous.portalContainer) throw new Error('[QXFRAME9A7C2] Popconfirm portalContainer is immutable; destroy and recreate to change it.');
    }

    [componentHooks.render](opts) {
        const doc = opts.document || globalThis.document;
        const body = doc.createElement('div'), message = doc.createElement('div'), warning = doc.createElement('span'), copy = doc.createElement('div'), title = doc.createElement('div'), content = doc.createElement('div'), actions = doc.createElement('div'), cancelButton = doc.createElement('button'), confirmButton = doc.createElement('button');
        body.className='qxframe9a7c2-popconfirm-root'; message.className='qxframe9a7c2-popconfirm-wrapper'; warning.className='qxframe9a7c2-popconfirm-icon'; copy.className='qxframe9a7c2-popconfirm-section'; title.className='qxframe9a7c2-popconfirm-title'; content.className='qxframe9a7c2-popconfirm-content'; actions.className='qxframe9a7c2-popconfirm-actions';
        cancelButton.type='button'; cancelButton.className='qxframe9a7c2-button is-default is-outlined qxframe9a7c2-popconfirm-cancel'; confirmButton.type='button'; confirmButton.className='qxframe9a7c2-button is-primary is-solid qxframe9a7c2-popconfirm-confirm';
        message.appendChild(warning); copy.appendChild(title); copy.appendChild(content); message.appendChild(copy); actions.appendChild(cancelButton); actions.appendChild(confirmButton); body.appendChild(message); body.appendChild(actions);
        const record={doc,body,message,warning,copy,title,content,actions,cancelButton,confirmButton,action:null,actionCapability:null,feedback:null,popover:null}; state.set(this,record);
        record.feedback=FeedbackController.createForProjector(createActionFeedbackProjector(record),{ownerId:this.id},'local');
        record.action=AsyncAction.create({
            action:(input,context)=>{ const current=this.options; if(!Utils.isFunction(current.onConfirm))return true; return current.onConfirm({originalEvent:input&&input.originalEvent||null,source:context.source,reason:'confirm',popconfirm:this}); },
            onStateChange:(snapshot,detail)=>{ this.#publishActionFeedback(snapshot,detail); this.#syncView(); }
        });
        record.actionCapability=CapabilityController.create({
            getState:()=>({disabled:this.destroyed||this.options.disabled===true||record.action.snapshot().pending}),
            capabilities:Object.freeze({activatable:true})
        });
        record.popover=Popover.create({
            reference:opts.reference, portalContainer:opts.portalContainer, document:doc, trigger:opts.trigger, placement:opts.placement, strategy:opts.strategy, middleware:opts.middleware, offset:opts.offset,
            showArrow:opts.showArrow!==false, arrowPadding:opts.arrowPadding, size:opts.size, open:false, disabled:opts.disabled===true,
            closeOnOutsidePress:opts.closeOnOutsidePress!==false, closeOnFocusOutside:opts.closeOnFocusOutside!==false, closeOnTabExit:opts.closeOnTabExit!==false, focusScope:'contain', closeOnEscape:opts.closeOnEscape!==false, destroyOnClose:opts.destroyOnClose!==false,
            restoreFocus:opts.restoreFocus!==false, restoreFocusOnClose:detail=>this.#restoreFocusOnClose(detail), openDelay:opts.openDelay, closeDelay:opts.closeDelay, content:body,
            beforeOpen:detail=>{const current=this.options;if(this.destroyed||current.disabled===true)return false;if(Utils.isFunction(current.beforeOpen))return current.beforeOpen(detail,this);},
            beforeClose:detail=>{const current=this.options;if(record.action.snapshot().pending&&(!detail||detail.forceClose!=='destroy'))return false;if(Utils.isFunction(current.beforeClose))return current.beforeClose(detail,this);},
            onOpen:payload=>{const current=this.options,out={source:payload.source||'api',reason:payload.reason,originalEvent:payload.originalEvent,popconfirm:this};if(Utils.isFunction(current.onOpen))current.onOpen(out);this.emit('open',out);},
            onClose:payload=>{const current=this.options,out={source:payload.source||'api',reason:payload.reason,originalEvent:payload.originalEvent,popconfirm:this};if(Utils.isFunction(current.onClose))current.onClose(out);this.emit('close',out);}
        });
        const reference=DOM.requireElement(opts.reference,doc,'Popconfirm reference');
        this.adoptPopupRuntime(record.popover.getTrigger(),{reference,popup:record.popover.getPopupElement(),owned:false});
        // Preserve teardown order: listeners -> Feedback/Capability -> AsyncAction -> Popover.
        this.own(record.popover); this.own(record.action); this.own(record.actionCapability); this.own(record.feedback); this.listen(cancelButton,'click',event=>this.cancel(event)); this.listen(confirmButton,'click',event=>this.confirm(event));
        this.#syncView(); if(opts.open===true)this.open('initial'); return body;
    }

    #publishActionFeedback(snapshot, detail) {
        const record=requireState(this), stateName=String(snapshot&&snapshot.state||'idle');
        const status=stateName==='cancelled'||stateName==='destroyed'?'idle':stateName;
        const requestId=String(snapshot&&snapshot.requestId||0);
        record.feedback.publish({
            operation:'confirm', status, requestId, generation:Number(snapshot&&snapshot.requestId)||0,
            message:String(this.options.confirmText||'确认'), target:'local'
        },{source:detail&&detail.source||'programmatic',reason:'confirm-'+status});
    }

    #canConfirm() {
        const r=requireState(this);
        return !!(r.actionCapability&&r.actionCapability.can('activate')&&this.options.confirmDisabled!==true);
    }

    #canCancel() {
        const r=requireState(this);
        return !!(r.actionCapability&&r.actionCapability.can('activate')&&this.options.cancelDisabled!==true);
    }

    #restoreFocusOnClose(detail) {
        const opts=this.options,reason=String(detail&&detail.reason||'');
        if(reason==='confirm'||reason==='cancel')return opts.restoreFocus!==false;
        if(Utils.isFunction(opts.restoreFocusOnClose))return opts.restoreFocusOnClose(detail,this)===true;
        return opts.restoreFocusOnClose===true;
    }

    #syncView() {
        const r=requireState(this),opts=this.options;
        SIZES.forEach(size=>r.body.classList.remove('is-'+size)); r.body.classList.add('is-'+opts.size); r.body.classList.toggle('is-danger',opts.danger===true);
        const hasTitle=renderValue(r.title,opts.title,this),hasContent=renderValue(r.content,opts.content,this);
        if(!hasTitle&&r.title.parentNode)r.title.parentNode.removeChild(r.title); if(!hasContent&&r.content.parentNode)r.content.parentNode.removeChild(r.content);
        let before=null;if(hasContent){if(r.content.parentNode!==r.copy)r.copy.appendChild(r.content);before=r.content;}if(hasTitle&&(r.title.parentNode!==r.copy||r.title.nextSibling!==before))r.copy.insertBefore(r.title,before);
        if(opts.icon===undefined){while(r.warning.firstChild)r.warning.removeChild(r.warning.firstChild);const glyph=r.doc.createElement('span');glyph.className='qxframe9a7c2-icon qxframe9a7c2-icon-alert-triangle is-line is-round is-stroke-3';r.warning.appendChild(glyph);}else renderValue(r.warning,opts.icon,this);
        if(opts.showWarning!==false){if(r.warning.parentNode!==r.message)r.message.insertBefore(r.warning,r.copy);}else if(r.warning.parentNode)r.warning.parentNode.removeChild(r.warning);
        r.cancelButton.textContent=String(opts.cancelText||'取消');r.confirmButton.textContent=String(opts.confirmText||'确认');r.confirmButton.classList.toggle('is-primary',opts.danger!==true);r.confirmButton.classList.toggle('is-error',opts.danger===true);r.confirmButton.classList.add('is-solid');
        r.cancelButton.disabled=!this.#canCancel();r.confirmButton.disabled=!this.#canConfirm();
    }

    [componentHooks.optionsUpdated](opts,previous,patch) {
        const r=requireState(this);this.#syncView();
        r.popover.updateOptions({trigger:opts.trigger,placement:opts.placement,strategy:opts.strategy,middleware:opts.middleware,offset:opts.offset,showArrow:opts.showArrow!==false,arrowPadding:opts.arrowPadding,size:opts.size,disabled:opts.disabled===true,closeOnOutsidePress:opts.closeOnOutsidePress!==false,closeOnFocusOutside:opts.closeOnFocusOutside!==false,closeOnTabExit:opts.closeOnTabExit!==false,focusScope:'contain',closeOnEscape:opts.closeOnEscape!==false,destroyOnClose:opts.destroyOnClose!==false,restoreFocus:opts.restoreFocus!==false,restoreFocusOnClose:detail=>this.#restoreFocusOnClose(detail),openDelay:opts.openDelay,closeDelay:opts.closeDelay});
        if(own(patch,'open'))this.setOpen(opts.open===true,'update-options');
    }

    confirm(event) {
        const r=requireState(this),opts=this.options;if(this.destroyed||!this.#canConfirm())return false;
        const source=DOM.activationSource(event);r.action.run({originalEvent:event||null},{source}).then(value=>{if(this.destroyed)return value;const payload={value,source,reason:'confirm',originalEvent:event||null,popconfirm:this};this.emit('confirm',payload);if(!this.destroyed&&value!==false)this.close('confirm',event||null);return value;},error=>{if(this.destroyed)return;const payload={error,source,reason:'confirm',originalEvent:event||null,popconfirm:this};if(Utils.isFunction(this.options.onConfirmError))this.options.onConfirmError(payload);this.emit('confirmError',payload);});return true;
    }
    cancel(event) { const r=requireState(this),opts=this.options;if(this.destroyed||!this.#canCancel())return false;const payload={source:DOM.activationSource(event),reason:'cancel',originalEvent:event||null,popconfirm:this};if(Utils.isFunction(opts.onCancel))opts.onCancel(payload);if(this.destroyed)return true;this.emit('cancel',payload);if(!this.destroyed)this.close('cancel',event||null);return true; }
    setTitle(value){if(!this.destroyed){this.updateOptions({title:value});if(this.getPopupRuntimeState().open)this.reposition('title');}return this;}
    setIcon(value){if(!this.destroyed){this.updateOptions({icon:value});if(this.getPopupRuntimeState().open)this.reposition('icon');}return this;}
    setContent(value){if(!this.destroyed){this.updateOptions({content:value});if(this.getPopupRuntimeState().open)this.reposition('content');}return this;}
    getState(){const r=requireState(this),p=this.getPopupRuntimeState(),s=r.action.snapshot(),opts=this.options;return Object.freeze({open:p.open,pending:s.pending,error:s.error,disabled:opts.disabled===true,confirmDisabled:opts.confirmDisabled===true,cancelDisabled:opts.cancelDisabled===true,danger:opts.danger===true,size:opts.size,destroyed:this.destroyed});}
    getPopover(){return requireState(this).popover;}
    getActionCapabilityController(){return requireState(this).actionCapability;}
    getFeedbackController(){return requireState(this).feedback;}
    getAsyncAction(){return requireState(this).action;}
    getAsyncTask(){return requireState(this).action;}
}
