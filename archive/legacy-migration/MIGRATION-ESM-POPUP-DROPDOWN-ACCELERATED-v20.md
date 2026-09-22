# QXFRAME9A7C2 ESM 迁移 · Popup Family / Dropdown 收口 · v20

## 本轮目标

本轮从 v19 继续推进 50→58 PopupComponent 阶段，先清理 Dropdown 的两个前置依赖，再完成 Dropdown source authority：

1. `ItemCollection` 从 legacy `BuildingBlockRegistry` 实现迁为静态 ESM canonical owner。
2. `Scroll` 从 legacy component module 迁为静态 ESM support owner。
3. `Dropdown extends PopupComponent`，统一 Popup family 的 public open/close/toggle/setOpen/reposition 生命周期。
4. 冻结 production dist，不提前执行尚未具备 Rollup 的 production cutover。

## 完成内容

### ItemCollection

新增 `src/components/item-collection.js`：

- 保持原 HOTFIX6 ItemCollection runtime 行为；
- 所有 Core/Headless/DOMHeadless/BuildingBlock 依赖改为静态 import；
- `Registry.get/define`、`defineModule()`、QX 全局依赖为 0；
- `VirtualList`、`Item` 使用 ESM canonical owner；
- 通过临时 `buildingBlockModules.js` adapter 维持剩余 legacy consumer。

### Scroll

新增 `src/components/scroll.js`：

- 保持 `create / attachViewport / createDefaultDOM` API；
- `InteractionPolicy` 不再运行时 Registry lookup；
- contract 校验使用 runtime-independent `ComponentContracts`；
- 通过临时 `supportModules.js` adapter 继续向 legacy ComponentRegistry 暴露相同 API。

`Scroll` 当前是 ESM support authority，最终 88→92 阶段仍需完成真正 Component class 收口。

### Dropdown

新增 `src/components/dropdown.js`：

```text
Component
  ↓
PopupComponent
  ↓
Dropdown
```

Dropdown 不再公开实现自己的：

- `open()`
- `close()`
- `toggle()`
- `setOpen()`
- `reposition()`
- `destroy()`
- `updateOptions()`

PopupComponent 成为 Popup family 唯一 public popup lifecycle owner。

Dropdown 自身保留：

- hierarchy / branch selection；
- ItemCollection surface；
- submenu Trigger tree；
- keyboard routing；
- selection / action / search；
- Dropdown-specific DOM projection。

Root Trigger 的 `closeTree()` 通过 PopupComponent controller adapter 接入，因此 `Dropdown.close()` 仍保持原有“关闭整个 submenu tree”语义。

## Popup family 当前状态

```text
PopupComponent        PASS
├─ Tooltip            PASS
├─ Popover            PASS
├─ Popconfirm         PASS
└─ Dropdown           PASS
```

50→58 PopupComponent source-side 阶段已完成。

## Source graph

v19 → v20：

```text
reachable legacy implementations   31 → 28
class source authorities           15 → 16
building-block authorities          8 → 9
support authorities                 6 → 6
ESM graph files                    118 → 121
ESM static edges                   533 → 587
cycles                               0
legacy imports                       0
```

Executable cutover：

```text
reachable source files             160
static import edges                651
public components                   40
ModuleManifest                      72
BuildingBlocks                      14
monolithic kernel imported           0
legacy-entry imported                0
```

## 验收

全部通过：

- core / contracts / platform
- 79 kernel ESM candidate parity
- kernel coverage
- import graph / wave guard / consumer guard
- executable cutover rehearsal/source
- ESM public entry
- ESM support authority guard
- Component base / Field family / Popup family
- generic class authority guard
- release verify
- production Chromium smoke
- source ESM Chromium smoke

Source Chromium 直接验证：

- ItemCollection canonical adapter identity
- Scroll canonical `attachViewport` identity
- Dropdown `instanceof Dropdown`
- Dropdown `instanceof PopupComponent`
- open / close
- ItemCollection list creation
- setValue
- ComponentRegistry class identity

## 冻结产物

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

`src/qxframe9a7c2.js` 仍为 14,471 行，仅保留给当前 legacy production builder。

## Rollup 门槛

`npm run build:rollup` 仍实际返回：

```text
Built 72 modules; dependency graph verified.
sh: 1: rollup: not found
exit 127
```

因此 production authority 尚未切换。

## 整体完成度

按 0→100 手册中的架构门槛权重重新核算：**约 55%**。

主要已完成或大部分完成：

- baseline / Node ESM tools / source ESM public entry；
- kernel source-side candidate/cutover；
- Component base；
- Field simple family；
- low-risk Component classes；
- PopupComponent 4/4；
- 部分 collection/picker foundations；
- architecture verification / source-browser verification。

主要未完成：

- production Rollup cutover；
- 30→35 Floating UI npm ESM dependency；
- OverlayComponent；
- PopupFieldComponent；
- PickerComponent；
- TimeUnit / WheelMetrics；
- TreeQuery / collection 完整迁移；
- high-risk components；
- Registry / legacy kernel 最终清仓。

