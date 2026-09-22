// Stage 35→40 preparation: canonical Component base.
// It deliberately owns only universal instance lifecycle, options, events and resource cleanup.
import { Events } from './events.js';
import { Lifecycle } from './lifecycle.js';
import { InstanceRegistry } from './instanceRegistry.js';
import { componentHooks } from './componentHooks.js';
import { OptionTransaction } from './optionTransaction.js';
import { validateContractOptions } from './componentContracts.js';
import { IdManager } from '../utils/id.js';
import { Utils } from '../utils/utils.js';

const state = new WeakMap();

function assertOptions(value, label) {
    if (value === undefined || value === null) return {};
    if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'Component options') + ' must be an object.');
    return value;
}

function collectDefaults(ctor) {
    const chain = [];
    let current = ctor;
    while (typeof current === 'function' && current !== Function.prototype) {
        chain.unshift(current);
        if (current === Component) break;
        current = Object.getPrototypeOf(current);
    }
    const defaults = {};
    chain.forEach(type => {
        if (!Object.prototype.hasOwnProperty.call(type, 'options')) return;
        Utils.copyOwn(defaults, assertOptions(type.options, type.name + '.options'));
    });
    return defaults;
}


function collectStaticObject(ctor, key) {
    const chain = [];
    let current = ctor;
    while (typeof current === 'function' && current !== Function.prototype) {
        chain.unshift(current);
        if (current === Component) break;
        current = Object.getPrototypeOf(current);
    }
    const output = {};
    chain.forEach(type => {
        if (!Object.prototype.hasOwnProperty.call(type, key)) return;
        Utils.copyOwn(output, assertOptions(type[key], type.name + '.' + key));
    });
    return Object.freeze(output);
}

function collectStaticList(ctor, key) {
    const chain = [];
    let current = ctor;
    while (typeof current === 'function' && current !== Function.prototype) {
        chain.unshift(current);
        if (current === Component) break;
        current = Object.getPrototypeOf(current);
    }
    const output = [];
    chain.forEach(type => {
        if (!Object.prototype.hasOwnProperty.call(type, key)) return;
        const values = type[key] == null ? [] : type[key];
        if (!Array.isArray(values)) throw new TypeError('[QXFRAME9A7C2] ' + type.name + '.' + key + ' must be an array.');
        values.forEach(value => { const name = String(value || '').trim(); if (name && !output.includes(name)) output.push(name); });
    });
    return Object.freeze(output);
}

function componentName(instance) {
    const name = instance && instance.constructor && instance.constructor.name;
    return name && name !== 'Component' ? name : 'component';
}

function cleanupFor(resource) {
    if (typeof resource === 'function') return resource;
    if (!resource || (typeof resource !== 'object' && typeof resource !== 'function')) return null;
    for (const name of ['destroy', 'dispose', 'abort', 'remove']) {
        if (typeof resource[name] === 'function') return () => resource[name]();
    }
    return null;
}

function requireState(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Component instance.');
    return record;
}

function assertAlive(record, action) {
    if (record.destroyed) throw new Error('[QXFRAME9A7C2] Cannot ' + action + ' a destroyed Component.');
}

function updateRoot(instance, record, nextRoot) {
    if (nextRoot === undefined) return record.root;
    if (nextRoot === record.root) return record.root;
    InstanceRegistry.bindRoot(instance, nextRoot);
    record.root = nextRoot == null ? null : nextRoot;
    return record.root;
}

export class Component {
    static options = Object.freeze({});
    static optionNormalizers = Object.freeze({});
    static immutableOptions = Object.freeze([]);
    static contract = null;

    static create(options = {}) {
        const instance = new this(options);
        try { return instance.render(); }
        catch (error) {
            try { instance.destroy(); } catch (_) {}
            throw error;
        }
    }

    constructor(options = {}) {
        const name = componentName(this);
        const contract = this.constructor.contract || null;
        const input = validateContractOptions(contract, assertOptions(options, name + ' options'), name);
        const defaults = collectDefaults(this.constructor);
        const normalizers = collectStaticObject(this.constructor, 'optionNormalizers');
        const immutableOptions = collectStaticList(this.constructor, 'immutableOptions');
        const transaction = OptionTransaction.create(defaults, normalizers, candidate => validateContractOptions(contract, candidate, name));
        const resolved = transaction.update(input);
        const emitter = Events.createEmitter();
        const scope = Lifecycle.createScope();
        const record = {
            id: IdManager.next(name),
            options: resolved,
            transaction,
            immutableOptions,
            emitter,
            scope,
            root: null,
            rendered: false,
            mounted: false,
            destroyed: false,
            eventOffs: new Map()
        };
        state.set(this, record);
        InstanceRegistry.register(this);
    }

    render() {
        const record = requireState(this);
        assertAlive(record, 'render');
        const hook = this[componentHooks.render];
        const result = typeof hook === 'function' ? hook.call(this, record.options) : undefined;
        if (result !== undefined) updateRoot(this, record, result);
        record.rendered = true;
        record.emitter.emit('render', { instance: this, root: record.root });
        return this;
    }

    mount(target) {
        const record = requireState(this);
        assertAlive(record, 'mount');
        if (arguments.length) updateRoot(this, record, target);
        const hook = this[componentHooks.mount];
        const result = typeof hook === 'function' ? hook.call(this, record.root, record.options) : undefined;
        if (result !== undefined) updateRoot(this, record, result);
        record.mounted = true;
        record.emitter.emit('mount', { instance: this, root: record.root });
        return this;
    }

    reload(options = {}) {
        const record = requireState(this);
        assertAlive(record, 'reload');
        this.updateOptions(options);
        const hook = this[componentHooks.reload];
        if (typeof hook === 'function') hook.call(this, record.options);
        record.emitter.emit('reload', { instance: this, options: record.options });
        return this;
    }

    updateOptions(options = {}) {
        const record = requireState(this);
        assertAlive(record, 'update options on');
        const name = componentName(this);
        const patch = validateContractOptions(this.constructor.contract || null, assertOptions(options, name + ' option patch'), name);
        const previous = record.options;
        const beforeUpdate = this[componentHooks.beforeOptionsUpdate];
        if (typeof beforeUpdate === 'function') beforeUpdate.call(this, patch, previous);
        OptionTransaction.rejectImmutable(patch, record.immutableOptions, name);
        record.options = record.transaction.update(patch);
        const hook = this[componentHooks.optionsUpdated];
        if (typeof hook === 'function') hook.call(this, record.options, previous, patch);
        record.emitter.emit('options', { instance: this, options: record.options, previous, patch });
        return this;
    }

    destroy() {
        const record = requireState(this);
        if (record.destroyed) return false;
        record.destroyed = true;
        const errors = [];
        const before = this[componentHooks.beforeDestroy];
        try { if (typeof before === 'function') before.call(this); } catch (error) { errors.push(error); }
        try { errors.push(...record.scope.dispose()); } catch (error) { errors.push(error); }
        try { record.emitter.dispose(); } catch (error) { errors.push(error); }
        record.eventOffs.clear();
        InstanceRegistry.unregister(this);
        record.root = null;
        record.mounted = false;
        const after = this[componentHooks.afterDestroy];
        try { if (typeof after === 'function') after.call(this, errors.slice()); } catch (error) { errors.push(error); }
        return true;
    }

    once(type, listener) {
        const record = requireState(this);
        assertAlive(record, 'register one-time events on');
        if (typeof listener !== 'function') throw new TypeError('[QXFRAME9A7C2] Component event listener must be a function.');
        const name = String(type || '').trim();
        let off = null;
        off = this.on(name, detail => { if (off) off(); listener(detail); });
        return off;
    }

    on(type, listener) {
        const record = requireState(this);
        assertAlive(record, 'register events on');
        if (typeof listener !== 'function') throw new TypeError('[QXFRAME9A7C2] Component event listener must be a function.');
        const name = String(type || '').trim();
        const offEmitter = record.emitter.on(name, listener);
        let bucket = record.eventOffs.get(name);
        if (!bucket) { bucket = new Map(); record.eventOffs.set(name, bucket); }
        const previous = bucket.get(listener);
        if (previous) previous();
        let active = true;
        const off = () => {
            if (!active) return false;
            active = false;
            const removed = offEmitter();
            const current = record.eventOffs.get(name);
            if (current && current.get(listener) === off) {
                current.delete(listener);
                if (!current.size) record.eventOffs.delete(name);
            }
            return removed;
        };
        bucket.set(listener, off);
        return off;
    }

    off(type, listener) {
        const record = requireState(this);
        if (record.destroyed) return false;
        const name = String(type || '').trim();
        const bucket = record.eventOffs.get(name);
        if (!bucket) return false;
        if (listener === undefined) {
            const offs = Array.from(bucket.values());
            let removed = false;
            offs.forEach(off => { removed = off() || removed; });
            return removed;
        }
        const off = bucket.get(listener);
        return off ? off() : false;
    }

    emit(type, detail) {
        const record = requireState(this);
        if (record.destroyed) return 0;
        return record.emitter.emit(type, detail);
    }

    own(resource) {
        const record = requireState(this);
        assertAlive(record, 'own resources on');
        const cleanup = cleanupFor(resource);
        if (!cleanup) throw new TypeError('[QXFRAME9A7C2] Component.own requires a cleanup function or disposable resource.');
        record.scope.add(cleanup);
        return resource;
    }

    listen(target, type, listener, options) {
        const record = requireState(this);
        assertAlive(record, 'listen from');
        if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function') {
            throw new TypeError('[QXFRAME9A7C2] Component.listen target must support addEventListener/removeEventListener.');
        }
        if (typeof listener !== 'function') throw new TypeError('[QXFRAME9A7C2] Component.listen listener must be a function.');
        const name = String(type || '').trim();
        if (!name) throw new TypeError('[QXFRAME9A7C2] Component.listen event type is required.');
        target.addEventListener(name, listener, options);
        let active = true;
        const cleanup = () => {
            if (!active) return false;
            active = false;
            target.removeEventListener(name, listener, options);
            return true;
        };
        record.scope.add(cleanup);
        return cleanup;
    }

    get id() { return requireState(this).id; }
    get root() { return requireState(this).root; }
    get options() { return requireState(this).options; }
    get contract() { return this.constructor.contract || null; }
    get destroyed() { return requireState(this).destroyed; }
    get rendered() { return requireState(this).rendered; }
    get mounted() { return requireState(this).mounted; }
}
