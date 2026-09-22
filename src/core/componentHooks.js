// Stage 35→40 preparation: internal lifecycle hooks used by Component and future Family Base classes.
// Hooks are symbols so subclasses can customize lifecycle phases without replacing the public shell.
export const componentHooks = Object.freeze({
    render: Symbol('QXFRAME9A7C2.Component.render'),
    mount: Symbol('QXFRAME9A7C2.Component.mount'),
    reload: Symbol('QXFRAME9A7C2.Component.reload'),
    beforeOptionsUpdate: Symbol('QXFRAME9A7C2.Component.beforeOptionsUpdate'),
    optionsUpdated: Symbol('QXFRAME9A7C2.Component.optionsUpdated'),
    beforeDestroy: Symbol('QXFRAME9A7C2.Component.beforeDestroy'),
    afterDestroy: Symbol('QXFRAME9A7C2.Component.afterDestroy')
});
