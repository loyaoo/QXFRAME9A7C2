# QXFRAME9A7C2 ESM + Component 迁移报告 · ACCELERATED v23

## 当前完成度

- 整体架构完成度：约 **74%**。
- 70→76 `PickerComponent`：**source-side 100%（4/4）**。
- Picker 成员：`DatePicker / TimePicker / ColorPicker / WheelPicker` 均已成为真实 ESM class source authority。
- `PickerField`、`WheelPanel` 已成为 canonical ESM support authority；`TimePanel` 已成为 canonical ESM BuildingBlock authority。
- reachable legacy source implementations：**20 → 13**。
- 本轮不额外给 76→80 Time/Wheel 阶段记分；虽然 `TimePanel / WheelPanel` 已提前完成 source authority，整体百分比继续按架构门槛保守计算。

## 本轮 source authority

### Picker Family

```text
Component
  ↓
FieldComponent
  ↓
PopupFieldComponent
  ↓
PickerComponent
  ├─ DatePicker
  ├─ TimePicker
  ├─ ColorPicker
  └─ WheelPicker
```

`PickerComponent` 现在统一负责 Picker 家族的公共 picker session、draft/commit/cancel、clear/now、confirm/cancel footer、PickerField adoption 与公共 getter/lifecycle shell。

四个 concrete Picker 不再各自复制公共 `updateOptions / destroy` 生命周期，也不再通过 Registry/global QX 获取 Picker 公共能力。

### Picker support / BuildingBlock

本轮同时把 Picker concrete classes 的直接前置从 legacy runtime 中拆出：

- `PickerField` → `src/components/picker-field.js`
- `WheelPanel` → `src/components/wheel-panel.js`
- `TimePanel` → `src/components/time-panel.js`

其中：

- `PickerField` 直接静态依赖 `DOMTemplate / OptionTransaction / FieldHost / KeyboardNavigation / InteractionPolicy / OpenStateBridge / Control / Trigger` 等 canonical capability；
- `WheelPanel` 直接静态依赖 `Renderer / KeyboardRegion / Scroll / InteractionPolicy` 等能力；
- `TimePanel` 直接 import canonical `WheelPanel`，不再从 `ComponentInternals`/Registry 动态查找实现。

compat 层只负责在生产 cutover 前把同一个 canonical owner 投影给 legacy consumers，不再拥有第二份业务实现。

## 具体迁移结果

### DatePicker

- `DatePicker extends PickerComponent`。
- 直接组合 `Calendar / PeriodPanel / TimePanel / SelectionTags / TagNavigation / DateUnit`。
- 保留 single/range/multiple、日期/月份/年份/时间组合、needConfirm、双面板、tag keyboard 等现有行为。
- range commit 的完整性判断继续收到 controller/detail，不被 Family Base 截断参数。

### TimePicker

- `TimePicker extends PickerComponent`。
- 直接使用 canonical `TimePanel`。
- value / pickerValue / now / active range part / confirm-cancel 行为保留。

### ColorPicker

- `ColorPicker extends PickerComponent`。
- 继续组合 canonical `ColorPanel`、PointerSession、StateController 等能力。
- 颜色与渐变 API 保持现有 contract。

### WheelPicker

- `WheelPicker extends PickerComponent`。
- 直接使用 canonical `WheelPanel`。
- columns/item canonical `key / value / label` contract 保持不变。

## Source graph 与 authority 变化

- ESM graph：**139 files / 847 static edges / 0 cycles / 0 legacy imports**。
- Source cutover reachable graph：**163 source files / 906 static edges**。
- Kernel ESM authorities：**79**。
- Class source authorities：**22 → 26**。
- BuildingBlock authorities：**11 → 12**。
- Support authorities：**6 → 8**。
- Reachable legacy source implementations：**20 → 13**。
- Public Components：**40**。
- ModuleManifest：**72**。

当前仍直接保留在 temporary legacy source bridge 的 13 个实现：

```text
image
json
list
menu
message
notice-service
notification
pagination
table
tabs
tags
transfer
upload
```

## 新增/强化 migration guard

新增 `tools/verify-picker-family.mjs`，强制验证：

- `PickerComponent extends PopupFieldComponent`；
- `DatePicker / TimePicker / ColorPicker / WheelPicker` 必须直接 extends `PickerComponent`；
- Picker family source authority 不允许重新引入 Registry/global runtime lookup；
- concrete Picker 不允许重新拥有公共 `updateOptions()` / `destroy()` lifecycle shell；
- `PickerField / WheelPanel / TimePanel` canonical API 必须存在。

同时：

- generic component class guard 已覆盖 **26** 个 class source authorities；
- `verify-source-esm-browser` 增加四个 Picker 的真实 source Chromium instantiate + mutation 检查；
- source browser 输出 `pickerFamily: true`。

## 验收

最终验收结果：

- `npm test`：**PASS**。
- `verify:picker-family`：**PASS**。
- `verify:esm-graph`：**PASS**。
- `verify:esm-cutover-source`：**PASS**。
- `verify:component-classes`：**PASS**。
- `verify:source-browser`：**PASS**。
- `verify:browser`：**PASS**，production Chromium smoke + source ESM Chromium 均通过。
- `verify:release`：**PASS**。
- resource/lifecycle balance regression：**PASS**。

本轮真实浏览器迁移过程中捕获并修复了仅靠 `node --check` 无法发现的运行级问题，包括：

- `PickerField / TimePanel` 的 `DOMFactory` 声明遗漏；
- `WheelPanel` 缺失 `normalizeSize / defaultItemHeight` helper；
- `TimePanel` 缺失 `own` helper；
- `ColorPicker` 残留旧变量引用；
- Picker static defaults 与 frozen contract 的数组类型要求不一致；
- WheelPicker compat capability manifest 顺序必须与 frozen legacy manifest 完全一致。

因此本轮不是只完成语法迁移，而是经过真实 import、真实 source Chromium 与 production regression 三层验证。

## Production 冻结

最终 build / test 后 frozen dist SHA-256 仍与 HOTFIX6 / v22 完全一致：

```text
JS   13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d
CSS  5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92
d.ts fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

`src/qxframe9a7c2.js` 仍为 **14,471 行**，本轮没有为了提高迁移数字去修改 frozen legacy production kernel。

当前环境再次确认 **Rollup executable 不存在**。因此：

- source-side Picker authority 已完成；
- production dist 继续冻结；
- 尚未宣称 production Rollup cutover 完成；
- 5→10、20→30 的 production-side 剩余门槛继续保守计分。

## 下一步

下一批优先进入 **76→80 Time/Wheel 公共能力收口**。由于 `TimePanel / WheelPanel` 已在 v23 提前成为 canonical ESM authority，下一轮可以直接审查并统一剩余 Time/Wheel 公共 session、keyboard/scroll/value projection 边界，而无需再次搬迁实现。

随后进入 **80→84 TreeQuery / Item Accessors**，再继续处理剩余 13 个 temporary legacy implementation，并为 84→88 集合/数据组件和 88→95 Registry 清仓阶段减少前置阻塞。
