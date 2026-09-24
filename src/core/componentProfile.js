import { Utils } from '../utils/utils.js';

const CAPABILITIES = Object.freeze(['value', 'focus', 'interaction', 'capability', 'motion', 'selection', 'overlay', 'feedback', 'theme', 'tokens', 'form']);
const CONTROLLERS = Object.freeze(['ValueController', 'FocusController', 'InteractionController', 'CapabilityController', 'MotionController', 'SelectionController', 'OverlayController', 'FeedbackController', 'ThemeController', 'TokenController', 'FormController']);
const TOP_LEVEL = Object.freeze(['name'].concat(CAPABILITIES, ['ownership', 'dependencies', 'adapter', 'metadata']));

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  var proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function freezeValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeValue));
  if (!isPlainObject(value)) return value;
  var output = {};
  Object.keys(value).forEach(function (key) { if (Utils.safeOwnKey(key)) output[key] = freezeValue(value[key]); });
  return Object.freeze(output);
}

function validate(profile) {
  if (!profile || typeof profile !== 'object') throw new TypeError('[QXFRAME9A7C2] ComponentProfile must be an object.');
  var name = String(profile.name || '').trim();
  if (!name) throw new TypeError('[QXFRAME9A7C2] ComponentProfile name must not be empty.');
  Object.keys(profile).forEach(function (key) {
    if (TOP_LEVEL.indexOf(key) < 0) throw new TypeError('[QXFRAME9A7C2] Unknown ComponentProfile field: ' + key);
  });
  var ownership = profile.ownership || {};
  Object.keys(ownership).forEach(function (key) {
    if (CAPABILITIES.indexOf(key) < 0) throw new TypeError('[QXFRAME9A7C2] Unknown ComponentProfile ownership capability: ' + key);
    if (CONTROLLERS.indexOf(String(ownership[key])) < 0) throw new TypeError('[QXFRAME9A7C2] Unknown ComponentProfile controller: ' + ownership[key]);
  });
  var dependencies = profile.dependencies || {};
  Object.keys(dependencies).forEach(function (key) {
    if (CAPABILITIES.indexOf(key) < 0) throw new TypeError('[QXFRAME9A7C2] Unknown ComponentProfile dependency capability: ' + key);
    if (!Array.isArray(dependencies[key])) throw new TypeError('[QXFRAME9A7C2] ComponentProfile dependencies must be arrays.');
    dependencies[key].forEach(function (dependency) {
      if (CAPABILITIES.indexOf(String(dependency)) < 0) throw new TypeError('[QXFRAME9A7C2] Unknown ComponentProfile dependency: ' + dependency);
    });
  });
  return true;
}

function define(profile) {
  validate(profile);
  var output = {};
  TOP_LEVEL.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(profile, key)) output[key] = key === 'name' ? String(profile.name).trim() : freezeValue(profile[key]);
  });
  return Object.freeze(output);
}

export const ComponentProfile = Object.freeze({ define, validate, capabilities: CAPABILITIES, controllers: CONTROLLERS });
export { define, validate };
