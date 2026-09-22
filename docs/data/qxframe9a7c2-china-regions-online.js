(function (global) {
  'use strict';

  var SOURCE_URL = 'https://raw.githubusercontent.com/mumuy/data_location/refs/heads/master/list.json';
  var SOURCE_PAGE = 'https://github.com/mumuy/data_location';
  var SOURCE_VERSION = '2026-04';
  var LOAD_TIMEOUT = 12000;
  var loadPromise = null;

  function item(code, name) { return { key: String(code), value: String(code), label: String(name) }; }
  function directLabel(provinceName) {
    return String(provinceName || '').indexOf('自治区') >= 0 ? '自治区直辖县级行政区划' : '省直辖县级行政区划';
  }

  function build(flat) {
    if (!flat || Object.prototype.toString.call(flat) !== '[object Object]') throw new TypeError('invalid region dataset');
    var codes = Object.keys(flat).filter(function (code) {
      return /^\d{6}$/.test(code) && typeof flat[code] === 'string' && flat[code].length > 0;
    }).sort();
    if (codes.length < 1000) throw new Error('region dataset is unexpectedly incomplete');

    var provinces = codes.filter(function (code) { return code.slice(2) === '0000'; });
    var cityCodeSet = Object.create(null);
    codes.forEach(function (code) {
      if (code.slice(4) === '00' && code.slice(2) !== '0000') cityCodeSet[code] = true;
    });

    var citiesByProvince = Object.create(null);
    var areasByCity = Object.create(null);
    var directProvince = { '11': true, '12': true, '31': true, '50': true, '81': true, '82': true };

    provinces.forEach(function (provinceCode) {
      var prefix = provinceCode.slice(0, 2);
      var provinceName = flat[provinceCode];
      var areaCodes = codes.filter(function (code) {
        return code.slice(0, 2) === prefix && code.slice(4) !== '00';
      });

      if (directProvince[prefix]) {
        citiesByProvince[provinceCode] = [item(provinceCode, provinceName)];
        areasByCity[provinceCode] = areaCodes.map(function (code) { return item(code, flat[code]); });
        return;
      }

      var cityCodes = codes.filter(function (code) {
        return code.slice(0, 2) === prefix && code.slice(4) === '00' && code.slice(2) !== '0000';
      });
      citiesByProvince[provinceCode] = cityCodes.map(function (code) { return item(code, flat[code]); });

      cityCodes.forEach(function (cityCode) {
        var cityPrefix = cityCode.slice(0, 4);
        areasByCity[cityCode] = areaCodes.filter(function (areaCode) {
          return areaCode.slice(0, 4) === cityPrefix;
        }).map(function (code) { return item(code, flat[code]); });
      });

      var unassigned = areaCodes.filter(function (areaCode) {
        return !cityCodeSet[areaCode.slice(0, 4) + '00'];
      });
      if (unassigned.length) {
        var directKey = provinceCode + '-direct';
        citiesByProvince[provinceCode].push(item(directKey, directLabel(provinceName)));
        areasByCity[directKey] = unassigned.map(function (code) { return item(code, flat[code]); });
      }
    });

    var provinceItems = provinces.map(function (code) { return item(code, flat[code]); });
    var cascaderItems = provinceItems.map(function (province) {
      return { key: province.key, value: province.value, label: province.label, items: (citiesByProvince[province.value] || []).map(function (city) {
        return { key: city.key, value: city.value, label: city.label, items: (areasByCity[city.value] || []).map(function (area) { return { key: area.key, value: area.value, label: area.label }; }) };
      }) };
    });
    return {
      sourceUrl: SOURCE_URL,
      sourcePage: SOURCE_PAGE,
      sourceVersion: SOURCE_VERSION,
      provinces: provinceItems,
      citiesByProvince: citiesByProvince,
      areasByCity: areasByCity,
      cascaderItems: cascaderItems,
      rawCount: codes.length
    };
  }

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise(function (resolve, reject) {
      if (!global.fetch) { reject(new Error('fetch is unavailable')); return; }
      var controller = typeof global.AbortController === 'function' ? new global.AbortController() : null;
      var timeoutId = global.setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('China region dataset load timed out'));
      }, LOAD_TIMEOUT);
      var request = { cache: 'no-store', credentials: 'omit' };
      if (controller) request.signal = controller.signal;
      global.fetch(SOURCE_URL, request).then(function (response) {
        if (!response.ok) throw new Error('region dataset HTTP ' + response.status);
        return response.json();
      }).then(function (flat) {
        global.clearTimeout(timeoutId);
        resolve(build(flat));
      }).catch(function (error) {
        global.clearTimeout(timeoutId);
        loadPromise = null;
        reject(error && error.name === 'AbortError' ? new Error('China region dataset load timed out') : error);
      });
    });
    return loadPromise;
  }

  global.QXFRAME9A7C2DemoChinaRegions = Object.freeze({
    sourceUrl: SOURCE_URL,
    sourcePage: SOURCE_PAGE,
    sourceVersion: SOURCE_VERSION,
    load: load
  });
}(window));
