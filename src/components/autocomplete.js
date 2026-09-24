import { PopupFieldComponent, popupFieldHooks, createPopupFieldTriggerSettings, popupOpenContext } from './popup-field.js';
import { Control } from './control.js';
import { OptionList } from './option-list.js';
import { Item } from './item.js';
import { Scroll } from './scroll.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { AsyncTask } from '../core/asyncTask.js';
import { ValueController } from '../core/valueController.js';
import { ItemSchema } from '../core/itemSchema.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { FieldHost } from '../core/fieldHost.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Utils } from '../utils/utils.js';

const blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-autocomplete qxframe9a7c2-autocomplete-control qxframe9a7c2-input" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-autocomplete-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <input class="qxframe9a7c2-autocomplete-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-autocomplete-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-autocomplete-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-autocomplete-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
    </span>
  </div>`;

function createDefaultDOM(context) {
  const instance = blueprint.instantiate(context.document);
  instance.refs.control = instance.root;
  return { root: instance.root, refs: instance.refs };
}

const AUTOCOMPLETE_DEFAULTS = Object.freeze({
  items: [], clearable: false, disabled: false, readOnly: false, size: 'md', placement: 'bottom-start', trigger: 'focus', placeholder: '', open: false,
  highlightFirst: true, matchOnly: true, backfill: false, minChars: 0, matchReferenceWidth: true,
  loadSuggestions: null, getSuggestionQuery: null, applySuggestion: null, renderControl: true, headless: false
});

const own = Utils.own;
const hasOwn = Utils.own;
const runtimeState = new WeakMap();

function validateItems(items, opts) {
  return ItemSchema.validate(items, {
    label: 'Autocomplete items', uniqueKeys: false,
    childrenOf: function () { return []; },
    validateItem: function (item) {
      if (!Utils.isFunction(opts.getKey) && (item.key === undefined || item.key === null || item.key === '')) throw new TypeError('[QXFRAME9A7C2] Autocomplete item.key is required unless getKey is supplied.');
      if (!Utils.isFunction(opts.getLabel) && (item.label === undefined || item.label === null)) throw new TypeError('[QXFRAME9A7C2] Autocomplete item.label is required unless getLabel is supplied.');
      if (!Utils.isFunction(opts.getValue) && (item.value === undefined || item.value === null)) throw new TypeError('[QXFRAME9A7C2] Autocomplete item.value is required unless getValue is supplied.');
    }
  });
}

function prepareOptions(source, overrides) {
  const fieldInit = Control.resolveFieldOptions(source, overrides);
  const incoming = fieldInit.options;
  if (fieldInit.formField && !own(incoming, 'value') && !own(incoming, 'defaultValue')) incoming.value = fieldInit.nativeValue;
  const opts = Utils.mergeOwn( AUTOCOMPLETE_DEFAULTS, incoming);
  validateItems(opts.items, opts);
  return { fieldInit, opts };
}

function setupAutocompleteRuntime(instance, fieldInit) {
        var opts = Utils.mergeOwn( instance.options);
        var doc = opts.document || globalThis.document;
        var host = opts.container || null;
        var headlessMode = opts.headless === true;
        var projectionMode = !headlessMode && opts.renderControl === false;
        validateItems(opts.items, opts);
var itemAccessors = ItemAccessors.create({
          getKey:function(item,index){return Utils.isFunction(opts.getKey)?opts.getKey(item,index):item.key;},
          getLabel:function(item,index){return Utils.isFunction(opts.getLabel)?opts.getLabel(item,index):item.label;},
          getValue:function(item,index){return Utils.isFunction(opts.getValue)?opts.getValue(item,index):item.value;},
          getItems:function(){return [];},
          isItemDisabled:function(item,index){return Utils.isFunction(opts.isItemDisabled)?opts.isItemDisabled(item,index)===true:!!(item&&item.disabled===true);}
        });
    
                var emitter = Object.freeze({ emit: function (type, payload) { return instance.emit(type, payload); } });
        var scope = Lifecycle.createScope();
        var destroyed = false;
        var api = instance;
var selectionRangeScheduler = null;
        var selectionCloseScheduler = Scheduler.createDelayScheduler(function (_timestamp, originalEvent) {
          if (!destroyed && triggerSession) triggerSession.close('select', originalEvent || null);
        });
        scope.add(function () { selectionCloseScheduler.dispose(); selectionCloseScheduler = null; });
        function scheduleSelectionRange(range) {
          if (!selectionRangeScheduler) {
            selectionRangeScheduler = Scheduler.createDelayScheduler(function (_timestamp, pendingRange) {
              if (destroyed || !input || !pendingRange) return;
              try { input.setSelectionRange(pendingRange.start, pendingRange.end); } catch (_) {}
            });
            scope.add(function () { selectionRangeScheduler.dispose(); selectionRangeScheduler = null; });
          }
          selectionRangeScheduler.request(0, range);
        }
        var binding = null, root = null, controlElement = null, input = null, clearButton = null, arrow = null, prefix = null, suffix = null, valueTarget = null, triggerTarget = null;
        var fieldHost = FieldHost.resolve({
          owner:'Autocomplete', options:opts, document:doc, host:host, component:instance,
          requiredRefs:['root','input','clear','toggle'], defaultFactory:createDefaultDOM,
          projectionRefs:[{ref:'value',option:'valueTarget'},{ref:'input',option:'inputTarget'}]
        });
        binding=fieldHost.binding; root=fieldHost.root; triggerTarget=fieldHost.triggerTarget;
        if (projectionMode) { valueTarget=fieldHost.refs.value||null; input=fieldHost.refs.input||null; }
        else if (!headlessMode) {
          controlElement=root; input=fieldHost.refs.input; clearButton=fieldHost.refs.clear; arrow=fieldHost.refs.toggle; prefix=fieldHost.refs.prefix||null; suffix=fieldHost.refs.suffix||null;
          if (!host && opts.formField && binding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
          root.classList.add('qxframe9a7c2-autocomplete');
        }
        var panel = doc.createElement('div'), optionHost = doc.createElement('div');
        var portalContainer = opts.portalContainer;
        if (portalContainer && typeof portalContainer === 'string') portalContainer = DOM.resolveElement(portalContainer, doc);
        if (!portalContainer) portalContainer = doc.body;
        if (!portalContainer || !portalContainer.appendChild) throw new TypeError('[QXFRAME9A7C2] Autocomplete portalContainer must be an Element.');
        panel.className = 'qxframe9a7c2-autocomplete-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset'; panel.hidden = true; optionHost.className = 'qxframe9a7c2-autocomplete-option-host'; panel.appendChild(optionHost);
    
        var initialValue = opts.value !== undefined ? opts.value : opts.defaultValue;
        var valueState = ValueController.create({
          value: initialValue === undefined || initialValue === null ? '' : String(initialValue),
          controlled: hasOwn(fieldInit.options, 'value'),
          normalizeValue: function (next) { return next === undefined || next === null ? '' : String(next); }
        });
        scope.add(function () { if (valueState) valueState.destroy(); valueState = null; });
        function committedValue() { return valueState ? valueState.value : ''; }
        function draftValue() { return valueState ? valueState.draftValue : ''; }
        function writeValue(next, meta, request) {
          if (!valueState) return false;
          var normalized = next === undefined || next === null ? '' : String(next);
          var previous = draftValue();
          if (previous === normalized) return false;
          var cfg = Utils.assignOwn({ silent: true, source: 'instance', reason: request ? 'request-change' : 'set-value' }, meta || {});
          if (request === true) {
            valueState.setDraft(normalized, cfg);
            if (valueState.controlled) valueState.requestChange(normalized, cfg);
            else valueState.setValue(normalized, cfg);
          } else valueState.setValue(normalized, cfg);
          return true;
        }
        var currentItems = Array.isArray(opts.items) ? opts.items.slice() : [];
        var optionList = null, triggerSession = null, keyboard = null, control = null;
        var loading = false, suggestionTask = null, lastQuery = '', lastQueryContext = null;
        var backfillValue = null, backfillKey = null;
    
    
        function deriveQuery(reason, originalEvent) {
          var current = draftValue();
          var payload = { inputValue: current, value: current, committedValue: committedValue(), reason: reason || 'query', originalEvent: originalEvent || null, autocomplete: instance };
          var result = Utils.isFunction(opts.getSuggestionQuery) ? opts.getSuggestionQuery(current, payload) : current;
          var query = current, context = null;
          if (result && typeof result === 'object' && !Array.isArray(result)) {
            query = result.query === undefined || result.query === null ? '' : String(result.query);
            context = Utils.mergeOwn( result);
          } else query = result === undefined || result === null ? '' : String(result);
          lastQuery = query; lastQueryContext = context;
          return { query: query, context: context, payload: payload };
        }
    
        function currentFilterQuery(reason, originalEvent) { var info = deriveQuery(reason, originalEvent); return opts.matchOnly === true ? info.query : ''; }
        function clearBackfill() { backfillValue = null; backfillKey = null; }
        function displayedValue() { return backfillValue === null ? draftValue() : backfillValue; }
        function applyQuery(reason, originalEvent) { if (optionList) optionList.setSearch(currentFilterQuery(reason, originalEvent)); }
    
        function syncActive(reason) {
          if (!optionList) return false;
          var visible = optionList.getVisibleItems();
          if (!visible.length) return optionList.resetActive({ source: 'autocomplete', reason: reason || 'empty' });
          if (opts.highlightFirst !== true) return optionList.resetActive({ source: 'autocomplete', reason: reason || 'no-default-highlight' });
          return optionList.setActiveKey(itemAccessors.key(visible[0], 0, opts), { source: 'autocomplete', reason: reason || 'highlight-first' });
        }
    
        function setLoading(next) {
          loading = next === true;
          if (optionList) optionList.updateOptions({ loading: loading });
          if (control) control.updateOptions({ busy: loading });
        }
    
        function emitOpen(opened, detail) {
          if (!projectionMode && !headlessMode) root.classList.toggle('is-open', opened);
          if (control) control.setExpanded(opened);
          return OpenStateBridge.dispatch(opened, detail, {
            emitter: emitter,
            eventName: 'openChange',
            decorate: function () { return { autocomplete: instance }; },
            onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); },
            shouldEmit: function () { return !triggerSession || triggerSession.getState().open === opened; }
          });
        }
    
        function syncControl(meta) {
          if (!control) return;
          control.updateOptions({
            mode: 'input', size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix,
            required: opts.required === true, name: opts.name, busy: loading || opts.busy === true,
            disabled: opts.disabled, readOnly: opts.readOnly, editable: true, clearable: opts.clearable,
            clearVisibility: 'interaction', placeholder: opts.placeholder, displayValue: displayedValue(), inputValue: displayedValue(), hasValue: displayedValue() !== '', expanded: triggerSession && triggerSession.getState().open, toggleVisible: true
          });
          control.setCommittedValue(committedValue(), meta || { silent: true, source: 'autocomplete', reason: 'projection' });
        }
    
        function emitChange(reason, originalEvent, previousValue) {
          var current = draftValue();
          var payload = { value: current, inputValue: current, committedValue: committedValue(), previousValue: previousValue, controlled: !!(valueState && valueState.controlled), query: lastQuery, queryContext: lastQueryContext, reason: reason || 'input', source: reason === 'input' ? 'input' : 'instance', originalEvent: originalEvent || null, autocomplete: instance };
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(current, payload);
          if (destroyed) return false;
          if (Utils.isFunction(opts.onChange)) opts.onChange(current, payload);
          if (destroyed) return false;
          emitter.emit('change', payload);
          return !destroyed;
        }
    
        function canOpen(reason, originalEvent) { return deriveQuery(reason, originalEvent).query.length >= Math.max(0, Number(opts.minChars) || 0); }
    
        function setLoadedItems(items, info, meta) {
          validateItems(items, opts);
          currentItems = Array.isArray(items) ? items.slice() : [];
          optionList.setItems(currentItems);
          optionList.setSearch(opts.matchOnly === true ? info.query : '');
          syncActive(meta && meta.reason || 'suggestions');
          if (triggerSession && triggerSession.getState().open) triggerSession.reposition('suggestions');
        }
    
        function notifyLoad(items, info, meta) {
          var payload = {
            items: items.slice(), query: info.query, queryContext: info.context, inputValue: draftValue(),
            reason: meta && meta.reason || 'suggestions', originalEvent: meta && meta.originalEvent || null, autocomplete: instance
          };
          if (Utils.isFunction(opts.onSuggestionsLoad)) opts.onSuggestionsLoad(items.slice(), payload);
          emitter.emit('suggestionsLoad', payload);
        }
    
        function notifyLoadError(error, info, meta) {
          var payload = { error: error, query: info.query, queryContext: info.context, inputValue: draftValue(), reason: meta && meta.reason || 'suggestions-error', originalEvent: meta && meta.originalEvent || null, autocomplete: instance };
          if (Utils.isFunction(opts.onSuggestionsError)) opts.onSuggestionsError(error, payload);
          emitter.emit('suggestionsError', payload);
        }
    
        function createSuggestionTask() {
          if (suggestionTask) return suggestionTask;
          suggestionTask = AsyncTask.create({
            task: function (request, context) {
              var info = request.info, meta = request.meta, originalEvent = request.originalEvent || null;
              return new Promise(function (resolve) {
                var settled = false;
                function complete(items) {
                  if (settled) return;
                  settled = true;
                  resolve({ items: Array.isArray(items) ? items : [], info: info, meta: meta, isCurrent: context.isCurrent });
                }
                try {
                  var payload = {
                    query: info.query, queryContext: info.context, inputValue: draftValue(), reason: meta.reason, originalEvent: originalEvent,
                    requestId: context.requestId, signal: context.signal, autocomplete: instance
                  };
                  var returned = opts.loadSuggestions(info.query, complete, payload);
                  if (returned && Utils.isFunction(returned.then)) returned.then(complete, function (error) {
                    if (settled) return;
                    settled = true;
                    resolve({ error: error, info: info, meta: meta, isCurrent: context.isCurrent });
                  });
                  else if (Array.isArray(returned)) complete(returned);
                  else if (returned !== undefined && returned !== null) {
                    settled = true;
                    resolve({ error: new TypeError('[QXFRAME9A7C2] Autocomplete loadSuggestions must call done(items), return an items array, return a Promise, or return undefined.'), info: info, meta: meta, isCurrent: context.isCurrent });
                  }
                } catch (error) {
                  if (!settled) { settled = true; resolve({ error: error, info: info, meta: meta, isCurrent: context.isCurrent }); }
                }
              });
            }
          });
          return suggestionTask;
        }

        function refreshSuggestions(reason, originalEvent) {
          if (destroyed || !optionList) return Promise.resolve([]);
          var info = deriveQuery(reason, originalEvent);
          var meta = { reason: reason || 'suggestions', originalEvent: originalEvent || null };
          if (!Utils.isFunction(opts.loadSuggestions)) {
            if (suggestionTask) suggestionTask.cancel('static-items');
            setLoading(false);
            setLoadedItems(Array.isArray(opts.items) ? opts.items : [], info, meta);
            return Promise.resolve(currentItems.slice());
          }
          setLoading(true);
          currentItems = [];
          optionList.setItems([]);
          optionList.setSearch('');
          optionList.resetActive({ source: 'autocomplete', reason: 'suggestions-loading' });
          var task = createSuggestionTask();
          var promise = task.run({ info: info, meta: meta, originalEvent: originalEvent || null }, { source: meta.reason });
          var requestId = task.requestId;
          return promise.then(function (result) {
            if (!result || !result.isCurrent || !result.isCurrent() || destroyed) return [];
            if (result.error) { setLoading(false); notifyLoadError(result.error, info, meta); return []; }
            try {
              var normalized = Array.isArray(result.items) ? result.items : [];
              setLoadedItems(normalized, info, meta);
              setLoading(false);
              notifyLoad(normalized, info, meta);
              return normalized.slice();
            } catch (error) {
              setLoading(false);
              notifyLoadError(error, info, meta);
              return [];
            }
          }, function (error) {
            if (destroyed || !suggestionTask || suggestionTask.requestId !== requestId || suggestionTask.state !== 'error') return [];
            if (error && error.name === 'AbortError') return [];
            setLoading(false); notifyLoadError(error, info, meta); return [];
          });
        }

        function setValue(next, meta) {
          if (destroyed) return instance;
          var previousValue = draftValue();
          var changed = writeValue(next, meta, false); clearBackfill();
          if (optionList) optionList.clear({ silent: true, source: meta && meta.source || 'instance', reason: 'autocomplete-free-text' });
          applyQuery(meta && meta.reason || 'set-value', meta && meta.originalEvent || null); syncControl({ silent: !!(meta && meta.silent), source: meta && meta.source || 'instance', reason: meta && meta.reason || 'set-value' });
          if (triggerSession && triggerSession.getState().open) refreshSuggestions(meta && meta.reason || 'set-value', meta && meta.originalEvent || null);
          if (changed && !(meta && meta.silent)) emitChange(meta && meta.reason || 'set-value', meta && meta.originalEvent || null, previousValue);
          return instance;
        }
    
        function setItems(items) {
          if (destroyed) return instance; validateItems(items, opts);
          if (suggestionTask && suggestionTask.pending) suggestionTask.cancel('autocomplete-items-replaced');
          setLoading(false);
          opts.items = Array.isArray(items) ? items.slice() : []; currentItems = opts.items.slice();
          var info = deriveQuery('set-items'); setLoadedItems(currentItems, info, { reason: 'set-items' }); return instance;
        }
    
        function clear(meta) {
          if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
          var previousValue = draftValue();
          var cfg = { source: meta && meta.source || 'instance', reason: meta && meta.reason || 'clear', originalEvent: meta && meta.originalEvent || null };
          var changed = writeValue('', cfg, true); clearBackfill();
          if (changed) { optionList.clear({ silent: true, source: cfg.source, reason: 'autocomplete-free-text' }); applyQuery(cfg.reason, cfg.originalEvent); syncControl(cfg); emitChange(cfg.reason, cfg.originalEvent, previousValue); }
          if (destroyed) return changed;
          var clearPayload = { autocomplete: instance, reason: cfg.reason };
          if (Utils.isFunction(opts.onClear)) opts.onClear(clearPayload);
          if (destroyed) return changed;
          emitter.emit('clear', clearPayload);
          return changed;
        }
    
        function commitSuggestion(detail) {
          if (!detail || detail.selected === false) return false;
          var item = detail.item;
          var baseValue = itemAccessors.value(item, detail.index || 0, opts);
          var info = deriveQuery('select', detail.originalEvent || null);
          var payload = Utils.mergeOwn( detail, { value: baseValue, inputValue: draftValue(), committedValue: committedValue(), query: info.query, queryContext: info.context, autocomplete: instance });
          var applied = Utils.isFunction(opts.applySuggestion) ? opts.applySuggestion(item, payload) : undefined;
          if (destroyed) return false;
          var nextValue = baseValue, selectionStart = null, selectionEnd = null;
          if (applied !== undefined && applied !== null) {
            if (typeof applied === 'object') {
              if (applied.value !== undefined) nextValue = String(applied.value);
              if (Number.isFinite(Number(applied.selectionStart))) selectionStart = Number(applied.selectionStart);
              if (Number.isFinite(Number(applied.selectionEnd))) selectionEnd = Number(applied.selectionEnd);
            } else nextValue = String(applied);
          }
          var previousValue = draftValue();
          writeValue(nextValue, { source: 'autocomplete', reason: 'select', originalEvent: detail.originalEvent || null }, true); clearBackfill();
          optionList.clear({ silent: true, source: 'autocomplete', reason: 'selection-committed' });
          syncControl({ source: 'autocomplete', reason: 'select' });
          payload = Utils.assignOwn(payload, { value: draftValue(), committedValue: committedValue(), selectionStart: selectionStart, selectionEnd: selectionEnd });
          if (Utils.isFunction(opts.onSelect)) opts.onSelect(draftValue(), payload);
          if (destroyed) return true;
          emitter.emit('select', payload);
          if (destroyed) return true;
          if (!emitChange('select', detail.originalEvent || null, previousValue)) return true;
          if (triggerSession) triggerSession.close('select', detail.originalEvent || null);
          if (destroyed) return true;
          selectionCloseScheduler.request(0, detail.originalEvent || null);
          if ((selectionStart !== null || selectionEnd !== null) && input && input.setSelectionRange) {
            var start = selectionStart === null ? draftValue().length : selectionStart; var end = selectionEnd === null ? start : selectionEnd;
            scheduleSelectionRange({ start: start, end: end });
          }
          return true;
        }
    
        optionList = OptionList.create({
          ownerPrefix: 'autocomplete',
          itemSemanticClasses: function () { return ['qxframe9a7c2-autocomplete-item','qxframe9a7c2-autocomplete-option']; },
          itemClassParts: ['item','option'],
          classes: opts.classes,
          container: optionHost, scrollAdapter: function (config) { return Scroll.attachViewport(config); }, items: currentItems.slice(), searchable: false, size: opts.size,
          disabled: opts.disabled === true, readOnly: opts.readOnly === true, virtual: opts.virtual, virtualThreshold: opts.virtualThreshold, height: opts.height, maxHeight: opts.maxHeight,
          itemSize: opts.itemSize, overscan: opts.overscan, filterItem: opts.filterItem, sortItems: opts.sortItems,
          loadingText: opts.loadingText, emptyText: opts.emptyText, error: opts.error, errorText: opts.errorText,
          getKey: opts.getKey, getLabel: opts.getLabel, getValue: opts.getValue, isItemDisabled: opts.isItemDisabled, itemRender: Utils.isFunction(opts.itemRender) ? function (item, ctx) { return opts.itemRender(item, Item.createContext(item, Utils.mergeOwn( ctx || {}, { component:instance, controller:instance, query:String(draftValue() || '') }))); } : null,
          keyboardFocusOwner: function () { return input; },
          onActiveChange: function (detail) {
            if (opts.backfill === true && detail && detail.item && detail.source === 'keyboard') {
              backfillKey = detail.key === undefined || detail.key === null ? null : String(detail.key);
              backfillValue = itemAccessors.value(detail.item, detail.index || 0, opts);
              syncControl();
              var backfillDetail = Utils.mergeOwn( detail, { value: backfillValue, committedValue: committedValue(), autocomplete: instance });
              if (Utils.isFunction(opts.onBackfill)) opts.onBackfill(backfillValue, backfillDetail);
              if (destroyed) return;
              emitter.emit('backfill', backfillDetail);
              if (destroyed) return;
            } else if (opts.backfill === true && (!detail || !detail.item)) { clearBackfill(); syncControl(); }
            if (Utils.isFunction(opts.onActiveChange)) opts.onActiveChange(detail);
          },
          onSelect: commitSuggestion
        });
        applyQuery('init');
    
        var triggerSettings = createPopupFieldTriggerSettings(opts, {
          reference: root,
          triggerTarget: headlessMode ? triggerTarget : (projectionMode ? triggerTarget : (triggerTarget || root)),
          floating: panel,
          document: doc,
          portalContainer: portalContainer
        }, {
          tabExitTarget: function () { return input || triggerTarget || root; },
          beforeOpen: function (detail) {
            var reason = detail && detail.reason || 'open', event = detail && detail.originalEvent || null;
            if (destroyed || opts.disabled === true || !canOpen(reason, event)) return false;
          },
          onOpen: function (detail) {
            refreshSuggestions(detail && detail.reason || 'open', detail && detail.originalEvent || null);
            if (!loading) {
              var openContext = popupOpenContext(detail);
              if (openContext.keyboard) optionList.prepareOpen({ strategy:/up/.test(openContext.reason) ? 'last' : 'first', source:'keyboard', reason:'autocomplete-keyboard-open' });
              else if (!openContext.pointer && opts.highlightFirst === true) syncActive(openContext.reason === 'input' ? 'input-open' : 'open');
              else optionList.prepareOpen({ strategy: 'none', source: 'instance', reason: 'autocomplete-pointer-open' });
            }
            syncControl();
            emitOpen(true, detail);
          },
          onClose: function (detail) { clearBackfill(); syncControl(); emitOpen(false, detail); }
        });
        triggerSession = instance.setupPopupFieldRuntime(triggerSettings);
    
        function open(reason, originalEvent) { return destroyed || opts.disabled === true || !canOpen(reason, originalEvent) ? false : triggerSession.open(reason || 'instance', originalEvent || null); }
        function close(reason, originalEvent) { return destroyed ? false : triggerSession.close(reason || 'instance', originalEvent || null); }
    
        function handleInput(next, event) {
          if (InteractionPolicy.mutationLocked(opts)) return;
          var previousValue = draftValue();
          var changed = writeValue(String(next || ''), { source: 'input', reason: 'input', originalEvent: event }, true); clearBackfill(); optionList.clear({ silent: true, source: 'input', reason: 'autocomplete-free-text' }); syncControl({ source: 'input', reason: 'input' });
          var info = deriveQuery('input', event);
          var current = draftValue();
          var payload = { value: current, inputValue: current, committedValue: committedValue(), controlled: !!(valueState && valueState.controlled), query: info.query, queryContext: info.context, originalEvent: event, autocomplete: instance };
          if (Utils.isFunction(opts.onInput)) opts.onInput(current, payload);
          if (destroyed) return;
          emitter.emit('input', payload);
          if (destroyed) return;
          if (Utils.isFunction(opts.onSearch)) opts.onSearch(info.query, payload);
          if (destroyed) return;
          emitter.emit('search', payload);
          if (destroyed) return;
          if (changed && !emitChange('input', event, previousValue)) return;
          if (info.query.length >= Math.max(0, Number(opts.minChars) || 0)) {
            if (!triggerSession.getState().open) open('input', event); else refreshSuggestions('input', event);
          } else close('min-chars', event);
        }
    
        control = headlessMode ? null : projectionMode ? Control.createProjection({
          document: doc, reference: root, valueTarget: valueTarget, inputTarget: input, formTarget: opts.formTarget, formField: opts.formField, name: opts.name, committedValue: committedValue(),
          mode:'input', displayValue:displayedValue(), inputValue:displayedValue(), editable:true, disabled:opts.disabled, readOnly:opts.readOnly, required:opts.required === true, placeholder:opts.placeholder,
          onInput: handleInput,
          onFocus: function (event) { if (Utils.isFunction(opts.onFocus)) opts.onFocus(event, instance); },
          onBlur: function (event) { if (Utils.isFunction(opts.onBlur)) opts.onBlur(event, instance); }
        }) : Control.create({
          elements: { root: root, input: input, clear: clearButton, toggle: arrow, prefix: prefix, suffix: suffix }, document: doc, formField: opts.formField, committedValue: committedValue(),
          mode: 'input', size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix,
          required: opts.required === true, name: opts.name, busy: loading || opts.busy === true,
          disabled: opts.disabled, readOnly: opts.readOnly, editable: true, clearable: opts.clearable, clearVisibility: 'interaction', hasValue: displayedValue() !== '', inputValue: displayedValue(),
          placeholder: opts.placeholder, expanded: false, toggleVisible: true,
          onInput: handleInput,
          onFocus: function (event) { if (Utils.isFunction(opts.onFocus)) opts.onFocus(event, instance); },
          onBlur: function (event) { if (Utils.isFunction(opts.onBlur)) opts.onBlur(event, instance); },
          onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
        });
    
        var keyboardTarget = headlessMode ? triggerTarget : (control && control.getFocusElement ? control.getFocusElement() : (input || triggerTarget || root));
        keyboard = keyboardTarget ? KeyboardNavigation.create({
          root: keyboardTarget,
          focusRoot: function () { return control && control.getFocusElement ? control.getFocusElement() : (input || triggerTarget || root); },
          editableKeys: ['ArrowDown','ArrowUp','Enter','Escape','Home','End','PageUp','PageDown'],
          allowEditableKey:function(key, detail){ if ((key === 'Home' || key === 'End') && KeyboardNavigation.shouldPreserveNativeTextEditing(detail.originalEvent, detail.target)) return false; return true; },
          handlers: {
            Escape: function (detail) { return triggerSession.getState().open ? close('escape', detail.originalEvent) : false; },
            ArrowDown: function (detail) { if (!triggerSession.getState().open) { if (!open('keyboard-down', detail.originalEvent)) return false; return true; } return optionList.handleKeydown(detail.originalEvent); },
            ArrowUp: function (detail) { if (!triggerSession.getState().open) { if (!open('keyboard-up', detail.originalEvent)) return false; return true; } return optionList.handleKeydown(detail.originalEvent); },
            Enter: function (detail) { return triggerSession.getState().open && !loading ? optionList.handleKeydown(detail.originalEvent) : false; },
            Home: function (detail) { return triggerSession.getState().open && !loading ? optionList.handleKeydown(detail.originalEvent) : false; },
            End: function (detail) { return triggerSession.getState().open && !loading ? optionList.handleKeydown(detail.originalEvent) : false; },
            PageUp: function (detail) { return triggerSession.getState().open && !loading ? optionList.handleKeydown(detail.originalEvent) : false; },
            PageDown: function (detail) { return triggerSession.getState().open && !loading ? optionList.handleKeydown(detail.originalEvent) : false; }
          }
        }) : null;
        if (keyboard) { optionList.bindVirtualFocus(keyboard.virtualFocus); scope.add(function () { keyboard.destroy(); }); }
    
        function applyOptions(nextOptions) {
          if (destroyed) return instance;
          var next = nextOptions || {};
                    OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless'], 'Autocomplete field binding');
          if (hasOwn(next, 'portalContainer')) {
            var nextPortal = typeof next.portalContainer === 'string' ? DOM.resolveElement(next.portalContainer, doc) : next.portalContainer;
            if (nextPortal !== portalContainer) throw new Error('[QXFRAME9A7C2] Autocomplete portalContainer is immutable; destroy and recreate to change it.');
          }
          var suggestionOwnerChanged = (hasOwn(next, 'loadSuggestions') && next.loadSuggestions !== opts.loadSuggestions) || hasOwn(next, 'items');
          var candidate = Utils.mergeOwn( opts, next);
          if (hasOwn(next,'items') || hasOwn(next,'getKey') || hasOwn(next,'getLabel') || hasOwn(next,'getValue')) validateItems(candidate.items, candidate);
          if (suggestionOwnerChanged && suggestionTask && suggestionTask.pending) suggestionTask.cancel('autocomplete-options-replaced');
          if (suggestionOwnerChanged) setLoading(false);
          Utils.copyOwn(opts, next);
          var listOptions = { size: opts.size, classes: opts.classes, disabled: opts.disabled === true, readOnly: opts.readOnly === true, virtual: opts.virtual, virtualThreshold: opts.virtualThreshold, height: opts.height, maxHeight: opts.maxHeight, itemSize: opts.itemSize, overscan: opts.overscan, filterItem: opts.filterItem, sortItems: opts.sortItems, loadingText: opts.loadingText, emptyText: opts.emptyText, error: opts.error, errorText: opts.errorText, getKey: opts.getKey, getLabel: opts.getLabel, getValue: opts.getValue, isItemDisabled: opts.isItemDisabled, itemRender: Utils.isFunction(opts.itemRender) ? function (item, ctx) { return opts.itemRender(item, Item.createContext(item, Utils.mergeOwn( ctx || {}, { component:instance, controller:instance, query:String(draftValue() || '') }))); } : null };
          if (hasOwn(next, 'items') && !Utils.isFunction(opts.loadSuggestions)) { currentItems = Array.isArray(opts.items) ? opts.items.slice() : []; listOptions.items = currentItems.slice(); }
          optionList.updateOptions(listOptions);
          if (hasOwn(next, 'value')) { valueState.setControlled(true); valueState.syncExternal(opts.value, { silent: true, source: 'options', reason: 'options-value', preserveDraft: true }); clearBackfill(); }
          else if (triggerSession.getState().open) refreshSuggestions('options'); else applyQuery('options');
          if (opts.disabled === true && triggerSession.getState().open) close('disabled'); syncControl(); if (binding && binding.syncClasses) binding.syncClasses(opts.classes);
          return instance;
        }
    
        function getState() {
          var listState = optionList.getState();
          var info = deriveQuery('state');
          return Object.freeze({ value: committedValue(), draftValue: draftValue(), inputValue: displayedValue(), committedInputValue: committedValue(), controlled: !!(valueState && valueState.controlled), dirty: !!(valueState && valueState.dirty), backfillValue: backfillValue, backfillKey: backfillKey, query: info.query, queryContext: info.context, open: !!triggerSession.getState().open, loading: loading, activeKey: listState.activeKey ? listState.activeKey : null, visibleItemCount: listState.visibleItemCount, highlightFirst: opts.highlightFirst === true, matchOnly: opts.matchOnly === true, dynamic: Utils.isFunction(opts.loadSuggestions), headless: headlessMode, projection: projectionMode, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed });
        }
    
        function disposeRuntime(reason) {
          if (destroyed) return false; destroyed = true; if (suggestionTask) { suggestionTask.destroy(); suggestionTask = null; } scope.dispose();
          triggerSession = null;
          if (optionList) optionList.destroy(reason || 'autocomplete-destroy'); optionList = null;
          if (control) control.destroy(reason || 'autocomplete-destroy'); control = null;
          DOM.removeNode(panel); if (binding) binding.release(); binding = null;
          root = controlElement = input = clearButton = arrow = panel = optionHost = null; return true;
        }
    
    
    
        if (control && control.onFormReset) control.onFormReset(function () { setValue(initialValue, { silent: true, source: 'form', reason: 'reset' }); });
        syncControl();
        instance.bindFocusTarget(input || triggerTarget || root);
        instance.setFieldValue(committedValue(), { silent:true, force:true });
        if (opts.open === true) open('initial');
        return Object.freeze({
          root: root,
          input: input,
          panel: panel,
          triggerTarget: triggerTarget,
          getState: getState,
          setValue: setValue,
          setItems: setItems,
          clear: clear,
          refreshSuggestions: refreshSuggestions,
          getControl: function () { return control; },
          getOptionList: function () { return optionList; },
          applyOptions: applyOptions,
          dispose: disposeRuntime
        });
      
}


export class Autocomplete extends PopupFieldComponent {
  static profile = Object.freeze({
    name:'Autocomplete',
    value:Object.freeze({mode:'controlled-or-default',channels:Object.freeze(['committed','draft'])}),
    focus:Object.freeze({mode:'virtual-navigation'}),
    interaction:Object.freeze({keymap:'autocomplete'}),
    overlay:Object.freeze({mode:'popup'}),
    form:Object.freeze({serialize:true}),
    ownership:Object.freeze({value:'ValueController'})
  });
  static contract = getContract('Autocomplete');
  static immutableOptions = Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless']);
  static create(source, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }
  static createDefaultDOM = createDefaultDOM;

  constructor(source = {}, overrides) {
    const prepared = prepareOptions(source, overrides);
    super(prepared.opts);
    runtimeState.set(this, { fieldInit: prepared.fieldInit, runtime: null });
  }

  [componentHooks.render]() {
    const record = runtimeState.get(this);
    if (record.runtime) return record.runtime.root;
    const runtime = setupAutocompleteRuntime(this, record.fieldInit);
    record.runtime = runtime;
    this.own(() => runtime.dispose('autocomplete-destroy'));
    return runtime.root;
  }

  [popupFieldHooks.optionsUpdated](next, previous, patch) {
    const record = runtimeState.get(this);
    if (!record.runtime) return;
    record.runtime.applyOptions(patch);
  }

  setItems(items) { const r = runtimeState.get(this).runtime; return r ? r.setItems(items) : this; }
  setValue(value, meta) { const r = runtimeState.get(this).runtime; return r ? r.setValue(value, meta) : this; }
  clear(meta) { const r = runtimeState.get(this).runtime; return r ? r.clear(meta) : false; }
  refreshSuggestions(reason, originalEvent) { const r = runtimeState.get(this).runtime; return r ? r.refreshSuggestions(reason, originalEvent) : Promise.resolve([]); }
  getState() { const r = runtimeState.get(this).runtime; return r ? r.getState() : Object.freeze({ open:false, destroyed:this.destroyed }); }
  getControl() { const r = runtimeState.get(this).runtime; return r ? r.getControl() : null; }
  getOptionList() { const r = runtimeState.get(this).runtime; return r ? r.getOptionList() : null; }
  getRootElement() { const r = runtimeState.get(this).runtime; return r ? r.root : this.root; }
  getInputElement() { const r = runtimeState.get(this).runtime; return r ? r.input : null; }
  getPopupElement() { const r = runtimeState.get(this).runtime; return r ? r.panel : super.getPopupElement(); }
}
