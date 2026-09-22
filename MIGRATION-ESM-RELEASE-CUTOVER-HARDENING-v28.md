# QXFRAME9A7C2 ESM 迁移 · Release Cutover Hardening v28

> 基线：`QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v27`  
> 本轮目标：继续推进 97→99 production release cutover，在无法取得 Rollup binary/package 的当前环境中，把 bundle 前风险继续压缩，并确保最终发布只剩“执行真实 Rollup 构建”这一项。  
> 结论：**源码/架构 cleanroom 已完成；release source graph、UMD source entry、package/release gate 进一步加固；整体迁移完成度约 98.5%。当前仍不能宣称 100%，因为当前沙箱无法安装标准 `rollup` 或官方 `@rollup/wasm-node`，因此真实 IIFE/ESM/preserveModules 产物尚未生成。**

---

## 1. 当前状态

```text
source ESM architecture            = COMPLETE
legacy runtime removal             = COMPLETE
registry / defineModule            = 0
source cleanroom                   = PASS
Rollup source compatibility        = PASS
source UMD-entry Chromium          = PASS
production Chromium (archival dist)= PASS
standard Rollup installed          = NO
official Rollup WASM installed     = NO
new production artifacts           = NOT GENERATED
release gate                       = CORRECTLY BLOCKED
package gate                       = CORRECTLY BLOCKED
```

本轮仍坚持：

```text
不恢复旧 concat build
不把 frozen dist 当成 production build
不使用自制 bundler 冒充 Rollup
不为了“100%”绕过 release/package gate
```

---

## 2. 新增 Rollup source compatibility guard

新增：

```text
tools/verify-rollup-source-compatibility.mjs
npm run verify:rollup-source
```

当前结果：

```json
{
  "ok": true,
  "entries": 2,
  "files": 164,
  "staticEdges": 1214,
  "externalImports": 0,
  "dynamicImports": 0,
  "nodeBuiltins": 0,
  "importMeta": 0,
  "topLevelVendorShims": 0
}
```

这意味着：

- `src/index.js` 与 `src/index.umd.js` 的完整 release graph 都只依赖相对静态 import；
- 不需要 node-resolve/commonjs/json 等 Rollup plugin 才能解析项目本身；
- 不存在 runtime dynamic import；
- 不存在 Node builtin；
- 不存在 `import.meta.url` 资源路径在 bundling 后发生语义变化的风险；
- vendor 文件不允许重新出现顶层 `globalThis/module/exports/define` 环境 shim。

该 guard 已加入正式 `npm test`。

---

## 3. Floating UI vendor 的 scope-hoisting 风险修复

v27 的离线 vendor 隔离为了强制 UMD payload 走 browser/global branch，在模块顶层声明过：

```text
globalThis
module
exports
define
```

源码独立 ESM import 可工作，但最终 Rollup 会进行 scope hoisting，这类顶层环境变量名没有必要继续暴露在 module scope。

v28 改为：

```text
(function isolateFloatingUIPayload(globalThis, exports, module, define) {
    // embedded Floating UI payload
})(floatingVendorGlobal, undefined, undefined, undefined);
```

所有环境 shim 都收进函数参数作用域。

验证结果：

```text
FloatingUICore export       = present
FloatingUIDOM export        = present
globalThis.FloatingUICore   = absent
globalThis.FloatingUIDOM    = absent
top-level vendor shims      = 0
```

这减少了未来 Rollup 单 scope bundle 中发生全局标识符遮蔽/重命名意外的可能性。

---

## 4. 新增 source UMD-entry Chromium 验收

新增：

```text
tools/verify-source-umd-browser.mjs
npm run verify:source-umd-browser
```

它不是检查字符串，而是在 Chromium 中：

1. 构建 `src/index.umd.js` 完整 import-map graph；
2. 真实执行该 source entry；
3. 再加载 canonical `src/index.js`；
4. 验证 global runtime 与 canonical runtime identity 相同。

当前结果：

```json
{
  "ok": true,
  "modules": 164,
  "components": 40,
  "manifest": 72,
  "legacyGlobals": 0,
  "vendorGlobals": 0
}
```

并明确拒绝：

```text
CoreRegistry
HeadlessRegistry
DOMHeadlessRegistry
ComponentRegistry
BuildingBlockRegistry
defineModule
load
use
QXFRAME9A7C2Bundle
FloatingUIDOM global leak
FloatingUICore global leak
```

该验证已加入：

```text
npm run verify:browser
```

所以当前 browser suite 为四层：

```text
production archival dist Chromium
source ESM Chromium
source UMD-entry Chromium
high-risk authority Chromium
```

全部 PASS。

---

## 5. Release bundler 增加官方 WASM fallback

正式 build 仍优先：

```text
rollup 4.63.4
```

新增同版本官方 fallback：

```text
@rollup/wasm-node 4.63.4
```

`tools/build-release.mjs` 的顺序：

```text
import('rollup')
    ↓ failed
import('@rollup/wasm-node')
    ↓ failed
hard failure, exit 2
```

不会 fallback 到：

```text
legacy concat
custom bundler
frozen dist
```

这样在 native Rollup optional binding 不可用的平台上，仍可使用官方 Rollup WASM API 完成相同三个输出。

当前沙箱两个 provider 都未安装，因此严格 build 的失败是正确的：

```text
rollup                = missing
@rollup/wasm-node     = missing
build exit code       = 2
```

---

## 6. 正式测试链状态

### `npm test`

```text
PASS
```

包含：

- architecture cleanroom；
- ESM graph；
- Rollup source compatibility；
- source entry；
- Component / Field / Popup / Overlay / PopupField / Picker family guards；
- shared utilities；
- collection family；
- high-risk authorities；
- Registry removal readiness；
- contracts；
- platform；
- release preflight；
- final cleanroom。

### `npm run verify:browser`

```text
PASS
```

四层 Chromium 全通过。

### `npm run build:frozen`

```text
PASS
```

但仅为 archival baseline：

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

---

## 7. Release / package gate 现在一次报告全部缺口

v27 gate 只会在第一个缺失文件处停止。
v28 改为先聚合全部 missing artifacts，再一次抛出完整差异。

### `npm run verify:release`

当前按设计失败，实际缺失：

```text
dist/qxframe9a7c2.js.map
dist/qxframe9a7c2.esm.js
dist/qxframe9a7c2.esm.js.map
dist/esm/index.js
```

### `npm run verify:package`

当前按设计失败，npm package 缺失：

```text
dist/qxframe9a7c2.js.map
dist/qxframe9a7c2.esm.js
dist/qxframe9a7c2.esm.js.map
dist/esm/index.js
dist/esm/components/index.js
dist/esm/core/index.js
dist/esm/utils/index.js
```

这些全部都应由真实 Rollup build 生成。

因此当前 release gate 不存在“测试不知道缺什么”的模糊状态。

---

## 8. 为什么当前仍不是 100%

0→100 手册的 97→99 要求不仅是“Rollup 配置存在”，而是实际产出并验证：

```text
IIFE
a standalone ESM bundle
preserveModules ESM
```

当前沙箱网络状态为：

```text
outbound package download = unavailable
standard Rollup package   = unavailable
official Rollup WASM      = unavailable
```

因此以下动作尚无法在本环境真实完成：

```bash
npm run build
npm run verify:release
npm run verify:package
npm run release
```

其中后三者当前**正确失败/阻止发布**，而不是被绕过。

---

## 9. 下一步唯一主线

环境具备依赖后：

```bash
npm install
npm run release
```

其中 build 会优先标准 Rollup，必要时使用官方 WASM provider。

必须得到：

```text
npm run build          PASS
npm test               PASS
npm run verify:browser PASS
npm run verify:release PASS
npm run verify:package PASS
```

然后重新核对：

```text
IIFE only global = QXFRAME9A7C2
ESM component inventory = 40/40
preserveModules inventory = parity
ModuleManifest = 72/72 full metadata parity
legacy runtime markers = 0
source graph cycles = 0
npm package required files = complete
```

只有这些全部满足，才把整体迁移标记为 **100%**。

---

## 10. v28 完成度

```text
0→92   component/source authority migration      COMPLETE
92→95  Registry / Module physical removal        COMPLETE
95→97  architecture verifier rewrite             COMPLETE
97→99  release engineering / preflight           COMPLETE
97→99  real Rollup artifact generation           BLOCKED BY ENVIRONMENT
99→100 source cleanroom                          COMPLETE
99→100 final packaged release acceptance         WAITING FOR REAL BUILD
```

综合完成度：**约 98.5%**。

本轮没有通过降低验收标准来提高百分比。
