
(function (global, document) {
  'use strict';

  var brand = global.QXFRAME9A7C2;
  var D = brand.DOMHeadless;

  function byId(id) { return document.getElementById(id); }

  var logs = [];
  function log(message) {
    logs.unshift(String(message));
    if (logs.length > 30) logs.length = 30;
    var node = byId('stage04-log');
    if (node) node.textContent = JSON.stringify(logs, null, 2);
  }

  var layerManager = D.LayerManager.create({ baseZIndex: 1000, step: 20 });

  var parentReference = byId('stage04-parent-trigger');
  var parentFloating = byId('stage04-parent-popup');
  var childReference = byId('stage04-child-trigger');
  var childFloating = byId('stage04-child-popup');

  function createOverlayDemo(options) {
    var opened = false;
    var floating = options.floating;
    var surface = D.PopupSurface.create({ element: floating });
    surface.hide({ reason: 'initial' });
    var runtime = null;
    function close(reason, originalEvent) {
      if (!opened) return false;
      opened = false;
      surface.hide({ reason: reason || 'close', originalEvent: originalEvent || null });
      runtime.deactivate({ reason: reason || 'close', originalEvent: originalEvent || null });
      if (typeof options.onClose === 'function') options.onClose({ reason: reason || 'close', originalEvent: originalEvent || null });
      return true;
    }
    runtime = D.OverlayRuntime.create({
      reference: options.reference || null,
      floating: floating,
      document: document,
      window: global,
      layerManager: options.layerManager,
      placement: options.placement,
      position: options.position !== false,
      closeOnOutsidePress: options.closeOnOutsidePress !== false,
      closeOnEscape: options.closeOnEscape !== false,
      trapFocus: options.trapFocus === true,
      lockScroll: options.lockScroll === true,
      focusOnActivate: options.focusOnActivate === true,
      restoreFocus: options.restoreFocus !== false,
      initialFocus: options.initialFocus,
      onPositionError: options.onPositionError,
      onDismiss: function (detail) { return close(detail.reason, detail.originalEvent); }
    });
    function open(reason, originalEvent) {
      if (opened) return false;
      opened = true;
      runtime.mount();
      surface.show({ reason: reason || 'open', originalEvent: originalEvent || null });
      runtime.activate({ reason: reason || 'open', originalEvent: originalEvent || null });
      if (typeof options.onOpen === 'function') options.onOpen({ reason: reason || 'open', originalEvent: originalEvent || null });
      return true;
    }
    return Object.freeze({
      open: open,
      close: close,
      toggle: function (reason, originalEvent) { return opened ? close(reason || 'toggle', originalEvent) : open(reason || 'toggle', originalEvent); },
      destroy: function () { if (opened) close('destroy'); runtime.destroy(); surface.destroy(); }
    });
  }

  var parentPopup = createOverlayDemo({
    reference: parentReference,
    floating: parentFloating,
    layerManager: layerManager,
    placement: 'bottom-start',
    onPositionError: function (error) { log('Parent position error: ' + error.message); },
    onOpen: function () { log('Parent popup open'); },
    onClose: function (event) { log('Parent popup close · ' + event.reason); }
  });

  var parentTrigger = D.TriggerInteraction.create({
    reference: parentReference,
    floating: parentFloating,
    trigger: 'click',
    onToggleIntent: function () { parentPopup.toggle('trigger-click'); }
  });

  var childPopup = createOverlayDemo({
    reference: childReference,
    floating: childFloating,
    layerManager: layerManager,
    placement: 'right-start',
    onPositionError: function (error) { log('Child position error: ' + error.message); },
    onOpen: function () { log('Nested popup open'); },
    onClose: function (event) { log('Nested popup close · ' + event.reason); }
  });

  var childTrigger = D.TriggerInteraction.create({
    reference: childReference,
    floating: childFloating,
    trigger: 'click',
    onToggleIntent: function () { childPopup.toggle('trigger-click'); }
  });

  var modalReference = byId('stage04-modal-trigger');
  var modal = byId('stage04-modal');
  var modalClose = byId('stage04-modal-close');

  var modalPopup = createOverlayDemo({
    floating: modal,
    layerManager: layerManager,
    position: false,
    trapFocus: true,
    lockScroll: true,
    focusOnActivate: true,
    initialFocus: modalClose
  });

  modalReference.addEventListener('click', function () {
    modalPopup.open('demo');
    log('Modal open · focus trap + scroll lock');
  });
  modalClose.addEventListener('click', function () {
    modalPopup.close('button');
    log('Modal close');
  });

  var keyboardRoot = byId('stage04-keyboard-root');
  var keyboardItems = Array.prototype.slice.call(keyboardRoot.querySelectorAll('[data-key]'));
  var activeItem = brand.Headless.ActiveItem.create({
    entries: [
      { key: 'alpha' },
      { key: 'bravo', disabled: true },
      { key: 'charlie' },
      { key: 'delta' }
    ],
    activeKey: 'alpha',
    onChange: function () {
      keyboardItems.forEach(function (node) {
        node.dataset.active = String(node.dataset.key === activeItem.activeKey);
      });
      byId('stage04-keyboard-state').textContent = JSON.stringify({
        activeKey: activeItem.activeKey
      }, null, 2);
    }
  });

  keyboardItems.forEach(function (node) {
    node.dataset.active = String(node.dataset.key === activeItem.activeKey);
  });
  byId('stage04-keyboard-state').textContent = JSON.stringify({
    activeKey: activeItem.activeKey
  }, null, 2);

  var keyboard = D.KeyboardNavigation.create({
    root: keyboardRoot,
    activeItem: activeItem,
    orientation: 'vertical',
    onActivate: function (payload) {
      log('Keyboard activate · ' + payload.key);
      return true;
    }
  });


  var delegationRoot = byId('stage04-delegation-root');
  var delegationState = byId('stage04-delegation-state');
  var delegationHits = 0;
  var delegation = D.EventDelegation.create({ root: delegationRoot });
  delegation.on('click', '.stage04-delegated-item', function () {
    delegationHits += 1;
    delegationState.textContent = JSON.stringify({ hits: delegationHits, nativeRootListeners: delegation.listenerCount }, null, 2);
  });
  byId('stage04-delegation-replace').addEventListener('click', function () {
    var old = delegationRoot.querySelector('.stage04-delegated-item');
    if (old) old.remove();
    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'stage04-delegated-item';
    next.textContent = 'Replacement Item';
    delegationRoot.appendChild(next);
    delegationState.textContent = JSON.stringify({ hits: delegationHits, nativeRootListeners: delegation.listenerCount, replaced: true }, null, 2);
  });
  delegationState.textContent = JSON.stringify({ hits: 0, nativeRootListeners: delegation.listenerCount }, null, 2);

  function mountVirtualDemo(options) {
    var viewport = byId(options.viewportId);
    var space = byId(options.spaceId);
    var metrics = byId(options.metricsId);
    var virtualizer = null;
    var measureScheduled = false;

    function render(snapshot) {
      space.style.height = String(snapshot.totalSize) + 'px';
      while (space.firstChild) space.removeChild(space.firstChild);

      snapshot.items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'qxframe9a7c2-stage04-item';
        row.style.transform = 'translateY(' + item.start + 'px)';

        if (options.dynamic) {
          row.style.minHeight = String(28 + (item.index % 6) * 7) + 'px';
          row.style.paddingTop = String(4 + (item.index % 3) * 3) + 'px';
          row.style.paddingBottom = String(4 + (item.index % 4) * 2) + 'px';
        } else {
          row.style.height = String(item.size) + 'px';
        }

        row.textContent = 'Item ' + item.index;
        row.dataset.index = String(item.index);
        space.appendChild(row);
      });

      metrics.textContent = JSON.stringify({
        range: snapshot.range,
        totalSize: Math.round(snapshot.totalSize),
        scrollOffset: Math.round(snapshot.scrollOffset),
        viewportSize: snapshot.viewportSize,
        requestCount: virtualizer ? virtualizer.requestCount : 0,
        renderCount: virtualizer ? virtualizer.renderCount : 0,
        renderedDOM: snapshot.items.length
      }, null, 2);

      if (options.dynamic && virtualizer && !measureScheduled) {
        measureScheduled = true;
        global.requestAnimationFrame(function () {
          measureScheduled = false;
          Array.prototype.slice.call(space.children).forEach(function (row) {
            virtualizer.measureElement(Number(row.dataset.index), row);
          });
        });
      }
    }

    virtualizer = D.Virtualizer.create({
      viewport: viewport,
      count: options.count,
      itemSize: options.dynamic ? undefined : options.itemSize,
      estimateSize: options.dynamic ? options.estimateSize : undefined,
      overscan: options.overscan || 6,
      preserveScrollAnchor: true,
      onChange: render
    });
    virtualizer.refresh('demo-mount');
    return virtualizer;
  }

  var fixedVirtualizer = mountVirtualDemo({
    viewportId: 'stage04-fixed-viewport',
    spaceId: 'stage04-fixed-space',
    metricsId: 'stage04-fixed-metrics',
    count: 100000,
    itemSize: 28,
    overscan: 8
  });

  byId('stage04-fixed-50000').addEventListener('click', function () {
    fixedVirtualizer.scrollToIndex(50000, { align: 'center' });
  });
  byId('stage04-fixed-99999').addEventListener('click', function () {
    fixedVirtualizer.ensureVisible(99999, { align: 'end' });
  });

  var dynamicVirtualizer = mountVirtualDemo({
    viewportId: 'stage04-dynamic-viewport',
    spaceId: 'stage04-dynamic-space',
    metricsId: 'stage04-dynamic-metrics',
    count: 5000,
    estimateSize: 48,
    overscan: 6,
    dynamic: true
  });

  byId('stage04-dynamic-2500').addEventListener('click', function () {
    dynamicVirtualizer.scrollToIndex(2500, { align: 'center' });
  });

  global.QXFRAME9A7C2_STAGE04_DEMO = {
    layerManager: layerManager,
    parentPopup: parentPopup,
    childPopup: childPopup,
    modalPopup: modalPopup,
    activeItem: activeItem,
    keyboardNavigation: keyboard,
    eventDelegation: delegation,
    fixedVirtualizer: fixedVirtualizer,
    dynamicVirtualizer: dynamicVirtualizer,
    destroy: function () {
      parentTrigger.destroy();
      childTrigger.destroy();
      parentPopup.destroy();
      childPopup.destroy();
      modalPopup.destroy();
      keyboard.destroy();
      delegation.destroy();
      activeItem.destroy();
      fixedVirtualizer.destroy();
      dynamicVirtualizer.destroy();
      layerManager.destroy();
    }
  };
})(globalThis, document);
