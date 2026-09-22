# QXFRAME9A7C2 ESM / Component 加速迁移 v15

## 当前整体完成度

按《QXFRAME9A7C2 src → ESM + Component/Family Base 0→100 迁移执行手册》的阶段百分比作为架构门槛权重，而不是按文件数或代码行估算：**约 39%**。

> source-side 实现已经领先于正式发布门槛；由于当前环境仍无法执行 Rollup，5→10 与 20→30 的 production cutover 不能计为完全完成，因此总完成度不虚高计算。

| 阶段 | 当前判断 | 计入 |
|---|---|---:|
| 0→5 基线冻结 | 完成 | 5/5 |
| 5→10 Rollup 双构建 | 配置/对照均就绪，但 Rollup binary 缺失，硬门槛未过 | 3/5 |
| 10→15 Node 工具 ESM | 完成 | 5/5 |
| 15→20 ESM 公共入口 | 完成 | 5/5 |
| 20→30 kernel 拆分 | 79 个 ESM authority + source cutover 已完成；production kernel 尚未删除 | 8.5/10 |
| 30→35 Floating UI ESM dependency | 未正式开始 | 0/5 |
| 35→40 Component | Component / contracts / transaction / hooks 已完成 | 5/5 |
| 40→45 FieldComponent | 未开始 | 0/5 |
| 45→50 低风险普通组件 | 本阶段清单已基本收口；Progress/Result/Loading/Steps class 化，CSS-only 项去 IIFE | 5/5 |
| 50→76 Popup / Overlay / PopupField / Picker | 未开始 | 0/26 |
| 76→80 Time/Wheel 公共能力 | 未完成 | 0/4 |
| 80→84 TreeQuery / Item Accessors | ItemAccessors 有基础，TreeQuery 未完成 | 0.5/4 |
| 84→88 集合/数据组件 | Item 已成为 ESM canonical owner，其余未迁 | 0.5/4 |
| 88→95 高风险组件 + Registry 清仓 | 未开始 | 0/7 |
| 95→97 architecture verify | 已建立大量 migration guards / graph / coverage / cutover verifier | 1.5/2 |
| 97→100 发布与最终验收 | Rollup 未执行，未计入 | 0/3 |

合计：**39/100**。

## v15 本轮加速完成

### 1. 一次清理 13 个 manifest-only legacy module

以下模块没有 runtime implementation，仅用于 `defineModule()` / ModuleManifest + CSS 依赖：

`alert / avatar / badge / button / card / checkbox / descriptions / empty / form / grid / icon / layout / radio`

现在统一由 `src/compat/manifestOnlyModules.js` 在临时兼容期登记 metadata；这些单独 IIFE 文件已经退出 `src/index.js` / `cutover-entry.js` source dependency graph。

行为/元数据保持：ModuleManifest 仍为 72 个模块，与 frozen dist 完全一致。

### 2. Item 成为真正 ESM BuildingBlock owner

新增：

- `src/components/item.js`
- `tools/manifests/esm-building-block-authority.json`
- `src/compat/buildingBlockModules.js`（临时 Registry adapter）

`BuildingBlockRegistry.get('Item') === Item` 已做 canonical identity 验证。

`src/modules/item.js` 已退出 source cutover graph，仅为 legacy production builder 保留。

### 3. Steps extends Component + source authority cutover

新增 `src/components/steps.js`：

- `Steps extends Component`
- 直接 import `Collection / ActiveItem / KeyboardNavigation / RovingProjection / Renderer / DOM / Item`
- `Registry.get = 0`
- `defineModule = 0`
- `globalThis.QXFRAME9A7C2 = 0`
- 不复制 `destroy()` / `updateOptions()` 公共生命周期

Frozen-dist parity 覆盖：

- 初始 state / DOM
- `setCurrent()`
- `next()`
- `setItems()`
- `updateOptions()`
- `onChange` callback sequence
- immutable `container/document`
- invalid option transaction rollback
- destroy idempotency

全部 PASS。

### 4. source graph 大幅下降

v14：67 个 reachable legacy implementations。

v15：**52 个**。

单轮减少 **15 个（-22.4%）**。

当前 source authorities：

- 79 kernel/runtime ESM capabilities
- 6 Component class authorities：Carousel / Collapse / Loading / Progress / Result / Steps
- 1 ESM BuildingBlock authority：Item
- 13 manifest-only modules 已移除单独 legacy implementation

## v15 验收

- ESM import graph：95 files / 335 edges / 0 cycles / 0 legacy imports
- executable source cutover：PASS
- public components：40
- BuildingBlocks metadata：14
- ModuleManifest：72
- reachable legacy implementations：52
- release syntax：222 JS/MJS
- release JSON：22
- browser smoke：PASS
- src/qxframe9a7c2.js：14,471 lines（production legacy 未误改）

Frozen production hashes：

- JS `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- CSS `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
- d.ts `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`

Rollup 仍为唯一生产 cutover 硬阻塞：

```text
sh: 1: rollup: not found
exit 127
```

## 下一批优先级

1. 继续利用 ESM `Item`，优先迁 `VirtualList / Menu` 等集合型 consumer。
2. 开始真正的 `FieldComponent`，迁 `TextField / InputNumber / InputOTP / Slider / Rate`，避免继续单个普通 Component 横向铺开。
3. Rollup 一旦可执行，立即暂停旁路迁移，完成 5→10 / 20→30 production cutover，并删除失去 authority 的 kernel sections。
