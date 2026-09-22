# src/dist 目录收口与底层协议收口

## 当前目录与发行契约

- `src/index.js` 是无全局副作用的 ESM 公共入口；依赖只由静态 `import/export` 表达。
- `src/index.umd.js` 只负责传统浏览器全局入口，`src/initializer.js` 是唯一允许初始化 `globalThis.QXFRAME9A7C2` 的边界。
- `src/components/` 保存组件/Family Base；`src/core/` 保存横向能力；`src/utils/` 保存纯算法；`src/runtime/` 只负责静态 namespace / compatibility metadata 组装。
- `src/modules/`、旧聚合 kernel、Registry dependency locator、`defineModule()`、legacy/cutover entry 均已退出 runtime source。
- `src/qxframe9a7c2.css` 是完整 CSS source；`dist/qxframe9a7c2.css` 由发布构建复制生成，CSS 不做另一套运行时装载。
- JS 发布必须由 Rollup 从 ESM source graph 生成：`dist/qxframe9a7c2.js`（IIFE）、`dist/qxframe9a7c2.esm.js`（ESM bundle）、`dist/esm/**`（preserveModules）。
- npm 包根入口与 `components/*` / `core/*` / `utils/*` 子路径统一解析到 `dist/esm/**` preserveModules 图，保证 class/singleton identity 唯一；单文件 ESM bundle 仅通过显式 `qxframe9a7c2/bundle` 或 dist 路径消费，IIFE 仅用于传统 `<script>` / CDN。
- `Control → Tags`、`Transfer → Pagination/Table` 等已改为静态 ESM import；公开 preserveModules 子路径不得依赖导入根 runtime 后再注入依赖。
- vendored Floating UI 是正式静态 ESM authority；第三方版权与 MIT 许可由 `THIRD_PARTY_NOTICES.md` 随包发布，不再保留“发布时替换依赖”的迁移期约定。
- `ModuleManifest` 只保留公开兼容元数据，不参与模块加载或依赖定位。
- CSS 完全移除 `@layer`、`:is()`、`:has()`、`:dir()`；原 layer 优先级编译为物理顺序。
- 原 `:has()` / `:dir()` 状态由现代 runtime 能力投影成普通状态 class，并采用脏子树增量刷新。

## 依赖与发布验证

- `tools/verify-esm-import-graph.mjs` 验证静态 import graph、无环、无 legacy import。
- `tools/verify-rollup-source-compatibility.mjs` 验证两个 release entry 全部只使用相对静态 import，且不存在动态 import、Node builtin、`import.meta` 或 vendor 顶层环境 shim；`verify-source-umd-browser.mjs` 在 Chromium 中直接执行 source UMD entry，提前验证未来 IIFE 的唯一全局语义。
- `tools/verify-modern-architecture.mjs` / `verify-final-cleanroom.mjs` 拒绝重新引入 Registry、`defineModule()`、旧 module wrapper 与 legacy source path。
- `npm run build` 是严格 Rollup production build；优先使用标准 `rollup`，仅在其无法加载时回退到同版本官方 `@rollup/wasm-node`。两者都缺失时直接失败，不允许旧 frozen dist 伪装成构建成功。整个构建采用 `.release-stage/dist` 事务：三种 Rollup 输出、CSS/fonts、类型声明和 release metadata 全部先生成并验收，只有全部 PASS 才原子替换正式 `dist`；任意失败都必须保持旧 `dist` 字节不变。若 commit 与 rollback 同时因外部文件系统故障失败，`.release-dist-backup` 必须保留为恢复副本，并阻止后续 release 覆盖。
- `npm run verify:release` 验证 IIFE、ESM bundle、preserveModules 三种发行格式拥有一致的 40-component / 72-module 公共 inventory，并且传统 IIFE 同步建立 `window.QXFRAME9A7C2`。根 `d.ts` 与 `dist/esm/**/*.d.ts` 由当前 ESM exports + `ComponentContracts` 自动生成，并通过 TypeScript NodeNext 以真实包名/子路径导入验收。
- `qxframe9a7c2-api.json`、`qxframe9a7c2-module-manifest.json`、`qxframe9a7c2-migration.json` 全部由当前 `ComponentRuntime` / `ComponentContracts` / `ModuleManifest` / `tools/manifests/compatibility.json` 重建；release postbuild 不允许读取旧 `dist` 或 docs snapshot 作为输入。
- `npm run build:frozen` 仅用于历史产物 SHA-256 对照，不属于正式 build path。

## Overlay

- LayerManager 以 logical owner tree 管理 portal 子层生命周期。
- owner teardown 会 deepest-first 回收 descendants，不允许 dangling parent。
- FocusTrap 把 logical descendant overlay 一并纳入 focus domain。
- 普通 overlay 使用 root-family 顺序，防止旧 modal 的 tooltip 压过后来打开的 modal。
- `notice` / `blocking` 保持全局高层级，不会被后来普通 popup 覆盖。

## Table

- `setItems()` 与 `updateOptions({items})` 使用一致的 key reconcile 语义。
- 已不存在的 `selectedKeys` / `expandedKeys` 会被清理。
- fixed/sticky offset 不再用 `Number(column.width)` 猜布局；渲染后以实际 geometry 为准。
- responsive hidden fixed columns 不再留下 ghost offset。

## 安全、生命周期与滚动

- 新增统一 `URLPolicy`，拦截危险 URL scheme，并应用到 Tags、Modal、Drawer、Image、Carousel、Tree、Upload 等 URL sink。
- Modal/Drawer 自定义 attrs 不能通过 `on*` / URL 属性绕过 URL policy。
- PositionAdapter 在 destroy 后不会继续触发迟到的 async error callback。
- FormBridge 跨 `<form>` 移动原生字段时保留原 form owner。
- FocusManager 验证真实焦点结果并排除 hidden/inert/disconnected target。
- ScrollLock 支持 document/custom target、nested lock、inline-end 语义与固定/粘性元素补偿。
