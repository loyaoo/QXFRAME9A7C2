(function (global, document) {
  'use strict';

  var brand = global.QXFRAME9A7C2;
  if (!brand || !brand.Headless) return;
  var H = brand.Headless;

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
  function on(id, eventName, handler) {
    var node = byId(id);
    if (node) node.addEventListener(eventName, handler);
  }

  var logs = [];
  function log(type, detail) {
    logs.push({ type: type, detail: detail });
    if (logs.length > 20) logs.shift();
    setText('stage03-logs', logs);
  }

  var collection = H.Collection.create({
    items: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'bravo', label: 'Bravo', disabled: true },
      { id: 'charlie', label: 'Charlie' }
    ],
    onMove: function (detail) { log('collection.move', { key: detail.key, from: detail.fromIndex, to: detail.toIndex }); }
  });

  var selection = H.Selection.create({
    multiple: true,
    maxCount: 2,
    onChange: function (values) { log('selection.change', values); refresh(); },
    onMaxCount: function (detail) { log('selection.max-count', { maxCount: detail.maxCount }); }
  });

  var valueDraft = H.ValueDraft.create({
    value: '已确认值',
    onDraftChange: function (value) { log('valueDraft.draft-change', value); refresh(); },
    onCommit: function (value) { log('valueDraft.commit', value); refresh(); },
    onCancel: function () { log('valueDraft.cancel', valueDraft.snapshot()); refresh(); }
  });

  var activeItem = H.ActiveItem.create({
    getEntries: function () { return collection.entries(); },
    onChange: function (key) { log('activeItem.change', key); refresh(); }
  });

  var pagination = H.PaginationModel.create({ total: 123, pageSize: 10, page: 1, pagerCount: 7, ellipsisJump: 0.1, onChange: function () { refresh(); } });
  var asyncTask = H.AsyncTask.create({ task: function (input) { return Promise.resolve('result-' + input); }, onStateChange: function () { refresh(); } });

  var tree = H.TreeModel.create({
    items: [
      {
        id: 'root-a', label: '根 A',
        items: [
          { key: 'a-1', label: 'A-1' },
          { key: 'a-2', label: 'A-2', items: [{ key: 'a-2-1', label: 'A-2-1' }] }
        ]
      },
      { key: 'root-b', label: '根 B' }
    ]
  });

  function refresh() {
    setText('stage03-collection-state', {
      keys: collection.keys,
      entries: collection.entries().map(function (entry) {
        return { key: entry.key, label: entry.label, disabled: entry.disabled };
      })
    });
    setText('stage03-selection-state', selection.snapshot());
    setText('stage03-value-state', valueDraft.snapshot());
    setText('stage03-active-state', {
      activeKey: activeItem.activeKey,
      enabled: activeItem.enabledEntries().map(function (entry) { return entry.key; })
    });
    setText('stage03-page-state', { state: pagination.snapshot(), items: pagination.deriveItems() });
    setText('stage03-async-state', asyncTask.snapshot());
    setText('stage03-tree-state', {
      records: tree.records.map(function (record) {
        return { key: record.key, parentKey: record.parentKey, depth: record.depth };
      }),
      visibleWhenExpanded: tree.flattenVisible(['root-a', 'a-2']).map(function (record) { return record.key; }),
      diagnostics: tree.diagnostics
    });
  }

  on('stage03-collection-move', 'click', function () {
    collection.move('alpha', collection.size - 1);
    activeItem.ensureValid();
    refresh();
  });
  on('stage03-selection-alpha', 'click', function () { selection.toggle('alpha'); refresh(); });
  on('stage03-selection-bravo', 'click', function () { selection.toggle('bravo'); refresh(); });
  on('stage03-selection-charlie', 'click', function () { selection.toggle('charlie'); refresh(); });

  on('stage03-value-input', 'input', function (event) {
    valueDraft.setDraft(event.target.value, { source: 'input', originalEvent: event });
  });
  on('stage03-value-commit', 'click', function () { valueDraft.commit({ source: 'demo' }); });
  on('stage03-value-cancel', 'click', function () {
    valueDraft.cancel({ source: 'demo' });
    var input = byId('stage03-value-input');
    if (input) input.value = String(valueDraft.draftValue || '');
  });

  on('stage03-active-prev', 'click', function () { activeItem.previous({ source: 'demo' }); });
  on('stage03-active-next', 'click', function () { activeItem.next({ source: 'demo' }); });
  on('stage03-page-prev', 'click', function () { pagination.previous({ source: 'demo' }); refresh(); });
  on('stage03-page-next', 'click', function () { pagination.next({ source: 'demo' }); refresh(); });
  on('stage03-async-run', 'click', function () { asyncTask.run(Date.now(), { source: 'demo' }).catch(function () {}); refresh(); });
  on('stage03-async-reset', 'click', function () { asyncTask.reset(); refresh(); });

  var input = byId('stage03-value-input');
  if (input) input.value = String(valueDraft.draftValue || '');

  global.QXFRAME9A7C2_STAGE03_DEMO = {
    collection: collection,
    selection: selection,
    valueDraft: valueDraft,
    activeItem: activeItem,
    treeModel: tree,
    paginationModel: pagination,
    asyncTask: asyncTask,
    refresh: refresh
  };

  global.addEventListener('pagehide', function () {
    collection.destroy();
    selection.destroy();
    valueDraft.destroy();
    activeItem.destroy();
    pagination.destroy();
    asyncTask.destroy();
    tree.destroy();
  }, { once: true });

  refresh();
})(globalThis, document);
