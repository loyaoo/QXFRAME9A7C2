# QXFRAME9A7C2 ESM 迁移记录：20→30 PRE-CUTOVER

> 基线：QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22  
> 阶段：20→30（kernel 拆分的 Rollup cutover 前置批次）  
> 状态：PRE-CUTOVER，**不得标记为 20→30 完成**

## 1. 本批目标

在不改变当前生产 runtime authority、不修改任何公开组件业务行为、不修改 DOM/CSS/API 的前提下，把低耦合 kernel 能力抽取成可独立 import/export 的真实 ESM 模块，并建立新旧实现的直接行为 parity 验证。

当前生产 authority 仍是 legacy Registry。新 ESM 模块是已验证的 canonical candidate；只有 Rollup 能真实执行并通过 bundle/browser parity 后，才能逐个切换 consumer 并删除 kernel 旧 section。

## 2. Rollup 门槛状态

项目已经声明 `rollup@^4.63.4`，但当前执行沙箱没有 `node_modules`、没有全局 Rollup，且 npm registry / 外部网络不可达。因此当前环境仍无法执行真实 `rollup -c`。

本批没有：

- 编写第二套自制 bundler；
- 让旧 `build.mjs` 解析/拼接 ESM；
- 假装 Rollup 已 PASS；
- 删除 legacy kernel section；
- 修改默认 `npm run build` 的生产路径。

## 3. 已建立的真实 ESM candidates

### utils

- `src/utils/index.js` → `Utils`
- `src/utils/id.js` → `IdManager`
- `src/utils/url.js` → `URLPolicy`
- `src/utils/valueEquality.js` → `ValueEquality`
- `src/utils/dateUnit.js` → `DateUnit`

### core

- `src/core/events.js` → `Events`
- `src/core/scheduler.js` → `Scheduler`
- `src/core/interactionDetails.js` → `InteractionDetails`
- `src/core/options.js` → `mergeOptions` / `Options`（ESM consumer 的 canonical options merge helper）
- `src/core/selection.js` → `Selection`
- `src/core/valueDraft.js` → `ValueDraft`
- `src/core/stateController.js` → `StateController`
- `src/core/treeModel.js` → `TreeModel`
- `src/core/paginationModel.js` → `PaginationModel`
- `src/core/tableModel.js` → `TableModel`
- `src/core/interactionPolicy.js` → `InteractionPolicy`
- `src/core/transformModel.js` → `TransformModel`
- `src/core/asyncTask.js` → `AsyncTask`
- `src/core/asyncTaskGroup.js` → `AsyncTaskGroup`
- `src/core/asyncAction.js` → `AsyncAction`
- `src/core/activeItem.js` → `ActiveItem`
- `src/core/index.js` → core barrel

共 20 个 legacy Registry capability 已拥有 ESM candidate；`mergeOptions` 是额外支撑能力，不计入 Registry capability 数量。

## 4. 依赖方向

新 candidate 内部依赖已使用真实 `import`：

- `Selection` → `Utils` + `Events` + `mergeOptions`
- `ValueDraft` → `Utils` + `ValueEquality` + `Events` + `InteractionDetails` + `mergeOptions`
- `StateController` → `ValueEquality` + `ValueDraft` + `mergeOptions`
- `TableModel` → `Utils` + `Events` + `mergeOptions` + `Selection` + `PaginationModel`

候选源码禁止通过 Registry 重新定位这些依赖。

## 5. 新增 parity verifier

新增：

`tools/verify-esm-core-parity.mjs`

验证内容：

1. 载入冻结 HOTFIX6 legacy runtime 作为行为基线；
2. 直接 import 新 ESM candidates；
3. 检查 public keys / export identity；
4. 对核心方法执行行为对照；
5. 检查 `src/core/index.js` / `src/utils/index.js` barrel identity；
6. 静态禁止 candidate 出现：
   - `CoreRegistry.get/define`
   - `HeadlessRegistry.get/define`
   - `DOMHeadlessRegistry.get/define`
   - `defineModule()`
   - `globalThis.QXFRAME9A7C2`
7. 明确报告 `runtimeAuthority: legacy-registry` 与 `rollupCutoverPending: true`。

`verify:esm-core` 已加入总 `npm run verify` 链。

## 6. 本批边界核对

和上一版 0→20 相比：

- 原有 `src` 文件修改数：**0**；
- 新增 `src/core/*` / `src/utils/*` candidate；
- 修改 `package.json` 仅用于加入 `verify:esm-core`；
- 新增 parity verifier；
- legacy `src/qxframe9a7c2.js` 保持 **14,471 行**，本批尚未删 section；
- 组件源码、DOM、CSS、公开 API 均未改动；
- `dist` 仍由 legacy build 生成，不直接修改。

## 7. 验收结果

`npm run verify:esm-core`：PASS，20/20 candidates parity PASS。

`npm test`：PASS。

`npm run verify:browser`：PASS。

当前 legacy 生产产物 hash：

- `dist/qxframe9a7c2.js` SHA-256: `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- `dist/qxframe9a7c2.css` SHA-256: `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`

与冻结 HOTFIX6 生产基线一致。

## 8. 下一步

Rollup 可执行后，按 section 小批量切换：

1. 让 Rollup source entry import ESM candidate；
2. 对尚未迁移的 legacy consumer 使用临时 compatibility bridge；
3. consumer 改为真实 import；
4. 删除该能力在 `src/qxframe9a7c2.js` 中的旧 section；
5. 运行 direct unit/parity、`npm test`、Rollup parity、browser smoke；
6. 该能力确认只剩一个 authority 后，再进入下一 section。

在上述 cutover 完成前，不删除 legacy Registry，不将 20→30 标记为完成。
