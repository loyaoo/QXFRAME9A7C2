import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Component } from '../src/core/component.js';
import { componentHooks } from '../src/core/componentHooks.js';
import { InstanceRegistry } from '../src/core/instanceRegistry.js';
import { ComponentContracts } from '../src/core/componentContracts.js';
import { ComponentProfile } from '../src/core/componentProfile.js';
import { Table } from '../src/components/table.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentSource = fs.readFileSync(path.join(root, 'src/core/component.js'), 'utf8');
const tableSource = fs.readFileSync(path.join(root, 'src/components/table.js'), 'utf8');

for (const pattern of [
    /CoreRegistry|HeadlessRegistry|DOMHeadlessRegistry|ComponentRegistry|BuildingBlockRegistry/,
    /defineModule\s*\(/,
    /globalThis\.QXFRAME9A7C2|window\.QXFRAME9A7C2/,
    /PopupSurface|OverlayRuntime|KeyboardNavigation|TagNavigation|TreeModel|Selection|TemporalGrid|ScrollLock/
]) assert.ok(!pattern.test(componentSource), `Component base crossed a forbidden responsibility boundary: ${pattern}`);

const initialRegistrySize = InstanceRegistry.size();
const cleanupOrder = [];
const optionEvents = [];
const lifecycleEvents = [];

class TestComponent extends Component {
    static options = Object.freeze({ size: 'md', enabled: true });
    static optionNormalizers = Object.freeze({ size: value => String(value).toLowerCase() });
    static immutableOptions = Object.freeze(['enabled']);
    static contract = Object.freeze({ schema: Object.freeze({ size: 'string', enabled: 'boolean', child: 'boolean', custom: 'number', extra: 'boolean', id: 'string' }), allowUnknown: false });

    [componentHooks.render]() {
        lifecycleEvents.push('render-hook');
        return { kind: 'render-root' };
    }
    [componentHooks.mount](root) {
        lifecycleEvents.push('mount-hook');
        return root;
    }
    [componentHooks.reload]() { lifecycleEvents.push('reload-hook'); }
    [componentHooks.optionsUpdated](next, previous, patch) {
        optionEvents.push({ next, previous, patch });
    }
    [componentHooks.beforeDestroy]() { cleanupOrder.push('before-destroy'); }
    [componentHooks.afterDestroy]() { cleanupOrder.push('after-destroy'); }
}

class ChildComponent extends TestComponent {
    static options = Object.freeze({ size: 'lg', child: true });
    static optionNormalizers = Object.freeze({ custom: value => Number(value) });
    static profile = Object.freeze({
        name:'ChildComponent',
        value:Object.freeze({ mode:'controlled-or-default' }),
        focus:Object.freeze({ mode:'virtual-navigation' }),
        ownership:Object.freeze({ value:'ValueController', focus:'FocusController' }),
        dependencies:Object.freeze({ interaction:Object.freeze(['focus']) })
    });
}

assert.ok(ComponentContracts.names.length >= 40, 'canonical ComponentContracts catalog must be available without ComponentRuntime.');
assert.equal(ComponentContracts.get('Result')?.allowUnknown, false);
assert.throws(() => new ChildComponent({ unknown: true }), /unknown option/, 'Component must validate its static contract before registering an instance.');

const instance = new ChildComponent({ enabled: false, custom: 7, size: 'LG' });
assert.equal(InstanceRegistry.size(), initialRegistrySize + 1, 'constructor must register the instance exactly once.');
assert.ok(instance.id.startsWith('qxframe9a7c2-childcomponent-'), 'generated instance id must be stable and component-scoped.');
assert.deepEqual(instance.options, { size: 'lg', enabled: false, child: true, custom: 7 }, 'static options and option normalizers must merge through the inheritance chain.');
assert.ok(Object.isFrozen(instance.options), 'resolved options must be immutable.');
assert.equal(instance.contract, TestComponent.contract, 'contract getter must inherit the nearest static contract.');
assert.equal(instance.profile.name, 'ChildComponent', 'Component must expose its validated static ComponentProfile.');
assert.equal(ComponentProfile.validate(instance.profile), true);
assert.ok(Object.isFrozen(instance.profile), 'Component profile metadata must be immutable.');
assert.equal(instance.destroyed, false);
assert.equal(instance.rendered, false);
assert.equal(instance.mounted, false);

let customPayload = null;
const listener = detail => { customPayload = detail; };
const off = instance.on('custom', listener);
assert.equal(instance.emit('custom', { value: 1 }), 1);
assert.deepEqual(customPayload, { value: 1 });
assert.equal(off(), true);
assert.equal(off(), false, 'event disposer must be idempotent.');
assert.equal(instance.emit('custom', { value: 2 }), 0);

instance.on('options', detail => optionEvents.push({ emitted: detail }));
assert.throws(() => instance.updateOptions({ enabled: true }), /immutable/, 'immutable options must be enforced by the Component option transaction.');
const beforeRejectedPatch = instance.options;
assert.throws(() => instance.updateOptions({ custom: 'not-a-number' }), /invalid value/, 'raw contract validation must reject invalid input before normalization.');
assert.equal(instance.options, beforeRejectedPatch, 'a rejected option transaction must be atomic.');
instance.updateOptions({ size: 'SM', extra: true });
assert.deepEqual(instance.options, { size: 'sm', enabled: false, child: true, custom: 7, extra: true });
assert.equal(optionEvents.length, 2, 'option hook and public options event must both run once.');

class FailingUpdateComponent extends Component {
    static options = Object.freeze({ mode:'safe', count:1 });
    static contract = Object.freeze({ schema:Object.freeze({ mode:'string', count:'number' }), allowUnknown:false });
    [componentHooks.optionsUpdated](next) {
        if (next.mode === 'invalid') throw new TypeError('runtime option combination rejected');
    }
}
const failingUpdate = new FailingUpdateComponent();
const failingSnapshot = failingUpdate.options;
assert.throws(() => failingUpdate.updateOptions({ mode:'invalid', count:2 }), /runtime option combination rejected/);
assert.equal(failingUpdate.options, failingSnapshot, 'failed optionsUpdated hooks must restore the previous Component options object.');
assert.deepEqual(failingUpdate.options, { mode:'safe', count:1 }, 'failed optionsUpdated hooks must leave public options unchanged.');
failingUpdate.updateOptions({ count:3 });
assert.deepEqual(failingUpdate.options, { mode:'safe', count:3 }, 'OptionTransaction internal state must also roll back after a failed hook.');
failingUpdate.destroy();
assert.equal(optionEvents[0].previous.size, 'lg');
assert.equal(optionEvents[0].next.size, 'sm');
assert.equal(optionEvents[1].emitted.options, instance.options);

instance.render();
assert.equal(instance.rendered, true);
assert.equal(instance.root.kind, 'render-root');
assert.equal(InstanceRegistry.get(instance.root), instance, 'render root must be bound to the instance registry.');
instance.mount(instance.root);
assert.equal(instance.mounted, true);
assert.deepEqual(lifecycleEvents.slice(0, 2), ['render-hook', 'mount-hook']);
instance.reload({ custom: 9 });
assert.equal(instance.options.custom, 9);
assert.equal(lifecycleEvents.at(-1), 'reload-hook');

instance.own(() => cleanupOrder.push('cleanup-1'));
instance.own({ dispose() { cleanupOrder.push('cleanup-2'); } });

const targetListeners = new Map();
const target = {
    addEventListener(type, handler) {
        const list = targetListeners.get(type) || [];
        list.push(handler);
        targetListeners.set(type, list);
    },
    removeEventListener(type, handler) {
        const list = targetListeners.get(type) || [];
        const index = list.indexOf(handler);
        if (index >= 0) list.splice(index, 1);
    }
};
const nativeHandler = () => {};
const removeNative = instance.listen(target, 'click', nativeHandler);
assert.equal(targetListeners.get('click').length, 1);
assert.equal(removeNative(), true);
assert.equal(removeNative(), false);
assert.equal(targetListeners.get('click').length, 0);
instance.listen(target, 'focus', nativeHandler);
assert.equal(targetListeners.get('focus').length, 1);

const oldRoot = instance.root;
assert.equal(instance.destroy(), true, 'first destroy must dispose the instance.');
assert.equal(instance.destroy(), false, 'destroy must be idempotent.');
assert.equal(instance.destroyed, true);
assert.equal(instance.root, null);
assert.equal(instance.mounted, false);
assert.equal(targetListeners.get('focus').length, 0, 'destroy must release owned listeners.');
assert.equal(InstanceRegistry.get(instance.id), null, 'destroy must unregister the instance id.');
assert.equal(InstanceRegistry.get(oldRoot), null, 'destroy must unbind the instance root.');
assert.equal(InstanceRegistry.size(), initialRegistrySize, 'instance registry must return to its baseline size.');
assert.deepEqual(cleanupOrder, ['before-destroy', 'cleanup-2', 'cleanup-1', 'after-destroy'], 'owned resources must be released in reverse registration order.');
assert.throws(() => instance.render(), /destroyed Component/, 'destroyed instances must reject lifecycle mutation.');
assert.throws(() => instance.updateOptions({ size: 'xl' }), /destroyed Component/);

const explicit = new Component({ id: 'public-option-id' });
assert.ok(explicit.id.startsWith('qxframe9a7c2-component-'), 'instance identity must stay independent from public component options.');
assert.equal(explicit.options.id, 'public-option-id', 'Component must preserve an id option for concrete component semantics without reusing it as registry identity.');
assert.equal(InstanceRegistry.get(explicit.id), explicit);
explicit.destroy();

assert.match(tableSource, /class\s+Table\s+extends\s+Component/, 'Table must extend Component.');
assert.ok(!/^\s*destroy\s*\(/m.test(tableSource), 'Table must inherit Component.destroy.');
assert.ok(!/function\s+updateOptions\s*\(/.test(tableSource), 'Table must not keep a parallel function-style updateOptions authority.');
const tableProbe = new Table({ container:{ nodeType:1, ownerDocument:null }, columns:[], items:[] });
assert.ok(tableProbe instanceof Component);
tableProbe.updateOptions({ disabled:true });
assert.equal(tableProbe.options.disabled, true);
assert.throws(() => tableProbe.updateOptions({ container:{ nodeType:1 } }), /immutable/);
tableProbe.destroy();


function createSemanticElement() {
    const classes = new Set(['authored']);
    const values = new Map();
    const priorities = new Map();
    return {
        nodeType: 1,
        classList: {
            contains(name) { return classes.has(name); },
            toggle(name, on) { if (on === false) classes.delete(name); else classes.add(name); return classes.has(name); },
            add(name) { classes.add(name); },
            remove(name) { classes.delete(name); }
        },
        style: {
            getPropertyValue(name) { return values.get(name) || ''; },
            getPropertyPriority(name) { return priorities.get(name) || ''; },
            setProperty(name, value, priority = '') { values.set(name, String(value)); priorities.set(name, String(priority || '')); },
            removeProperty(name) { const old = values.get(name) || ''; values.delete(name); priorities.delete(name); return old; }
        }
    };
}

const semanticElement = createSemanticElement();
class SemanticLifecycleComponent extends Component {
    static options = Object.freeze({
        baseWidth: '10px',
        class: 'projected-a',
        style: Object.freeze({ width: '20px' }),
        duration: 120
    });
    static semanticElements = Object.freeze(['root']);
    static defaultClassSlot = 'root';
    static defaultStyleSlot = 'root';
    static defaultMotionSlot = 'root';
    static motionSlots = Object.freeze({
        root: Object.freeze({
            appear: '--qxframe9a7c2-test-enter-duration',
            enter: '--qxframe9a7c2-test-enter-duration',
            leave: '--qxframe9a7c2-test-leave-duration'
        })
    });
    [componentHooks.render]() {
        semanticElement.style.setProperty('width', this.options.baseWidth);
        return semanticElement;
    }
    [componentHooks.optionsUpdated]() {
        semanticElement.style.setProperty('width', this.options.baseWidth);
    }
}
const semanticLifecycle = new SemanticLifecycleComponent();
semanticLifecycle.render();
assert.equal(semanticLifecycle.getElement('root'), semanticElement, 'semantic root must use the shared Component element registry.');
assert.equal(semanticLifecycle.getElement('missing'), null, 'unknown semantic element reads must return null.');
assert.ok(Object.isFrozen(semanticLifecycle.getElement()), 'no-argument getElement() must return a readonly semantic map.');
assert.equal(semanticLifecycle.getElement().root, semanticElement);
assert.equal(semanticElement.classList.contains('projected-a'), true, 'flat class must target the declared default class slot.');
assert.equal(semanticElement.classList.contains('authored'), true, 'semantic class projection must preserve authored classes.');
assert.equal(semanticElement.style.getPropertyValue('width'), '20px', 'flat style must target the declared default style slot.');
assert.equal(semanticElement.style.getPropertyValue('--qxframe9a7c2-test-enter-duration'), '120ms', 'numeric duration must project to the declared CSS duration token in ms.');

semanticLifecycle.updateOptions({ baseWidth:'30px', class:null, style:null, duration:null });
assert.equal(semanticElement.style.getPropertyValue('width'), '30px',
    'updateOptions must remove the old semantic projection before the component writes its new base DOM state.');
assert.equal(semanticElement.classList.contains('projected-a'), false, 'removed semantic class projection must not linger.');
assert.equal(semanticElement.classList.contains('authored'), true, 'projection teardown must preserve authored class state.');
assert.equal(semanticElement.style.getPropertyValue('--qxframe9a7c2-test-enter-duration'), '', 'removed duration override must restore the underlying CSS custom property state.');

semanticLifecycle.updateOptions({
    class:{ root:['projected-b','projected-c'] },
    style:{ root:{ width:'44px', '--local-token':'ok' } },
    duration:{ root:{ enter:250, leave:'180ms' } }
});
assert.equal(semanticElement.style.getPropertyValue('width'), '44px');
assert.equal(semanticElement.style.getPropertyValue('--local-token'), 'ok');
assert.equal(semanticElement.style.getPropertyValue('--qxframe9a7c2-test-enter-duration'), '250ms');
assert.equal(semanticElement.style.getPropertyValue('--qxframe9a7c2-test-leave-duration'), '180ms');
assert.equal(semanticElement.classList.contains('projected-b'), true);
assert.equal(semanticElement.classList.contains('projected-c'), true);
semanticLifecycle.destroy();
assert.equal(semanticElement.classList.contains('projected-b'), false, 'destroy must remove projected classes.');
assert.equal(semanticElement.style.getPropertyValue('--local-token'), '', 'destroy must remove projected inline style values.');
assert.equal(semanticElement.style.getPropertyValue('--qxframe9a7c2-test-enter-duration'), '', 'destroy must remove projected duration custom properties.');


const repeatedA = createSemanticElement();
const repeatedB = createSemanticElement();
class RepeatedSemanticComponent extends Component {
    static semanticElements = Object.freeze(['root','item']);
    static defaultClassSlot = 'root';
    static defaultStyleSlot = 'root';
    [componentHooks.render]() {
        const root = createSemanticElement();
        this.registerSemanticElements(
            { root, item:[repeatedA,repeatedB] },
            { item:[
                { item:Object.freeze({ key:'a' }), state:Object.freeze({ selected:true }) },
                { item:Object.freeze({ key:'b' }), state:Object.freeze({ selected:false }) }
            ] }
        );
        return root;
    }
}
const repeatedSemantic = new RepeatedSemanticComponent({
    class:{ item:({ item, index, state }) => ['semantic-item-' + item.key, state.selected ? 'is-picked' : 'is-idle', 'at-' + index] },
    style:{ item:({ item, index }) => ({ '--semantic-key':item.key, '--semantic-index':index }) }
});
repeatedSemantic.render();
assert.deepEqual(repeatedSemantic.getElement('item'), [repeatedA,repeatedB], 'repeated semantic registry must expose Element[] only.');
assert.equal(repeatedA.classList.contains('semantic-item-a'), true);
assert.equal(repeatedA.classList.contains('is-picked'), true);
assert.equal(repeatedA.classList.contains('at-0'), true);
assert.equal(repeatedB.classList.contains('semantic-item-b'), true);
assert.equal(repeatedB.classList.contains('is-idle'), true);
assert.equal(repeatedB.classList.contains('at-1'), true);
assert.equal(repeatedA.style.getPropertyValue('--semantic-key'), 'a');
assert.equal(repeatedB.style.getPropertyValue('--semantic-key'), 'b');
assert.equal(repeatedA.style.getPropertyValue('--semantic-index'), '0');
assert.equal(repeatedB.style.getPropertyValue('--semantic-index'), '1');
repeatedSemantic.destroy();
assert.equal(repeatedA.classList.contains('semantic-item-a'), false);
assert.equal(repeatedB.style.getPropertyValue('--semantic-key'), '');

class FactoryComponent extends Component {
    [componentHooks.render]() { lifecycleEvents.push('factory-render'); }
}
const factory = FactoryComponent.create({});
assert.ok(factory instanceof FactoryComponent);
assert.equal(factory.rendered, true, 'static create must use the canonical render shell.');
factory.destroy();

console.log(JSON.stringify({
    ok: true,
    componentBase: true,
    optionInheritance: true,
    optionTransaction: true,
    contractValidation: true,
    componentProfile: true,
    eventLifecycle: true,
    resourceOwnership: true,
    listenerCleanup: true,
    instanceRegistry: true,
    destroyIdempotent: true,
    familySpecificResponsibilities: 0
}, null, 2));
