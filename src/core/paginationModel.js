
import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { StateController } from './stateController.js';

function positiveInt(value, fallback) {
  var number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeInt(value) {
  var number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalizeJump(value, pageCount) {
  var number = Number(value);
  if (!Number.isFinite(number) || number <= 0) number = 0.1;
  if (number > 0 && number < 1) return Math.max(1, Math.round(pageCount * number));
  return Math.max(1, Math.floor(number));
}

function create(options) {
  var opts = mergeOptions({
    page: 1,
    pageSize: 10,
    total: 0,
    pagerCount: 9,
    first: true,
    last: true,
    ellipsis: true,
    ellipsisJump: 0.1
  }, options);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var pageSize = positiveInt(opts.pageSize, 10);
  var total = nonNegativeInt(opts.total);
  var pagerCount = Math.max(3, positiveInt(opts.pagerCount, 9));
  var first = opts.first !== false;
  var last = opts.last !== false;
  var ellipsis = opts.ellipsis !== false;
  var ellipsisJump = opts.ellipsisJump;
  var pageState = null;
  var api = null;

  function pageCount() {
    return total > 0 ? Math.floor((total - 1) / pageSize) + 1 : 0;
  }

  function clampPage(value) {
    var count = pageCount();
    if (count <= 0) return 1;
    return Math.max(1, Math.min(count, positiveInt(value, 1)));
  }

  pageState = StateController.create({ value: clampPage(opts.page), normalizeValue: clampPage, controlled: false });
  function currentPage() { return pageState.value; }

  function snapshot() {
    var count = pageCount();
    var startIndex = count > 0 ? (currentPage() - 1) * pageSize : 0;
    var endIndex = count > 0 ? Math.min(total, startIndex + pageSize) : 0;
    return Object.freeze({
      page: currentPage(),
      pageSize: pageSize,
      total: total,
      pageCount: count,
      startIndex: startIndex,
      endIndex: endIndex,
      hasPrevious: count > 0 && currentPage() > 1,
      hasNext: count > 0 && currentPage() < count,
      pagerCount: pagerCount,
      first: first,
      last: last,
      ellipsis: ellipsis,
      ellipsisJump: ellipsisJump,
      destroyed: destroyed
    });
  }

  function notify(reason, previous, meta) {
    var detail = mergeOptions({
      reason: reason,
      previousState: previous,
      state: snapshot(),
      source: 'api',
      controller: api
    }, meta);
    if (detail.silent !== true) {
      if (typeof opts.onChange === 'function') opts.onChange(detail.state, detail);
      emitter.emit('change', detail);
    }
    return true;
  }

  function setPage(next, meta) {
    if (destroyed) return false;
    var normalized = clampPage(next);
    if (normalized === currentPage()) return true;
    var previous = snapshot();
    pageState.setValue(normalized, { silent:true, source:meta && meta.source || 'api', reason:meta && meta.reason || 'page' });
    return notify('page', previous, meta);
  }

  function setPageSize(next, meta) {
    if (destroyed) return false;
    var normalized = positiveInt(next, pageSize);
    if (normalized === pageSize) return true;
    var previous = snapshot();
    var firstIndex = previous.pageCount > 0 ? (currentPage() - 1) * pageSize : 0;
    var recommendPage = Math.floor(firstIndex / normalized) + 1;
    pageSize = normalized;
    pageState.setValue(clampPage(recommendPage), { silent:true, source:meta && meta.source || 'api', reason:'page-size' });
    return notify('page-size', previous, mergeOptions({ recommendPage: recommendPage }, meta));
  }

  function setTotal(next, meta) {
    if (destroyed) return false;
    var normalized = nonNegativeInt(next);
    if (normalized === total) return true;
    var previous = snapshot();
    total = normalized;
    pageState.setValue(clampPage(currentPage()), { silent:true, source:meta && meta.source || 'api', reason:'total' });
    return notify('total', previous, meta);
  }

  function pageToken(pageNumber, role) {
    return {
      type: 'page',
      page: pageNumber,
      current: pageNumber === currentPage(),
      role: role || 'window'
    };
  }

  function buildTokens(start, end, settings) {
    var count = pageCount();
    var tokens = [];
    var useFirst = settings.first;
    var useLast = settings.last;
    var useEllipsis = settings.ellipsis;
    var jumpSetting = settings.ellipsisJump;

    function appendGap(direction, hiddenStart, hiddenEnd) {
      if (hiddenStart > hiddenEnd) return;
      var hiddenCount = hiddenEnd - hiddenStart + 1;
      if (hiddenCount === 1) {
        tokens.push(pageToken(hiddenStart, 'gap-fill'));
        return;
      }
      if (!useEllipsis) return;
      var jump = normalizeJump(jumpSetting, count);
      var rawTarget = currentPage() + (direction === 'right' ? jump : -jump);
      var target = Math.max(hiddenStart, Math.min(hiddenEnd, rawTarget));
      tokens.push({
        type: 'ellipsis',
        direction: direction,
        hiddenStart: hiddenStart,
        hiddenEnd: hiddenEnd,
        hiddenCount: hiddenCount,
        target: target,
        jump: jump
      });
    }

    if (useFirst && start > 1) tokens.push(pageToken(1, 'first'));

    var leftHiddenStart = useFirst ? 2 : 1;
    appendGap('left', leftHiddenStart, start - 1);

    for (var number = start; number <= end; number += 1) {
      if (number < 1 || number > count) continue;
      if (useFirst && number === 1 && tokens.some(function (token) { return token.type === 'page' && token.page === 1; })) continue;
      tokens.push(pageToken(number, number === 1 && useFirst ? 'first' : number === count && useLast ? 'last' : 'window'));
    }

    var rightHiddenEnd = useLast ? count - 1 : count;
    appendGap('right', end + 1, rightHiddenEnd);

    if (useLast && count > 1 && end < count) tokens.push(pageToken(count, 'last'));

    var deduped = [];
    var seenPages = Object.create(null);
    tokens.forEach(function (token) {
      if (token.type !== 'page') {
        deduped.push(token);
        return;
      }
      if (seenPages[token.page]) return;
      seenPages[token.page] = true;
      deduped.push(token);
    });
    return deduped;
  }

  function pageTokenCount(tokens) {
    return tokens.reduce(function (sum, token) { return sum + (token.type === 'page' ? 1 : 0); }, 0);
  }

  function minimalTokens(settings) {
    var count = pageCount();
    var pages = [];
    if (settings.first) pages.push(1);
    pages.push(currentPage());
    if (settings.last && count > 1) pages.push(count);
    var seen = Object.create(null);
    return pages.filter(function (number) {
      if (seen[number]) return false;
      seen[number] = true;
      return true;
    }).map(function (number) {
      return pageToken(number, number === 1 && settings.first ? 'first' : number === count && settings.last ? 'last' : 'window');
    });
  }

  function deriveItems(config) {
    var count = pageCount();
    if (destroyed || count <= 0) return [];
    var settings = mergeOptions({
      pagerCount: pagerCount,
      first: first,
      last: last,
      ellipsis: ellipsis,
      ellipsisJump: ellipsisJump
    }, config);
    var budget = Math.max(3, positiveInt(settings.pagerCount, pagerCount));
    settings.first = settings.first !== false;
    settings.last = settings.last !== false;
    settings.ellipsis = settings.ellipsis !== false;

    if (count <= budget) {
      var all = [];
      for (var number = 1; number <= count; number += 1) all.push(pageToken(number, number === 1 ? 'first' : number === count ? 'last' : 'window'));
      return all;
    }

    var start = currentPage();
    var end = currentPage();
    var currentTokens = buildTokens(start, end, settings);
    if (currentTokens.length > budget) return minimalTokens(settings).slice(0, budget);

    while (true) {
      var candidates = [];
      if (start > 1) {
        var leftTokens = buildTokens(start - 1, end, settings);
        if (leftTokens.length <= budget) candidates.push({ start: start - 1, end: end, tokens: leftTokens, side: 'left' });
      }
      if (end < count) {
        var rightTokens = buildTokens(start, end + 1, settings);
        if (rightTokens.length <= budget) candidates.push({ start: start, end: end + 1, tokens: rightTokens, side: 'right' });
      }
      if (!candidates.length) break;

      candidates.sort(function (a, b) {
        var pageDelta = pageTokenCount(b.tokens) - pageTokenCount(a.tokens);
        if (pageDelta) return pageDelta;
        var slotDelta = b.tokens.length - a.tokens.length;
        if (slotDelta) return slotDelta;
        var aBalance = Math.abs((currentPage() - a.start) - (a.end - currentPage()));
        var bBalance = Math.abs((currentPage() - b.start) - (b.end - currentPage()));
        if (aBalance !== bBalance) return aBalance - bBalance;
        return a.side === 'left' ? -1 : 1;
      });

      start = candidates[0].start;
      end = candidates[0].end;
      currentTokens = candidates[0].tokens;
    }

    return currentTokens;
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.prototype.hasOwnProperty.call(Object(next), 'pagerCount')) pagerCount = Math.max(3, positiveInt(next.pagerCount, pagerCount));
    if (Object.prototype.hasOwnProperty.call(Object(next), 'first')) first = next.first !== false;
    if (Object.prototype.hasOwnProperty.call(Object(next), 'last')) last = next.last !== false;
    if (Object.prototype.hasOwnProperty.call(Object(next), 'ellipsis')) ellipsis = next.ellipsis !== false;
    if (Object.prototype.hasOwnProperty.call(Object(next), 'ellipsisJump')) ellipsisJump = next.ellipsisJump;
    if (Object.prototype.hasOwnProperty.call(Object(next), 'pageSize')) pageSize = positiveInt(next.pageSize, pageSize);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'total')) total = nonNegativeInt(next.total);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'page')) pageState.setValue(clampPage(next.page), { silent:true, source:'options', reason:'page' });
    else pageState.setValue(clampPage(currentPage()), { silent:true, source:'options', reason:'clamp' });
    opts = mergeOptions(opts, next);
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    emitter.dispose();
    if (pageState) pageState.destroy();
    pageState = null;
    return true;
  }

  api = {
    setPage: setPage,
    setPageSize: setPageSize,
    setTotal: setTotal,
    previous: function (meta) { return setPage(currentPage() - 1, mergeOptions({ reason: 'previous' }, meta)); },
    next: function (meta) { return setPage(currentPage() + 1, mergeOptions({ reason: 'next' }, meta)); },
    first: function (meta) { return setPage(1, mergeOptions({ reason: 'first' }, meta)); },
    last: function (meta) { return setPage(pageCount(), mergeOptions({ reason: 'last' }, meta)); },
    deriveItems: deriveItems,
    snapshot: snapshot,
    getValueController: function () { return pageState; },
    updateOptions: updateOptions,
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
  Object.defineProperties(api, {
    page: { enumerable: true, get: currentPage },
    pageSize: { enumerable: true, get: function () { return pageSize; } },
    total: { enumerable: true, get: function () { return total; } },
    pageCount: { enumerable: true, get: pageCount },
    pagerCount: { enumerable: true, get: function () { return pagerCount; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });
  return api;
}

export const PaginationModel = Object.freeze({ create });
export { create };
