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
  var sliders = new Map();
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
    if (host.closest('[data-card="roller-shades"]')) {
      // Source RollerShades: the controlled value drives both artwork and the active preset.
      options.onChange = function (nextValue) {
        var position = Number(Array.isArray(nextValue) ? nextValue[0] : nextValue);
        if (Number.isFinite(position)) {
          var card = host.closest('[data-card="roller-shades"]');
          var fill = card.querySelector('.pv-shade > div');
          if (fill) fill.style.height = position + '%';
          setToggleValue(card.querySelector('.pv-toggle-group'), position <= 10 ? 'open' : position >= 90 ? 'closed' : 'half');
        }
      };
    }
    var slider = C.Slider.create(options);
    sliders.set(host, slider);
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

  // shadcn's single-selection ToggleGroup semantics on the three Preview 01
  // compositions. This is card authoring, not a replacement framework Controller.
  function buttonValue(button) {
    return button.textContent.trim().toLowerCase().replace(/\s+/g, '-');
  }
  function setToggleValue(group, value) {
    if (!group) return;
    group.querySelectorAll('button').forEach(function (button) {
      var selected = buttonValue(button) === value;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function bindSingleToggle(card, onChange, retainSelection) {
    if (!card) return;
    var group = card.querySelector('.pv-toggle-group');
    if (!group) return;
    group.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button || !group.contains(button) || button.disabled) return;
      var value = buttonValue(button);
      var selected = button.getAttribute('aria-pressed') === 'true';
      if (selected && retainSelection) return;
      var next = selected ? '' : value;
      setToggleValue(group, next);
      if (next) onChange(next);
    });
  }
  var kitchen = document.querySelector('[data-card="kitchen-island"]');
  if (kitchen) {
    var scenes = {
      cooking: [90,70,30,0], dining: [50,40,20,60],
      nightlight: [15,20,0,80], focus: [100,85,0,0]
    };
    var kitchenSliders = Array.prototype.map.call(kitchen.querySelectorAll('[data-pv-slider]'), function (host) {
      return sliders.get(host);
    });
    bindSingleToggle(kitchen, function (name) {
      scenes[name].forEach(function (value, index) { kitchenSliders[index].setValue(value); });
    }, true);
    var masterSwitch = kitchen.querySelector('.qxframe9a7c2-switch-input');
    if (masterSwitch) {
      function syncKitchenEnabled() {
        var enabled = masterSwitch.checked;
        kitchen.querySelectorAll('.pv-toggle-group button').forEach(function (button) { button.disabled = !enabled; });
        kitchenSliders.forEach(function (slider) { slider.setDisabled(!enabled); });
      }
      masterSwitch.addEventListener('change', syncKitchenEnabled);
      syncKitchenEnabled();
    }
  }
  var roller = document.querySelector('[data-card="roller-shades"]');
  if (roller) {
    var rollerHost = roller.querySelector('[data-pv-slider]');
    bindSingleToggle(roller, function (name) {
      var position = name === 'open' ? 0 : name === 'closed' ? 100 : 50;
      sliders.get(rollerHost).setValue(position);
      // Keep the authored media and selection in sync even if setValue is silent.
      roller.querySelector('.pv-shade > div').style.height = position + '%';
      setToggleValue(roller.querySelector('.pv-toggle-group'), name);
    }, true);
  }
  // Upstream ReleaseCatalog changes the active filter pill without filtering
  // its static HOLDINGS list. Do not invent an item-filtering behavior.
  bindSingleToggle(document.querySelector('[data-card="release-catalog"]'), function () {}, false);

  // Pinned NotificationSettings: one indeterminate master reflects 4 choices.
  var notifications = document.querySelector('[data-card="notification-settings"]');
  if (notifications) {
    var checks = Array.prototype.slice.call(notifications.querySelectorAll('.qxframe9a7c2-check-field input[type="checkbox"]'));
    var master = checks.shift();
    if (master && checks.length === 4) {
      function syncMaster() {
        var chosen = checks.filter(function (check) { return check.checked; }).length;
        master.checked = chosen === checks.length;
        master.indeterminate = chosen > 0 && chosen < checks.length;
      }
      master.addEventListener('change', function () {
        checks.forEach(function (check) { check.checked = master.checked; });
        syncMaster();
      });
      checks.forEach(function (check) { check.addEventListener('change', syncMaster); });
      syncMaster();
    }
  }
  document.querySelectorAll('input[data-indeterminate]').forEach(function (input) { input.indeterminate = true; });
})();
