# QXFRAME9A7C2 Config lifecycle semantics

`Core.Config` has three explicit update classes. Component and service code must not invent a fourth behavior.

| Class | Examples | Existing instances |
| --- | --- | --- |
| Live CSS config | theme, canonical semantic tokens | Updates through the canonical theme/token boundary without recreating components. |
| Live runtime config | motion / reduced-motion policy | Existing runtime owners observe the canonical Config motion signal and remove JS/CSS delay when motion is disabled. |
| Snapshot default | size, variant, focusOutline, trigger open/close delay defaults | Resolved when an instance is created unless that component explicitly documents a live option update. Later global Config changes do not silently rewrite an instance option snapshot. |

Scoped Config follows the same categories but is resolved from the nearest Config scope. Portal/overlay surfaces receive a captured/projected ThemeContext instead of creating a second theme resolver.

Service instances such as Message, Notification, Modal service and Loading service may read/resolve Config defaults. They must never call `Config.configure()` or otherwise write global Config as a side effect of create/open/close/destroy.
