# QXFRAME9A7C2 ESM + Component 迁移报告 · ACCELERATED v22

## 当前完成度

- 整体架构完成度：约 **68%**。
- 64→70 `PopupFieldComponent`：**source-side 100%（4/4）**。
- PopupField 成员：`Autocomplete / Select / Cascader / TreeSelect` 均已成为真实 ESM class source authority。
- `Tree` 已直接迁为 `Tree extends Component` 的 ESM BuildingBlock authority，提前推进 84→88 集合阶段。
- reachable legacy source implementations：**25 → 20**。

## 本轮 source authority

### PopupField

```text
Component
  ↓
FieldComponent
  ↓
PopupFieldComponent
  ├─ Autocomplete
  ├─ Select
  ├─ Cascader
  └─ TreeSelect
```

四个具体组件都不再自行拥有公共 `open / close / toggle / setOpen / reposition / updateOptions / destroy` 生命周期；这些职责由 `PopupFieldComponent + Component` 统一承担。

### Tree

`Tree` 没有先迁成临时 factory，而是直接成为：

```text
Tree extends Component
```

`TreeModel / Selection / Disclosure / AsyncTaskGroup / InteractionPolicy / ItemCollection` 继续以 composition 使用，没有塞进继承链。

## 验收

- ESM graph：131 files / 749 static edges / 0 cycles / 0 legacy imports。
- Kernel ESM authorities：79。
- Class source authorities：22。
- BuildingBlock authorities：11。
- Reachable legacy source implementations：20。
- Public Components：40。
- ModuleManifest：72。
- `verify:core / contracts / platform / esm-core / coverage / waves / consumers / release`：PASS。
- `verify:popup-field-family`：4/4 PASS。
- Production Chromium smoke：PASS。
- Source ESM Chromium：PASS，包含 Tree 与 TreeSelect 新实现。

## Production 冻结

```text
JS   13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d
CSS  5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92
d.ts fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

`src/qxframe9a7c2.js` 仍为 14,471 行。Production Rollup cutover 仍受当前环境缺少 Rollup 可执行文件阻塞，因此没有把 source-side 完成度伪装成 production cutover。

## 下一步

优先进入 70→76 `PickerComponent`：先把 DatePicker / TimePicker / ColorPicker / WheelPicker 共同的 PickerSession、draft/commit/cancel、needConfirm、footer、clear/now/confirm/cancel 生命周期收进真正 Family Base，再批量迁四个 Picker。
