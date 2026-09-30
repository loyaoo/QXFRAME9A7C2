import { SemanticProjection } from '../core/semanticProjection.js';

function isPlainObject(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function create(options = {}) {
  const slots = options.slots || {};
  if (!isPlainObject(slots)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles slots must be a plain object.');

  const names = Object.keys(slots);
  const projection = SemanticProjection.create({
    instance: options.instance || null,
    names,
    defaultClassSlot: options.defaultClassSlot || null,
    defaultStyleSlot: options.defaultStyleSlot || null,
    options: { class: options.class, style: options.style }
  });
  projection.setElements(slots);

  let currentClass = options.class;
  let currentStyle = options.style;
  let destroyed = false;

  function update(next = {}) {
    if (destroyed) return api;
    if (!isPlainObject(next)) throw new TypeError('[QXFRAME9A7C2] SemanticStyles update expects a plain object.');
    Object.keys(next).forEach(key => {
      if (key !== 'class' && key !== 'style') throw new TypeError('[QXFRAME9A7C2] SemanticStyles update accepts only class/style.');
    });
    if (Object.prototype.hasOwnProperty.call(next, 'class')) currentClass = next.class;
    if (Object.prototype.hasOwnProperty.call(next, 'style')) currentStyle = next.style;
    projection.sync({ class: currentClass, style: currentStyle });
    return api;
  }
  function getState() {
    const state = projection.getState();
    return Object.freeze({
      class: currentClass,
      style: currentStyle,
      slots: state.names.slice(),
      destroyed
    });
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    return projection.destroy();
  }
  const api = Object.freeze({ update, getState, destroy });
  return api;
}

export const SemanticStyles = Object.freeze({ create });
export { create };
