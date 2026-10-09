// Mounts the runtime QX components used by the preview cards (v3 §7.5: Select, Tabs, Table,
// Slider, Calendar keep their runtime DOM and are aligned through CSS only).
(function () {
  var Q = window.QXFRAME9A7C2;
  if (!Q || !Q.Components) return;
  var C = Q.Components;
  function pairs(text) {
    return String(text || '').split('|').filter(Boolean).map(function (entry) {
      var parts = entry.split('::');
      return { value: parts[0], label: parts[1] === undefined ? parts[0] : parts[1] };
    });
  }
  document.querySelectorAll('[data-pv-select]').forEach(function (host) {
    C.Select.create({
      container: host,
      items: pairs(host.getAttribute('data-options')),
      value: host.getAttribute('data-value') || undefined,
      placeholder: host.getAttribute('data-placeholder') || undefined,
      size: host.getAttribute('data-size') || 'md'
    });
  });
  document.querySelectorAll('[data-pv-slider]').forEach(function (host) {
    var raw = String(host.getAttribute('data-value') || '0').split(',').map(Number);
    var options = {
      container: host,
      range: raw.length > 1,
      defaultValue: raw.length > 1 ? raw : raw[0],
      min: Number(host.getAttribute('data-min') || 0),
      max: Number(host.getAttribute('data-max') || 100),
      step: Number(host.getAttribute('data-step') || 1),
      disabled: host.hasAttribute('data-disabled')
    };
    // QX Slider ValueController owns the value. These are read-only authored labels.
    var outputKey = host.getAttribute('data-pv-output');
    if (outputKey) {
      var outputs = Array.prototype.filter.call(document.querySelectorAll('[data-pv-value-for]'), function (node) {
        return node.getAttribute('data-pv-value-for') === outputKey;
      });
      if (outputs.length) {
        options.onChange = function (nextValue) {
          var value = Number(Array.isArray(nextValue) ? nextValue[0] : nextValue);
          if (!Number.isFinite(value)) return;
          var amount = host.getAttribute('data-pv-output-format') === 'money-2' ? String.fromCharCode(36) + value.toFixed(2) : String(value);
          outputs.forEach(function (node) { node.textContent = amount; });
        };
      }
    }
    C.Slider.create(options);
    if (host.hasAttribute('data-pv-track-height')) {
      var root = host.querySelector('.qxframe9a7c2-slider');
      if (root) root.classList.add('is-track-height');
    }
  });
  document.querySelectorAll('[data-pv-tabs]').forEach(function (host) {
    var items = pairs(host.getAttribute('data-items')).map(function (item) { return { key: item.value, label: item.label }; });
    var options = { container: host, items: items, defaultActiveKey: host.getAttribute('data-value') || (items[0] && items[0].key) };
    if (host.getAttribute('data-type')) options.type = host.getAttribute('data-type');
    // The QX Tabs controller owns activation. Panels are authored framework
    // compositions, not a second tab implementation or duplicate styling.
    var group = host.getAttribute('data-pv-tab-group');
    var panels = group ? Array.prototype.slice.call(host.parentNode.querySelectorAll('[data-pv-tab-panel]')) : [];
    if (panels.length) {
      options.onChange = function (activeKey) {
        panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-pv-tab-panel') !== String(activeKey); });
      };
    }
    var tabs = C.Tabs.create(options);
    // Author equal-width segmented slots using the framework's reusable Tabs modifier.
    if (host.hasAttribute('data-pv-equal')) tabs.getRootElement().classList.add('is-equal');
    if (panels.length) options.onChange(tabs.activeKey || options.defaultActiveKey);
  });
  var Calendar = C.Calendar || (Q.BuildingBlocks && Q.BuildingBlocks.Calendar);
  document.querySelectorAll('[data-pv-calendar]').forEach(function (host) {
    if (!Calendar) return;
    // Locked shadcn UpcomingPayments initializes its live Calendar with
    // useState(new Date()). Resolve the demo keyword at mount time, rather
    // than pinning April 2024 to the unrelated transaction copy.
    var authoredValue = host.getAttribute('data-value');
    Calendar.create({ container: host, value: authoredValue === 'today' ? new Date() : authoredValue || undefined });
    if (host.getAttribute('data-pv-calendar-layout') === 'adaptive-month') {
      var calendarRoot = host.querySelector('.qxframe9a7c2-calendar');
      if (calendarRoot) calendarRoot.classList.add('is-adaptive-month');
    }
  });
  document.querySelectorAll('input[data-indeterminate]').forEach(function (input) { input.indeterminate = true; });
})();
