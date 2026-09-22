// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

const DAY = 86400000;
const UNITS = Object.freeze(['date', 'week', 'month', 'quarter', 'year']);

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
function clone(value) {
  return isValidDate(value) ? new Date(value.getTime()) : null;
}
function stripTime(value) {
  return isValidDate(value) ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : null;
}
function weekStartsOn(value) {
  var n = Number(value);
  return Number.isFinite(n) ? ((n % 7) + 7) % 7 : 0;
}
function startOfWeek(value, firstDay) {
  var next = stripTime(value);
  if (!next) return null;
  var start = weekStartsOn(firstDay);
  next.setDate(next.getDate() - ((next.getDay() - start + 7) % 7));
  return next;
}
function addDays(value, amount) {
  var next = clone(value);
  if (!next) return null;
  next.setDate(next.getDate() + Number(amount || 0));
  return next;
}
function addMonths(value, amount) {
  var next = clone(value);
  if (!next) return null;
  var day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + Number(amount || 0));
  var last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, last));
  return next;
}
function normalizeUnit(value) {
  var unit = String(value || 'date').toLowerCase();
  if (UNITS.indexOf(unit) < 0) throw new TypeError('[QXFRAME9A7C2] Date unit must be date, week, month, quarter, or year.');
  return unit;
}
function start(value, unit, firstDay, preserveTime) {
  if (!isValidDate(value)) return null;
  var normalizedUnit = normalizeUnit(unit);
  var time = preserveTime === true && normalizedUnit === 'date'
    ? [value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds()]
    : [0, 0, 0, 0];
  var next;
  if (normalizedUnit === 'year') next = new Date(value.getFullYear(), 0, 1);
  else if (normalizedUnit === 'quarter') next = new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);
  else if (normalizedUnit === 'month') next = new Date(value.getFullYear(), value.getMonth(), 1);
  else if (normalizedUnit === 'week') next = startOfWeek(value, firstDay);
  else next = stripTime(value);
  if (next && preserveTime === true && normalizedUnit === 'date') next.setHours(time[0], time[1], time[2], time[3]);
  return next;
}
function compare(left, right, unit, firstDay) {
  var a = start(left, unit, firstDay, false);
  var b = start(right, unit, firstDay, false);
  if (!a || !b) return 0;
  return a.getTime() - b.getTime();
}
function same(left, right, unit, firstDay) {
  return !!left && !!right && compare(left, right, unit, firstDay) === 0;
}
function quarter(value) {
  return isValidDate(value) ? Math.floor(value.getMonth() / 3) + 1 : 0;
}
function weekInfo(value, firstDay) {
  var current = startOfWeek(value, firstDay);
  if (!current) return { year: 0, week: 0 };
  var candidateYear = current.getFullYear();
  var first = startOfWeek(new Date(candidateYear, 0, 4), firstDay);
  if (current < first) {
    candidateYear -= 1;
    first = startOfWeek(new Date(candidateYear, 0, 4), firstDay);
  } else {
    var nextFirst = startOfWeek(new Date(candidateYear + 1, 0, 4), firstDay);
    if (current >= nextFirst) {
      candidateYear += 1;
      first = nextFirst;
    }
  }
  return { year: candidateYear, week: Math.floor((current.getTime() - first.getTime()) / (7 * DAY)) + 1 };
}
function pad(value, size) { return String(value).padStart(size || 2, '0'); }
function defaultFormat(unit, withTime) {
  var normalizedUnit = normalizeUnit(unit);
  var base = normalizedUnit === 'year' ? 'YYYY'
    : normalizedUnit === 'quarter' ? 'YYYY-[Q]Q'
    : normalizedUnit === 'month' ? 'YYYY-MM'
    : normalizedUnit === 'week' ? 'YYYY-[W]WW'
    : 'YYYY-MM-DD';
  return withTime === true ? base + ' HH:mm:ss' : base;
}
function format(value, pattern, context) {
  if (!isValidDate(value)) return '';
  var ctx = context || {};
  var unit = normalizeUnit(ctx.unit || 'date');
  var firstDay = weekStartsOn(ctx.weekStartsOn);
  if (typeof pattern === 'function') return String(pattern(clone(value), Object.freeze({ unit: unit, weekStartsOn: firstDay, withTime: ctx.withTime === true })));
  var source = String(pattern || defaultFormat(unit, ctx.withTime === true));
  var literals = [];
  source = source.replace(/\[([^\]]*)\]/g, function (_, literal) {
    literals.push(literal);
    return '__L' + (literals.length - 1) + '__';
  });
  var week = weekInfo(value, firstDay);
  var replacements = {
    YYYY: unit === 'week' ? String(week.year) : String(value.getFullYear()),
    MM: pad(value.getMonth() + 1),
    DD: pad(value.getDate()),
    HH: pad(value.getHours()),
    mm: pad(value.getMinutes()),
    ss: pad(value.getSeconds()),
    Q: String(quarter(value)),
    WW: pad(week.week)
  };
  var output = source.replace(/YYYY|MM|DD|HH|mm|ss|WW|Q/g, function (token) { return replacements[token]; });
  return output.replace(/__L(\d+)__/g, function (_, index) { return literals[Number(index)] || ''; });
}
function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function compilePattern(pattern) {
  var source = String(pattern || '');
  var tokens = ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'WW', 'Q'];
  var groups = [];
  var regex = '^';
  var cursor = 0;
  while (cursor < source.length) {
    if (source[cursor] === '[') {
      var close = source.indexOf(']', cursor + 1);
      if (close < 0) return null;
      regex += escapeRegExp(source.slice(cursor + 1, close));
      cursor = close + 1;
      continue;
    }
    var token = null;
    for (var i = 0; i < tokens.length; i += 1) {
      if (source.slice(cursor, cursor + tokens[i].length) === tokens[i]) { token = tokens[i]; break; }
    }
    if (!token) {
      regex += escapeRegExp(source[cursor]);
      cursor += 1;
      continue;
    }
    groups.push(token);
    regex += token === 'YYYY' ? '(\\d{4})'
      : token === 'Q' ? '([1-4])'
      : token === 'WW' ? '(\\d{1,2})'
      : '(\\d{1,2})';
    cursor += token.length;
  }
  return { regex: new RegExp(regex + '$'), groups: groups };
}
function parse(value, context) {
  var ctx = context || {};
  var unit = normalizeUnit(ctx.unit || 'date');
  var firstDay = weekStartsOn(ctx.weekStartsOn);
  var withTime = ctx.withTime === true;
  if (isValidDate(value)) return start(value, unit, firstDay, withTime);
  if (typeof value === 'number') {
    var numeric = new Date(value);
    return isValidDate(numeric) ? start(numeric, unit, firstDay, withTime) : null;
  }
  if (value === null || value === undefined || String(value).trim() === '') return null;
  if (typeof ctx.parseInput === 'function') {
    var custom = ctx.parseInput(String(value), Object.freeze({ unit: unit, weekStartsOn: firstDay, withTime: withTime }));
    return isValidDate(custom) ? start(custom, unit, firstDay, withTime) : null;
  }
  if (typeof ctx.format === 'function') return null;
  var pattern = String(ctx.format || defaultFormat(unit, withTime));
  var compiled = compilePattern(pattern);
  if (!compiled) return null;
  var match = String(value).trim().match(compiled.regex);
  if (!match) return null;
  var data = Object.create(null);
  compiled.groups.forEach(function (token, index) { data[token] = Number(match[index + 1]); });
  var year = Number(data.YYYY || new Date().getFullYear());
  if (unit === 'year') return new Date(year, 0, 1);
  if (unit === 'quarter') {
    var q = Number(data.Q || 0);
    return q >= 1 && q <= 4 ? new Date(year, (q - 1) * 3, 1) : null;
  }
  if (unit === 'week') {
    var w = Number(data.WW || 0);
    if (w < 1 || w > 53) return null;
    var first = startOfWeek(new Date(year, 0, 4), firstDay);
    return addDays(first, (w - 1) * 7);
  }
  var month = Number(data.MM || 1);
  var day = unit === 'month' ? 1 : Number(data.DD || 1);
  var hour = withTime ? Number(data.HH || 0) : 0;
  var minute = withTime ? Number(data.mm || 0) : 0;
  var second = withTime ? Number(data.ss || 0) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  var date = new Date(year, month - 1, day, hour, minute, second, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) return null;
  return start(date, unit, firstDay, withTime);
}
function key(value, unit, firstDay) {
  if (!isValidDate(value)) return '';
  var normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === 'year') return String(value.getFullYear());
  if (normalizedUnit === 'quarter') return value.getFullYear() + '-Q' + quarter(value);
  if (normalizedUnit === 'month') return value.getFullYear() + '-' + pad(value.getMonth() + 1);
  if (normalizedUnit === 'week') {
    var info = weekInfo(value, firstDay);
    return info.year + '-W' + pad(info.week);
  }
  return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate());
}

export const DateUnit = Object.freeze({
    units: UNITS,
    isValidDate,
    clone,
    addDays,
    addMonths,
    stripTime,
    weekStartsOn,
    startOfWeek,
    start,
    compare,
    same,
    quarter,
    weekInfo,
    defaultFormat,
    format,
    parse,
    key
});

export { UNITS, isValidDate, clone, addDays, addMonths, stripTime, weekStartsOn, startOfWeek, start, compare, same, quarter, weekInfo, defaultFormat, format, parse, key };
