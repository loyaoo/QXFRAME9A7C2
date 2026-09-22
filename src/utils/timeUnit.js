// Canonical pure time algorithms. Components own UI/state; TimeUnit owns parsing/normalization/formatting/math.
function pad(value, size) { return String(value).padStart(size || 2, '0'); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function clone(value) { return value ? { hour: value.hour, minute: value.minute, second: value.second } : null; }
function equal(a, b) { return !!a && !!b && a.hour === b.hour && a.minute === b.minute && a.second === b.second; }
function seconds(value) { return value ? value.hour * 3600 + value.minute * 60 + value.second : -1; }
function fromDate(value) { return value instanceof Date && !Number.isNaN(value.getTime()) ? { hour:value.getHours(), minute:value.getMinutes(), second:value.getSeconds() } : null; }
function meridiem(hour) { return Number(hour) >= 12 ? 'PM' : 'AM'; }
function displayHour(hour) { var value = Number(hour) % 12; return value === 0 ? 12 : value; }
function to24(hour12, period) { var hour = clamp(Number(hour12), 1, 12) % 12; return String(period).toUpperCase() === 'PM' ? hour + 12 : hour; }
function parse(text, options) {
  var opts = options || {};
  var source = String(text || '').trim();
  if (!source) return null;
  var showSecond = opts.showSecond !== false;
  var use12Hours = opts.use12Hours === true;
  var match;
  if (use12Hours) {
    match = source.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
    if (!match) return null;
    var hour12 = Number(match[1]), minute12 = Number(match[2]), second12 = Number(match[3] || 0);
    if (hour12 < 1 || hour12 > 12 || minute12 > 59 || second12 > 59 || (showSecond && match[3] === undefined)) return null;
    return { hour:to24(hour12, match[4]), minute:minute12, second:second12 };
  }
  match = source.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  var hour = Number(match[1]), minute = Number(match[2]), second = Number(match[3] || 0);
  if (hour > 23 || minute > 59 || second > 59 || (showSecond && match[3] === undefined)) return null;
  return { hour:hour, minute:minute, second:second };
}
function normalize(value, options) {
  var opts = options || {};
  var fallbackZero = opts.fallbackZero === true;
  var clampParts = opts.clamp === true;
  var dateValue = fromDate(value);
  if (dateValue) return dateValue;
  if (value === null || value === undefined || value === '') return fallbackZero ? { hour:0, minute:0, second:0 } : null;
  if (typeof value === 'string') {
    if (clampParts && opts.use12Hours !== true) {
      var match = value.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (match) return { hour:clamp(Number(match[1]),0,23), minute:clamp(Number(match[2]),0,59), second:clamp(Number(match[3] || 0),0,59) };
      return fallbackZero ? { hour:0, minute:0, second:0 } : null;
    }
    var use12Hours = opts.use12Hours === 'auto' ? /\b(?:AM|PM)\b/i.test(value) : opts.use12Hours === true;
    var parsed = parse(value, { showSecond:opts.showSecond, use12Hours:use12Hours });
    return parsed || (fallbackZero ? { hour:0, minute:0, second:0 } : null);
  }
  if (value && typeof value === 'object') {
    var hour = Number(value.hour || 0), minute = Number(value.minute || 0), second = Number(value.second || 0);
    if (clampParts) return { hour:clamp(hour,0,23), minute:clamp(minute,0,59), second:clamp(second,0,59) };
    if (Number.isInteger(hour) && Number.isInteger(minute) && Number.isInteger(second) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) return { hour:hour, minute:minute, second:second };
  }
  return fallbackZero ? { hour:0, minute:0, second:0 } : null;
}
function format(value, options) {
  if (!value) return '';
  var opts = options || {};
  var showSecond = opts.showSecond !== false;
  if (opts.use12Hours === true) return pad(displayHour(value.hour)) + ':' + pad(value.minute) + (showSecond ? ':' + pad(value.second) : '') + ' ' + meridiem(value.hour);
  return pad(value.hour) + ':' + pad(value.minute) + (showSecond ? ':' + pad(value.second) : '');
}
function normalizeStrict(value) { return normalize(value, { showSecond:false, use12Hours:'auto' }); }
function normalizeClamped(value) { return normalize(value, { clamp:true, fallbackZero:true, showSecond:false }); }
function format24(value, showSecond) { return format(value, { showSecond:showSecond !== false, use12Hours:false }); }
function now() { var value = new Date(); return fromDate(value); }

export const TimeUnit = Object.freeze({ pad, clamp, clone, equal, seconds, fromDate, meridiem, displayHour, to24, parse, normalize, normalizeStrict, normalizeClamped, format, format24, now });
