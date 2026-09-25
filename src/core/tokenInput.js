
import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { Utils } from '../utils/utils.js';
import { ValueController } from './valueController.js';
import { ValueEquality } from '../utils/valueEquality.js';

var REQUEST_HANDLED = Object.freeze({ kind: 'qxframe9a7c2-token-input-request-handled' });

  function copyTag(tag) {
    return Object.freeze({
      key: String(tag.key),
      value: String(tag.value),
      label: String(tag.label),
      removable: tag.removable !== false,
      disabled: tag.disabled === true
    });
  }

  function normalizeTags(tags) {
    return (Array.isArray(tags) ? tags : []).map(function (tag) {
      if (!tag || typeof tag !== 'object') throw new TypeError('[QXFRAME9A7C2] TokenInput tags must be objects.');
      if (tag.key === undefined || tag.key === null || tag.key === '') throw new TypeError('[QXFRAME9A7C2] TokenInput tag.key is required.');
      if (tag.value === undefined || tag.value === null) throw new TypeError('[QXFRAME9A7C2] TokenInput tag.value is required.');
      if (tag.label === undefined || tag.label === null) throw new TypeError('[QXFRAME9A7C2] TokenInput tag.label is required.');
      return copyTag(tag);
    });
  }

  function create(options) {
    var opts = mergeOptions({
      tags: [], inputValue: '', creatable: false, unique: true,
      tokenSeparators: [], tokenizeOnPaste: true, addOnEnter: true,
      addOnTab: false, addOnBlur: false, maxTags: 0, maxTagLength: 0
    }, options);
    if (!Array.isArray(opts.tokenSeparators) && !Utils.isFunction(opts.tokenSeparators)) throw new TypeError('[QXFRAME9A7C2] TokenInput tokenSeparators must be an array or tokenizer function.');
    var emitter = Events.createEmitter();
    var valueController = ValueController.create({ value:normalizeTags(opts.tags), controlled:false, normalizeValue:normalizeTags, copyValue:function(list){return list.slice();}, equals:ValueEquality.deep });
    var tags = valueController.value;
    function commitTags(next, meta) {
      valueController.setValue(next, mergeOptions({ silent:true, source:'token-input', reason:'tags-value' }, meta || {}));
      tags = valueController.value;
      return tags;
    }
    var inputValue = opts.inputValue === undefined || opts.inputValue === null ? '' : String(opts.inputValue);
    var destroyed = false;
    var api = null;

    function detail(base, meta) {
      return mergeOptions(mergeOptions({
        tags: tags.slice(), values: tags.map(function (tag) { return tag.value; }),
        inputValue: inputValue, controller: api, source: 'api', reason: 'api'
      }, base), meta);
    }

    function emitInput(meta) {
      var payload = detail({}, meta);
      if (Utils.isFunction(opts.onInputChange)) opts.onInputChange(inputValue, payload);
      emitter.emit('input-change', payload);
    }

    function emitTags(previous, meta) {
      var payload = detail({ previousTags: previous }, meta);
      if (Utils.isFunction(opts.onTagsChange)) opts.onTagsChange(tags.slice(), payload);
      emitter.emit('tags-change', payload);
    }

    function setInputValue(next, meta) {
      if (destroyed) return false;
      var normalized = next === undefined || next === null ? '' : String(next);
      if (normalized === inputValue) return true;
      inputValue = normalized;
      if (!(meta && meta.silent)) emitInput(meta);
      return true;
    }

    function setTags(next, meta) {
      if (destroyed) return false;
      var normalized = normalizeTags(next);
      var previous = tags;
      commitTags(normalized, meta);
      if (!(meta && meta.silent)) emitTags(previous, meta);
      return true;
    }

    function normalizeCandidate(text, meta) {
      var value = text === undefined || text === null ? '' : String(text);
      if (Utils.isFunction(opts.normalizeTag)) value = opts.normalizeTag(value, detail({}, meta));
      value = value === undefined || value === null ? '' : String(value).trim();
      return value;
    }

    function invalid(reason, text, meta, message) {
      var payload = detail({ candidate: text, invalidReason: reason, message: message || '' }, meta);
      if (Utils.isFunction(opts.onTagInvalid)) opts.onTagInvalid(payload);
      emitter.emit('tag-invalid', payload);
      return false;
    }

    function canUseValue(value, meta, ignoreIndex) {
      if (!value) return invalid('empty', value, meta);
      var maxLength = Math.max(0, Number(opts.maxTagLength) || 0);
      if (maxLength && value.length > maxLength) return invalid('max-length', value, meta);
      var maxTags = Math.max(0, Number(opts.maxTags) || 0);
      if (maxTags && tags.length >= maxTags && !(Number.isInteger(ignoreIndex) && ignoreIndex >= 0)) return invalid('max-tags', value, meta);
      if (opts.unique !== false && tags.some(function (tag, index) { return index !== ignoreIndex && tag.value === value; })) return invalid('duplicate', value, meta);
      if (Utils.isFunction(opts.validateTag)) {
        var checked = opts.validateTag(value, detail({ candidate: value }, meta));
        if (checked === false) return invalid('validate', value, meta);
        if (typeof checked === 'string') return invalid('validate', value, meta, checked);
      }
      return value;
    }

    function nextTagKey(value) {
      var base = String(value);
      if (!tags.some(function (tag) { return tag.key === base; })) return base;
      var suffix = 2;
      var key = base + '#' + suffix;
      while (tags.some(function (tag) { return tag.key === key; })) { suffix += 1; key = base + '#' + suffix; }
      return key;
    }

    function add(text, meta) {
      if (destroyed || opts.disabled === true || opts.readOnly === true || opts.creatable !== true) return false;
      var candidate = normalizeCandidate(text, meta);
      candidate = canUseValue(candidate, meta, -1);
      if (candidate === false) return false;
      var tag = copyTag({ key: nextTagKey(candidate), value: candidate, label: candidate, removable: true, disabled: false });
      var payload = detail({ tag: tag, candidate: candidate }, meta);
      if (Utils.isFunction(opts.beforeTagAdd)) {
        var beforeAdd = opts.beforeTagAdd(tag, payload);
        if (beforeAdd === false) return false;
        if (beforeAdd === REQUEST_HANDLED) {
          inputValue = '';
          if (!(meta && meta.silent)) emitInput(meta);
          return true;
        }
      }
      var previous = tags;
      commitTags(tags.concat([tag]), meta);
      inputValue = '';
      payload = detail({ tag: tag, previousTags: previous }, meta);
      if (!(meta && meta.silent)) {
        if (Utils.isFunction(opts.onTagAdd)) opts.onTagAdd(tag, payload);
        emitter.emit('tag-add', payload);
        emitTags(previous, meta);
        emitInput(meta);
      }
      return true;
    }


    function editAt(index, text, meta) {
      if (destroyed || opts.disabled === true || opts.readOnly === true) return false;
      index = Number(index);
      if (!Number.isInteger(index) || index < 0 || index >= tags.length) return false;
      var current = tags[index];
      if (!current || current.disabled === true) return false;
      var candidate = normalizeCandidate(text, meta);
      candidate = canUseValue(candidate, meta, index);
      if (candidate === false) return false;
      if (candidate === current.value && candidate === current.label) return true;
      var nextTag = copyTag({ key: current.key, value: candidate, label: candidate, removable: current.removable, disabled: current.disabled });
      var payload = detail({ tag: nextTag, previousTag: current, index: index, candidate: candidate }, meta);
      if (Utils.isFunction(opts.beforeTagEdit) && opts.beforeTagEdit(nextTag, payload) === false) return false;
      var previous = tags;
      var nextTags = tags.slice();
      nextTags[index] = nextTag;
      commitTags(nextTags, meta);
      payload = detail({ tag: nextTag, previousTag: current, index: index, previousTags: previous }, meta);
      if (!(meta && meta.silent)) {
        if (Utils.isFunction(opts.onTagEdit)) opts.onTagEdit(nextTag, payload);
        emitter.emit('tag-edit', payload);
        emitTags(previous, mergeOptions({ reason: 'edit' }, meta));
      }
      return true;
    }

    function removeAt(index, meta) {
      if (destroyed || opts.disabled === true || opts.readOnly === true) return false;
      index = Number(index);
      if (!Number.isInteger(index) || index < 0 || index >= tags.length) return false;
      var tag = tags[index];
      if (!tag || tag.disabled === true || tag.removable === false) return false;
      var payload = detail({ tag: tag, index: index }, meta);
      if (Utils.isFunction(opts.beforeTagRemove)) {
        var beforeRemove = opts.beforeTagRemove(tag, payload);
        if (beforeRemove === false) return false;
        if (beforeRemove === REQUEST_HANDLED) return true;
      }
      var previous = tags;
      commitTags(tags.slice(0, index).concat(tags.slice(index + 1)), meta);
      payload = detail({ tag: tag, index: index, previousTags: previous }, meta);
      if (!(meta && meta.silent)) {
        if (Utils.isFunction(opts.onTagRemove)) opts.onTagRemove(tag, payload);
        emitter.emit('tag-remove', payload);
        emitTags(previous, meta);
      }
      return true;
    }

    function removeByKey(key, meta) {
      key = String(key);
      var index = tags.findIndex(function (tag) { return tag.key === key; });
      return removeAt(index, meta);
    }

    function removeLast(meta) {
      for (var i = tags.length - 1; i >= 0; i -= 1) {
        if (tags[i].disabled !== true && tags[i].removable !== false) return removeAt(i, meta);
      }
      return false;
    }

    function clear(meta) {
      if (destroyed || opts.disabled === true || opts.readOnly === true) return false;
      var previous = tags;
      commitTags([], meta);
      inputValue = '';
      if (!(meta && meta.silent)) {
        emitTags(previous, meta);
        emitInput(meta);
      }
      return previous.length > 0;
    }

    function separators() {
      return (Array.isArray(opts.tokenSeparators) ? opts.tokenSeparators : []).map(String).filter(Boolean);
    }

    function splitTokens(text) {
      var input = String(text || '');
      if (Utils.isFunction(opts.tokenSeparators)) {
        var tokenized = opts.tokenSeparators(input);
        if (!Array.isArray(tokenized)) throw new TypeError('[QXFRAME9A7C2] TokenInput tokenSeparators function must return an array.');
        var custom = tokenized.map(String).filter(Boolean);
        return custom.length ? custom.concat(['']) : null;
      }
      var list = separators();
      if (!list.length) return null;
      var escaped = list.map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
      var parts = input.split(new RegExp('(?:' + escaped.join('|') + ')'));
      return parts.length > 1 ? parts : null;
    }

    function commitInput(meta) {
      return add(inputValue, mergeOptions({ reason: 'commit-input', source: 'keyboard' }, meta));
    }

    function handleInput(text, meta) {
      if (destroyed) return false;
      var next = text === undefined || text === null ? '' : String(text);
      if (opts.creatable !== true) return setInputValue(next, meta);
      var parts = splitTokens(next);
      if (!parts) return setInputValue(next, meta);
      var remainder = parts.pop();
      var handled = false;
      parts.forEach(function (part) {
        if (normalizeCandidate(part, meta) && add(part, mergeOptions({ reason: 'input-token', source: 'input' }, meta))) handled = true;
      });
      setInputValue(remainder, mergeOptions({ reason: 'input-remainder', source: 'input' }, meta));
      return handled;
    }

    function handlePaste(text, meta) {
      if (opts.creatable !== true || opts.tokenizeOnPaste === false) return false;
      var parts = splitTokens(text);
      if (!parts) return false;
      var changed = false;
      parts.forEach(function (part) { if (normalizeCandidate(part, meta) && add(part, mergeOptions({ reason: 'paste-token', source: 'paste' }, meta))) changed = true; });
      return changed;
    }

    function handleKeydown(event, meta) {
      if (!event || destroyed) return false;
      if (event.key === 'Backspace' && inputValue === '' && tags.length) {
        var removed = removeLast(mergeOptions({ reason: 'backspace', source: 'keyboard', originalEvent: event }, meta));
        if (removed && event.preventDefault) event.preventDefault();
        return removed;
      }
      if (opts.creatable === true && inputValue) {
        if (event.key === 'Enter' && opts.addOnEnter !== false) {
          var entered = commitInput(mergeOptions({ reason: 'enter', source: 'keyboard', originalEvent: event }, meta));
          if (entered && event.preventDefault) event.preventDefault();
          return entered;
        }
        if (event.key === 'Tab' && opts.addOnTab === true) return commitInput(mergeOptions({ reason: 'tab', source: 'keyboard', originalEvent: event }, meta));
      }
      return false;
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      var proposed = mergeOptions(opts, next);
      if (!Array.isArray(proposed.tokenSeparators) && !Utils.isFunction(proposed.tokenSeparators)) throw new TypeError('[QXFRAME9A7C2] TokenInput tokenSeparators must be an array or tokenizer function.');
      opts = proposed;
      if (Object.prototype.hasOwnProperty.call(Object(next), 'tags')) setTags(next.tags, { silent: true, reason: 'options', source: 'options' });
      if (Object.prototype.hasOwnProperty.call(Object(next), 'inputValue')) setInputValue(next.inputValue, { silent: true, reason: 'options-input', source: 'options' });
      return api;
    }

    api = Object.freeze({
      setTags: setTags, setInputValue: setInputValue, add: add, editAt: editAt, removeAt: removeAt,
      removeByKey: removeByKey, removeLast: removeLast, clear: clear, commitInput: commitInput,
      handleInput: handleInput, handlePaste: handlePaste, handleKeydown: handleKeydown, updateOptions: updateOptions,
      getValueController: function () { return valueController; },
      getState: function () { return Object.freeze({ tags: tags.slice(), values: tags.map(function (tag) { return tag.value; }), inputValue: inputValue, destroyed: destroyed }); },
      on: emitter.on, once: emitter.once,
      destroy: function () { if (destroyed) return false; destroyed = true; if(valueController)valueController.destroy(); valueController=null; tags=[]; inputValue = ''; emitter.dispose(); return true; }
    });
    return api;
  }

export const TokenInput = Object.freeze({ create, REQUEST_HANDLED });
export { create, REQUEST_HANDLED };
