# QXFRAME9A7C2 ESM / Component / Field Family 加速迁移 v16

## 当前整体完成度

按《QXFRAME9A7C2 src → ESM + Component/Family Base 0→100 迁移执行手册》的阶段百分比作为架构门槛权重，而不是按文件数或代码行估算：**约 43%**。

> v16 的主要增量是正式建立 `FieldComponent`，把 `Control` 切成 ESM canonical BuildingBlock owner，并一次迁移 `InputOTP / InputNumber / Rate / TagInput` 四个真实字段 class source authority。生产 Rollup 仍不可执行，因此 5→10 与 20→30 production cutover 继续保守计分。

| 阶段 | 当前判断 | 计入 |
|---|---|---:|
| 0→5 基线冻结 | 完成 | 5/5 |
| 5→10 Rollup 双构建 | 配置/对照就绪，但 Rollup binary 缺失 | 3/5 |
| 10→15 Node 工具 ESM | 完成 | 5/5 |
| 15→20 ESM 公共入口 | 完成 | 5/5 |
| 20→30 kernel 拆分 | 79 个 ESM authority + source cutover 完成；production kernel 尚未删除 | 8.5/10 |
| 30→35 Floating UI ESM dependency | 未正式开始 | 0/5 |
| 35→40 Component | Component / contracts / transaction / hooks 完成 | 5/5 |
| 40→45 FieldComponent | FieldComponent + Control + InputOTP/InputNumber/Rate/TagInput 已完成；TextField/Slider 等剩余 | 3.5/5 |
| 45→50 低风险普通组件 | 基本收口 | 5/5 |
| 50→76 Popup / Overlay / PopupField / Picker | 未开始正式 Family Base 迁移 | 0/26 |
| 76→80 Time/Wheel 公共能力 | 未完成 | 0/4 |
| 80→84 TreeQuery / Item Accessors | ItemAccessors 有基础，TreeQuery 未完成 | 0.5/4 |
| 84→88 集合/数据组件 | Item 已成为 ESM canonical owner，其余未迁 | 0.5/4 |
| 88→95 高风险组件 + Registry 清仓 | 未开始 | 0/7 |
| 95→97 architecture verify | migration guards / graph / coverage / source-browser verifier 已较完整 | 1.5/2 |
| 97→100 发布与最终验收 | Rollup 未执行，未计入 | 0/3 |

合计：**42.5/100，按整数汇报约 43%**。

## v16 本轮完成

### 1. 真正建立 `FieldComponent`

新增：

- `src/components/field.js`
- `src/core/fieldHooks.js`

`FieldComponent extends Component`，当前统一负责：

- field value state
- disabled / readOnly / busy mutation gate
- `InteractionPolicy` 接口
- focus / blur 基础
- focus target binding
- FormBridge binding
- field option update hook
- field value-change hook

没有把 popup / tree / picker / tags / keyboard navigation 塞入继承链。

### 2. `Control` 成为真实 ESM canonical owner

新增 `src/components/control.js`，由旧 Control BuildingBlock 行为等价抽取而来。

当前：

- `Registry.get = 0`
- `defineModule = 0`
- `globalThis.QXFRAME9A7C2 = 0`
- `BuildingBlockRegistry.get('Control')` 仅由临时 compat adapter 指向同一个 ESM `Control`
- legacy `src/modules/control.js` 已退出 source cutover graph

`Control` 与 `Item` 现在是两个 source-side ESM BuildingBlock authorities。

### 3. 批量迁移四个 FieldComponent concrete classes

本轮新增并完成 source authority cutover：

- `InputOTP extends FieldComponent`
- `InputNumber extends FieldComponent`
- `Rate extends FieldComponent`
- `TagInput extends FieldComponent`

共同规则：

- 不自建 `destroy()` 公共生命周期
- 不自建 `updateOptions()` 公共 transaction shell
- 直接静态 import canonical capability
- legacy `Registry.get` / `defineModule` / 全局 QX 依赖为 0
- source authority 切换后对应 `src/modules/*.js` 不再进入 `src/index.js` dependency closure

特别说明：

- InputNumber 继续组合 `NumericInput + Control + InteractionPolicy`；controlled `value` 与 uncontrolled `defaultValue` 语义保留。
- Rate 继续组合 `StateController + InteractionPolicy + Renderer + Control`，半星、键盘、disabled/readOnly gate 保持原行为。
- TagInput 的旧实现曾在键盘锁定路径运行时再次 `HeadlessRegistry.get('InteractionPolicy')`；现在改成真正静态 ESM import，`TagNavigation / KeyboardNavigation` 仍保持横向 composition。

### 4. 新增真实 source ESM Chromium smoke

新增：

- `tools/verify-source-esm-browser.mjs`
- `npm run verify:source-browser`

由于当前受管 Chromium 禁止直接导航 localhost / file URL，verifier 将 `src/index.js` 的静态 ESM 图重写为 `qx:/...` specifier，并通过 import map + data modules 注入 `Page.setDocumentContent`。

实际 Chromium 中直接执行约 158 个真实 source ESM modules，验证：

- InputOTP class / FieldComponent inheritance
- InputNumber stepUp / stepDown / setValue / disabled gate
- Rate value / keyboard / disabled gate
- TagInput value / inputValue / disabled gate
- ComponentRegistry 返回新 class instance
- BuildingBlockRegistry 的 Control 与 ESM Control canonical method identity

全部 PASS。

`verify:browser` 已调整为 production browser smoke + source ESM browser smoke 串联；当前沙箱总时限会截断组合命令，但两个 verifier 分开执行均已 PASS。

## v16 source graph 进度

v15 reachable legacy implementations：**52**。

v16：**47**。

单轮再减少 **5 个**：

- Control
- InputOTP
- InputNumber
- Rate
- TagInput

当前 source authorities：

- 79 kernel/runtime ESM capabilities
- 10 Component class authorities：Carousel / Collapse / InputNumber / InputOTP / Loading / Progress / Rate / Result / Steps / TagInput
- 2 ESM BuildingBlock authorities：Control / Item
- 13 manifest-only legacy IIFE 已退出 source graph

## v16 验收

### Static / architecture

- ESM import graph：**102 files / 400 edges / 0 cycles / 0 legacy imports**
- executable source cutover：**159 reachable files / 470 static edges**
- reachable legacy implementations：**47**
- public components：40
- BuildingBlocks：14
- ModuleManifest：72

### Field-family verifier

`tools/verify-field-component.mjs`：PASS

验证：

- FieldComponent value/focus/mutation gate
- InputOTP inheritance / structural immutable / option validation
- InputNumber inheritance / structural immutable / option validation
- Rate inheritance / normalizers / direction rejection
- TagInput inheritance / value schema / immutable binding
- Control public API + frozen-dist `resolveFieldOptions` parity

### Browser

- frozen production dist Chromium smoke：PASS
- real source ESM Chromium smoke：PASS

### Release

- release syntax：**231 JS/MJS**
- release JSON：22
- runtime modules：72
- `src/qxframe9a7c2.js`：14,471 lines（production legacy 未误改）

Frozen production hashes 继续完全不变：

- JS `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- CSS `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
- d.ts `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`

Rollup 仍为 production cutover 唯一硬阻塞：

```text
sh: 1: rollup: not found
exit 127
```

## 下一批优先级

1. 继续 40→45：优先迁 `Slider`，再判断 `TextField / Switch` 的真实职责归属，避免把纯 behavior/guard 强行 class 化。
2. Field 简单族收口后进入 50→58：建立真正 `PopupComponent`，一次迁 Tooltip / Popover / Popconfirm / Dropdown。
3. Rollup 一旦可执行，立即暂停旁路迁移，完成 5→10 + 20→30 production cutover，并正式删除已失去 source authority 的 legacy kernel sections。
