import { Utils } from '../utils/utils.js';

import { DOM } from './dom.js';
import { DOMBinding } from './domBinding.js';

const global = globalThis;

var DEFAULT_HEADLESS_FORBIDDEN = Object.freeze(['container','elements','createDOM','formField','valueTarget','draftValueTarget','inputTarget','formTarget','name']);
  function present(value) { return value !== undefined && value !== null && value !== ''; }
  function element(value, doc, owner, label, required) {
    if (!present(value)) return null;
    var node = DOM.resolveElement(value, doc);
    if (!node && required !== false) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' ' + label + ' must resolve to an Element.');
    return node;
  }
  function validateHeadless(options, owner, forbidden) {
    var opts = options || {};
    if (opts.headless !== true) return false;
    if (opts.renderControl === false) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' headless:true cannot be combined with renderControl:false; renderControl:false is the authored DOM projection bridge.');
    (forbidden || DEFAULT_HEADLESS_FORBIDDEN).forEach(function (name) {
      if (present(opts[name])) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' headless:true does not accept ' + name + '; handle external value rendering/form storage in callbacks.');
    });
    if (!present(opts.reference) && !present(opts.triggerTarget)) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' headless:true requires reference or triggerTarget as the popup anchor.');
    return true;
  }
  function resolvePickerControl(config) {
    var local = Utils.assignOwn({
      requiredRefs:['root','values','input','clear','toggle'],
      projectionRefs:[{ref:'values',option:'valueTarget'},{ref:'input',option:'inputTarget'}]
    }, config || {});
    var host = resolve(local);
    var refs = host.refs || {};
    var rendered = !host.headless && !host.projection;
    return Object.freeze({
      host: host,
      binding: host.binding,
      root: host.root,
      triggerTarget: host.triggerTarget,
      controlElement: rendered ? host.root : null,
      valuesNode: rendered ? (refs.values || null) : null,
      input: host.headless ? null : (refs.input || null),
      clearButton: rendered ? (refs.clear || null) : null,
      toggle: rendered ? (refs.toggle || null) : null,
      prefix: rendered ? (refs.prefix || null) : null,
      suffix: rendered ? (refs.suffix || null) : null,
      valueTarget: host.headless ? null : (refs.values || null)
    });
  }

  function resolve(config) {
    config = config || {};
    var opts = config.options || {};
    var owner = String(config.owner || 'Field');
    var doc = config.document || global.document;
    var host = config.host || opts.container || null;
    var headless = opts.headless === true;
    var projection = !headless && opts.renderControl === false;
    validateHeadless(opts, owner, config.headlessForbidden);
    if (!headless && !projection && !host && opts.elements == null && !opts.formField) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' requires target/container, formField, or options.elements.');

    var binding = null, refs = Object.create(null), root = null, triggerTarget = null;
    if (headless) {
      triggerTarget = element(opts.triggerTarget, doc, owner, 'triggerTarget', false);
      root = element(opts.reference, doc, owner, 'reference', false) || triggerTarget;
      if (!root) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' headless:true requires reference or triggerTarget as the popup anchor.');
      refs.root = root;
    } else if (projection) {
      root = element(opts.reference, doc, owner, 'reference', false);
      if (!root) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' renderControl:false requires reference as the popup anchor.');
      refs.root = root;
      (config.projectionRefs || []).forEach(function (entry) {
        var descriptor = typeof entry === 'string' ? { ref:entry, option:entry + 'Target' } : entry;
        refs[descriptor.ref] = element(opts[descriptor.option], doc, owner, descriptor.option, descriptor.required === true);
      });
      triggerTarget = element(opts.triggerTarget, doc, owner, 'triggerTarget', false) || root;
    } else {
      binding = DOMBinding.resolve({
        options: config.bindingOptions || opts,
        document: doc,
        target: host,
        component: config.component || null,
        requiredRefs: config.requiredRefs || ['root'],
        defaultFactory: config.defaultFactory
      });
      refs = binding.refs;
      root = refs.root;
      triggerTarget = element(opts.triggerTarget, doc, owner, 'triggerTarget', false) || root;
    }
    return Object.freeze({ mode: headless ? 'headless' : (projection ? 'projection' : 'rendered'), headless:headless, projection:projection, binding:binding, refs:refs, root:root, triggerTarget:triggerTarget });
  }

export const FieldHost = Object.freeze({ resolve, resolvePickerControl, validateHeadless });
export { resolve, resolvePickerControl, validateHeadless };
