(function (global, document) {
  'use strict';

  var catalog = global.QXFRAME9A7C2_DOCS_CATALOG || [];
  var app = document.getElementById('qxframe9a7c2-docs-app');
  if (!app) return;

  var shellOwners = [];
  var shell = { themeButton: null, menu: null };
  var docsTheme = global.QXFRAME9A7C2_DOCS_THEME || null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function groupCatalog() {
    var groups = [];
    catalog.forEach(function (item) {
      var group = groups.find(function (entry) { return entry.name === item.category; });
      if (!group) { group = { name: item.category, items: [] }; groups.push(group); }
      group.items.push(item);
    });
    return groups;
  }

  function qxframe9a7c2() { return global.QXFRAME9A7C2 || null; }
  function component(name) {
    var q = qxframe9a7c2();
    return q && q.Components ? q.Components[name] : null;
  }
  function ownShell(instance) {
    if (instance && typeof instance.destroy === 'function') shellOwners.push(instance);
    return instance;
  }
  function cleanupShell() {
    while (shellOwners.length) {
      var instance = shellOwners.pop();
      try { instance.destroy('docs-shell-destroy'); } catch (_) {}
    }
  }
  global.addEventListener('pagehide', cleanupShell, { once: true });

  function theme() {
    if (docsTheme) {
      var state = docsTheme.getState();
      if (state && state.mode === 'system' && typeof docsTheme.effectiveMode === 'function') return docsTheme.effectiveMode();
      if (state && (state.mode === 'dark' || state.mode === 'light')) return state.mode;
    }
    return document.documentElement.classList.contains('qxframe9a7c2-theme-dark') ? 'dark' : 'light';
  }

  function setTheme(next) {
    var dark = next === 'dark';
    if (docsTheme) docsTheme.setState({ mode: dark ? 'dark' : 'light' });
    else {
      document.documentElement.classList.toggle('qxframe9a7c2-theme-dark', dark);
      document.documentElement.classList.toggle('qxframe9a7c2-theme-light', !dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      try { localStorage.setItem('qxframe9a7c2-docs-theme', dark ? 'dark' : 'light'); } catch (_) {}
    }
    if (shell.themeButton && typeof shell.themeButton.setOptions === 'function') {
      shell.themeButton.setOptions({ text: dark ? '浅色' : '深色' });
    }
    if (shell.menu && typeof shell.menu.updateOptions === 'function') {
      shell.menu.updateOptions({ theme: dark ? 'dark' : 'light' });
    }
  }

  function initialTheme() {
    if (docsTheme) return theme();
    try { return localStorage.getItem('qxframe9a7c2-docs-theme') || theme(); } catch (_) { return theme(); }
  }

  function changeFor(meta, demoTitle) {
    var change = meta && meta.docsChange;
    if (!change) return null;
    if (demoTitle == null) return change;
    if (change.demos === '*') return change;
    if (Array.isArray(change.demos) && change.demos.indexOf(demoTitle) >= 0) return change;
    return null;
  }

  function changeBadge(change, className) {
    if (!change) return '';
    var label = [change.version, change.label].filter(Boolean).join(' · ');
    return '<span class="qxframe9a7c2-docs-release-badge' + (className ? ' ' + esc(className) : '') + '" title="' + esc(change.summary || label) + '">' + esc(label) + '</span>';
  }

  function createButton(host, text, onClick, options) {
    var state = Object.assign({ text: text, color: 'default', appearance: 'outlined', size: 'sm', shape: 'default', disabled: false }, options || {});
    var element = document.createElement(state.href ? 'a' : 'button');
    function render() {
      element.className = 'qxframe9a7c2-button is-' + state.color + ' is-' + state.appearance + ' is-' + state.size + (state.shape && state.shape !== 'default' ? ' is-' + state.shape : '') + (state.block ? ' is-block' : '') + (state.loading ? ' is-loading' : '');
      if (element.tagName === 'BUTTON') { element.type = state.nativeType || 'button'; element.disabled = !!(state.disabled || state.loading); }
      else { element.href = state.href || '#'; element.classList.toggle('is-disabled', state.disabled === true); }
      element.textContent = '';
      if (state.loading) { var spinner = document.createElement('span'); spinner.className = 'qxframe9a7c2-button-spinner'; element.appendChild(spinner); }
      var label = document.createElement('span'); label.className = 'qxframe9a7c2-button-label'; label.textContent = state.text; element.appendChild(label);
    }
    render();
    if (typeof onClick === 'function') element.addEventListener('click', function (event) { if (!state.disabled && !state.loading) onClick(event, api); });
    var api = ownShell({ element: element, setOptions: function (next) { Object.assign(state, next || {}); render(); return api; }, destroy: function () { if (element.parentNode) element.parentNode.removeChild(element); return true; } });
    if (host) host.appendChild(element);
    return api;
  }

  function createIcon(host, name, options) {
    options = Object.assign({ size: 'sm', variant: 'line', radius: 'round', strokeWidth: 3, rotate: 0, spin: false }, options || {});
    var icon = document.createElement('i');
    icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + name + ' is-' + options.variant + ' is-' + options.radius + ' is-stroke-' + options.strokeWidth + (typeof options.size === 'string' ? ' is-' + options.size : '') + (options.spin ? ' is-spin' : '');
    if (typeof options.size === 'number') icon.style.setProperty('--qxframe9a7c2-icon-size', options.size + 'px');
    icon.style.setProperty('--qxframe9a7c2-icon-rotate', Number(options.rotate || 0) + 'deg');
    
    if (host) host.appendChild(icon);
    return icon;
  }

  function topbar(home) {
    return '<header class="qxframe9a7c2-docs-topbar qxframe9a7c2-layout-header">' +
      '<a class="qxframe9a7c2-docs-brand" href="' + (home ? 'index.html' : '../index.html') + '">' +
        '<span class="qxframe9a7c2-docs-brand-mark">QXFRAME9A7C2</span><span>QXFRAME9A7C2</span><span class="qxframe9a7c2-docs-version">v2.19.79</span>' +
      '</a>' +
      (home ? '' : '<div class="qxframe9a7c2-docs-search"><span class="qxframe9a7c2-docs-search-icon" data-qxframe9a7c2-docs-search-icon></span><input type="search" data-qxframe9a7c2-docs-nav-search placeholder="搜索组件 / 功能…"></div>') +
      '<div class="qxframe9a7c2-docs-top-actions"><a class="qxframe9a7c2-button is-default is-text is-sm" href="' + (home ? 'tokens.html' : '../tokens.html') + '">Tokens</a><a class="qxframe9a7c2-button is-default is-text is-sm" href="' + (home ? 'theme-playground.html' : '../theme-playground.html') + '">Theme Playground</a><span data-qxframe9a7c2-docs-theme-host></span></div>' +
    '</header>';
  }

  function mountTopbarShell() {
    var themeHost = document.querySelector('[data-qxframe9a7c2-docs-theme-host]');
    if (themeHost) {
      shell.themeButton = createButton(themeHost, theme() === 'dark' ? '浅色' : '深色', function () {
        setTheme(theme() === 'dark' ? 'light' : 'dark');
      }, { appearance: 'text' });
    }
    var searchIconHost = document.querySelector('[data-qxframe9a7c2-docs-search-icon]');
    if (searchIconHost) createIcon(searchIconHost, 'search', {});
  }

  function menuItems(query) {
    var q = String(query || '').trim().toLowerCase();
    return groupCatalog().map(function (group, groupIndex) {
      var children = group.items.filter(function (item) {
        var searchable = [item.name, item.cn, item.description, item.category].concat(item.features).join(' ').toLowerCase();
        return !q || searchable.indexOf(q) >= 0;
      }).map(function (item) {
        return { key: item.slug, label: item.name + '  ' + item.cn, href: item.slug + '.html', extra: item.docsChange ? (item.docsChange.label + ' · SEMANTIC') : 'SEMANTIC', className: item.docsChange ? 'is-docs-updated is-docs-semantic' : 'is-docs-semantic' };
      });
      if (!children.length) return null;
      return { key: 'docs-group-' + groupIndex, type: 'group', label: group.name, items: children };
    }).filter(Boolean);
  }

  function sidebarMarkup() {
    return '<aside class="qxframe9a7c2-docs-sidebar qxframe9a7c2-layout-sider">' +
      '<div class="qxframe9a7c2-docs-sidebar-menu" data-qxframe9a7c2-docs-sidebar-menu></div>' +
      '<div class="qxframe9a7c2-docs-sidebar-footer"><strong>视觉 / 验证</strong>' +
        '<a href="../tokens.html">Tokens & Theme Reference</a>' +
        '<a href="../theme-playground.html">Theme Playground</a>' +
        '<a href="../stage-08.html">Stage 08 Runtime Lab</a>' +
        '<a href="../stage-09.html">Stage 09 Performance Lab</a>' +
        '<a href="../../tests/stage-08.html">Stage 08 Tests</a>' +
      '</div>' +
    '</aside>';
  }

  function mountSidebarMenu(current) {
    var Menu = component('Menu');
    var host = document.querySelector('[data-qxframe9a7c2-docs-sidebar-menu]');
    if (!Menu || typeof Menu.create !== 'function' || !host) throw new Error('[QXFRAME9A7C2 Docs] Menu shell dependency is unavailable.');
    shell.menu = ownShell(Menu.create({
      container: host,
      items: menuItems(''),
      mode: 'inline',
      submenuMode: 'expand',
      selectedKey: current ? current.slug : undefined,
      theme: theme(),
      onNavigate: function (detail) {
        if (detail && detail.href) global.location.href = detail.href;
      }
    }));
    return shell.menu;
  }

  function bootHome() {
    document.title = 'QXFRAME9A7C2 · Components';
    app.innerHTML = '<div class="qxframe9a7c2-layout qxframe9a7c2-docs-app-layout">' + topbar(true) +
      '<main class="qxframe9a7c2-docs-home qxframe9a7c2-layout-content">' +
        '<section class="qxframe9a7c2-docs-home-hero"><div><div class="qxframe9a7c2-docs-eyebrow">COMPONENTS · LIVE DEMOS</div><h1>组件演示中心</h1><p class="qxframe9a7c2-docs-home-lead">按 Design System → Component → Runtime 分层浏览。每个组件保留独立 live demo、完整 Options / Methods / Events、实时 state 与 event log；Token Reference 直接展示当前 canonical theme owner 链，避免文档与生产 token 再次漂移。</p></div><div class="qxframe9a7c2-docs-home-stat"><strong>' + catalog.length + '</strong><span>独立组件 / Building Block 演示页</span></div></section>' +
        '<section class="qxframe9a7c2-docs-home-reference"><a class="qxframe9a7c2-docs-home-reference-card is-primary" href="tokens.html"><span class="qxframe9a7c2-docs-eyebrow">DESIGN SYSTEM</span><strong>Tokens & Theme Reference</strong><p>Primary 1–13、MIX Auxiliary 1–13、Neutral 1–13、13 套 physical palettes、semantic、spacing / type / radius / motion / z-index 与 Runtime Config。</p></a><a class="qxframe9a7c2-docs-home-reference-card" href="theme-playground.html"><span class="qxframe9a7c2-docs-eyebrow">LIVE CANVAS</span><strong>Theme Playground</strong><p>实时切换 seed、Neutral policy、字体、圆角与 Light / Dark，观察全部组件继承同一套 public theme contract。</p></a><a class="qxframe9a7c2-docs-home-reference-card" href="stage-08.html"><span class="qxframe9a7c2-docs-eyebrow">RUNTIME</span><strong>Stage 08 Lab</strong><p>查看 lifecycle、overlay、virtualization、transition 与跨组件运行时行为。</p></a></section>' +
        '<div class="qxframe9a7c2-docs-home-search"><span class="qxframe9a7c2-docs-search-icon" data-qxframe9a7c2-docs-search-icon></span><input type="search" data-qxframe9a7c2-docs-home-search placeholder="搜索组件名称、中文名称或功能（如 popup、range、keyboard）"></div>' +
        '<div data-qxframe9a7c2-docs-home-groups></div>' +
        '<div class="qxframe9a7c2-docs-home-tools"><a href="tokens.html">Tokens & Theme Reference</a><a href="theme-playground.html">Theme Playground</a><a href="stage-08.html">Stage 08 Runtime Lab</a><a href="stage-09.html">Stage 09 Performance Lab</a><a href="../tests/stage-08.html">Stage 08 Tests</a><a href="../README.md">README</a></div>' +
      '</main></div>';

    mountTopbarShell();
    setTheme(initialTheme());

    var host = document.querySelector('[data-qxframe9a7c2-docs-home-groups]');
    function render(query) {
      var q = String(query || '').trim().toLowerCase();
      host.innerHTML = groupCatalog().map(function (group) {
        var items = group.items.filter(function (item) {
          var searchable = [item.name, item.cn, item.description, item.category].concat(item.features).join(' ').toLowerCase();
          return !q || searchable.indexOf(q) >= 0;
        });
        if (!items.length) return '';
        return '<section class="qxframe9a7c2-docs-home-group"><h2>' + esc(group.name) + '</h2><div class="qxframe9a7c2-docs-home-grid">' +
          items.map(function (item) {
            return '<a class="qxframe9a7c2-docs-home-card" href="components/' + esc(item.slug) + '.html"><div class="qxframe9a7c2-docs-home-card-head"><strong>' + esc(item.name) + '</strong><small>' + esc(item.cn) + '</small>' + changeBadge(changeFor(item), 'is-compact') + '</div><p>' + esc(item.description) + '</p></a>';
          }).join('') + '</div></section>';
      }).join('') || '<p class="qxframe9a7c2-docs-muted">没有匹配的组件。</p>';
    }
    render('');
    document.querySelector('[data-qxframe9a7c2-docs-home-search]').addEventListener('input', function () { render(this.value); });
  }

  function currentMeta() {
    var name = document.body.getAttribute('data-qxframe9a7c2-component');
    return catalog.find(function (item) { return item.name === name; }) || null;
  }

  function bootComponent(meta) {
    document.title = 'QXFRAME9A7C2 · ' + meta.name + ' ' + meta.cn;
    app.innerHTML = '<div class="qxframe9a7c2-layout qxframe9a7c2-docs-app-layout">' + topbar(false) +
      '<div class="qxframe9a7c2-docs-layout qxframe9a7c2-layout is-horizontal">' + sidebarMarkup() +
        '<main class="qxframe9a7c2-docs-main qxframe9a7c2-layout-content">' +
          '<section class="qxframe9a7c2-docs-hero"><div class="qxframe9a7c2-docs-eyebrow">' + esc(meta.category) + ' · ' + esc(meta.api === 'BuildingBlocks' ? 'BUILDING BLOCK' : (meta.api === 'CSS' ? 'CSS / DOM' : (meta.api === 'DOMHeadless' ? 'DOM HEADLESS' : 'COMPONENT'))) + '</div><h1>' + esc(meta.name) + '<span class="qxframe9a7c2-docs-cn-title">' + esc(meta.cn) + '</span>' + changeBadge(changeFor(meta), 'is-hero') + '<span class="qxframe9a7c2-docs-release-badge is-hero is-semantic" title="v2.19.79 updates Semantic DOM with independent pseudo-state inspection and Ant-style hover peek.">v2.19.79 · SEMANTIC DOM</span></h1><p class="qxframe9a7c2-docs-lead">' + esc(meta.description) + '</p><div class="qxframe9a7c2-docs-feature-row">' + meta.features.map(function (feature) { return '<span class="qxframe9a7c2-docs-chip">' + esc(feature) + '</span>'; }).join('') + '</div><div class="qxframe9a7c2-docs-runtime-note"><strong>演示原则：</strong> 交互组件直接运行 canonical Runtime；纯视觉/原生语义组件直接使用 HTML + CSS contract，不创建无意义 JS owner。</div></section>' +
          '<section><div class="qxframe9a7c2-docs-section-head"><div><h2>代码演示</h2><p>按能力拆分的真实交互样例</p></div></div><div id="qxframe9a7c2-docs-demo-grid" class="qxframe9a7c2-docs-demo-grid"></div></section>' +
          '<section><div class="qxframe9a7c2-docs-section-head"><div><h2>运行时观察</h2><p>当前 namespace / instance surface 与实时状态</p></div></div><div class="qxframe9a7c2-docs-observe"><div class="qxframe9a7c2-docs-observe-card"><h3>API Surface</h3><div id="qxframe9a7c2-docs-api" class="qxframe9a7c2-docs-api-list"></div></div><div class="qxframe9a7c2-docs-observe-card"><h3>State Snapshot</h3><pre id="qxframe9a7c2-docs-state" class="qxframe9a7c2-docs-state">等待 Demo 挂载…</pre></div><div class="qxframe9a7c2-docs-observe-card"><h3>Event Log</h3><pre id="qxframe9a7c2-docs-log" class="qxframe9a7c2-docs-log">页面已加载。</pre></div><div class="qxframe9a7c2-docs-observe-card"><h3>Loader</h3><pre class="qxframe9a7c2-docs-api">Module: ' + esc(meta.module) + '\nShell: Layout + Menu + Button/Icon CSS-DOM\nNamespace: ' + esc(meta.api) + '\nDirect file:// compatible: yes</pre></div></div></section>' +
        '</main></div></div>';

    mountTopbarShell();
    mountSidebarMenu(meta);
    setTheme(initialTheme());

    var search = document.querySelector('[data-qxframe9a7c2-docs-nav-search]');
    if (search) search.addEventListener('input', function () {
      var items = menuItems(this.value);
      shell.menu.setItems(items);
      var currentVisible = items.some(function (group) { return (group.items || []).some(function (item) { return item.key === meta.slug; }); });
      if (currentVisible) shell.menu.setSelectedKey(meta.slug, { silent: true, reason: 'docs-search' });
    });

    var logHost = document.getElementById('qxframe9a7c2-docs-log');
    var stateHost = document.getElementById('qxframe9a7c2-docs-state');
    var apiHost = document.getElementById('qxframe9a7c2-docs-api');
    var grid = document.getElementById('qxframe9a7c2-docs-demo-grid');
    var logs = [];
    var instances = [];

    function log(message) {
      logs.unshift(new Date().toLocaleTimeString() + '  ' + String(message));
      logs = logs.slice(0, 40);
      logHost.textContent = logs.join('\n');
    }

    function track(instance, label) {
      if (instance && typeof instance === 'object') instances.push({ instance: instance, label: label || ('instance ' + (instances.length + 1)) });
      refresh();
      return instance;
    }

    function resolveAPI(metaRecord) {
      var q = qxframe9a7c2();
      if (!q) return null;
      if (metaRecord.api === 'Components') return q.Components && q.Components[metaRecord.name];
      if (metaRecord.api === 'BuildingBlocks') return q.BuildingBlocks && q.BuildingBlocks[metaRecord.name];
      if (metaRecord.api === 'DOMHeadless') return q.DOMHeadless && q.DOMHeadless[metaRecord.name];
      return null;
    }

    var refreshQueued = false;
    var lastAPISignature = '';

    function summarizeState(value, depth) {
      var level = Number(depth || 0);
      if (value && value.nodeType) return '[DOM ' + value.nodeName + ']';
      if (value === null || value === undefined || typeof value !== 'object') return value;
      if (level >= 5) return '[depth limited]';
      if (Array.isArray(value)) {
        var limit = 16;
        if (value.length <= limit) return value.map(function (entry) { return summarizeState(entry, level + 1); });
        return { length: value.length, preview: value.slice(0, limit).map(function (entry) { return summarizeState(entry, level + 1); }), omitted: value.length - limit };
      }
      var output = {}, keys = Object.keys(value), keyLimit = 48;
      keys.slice(0, keyLimit).forEach(function (key) { output[key] = summarizeState(value[key], level + 1); });
      if (keys.length > keyLimit) output.__omittedKeys = keys.length - keyLimit;
      return output;
    }

    function refreshNow() {
      var states = {};
      instances.forEach(function (record, index) {
        var instance = record.instance;
        try { states[record.label || String(index)] = typeof instance.getState === 'function' ? summarizeState(instance.getState(), 0) : '[no getState()]'; }
        catch (error) { states[record.label || String(index)] = 'STATE ERROR: ' + error.message; }
      });
      stateHost.textContent = instances.length ? JSON.stringify(states, null, 2) : '当前样例没有 stateful instance。';
      var api = resolveAPI(meta), methods = [];
      if (api && typeof api === 'object') methods = methods.concat(Object.keys(api).filter(function (key) { return typeof api[key] === 'function' || Array.isArray(api[key]); }).map(function (key) { return 'namespace.' + key; }));
      instances.forEach(function (record) { Object.keys(record.instance || {}).filter(function (key) { return typeof record.instance[key] === 'function'; }).forEach(function (key) { var method = record.label + '.' + key; if (methods.indexOf(method) < 0) methods.push(method); }); });
      methods.sort();
      var signature = methods.join('\n');
      if (signature !== lastAPISignature) { lastAPISignature = signature; apiHost.innerHTML = methods.map(function (method) { return '<span class="qxframe9a7c2-docs-api-pill">' + esc(method) + '</span>'; }).join('') || '<span class="qxframe9a7c2-docs-muted">CSS / native HTML surface</span>'; }
    }

    function refresh() {
      if (refreshQueued) return false;
      refreshQueued = true;
      Promise.resolve().then(function () { refreshQueued = false; refreshNow(); });
      return true;
    }

    function demoButton(text, fn) {
      var instance = createButton(null, text, function (event) {
        try { fn(event); refresh(); } catch (error) { log('Action error: ' + error.message); }
      }, { color: 'default', appearance: 'outlined', size: 'sm' });
      return instance.element;
    }

    function example(spec) {
      var card = document.createElement('article');
      card.className = 'qxframe9a7c2-docs-demo-card';
      var demoChange = changeFor(meta, spec.title);
      card.innerHTML = '<div class="qxframe9a7c2-docs-demo-live ' + (spec.column ? 'is-column' : '') + '"><div class="qxframe9a7c2-docs-demo-mount" style="width:100%"></div></div><div class="qxframe9a7c2-docs-demo-info"><h3 class="qxframe9a7c2-docs-demo-title"><span>' + esc(spec.title) + '</span>' + changeBadge(demoChange, 'is-demo') + '</h3><p class="qxframe9a7c2-docs-demo-desc">' + esc(spec.description || '') + '</p><div class="qxframe9a7c2-docs-demo-actions"><span data-qxframe9a7c2-docs-code-toggle></span></div></div><pre class="qxframe9a7c2-docs-code"><code>' + esc(spec.code || '') + '</code></pre>';
      grid.appendChild(card);
      var codeHost = card.querySelector('[data-qxframe9a7c2-docs-code-toggle]');
      var codeButton = createButton(codeHost, '查看代码', function () {
        card.classList.toggle('is-code-open');
        codeButton.setOptions({ text: card.classList.contains('is-code-open') ? '收起代码' : '查看代码' });
      }, { appearance: 'text', size: 'sm' });
      var mount = card.querySelector('.qxframe9a7c2-docs-demo-mount');
      try { spec.mount(mount); }
      catch (error) {
        mount.innerHTML = '<div class="qxframe9a7c2-docs-demo-error">' + esc(error && error.stack || error) + '</div>';
        log('Demo error · ' + spec.title + ' · ' + (error && error.message || error));
      }
      refresh();
      return mount;
    }

    var ctx = {
      meta: meta,
      app: app,
      grid: grid,
      example: example,
      log: log,
      track: track,
      refresh: refresh,
      api: function () { return resolveAPI(meta); },
      q: qxframe9a7c2,
      button: demoButton,
      row: function () { var row = document.createElement('div'); row.className = 'qxframe9a7c2-docs-control-row'; return row; }
    };

    var pageContext = {
      meta: meta,
      grid: grid,
      getInstances: function () { return instances.slice(); },
      getAPI: function () { return resolveAPI(meta); },
      demosMounted: false,
      refreshSemantic: function () {
        if (global.QXFRAME9A7C2SemanticDOM && typeof global.QXFRAME9A7C2SemanticDOM.refresh === 'function') global.QXFRAME9A7C2SemanticDOM.refresh();
      }
    };
    global.QXFRAME9A7C2_DOCS_PAGE_CONTEXT = pageContext;

    function startDemos() {
      if (!global.QXFRAME9A7C2ComponentDemos || typeof global.QXFRAME9A7C2ComponentDemos.mount !== 'function') {
        global.setTimeout(startDemos, 0);
        return;
      }
      global.QXFRAME9A7C2ComponentDemos.mount(meta.name, ctx);
      pageContext.demosMounted = true;
      refresh();
      try { document.dispatchEvent(new CustomEvent('qxframe9a7c2:docs-demos-mounted', { detail: { component: meta.name } })); } catch (_) {}
      pageContext.refreshSemantic();
    }
    startDemos();
  }

  function boot() {
    if (document.body.hasAttribute('data-qxframe9a7c2-docs-home')) bootHome();
    else {
      var meta = currentMeta();
      if (meta) bootComponent(meta);
      else app.textContent = 'Unknown component page.';
    }
  }

  if (global.QXFRAME9A7C2) boot();
  else app.innerHTML = '<div class="qxframe9a7c2-docs-demo-error">QXFRAME9A7C2 dist runtime is required by the component demo center.</div>';
})(window, document);
