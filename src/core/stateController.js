import { ValueEquality } from '../utils/valueEquality.js';
import { mergeOptions } from './options.js';
import { ValueController } from './valueController.js';

function create(options) {
  const opts = mergeOptions({}, options);
  if (!Object.prototype.hasOwnProperty.call(opts, 'controlled')) opts.controlled = Object.prototype.hasOwnProperty.call(opts, 'value');
  return ValueController.create(opts);
}

function createValueBinding(options) {
  return ValueController.createValueBinding(options);
}

function createOptionValueBinding(options, authoredOptions, normalizeValue, config = {}) {
  return ValueController.createOptionValueBinding(options, authoredOptions, normalizeValue, config);
}

export const StateController = Object.freeze({
  create,
  createValueBinding,
  createOptionValueBinding,
  equals: ValueEquality.equals,
  deepEquals: ValueEquality.deep,
  arrayEquals: ValueEquality.array
});

export { create, createValueBinding, createOptionValueBinding };
