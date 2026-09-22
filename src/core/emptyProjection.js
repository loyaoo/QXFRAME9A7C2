import { Utils } from '../utils/utils.js';
import { Renderer } from './renderer.js';

const VARIANTS = Object.freeze(['default', 'simple']);
const own = Utils.own;

function normalize(options) {
    const source = options || {};
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new TypeError('[QXFRAME9A7C2] Empty projection options must be an object.');
    for (const name of ['target', 'el', 'mount', 'imageStyle']) if (own(source, name)) throw new TypeError('[QXFRAME9A7C2] Empty projection does not accept legacy/non-canonical option "' + name + '".');
    for (const name of Object.keys(source)) if (!['variant', 'image', 'description', 'extra', 'document'].includes(name)) throw new TypeError('[QXFRAME9A7C2] Empty projection does not accept unknown option "' + name + '".');
    const variant = String(source.variant == null ? 'default' : source.variant).toLowerCase();
    if (!VARIANTS.includes(variant)) throw new TypeError('[QXFRAME9A7C2] Empty variant must be default or simple.');
    return { variant, image: source.image, description: source.description, extra: source.extra, document: source.document };
}

function resolve(value, context) { return typeof value === 'function' ? value(context) : value; }

function render(container, options) {
    if (!container || container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Empty projection container must be an Element.');
    const opts = normalize(options), doc = opts.document || container.ownerDocument || globalThis.document;
    const root = doc.createElement('div'), image = doc.createElement('div'), description = doc.createElement('div'), extra = doc.createElement('div');
    const context = Object.freeze({ variant: opts.variant, container });
    root.className = 'qxframe9a7c2-empty is-' + opts.variant;
    image.className = 'qxframe9a7c2-empty-image';
    description.className = 'qxframe9a7c2-empty-description';
    extra.className = 'qxframe9a7c2-empty-extra';
    const imageOutput = resolve(opts.image, context);
    if (imageOutput === undefined) { image.classList.add('is-default'); root.appendChild(image); }
    else if (imageOutput !== null && imageOutput !== false) { Renderer.append(image, imageOutput, doc); root.appendChild(image); }
    let descriptionOutput = resolve(opts.description, context);
    if (descriptionOutput === undefined) descriptionOutput = 'No data';
    if (!(descriptionOutput === null || descriptionOutput === false || descriptionOutput === '')) { Renderer.append(description, descriptionOutput, doc); root.appendChild(description); }
    const extraOutput = resolve(opts.extra, context);
    if (!(extraOutput === undefined || extraOutput === null || extraOutput === false || extraOutput === '')) { Renderer.append(extra, extraOutput, doc); root.appendChild(extra); }
    Renderer.replace(container, root, doc);
    return root;
}

function clear(container) {
    if (!container || container.nodeType !== 1) return false;
    const root = container.firstElementChild;
    if (!root || !root.classList.contains('qxframe9a7c2-empty')) return false;
    container.removeChild(root);
    return true;
}

export const EmptyProjection = Object.freeze({ variants: VARIANTS.slice(), render, clear });
