# QXFRAME9A7C2 ESM 20→30 · Executable Cutover Source v7

## 本轮目标

把 v6 的 VM cutover rehearsal 固化成真实可执行的 ESM 源入口，并让 `src/index.js` 在源码侧停止依赖 14,471 行 monolithic kernel；生产 `dist` 继续冻结，直到 Rollup 能真实执行并完成 browser parity。

## 已完成

1. 新增 `src/cutover-entry.js`：不 import `src/qxframe9a7c2.js` / `src/legacy-entry.mjs`。
2. 新增 `src/compat/` 临时兼容层，共 7 个文件，并由 `tools/manifests/esm-cutover-compat.json` 精确白名单控制。
3. 79 个 ESM candidate 作为真实 runtime authority 注册进临时 Registry；72 个旧 `defineModule` 模块在此 authority 下完整 bootstrap。
4. 旧 kernel 中 Core/Headless/DOMHeadless Registry 壳、Module loader、ComponentRuntime、BuildingBlockRuntime、PerformanceDiagnostics、Floating UI UMD 被拆成明确的临时兼容职责，不再要求 cutover source 加载整份 kernel。
5. `src/index.js` 已由 `legacy-entry.mjs` 切换到 `cutover-entry.js`。源码 ESM/UMD 公共入口的依赖闭包不再触达 monolithic kernel。
6. Rollup 配置改成双验证入口：
   - `src/legacy-entry.mjs` → legacy-control bundle
   - `src/index.umd.js` → ESM cutover bundle
7. `verify-rollup-parity.mjs` 已准备同时验证两个 Rollup bundle 的 runtime snapshot 与 browser smoke。
8. 新增 `verify:esm-cutover-source`：独立 Node ESM 进程真实启动 cutover source，并与冻结 `dist` 比较 Core/Headless/DOMHeadless/Component/BuildingBlock/ModuleManifest。

## 当前可执行 cutover 结果

```text
ESM candidate authority      79 / 79
legacy module factories      72 / 72
public components            40
building blocks              14
reachable source files       163
static import edges          339
monolithic kernel imported   false
legacy-entry imported        false
public src/index cutover      true
compat files                 7 (all inventoried)
```

## 临时 compat 删除纪律

- `legacyFloatingUI.js`：30→35 删除，改为 `@floating-ui/dom` ESM dependency。
- `legacyPerformanceDiagnostics.js`：Component/runtime authority 建立后删除 Registry discovery。
- 其余 Registry/Component/BuildingBlock/module compatibility files：最迟 92→95 全部删除。
- `src/compat` 不允许出现未登记的新文件；verify 会直接失败。

## 验收

- legacy build PASS。
- core/contracts/platform PASS。
- 79 ESM candidate parity PASS。
- kernel coverage / import graph / 5-wave guard / Registry consumer guard PASS。
- VM cutover rehearsal PASS。
- executable cutover source PASS。
- source ESM/UMD entry PASS，40 named components identity 不变。
- release verify PASS：205 JS/MJS，22 JSON，72 modules。
- browser smoke PASS。
- `dist/qxframe9a7c2.js/css/d.ts` SHA-256 与 HOTFIX6/v6 完全一致。

## 尚未执行

生产 authority 仍未切到 Rollup，因为当前执行环境没有可用的 `rollup` binary：

```text
sh: 1: rollup: not found
exit=127
```

因此：

- 默认 `npm run build` 仍使用 frozen legacy builder。
- `src/qxframe9a7c2.js` 暂不删除。
- 组件文件暂不写 ESM `import`，避免旧 concat builder 无法解析。
- 30→35 Floating UI dependency migration 仍未开始。

## 下一步硬门槛

Rollup 可执行后：

1. 同时生成 legacy-control 与 cutover UMD bundle。
2. `verify:rollup` 对两个 bundle 做 runtime parity + browser smoke。
3. cutover bundle PASS 后，把生产 JS authority 切到 `src/index.umd.js`。
4. 删除 monolithic kernel 中已经由 79 个 ESM owner 接管的 68 个 capability sections，并停止 legacy concat JS build。
5. 进入 30→35：移除 embedded Floating UI UMD，使用 `@floating-ui/dom`。
