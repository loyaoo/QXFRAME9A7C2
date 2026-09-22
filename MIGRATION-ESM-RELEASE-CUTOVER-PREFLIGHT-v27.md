# QXFRAME9A7C2 ESM 迁移 · Release Cutover Preflight v27

> 基线：`QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v26`  
> 本轮目标：推进 97→99 production release cutover，并完成可在当前环境执行的 99→100 最终源码清仓验收。  
> 结论：**源码架构与发布工程已收口，整体迁移完成度约 98%；实际 Rollup 产物生成仍被当前执行环境缺少 Rollup 包阻塞，因此不能宣称 100% 或 production cutover 已完成。**

---

## 1. 本轮结论

v26 已完成 Registry/Module 物理清仓与新架构 verifier；v27 进一步把发行链从“冻结旧 dist 可通过”改为“必须真实 Rollup 构建才能通过”。

当前状态：

```text
source ESM architecture       = COMPLETE
legacy runtime removal        = COMPLETE
registry / defineModule       = 0
source cleanroom              = PASS
release engineering           = COMPLETE
release preflight             = PASS
Rollup executable/package     = UNAVAILABLE IN CURRENT ENVIRONMENT
new production artifacts      = NOT GENERATED
final production cutover      = BLOCKED
```

因此，本轮不伪造新 `dist`，也不使用自制字符串 bundler 代替 Rollup。

---

## 2. 97→99：发行构建链重写

### 2.1 Rollup 输出正式固定为三种格式

`rollup.config.mjs` 现在定义：

1. `src/index.umd.js` → `dist/qxframe9a7c2.js`，IIFE 浏览器版本；
2. `src/index.js` → `dist/qxframe9a7c2.esm.js`，单文件 ESM bundle；
3. `src/index.js` → `dist/esm/**`，`preserveModules` ESM 目录。

迁移期使用：

```text
treeshake = false
preserveEntrySignatures = strict
```

以优先保持公开行为和模块边界稳定。

### 2.2 UMD/IIFE 全局边界收紧

`src/index.umd.js` 不再 `export default`，仅执行：

```js
initializeGlobal(api);
```

目标是最终浏览器脚本只建立：

```text
globalThis.QXFRAME9A7C2
```

而不再让 Rollup 因入口默认导出额外创建诸如 `QXFRAME9A7C2Bundle` 的辅助全局变量。

### 2.3 构建脚本改为严格真实构建

新增：

```text
tools/build-release.mjs
tools/postbuild-release.mjs
```

删除旧 `tools/build-modern.mjs`。

现在：

```bash
npm run build
```

必须真实加载 `rollup` 并构建三个输出。如果 Rollup 不存在，构建以非零状态退出。

**禁止再把“Rollup 不存在，但 frozen dist hash 正常”视为 build success。**

### 2.4 frozen production 改为纯历史基线

新增：

```text
tools/verify-frozen-production.mjs
```

`tools/manifests/frozen-production-hashes.json` 的模式已经改成：

```text
archival-pre-rollup-production-baseline
```

它仅用于证明当前尚未覆盖的旧 production dist 没有被意外修改，绝不参与正式 build 成功判定。

当前 archival hash 仍为：

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

---

## 3. package.json 已切到最终 ESM/发行语义

已固定：

```json
{
  "type": "module",
  "main": "./dist/qxframe9a7c2.js",
  "module": "./dist/qxframe9a7c2.esm.js",
  "types": "./dist/qxframe9a7c2.d.ts",
  "browser": "./dist/qxframe9a7c2.js",
  "style": "./dist/qxframe9a7c2.css"
}
```

Rollup 依赖固定为：

```text
rollup = 4.63.4
```

并建立 package exports：

```text
.
./components
./components/*
./core
./core/*
./utils
./utils/*
./css
./dist/qxframe9a7c2.js
./dist/qxframe9a7c2.css
./package.json
```

正式发布脚本：

```bash
npm run release
```

顺序为：

```text
build
→ source verify
→ browser verify
→ release artifact verify
→ npm package contents verify
```

`prepublishOnly` 同样指向完整 release gate，因此缺少真正 ESM/UMD/preserveModules 产物时不能误发布。

---

## 4. 新增发布级验证器

### `verify-release-preflight.mjs`

无需 Rollup binary 即可检查发布工程是否配置正确：

```text
Rollup outputs          = 3
package exports         = PASS
strict build            = PASS
auxiliary IIFE global   = false
frozen build fallback   = false
```

当前 PASS。

### `verify-release-artifacts.mjs`

真实 Rollup 构建后验证：

- IIFE bundle；
- ESM bundle；
- preserveModules entry；
- source map；
- 40 个 Components parity；
- 72 条 ModuleManifest 完整 metadata parity；
- 禁止旧 Registry/global keys；
- IIFE 只建立正式 `QXFRAME9A7C2` global。

此 verifier 当前尚不能执行成功，因为目标 Rollup artifact 尚未生成。

### `verify-package-contents.mjs`

基于 `npm pack --dry-run` 验证 npm 包必须真实包含：

```text
dist/qxframe9a7c2.js
dist/qxframe9a7c2.js.map
dist/qxframe9a7c2.esm.js
dist/qxframe9a7c2.esm.js.map
dist/esm/index.js
dist/esm/components/index.js
dist/esm/core/index.js
dist/esm/utils/index.js
dist/qxframe9a7c2.css
dist/qxframe9a7c2.d.ts
```

并禁止重新打入：

```text
node_modules
src/modules
src/compat
```

当前 package gate **按设计失败**，因为实际 Rollup build 尚未执行，首先缺少 `dist/qxframe9a7c2.js.map`，同时 ESM bundle/preserveModules 产物也不存在。

这不是回归失败，而是用于阻止假发布的正确 release gate。

---

## 5. 99→100：源码 cleanroom 已完成

新增：

```text
tools/verify-final-cleanroom.mjs
```

当前结果：

```json
{
  "ok": true,
  "scannedFiles": 164,
  "legacyRuntimeMarkers": 0,
  "removedLegacyPaths": 6
}
```

确认以下旧 runtime path 保持不存在：

```text
src/modules
src/compat
src/manifests
src/qxframe9a7c2.js
src/cutover-entry.js
src/legacy-entry.mjs
```

现代 `src` 顶层现在只有：

```text
components/
core/
runtime/
utils/
vendor/
css/
fonts/
index.js
index.umd.js
initializer.js
qxframe9a7c2.css
```

旧 Registry、`defineModule`、TEMP ESM bridge、旧 module wrapper 均不再是 active source architecture。

---

## 6. active verifier 已完全改为 ESM 架构语义

本轮继续删除验证体系对 frozen production Registry 的依赖。

### source entry verifier

当前验证：

```text
Components parity      = 40/40
ModuleManifest parity  = 72/72
src/index.js global side effect = false
src/index.umd.js global init     = true
legacy global keys              = 0
```

### contract verifier

```text
schemas             = 40
canonicalContracts  = 40
contractDrift       = 0
demoContractDrift   = 0
```

### architecture / graph

当前现代源码图仍保持：

```text
source files     = 164
static edges     = 1214
external imports = 0
cycles           = 0
legacy imports   = 0
```

---

## 7. 浏览器回归

最终重新执行：

```bash
npm run verify:browser
```

三层全部 PASS：

```text
production browser smoke = PASS
source ESM Chromium       = PASS
high-risk Chromium        = PASS
```

production browser smoke 的 active 测试代码也已去掉 Registry lookup，直接使用：

```text
Q.Core
Q.DOMHeadless
Q.BuildingBlocks
Q.Components
```

其中 source ESM Chromium 继续覆盖 Popup / Overlay / Picker / Tree / Menu / Transfer / List / Tabs 等主干，高风险 Chromium 覆盖 Image / JSON / Pagination / Tags / Upload / Table / Message / Notification / NoticeService。

---

## 8. 完整测试结果

### Source / architecture

```bash
npm test
```

结果：**PASS**。

关键结果：

```text
release preflight        = PASS
final cleanroom           = PASS
component contracts       = PASS
platform boundaries       = PASS
family guards             = PASS
shared utility guards     = PASS
collection guards         = PASS
high-risk authority guard = PASS
```

### Browser

```bash
npm run verify:browser
```

结果：**PASS**。

### Strict production build

```bash
npm run build
```

当前结果：**预期失败，exit code 2**。

原因唯一明确：

```text
Cannot find package 'rollup'
```

脚本不会 fallback 到 frozen dist，因此这个失败证明 strict release behavior 正常。

### Archival frozen baseline

```bash
npm run build:frozen
```

结果：**PASS**。

它只证明旧 production artifact 没有被意外修改，不代表 production build 成功。

### Package release gate

```bash
npm run verify:package
```

当前结果：**预期失败，exit code 1**。

因为真正 Rollup outputs 尚不存在；该 gate 正确阻止发布。

本轮最终证据状态：

```text
npm test              = 0
verify:browser        = 0
strict build          = 2  (expected blocker)
build:frozen          = 0
verify:package        = 1  (expected blocker)
```

---

## 9. 为什么本轮仍然不是 100%

代码和 source architecture 层面的 99→100 cleanroom 已通过，但 **production release 还没有被真实 Rollup 构建验证**。

当前执行环境：

- 没有 `node_modules/rollup`；
- 系统路径没有可复用 Rollup；
- npm 本地 cache 没有 Rollup；
- 当前容器网络/DNS 无法成功安装/下载 Rollup package。

因此不能完成：

```text
Rollup real build
→ dist/qxframe9a7c2.js replacement
→ dist/qxframe9a7c2.esm.js
→ dist/esm/**
→ release artifact verifier
→ npm package verifier
→ final production browser verification against newly generated IIFE
```

也因此不能合理宣称 100%。

---

## 10. 当前完成度

按 0→100 原始迁移手册的架构门槛保守计算：

```text
0→97  = complete
97→99 = release engineering / preflight complete,
        actual Rollup artifact generation blocked by environment
99→100 source cleanroom = complete,
        final release acceptance waits on actual artifacts
```

综合完成度：**约 98%**。

剩余不是新的组件重构，也不是 Registry/Module 迁移，而是最后一次真实生产发行闭环。

---

## 11. 下一阶段唯一主线

在能够取得项目已声明的 Rollup dependency 的环境中：

```bash
npm install
npm run release
```

然后：

1. 处理真实 Rollup 构建暴露的任何 bundle-specific 问题；
2. 验证新 IIFE、ESM bundle、preserveModules；
3. 验证 package contents；
4. 使用新生成的 production IIFE 再跑浏览器回归；
5. 若所有 release gate 全 PASS，才把整体迁移标记为 **100%**。

---

# 最终状态

```text
ESM source migration          = COMPLETE
Component / Family migration  = COMPLETE
legacy implementation graph   = 0
Registry runtime architecture = REMOVED
legacy src runtime files      = REMOVED
architecture verification     = COMPLETE
source/browser regression     = PASS
release engineering           = COMPLETE
real Rollup production build  = BLOCKED BY ENVIRONMENT
migration completion          ≈ 98%
```
