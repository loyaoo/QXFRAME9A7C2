(function () {
  'use strict';
  var Q = window.QXFRAME9A7C2;
  var VirtualList = Q.BuildingBlocks.VirtualList;
  var List = Q.BuildingBlocks.List;
  var Pagination = Q.Components.Pagination;
  var Menu = Q.Components.Menu;
  var OptionList = Q.BuildingBlocks.OptionList;
  var Calendar = Q.BuildingBlocks.Calendar;
  var TimePanel = Q.BuildingBlocks.TimePanel;
  var ColorPanel = Q.BuildingBlocks.ColorPanel;
  var logNode = document.getElementById('event-log');

  function log(message) {
    var time = new Date().toLocaleTimeString();
    logNode.textContent = '[' + time + '] ' + message + '\n' + logNode.textContent;
  }
  function rows(count) {
    var output = [];
    for (var i = 0; i < count; i += 1) output.push({ key: 'row-' + i, value: 'value-' + i, label: 'Row ' + i, disabled: i === 4 || i === 41 });
    return output;
  }
  function refresh() {
    document.getElementById('virtual-state').textContent = JSON.stringify(virtualList.getState(), null, 2);
    document.getElementById('list-state').textContent = JSON.stringify(list.getState(), null, 2);
    document.getElementById('large-list-state').textContent = JSON.stringify(largeList.getState(), null, 2);
    document.getElementById('pagination-state').textContent = JSON.stringify({ state: pagination.getState(), items: pagination.getItems() }, null, 2);
    document.getElementById('menu-state').textContent = JSON.stringify(menu.getState(), null, 2);
    document.getElementById('option-list-state').textContent = JSON.stringify(optionList.getState(), null, 2);
    var calendarState = calendar.getState();
    document.getElementById('calendar-state').textContent = JSON.stringify({ value: calendarState.value && Calendar.keyOf(calendarState.value), viewValue: calendarState.viewValue && Calendar.keyOf(calendarState.viewValue), activeKey: calendarState.activeKey }, null, 2);
    document.getElementById('time-panel-state').textContent = JSON.stringify(timePanel.getState(), null, 2);
    document.getElementById('color-panel-state').textContent = JSON.stringify(colorPanel.getState(), null, 2);
  }

  var virtualList = VirtualList.create({container: document.getElementById('virtual-host'),
    items: rows(100000), itemSize: 32, height: 260, overscan: 4,
    itemRender: function (item, ctx) { return item.label; },
    onRangeChange: function (detail) { log('VirtualList range = ' + detail.range.start + '…' + detail.range.end); }
  });

  var list = List.create({container: document.getElementById('list-host'),
    items: [
      { key: 'north', value: 'north', label: 'North' },
      { key: 'east', value: 'east', label: 'East' },
      { key: 'south', value: 'south', label: 'South', disabled: true },
      { key: 'west', value: 'west', label: 'West' },
      { key: 'center', value: 'center', label: 'Center' }
    ],
    searchable: true, selectable: true, value: 'east', size: 'md', virtual: false,
    onActiveChange: function (detail) { log('List activeKey = ' + detail.key + ' · ' + detail.source); refresh(); },
    onSelect: function (detail) { log('List select = ' + detail.value + ' · selected=' + detail.selected); refresh(); },
    onChange: function (value) { log('List value = ' + JSON.stringify(value)); refresh(); },
    onSearch: function (value) { log('List searchValue = ' + value); refresh(); }
  });

  var largeList = List.create({container: document.getElementById('large-list-host'),
    items: rows(10000), virtual: 'auto', virtualThreshold: 120, height: 260,
    value: 'value-9000', size: 'sm',
    onActiveChange: function (detail) { log('Large List activeKey = ' + detail.key); refresh(); },
    onChange: function (value) { log('Large List value = ' + JSON.stringify(value)); refresh(); },
    onRangeChange: function () { refresh(); }
  });

  var pagination = Pagination.create({container: document.getElementById('pagination-host'),
    count: 200, current: 10, pageSize: 10, pagerCount: 15, ellipsisJump: 0.1,
    showTotal: true, showSizeChanger: true, showJumper: true,
    background: false, size: 'md',
    onChange: function (current, pageSize, detail) { log('Pagination current=' + current + ' pageSize=' + pageSize + ' reason=' + detail.reason); refresh(); },
    onSizeChange: function (pageSize) { log('Pagination pageSize=' + pageSize); refresh(); }
  });


  var menu = Menu.create({container: document.getElementById('menu-host'),
    mode: 'inline', submenuMode: 'expand', selectedKey: 'copy', openKeys: ['edit'],
    items: [
      { key: 'file', label: 'File', items: [
        { key: 'new', label: 'New' }, { key: 'open', label: 'Open' },
        { key: 'recent', label: 'Recent', items: [{ key: 'alpha', label: 'Alpha.qxframe9a7c2' }, { key: 'beta', label: 'Beta.qxframe9a7c2' }] }
      ] },
      { key: 'edit', label: 'Edit', items: [{ key: 'copy', label: 'Copy' }, { key: 'paste', label: 'Paste' }, { key: 'delete', label: 'Delete', disabled: true }] },
      { key: 'refresh', label: 'Refresh' }
    ],
    onSelect: function (detail) { log('Menu navigate = ' + detail.key + ' path=' + detail.pathKeys.join(' > ')); refresh(); }
  });

  var optionList = OptionList.create({container: document.getElementById('option-list-host'),
    items: [{ key: 'alpha', value: 'alpha', label: 'Alpha' }, { key: 'beta', value: 'beta', label: 'Beta' }, { key: 'gamma', value: 'gamma', label: 'Gamma' }],
    value: 'beta', searchable: true,
    onChange: function (value) { log('OptionList value = ' + JSON.stringify(value)); refresh(); },
    onActiveChange: function (detail) { log('OptionList activeKey = ' + detail.key); refresh(); }
  });

  var calendar = Calendar.create({container: document.getElementById('calendar-host'), value: '2026-08-15', weekStartsOn: 1,
    onViewChange: function (value) { log('Calendar viewValue = ' + Calendar.keyOf(value)); refresh(); },
    onActiveChange: function (detail) { log('Calendar activeKey = ' + detail.key); refresh(); },
    onChange: function (value) { log('Calendar value = ' + Calendar.keyOf(value)); refresh(); }
  });

  var timePanel = TimePanel.create({container: document.getElementById('time-panel-host'), value: '13:25:30', minuteStep: 5, secondStep: 5,
    onChange: function (value) { log('TimePanel value = ' + TimePanel.format(value, true)); refresh(); }
  });

  var colorPanel = ColorPanel.create({container: document.getElementById('color-panel-host'), value: '#1677FF', showAlpha: true,
    presets: ['#1677FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1'],
    onChange: function (value) { log('ColorPanel value = ' + value); refresh(); }
  });

  List.create({container: document.getElementById('light-list'), items: rows(5), value: 'value-1', virtual: false, size: 'sm' });
  List.create({container: document.getElementById('dark-list'), items: rows(5), value: 'value-2', virtual: false, size: 'sm' });

  document.getElementById('virtual-0').addEventListener('click', function () { virtualList.scrollToIndex(0); refresh(); });
  document.getElementById('virtual-50000').addEventListener('click', function () { virtualList.scrollToIndex(50000, { align: 'center' }); refresh(); });
  document.getElementById('virtual-last').addEventListener('click', function () { virtualList.ensureVisible(99999); refresh(); });
  document.getElementById('list-first').addEventListener('click', function () { list.focusFirst(); refresh(); });
  document.getElementById('list-selected').addEventListener('click', function () { list.focusSelected(); refresh(); });
  document.getElementById('list-search').addEventListener('click', function () { list.focusSearch(); refresh(); });
  document.getElementById('list-clear-active').addEventListener('click', function () { list.resetActive(); refresh(); });
  document.getElementById('list-clear-value').addEventListener('click', function () { list.clear(); refresh(); });
  document.getElementById('large-focus').addEventListener('click', function () { largeList.focusWrap(); refresh(); });
  document.getElementById('large-prepare').addEventListener('click', function () { largeList.prepareOpen(); largeList.focusWrap(); refresh(); });
  document.getElementById('large-set-active').addEventListener('click', function () { largeList.setActiveKey('row-5000'); largeList.getVirtualList().ensureVisible(5000); largeList.focusWrap(); refresh(); });

  document.getElementById('pagination-prev').addEventListener('click', function () { pagination.prev(); refresh(); });
  document.getElementById('pagination-next').addEventListener('click', function () { pagination.next(); refresh(); });
  document.getElementById('pagination-12').addEventListener('click', function () { pagination.setCurrent(12); refresh(); });
  document.getElementById('pagination-size').addEventListener('click', function () { pagination.setPageSize(20); refresh(); });
  document.getElementById('menu-first').addEventListener('click', function () { menu.setActiveKey('file'); refresh(); });
  document.getElementById('menu-close').addEventListener('click', function () { menu.setOpenKeys([]); refresh(); });
  document.getElementById('menu-select').addEventListener('click', function () { menu.setSelectedKey('copy'); refresh(); });

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var html = document.documentElement;
    var dark = !html.classList.contains('qxframe9a7c2-theme-dark');
    html.classList.toggle('qxframe9a7c2-theme-dark', dark);
    html.classList.toggle('qxframe9a7c2-theme-light', !dark);
    log('Theme = ' + (dark ? 'Dark' : 'Light'));
  });

  refresh();
  log('Stage 07 demo mounted');
  window.QXFRAME9A7C2_STAGE07_DEMO = Object.freeze({
    virtualList: virtualList,
    list: list,
    largeList: largeList,
    pagination: pagination,
    menu: menu,
    optionList: optionList,
    calendar: calendar,
    timePanel: timePanel,
    colorPanel: colorPanel
  });
})();
