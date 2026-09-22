# QXFRAME9A7C2 v2.19.81 hardening notes

本轮不是组件外观调整，而是针对 Layui / Bootstrap 早中期历史中反复出现的高风险根因进行底层收口。

## 已收口的高风险问题

1. **Overlay orphan lifecycle**：父层销毁时 portal 子层不再残留。
2. **Logical focus containment**：Modal/Drawer FocusTrap 不再把逻辑子 Popup 的焦点误判为“跑出弹层”。
3. **Root-family z-order**：旧 root 的 Tooltip/Popup 不可跨越后来打开的新 Modal；Notice/Blocking 仍是全局平面。
4. **Table stale state**：数据替换后不再残留已不存在行的 selection/expanded key。
5. **Table fixed geometry**：字符串/CSS 宽度及 responsive hidden 列不再造成 sticky offset 错位。
6. **Module dependency truth**：静态 ESM import graph 与 Rollup build 阶段验证缺依赖和 dependency cycle；运行时 Registry dependency locator 已删除。
7. **URL sinks**：统一 URL scheme policy，阻止 `javascript:` 等危险导航入口。
8. **Focus correctness**：`.focus()` 未抛异常不再被视为必然成功。
9. **ScrollLock**：自定义滚动容器、inline-end、nested lock、fixed/sticky compensation 收口。
10. **Late async callback**：PositionAdapter destroy 后的迟到 reject 不再回调已销毁实例。
11. **Form ownership**：原生字段跨容器移动时保持原 `<form>` 所有权。
12. **CSS compatibility projector**：由全页面反复扫描改为 mutation/event 驱动的脏子树增量刷新。

## 结构不变量

- `src` 是唯一 source of truth。
- `dist JS` 必须由 Rollup 从静态 ESM source graph 生成；旧 kernel / `src/modules` 不再是 runtime source。
- `dist CSS === src CSS`。
- Public CSS 不依赖 `@layer / :is() / :has() / :dir()`。
- ESM dependency/import graph failure must在 build/verify 阶段 fail-fast，不得延迟到发布后。


## Identity / lifecycle follow-up

- Virtualizer variable-size measurements are keyed by stable item keys instead of array indexes. Reorder and same-count data replacement no longer reuse another item's geometry.
- VirtualList rejects duplicate keys and renders nullish default items as empty text.
- Table supports `preserveSelectedKeys` (default `false`) for explicit remote-pagination selection retention.
- Table edit mode consumes Enter on single-line editors by default (`editEnterBehavior: "commit"`), while textarea/contenteditable keep native Enter.
- Modal and Drawer `destroyOnHidden` now remove rendered user title/content/footer DOM while hidden and recreate it on reopen.
- Config inherits an already declared document light/dark theme on bootstrap to avoid theme flash.
- Menu-generated DOM ids are instance-scoped.
- The framework intentionally does not provide an auxiliary semantic-assistance layer or generate helper semantic attributes.

## Transaction / async / render ownership follow-up

本轮继续把跨组件状态一致性收口到公共底层，而不是在单个组件里追加临时判断：

- Upload 的异步 `beforeUpload` 绑定到结构 mutation generation。受控 `setValue()`、clear/reset 类替换或 destroy 后，旧 preflight Promise 不再把文件重新写回。
- Cascader 的 `setItems()` 与 `updateOptions({items})` 统一走 dataset replacement；替换数据源会使旧 lazy-load generation 失效，并清理旧 loaded/loading/path 状态。同 key 的新数据源也不会被旧 Promise 覆盖。
- Collection / Selection / ValueDraft / ActiveItem 使用 mutation version 保护 `before*` 回调重入。回调内部发生新的 mutation、options change 或 destroy 后，外层旧 transaction 会作为 stale transaction 放弃提交。
- Renderer 建立 owned render 生命周期。公共 Component / BuildingBlock 创建出的 root 自动记录 owner；Renderer replace/dispose 会先释放离开的 owned child。Modal/Drawer 的 `destroyOnHidden` 与实例 `destroy()` 因此会真正释放动态子组件，而不只是 remove DOM。
- TreeModel duplicate key 改为 fail-fast，不再静默跳过后续节点。
- FormBridge 对自动生成的 form id 使用共享引用计数；只有最后一个 bridge 释放后才撤销自动 id。
- 当前 runtime 不再存在 source/runtime module loader；循环依赖由静态 ESM import-graph verifier 与 Rollup build 阶段直接拒绝。

### 新增不变量

- 旧 Promise / 旧 transaction / 旧 datasource generation 不得覆盖更新后的状态。
- keyed collection 遇到 duplicate key 必须 fail-fast。
- DOM removal 与 owned child destroy 必须由 Renderer ownership 协议统一处理。
- 共享生成资源必须按 owner 引用计数释放。
- source ESM graph 与 production Rollup bundle 必须共享同一静态 dependency graph，并保持 cycle = 0。
- release entry 必须保持纯静态浏览器依赖图：bare import / dynamic import / Node builtin / `import.meta` 均为 0；source UMD entry 必须在 Chromium 中验证只发布 `globalThis.QXFRAME9A7C2`，不得泄漏辅助 bundle global 或 Floating UI vendor global。
- Rollup production build 优先标准 `rollup`，可回退到同版本官方 `@rollup/wasm-node`，但不得回退到旧 concat/custom bundler。
- npm 根入口与公开 preserveModules 子路径必须共享同一模块图和 class/singleton identity；单文件 ESM bundle 只能作为显式独立入口，不能作为 npm 根入口。
- 公开 `components/*` / `core/*` / `utils/*` 子路径必须可独立 import，不得依赖根 runtime 的迁移期 dependency injection。
- vendored third-party runtime 必须随发布包保留授权/归属 notice。

## Static style inspection follow-up

- `docs/all-components-static.html` is a JS-free CSS visual inspection page built from complete static component/application scenarios.
- Uses only visually meaningful component/application scenarios; standalone IconList, Grid utility matrices and selector-branch cards are intentionally omitted.
- Fixed roots are converted to local absolute positioning only inside the inspection page; production CSS is unchanged.
- While generating the page, Menu exposed a deterministic `menuInstanceId` initialization regression. `Menu.create()` now assigns an instance id from `menuSequence` before authored item ids are generated.


## Static visual inspection matrix

`docs/all-components-static.html` uses component/application scenarios as the inspection unit. It does not render isolated selector cards, Grid utility matrices or a standalone icon list; floating/hidden structures remain localized inside their owning scenario.

## Global floating root positioning contract

全局浮动组件统一遵循单一 viewport owner：只有最外层 root / 独立浮动根允许 `position:fixed`；组件内部的 mask、stage、toolbar、title、counter、navigation、close 等结构只能使用 `absolute/relative`，并以 root 为坐标系。

当前允许的 framework fixed roots：

- `.qxframe9a7c2-modal-root`
- `.qxframe9a7c2-drawer-root`
- `.qxframe9a7c2-notice-stack`
- `.qxframe9a7c2-loading-root`
- `.qxframe9a7c2-sort-overlay`
- `.qxframe9a7c2-upload-preview-root`
- `.qxframe9a7c2-image-preview-root`

发布/架构验证工具会拒绝其它 framework selector 新增 `position:fixed`。Image Preview 内部 chrome 已全部改为 root-relative absolute positioning，stage 与 image size 也不再直接依赖 viewport 单位。


## Static CSS inspection: no viewport-fixed specimens

`docs/all-components-static.html` is a CSS-only inspection surface. Production floating roots may use `position:fixed`, but the inspection page must localize every such root inside its specimen container with `position:absolute`. The build now verifies that all production fixed-root selectors are covered by the inspection-page override and that the page contains no `<script>` tag.

### Static CSS inspection scope

`docs/all-components-static.html` intentionally does not render a standalone `Foundation / Shared CSS` gallery. Shared tokens, themes and generic state selectors are inspected only through the real component DOM they style; no standalone selector cards are generated.


## Scenario-only visual inspection and LTR-only public contract

- `docs/all-components-static.html` no longer contains a CSS selector-branch matrix. A class is shown only where it participates in a complete, understandable component/application DOM scenario.
- Standalone IconList and Grid galleries are omitted because they do not provide useful component-style inspection value. Font icons remain visible wherever actual components use them.
- Ripple inspection freezes real inside/outside waves at a visible mid-click state instead of displaying empty ripple hosts.
- Badge count and ribbon styles are attached to real target elements; status badges are shown in a service-status context. Descriptions is shown only as a complete composed table.
- Public RTL support is removed from authored modules/CSS/docs. Rate and Scroll no longer expose RTL/direction behavior; Badge/Switch RTL state selectors are removed. Build checks reject public RTL state classes/options.

## fix(9) Observer / selector / interaction hardening

- 修复 `ObserverHub` 的 observer constructor 解析：普通 options 对象继承的 `Object.prototype.constructor` 不再被误当作 `ResizeObserver / MutationObserver / IntersectionObserver` 构造器。显式 own-property 注入仍受支持。
- `tools/verify-core.js` 新增三类 Observer 的运行时回归，覆盖普通 `{}`、原型链污染/继承值与显式 constructor 注入。
- `Core.DOM` 增加 `query()` / `resolveElement()`，统一处理组件公开配置中的 selector / Element 输入；非法 selector fail-closed，避免原生 `DOMException` 泄漏。Tooltip、Popover、Trigger、Dropdown、Control、TextField、PickerFieldBase、Cascader、Menu、Modal、Table、Drawer、Autocomplete、TreeSelect、Select 已迁移到该入口。
- `Core.DOM.isComposingEvent()` 成为统一 IME composition 判定；`PressInteraction`、`DismissableLayer`、`KeyboardNavigation` 及相关组件不再各自复制 `event.isComposing / keyCode === 229`。
- 新增 `EventDelegation` native-event identity 回归，确保同一 delegate root 上 click / mouseenter 等不同 native event bucket 不串扰。
- 新增 `LayerManager` 语义层级回归，覆盖同 root family 子层、tooltip/popup/modal 相对层级、notice 全局平面，以及旧 root family 不得越过新 modal root。
- 本轮没有新建平行 Overlay/Focus/Observer/State primitive；已有 `LogicalOwnership / LayerManager / FocusScope / OverlayRuntime / ObserverHub / Scheduler / StateController / InteractionPolicy` 继续作为唯一底层入口。

### 验证边界

- `npm test` 必须同时通过 build 与 core convergence verify。
- src/dist JavaScript 继续执行全量 syntax check，src/dist CSS 保持一致，最终 ZIP 执行完整性校验。
- 浏览器自动化 smoke 在当前执行环境受 Chromium 启动/策略环境限制时，不得冒充为通过；Node 运行时回归、静态架构检查与构建结果需单独如实报告。

