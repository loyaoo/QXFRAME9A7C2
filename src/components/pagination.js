import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Events } from '../core/events.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Utils } from '../utils/utils.js';
import { PaginationModel } from '../core/paginationModel.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { Select } from './select.js';
import { Item } from './item.js';

const global = globalThis;

const blueprint = DOMTemplate.staticHTML`<nav class="qxframe9a7c2-pagination" data-qxframe9a7c2-ref="root"></nav>`;
function createDefaultDOM(context) { var instance = blueprint.instantiate(context.document); return {root: instance.root, refs: instance.refs}; }
function createElement(context, tagName, className) { var el = context.document.createElement(tagName || 'div'); if (className) el.className = className; return el; }
const DOMFactory = Object.freeze({ createDefaultDOM, createElement, blueprint });

var SIZES = Object.freeze({ xs: true, sm: true, md: true, lg: true, xl: true });
var DEFAULT_PAGE_SIZES = Object.freeze([5, 10, 20, 50, 100, 200]);
var LAYOUT_TOKENS = Object.freeze({ prev: true, page: true, next: true, count: true, limit: true, skip: true, refresh: true, text: true });
function mergeOptions(base, extra) { return Object.assign({}, base || {}, extra || {}); }
    
function validateSize(value) {
  var size = String(value === undefined || value === null ? 'md' : value).toLowerCase();
  if (!SIZES[size]) throw new TypeError('[QXFRAME9A7C2] Pagination size must be one of xs/sm/md/lg/xl.');
  return size;
}
var own = Utils.own;
    
function positiveInt(value, fallback) {
  var number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
    
function nonNegativeInt(value) {
  var number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
}
    
function uniquePositive(values, current) {
  var seen = Object.create(null);
  var result = [];
  (Array.isArray(values) ? values : DEFAULT_PAGE_SIZES).concat([current]).forEach(function (value) {
    var number = positiveInt(value, 0);
    if (!number || seen[number]) return;
    seen[number] = true;
    result.push(number);
  });
  result.sort(function (a, b) { return a - b; });
  return result;
}
    
function normalizeLayout(opts) {
  var explicit = opts.layout !== undefined && opts.layout !== null && opts.layout !== '';
  var layout = opts.layout;
  if (!Array.isArray(layout)) {
    layout = typeof layout === 'string' ? layout.split(/[\s,]+/).filter(Boolean) : (opts.simple === true ? ['prev', 'text', 'next'] : ['prev', 'page', 'next']);
  } else layout = layout.slice();
    
  var seen = Object.create(null);
  layout = layout.map(function (item) {
    var key = String(item || '').trim();
    if (key && !LAYOUT_TOKENS[key]) throw new TypeError('[QXFRAME9A7C2] Pagination layout token is not canonical: ' + key + '.');
    return key;
  }).filter(function (item) {
    if (!item || seen[item]) return false;
    seen[item] = true;
    return true;
  });
    
  if (!explicit) {
    if (opts.showTotal && layout.indexOf('count') < 0) layout.unshift('count');
    if (opts.showSizeChanger && layout.indexOf('limit') < 0) layout.push('limit');
    if (opts.showJumper && layout.indexOf('skip') < 0) layout.push('skip');
  }
  return layout;
}
    
function create(options) {
  ComponentContracts.validate(ComponentContracts.get('Pagination'), options, 'Pagination');
  var opts = mergeOptions({
    count: 0,
    current: 1,
    pageSize: 10,
    pagerCount: 9,
    first: true,
    last: true,
    ellipsis: true,
    ellipsisJump: 0.1,
    showTotal: false,
    showSizeChanger: false,
    components: null,
    showJumper: false,
    pageSizeOptions: DEFAULT_PAGE_SIZES,
    size: 'md',
    disabled: false,
    hideOnSinglePage: false,
    background: false,
    simple: false,
    responsive: true,
    itemRender: null
  }, options);
  var doc = opts.document || (opts.container && opts.container.ownerDocument) || global.document;
  opts.size = validateSize(opts.size);
  if (typeof opts.simple !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Pagination simple must be boolean.');
  if (typeof opts.responsive !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Pagination responsive must be boolean.');
  if (opts.itemRender !== null && opts.itemRender !== undefined && !Utils.isFunction(opts.itemRender)) throw new TypeError('[QXFRAME9A7C2] Pagination itemRender must be a function or null.');
  if (typeof opts.showSizeChanger !== 'boolean' && (!opts.showSizeChanger || typeof opts.showSizeChanger !== 'object' || Array.isArray(opts.showSizeChanger))) throw new TypeError('[QXFRAME9A7C2] Pagination showSizeChanger must be boolean or a Select options object.');
  if (opts.components !== null && opts.components !== undefined && (!opts.components || typeof opts.components !== 'object' || Array.isArray(opts.components))) throw new TypeError('[QXFRAME9A7C2] Pagination components must be an object or null.');
  if (opts.components && opts.components.sizeChanger !== undefined && !Utils.isFunction(opts.components.sizeChanger)) throw new TypeError('[QXFRAME9A7C2] Pagination components.sizeChanger must be a factory function.');
  normalizeLayout(opts);
  if (!opts.container && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] Pagination container is required unless options.elements supplies existing DOM.');
    
  var emitter = Events.createEmitter();
  var scope = Lifecycle.createScope();
  var model = PaginationModel.create({
    total: nonNegativeInt(opts.count),
    page: positiveInt(opts.current, 1),
    pageSize: positiveInt(opts.pageSize, 10),
    pagerCount: Math.max(3, positiveInt(opts.pagerCount, 9)),
    first: opts.first !== false,
    last: opts.last !== false,
    ellipsis: opts.ellipsis !== false,
    ellipsisJump: opts.ellipsisJump
  });
  var destroyed = false;
  var mounted = false;
  var host = null;
  var root = null;
  var domBinding = null;
  var delegation = null;
  var keyboard = null;
  var renderCount = 0;
  var limitSelect = null;
  var appliedClassNames = [];
  var jumperDraft = String(model.page);
  var limitSelectChangeDepth = 0;
  var api = null;
  var viewScheduler = Scheduler.createFrameScheduler(function (_, reason) {
    if (!destroyed && mounted) render(reason || 'scheduled-model-change');
  });
  scope.add(function () { viewScheduler.dispose(); });
    
  function sizeName() { return opts.size; }
  function syncRootClasses() {
    if (!root) return;
    appliedClassNames.forEach(function (name) { root.classList.remove(name); });
    appliedClassNames = String(opts.className || '').split(/\s+/).filter(Boolean);
    root.classList.add('qxframe9a7c2-pagination');
    ['xs', 'sm', 'md', 'lg', 'xl'].forEach(function (size) { root.classList.remove('is-' + size); });
    root.classList.add('is-' + sizeName());
    root.classList.toggle('is-simple', opts.simple === true);
    root.classList.toggle('is-responsive', opts.responsive === true);
    appliedClassNames.forEach(function (name) { root.classList.add(name); });
  }
  function isDisabled() { return opts.disabled === true; }
    
  function state() {
    var snapshot = model.snapshot();
    return Object.freeze({
      current: snapshot.page,
      pageSize: snapshot.pageSize,
      count: snapshot.total,
      pageCount: snapshot.pageCount,
      hasPrevious: snapshot.hasPrevious,
      hasNext: snapshot.hasNext,
      pagerCount: snapshot.pageCount > 0 ? model.pagerCount : 0,
      disabled: isDisabled(),
      hidden: opts.hideOnSinglePage === true && snapshot.pageCount <= 1,
      size: sizeName(),
      simple: opts.simple === true,
      responsive: opts.responsive === true,
      layout: normalizeLayout(opts).slice(),
      renderCount: renderCount,
      mounted: mounted,
      destroyed: destroyed
    });
  }
    
  function iconNode(name) {
    var icon = doc.createElement('span');
    icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + name + ' is-line is-round is-stroke-3';
    return icon;
  }
    
  function contentFor(optionValue, fallback, detail) {
    if (Utils.isFunction(optionValue)) return optionValue(detail);
    return optionValue === undefined || optionValue === null ? fallback : optionValue;
  }
    
  function createControl(className, page, content, disabled, role) {
    var item = doc.createElement('div');
    item.className = className;
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'qxframe9a7c2-button is-default is-plain qxframe9a7c2-pagination-control';
    DOM.setPrivate(button, 'paginationPage', String(page));
    if (role) DOM.setPrivate(button, 'paginationRole', role);
    button.disabled = disabled === true || isDisabled();
    item.classList.toggle('is-disabled', button.disabled);
    var output = content;
    if (Utils.isFunction(opts.itemRender)) {
      var itemDetail = Object.freeze({
        type: role || 'page', page: Number(page), content: content,
        disabled: button.disabled, current: model.page === Number(page)
      });
      var custom = opts.itemRender(itemDetail, Item.createContext(itemDetail, {
        index: Number(page), key: (role || 'page') + ':' + String(page), element: item, component: api, controller: api,
        type: role || 'page', page: Number(page), disabled: button.disabled, selected: model.page === Number(page), active: false, parts: {}
      }));
      if (custom !== undefined) output = custom;
    }
    Renderer.append(button, output);
    item.appendChild(button);
    return item;
  }
    
  function renderPageGroup(fragment, snapshot) {
    var tokens = model.deriveItems();
    tokens.forEach(function (token) {
      if (token.type === 'ellipsis') {
        var defaultEllipsis = opts.ellipsis === true || opts.ellipsis === false || opts.ellipsis === undefined || opts.ellipsis === null;
        var ellipsisValue = defaultEllipsis ? iconNode('more-horizontal') : contentFor(opts.ellipsis, iconNode('more-horizontal'), { token: token, controller: api });
        var ellipsisNode = createControl(
          'qxframe9a7c2-pagination-item qxframe9a7c2-pagination-ellipsis is-' + token.direction,
          token.target,
          ellipsisValue,
          false,
          'ellipsis',
          token.direction === 'left' ? '向前跳转更多页码' : '向后跳转更多页码'
        );
        var ellipsisButton = ellipsisNode.firstChild;
        if (ellipsisButton) {
          DOM.setPrivate(ellipsisButton, 'paginationHiddenStart', String(token.hiddenStart));
          DOM.setPrivate(ellipsisButton, 'paginationHiddenEnd', String(token.hiddenEnd));
          ellipsisButton.title = '跳至第 ' + token.target + ' 页（隐藏 ' + token.hiddenStart + '–' + token.hiddenEnd + '）';
        }
        fragment.appendChild(ellipsisNode);
        return;
      }
      var node = createControl(
        'qxframe9a7c2-pagination-item' + (token.role === 'first' ? ' is-first' : token.role === 'last' ? ' is-last' : ''),
        token.page,
        String(token.page),
        false,
        'page',
        '第 ' + token.page + ' 页'
      );
      node.classList.toggle('is-current', token.page === snapshot.page);
      if (token.page === snapshot.page && node.firstChild) node.firstChild;
      fragment.appendChild(node);
    });
  }
    
  function renderTotal(fragment, snapshot) {
    var wrap = doc.createElement('div');
    wrap.className = 'qxframe9a7c2-pagination-count';
    var start = snapshot.total ? snapshot.startIndex + 1 : 0;
    var range = [start, snapshot.endIndex];
    var value = Utils.isFunction(opts.showTotal)
      ? opts.showTotal(snapshot.total, range)
      : '共 ' + snapshot.total + ' 条';
    Renderer.append(wrap, value);
    fragment.appendChild(wrap);
  }
    
  function renderText(fragment, snapshot) {
    var wrap = doc.createElement('div');
    wrap.className = 'qxframe9a7c2-pagination-text';
    wrap.textContent = snapshot.page + ' / ' + snapshot.pageCount;
    fragment.appendChild(wrap);
  }
    
  function destroyLimitSelect(reason) {
    if (!limitSelect) return false;
    var select = limitSelect;
    limitSelect = null;
    if (select && Utils.isFunction(select.destroy)) select.destroy(reason || 'pagination-render');
    else if (select && select.nodeType === 1 && select.parentNode) select.parentNode.removeChild(select);
    return true;
  }
    
  function renderSizeChanger(fragment, snapshot) {
    var wrap = doc.createElement('div');
    wrap.className = 'qxframe9a7c2-pagination-limits';
    var mount = doc.createElement('div');
    mount.className = 'qxframe9a7c2-pagination-limit-control';
    wrap.appendChild(mount);
    fragment.appendChild(wrap);
    var items = uniquePositive(opts.pageSizeOptions, snapshot.pageSize).map(function (pageSize) {
      return { key: String(pageSize), value: String(pageSize), label: pageSize + ' 条/页' };
    });
    var onSizeChange = function (nextValue, detail) {
      limitSelectChangeDepth += 1;
      try {
        setPageSize(nextValue, { source: detail && detail.source || 'api', reason: 'page-size', originalEvent: detail && detail.originalEvent ? detail.originalEvent : null });
      } finally {
        limitSelectChangeDepth = Math.max(0, limitSelectChangeDepth - 1);
      }
    };
    var customFactory = opts.components && opts.components.sizeChanger;
    if (Utils.isFunction(customFactory)) {
      limitSelect = customFactory(Object.freeze({ container: mount, value: String(snapshot.pageSize), items: items.slice(), disabled: isDisabled(), size: sizeName(), onChange: onSizeChange, pagination: api }));
      if (limitSelect && limitSelect.nodeType === 1 && limitSelect.parentNode !== mount) mount.appendChild(limitSelect);
      if (!limitSelect) throw new TypeError('[QXFRAME9A7C2] Pagination components.sizeChanger factory must return a controller or Element.');
      return;
    }
    var selectOptions = opts.showSizeChanger && typeof opts.showSizeChanger === 'object' ? Object.assign({}, opts.showSizeChanger) : {};
    ['container','value','items','onChange','multiple','creatable'].forEach(function (key) { delete selectOptions[key]; });
    limitSelect = Select.create(Object.assign({}, selectOptions, {
      container: mount,
      value: String(snapshot.pageSize),
      items: items,
      searchable: false,
      clearable: false,
      disabled: isDisabled(),
      size: sizeName(),
      matchReferenceWidth: true,
      onChange: onSizeChange
    }));
  }
    
  function renderJumper(fragment, snapshot) {
    var wrap = doc.createElement('label');
    wrap.className = 'qxframe9a7c2-pagination-skip';
    wrap.appendChild(doc.createTextNode('跳至'));
    var input = doc.createElement('input');
    input.className = 'qxframe9a7c2-pagination-input';
    input.type = 'text';
    DOM.configureTextInput(input, { mode: 'numeric', inputMode: 'numeric', enterKeyHint: 'go' });
    input.value = jumperDraft;
    input.disabled = isDisabled();
    DOM.setPrivate(input, 'paginationRole', 'jumper');
    wrap.appendChild(input);
    wrap.appendChild(doc.createTextNode('页'));
    fragment.appendChild(wrap);
  }
    
  function render(reason) {
    if (destroyed || !mounted || !root) return false;
    var snapshot = model.snapshot();
    var hidden = opts.hideOnSinglePage === true && snapshot.pageCount <= 1;
    destroyLimitSelect('pagination-rerender');
    root.hidden = hidden;
    syncRootClasses();
    root.classList.toggle('is-disabled', isDisabled());
    root.classList.toggle('is-background', opts.background === true);
    root.textContent = '';
    if (!hidden) {
      var fragment = doc.createDocumentFragment();
      var views = Object.create(null);
      views.count = function () { renderTotal(fragment, snapshot); };
      views.text = function () { renderText(fragment, snapshot); };
      views.prev = function () {
        if (opts.prev === false || opts.prev === '') return;
        fragment.appendChild(createControl(
          'qxframe9a7c2-pagination-item is-prev',
          snapshot.page - 1,
          contentFor(opts.prev, iconNode('caret-left'), { state: snapshot, direction: 'previous', controller: api }),
          !snapshot.hasPrevious,
          'previous'));
      };
      views.next = function () {
        if (opts.next === false || opts.next === '') return;
        fragment.appendChild(createControl(
          'qxframe9a7c2-pagination-item is-next',
          snapshot.page + 1,
          contentFor(opts.next, iconNode('caret-right'), { state: snapshot, direction: 'next', controller: api }),
          !snapshot.hasNext,
          'next'));
      };
      views.page = function () { renderPageGroup(fragment, snapshot); };
      views.limit = function () { renderSizeChanger(fragment, snapshot); };
      views.skip = function () { renderJumper(fragment, snapshot); };
      views.refresh = function () {
        fragment.appendChild(createControl('qxframe9a7c2-pagination-refresh', snapshot.page, iconNode('sync'), false, 'refresh'));
      };
      normalizeLayout(opts).forEach(function (key) { if (views[key]) views[key](); });
      root.appendChild(fragment);
    }
    renderCount += 1;
    var detail = { reason: reason || 'render', state: state(), controller: api };
    if (Utils.isFunction(opts.onRender)) opts.onRender(detail);
    emitter.emit('render', detail);
    return true;
  }
    
  function requestRender(reason) {
    if (destroyed || !mounted) return false;
    if (limitSelectChangeDepth > 0) return viewScheduler.request(reason || 'deferred-child-change');
    return render(reason || 'render');
  }
    
  function emitChange(modelDetail) {
    var snapshot = model.snapshot();
    var detail = {
      current: snapshot.page,
      pageSize: snapshot.pageSize,
      count: snapshot.total,
      pageCount: snapshot.pageCount,
      reason: modelDetail && modelDetail.reason ? modelDetail.reason : 'change',
      source: modelDetail && modelDetail.source ? modelDetail.source : 'api',
      originalEvent: modelDetail && modelDetail.originalEvent ? modelDetail.originalEvent : null,
      previousState: modelDetail && modelDetail.previousState ? modelDetail.previousState : null,
      recommendPage: modelDetail && modelDetail.recommendPage ? modelDetail.recommendPage : null,
      state: state(),
      controller: api
    };
    if (Utils.isFunction(opts.jump)) opts.jump(detail.state, false);
    if (Utils.isFunction(opts.onChange)) opts.onChange(snapshot.page, snapshot.pageSize, detail);
    emitter.emit('change', detail);
    return detail;
  }
    
  function setCurrent(next, meta) {
    if (destroyed) return false;
    return model.setPage(next, mergeOptions({ source: 'api', reason: 'current' }, meta));
  }
    
  function setPageSize(next, meta) {
    if (destroyed) return false;
    var previous = model.snapshot();
    var previousSize = previous.pageSize;
    var normalizedSize = positiveInt(next, previousSize);
    var recommendPage = previous.pageCount > 0
      ? Math.floor(previous.startIndex / normalizedSize) + 1
      : 1;
    var changed = model.setPageSize(normalizedSize, mergeOptions({ source: 'api', reason: 'page-size' }, meta));
    if (changed && model.pageSize !== previousSize && Utils.isFunction(opts.onSizeChange)) {
      var snapshot = model.snapshot();
      opts.onSizeChange(snapshot.pageSize, {
        current: snapshot.page,
        pageSize: snapshot.pageSize,
        count: snapshot.total,
        pageCount: snapshot.pageCount,
        reason: 'size-change',
        source: meta && meta.source ? meta.source : 'api',
        originalEvent: meta && meta.originalEvent ? meta.originalEvent : null,
        recommendPage: recommendPage,
        controller: api
      });
    }
    return changed;
  }
    
  function commitJumper(input, event) {
    if (!input || isDisabled()) return false;
    var page = positiveInt(jumperDraft, model.page);
    if (model.pageCount <= 0) page = 1;
    else page = Math.max(1, Math.min(model.pageCount, page));
    jumperDraft = String(model.pageCount > 0 ? page : 1);
    input.value = jumperDraft;
    if (page === model.page) return false;
    var source = event && String(event.type || '').indexOf('key') === 0 ? 'keyboard' : 'input';
    return setCurrent(page, { source: source, reason: 'jumper', originalEvent: event || null });
  }
    
  function installDelegation() {
    delegation = EventDelegation.create({ root: root });
    scope.add(function () { delegation.destroy(); });
    
    delegation.on('click', DOM.privateMatcher('paginationPage'), function (detail) {
      var button = detail.target;
      if (button.disabled || isDisabled()) return;
      var page = positiveInt(DOM.getPrivate(button, 'paginationPage'), model.page);
      var role = DOM.getPrivate(button, 'paginationRole') || 'page';
      var source = DOM.activationSource(detail.event);
      if (role === 'refresh') {
        requestRender('refresh-action');
        emitter.emit('refresh', { state: state(), source: source, reason: 'refresh', originalEvent: detail.event, controller: api });
        return;
      }
      if (role === 'previous' && Utils.isFunction(opts.onPrevClick)) {
        opts.onPrevClick(model.page, { current: model.page, target: page, source: source, reason: 'previous', originalEvent: detail.event, controller: api });
      }
      if (role === 'next' && Utils.isFunction(opts.onNextClick)) {
        opts.onNextClick(model.page, { current: model.page, target: page, source: source, reason: 'next', originalEvent: detail.event, controller: api });
      }
      setCurrent(page, { source: source, reason: role, originalEvent: detail.event });
    });
    
    
    delegation.on('input', DOM.privateMatcher('paginationRole', 'jumper'), function (detail) {
      var raw = String(detail.target.value || '');
      if (raw === '') {
        jumperDraft = '';
        return;
      }
      if (!/^\d+$/.test(raw)) {
        detail.target.value = jumperDraft;
        return;
      }
      var numeric = Math.floor(Number(raw));
      var page = Number.isFinite(numeric) ? numeric : model.page;
      if (model.pageCount > 0) page = Math.max(1, Math.min(model.pageCount, page));
      else page = 1;
      jumperDraft = String(page);
      detail.target.value = jumperDraft;
    });
    
    delegation.on('focusout', DOM.privateMatcher('paginationRole', 'jumper'), function (detail) {
      commitJumper(detail.target, detail.event);
    });
  }
    
    
  function isJumperTarget(target) {
    return !!(target && DOM.getPrivate(target, 'paginationRole') === 'jumper');
  }
    
  function handleJumperKey(detail) {
    var event = detail && detail.originalEvent;
    var target = detail && detail.target;
    if (!event || !isJumperTarget(target) || isDisabled()) return false;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      var delta = event.key === 'ArrowUp' ? -1 : 1;
      var base = positiveInt(jumperDraft, model.page);
      setCurrent(base + delta, { source: 'keyboard', reason: 'jumper-' + event.key.toLowerCase(), originalEvent: event });
      return true;
    }
    if (event.key === 'Enter') {
      commitJumper(target, event);
      return true;
    }
    return false;
  }
    
  function installKeyboard() {
    keyboard = KeyboardNavigation.create({
      root: root,
      editableKeys: ['ArrowUp', 'ArrowDown', 'Enter'],
      handlers: {
        ArrowUp: handleJumperKey,
        ArrowDown: handleJumperKey,
        Enter: handleJumperKey
      }
    });
    scope.add(function () { keyboard.destroy(); });
  }
    
  function mount(target) {
    if (destroyed) return api;
    if (mounted) return api;
    if (!doc || !Utils.isFunction(doc.createElement)) {
      throw new Error('[QXFRAME9A7C2] Pagination requires a browser DOM to mount.');
    }
    host = target || opts.container;
    if (!host && opts.elements == null) {
      throw new TypeError('[QXFRAME9A7C2] Pagination mount container must be a DOM element unless options.elements supplies existing DOM.');
    }
    if (host && !Utils.isFunction(host.appendChild)) throw new TypeError('[QXFRAME9A7C2] Pagination mount container must be a DOM element.');
    domBinding = DOMBinding.resolve({
      options: opts,
      target: host,
      component: api,
      requiredRefs: ['root'],
      defaultFactory: DOMFactory.createDefaultDOM
    });
    root = domBinding.refs.root;
    syncRootClasses();
    mounted = true;
    installDelegation();
    installKeyboard();
    render('mount');
    if (Utils.isFunction(opts.jump)) opts.jump(state(), true);
    return api;
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    ComponentContracts.validate(ComponentContracts.get('Pagination'), nextOptions, 'Pagination');
    var next = mergeOptions({}, nextOptions);
    if (own(next, 'container') && next.container !== opts.container) throw new TypeError('[QXFRAME9A7C2] Pagination container is immutable after create.');
    if (own(next, 'elements') && next.elements !== opts.elements) throw new TypeError('[QXFRAME9A7C2] Pagination elements are immutable after create.');
    if (own(next, 'size')) next.size = validateSize(next.size);
    if (own(next, 'simple') && typeof next.simple !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Pagination simple must be boolean.');
    if (own(next, 'responsive') && typeof next.responsive !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Pagination responsive must be boolean.');
    if (own(next, 'itemRender') && next.itemRender !== null && next.itemRender !== undefined && !Utils.isFunction(next.itemRender)) throw new TypeError('[QXFRAME9A7C2] Pagination itemRender must be a function or null.');
    if (own(next, 'showSizeChanger') && typeof next.showSizeChanger !== 'boolean' && (!next.showSizeChanger || typeof next.showSizeChanger !== 'object' || Array.isArray(next.showSizeChanger))) throw new TypeError('[QXFRAME9A7C2] Pagination showSizeChanger must be boolean or a Select options object.');
    if (own(next, 'components') && next.components !== null && next.components !== undefined && (!next.components || typeof next.components !== 'object' || Array.isArray(next.components))) throw new TypeError('[QXFRAME9A7C2] Pagination components must be an object or null.');
    if (own(next, 'components') && next.components && next.components.sizeChanger !== undefined && !Utils.isFunction(next.components.sizeChanger)) throw new TypeError('[QXFRAME9A7C2] Pagination components.sizeChanger must be a factory function.');
    if (own(next, 'layout') || own(next, 'simple')) normalizeLayout(mergeOptions(opts, next));
    opts = mergeOptions(opts, next);
    var modelOptions = {};
    if (own(next, 'current')) modelOptions.page = positiveInt(next.current, model.page);
    if (own(next, 'pageSize')) modelOptions.pageSize = positiveInt(next.pageSize, model.pageSize);
    if (own(next, 'count')) modelOptions.total = nonNegativeInt(next.count);
    if (own(next, 'pagerCount')) modelOptions.pagerCount = Math.max(3, positiveInt(next.pagerCount, model.pagerCount));
    if (own(next, 'first')) modelOptions.first = next.first !== false;
    if (own(next, 'last')) modelOptions.last = next.last !== false;
    if (own(next, 'ellipsis')) modelOptions.ellipsis = next.ellipsis !== false;
    if (own(next, 'ellipsisJump')) modelOptions.ellipsisJump = next.ellipsisJump;
    model.updateOptions(modelOptions);
    if (own(next, 'current') || own(next, 'pageSize') || own(next, 'count')) jumperDraft = String(model.page);
    if (mounted) requestRender('options');
    if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    return api;
  }
    
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    destroyLimitSelect('pagination-destroy');
    scope.dispose();
    delegation = null;
    keyboard = null;
    model.destroy();
    emitter.dispose();
    if (domBinding) domBinding.release();
    domBinding = null;
    root = null;
    host = null;
    mounted = false;
    return true;
  }
    
  scope.add(model.on('change', function (detail) {
    if (destroyed) return;
    jumperDraft = String(model.page);
    if (mounted) requestRender(detail && detail.reason ? detail.reason : 'model-change');
    emitChange(detail);
  }));
    
  api = {
    mount: mount,
    render: function () { return requestRender('api'); },
    setCurrent: setCurrent,
    setPageSize: setPageSize,
    prev: function (meta) { return model.previous(mergeOptions({ source: 'api', reason: 'prev' }, meta)); },
    next: function (meta) { return model.next(mergeOptions({ source: 'api', reason: 'next' }, meta)); },
    refresh: function () { if (mounted) requestRender('refresh'); return api; },
    updateOptions: updateOptions,
    getState: state,
    getModel: function () { return model; },
    getItems: function () { return model.deriveItems(); },
    getEventDelegation: function () { return delegation; },
    getKeyboardNavigation: function () { return keyboard; },
    getSizeChanger: function () { return limitSelect; },
    getRootElement: function () { return root; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
    
  Object.defineProperties(api, {
    current: { enumerable: true, get: function () { return model.page; } },
    pageSize: { enumerable: true, get: function () { return model.pageSize; } },
    pageCount: { enumerable: true, get: function () { return model.pageCount; } },
    total: { enumerable: true, get: function () { return model.total; } },
    mounted: { enumerable: true, get: function () { return mounted; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });
    
  if (opts.container || opts.elements) mount(opts.container || null);
  return api;
}

export const Pagination = Object.freeze({
    definition: Object.freeze({ initializer: Object.freeze({ mode: 'create', bind: 'container' }) }),
    create,
    createDefaultDOM: DOMFactory.createDefaultDOM
});
export { create, createDefaultDOM };
export default Pagination;
