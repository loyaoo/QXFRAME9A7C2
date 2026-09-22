
function create(options) {
    var settings = options || {};
    var element = settings.element;
    if (!element || element.nodeType !== 1) {
      throw new TypeError('[QXFRAME9A7C2] PopupSurface element must be an Element.');
    }
    var destroyed = false;

    function projectVisible(value, meta) {
      if (destroyed) return false;
      var visible = value === true;
      if (visible && 'hidden' in element) element.hidden = false;
      if (typeof settings.setVisible === 'function') settings.setVisible(visible, element, meta || null);
      if (!visible && 'hidden' in element) element.hidden = true;
      return true;
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      if (Object.prototype.hasOwnProperty.call(next, 'element') && next.element !== element) {
        throw new Error('[QXFRAME9A7C2] PopupSurface element is immutable; destroy and recreate to change it.');
      }
      if (Object.prototype.hasOwnProperty.call(next, 'setVisible')) settings.setVisible = next.setVisible;
      return api;
    }

    function destroy() {
      if (destroyed) return false;
      destroyed = true;
      return true;
    }

    var api = Object.freeze({
      show: function (meta) { return projectVisible(true, meta); },
      hide: function (meta) { return projectVisible(false, meta); },
      setVisible: projectVisible,
      updateOptions: updateOptions,
      getElement: function () { return element; },
      getState: function () {
        return Object.freeze({ hidden: 'hidden' in element ? element.hidden === true : false, destroyed: destroyed });
      },
      destroy: destroy
    });
    return api;
  }

export const PopupSurface = Object.freeze({ create });
export { create };
