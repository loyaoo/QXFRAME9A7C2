(function (global, document) {
  'use strict';

  var PREFIX = 'qxframe9a7c2-';
  var DOCS_PREFIX = 'qxframe9a7c2-docs-';
  var SEMANTIC_ATTR = 'data-qxframe9a7c2-semantic-group';
  var STATE_ATTR = 'data-qxframe9a7c2-semantic-state';
  var WITHIN_ATTR = 'data-qxframe9a7c2-semantic-within';
  var STATE_STYLE_ID = 'qxframe9a7c2-semantic-state-mirror';
  var STATE_SCOPE = '#semantic-dom [data-semantic-canvas]';
  var STATIC_MIRROR_RULES = 0;
  var mounted = null;
  var refreshTimer = 0;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function isElement(value) { return !!(value && value.nodeType === 1); }
  function isEligibleElement(value) {
    if (!isElement(value)) return false;
    if (value === document.documentElement || value === document.head || value === document.body) return false;
    if (value.id === 'qxframe9a7c2-docs-app') return false;
    if (value.classList && Array.prototype.some.call(value.classList, function (name) { return String(name).indexOf(DOCS_PREFIX) === 0; })) return false;
    return true;
  }
  function nodeCount(element) { return isElement(element) ? 1 + element.querySelectorAll('*').length : 0; }
  function qxClasses(element) {
    if (!isElement(element) || !element.classList) return [];
    return Array.prototype.filter.call(element.classList, function (name) {
      return name.indexOf(PREFIX) === 0 && name.indexOf(DOCS_PREFIX) !== 0 && name.indexOf('qxframe9a7c2-semantic-') !== 0;
    });
  }
  function primaryClass(element, meta) {
    var classes = qxClasses(element);
    if (!classes.length) return '';
    var slug = meta && meta.slug ? PREFIX + meta.slug : '';
    classes.sort(function (a, b) {
      var as = slug && (a === slug || a.indexOf(slug + '-') === 0) ? 1000 : 0;
      var bs = slug && (b === slug || b.indexOf(slug + '-') === 0) ? 1000 : 0;
      return (bs + b.length) - (as + a.length);
    });
    return classes[0];
  }
  function shortClass(name) { return String(name || '').indexOf(PREFIX) === 0 ? String(name).slice(PREFIX.length) : String(name || ''); }
  function camel(value) {
    return String(value || '').replace(/-([a-z0-9])/g, function (_, ch) { return ch.toUpperCase(); }).replace(/[^A-Za-z0-9_.-]+/g, '');
  }

  function collectReturned(value, label, output, seen, depth) {
    if (depth > 3 || value == null) return;
    if (isElement(value)) {
      if (isEligibleElement(value) && !seen.has(value)) { seen.add(value); output.push({ element: value, label: label || 'root' }); }
      return;
    }
    if (Array.isArray(value)) {
      value.slice(0, 40).forEach(function (entry, index) { collectReturned(entry, label + '.' + index, output, seen, depth + 1); });
      return;
    }
    if (typeof value !== 'object') return;
    if (typeof value.getRootElement === 'function') {
      try { collectReturned(value.getRootElement(), label, output, seen, depth + 1); } catch (_) {}
    }
    Object.keys(value).slice(0, 80).forEach(function (key) {
      var entry;
      try { entry = value[key]; } catch (_) { return; }
      if (isElement(entry) || Array.isArray(entry) || (entry && typeof entry === 'object' && depth < 2)) collectReturned(entry, label + '.' + key, output, seen, depth + 1);
    });
  }

  function getterLabel(name) {
    var raw = String(name || '').replace(/^get/, '').replace(/Element$/, '');
    var key = raw ? raw.charAt(0).toLowerCase() + raw.slice(1) : 'root';
    if (key === 'root') return 'root';
    if (key === 'popup') return 'popup.root';
    if (key === 'preview') return 'preview.root';
    if (key === 'frame') return 'stack.root';
    if (key === 'dialog') return 'dialog.root';
    if (key === 'panel') return 'panel.root';
    if (key === 'mask') return 'mask';
    return key;
  }

  function collectInstance(record) {
    var instance = record && record.instance;
    if (!instance || typeof instance !== 'object') return [];
    var output = [], seen = new Set();
    Object.keys(instance).forEach(function (key) {
      if (!(key === 'getElement' || /^get[A-Z].*Element$/.test(key)) || typeof instance[key] !== 'function') return;
      try { collectReturned(instance[key](), getterLabel(key), output, seen, 0); } catch (_) {}
    });
    ['getRefs', 'getElements'].forEach(function (key) {
      if (typeof instance[key] !== 'function') return;
      try { collectReturned(instance[key](), 'refs', output, seen, 0); } catch (_) {}
    });
    if (isElement(instance.element)) collectReturned(instance.element, 'root', output, seen, 0);
    return pruneFragments(output);
  }

  function labelPriority(label) {
    if (label === 'root') return 100;
    if (/^(popup|preview|stack|dialog|panel)\.root$/.test(label)) return 90;
    if (label === 'mask') return 10;
    return 40;
  }

  function pruneFragments(items) {
    var unique = [], seen = new Set();
    items.forEach(function (item) {
      if (!isElement(item.element) || seen.has(item.element)) return;
      seen.add(item.element); unique.push(item);
    });
    unique.sort(function (a, b) { return labelPriority(b.label) - labelPriority(a.label); });
    return unique.filter(function (item, index) {
      for (var i = 0; i < unique.length; i += 1) {
        if (i === index) continue;
        var other = unique[i];
        if (other.element.contains(item.element) && nodeCount(other.element) > nodeCount(item.element)) return false;
      }
      return true;
    }).slice(0, 8);
  }

  function stateOpen(instance) {
    if (!instance || typeof instance.getState !== 'function') return false;
    try {
      var state = instance.getState() || {};
      return state.open === true || state.visible === true || state.previewOpen === true || state.active === true;
    } catch (_) { return false; }
  }

  function activateForSnapshot(instance) {
    if (!instance || typeof instance !== 'object' || stateOpen(instance)) return function () {};
    var close = null;
    try {
      if (typeof instance.openPreview === 'function') {
        instance.openPreview('semantic-dom');
        if (typeof instance.closePreview === 'function') close = function () { instance.closePreview('semantic-dom-capture'); };
      } else if (typeof instance.open === 'function') {
        instance.open('semantic-dom');
        if (typeof instance.close === 'function') close = function () { instance.close('semantic-dom-capture'); };
      } else if (typeof instance.setOpen === 'function') {
        instance.setOpen(true, 'semantic-dom');
        close = function () { instance.setOpen(false, 'semantic-dom-capture'); };
      }
    } catch (_) {}
    return function () { if (close) { try { close(); } catch (_) {} } };
  }

  function detachedFragments(items) {
    return items.map(function (item) { return { element: item.element.cloneNode(true), label: item.label }; });
  }

  function instanceCandidate(records) {
    var best = null;
    (records || []).forEach(function (record) {
      var instance = record && record.instance;
      if (!instance || typeof instance !== 'object') return;
      var restore = activateForSnapshot(instance);
      var fragments = collectInstance(record);
      var detached = detachedFragments(fragments);
      restore();
      if (!detached.length) return;
      var score = detached.reduce(function (sum, item) {
        var bonus = /popup|preview|dialog|panel|stack/.test(item.label) ? 160 : 0;
        if (fragmentKind(item) === 'overlay') bonus += 420;
        return sum + Math.min(600, nodeCount(item.element)) + bonus;
      }, 0);
      if (!best || score > best.score) best = { score: score, label: record.label || 'instance', fragments: detached, source: 'runtime instance · full-state snapshot' };
    });
    return best;
  }

  function componentRoots(mount) {
    if (!isElement(mount)) return [];
    var all = Array.prototype.filter.call(mount.querySelectorAll('*'), function (el) { return qxClasses(el).length > 0; });
    var roots = all.filter(function (el) {
      var parent = el.parentElement;
      while (parent && parent !== mount) {
        if (qxClasses(parent).length) return false;
        parent = parent.parentElement;
      }
      return true;
    });
    return roots.length ? roots : Array.prototype.slice.call(mount.children);
  }

  function demoCandidate(grid) {
    var best = null;
    Array.prototype.forEach.call(grid ? grid.querySelectorAll('.qxframe9a7c2-docs-demo-card') : [], function (card) {
      var mount = card.querySelector('.qxframe9a7c2-docs-demo-mount');
      var roots = componentRoots(mount);
      var score = roots.reduce(function (sum, el) { return sum + Math.min(600, nodeCount(el)); }, 0);
      if (!score) return;
      var title = card.querySelector('.qxframe9a7c2-docs-demo-title span');
      if (!best || score > best.score) best = { score: score, label: title ? title.textContent : 'canonical demo', fragments: roots.map(function (el, index) { return { element: el, label: index === 0 ? 'root' : 'root.' + (index + 1) }; }), source: 'canonical demo DOM' };
    });
    return best;
  }

  function specialServiceCandidate(meta, api) {
    if (!api || !meta) return null;
    var handle = null, element = null, label = '';
    try {
      if (meta.name === 'Message' && typeof api.info === 'function') {
        handle = api.info('Semantic DOM · persistent message', { duration: 0, showProgress: true });
        if (handle && typeof handle.getStackElement === 'function') element = handle.getStackElement();
        if (!element && typeof api.getFrameElement === 'function') element = api.getFrameElement('top');
        label = 'message stack · forced visible';
      } else if (meta.name === 'Notification' && typeof api.info === 'function') {
        handle = api.info({ title: 'Semantic DOM notification', content: 'Persistent notification body for style inspection.', duration: 0, showProgress: true, actions: [{ label: 'Inspect' }] });
        if (handle && typeof handle.getStackElement === 'function') element = handle.getStackElement();
        if (!element && typeof api.getFrameElement === 'function') element = api.getFrameElement('top-right');
        label = 'notification stack · forced visible';
      }
      if (isElement(element)) return { score: nodeCount(element) + 500, label: label, fragments: [{ element: element, label: 'stack.root' }], source: 'service fixture', cleanup: function () { try { if (handle && typeof handle.close === 'function') handle.close('semantic-capture'); } catch (_) {} try { if (typeof api.closeAll === 'function') api.closeAll(); } catch (_) {} } };
    } catch (_) {}
    try { if (handle && typeof handle.close === 'function') handle.close('semantic-capture-failed'); } catch (_) {}
    return null;
  }

  function chooseCandidate(context) {
    var candidates = [];
    var runtime = instanceCandidate(context.getInstances ? context.getInstances() : []);
    if (runtime) candidates.push(runtime);
    var demo = demoCandidate(context.grid);
    if (demo) candidates.push(demo);
    var special = specialServiceCandidate(context.meta, context.getAPI ? context.getAPI() : null);
    if (special) candidates.push(special);
    candidates.sort(function (a, b) { return b.score - a.score; });
    var chosen = candidates[0] || null;
    if (special && chosen !== special && typeof special.cleanup === 'function') special.cleanup();
    return chosen;
  }

  function fragmentKind(item) {
    var label = String(item.label || 'root');
    var cls = qxClasses(item.element).join(' ');
    if (/popup|preview|dialog|panel|stack|mask/.test(label) || /(?:popup|tooltip|popover|modal|drawer|notice-frame|loading-root|image-preview)/.test(cls)) return 'overlay';
    return 'root';
  }

  function normalizeCloneIds(root) {
    Array.prototype.forEach.call([root].concat(Array.prototype.slice.call(root.querySelectorAll('[id]'))), function (el, index) {
      if (!isElement(el) || !el.id) return;
      el.setAttribute('data-qxframe9a7c2-semantic-original-id', el.id);
      el.removeAttribute('id');
    });
  }

  function forceFragmentVisible(root, kind) {
    if (!isElement(root)) return;
    root.hidden = false;
    root.removeAttribute('hidden');
    root.removeAttribute('inert');
    
    root.classList.add('qxframe9a7c2-semantic-force-visible');
    if (kind === 'overlay') root.classList.add('qxframe9a7c2-semantic-force-overlay');
    if (root.style) {
      if (root.style.display === 'none') root.style.removeProperty('display');
      if (root.style.visibility === 'hidden') root.style.removeProperty('visibility');
      if (root.style.opacity === '0') root.style.removeProperty('opacity');
    }
  }


  function splitSelectorList(text) {
    var result = [], start = 0, round = 0, square = 0, quote = '';
    String(text || '').split('').forEach(function (ch, index) {
      if (quote) {
        if (ch === quote && text.charAt(index - 1) !== '\\') quote = '';
        return;
      }
      if (ch === '"' || ch === "'") { quote = ch; return; }
      if (ch === '(') round += 1;
      else if (ch === ')') round = Math.max(0, round - 1);
      else if (ch === '[') square += 1;
      else if (ch === ']') square = Math.max(0, square - 1);
      else if (ch === ',' && !round && !square) { result.push(text.slice(start, index).trim()); start = index + 1; }
    });
    result.push(String(text || '').slice(start).trim());
    return result.filter(Boolean);
  }

  function mirrorSelector(selector) {
    var source = String(selector || '');
    if (source.indexOf(PREFIX) < 0 || source.indexOf(DOCS_PREFIX) >= 0 || source.indexOf('qxframe9a7c2-semantic-') >= 0) return '';
    if (!/:(?:hover|active|focus(?:-visible|-within)?)(?![-\w])/.test(source)) return '';
    var mirrored = source
      .replace(/:focus-visible(?![-\w])/g, '[' + STATE_ATTR + '~="focus-visible"]')
      .replace(/:focus-within(?![-\w])/g, '[' + WITHIN_ATTR + '~="focus"]')
      .replace(/:focus(?![-\w])/g, '[' + STATE_ATTR + '~="focus"]')
      .replace(/:hover(?![-\w])/g, '[' + STATE_ATTR + '~="hover"]')
      .replace(/:active(?![-\w])/g, '[' + STATE_ATTR + '~="active"]');
    return mirrored === source ? '' : STATE_SCOPE + ' ' + mirrored;
  }

  function mirrorCssRule(rule, tally) {
    if (!rule) return '';
    if (typeof rule.selectorText === 'string' && rule.style) {
      var selectors = splitSelectorList(rule.selectorText).map(mirrorSelector).filter(Boolean);
      if (!selectors.length) return '';
      tally.count += selectors.length;
      return selectors.map(function (selector) { return selector + '{' + rule.style.cssText + '}'; }).join('\n');
    }
    var children;
    try { children = rule.cssRules; } catch (_) { children = null; }
    if (!children || !children.length) return '';
    var headerText = String(rule.cssText || '');
    var brace = headerText.indexOf('{');
    var header = brace >= 0 ? headerText.slice(0, brace).trim() : '';
    if (!header || /^@(?:-webkit-)?keyframes\b/i.test(header)) return '';
    var inner = '';
    Array.prototype.forEach.call(children, function (child) { inner += mirrorCssRule(child, tally); });
    if (!inner) return '';
    /* Docs state projection must outrank the production cascade without changing production layers. */
    if (/^@layer\b/i.test(header)) return inner;
    return header + '{' + inner + '}';
  }

  function ensureStateMirror(force) {
    var current = document.getElementById(STATE_STYLE_ID);
    if (current && !force) return Number(current.getAttribute('data-rule-count') || 0);
    if (current) current.remove();
    var tally = { count: 0 }, css = '';
    Array.prototype.forEach.call(document.styleSheets || [], function (sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (_) { rules = null; }
      if (!rules || !rules.length) return;
      Array.prototype.forEach.call(rules, function (rule) { css += mirrorCssRule(rule, tally); });
    });
    var style = document.createElement('style');
    style.id = STATE_STYLE_ID;
    style.setAttribute('data-rule-count', String(tally.count));
    style.textContent = css;
    document.head.appendChild(style);
    if (!STATIC_MIRROR_RULES) {
      var section = document.getElementById('semantic-dom');
      var raw = section ? global.getComputedStyle(section).getPropertyValue('--qxframe9a7c2-semantic-static-mirror-rules') : '';
      STATIC_MIRROR_RULES = Number(String(raw || '').trim()) || 0;
    }
    return tally.count || STATIC_MIRROR_RULES;
  }

  function makeFragment(item, index) {
    var kind = fragmentKind(item);
    var wrap = document.createElement('div');
    wrap.className = 'qxframe9a7c2-semantic-fragment is-' + kind;
    var head = document.createElement('div');
    head.className = 'qxframe9a7c2-semantic-fragment-head';
    head.innerHTML = '<strong>' + esc(item.label || (index ? 'surface.' + index : 'root')) + '</strong><span>' + esc(kind === 'overlay' ? 'forced full / persistent' : 'canonical DOM snapshot') + '</span>';
    var body = document.createElement('div');
    body.className = 'qxframe9a7c2-semantic-fragment-body';
    var clone = item.element.cloneNode(true);
    normalizeCloneIds(clone);
    forceFragmentVisible(clone, kind);
    body.appendChild(clone);
    wrap.appendChild(head); wrap.appendChild(body);
    return { wrap: wrap, root: clone, label: item.label || 'root', kind: kind };
  }

  function nearestMeaningfulParent(el, boundary, meta) {
    var p = el.parentElement;
    while (p && p !== boundary.parentElement) {
      if (primaryClass(p, meta)) return p;
      if (p === boundary) break;
      p = p.parentElement;
    }
    return null;
  }

  function semanticKey(el, fragment, meta, cache) {
    if (cache.has(el)) return cache.get(el);
    if (el === fragment.root) { cache.set(el, fragment.label || 'root'); return cache.get(el); }
    var pc = primaryClass(el, meta), parent = nearestMeaningfulParent(el, fragment.root, meta), parentKey = parent ? semanticKey(parent, fragment, meta, cache) : (fragment.label || 'root');
    if (pc) {
      var short = shortClass(pc), parentClass = parent ? shortClass(primaryClass(parent, meta)) : '';
      var suffix = short;
      if (parentClass && short.indexOf(parentClass + '-') === 0) suffix = short.slice(parentClass.length + 1);
      else if (meta && meta.slug && short.indexOf(meta.slug + '-') === 0) suffix = short.slice(meta.slug.length + 1);
      else if (short === (meta && meta.slug)) suffix = 'root';
      if (suffix === 'root' && parentKey === 'root') { cache.set(el, 'root'); return 'root'; }
      var key = parentKey + '.' + camel(suffix || short);
      key = key.replace(/\.root\.root/g, '.root').replace(/^root\.root$/, 'root');
      cache.set(el, key); return key;
    }
    var role = el.getAttribute && el.getAttribute('role');
    var token = String(el.tagName || 'node').toLowerCase();
    var fallback = parentKey + '.' + camel(token);
    cache.set(el, fallback); return fallback;
  }

  var TERM = {
    root: '根元素 / visual owner', input: '输入元素', prefix: '前缀区域', suffix: '后缀区域', popup: '弹层', panel: '面板', header: '头部', body: '主体内容', footer: '底部操作区', item: '条目 / option', cell: '单元格', label: '文本标签', icon: '图标', clear: '清空操作', toggle: '展开/切换操作', arrow: '箭头', mask: '遮罩', viewport: '可滚动视口', content: '内容区域', track: '轨道', rail: '底轨', thumb: '拖拽手柄', list: '列表', tree: '树结构', title: '标题', description: '描述', actions: '操作区', toolbar: '工具栏', indicator: '状态指示', control: '交互控制面', value: '值投影', tag: '标签', option: '选项', calendar: '日历面板', timePanel: '时间面板', colorPanel: '颜色面板', preview: '预览层', stack: '堆叠容器', dialog: '对话框'
  };

  function descriptionFor(key, el, count) {
    var pieces = String(key || '').split('.'), last = pieces[pieces.length - 1], term = TERM[last] || TERM[camel(last)] || '真实组件 DOM 节点';
    var tag = String(el.tagName || '').toLowerCase();
    return term + ' · <' + tag + '>' + (count > 1 ? ' · ×' + count : '');
  }

  function selectorFor(el, meta) {
    var pc = primaryClass(el, meta);
    if (pc) return '.' + pc;
    var type = el.getAttribute('type');
    if (type) return String(el.tagName || '').toLowerCase() + '[type="' + type + '"]';
    return String(el.tagName || 'node').toLowerCase();
  }

  function buildGroups(fragments, meta) {
    var groups = new Map(), sequence = 0;
    fragments.forEach(function (fragment) {
      var cache = new Map();
      var nodes = [fragment.root].concat(Array.prototype.slice.call(fragment.root.querySelectorAll('*')));
      nodes.forEach(function (el) {
        if (!isElement(el)) return;
        var key = semanticKey(el, fragment, meta, cache);
        var selector = selectorFor(el, meta);
        var role = el.getAttribute('role') || '';
        var signature = key + '|' + selector + '|' + String(el.tagName) + '|' + role;
        var group = groups.get(signature);
        if (!group) {
          sequence += 1;
          group = { id: 's' + sequence, key: key, selector: selector, role: role, elements: [], sample: el };
          groups.set(signature, group);
        }
        group.elements.push(el);
        el.setAttribute(SEMANTIC_ATTR, group.id);
      });
    });
    return Array.from(groups.values()).sort(function (a, b) {
      var ak = a.key.split('.').length, bk = b.key.split('.').length;
      if (ak !== bk) return ak - bk;
      return a.key.localeCompare(b.key);
    });
  }

  function mountSemanticInteractions(host, groups, preview, canvas, stateRoot) {
    var groupById = new Map();
    groups.forEach(function (group) { groupById.set(group.id, group); });
    host.innerHTML = groups.map(function (group) {
      return '<div class="qxframe9a7c2-semantic-row" data-semantic-row="' + esc(group.id) + '" data-semantic-search="' + esc((group.key + ' ' + group.selector + ' ' + group.role).toLowerCase()) + '">' +
        '<span class="qxframe9a7c2-semantic-row-top"><strong>' + esc(group.key) + '</strong><span>' + group.elements.length + '</span></span>' +
        '<code>' + esc(group.selector) + '</code>' +
        '<small>' + esc(descriptionFor(group.key, group.sample, group.elements.length)) + '</small>' +
      '</div>';
    }).join('');

    var currentPeek = '';
    function setPeek(id) {
      currentPeek = id || '';
      Array.prototype.forEach.call(canvas.querySelectorAll('.is-qxframe9a7c2-semantic-peeked'), function (el) { el.classList.remove('is-qxframe9a7c2-semantic-peeked'); });
      Array.prototype.forEach.call(host.querySelectorAll('[data-semantic-row]'), function (row) { row.classList.toggle('is-peeking', !!currentPeek && row.getAttribute('data-semantic-row') === currentPeek); });
      if (!currentPeek) return;
      Array.prototype.forEach.call(canvas.querySelectorAll('[' + SEMANTIC_ATTR + '="' + currentPeek + '"]'), function (el) { el.classList.add('is-qxframe9a7c2-semantic-peeked'); });
    }
    host.addEventListener('mouseover', function (event) {
      var row = event.target.closest('[data-semantic-row]');
      if (!row || !host.contains(row)) return;
      setPeek(row.getAttribute('data-semantic-row'));
    });
    host.addEventListener('mouseout', function (event) {
      var row = event.target.closest('[data-semantic-row]');
      if (!row || !host.contains(row)) return;
      var related = event.relatedTarget;
      if (related && row.contains(related)) return;
      setPeek('');
    });
    host.addEventListener('mouseleave', function () { setPeek(''); });

    var target = null, state = 'normal';
    var targetLabel = stateRoot.querySelector('[data-semantic-target]');
    var stateButtons = Array.prototype.slice.call(stateRoot.querySelectorAll('[data-semantic-state-button]'));
    function allSemanticNodes() { return Array.prototype.slice.call(canvas.querySelectorAll('[' + SEMANTIC_ATTR + ']')); }
    function clearProjectedState() {
      Array.prototype.forEach.call(canvas.querySelectorAll('[' + STATE_ATTR + '],[' + WITHIN_ATTR + ']'), function (el) {
        el.removeAttribute(STATE_ATTR); el.removeAttribute(WITHIN_ATTR);
      });
    }
    function meaningfulAncestors(el) {
      var result = [], node = el;
      while (isElement(node) && canvas.contains(node)) {
        if (node.hasAttribute(SEMANTIC_ATTR)) result.push(node);
        if (node.classList && node.classList.contains('qxframe9a7c2-semantic-fragment-body')) break;
        node = node.parentElement;
      }
      return result;
    }
    function updateTargetLabel() {
      if (!target) {
        targetLabel.innerHTML = '<span>Target</span><strong>全部可状态节点</strong><code>Global preview · 点击左侧 DOM 可锁定单个节点</code>';
        return;
      }
      var group = groupById.get(target.getAttribute(SEMANTIC_ATTR));
      var key = group ? group.key : String(target.tagName || 'node').toLowerCase();
      var selector = group ? group.selector : selectorFor(target, null);
      targetLabel.innerHTML = '<span>Target</span><strong>' + esc(key) + '</strong><code>' + esc(selector) + '</code>';
    }
    function applyGlobalState() {
      var nodes = allSemanticNodes();
      if (state === 'hover') nodes.forEach(function (el) { el.setAttribute(STATE_ATTR, 'hover'); });
      else if (state === 'active') nodes.forEach(function (el) { el.setAttribute(STATE_ATTR, 'active'); });
      else if (state === 'focus') nodes.forEach(function (el) { el.setAttribute(STATE_ATTR, 'focus'); el.setAttribute(WITHIN_ATTR, 'focus'); });
      else if (state === 'focus-visible') nodes.forEach(function (el) { el.setAttribute(STATE_ATTR, 'focus focus-visible'); el.setAttribute(WITHIN_ATTR, 'focus'); });
    }
    function projectState() {
      clearProjectedState();
      stateButtons.forEach(function (button) { button.classList.toggle('is-active', button.getAttribute('data-semantic-state-button') === state); });
      stateRoot.setAttribute('data-current-semantic-state', state);
      stateRoot.setAttribute('data-semantic-state-scope', target ? 'target' : 'global');
      if (state === 'normal') { updateTargetLabel(); return; }
      if (!target) { applyGlobalState(); updateTargetLabel(); return; }
      var chain = meaningfulAncestors(target);
      if (state === 'hover' || state === 'active') chain.forEach(function (el) { el.setAttribute(STATE_ATTR, state); });
      else if (state === 'focus') {
        target.setAttribute(STATE_ATTR, 'focus');
        chain.forEach(function (el) { el.setAttribute(WITHIN_ATTR, 'focus'); });
      } else if (state === 'focus-visible') {
        target.setAttribute(STATE_ATTR, 'focus focus-visible');
        chain.forEach(function (el) { el.setAttribute(WITHIN_ATTR, 'focus'); });
      }
      updateTargetLabel();
    }
    function selectTarget(el) {
      if (!isElement(el) || !canvas.contains(el) || !el.hasAttribute(SEMANTIC_ATTR)) return;
      target = el;
      projectState();
      try { document.dispatchEvent(new CustomEvent('qxframe9a7c2:semantic-state-target', { detail: { group: el.getAttribute(SEMANTIC_ATTR), state: state } })); } catch (_) {}
    }
    canvas.addEventListener('mousedown', function (event) {
      var el = event.target.closest('[' + SEMANTIC_ATTR + ']');
      if (el && canvas.contains(el)) event.preventDefault();
    }, true);
    canvas.addEventListener('click', function (event) {
      var el = event.target.closest('[' + SEMANTIC_ATTR + ']');
      if (!el || !canvas.contains(el)) return;
      event.preventDefault(); event.stopPropagation();
      selectTarget(el);
    }, true);
    stateRoot.addEventListener('click', function (event) {
      var button = event.target.closest('[data-semantic-state-button]');
      if (!button) return;
      state = button.getAttribute('data-semantic-state-button') || 'normal';
      projectState();
    });
    stateRoot.querySelector('[data-semantic-clear-target]').addEventListener('click', function () {
      target = null; projectState();
    });

    projectState();
    return {
      getTarget: function () { return target; },
      getState: function () { return state; },
      setState: function (value) { state = value || 'normal'; projectState(); },
      clearPeek: function () { setPeek(''); }
    };
  }

  function render(context) {
    if (!context || !context.meta || !context.grid || !context.demosMounted) return false;
    var main = document.querySelector('.qxframe9a7c2-docs-main');
    if (!main) return false;
    var section = document.getElementById('semantic-dom');
    if (!section) {
      section = document.createElement('section');
      section.id = 'semantic-dom';
      section.className = 'qxframe9a7c2-semantic-section';
      var api = document.getElementById('api'), runtime = document.getElementById('runtime');
      main.insertBefore(section, api || runtime || null);
    }
    section.innerHTML = '<div class="qxframe9a7c2-docs-section-head"><div><h2>Semantic DOM <span class="qxframe9a7c2-docs-release-badge is-semantic-section">v2.19.79 · FIXED</span></h2><p>真实 canonical DOM 的静态完整态。状态按钮默认对整个快照做全局 pseudo-state 预览；点击左侧节点后再锁定到单个 DOM，并可切换 Hover / Active / Focus / Focus-visible；右侧 Semantic Parts 仅在悬停时临时高亮对应 DOM，不会抢占或修改左侧状态目标。Overlay / Picker popup 始终完整展开。</p></div></div>' +
      '<div class="qxframe9a7c2-semantic-toolbar"><label><span>筛选 DOM</span><input type="search" data-semantic-filter placeholder="root / popup / input / calendar / class / role"></label><button type="button" class="qxframe9a7c2-button is-default is-outlined is-sm" data-semantic-refresh>刷新快照</button><span data-semantic-stats></span></div>' +
      '<div class="qxframe9a7c2-semantic-board"><div class="qxframe9a7c2-semantic-preview" data-semantic-preview><div class="qxframe9a7c2-semantic-state-workbench" data-semantic-state-workbench><div class="qxframe9a7c2-semantic-state-target" data-semantic-target><span>Target</span><strong>点击左侧 DOM 选择节点</strong></div><div class="qxframe9a7c2-semantic-state-controls"><button type="button" data-semantic-state-button="normal" class="is-active">Normal</button><button type="button" data-semantic-state-button="hover">Hover</button><button type="button" data-semantic-state-button="active">Active</button><button type="button" data-semantic-state-button="focus">Focus</button><button type="button" data-semantic-state-button="focus-visible">Focus-visible</button><button type="button" class="is-clear" data-semantic-clear-target>Clear target</button></div></div><div class="qxframe9a7c2-semantic-canvas" data-semantic-canvas><div class="qxframe9a7c2-semantic-empty">正在生成完整 DOM 快照…</div></div></div><div class="qxframe9a7c2-semantic-parts"><div class="qxframe9a7c2-semantic-parts-head"><strong>DOM / Semantic Parts</strong><small>悬停定位 · 不改变左侧状态</small></div><div class="qxframe9a7c2-semantic-list" data-semantic-list></div></div></div>' +
      '<details class="qxframe9a7c2-semantic-note"><summary>这个区域和普通 Live Demo 的区别</summary><p>Live Demo 保留真实交互与 Presence 生命周期；Semantic DOM 使用当前 Runtime 真实 DOM 的 clone 快照。Normal / Hover / Active / Focus / Focus-visible 默认对整个快照生效，保证按钮立即可见；左侧点击任意 canonical DOM 节点后则切换为单节点状态目标，继续投影生产 CSS 中对应 pseudo selector；右侧列表只负责像 Ant Semantic DOM 一样在悬停期间临时高亮对应节点，不会改变左侧选中目标或 pseudo-state。最外层 popup / overlay 在此强制完整展开并保持挂载。</p></details>';

    var preview = section.querySelector('[data-semantic-preview]');
    var canvas = section.querySelector('[data-semantic-canvas]');
    var stateRoot = section.querySelector('[data-semantic-state-workbench]');
    var list = section.querySelector('[data-semantic-list]');
    var stats = section.querySelector('[data-semantic-stats]');
    var candidate = chooseCandidate(context);
    if (!candidate) {
      canvas.innerHTML = '<div class="qxframe9a7c2-semantic-empty">当前页面没有可捕获的组件 DOM。</div>';
      return true;
    }

    ensureStateMirror(true);
    canvas.innerHTML = '';
    var clonedFragments = candidate.fragments.map(function (item, index) {
      var fragment = makeFragment(item, index);
      canvas.appendChild(fragment.wrap);
      return fragment;
    });
    if (typeof candidate.cleanup === 'function') candidate.cleanup();
    var groups = buildGroups(clonedFragments, context.meta);
    var interactions = mountSemanticInteractions(list, groups, preview, canvas, stateRoot);
    var totalNodes = clonedFragments.reduce(function (sum, fragment) { return sum + nodeCount(fragment.root); }, 0);
    var mirrorRules = ensureStateMirror(false);
    stats.textContent = candidate.source + ' · ' + candidate.label + ' · ' + totalNodes + ' DOM nodes · ' + groups.length + ' semantic groups · ' + mirrorRules + ' pseudo rules';

    var filter = section.querySelector('[data-semantic-filter]');
    filter.addEventListener('input', function () {
      var q = String(this.value || '').trim().toLowerCase();
      Array.prototype.forEach.call(list.querySelectorAll('[data-semantic-row]'), function (row) {
        row.hidden = !!q && String(row.getAttribute('data-semantic-search') || '').indexOf(q) < 0;
      });
    });
    section.querySelector('[data-semantic-refresh]').addEventListener('click', function () { render(context); });
    mounted = { context: context, section: section, interactions: interactions };
    try { document.dispatchEvent(new CustomEvent('qxframe9a7c2:semantic-dom-ready', { detail: { component: context.meta.name, nodes: totalNodes, groups: groups.length, source: candidate.source, label: candidate.label } })); } catch (_) {}
    return true;
  }

  function refresh() {
    global.clearTimeout(refreshTimer);
    refreshTimer = global.setTimeout(function () {
      var context = global.QXFRAME9A7C2_DOCS_PAGE_CONTEXT;
      if (!render(context)) global.setTimeout(refresh, 16);
    }, 0);
  }

  global.QXFRAME9A7C2SemanticDOM = Object.freeze({ refresh: refresh, render: function () { return render(global.QXFRAME9A7C2_DOCS_PAGE_CONTEXT); } });
  document.addEventListener('qxframe9a7c2:docs-demos-mounted', refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
})(window, document);
