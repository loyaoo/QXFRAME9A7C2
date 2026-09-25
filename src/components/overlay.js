import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';

const state = new WeakMap();

function requireState(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid OverlayComponent instance.');
    return record;
}

export class OverlayComponent extends Component {
    constructor(options = {}) {
        super(options);
        state.set(this, { controller: null });
    }

    adoptOverlayFamilyController(controller) {
        const record = requireState(this);
        if (record.controller) throw new Error('[QXFRAME9A7C2] Overlay family controller is already initialized.');
        if (!controller || typeof controller.open !== 'function' || typeof controller.close !== 'function' || typeof controller.getState !== 'function' || typeof controller.destroy !== 'function') {
            throw new TypeError('[QXFRAME9A7C2] OverlayComponent requires an overlay family controller.');
        }
        record.controller = controller;
        return controller;
    }

    adoptOverlayController(controller) { return this.adoptOverlayFamilyController(controller); }

    open(reason, originalEvent) {
        if (this.destroyed || this.options.disabled === true) return this;
        const controller = requireState(this).controller;
        if (controller) controller.open(reason || 'open', originalEvent || null);
        return this;
    }

    close(reason, originalEvent) {
        if (this.destroyed) return this;
        const controller = requireState(this).controller;
        if (controller) controller.close(reason || 'close', originalEvent || null);
        return this;
    }

    setOpen(value, reason, originalEvent) {
        return value === true ? this.open(reason || 'setOpen', originalEvent) : this.close(reason || 'setOpen', originalEvent);
    }

    setTitle(value) { return this.updateOptions({ title: value }); }
    setContent(value) { return this.updateOptions({ content: value }); }
    setButtons(value) { return this.updateOptions({ buttons: Array.isArray(value) ? value : [] }); }
    setHeaderVisible(value) { return this.updateOptions({ header: value !== false }); }
    setFooterVisible(value) { return this.updateOptions({ footer: value !== false }); }
    setClosable(value) { return this.updateOptions({ closable: value }); }

    getOverlayFamilyController() { return requireState(this).controller; }
    getOverlayController() { return this.getOverlayFamilyController(); }
    getOverlayResourceController() {
        const controller = this.getOverlayFamilyController();
        return controller && typeof controller.getOverlayResourceController === 'function' ? controller.getOverlayResourceController() : null;
    }

    getState() {
        const controller = requireState(this).controller;
        return controller ? controller.getState() : Object.freeze({ open: false, destroyed: this.destroyed });
    }

    getRootElement() { const c = requireState(this).controller; return c && c.getRootElement ? c.getRootElement() : this.root; }
    getMaskElement() { const c = requireState(this).controller; return c && c.getMaskElement ? c.getMaskElement() : null; }
    getWrapElement() { const c = requireState(this).controller; return c && c.getWrapElement ? c.getWrapElement() : null; }
    getBodyElement() { const c = requireState(this).controller; return c && c.getBodyElement ? c.getBodyElement() : null; }
    getOverlayRuntime() {
        const resource = this.getOverlayResourceController();
        if (resource && typeof resource.getRuntime === 'function') return resource.getRuntime();
        const c = this.getOverlayFamilyController();
        return c && c.getOverlayRuntime ? c.getOverlayRuntime() : null;
    }
    getMotionControllers() { const c = this.getOverlayFamilyController(); return c && typeof c.getMotionControllers === 'function' ? c.getMotionControllers() : Object.freeze({}); }
    getInteractionController() { const c = this.getOverlayFamilyController(); return c && typeof c.getInteractionController === 'function' ? c.getInteractionController() : null; }
    getCapabilityControllers() { const c = this.getOverlayFamilyController(); return c && typeof c.getCapabilityControllers === 'function' ? c.getCapabilityControllers() : Object.freeze([]); }
    getFeedbackControllers() { const c = this.getOverlayFamilyController(); return c && typeof c.getFeedbackControllers === 'function' ? c.getFeedbackControllers() : Object.freeze([]); }
    getScroll() { const c = requireState(this).controller; return c && c.getScroll ? c.getScroll() : null; }

    [componentHooks.render]() {
        const controller = requireState(this).controller;
        return controller && controller.getRootElement ? controller.getRootElement() : null;
    }

    [componentHooks.optionsUpdated](_next, _previous, patch) {
        const controller = requireState(this).controller;
        if (controller && typeof controller.updateOptions === 'function') controller.updateOptions(patch);
    }

    [componentHooks.beforeDestroy]() {
        const controller = requireState(this).controller;
        if (controller) controller.destroy('destroy');
    }
}
