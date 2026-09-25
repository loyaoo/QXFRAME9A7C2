import { PopupComponent } from './popup.js';
import { Trigger } from './trigger.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Utils } from '../utils/utils.js';

const state = new WeakMap();
const own = Utils.own;

function resolveElement(value, documentRef, label) { return DOM.requireElement(value, documentRef, 'Popover ' + label); }
function renderContent(target, value, context) {
    const output = Utils.isFunction(value) ? value(context) : value;
    if (output === undefined || output === null) { while (target.firstChild) target.removeChild(target.firstChild); return; }
    if (output && typeof output === 'object' && typeof output.nodeType === 'number') {
        if (target.childNodes.length === 1 && target.firstChild === output) return;
        while (target.firstChild) target.removeChild(target.firstChild);
        target.appendChild(output); return;
    }
    const text = String(output);
    if (target.childNodes.length === 1 && target.firstChild.nodeType === 3) { if (target.firstChild.nodeValue !== text) target.firstChild.nodeValue = text; return; }
    target.textContent = text;
}
function requireState(instance) { const record = state.get(instance); if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Popover instance.'); return record; }

export class Popover extends PopupComponent {
    static contract = ComponentContracts.get('Popover');
    static profile = Object.freeze({
        name: 'Popover',
        focus: Object.freeze({ mode: 'trigger-overlay-scope' }),
        interaction: Object.freeze({ keymap: 'trigger-activation' }),
        capability: Object.freeze({ open: true, activate: true }),
        motion: Object.freeze({ mode: 'presence' }),
        overlay: Object.freeze({ mode: 'popup' }),
        ownership: Object.freeze({
            focus: 'FocusController',
            interaction: 'InteractionController',
            capability: 'CapabilityController',
            motion: 'MotionController',
            overlay: 'OverlayController'
        })
    });
    static options = Object.freeze({
        trigger: 'click', placement: 'bottom', showArrow: false, arrowPadding: 8, open: false, disabled: false,
        closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, closeOnEscape: true, focusScope: 'auto'
    });

    [componentHooks.beforeOptionsUpdate](patch) {
        const record = requireState(this);
        if (own(patch, 'reference') && resolveElement(patch.reference, record.doc, 'reference') !== record.reference) throw new Error('[QXFRAME9A7C2] Popover reference is immutable; destroy and recreate to change it.');
        if (own(patch, 'portalContainer') && resolveElement(patch.portalContainer, record.doc, 'portalContainer') !== record.portalContainer) throw new Error('[QXFRAME9A7C2] Popover portalContainer is immutable; destroy and recreate to change it.');
    }

    [componentHooks.render](opts) {
        const doc = opts.document || globalThis.document;
        const reference = resolveElement(opts.reference, doc, 'reference');
        const portalContainer = opts.portalContainer ? resolveElement(opts.portalContainer, doc, 'portalContainer') : doc.body;
        if (!portalContainer) throw new TypeError('[QXFRAME9A7C2] Popover requires document.body or portalContainer.');
        const panel = doc.createElement('div'), container = doc.createElement('div'), title = doc.createElement('div'), content = doc.createElement('div'), action = doc.createElement('div'), arrow = doc.createElement('div');
        panel.className = 'qxframe9a7c2-popover-root'; panel.hidden = true;
        container.className = 'qxframe9a7c2-popover-container qxframe9a7c2-popup-surface';
        title.className = 'qxframe9a7c2-popover-title'; content.className = 'qxframe9a7c2-popover-content'; action.className = 'qxframe9a7c2-popover-action'; arrow.className = 'qxframe9a7c2-popover-arrow'; panel.appendChild(container);
        const record = { doc, reference, portalContainer, panel, container, title, content, action, arrow };
        state.set(this, record);
        this.own(() => DOM.removeNode(panel));
        this.setupPopupRuntime({
            reference, floating: panel, document: doc, portalContainer,
            trigger: opts.trigger, placement: opts.placement, arrow: opts.showArrow === true, arrowElement: arrow, arrowPadding: opts.arrowPadding, offset: opts.offset,
            transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute', middleware: opts.middleware, autoUpdate: opts.autoUpdate !== false,
            closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnFocusOutside: opts.closeOnFocusOutside !== false, closeOnTabExit: opts.closeOnTabExit !== false,
            focusScope: opts.focusScope, tabExitTarget: reference, closeOnEscape: opts.closeOnEscape !== false, destroyOnClose: opts.destroyOnClose !== false,
            restoreFocus: opts.restoreFocus !== false, restoreFocusOnDismiss: opts.restoreFocus !== false, restoreFocusTarget: reference, restoreFocusOnClose: opts.restoreFocusOnClose,
            containsTarget: opts.containsTarget, openDelay: opts.openDelay, closeDelay: opts.closeDelay, disabled: opts.disabled === true,
            beforeOpen: detail => { if (this.destroyed || this.options.disabled === true) return false; const current = this.options; if (Utils.isFunction(current.beforeOpen)) return current.beforeOpen(detail); },
            beforeClose: detail => { const current = this.options; if (Utils.isFunction(current.beforeClose)) return current.beforeClose(detail); },
            onOpen: detail => this.#onOpen(detail), onClose: detail => this.#onClose(detail)
        });
        this.#syncView();
        if (opts.open === true) this.open('initial');
        return panel;
    }

    #onOpen(detail) {
        const record = requireState(this), trigger = this.getTrigger(), opts = this.options;
        record.panel.classList.add('is-open');
        const payload = { opened: true, source: detail.source || 'api', reason: detail.reason, originalEvent: detail.originalEvent, popover: this };
        if (Utils.isFunction(opts.onOpen)) opts.onOpen(payload); if (trigger && !trigger.getState().open) return;
        if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(true, payload); if (trigger && !trigger.getState().open) return;
        this.emit('open', payload); if (trigger && !trigger.getState().open) return; this.emit('openChange', payload);
    }

    #onClose(detail) {
        const record = requireState(this), trigger = this.getTrigger(), opts = this.options;
        record.panel.classList.remove('is-open');
        const payload = { opened: false, source: detail.source || 'api', reason: detail.reason, originalEvent: detail.originalEvent, popover: this };
        if (Utils.isFunction(opts.onClose)) opts.onClose(payload); if (trigger && trigger.getState().open) return;
        if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(false, payload); if (trigger && trigger.getState().open) return;
        this.emit('close', payload); if (trigger && trigger.getState().open) return; this.emit('openChange', payload);
    }

    #setPart(node, value) {
        const present = !(value === undefined || value === null || value === '');
        renderContent(node, present ? value : '', this);
        if (!present) { if (node.parentNode) node.parentNode.removeChild(node); return false; }
        return true;
    }

    #syncStructure() {
        const record = requireState(this), opts = this.options, parts = [];
        if (this.#setPart(record.title, opts.title)) parts.push(record.title);
        if (this.#setPart(record.content, opts.content)) parts.push(record.content);
        if (this.#setPart(record.action, opts.action)) parts.push(record.action);
        let before = null;
        for (let i = parts.length - 1; i >= 0; i -= 1) { const node = parts[i]; if (node.parentNode !== record.container || node.nextSibling !== before) record.container.insertBefore(node, before); before = node; }
        if (opts.showArrow === true) { if (record.arrow.parentNode !== record.panel) record.panel.appendChild(record.arrow); }
        else if (record.arrow.parentNode) record.arrow.parentNode.removeChild(record.arrow);
    }

    #syncView() {
        const record = requireState(this), opts = this.options;
        ['xs','sm','md','lg','xl'].forEach(size => record.panel.classList.remove('is-' + size));
        record.panel.classList.add('is-' + String(opts.size || 'md').toLowerCase());
        record.panel.classList.toggle('has-arrow', opts.showArrow === true);
        record.panel.setAttribute('data-placement', String(opts.placement || 'bottom'));
        this.#syncStructure();
    }

    [componentHooks.optionsUpdated](opts, previous, patch) {
        const record = requireState(this), trigger = this.getTrigger(), triggerPatch = {};
        if (own(patch, 'showArrow')) this.#syncStructure();
        if (own(patch, 'trigger')) triggerPatch.trigger = opts.trigger;
        if (own(patch, 'placement')) triggerPatch.placement = opts.placement;
        if (own(patch, 'showArrow')) { triggerPatch.arrow = opts.showArrow === true; triggerPatch.arrowElement = record.arrow; if (!own(patch, 'offset')) triggerPatch.offset = opts.offset; }
        if (own(patch, 'arrowPadding')) triggerPatch.arrowPadding = opts.arrowPadding;
        if (own(patch, 'offset')) triggerPatch.offset = opts.offset;
        if (own(patch, 'strategy')) triggerPatch.strategy = opts.strategy || 'absolute';
        if (own(patch, 'middleware')) triggerPatch.middleware = opts.middleware;
        if (own(patch, 'autoUpdate')) triggerPatch.autoUpdate = opts.autoUpdate !== false;
        if (own(patch, 'closeOnOutsidePress')) triggerPatch.closeOnOutsidePress = opts.closeOnOutsidePress !== false;
        if (own(patch, 'closeOnFocusOutside')) triggerPatch.closeOnFocusOutside = opts.closeOnFocusOutside !== false;
        if (own(patch, 'closeOnTabExit')) triggerPatch.closeOnTabExit = opts.closeOnTabExit !== false;
        if (own(patch, 'focusScope')) triggerPatch.focusScope = opts.focusScope;
        if (own(patch, 'closeOnEscape')) triggerPatch.closeOnEscape = opts.closeOnEscape !== false;
        if (own(patch, 'destroyOnClose')) triggerPatch.destroyOnClose = opts.destroyOnClose !== false;
        if (own(patch, 'restoreFocus')) { triggerPatch.restoreFocus = opts.restoreFocus !== false; triggerPatch.restoreFocusOnDismiss = opts.restoreFocus !== false; }
        if (own(patch, 'restoreFocusOnClose')) triggerPatch.restoreFocusOnClose = opts.restoreFocusOnClose;
        if (own(patch, 'containsTarget')) triggerPatch.containsTarget = opts.containsTarget;
        if (own(patch, 'openDelay')) triggerPatch.openDelay = opts.openDelay;
        if (own(patch, 'closeDelay')) triggerPatch.closeDelay = opts.closeDelay;
        if (own(patch, 'disabled')) triggerPatch.disabled = opts.disabled === true;
        if (Object.keys(triggerPatch).length) trigger.updateOptions(triggerPatch);
        this.#syncView();
        if (own(patch, 'open')) this.setOpen(opts.open === true, 'update-options');
        else if (opts.disabled === true && trigger.getState().open) this.close('disabled');
        else if (trigger.getState().open) trigger.reposition('options');
    }

    setTitle(value) { if (!this.destroyed) { this.updateOptions({ title: value }); if (this.getTrigger().getState().open) this.reposition('title'); } return this; }
    setContent(value) { if (!this.destroyed) { this.updateOptions({ content: value }); if (this.getTrigger().getState().open) this.reposition('content'); } return this; }
    setAction(value) { if (!this.destroyed) { this.updateOptions({ action: value }); if (this.getTrigger().getState().open) this.reposition('action'); } return this; }
    getState() {
        const record = requireState(this), popup = this.getPopupRuntimeState(), opts = this.options;
        return Object.freeze({ open: popup.open, disabled: opts.disabled === true, trigger: popup.trigger.join(' '), placement: popup.placement, hasTitle: record.title.parentNode === record.container, hasAction: record.action.parentNode === record.container, destroyed: this.destroyed });
    }
    getReferenceElement() { return super.getReferenceElement(); }
}
