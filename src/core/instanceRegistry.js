// Stage 35→40 preparation: canonical instance bookkeeping for Component.
// This registry is ESM-local and does not participate in legacy runtime dependency resolution.
const byId = new Map();
const byRoot = typeof WeakMap === 'function' ? new WeakMap() : null;
const roots = typeof WeakMap === 'function' ? new WeakMap() : null;

function isObjectKey(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function register(instance) {
    if (!instance || typeof instance !== 'object') throw new TypeError('[QXFRAME9A7C2] InstanceRegistry.register requires an instance object.');
    const id = String(instance.id || '').trim();
    if (!id) throw new TypeError('[QXFRAME9A7C2] Component instance id is required.');
    const current = byId.get(id);
    if (current && current !== instance) throw new Error('[QXFRAME9A7C2] Duplicate component instance id: ' + id);
    byId.set(id, instance);
    return instance;
}

function bindRoot(instance, root) {
    if (!instance || typeof instance !== 'object') throw new TypeError('[QXFRAME9A7C2] InstanceRegistry.bindRoot requires an instance object.');
    if (!byId.has(instance.id)) register(instance);
    const previous = roots && roots.get(instance);
    if (previous && byRoot && byRoot.get(previous) === instance) byRoot.delete(previous);
    if (roots) roots.delete(instance);
    if (root == null) return null;
    if (!isObjectKey(root)) throw new TypeError('[QXFRAME9A7C2] Component root must be an object or function.');
    if (byRoot) {
        const owner = byRoot.get(root);
        if (owner && owner !== instance) throw new Error('[QXFRAME9A7C2] Component root is already owned by another instance.');
        byRoot.set(root, instance);
    }
    if (roots) roots.set(instance, root);
    return root;
}

function unbindRoot(instance) {
    if (!roots || !instance) return false;
    const root = roots.get(instance);
    if (!root) return false;
    roots.delete(instance);
    if (byRoot && byRoot.get(root) === instance) byRoot.delete(root);
    return true;
}

function unregister(instance) {
    if (!instance || typeof instance !== 'object') return false;
    unbindRoot(instance);
    const id = String(instance.id || '').trim();
    if (!id || byId.get(id) !== instance) return false;
    byId.delete(id);
    return true;
}

function get(target) {
    if (typeof target === 'string') return byId.get(target) || null;
    if (isObjectKey(target) && byRoot) return byRoot.get(target) || null;
    return null;
}

function has(target) { return get(target) !== null; }
function size() { return byId.size; }
function list() { return Array.from(byId.values()); }

export const InstanceRegistry = Object.freeze({ register, bindRoot, unbindRoot, unregister, get, has, size, list });
export { register, bindRoot, unbindRoot, unregister, get, has, size, list };
