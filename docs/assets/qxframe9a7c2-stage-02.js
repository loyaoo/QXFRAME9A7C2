
(function (window, document) {
  'use strict';

  var brand = window.QXFRAME9A7C2;
  var registry = brand.CoreRegistry;
  var Events = brand.Core.Events;
  var Lifecycle = brand.Core.Lifecycle;
  var Scheduler = brand.Core.Scheduler;
  var DOM = brand.Core.DOM;

  function byId(id) { return document.getElementById(id); }
  function output(id, text) { DOM.setText(byId(id), text); }

  var eventEmitter = Events.createEmitter();
  var eventLog = [];
  var eventCounter = 0;

  eventEmitter.on('demo', function (payload) { eventLog.push('on: ' + payload.value); });
  eventEmitter.once('demo', function (payload) { eventLog.push('once: ' + payload.value); });

  DOM.listen(byId('stage02-event-run'), 'click', function () {
    eventCounter += 1;
    var count = eventEmitter.emit('demo', { value: eventCounter });
    output('stage02-event-output',
      'emit #' + eventCounter + '\n' +
      '本次 listener 数: ' + count + '\n' +
      '当前 listenerCount: ' + eventEmitter.listenerCount('demo') + '\n' +
      eventLog.join('\n')
    );
  });

  var lifecycleScope = null;
  var resourceClicks = 0;

  function resetLifecycleScope() {
    if (lifecycleScope) lifecycleScope.dispose();
    lifecycleScope = Lifecycle.createScope();
    var removeListener = DOM.listen(byId('stage02-resource-button'), 'click', function () {
      resourceClicks += 1;
      output('stage02-lifecycle-output',
        '资源 listener 已触发: ' + resourceClicks + '\n' +
        'scope.size(): ' + lifecycleScope.size() + '\n' +
        'disposed: ' + lifecycleScope.disposed
      );
    });
    lifecycleScope.add(removeListener);
    output('stage02-lifecycle-output',
      '资源已创建\nscope.size(): ' + lifecycleScope.size() + '\ndisposed: ' + lifecycleScope.disposed
    );
  }

  DOM.listen(byId('stage02-lifecycle-create'), 'click', resetLifecycleScope);
  DOM.listen(byId('stage02-lifecycle-dispose'), 'click', function () {
    if (!lifecycleScope) resetLifecycleScope();
    var first = lifecycleScope.dispose();
    var second = lifecycleScope.dispose();
    output('stage02-lifecycle-output',
      'dispose #1 errors: ' + first.length + '\n' +
      'dispose #2 errors: ' + second.length + '\n' +
      'scope.size(): ' + lifecycleScope.size() + '\n' +
      'disposed: ' + lifecycleScope.disposed
    );
  });

  var scheduler = Scheduler.createFrameScheduler(function (_, reason) {
    output('stage02-scheduler-output',
      '最后 reason: ' + String(reason) + '\n' +
      'requestCount: ' + scheduler.requestCount + '\n' +
      'runCount: ' + scheduler.runCount + '\n' +
      'pending: ' + scheduler.pending
    );
  });

  DOM.listen(byId('stage02-scheduler-run'), 'click', function () {
    var index;
    for (index = 1; index <= 20; index += 1) scheduler.request('request-' + index);
    output('stage02-scheduler-output',
      '已连续 request 20 次，等待同一 frame 合并执行...\n' +
      'requestCount: ' + scheduler.requestCount + '\n' +
      'runCount: ' + scheduler.runCount + '\n' +
      'pending: ' + scheduler.pending
    );
  });

  DOM.listen(byId('stage02-dependency-run'), 'click', function () {
    try {
      registry.assert(['DefinitelyMissingCore'], 'Stage02Demo');
      output('stage02-dependency-output', 'FAIL：预期应抛出缺失依赖错误。');
    } catch (error) {
      output('stage02-dependency-output', 'PASS：缺失依赖被明确拒绝。\n' + error.message);
    }
  });

  output('stage02-registry-output',
    registry.list().map(function (record) {
      return record.name + ' <- [' + record.dependencies.join(', ') + ']';
    }).join('\n')
  );

  resetLifecycleScope();

  window.QXFRAME9A7C2Stage02Demo = {
    eventEmitter: eventEmitter,
    getLifecycleScope: function () { return lifecycleScope; },
    scheduler: scheduler
  };
})(window, document);
