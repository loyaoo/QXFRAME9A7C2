# QXFRAME9A7C2 fix(10) 完整未修复问题总表与 fix(11) 收口计划 v5 · 历史遗留多套体系专项

> 基线：`qxframe9a7c2-v2.19.81-card-form-input-polish-fix(10)`
>
> 用途：下次对话直接上传本文件 + 最新项目 ZIP，即可继续进行 fix(11) 大收口。
>
> 本文只整理 **fix(10) 之后仍未修复、已确认需要处理或需要专项验收的问题**。  
> fix(9)/fix(10) 已完成的 ObserverHub constructor、DOM selector 安全入口、直接 listener 收口、普通组件 timer 收口等不重复列为待办。
>
> 核心判断：QX 当前已经不缺大型 Overlay / Focus / Observer / State 基础设施。下一阶段主要问题是：
>
> 1. 已有 Core/Headless/DOMHeadless 的采用率仍不完整；
> 2. 组件之间缺统一的 Interaction Design System；
> 3. 多状态叠加、连续输入、异步、跨 document、销毁恢复等边界尚未完全收口；
> 4. 需要把人工经验变成 verify / contract / regression tests，防止以后重新分叉。

---

# 1. fix(11 总目标)

fix(11 不应再按“发现一个 Bug → 打一个组件补丁”的方式推进，而应同时完成四层收口：

1. **Core/Runtime 收口**
   - Runtime Schema
   - Scheduler hardening
   - Async task
   - State/value equality
   - Document/Realm
   - DOM side-effect ownership
   - Diagnostics

2. **Interaction Logic 收口**
   - Focus ownership
   - Active/Selected/Hover/Focus 分离
   - Keyboard contract
   - Pointer/Keyboard handoff
   - Continuous interaction session
   - disabled/readOnly/loading 统一

3. **Interaction Visual 收口**
   - 状态叠加矩阵
   - Focus ring 仲裁
   - active cursor 背景
   - disabled + selected
   - Motion rhythm
   - micro-layout polish

4. **自动防回退**
   - verify-core
   - contract tests
   - resource-balance tests
   - complex composition tests
   - browser/platform contract
   - API manifest / legacy manifest

---

# 2. P0：Core / Runtime / 架构必须收口

## P0-01 ComponentRuntime OptionSchema 全组件落地

### 当前问题

`ComponentRuntime` 已经支持：

```text
defaults
schema
immutable
legacy
optionImpact
initializer
allowUnknown

validateOptions()
mergeOptions()
getOrCreateInstance()
updateInstance()
```

但 fix(10 中 visible components 基本没有真正把 option contract 全部迁入 `schema`。

仍有大量组件自行维护：

```text
LEGACY_OPTIONS
normalizeEnum()
rejectLegacy()
unknown option check
type check
default merge
updateOptions structural check
```

### 解决方案

让 `ComponentRuntime.definition` 成为单一事实源：

```js
definition: {
    defaults: {},
    schema: {},
    immutable: [],
    legacy: [],
    optionImpact: {},
    allowUnknown: false
}
```

逐组件删除重复：

```text
rejectLegacy
enum/type validation
unknown option detection
重复 defaults merge
可由 Runtime 统一的 updateOptions 检查
```

### 验收

- 40 个 visible component 均声明正式 schema；
- Runtime 能统一校验 create/updateOptions；
- legacy/immutable/unknown 行为一致；
- verify 阻止组件重新实现重复 OptionSchema。

---

## P0-02 StateController adoption 不完整

### 当前问题

已有 `StateController`，但实际直接采用组件数量很少。

大量组件仍各自维护：

```text
value
defaultValue
internalValue
controlled/uncontrolled
external sync
draft/commit
onChange
change dedupe
```

### 解决方案

把适合的组件逐步迁入统一 StateController：

```text
Select
TreeSelect
Cascader
Slider
Calendar
DatePicker
TimePicker
Tags
InputNumber
Rate
其他 value/defaultValue 型组件
```

统一：

```text
controlled/uncontrolled
committedValue
draftValue
setExternalValue()
requestChange()
commit()
rollback()
reset()
equals()
normalize()
copyValue()
```

### 验收

- controlled/uncontrolled 行为一致；
- external value 更新不会覆盖正在进行的 draft；
- value 未变化不重复 emit；
- destroy/updateOptions 不产生迟到 change。

---

## P0-03 Value Equality contract

### 当前问题

`FormBridge` 仍存在类似：

```js
JSON.stringify(previous) !== JSON.stringify(currentValue)
```

的问题。

这会导致：

- object key order 不同产生伪 change；
- cyclic object 无法 stringify；
- array/object 语义相等无法按组件语义处理；
- change dedupe 与 StateController 不一致。

### 解决方案

统一：

```text
equals
normalizeValue
copyValue
```

默认：

```js
Object.is(a, b)
```

复合值组件自行提供语义 equality。

### 覆盖

```text
StateController
FormBridge
Selection
Select multiple
Slider range
Tags
Tree check values
component setValue()
```

### 验收

- 值不变不 emit；
- object/array 型组件可配置语义 equality；
- FormBridge 不再依赖 JSON.stringify。

---

## P0-04 Scheduler exception isolation / flush 恢复

### 当前问题

当前 `Scheduler.measure()/mutate()` 中，如果一个 task callback 抛错，可能：

```text
后续同 batch task 不执行
已 splice 出来的 task 丢失
mutation phase 被跳过
layoutScheduled 状态已被重置
新入队任务没有 frame 驱动
```

一个组件的异常可能污染同一帧其他组件。

### 解决方案

统一 `runTasks()`：

```js
try {
    task.callback(timestamp);
} catch (error) {
    report(error, task);
}
```

但不能只是吞异常。

必须确保：

```text
measure batch
→ mutate batch
→ reentrant queue
→ next frame
```

状态始终恢复。

### 验收

测试以下场景：

- measure 中第一个 task throw；
- mutate 中第一个 task throw；
- task 中再次 schedule measure/mutate；
- cancel 已入队 task；
- destroy 时还有 queued task；
- 一个 task throw 不影响其他组件 task。

---

## P0-05 AsyncTask 第二轮收口：AsyncTaskGroup

### 当前问题

虽然已有 `Headless.AsyncTask`，但组件仍分别实现：

```text
Autocomplete → requestId++
Tree → Map<key, loadGeneration>
Cascader → datasetGeneration + loadGeneration
```

说明 latest-wins / keyed async 仍未统一。

### 解决方案

保留：

```text
AsyncTask
= 单一 latest-wins task
```

新增轻量：

```text
AsyncTaskGroup
= key → AsyncTask
```

统一：

```text
AbortController
signal
ignore stale result
cancel
cancelAll
destroy
pending/success/error/cancel
data version
```

### 应迁移

```text
Autocomplete search
Tree async children
Cascader async children/dataset
其他 future remote load
```

### 验收

- 请求乱序不会覆盖新状态；
- destroy 后 resolve/reject 不再修改组件；
- datasource 替换后旧请求失效；
- 同 key 重复请求可取消/替换；
- 不同 key 可并发。

---

## P0-06 ScrollLock 仍有 unsafe querySelectorAll

### 当前问题

`ScrollLock.resolveNodes()` 对：

```text
fixedTargets
stickyTargets
```

仍可能直接调用：

```js
doc.querySelectorAll(value)
```

因此非法 selector 仍可能抛出原生 DOMException。

### 解决方案

`Core.DOM` 增加：

```js
DOM.queryAll(root, selector)
```

语义：

```text
valid selector → Element[]
invalid selector → []
```

所有公开 selector 输入必须走：

```text
DOM.query
DOM.queryAll
DOM.matches
DOM.closest
DOM.resolveElement
```

### 验收

verify 禁止公共 selector 配置直接进入原生：

```text
querySelector
querySelectorAll
matches
closest
```

---

## P0-07 Document / Realm 收口

### 当前问题

QX 已经支持：

```text
opts.document
element.ownerDocument
doc.defaultView
```

但 fix(10 中仍有多个 module 直接：

```js
global.document.createElement(...)
global.document.createDocumentFragment(...)
global.document.createTextNode(...)
```

已确认涉及：

```text
Calendar
Collapse
ItemCollection
Pagination
PeriodPanel
Tree
Upload
VirtualList
```

这会造成 iframe / alternate document 下 DOM node 来自主 document。

### 解决方案

框架硬规则：

```text
create() 一旦解析出 doc
→ 整个 instance 生命周期禁止再用 global.document 创建 DOM
```

统一：

```js
const doc = ...
const view = doc.defaultView || global
```

所有：

```text
Event
CustomEvent
requestAnimationFrame
performance
navigator
getComputedStyle
```

优先使用当前 realm。

### 验收

- `src/modules` 禁止 `global.document.create*`；
- iframe document smoke；
- popup/portal/virtualizer 在同 ownerDocument 工作；
- Event/CustomEvent constructor 来自正确 realm。

---

## P0-08 DOMProjection / MutationLease

### 当前问题

不同 subsystem 对临时 DOM 副作用的恢复方式不统一。

部分代码：

```text
记录 original
→ 写 QX value
→ destroy
→ 无条件恢复 original
```

如果业务代码期间已经修改该 style/attribute/class，QX destroy 会把业务的新值覆盖掉。

`PositionAdapter` 已经有正确模式：

```text
current === applied
→ restore original

current !== applied
→ 外部已经接管，不恢复
```

### 解决方案

新增轻量：

```text
DOMProjection / MutationLease
```

支持：

```text
setStyle()
setAttribute()
setProperty()
addClass()
removeClass()
restore()
refCount
```

恢复必须遵循 ownership。

### 应迁移

```text
ScrollLock
InteractionIsolation
SemanticStyles
Config scope projection
PositionAdapter
Loading target position
其他临时 style/class/attribute mutation
```

### 验收

- 外部后写入值不被 destroy 覆盖；
- nested lock/refCount 正确；
- destroy 顺序不同不破坏最终 DOM。

---

## P0-09 ReorderInteraction 下沉

### 当前问题

当前公共排序交互仍挂在 visible `Sort` component：

```text
Sort.createReorderInteraction()
```

而 Upload 已反向依赖 Sort。

这意味着 visible component 承担了通用 DOM interaction primitive。

### 解决方案

下沉：

```text
DOMHeadless.ReorderInteraction
```

建立在：

```text
PointerSession
LayerManager
Lifecycle
InteractionPolicy
Scheduler/Scroll
```

上。

必须支持：

```text
getKey
getItems
canStart
canDrop
orientation
getDataVersion
onPreview
onMove
onCommit
onCancel
autoScroll
drag overlay
destroy/cancel
```

关键原则：

```text
记录 sourceKey，不记录 sourceIndex
DOM index ≠ logical item index
dataVersion 变化时安全 cancel
```

### 覆盖

```text
Sort
Upload
Tags future reorder
Transfer future reorder
Table row reorder
Table column reorder
```

Tree 只扩展 hierarchical `before/inside/after` policy。

---

## P0-10 Diagnostics 资源平衡

### 当前问题

`PerformanceDiagnostics` 目前覆盖面不足，无法系统检测长期资源泄漏。

### 解决方案

扩展 snapshot：

```text
ComponentRuntime.instances
Lifecycle.scopes/resources
DOM.listeners
ObserverHub.resize/mutation/intersection
AsyncTask.pending
LayerManager.layers
FocusScope.activeScopes
ScrollLock.activeLocks
InteractionIsolation.activeNodes
Scheduler.pending
Transition.active
LogicalOwnership records
```

提供：

```js
Diagnostics.snapshot()
Diagnostics.assertBalanced(before, after)
```

### 验收

循环 100 次：

```text
Modal open/close/destroy
Drawer nested popup
Select open/close
Tooltip create/destroy
VirtualList attach/detach
async cancel
```

结束后资源必须与 before 平衡。

---

# 3. P0：Interaction Design System 必须收口

## P0-I01 Focus Visual Ownership

### 当前明确问题

List：

```text
root :focus-visible → outline
active item .is-keyboard-focus → outline
```

出现双 ring。

JSON 也有同类：

```text
json-root focus-visible
json-action is-keyboard-focus
```

### 系统规则

一个交互上下文只能有一个“主视觉焦点”。

```text
真实 DOM focus 就是操作对象
→ 自己画 focus ring

DOM focus 只是 VirtualFocus host
→ host 不画 ring
→ active descendant 画 ring

active item 内部 Button/Input/Checkbox 获得真实 focus
→ 子控件画 ring
→ 父 active item 暂停 ring

composite 无 active descendant
→ host 可以显示 fallback ring
```

### 必查组件

```text
List
Tree
Menu
Select
Autocomplete
Cascader
TreeSelect
Tags
JSON
PeriodPanel
WheelPanel
Calendar
Table
Transfer
```

---

## P0-I02 VirtualFocus descendant-focus suspension

### 当前问题

Tags 等场景：

```text
Tag.is-keyboard-focus
+
Tag close button :focus-visible
```

父 Tag 和内部按钮同时出现焦点框。

### 解决方案

`VirtualFocus` 增加视觉投影判断：

```text
shouldProjectVisualFocus()
suspendOnDescendantFocus: true
```

逻辑 active key 保留，但 descendant 真正 focus 时暂停父 ring。

---

## P0-I03 Focus / Active / Selected / Hover 四态分离

### 当前问题

`.is-keyboard-focus` 目前承担过多职责：

```text
键盘 active cursor
视觉 focus
当前 option
```

导致 popup option 也用强 outline。

Generic Item 又缺少完整 standalone：

```css
.is-active:not(.is-selected)
```

视觉。

### 正式定义

```text
Hover
= pointer 临时经过
= subtle hover background

Active
= composite 当前导航 cursor
= active background

Selected
= 已提交 value/identity
= selected background / color

Focus-visible
= 当前真正视觉焦点所有者
= outline
```

### Popup 规则

```text
field real focus
→ field ring

option active
→ active background
→ 不再默认使用第二个强 outline
```

适用于：

```text
Select
Autocomplete
Cascader
TreeSelect
Menu
List
Tree
Transfer
```

---

## P0-I04 State Arbitration Matrix

### 当前问题

目前状态都有独立样式，但缺“叠加后最终结果”的正式 contract。

必须定义：

```text
selected + hover
selected + active
selected + disabled
selected + focus
checked + disabled
error + focus
loading + focus
readonly + hover
open + hover
active + pointer-hover-another-item
nested real focus + virtual active parent
```

### 建议优先级语义

```text
Capability:
disabled/loading/readOnly

Semantic identity:
selected/checked/current/open/error

Navigation:
active

Input transient:
hover/pressed

Focus:
focus-visible
```

CSS 不能再靠 selector source order 偶然覆盖。

---

## P0-I05 Capability 与 Semantic Identity 分离

### 当前问题

Generic Item disabled 会把 selected 背景直接擦掉。

结果：

```text
selected
→ disabled
→ 看不出仍然 selected
```

### 正确规则

disabled 取消：

```text
hover
pressed
active cursor
pointer affordance
activation
新的 focus ring
```

但保留 muted：

```text
selected
checked
current
open（按语义）
```

例如：

```text
selected + disabled
→ muted selected background
→ disabled text/icon
→ no hover
→ no press
```

### 必查

```text
List
Menu
Tree
Select
Transfer
Table row selection
Tags
Checkbox/Radio/Switch
```

---

## P0-I06 Pointer ↔ Keyboard Handoff

### 当前问题

鼠标静止在 B：

```text
keyboard ↓ ↓ ↓
→ active 到 E
→ rerender/scroll
→ stationary pointer 仍覆盖 B
```

可能再次触发 hover/active 竞争。

Menu 也存在：

```text
pointerover → hoverKey
CSS :hover
keyboard active → another item
```

同时出现两个主 cursor。

### 解决方案

composite-local interaction owner：

```text
keyboard navigation
→ keyboard owns cursor
→ managed hover 不得抢 active

真实 pointermove/click
→ pointer owns cursor

touch interaction
→ touch owns cursor
```

注意这不是简单修改全局 `InteractionModality`。

### 必查

```text
Menu
Select
Autocomplete
Cascader
TreeSelect
List
Tree
Transfer
Table
Calendar/PeriodPanel
```

---

## P0-I07 Tree horizontal key contract

### 当前问题

standalone Tree 当前：

```text
Right:
折叠 → 展开
已展开 → child

Left:
展开 → 折叠
已折叠 → parent
```

而 TreeSelect 已经使用另一套 disclosure-only handler。

### fix(11 统一规则

```text
↑ ↓
→ 只改变可见节点位置

Home End
→ 首尾节点

→
→ 只展开当前节点
→ 已展开则 no-op

←
→ 只收起当前节点
→ 已折叠则 no-op

Enter
→ activate/select

Space
→ check/uncheck
```

### 关键验收

长按 / `event.repeat`：

```text
→ → → → →
```

第一下展开后 `activeKey` 永远不变化。

---

## P0-I08 Tree 与 TreeSelect 键盘逻辑统一

不得再存在：

```text
Tree → 一套 horizontal behavior
TreeSelect → 另一套 horizontal behavior
```

共用统一 disclosure handler。

---

## P0-I09 Tree readOnly policy

### 当前问题

当前 readOnly 可能与 disabled 一样锁住：

```text
expand
collapse
check
```

### 建议 contract

```text
disabled
→ 不可操作

readOnly
→ 不可修改业务 value
→ 可 focus
→ 可 navigation
→ 可 scroll
→ 可 expand/collapse
→ 可查看 popup/tooltip
```

### 必查

```text
Tree
TreeSelect
Cascader
Collapse
Menu
```

---

## P0-I10 Continuous Keyboard Interaction session

### 当前明确问题

Slider 每次 Arrow `keydown` 都可能：

```text
final: true
```

长按方向键产生多次 final/afterChange。

### 正确 session

```text
第一次 directional keydown
→ beforeChange once
→ capture snapshot

keydown/repeat
→ intermediate change
→ value 未变化不 emit

keyup
→ afterChange once

Escape（若支持）
→ rollback

blur
→ finalize

destroy/updateOptions
→ safe cancel/finalize
```

ColorPanel 已经有正确模式，应抽取/复用。

### 后续也应核对

```text
InputNumber hold
Rate keyboard
Slider
ColorPanel
Wheel/Picker keyboard
drag-like keyboard control
```

---

## P0-I11 Motion Language 统一

### 当前问题

当前同时存在：

```text
120 / 180 / 240 / 320ms
```

和：

```text
100 / 200 / 300ms
```

两套节奏。

### 建议统一

```text
fast = 100ms
→ hover / focus / press

mid = 200ms
→ local component internal transition
→ indicator / collapse / fade

slow = 300ms
→ Modal / Drawer / larger surface
```

统一有限 easing tokens。

旧 token 暂时映射到 canonical motion token，再逐步删除。

---

## P0-I12 Motion interruption / reversal

所有动画必须专项验证：

```text
open → close → open
expand → collapse → expand
hover → leave → hover
drawer/modal interrupted
collapse dynamic height change
```

要求：

```text
从当前视觉进度继续/反转
不能闪回起点
不能先跳到目标尺寸再回来
不能出现残留 class/inline style
```

---

## P0-I13 motion=false / reduced-motion 必须真正归零

不能只是 CSS 不动。

必须同步归零：

```text
transition-duration
animation-duration
JS delay
transitionend fallback timeout
scheduled delayed state
```

`motion=false` 和 reduced-motion 都不能残留交互延迟。

---

## P0-I14 disabled/loading 不产生“成功操作感”

### disabled

```text
no value change
no press visual
no ripple
no selection animation
no indicator movement
no fake active state
```

### loading

```text
no activation
保留已有 focus
spinner 可以 motion
keyboard/mouse activation 都 gate
```

### readonly

```text
no business mutation
是否允许 disclosure/view/hover 按组件语义
```

三者不能只靠 `pointer-events:none`。

---

## P0-I15 Menu inline submenu 动画

### 当前问题

使用类似：

```css
max-height: 0;
.is-open { max-height: 40rem; }
```

导致：

- 短内容也按巨大高度动画；
- 速度与内容高度不一致；
- 超过 40rem 有边界；
- 快速开关不连续。

### 解决方案

复用 Collapse 已有 measured-height 逻辑：

```text
0
→ real scrollHeight
→ settled 后 auto
```

做成 Transition preset/helper，而不是另造 Motion Core。

---

# 4. P1：Interaction / 组件细节完善

## P1-I01 Tree Enter / Space 分工

建议：

```text
Enter → activate/select
Space → check/uncheck
←/→ → disclosure
```

避免 Enter/Space 同时承担 check。

---

## P1-I02 Rate Home 与 clearable 矛盾

当前：

```text
clearable=false
Delete/Backspace 不允许 0
Home 却仍然 → 0
```

修复：

```text
Home → clearable ? 0 : minimumSelectableValue
```

---

## P1-I03 Tabs movable indicator

当前 active tab 自己用 `::after`：

```text
A indicator 消失
B indicator 出现
```

缺少连续运动。

### 解决

Nav 内单一：

```html
<div class="tabs-indicator"></div>
```

按 active tab 更新：

```text
x/y
width/height
transform
```

形成连续滑动。

---

## P1-I04 Tabs indicator / panel 动画拆分

当前：

```text
animated: boolean
```

建议：

```js
animated: {
    indicator: true,
    panel: false
}
```

旧 boolean 作为兼容 alias。

默认：

```text
indicator 动
panel 不动
```

或 panel 仅 160–200ms 轻 fade。

---

## P1-I05 Ripple 只负责视觉，输入走 PressInteraction

当前 Ripple 自己处理：

```text
mousedown
mouseup
touchstart
touchend
keyboard
```

应改为：

```text
PressInteraction
→ pressStart
→ pressEnd
→ cancel
```

Ripple 只画视觉。

这样：

```text
mouse/touch/pen
Space/Enter
pointercancel
disabled/loading
```

统一。

---

## P1-I06 Carousel keyboard event ownership

Carousel root 当前可能吃到 nested button/dot 的：

```text
ArrowLeft
ArrowRight
Home
End
```

需要明确 KeyboardRegion：

```text
独立 interactive descendant 有自己的 key contract
→ root 不抢

root/composite navigation target
→ carousel 处理
```

---

## P1-I07 Overlay mouse / keyboard / outside path 一致性

固定组合矩阵：

```text
Modal → Select
Modal → Select → Tooltip
Modal → Cascader
Drawer → TreeSelect
Drawer → Popover → Menu
Popover → Tooltip
Menu → nested popup
```

每组验证：

```text
mouse
keyboard Enter
Tab
Shift+Tab
Escape
outside press
select
confirm
cancel
```

必须统一：

```text
是否 close
是否 commit
是否 rollback
是否 restoreFocus
是否 stop propagation
```

中间过程不能短暂把焦点泄露到背景。

---

## P1-I08 Overlay logical-open / visual-settled lifecycle

正式定义：

```text
onOpenChange
= logical state changed

afterOpenChange
= visual transition settled
```

统一：

```text
Trigger
Modal
Drawer
PickerField
WheelPicker
Select/Dropdown/Popover
```

业务 readiness 不依赖动画完成。

---

## P1-I09 Reveal / scroll contract

统一：

```text
item 已完全可见 → 不滚
刚超顶部 → 只滚到刚好可见
刚超底部 → 只滚到刚好可见
Arrow → 默认 nearest
Home/End → 必要滚动
popup open → 不产生多余跳动
```

先统一 contract，不急着创建大 `RevealController`。

未来可以连接：

```text
TreeModel
Virtualizer
Scroll
VirtualFocus
```

---

## P1-I10 Async Visual State

异步 load/search/data replace 后：

```text
active
focus
selection
scroll anchor
hover
loading
```

不能出现：

```text
旧 active 残留
焦点跳到错误 item
scroll 突跳
旧请求闪回
loading 闪烁
```

专项覆盖：

```text
Tree async expand
Cascader load
Autocomplete search
Select remote options
VirtualList data replace
```

---

## P1-I11 Drag interaction visual / behavioral completeness

`ReorderInteraction` 还要统一：

```text
drag preview
drop indicator
forbidden target
auto-scroll
virtualized list
expanded row
data mutation while dragging
keyboard/pointer source
cancel
```

不能只统一 pointermove。

---

## P1-I12 Menu selected font-weight 抖动

当前 selected 使用 `font-weight:600` 可能导致：

```text
文字宽度变化
ellipsis 移动
icon/text 位置变化
1–2px layout jitter
```

建议 selected 主要使用：

```text
background
color
indicator
```

而不是通过字重改变布局。

此项属于视觉精修，不是功能 Bug。

---

## P1-I13 Micro-layout Polish

全组件检查：

```text
icon
text
suffix
clear button
loading spinner
arrow
close
badge
prefix
```

在：

```text
hover
focus
selected
loading
error
open
```

切换时不得发生：

```text
1–2px 位移
宽度抖动
文字跳动
icon 重叠
ellipsis 变化
按钮占位变化
```

优先：

```text
Input/Select/Picker
Menu
Tabs
Tags
Steps
Upload
Image
Button
```

---

# 5. P1：Core/Platform/维护能力

## P1-01 SemanticStyles precedence

当前多个 style/class projection 系统并存。

必须正式定义唯一 precedence，例如：

```text
framework base
<
theme/config tokens
<
scoped Config
<
component semantic classNames/styles
<
instance explicit style
<
runtime interaction projection（仅拥有自己的临时状态）
```

所有：

```text
SemanticStyles
Item projection
Config scope
Component options.style
runtime state projection
```

遵循同一顺序。

---

## P1-02 FormBridge hardening

专项覆盖：

```text
original field moved into component
form="" ownership
Portal popup 内 button
nested component
reset
submit
programmatic setValue
native input/change
multiple values
disabled/readOnly
destroy restore authored field
form 生命周期中被移动
```

同时明确：

```text
required
form.checkValidity()
form.reportValidity()
```

是否属于 QX 正式 contract。

不要半支持。

---

## P1-03 API Manifest + TypeScript declaration 自动生成

Runtime Schema 完成后自动生成：

```text
dist/qxframe9a7c2.d.ts
dist/qxframe9a7c2-api.json
docs/generated/component-api.json
```

目的不是把源码迁成 TS，而是保证：

```text
实现
校验
README/docs
IDE 提示
声明式 initializer
updateOptions
```

来自同一个 contract。

---

## P1-04 Legacy metadata / Migration manifest

当前 legacy 多为字符串 blacklist。

Schema 增加：

```text
since
deprecatedSince
replacement
removedIn
migrationNote
```

自动生成 migration 文档并让 verify 检查。

---

## P1-05 Browser / runtime baseline

正式声明：

```text
Chrome/Edge
Firefox
Safari
```

最低支持版本。

维护：

```text
docs/browser-support.md
tools/verify-platform.js
```

明确：

```text
AbortController
Pointer Events
ResizeObserver
MutationObserver
IntersectionObserver
inert fallback
CSS features
Trusted Types
```

哪些有 fallback、哪些要求浏览器原生支持。

---

## P1-06 Diagnostics 与 verify 结合

除了资源数量，还要能作为 CI contract：

```text
create → destroy 后必须 balanced
open → close 后 blocking refs balanced
async cancel 后 pending = 0
observer attach/detach balanced
```

---

## P1-07 InteractionDetails 统一 lifecycle reason contract

现有：

```text
reason
source
originalEvent
trigger
currentTarget
cancel()
allowPropagation()
stopPropagation()
```

继续统一到：

```text
OverlayRuntime
DismissableLayer
TriggerInteraction
PressInteraction
StateController
FocusScope
```

避免组件自己新增平行 reason 字符串。

---

# 6. P2：需要决策或专项验证

## P2-01 Shadow DOM 支持边界

当前处于“部分支持”：

```text
EventDelegation 使用 composedPath
部分 Layer ownership 识别 host
但 DOM.closest 主要沿 parentElement
```

必须做决定：

### A. 正式支持

新增/统一：

```text
DOM.composedParent()
DOM.composedClosest()
DOM.getActiveElement()
DocumentContext
```

Portal/Focus/Event/LogicalOwnership 全部支持 composed tree。

### B. 暂不支持

明确版本 contract 仅支持普通 Document DOM。

不能继续半支持。

---

## P2-02 Trusted Types / strict CSP

`DOMTemplate` 虽然只允许 staticHTML，但最终仍可能：

```js
template.innerHTML = markup
```

还有少量框架静态 `innerHTML`。

需要：

```text
StaticHTML / TrustedHTML adapter
```

或简单结构改 `createElement()`。

目标支持：

```text
Content-Security-Policy:
require-trusted-types-for 'script'
```

---

## P2-03 Presence / Suspension

先测，不先造 Core。

检查 hidden/keepMounted 场景：

```text
Tabs inactive panel
Collapse closed panel
display:none ancestor
Modal/Drawer keepMounted
```

内部是否仍持续：

```text
ResizeObserver
Virtualizer work
autoplay
position update
layout measurement
```

只有测出实际浪费后再考虑：

```text
Lifecycle.pause()
Lifecycle.resume()
```

---

## P2-04 component-scoped Config defaults

只有真实需求出现时再做：

```js
Config.configure({
    components: {
        Tooltip: { openDelay: 300 },
        Modal: { destroyOnClose: true }
    }
});
```

不要把所有 option 全局化。

---

## P2-05 Virtualizer grouping / sticky section

Ant/Listy 等成熟实现可参考，但 QX 只有在 List/Table 真正需要：

```text
grouping
sticky group header
imperative reveal
```

时再扩，不为“看起来高级”而增加复杂度。

---

# 7. 仍需专项继续扫描、尚未完全确认的问题

以下不是已经确认要立刻实现的 primitive，而是 fix(11 前应继续检查的高风险边界：

```text
Transition/Motion 中断与反转
Virtualizer 数据突变 + scroll anchoring
LayerManager 多 document
Renderer ownership
destroy()/updateOptions() 重入
用户 callback 抛异常后的组件内部状态一致性
URLPolicy / CSP 边界
所有 value 组件 controlled/uncontrolled 矩阵
所有组件 disabled/readOnly/loading 矩阵
Portal owner destroy 后 descendant cleanup
异步 callback 在 destroy 后到达
动态 children identity 保持
重复 change / open-change 去重
全局副作用 dispose 恢复
```

这些应在实施 fix(11 时同步扫描，确认后加入对应 P0/P1。

---

# 8. 全 40 Component Interaction Audit 固定检查维度

每个 visible component 必须按下面 12 个维度逐项验收。

## 8.1 Focus Visual Ownership

检查：

```text
root
active descendant
nested action
popup field
virtual focus
```

是否只存在一个主视觉焦点。

## 8.2 Visual State Arbitration

组合检查：

```text
hover
pressed
active
selected
checked
open
focus
error
readonly
loading
disabled
```

不能只测单状态。

## 8.3 Keyboard Contract

每个 key 明确归类：

```text
navigation
activation
disclosure
editing
cancel
commit
no-op
```

并测试：

```text
event.repeat
长按
组合键
IME composition
```

## 8.4 Pointer ↔ Keyboard Handoff

静止鼠标不能抢 keyboard active。

只有：

```text
真实 pointermove
click/tap
```

才能重新接管当前 composite cursor。

## 8.5 Scroll & Reveal

检查：

```text
nearest
already-visible no-scroll
Home/End
virtualized item
popup opening
async data update
scroll anchoring
```

## 8.6 Press Feedback

Mouse / Touch / Pen / Space / Enter：

```text
press start
press end
cancel
disabled
loading
```

必须一致。

## 8.7 Motion Language

检查：

```text
duration
easing
enter
leave
reverse
interrupt
motion=false
reduced-motion
```

## 8.8 Composite Focus

重点：

```text
Input
Select
Picker
TreeSelect
Autocomplete
Cascader
Tags
Table row actions
```

field/clear/arrow/suffix/popup item 不得同时出现多个主焦点提示。

## 8.9 Overlay Handoff

不同 close reason：

```text
Escape
Tab
outside press
select
confirm
cancel
programmatic
owner destroy
```

分别明确：

```text
commit?
rollback?
restoreFocus?
```

## 8.10 Drag Interaction

检查：

```text
preview
drop indicator
forbidden drop
auto-scroll
virtualization
expanded content
data mutation
cancel
```

## 8.11 Async Visual State

load/search 后：

```text
active
focus
scroll
selection
loading
hover
```

不得残留旧状态。

## 8.12 Micro-layout Polish

所有交互状态切换不得发生无意义：

```text
1–2px shift
width jitter
icon jump
spinner overlap
ellipsis jump
border thickness layout shift
```

---

# 9. QX Interaction Design System：必须成为框架权威的 10 条规则

## Rule 1：一个交互上下文只有一个主视觉焦点

真实 DOM focus、VirtualFocus、nested control 必须仲裁。

禁止双 ring。

## Rule 2：Focus / Active / Selected / Hover 必须分离

```text
Focus → outline
Active → navigation cursor background
Selected → committed identity
Hover → pointer transient
```

## Rule 3：键盘职责稳定、正交

```text
纵向导航
横向 disclosure
activation
check
cancel/commit
```

不要一颗键同时承担多个不相关职责。

## Rule 4：连续按键仍必须保持原语义

`event.repeat` 不能让：

```text
disclosure
```

突然变成：

```text
navigation
```

## Rule 5：Pointer / Keyboard 显式交接控制权

静止 pointer 不得抢 keyboard cursor。

## Rule 6：Capability 不擦除 Semantic Identity

```text
disabled/loading/readOnly
```

控制“能不能做”。

```text
selected/checked/current/open/error
```

控制“它是什么状态”。

## Rule 7：Motion 表达状态变化，不制造状态

```text
disabled 不播放成功反馈
value 不变不重复动画
中断从当前位置反转
```

## Rule 8：逻辑状态与视觉 Transition 分离

```text
onOpenChange → logical
afterOpenChange → visual settled
```

业务状态不得等待动画才能成立。

## Rule 9：异步结果必须属于当前生命周期

旧请求、已销毁 owner、旧 datasource 的结果不能回写。

## Rule 10：所有临时 DOM mutation 必须有 ownership

只有“仍然是我写的值”才能由我恢复。

---

# 10. 建议 fix(11 实施顺序

## Phase A：先立 contract，不改组件表现

1. Interaction Design System 文档化；
2. Focus/Active/Selected/Hover 定义；
3. State Arbitration Matrix；
4. disabled/readOnly/loading contract；
5. Motion tokens；
6. Keyboard key-role contract；
7. Runtime Schema 规范；
8. Document/Realm 规范；
9. DOM mutation ownership 规范。

## Phase B：Core hardening

1. Scheduler exception isolation；
2. DOM.queryAll；
3. StateController/value equality；
4. AsyncTaskGroup；
5. DOMProjection；
6. ReorderInteraction；
7. Diagnostics balance；
8. Runtime Schema 全迁移。

## Phase C：交互系统迁移

1. VirtualFocus visual ownership；
2. Item standalone active；
3. pointer/keyboard handoff；
4. Tree horizontal keys；
5. Tree readonly / Enter / Space；
6. Slider continuous session；
7. Ripple → PressInteraction；
8. disabled/loading feedback；
9. Menu measured collapse；
10. Motion token migration。

## Phase D：组件视觉与 Motion

1. Tabs movable indicator；
2. Tabs panel animation split；
3. Popup option active background；
4. selected + disabled skin；
5. Menu font-weight/layout jitter；
6. micro-layout polish。

## Phase E：复杂组合验收

1. Overlay combinations；
2. Virtualizer + async + focus + scroll；
3. FormBridge nested/portal；
4. cross-document/iframe；
5. async destroy race；
6. reorder + virtual + data mutation；
7. rapid open/close/reverse。

## Phase F：自动防回退

1. verify-core；
2. resource-balance；
3. interaction contract tests；
4. API manifest；
5. `.d.ts`；
6. browser-support；
7. legacy migration manifest；
8. visual regression checklist。

---

# 11. fix(11 完成后必须达到的验收结果

## 架构

```text
ComponentRuntime schema 覆盖所有 visible component
普通组件不再自行重复 option contract
异步 load 不再自行维护 generation/requestId
公开 selector 全走 Core.DOM 安全入口
module DOM creation 使用 owner document
DOM side effects 有 ownership
Sort/Upload 不再通过 visible component 共享 primitive
```

## 状态

```text
value 未变不 emit change
controlled/uncontrolled 一致
disabled 不擦除 selected identity
readOnly 不等于 disabled
loading 键鼠 activation 全阻止
```

## 焦点

```text
无双 focus ring
nested control focus 时 parent virtual ring 暂停
popup option active 不与 field focus 竞争
```

## 键盘

```text
Tree ←/→ 只 disclosure
repeat 不改变语义
Slider 一次长按只产生一次 final
Carousel 不抢 nested control key
```

## Pointer

```text
静止 mouse 不抢 keyboard cursor
真实 mousemove 后才切回 pointer ownership
```

## Motion

```text
只剩 canonical 100/200/300ms 系统
motion=false 无 JS/CSS 延迟
disabled 无成功反馈
rapid reverse 连续
Menu 使用 measured height
Tabs indicator 连续移动
```

## Overlay

```text
mouse/keyboard/outside path 结果一致
nested popup ownership 正确
Shift+Tab 不短暂泄露背景
close reason 对 commit/rollback/restoreFocus 有统一定义
```

## 资源

```text
create/open/close/destroy 循环后 Diagnostics balanced
observer/listener/layer/focus/scrollLock/async 无增长
```

---

# 12. 明确暂时不要做

以下不要因为参考成熟框架而引入：

```text
React/Vue 式 VDOM
完整响应式系统
Fiber
SSR hydration
Suspense
Activity runtime
重型 Form Engine
第二套 Overlay/Focus/Pointer/State 基础设施
```

原则：

> 已有 primitive 能扩展就扩展，不产生 Overlay2 / Focus2 / Pointer2 / State2。

---

# 13. 下次对话可直接使用的任务指令

将本文件与最新 QX ZIP 一起上传，然后直接发送：

```text
这是 QXFRAME9A7C2 fix(10) 之后完整的未修复问题总表。

请以这份文档作为 fix(11 的正式任务清单，不要只挑部分问题处理。

执行顺序：
1. 先扫描最新源码确认每个问题当前是否仍存在；
2. 已经被其他修改顺带解决的项目标记为已解决，不重复造新实现；
3. P0 Core/Runtime 与 P0 Interaction 优先；
4. 不新增与现有 Core 重叠的 primitive；
5. 所有组件采用统一 Interaction Design System；
6. 完成后执行 build、npm test、verify、语法检查、src/dist 一致性、ZIP integrity；
7. 增加对应回归测试，避免后续重新分叉；
8. 最终返回新的 ZIP 和“已完成 / 未完成 / 延后”对照表。
```

---

# 14. 最终原则

QX 下一阶段不是继续增加组件数量，也不是继续堆底层服务。

真正目标是：

```text
底层 primitive 足够少且唯一
↓
所有组件真正采用
↓
交互 contract 唯一
↓
视觉状态叠加明确
↓
Motion 节奏统一
↓
复杂组合也保持一致
↓
verify 自动防止回退
```

成熟度最终体现在：

> 单个状态正确只是基础；多个状态、多个输入设备、多个 overlay、异步、连续操作同时出现时，用户依然只看到一个自然、连续、可预测的结果。

---

# 15. v3 新增：成熟框架进一步对照发现的交互 / 渲染 / 性能问题

> 本章是在 v2 已有问题之外继续对照 Layui、Bootstrap、Ant Design、Arco Design、TDesign、Tabler、shadcn/Base UI、React、Vue 以及 DataTables 后新增的问题面。
>
> 注意：下面分为两类：
>
> - **QX 当前已经能找到对应风险或残留实现**：应纳入 fix(11。
> - **成熟框架已经踩过坑、QX 应提前建立 Contract 防止发生**：不等同于当前已经存在 Bug，但应加入验收/verify。

## 15.1 P0：Stable Interaction DOM（交互关键 DOM 身份稳定）

### 问题

组件 render 时重建 DOM 本身不是错误，但如果被替换的是：

```text
focused input
active option
正在编辑的 cell
popup root
drag source
scroll viewport
FocusScope root
transition owner
```

就会造成：

```text
focus 丢失
IME 中断
selection/caret 重置
popup 误关闭
drag session 丢失
VirtualFocus key 与 DOM 脱节
scroll anchor 跳动
animation 重新开始
```

fix(10 中仍有多处：

```js
node.textContent = '';
replaceChildren();
while (node.firstChild) node.removeChild(node.firstChild);
```

这些 API 本身可以继续使用，但必须区分：

```text
Disposable Render DOM
vs
Interaction-Critical DOM
```

### Contract

普通数据更新、样式更新、过滤、分页、renderer strategy 切换时：

```text
interaction-critical node identity
→ 必须尽量稳定
```

只有结构语义确实变化时才允许替换。

### 验收

- 输入框正在输入时更新 options，input node 不被替换；
- Table cell 正在编辑时普通 row update 不丢 editor；
- Popup 内容刷新不重建 popup root；
- active item key 稳定时 DOM 尽量 reconcile 而非 remove/recreate；
- drag/transition 中禁止替换 owner node。

---

## 15.2 P0：Render Transaction（渲染策略切换必须保持交互 session）

### 问题

成熟 Table 经常动态切换：

```text
non-virtual ↔ virtual
responsive full ↔ collapsed
grouped ↔ flat
loading data ↔ loaded data
```

如果把 renderer 切换等同于“重建组件”，就会丢失：

```text
popup
focus
active item
edit session
scroll
selection cursor
```

QX Table 当前 `virtual: 'auto'` 会按 row count 跨阈值切换 renderer，而普通 render 又可能销毁 filter popup。

### Contract

renderer backend 改变必须形成一次事务：

```text
capture logical interaction state
→ switch renderer
→ rebind DOM by stable key
→ restore focus/active/popup/edit/scroll
```

不能继续按：

```text
keepFilterPopup = true
```

一个场景增加一个特殊 flag。

### 验收

- Table 数据量跨 virtualThreshold，Filter Popup 不关闭；
- edit cell 不因 virtual/non-virtual 切换丢失；
- active cell/row key 不变化；
- scroll anchor 基于 key 保持。

---

## 15.3 P0：Open Entry Policy（Popup 打开入口统一）

### 当前缺口

QX 已有 `ItemCollection.prepareOpen()`：

```text
none
selected
first
last
```

但不同 popup component 仍各自决定：

```text
打开后真实 DOM focus 在哪
初始 active item 是谁
初始 scroll 在哪
reopen 是 preserve 还是 reset
```

### Contract

每类 popup 明确：

```js
{
    focus: 'reference' | 'popup' | 'first-interactive',
    active: 'selected' | 'first' | 'last' | 'none' | 'preserve',
    fallbackActive: 'first' | 'none',
    scroll: 'nearest-active' | 'selected' | 'preserve' | 'reset',
    reopen: 'recompute' | 'preserve'
}
```

不一定新增 Registry primitive，可以先作为统一 contract。

### 必查

```text
Select
Autocomplete
Cascader
TreeSelect
Dropdown/Menu
DatePicker
TimePicker
Popover
Table Filter
```

### 验收

分别验证：

```text
pointer open
ArrowDown open
ArrowUp open
Enter/Space open
typing open
programmatic open
reopen
```

---

## 15.4 P0：Navigation Eligibility Policy

### 问题

只有 `canActivate` 不够。

一个 item 可能：

```text
可导航但不可选择
可展开但不可修改
可 focus 但不可 drag
不可操作但仍保留 selected identity
```

### 统一能力

```text
canNavigate
canFocus
canActivate
canSelect
canCheck
canEdit
canExpand
canDrag
canDrop
canClear
```

InteractionPolicy 提供基础能力，组件语义再组合。

### 验收

disabled item 不得通过：

```text
Arrow navigation side effect
bulk select
API toggle
drag/drop
keyboard shortcut
```

绕过限制。

---

## 15.5 P0：Measurement DOM / Clone DOM 必须彻底 inert

### 风险

成熟框架曾出现隐藏测量 DOM 也挂载真实 popup / event / focus 行为，导致视觉副本反过来干扰真实组件。

QX 后续可能出现：

```text
width measurement clone
sticky/fixed clone
drag preview
responsive details proxy
offscreen measurement
```

### Contract

Measurement/Visual Proxy DOM：

```text
不得注册 Layer
不得注册 FocusScope
不得注册 Trigger
不得成为 Selection owner
不得成为 VirtualFocus owner
不得注册业务 listener
不得拥有独立 component instance
```

默认：

```text
inert
pointer-events:none
tabIndex=-1
```

### 原则

```text
一个 logical item
→ 只能有一个 interaction owner
→ clone 只能是 visual proxy
```

---

## 15.6 P0：Geometry Isolation（浮层不能反向污染自己的测量边界）

### 问题面

Popup 放在自定义 container 中时：

```text
popup 插入/变宽
→ container geometry 被撑大
→ boundary 重新测量
→ popup 又根据被自己改变后的 boundary 定位
```

形成 measurement feedback。

### Contract

定位流程：

```text
Scheduler.measure
→ 读取 reference/boundary 原始 geometry

compute
→ Floating/Position algorithm

Scheduler.mutate
→ 写 popup size/position
```

用于 positioning 的 boundary 不得被本次 floating mutation 自身污染。

### 验收

```text
custom container
transform ancestor
table scroll container
narrow viewport
fixed/sticky ancestor
popup max-width/max-height
```

---

## 15.7 P1：Native Input Policy

### 问题

不同组件自己记：

```text
autocomplete
spellcheck
autocapitalize
inputMode
enterKeyHint
```

容易漏。

fix(10 中 Table Filter 动态创建 `type=search`，目前没有和其他 Input/Select 一样统一浏览器原生输入策略。

### 方案

增加轻量 helper：

```text
DOM.configureTextInput()
```

或现有 Control/Input primitive 中的共享 policy。

根据用途区分：

```text
search
text
numeric
otp
email
freeform
```

### 验收

浏览器 autocomplete / spellcheck / autocorrect UI 不得遮挡 QX Popup 或抢输入状态。

---

## 15.8 P1：Affordance Parity（能力与视觉提示必须一致）

### Contract

```text
draggable=false
→ 不显示 grab cursor

canDrop=false
→ 不显示合法 drop indicator

disabled/loading
→ 不显示成功 press/ripple

readonly
→ 不出现暗示“可以修改”的交互反馈

not sortable
→ 不显示 sort affordance

not resizable
→ 不显示 resize handle
```

UI 看起来能做的事情必须真的能做；不能做就不能展示对应 affordance。

---

## 15.9 P1：Internal Action Containment

### 问题

Row/Card/Tag 等可点击容器中嵌套：

```text
Button
Close
Menu
Checkbox
Link
```

内部 action 不应该同时激活父容器。

### Contract

```text
action click
→ action owns activation
→ parent item selection/rowClick/cardClick 不触发
```

不是无条件 stopPropagation，而是由 nested action ownership 统一判断。

### 必查

```text
Card
Table row
Tree row
Tags
Upload item
Image preview
Menu item custom action
Notification action
```

---

## 15.10 P1：Trigger Gesture State Machine

### 高风险场景

```text
left button hold
right click/contextmenu
pointer leave while pressed
pointercancel
lostpointercapture
touch long press
```

hover/click/contextmenu 不能仅靠独立 enter/leave/click handler 拼接。

### 建议状态

```text
idle
hovering
pressed
context-open
leaving
```

建立在现有：

```text
PointerSession
TriggerInteraction
InteractionModality
```

之上，不新造第二套 Pointer primitive。

---

## 15.11 P1：Popup 不得制造不可达 viewport / document overflow

### Contract

Popup 最终布局后必须保证：

```text
trigger 可见
popup 关键操作区域可达
viewport/container 不被无意义撑宽
table horizontal scrollbar 不因 popup 出现
```

Position/size 策略统一：

```text
flip
shift
size
maxHeight
internal scroll
```

### 必查

```text
Table cell popup
Dropdown
Select
Cascader
DatePicker
Tooltip
Popover
Modal 内 popup
```

---

## 15.12 P1：Transition Layering Invariant

### 问题

transform/opacity/filter 等 Motion 容易创建新的 stacking context。

### Contract

动画 wrapper 不得改变：

```text
LayerManager semantic plane
blocking hierarchy
Modal > background
Popup > owner surface
Notice plane
Tooltip plane
```

整个：

```text
enter
running
reverse
leave
```

期间层级必须恒定。

---

## 15.13 P1：Connected Controls Focus Elevation

### 场景

```text
ButtonGroup
InputGroup
Segmented-like controls
Table header adjacent controls
```

相邻元素：

```text
border collapse
negative margin
overflow
z-index
```

可能吞掉 focus ring。

### Contract

focused child：

```text
临时提高 stacking order
ring 不被邻居覆盖
ring 不因 group overflow 被截断
```

不能用更粗 border 改变尺寸。

---

## 15.14 P1：State Geometry Invariance

### Contract

普通状态切换应尽量不改变 geometry：

```text
hover
focus
selected
checked
error
open
disabled
```

优先改变：

```text
color
background
outline
inset shadow
opacity
```

避免改变：

```text
border-width
padding
font metric
height
line-height
```

否则产生 1–2px jitter。

---

## 15.15 P1：preventDefault 最小化

### Contract

键盘 handler：

```text
handled === true
→ 才 preventDefault
```

不要因为组件 root 收到 keydown 就 blanket preventDefault。

特别保护：

```text
input
textarea
contenteditable
native select
media controls
browser shortcuts
```

---

## 15.16 P1：Trigger / Target 状态重新对账

### 问题

trigger 不得维护与 target 分离的 shadow boolean。

### Contract

programmatic：

```text
open/close
expand/collapse
disabled update
controlled option update
model change
```

之后统一：

```text
canonical state
→ projection reconcile
→ trigger class/icon/expanded/open
```

---

## 15.17 P1：Initial Focus Determinism

### Contract

Modal/Drawer/Popover 的 initial focus：

```text
只能由自身 focus policy 决定
```

不能被：

```text
trigger 是 Button 还是 Dropdown item
旧 activeElement 类型
trigger teardown 顺序
portal mount timing
```

偶然改变。

---

## 15.18 P1：Focus Restore 不得 Scroll Jump

### Contract

默认恢复 focus：

```js
focus({ preventScroll: true })
```

如果确实需要 reveal：

```text
显式走 Reveal policy
```

不要让浏览器默认 focus scroll 把页面拉回旧 trigger。

---

## 15.19 P1：Semantic Token Completeness

SemanticStyles precedence 之外，再增加 token completeness audit：

禁止组件私自长期维护：

```text
同义颜色
局部 overlay shade
任意 z-index
重复 focus color
重复 selected/hover colors
```

应该进入：

```text
semantic tokens
motion tokens
layer tokens
component alias tokens
```

---

## 15.20 P1：Projection Idempotency / DOM Write Dedupe

### Contract

```text
class 已正确 → 不 toggle
attribute 相同 → 不 set
style 相同 → 不写
text 相同 → 不 textContent
key/structure 相同 → reconcile，不重建
geometry 未 dirty → 不 measure
```

### Diagnostics 建议增加

```text
renderCount
subtreeRebuildCount
domWriteCount
classWriteCount
styleWriteCount
measurementCount
```

用于定位“为什么这个组件不流畅”。

---

# 16. v3 新增：Table 组件专项强化计划

## 16.1 定位判断

fix(10 的 Table 已经不是最基础的轻型 `<table>` wrapper。

当前已经具有：

```text
本地 items / columns model
single/multiple selection
disabled row selection gate
expanded row
本地单列 sort
列 filter
filter search
filter menu/tree/custom popup
local pagination model
fixed start/end columns
fixed-column shadow
sticky header
sticky summary
responsive sm/md hide
virtual / auto virtual
variable virtual size for expanded rows
keyboard cell navigation
header/pager keyboard domains
cell edit target
row click
onCell
custom cell render
custom expanded row render
summary
title/footer/caption
loading
empty
striped/hover/bordered/fixed layout
scrollToRow
focusCell
```

所以 QX Table 的正确定位应改成：

> **中型业务数据表格（Business Data Table）**
>
> 不追求 spreadsheet / Excel 克隆，但应该覆盖后台系统最常见的数据浏览、查询、编辑、列管理、状态保持和大数据加载。

---

## 16.2 DataTables 与 Layui 值得学习的方向

### DataTables 最值得学习：Core + Extensions

DataTables 本身把能力拆开：

```text
Core
Responsive
FixedColumns
FixedHeader
KeyTable
Select
RowReorder
ColReorder
Scroller
RowGroup
Buttons
SearchBuilder
StateRestore
```

优点：

```text
基础 Table 不需要承担所有复杂度
高级能力按需组合
每个 extension 有明确职责
```

DataTables 还明确区分：

```text
client-side processing
server-side processing
```

大数据时分页、排序、搜索交给服务器。

### Layui 最值得学习：后台业务完整度

Layui Table 把日常管理后台常用功能做得比较完整：

```text
url/ajax remote data
pagination
toolbar/defaultToolbar
column visibility
export
print
reload/reloadData
renderData
updateRow
selection/checkStatus
column resize
sorting
editing
fixed columns
summary totalRow
row click/double/contextmenu
scrollPos
loading
custom templates
pagebar
```

### QX 应采用的中间路线

不要照搬 Layui 成为一个巨大 module，也不要把 DataTables 所有 extension 都实现。

采用：

```text
Table Visible Component
+
TableModel
+
可复用现有 Primitive
+
少量 Table 专属 Controller
```

---

# 17. Table 当前已确认的历史遗留 / 多套实现问题

## T-P0-01 Table 自己实现了一套迷你 Pagination

当前 Table pager 自己创建：

```text
Prev Button
"current / pageCount"
Next Button
```

但 QX 已经有完整 Pagination：

```text
页码
ellipsis
page-size changer
jumper
count
responsive
keyboard
layout tokens
refresh
```

### 问题

形成两套：

```text
Pagination interaction
Pagination styling
Pagination keyboard
Pagination focus
```

### 方案

Table 不再自己实现 pager。

改为复用 `Pagination` component。

推荐 Table option：

```js
pager: false | {
    layout,
    showTotal,
    showSizeChanger,
    showJumper,
    pageSizeOptions,
    ...
}
```

保持 TableModel 的 PaginationModel，只替换 View。

不要重新启用旧 legacy `pagination` option，避免和已废弃 API 混淆。

---

## T-P0-02 Table CSS 有“幽灵能力”

CSS 已存在但 Table JS 当前并未生成/使用：

```text
.qxframe9a7c2-table-resize-handle
.qxframe9a7c2-table-sort-handle
tr.is-dragging
tr.is-drag-before
tr.is-drag-after
.qxframe9a7c2-table-tree-toggle
.qxframe9a7c2-table-tree-cell
.qxframe9a7c2-table-tree-indent
.qxframe9a7c2-table-group-head
.qxframe9a7c2-table-nested
```

### 处理规则

每个 class 二选一：

```text
正式实现并写入 Table contract
或
删除为历史遗留
```

禁止继续保留“CSS 看起来有功能、JS 实际没有”的半实现。

### 建议

正式实现：

```text
resize handle
row/column reorder visual
grouped header（若进入 P1）
```

暂不做 TreeTable 时：

```text
table-tree-* 应删除或明确移到未来 TreeTable extension
```

---

# 18. Table P0：必须增强的核心能力

## T-P0-03 Remote Query / Server-side Data

### 当前缺口

TableModel 现在只知道：

```text
items.length
本地 filter
本地 sort
本地 pagination
```

缺：

```text
服务器 total
远程 page
远程 sort
远程 filters
全局 search
request cancellation
stale result
error/retry
```

### 方案

不要恢复 legacy `dataSource`。

新增清晰 loader contract，例如：

```js
load: async function (query, context) {
    // context.signal
    return {
        items: [],
        total: 0
    };
}
```

Query：

```js
{
    page,
    pageSize,
    search,
    sorters,
    filters
}
```

内部复用：

```text
AsyncTask
AsyncTaskGroup（如有）
StateController
```

### 两种 mode

```text
local
→ TableModel 做 filter/sort/page

remote
→ Table 只管理 query state
→ server 返回 items + total
```

### 交互要求

重新请求时：

```text
旧 data 默认保留
显示 processing 状态
新结果完成后事务替换
```

不要每次 search/page 都先清空 Table 造成闪烁。

---

## T-P0-04 Projection / Index Cache

### 当前问题

TableModel 当前多处需要：

```text
keyOf
itemEntryByKey
columnByKey
filteredItems
orderedItems
projection
```

`itemEntryByKey()` / `columnByKey()` 仍是线性搜索，projection 也可以被多次重新计算。

### 方案

维护：

```text
entryList
entryByKey: Map
columnByKey: Map
orderedProjectionCache
pageProjectionCache
projectionVersion
```

mutation 时 invalidate。

### 额外优化

默认字符串排序：

```text
Intl.Collator
```

实例级缓存，不要每个 compare 都重复构建 locale compare 配置。

### 验收

大数据：

```text
10k local rows
sort/filter/select
```

不会出现明显主线程长卡顿。

---

## T-P0-05 Keyed Row Reconciliation

### 当前问题

full render 时：

```js
while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
```

再全部创建 row。

这会影响：

```text
DOM identity
focus
editing
custom embedded controls
transition
layout
性能
```

### 方案

按 row key reconcile：

```text
existing row map
next row order
reuse unchanged rows
patch dirty row
move existing row
remove stale row
```

virtual 模式只 reconcile visible range。

### 原则

```text
数据项 key 没变
→ row identity 尽量不变
```

---

## T-P0-06 Row Mutation API

Layui 已有 `updateRow`，DataTables 也提供 row data API。

QX 应增加至少：

```js
updateRow(key, patchOrUpdater, meta)
insertRows(items, config)
removeRows(keys, meta)
```

可选：

```js
invalidateRow(key)
```

### 目的

不要为了修改一个 cell：

```text
复制整个 items
→ setItems()
→ 整表 render
```

### 验收

`updateRow()`：

```text
只重渲染目标 row / related cells
保持 selection
保持 active cell
保持 edit session（若目标 editor 本身未被替换）
保持 scroll
```

---

## T-P0-07 Variable Virtual Row Measurement 批处理

### 当前问题

variable virtual row 当前 render loop 中：

```text
append row
→ getBoundingClientRect
→ append next row
→ getBoundingClientRect
```

存在 layout thrash 风险。

### 方案

```text
build all visible rows
→ append fragment
→ Scheduler.measure 一次读取所有 height
→ Virtualizer.measure batch
→ Scheduler.mutate 必要更新
```

或者让 Virtualizer/ObserverHub 负责异步 row measurement。

### 验收

expanded variable-height rows 快速滚动时：

```text
无 ResizeObserver loop
无明显 jank
无反复 synchronous layout
```

---

## T-P0-08 Table Geometry 全部走 measure/mutate

当前 fixed geometry 已经做到“先读 headers、再写 cells”，方向是对的。

进一步统一到：

```text
ObserverHub callback
→ dirty
→ Scheduler.measure
→ compute fixed offsets
→ Scheduler.mutate
→ set style/class
```

避免直接 Frame callback 内混合 geometry lifecycle。

---

## T-P0-09 Column Resize 正式实现

CSS 已经存在 resize handle，应正式实现，而不是保留死样式。

### Column options

```js
{
    width,
    minWidth,
    maxWidth,
    resizable: true
}
```

### 实现

复用：

```text
PointerSession
Scheduler.measure/mutate
DOMProjection
```

### Interaction

```text
pointerdown → resize session
pointermove → preview width
pointerup → commit width
Escape → rollback
dblclick → auto-fit（P1，可选）
```

### 事件

```text
onColumnResize
onColumnResizeEnd
```

### 注意

fixed columns resize 后必须实时更新 offsets。

---

## T-P0-10 ReorderInteraction 接入 Table

完成 `DOMHeadless.ReorderInteraction` 后：

### Column reorder

```text
column header drag
→ reorder columnState
```

### Row reorder

作为可选：

```text
rowReorder: false | config
```

不要默认所有 Table 都启用。

### 规则

```text
sourceKey，不用 sourceIndex
virtual DOM index ≠ logical index
fixed columns 可限制 movable range
disabled row 不可 drag
sort/filter active 时 row reorder 是否允许必须明确
```

建议：

```text
本地 manual-order 模式才允许 row reorder
存在 active sort 时默认禁用 row reorder
```

避免“当前显示顺序”和“真实数据顺序”语义冲突。

---

# 19. Table P1：日常后台能力强化

## T-P1-01 Global Search

增加：

```text
searchValue
onSearchChange
searchable columns
```

local：

```text
客户端 search matcher
```

remote：

```text
进入 query.search
```

需要：

```text
debounce
AsyncTask cancellation
Native Input Policy
```

Toolbar 中可直接组合 QX Input。

---

## T-P1-02 Column Visibility / Column State

增加正式 Column State：

```js
{
    key,
    visible,
    width,
    order,
    fixed
}
```

API：

```text
getColumnState()
setColumnVisible(key, visible)
setColumnOrder(keys)
setColumnWidth(key, width)
applyColumnState(state)
resetColumnState()
```

Column visibility UI 不要写死在 Table，可以由默认 toolbar/Popover 组合。

---

## T-P1-03 Toolbar / Table Layout

参考 DataTables 2 的 layout 思路，但保持 QX 简洁。

支持：

```text
toolbarStart
toolbarEnd
footerStart
footerEnd
```

或者：

```js
toolbar(context)
```

默认可选工具：

```text
search
refresh
column visibility
density
export
selected count/actions
```

全部复用已有：

```text
Button
Input
Popover/Menu
Select
```

不要让 Table 内部重新实现按钮体系。

---

## T-P1-04 Pagination 统一

Table pager 直接使用现有 `Pagination`。

支持：

```text
full page numbers
showTotal
page-size
jumper
simple mode
responsive
```

Table 只负责：

```text
page/pageSize state binding
```

---

## T-P1-05 Scroll Position Policy

参考 Layui `scrollPos`，但用 QX 命名体系。

建议：

```text
scrollPolicy:
'auto'
'preserve'
'reset'
```

或拆：

```js
{
    onPage: 'reset-y',
    onFilter: 'reset-y',
    onSort: 'preserve-x-reset-y',
    onRefresh: 'preserve'
}
```

默认后台表格建议：

```text
横向保持
分页/筛选/搜索后纵向回顶部
普通 updateRow 保持当前位置
```

---

## T-P1-06 State Persistence

DataTables 的 `stateSave` 很实用，但 QX 不应把 localStorage 强绑定进 Table 核心。

先提供：

```text
getViewState()
applyViewState()
resetViewState()
```

包含：

```text
page
pageSize
search
sort
filters
column visibility
column order
column width
fixed columns
density
```

再提供可选 storage adapter：

```text
localStorage
sessionStorage
custom server store
```

---

## T-P1-07 Export Data Contract

不要在 Table 核心内实现重型 XLSX。

先提供：

```js
getExportData({
    scope: 'visible' | 'filtered' | 'selected' | 'all',
    columns: 'visible' | 'all'
})
```

返回标准：

```text
headers
rows
column metadata
```

再做一个轻量 CSV exporter。

XLSX/print 作为外部 adapter。

---

## T-P1-08 Error / Processing State

当前只有：

```text
loading
empty
```

remote mode 需要：

```text
processing
error
retry
stale-data refresh
```

建议状态：

```text
initial-loading
refreshing
error-empty
error-with-stale-data
empty
ready
```

刷新时尽量保留旧 rows，避免整个表格闪白。

---

## T-P1-09 Row Events 补足

当前有 row click。

可增加常用：

```text
onRowDoubleClick
onRowContextMenu
```

内部走 EventDelegation。

不要给每行单独 listener。

Nested action 必须遵循 Internal Action Containment。

---

## T-P1-10 Grouped / Complex Header

DataTables 2 与 Layui 都支持复杂/多级表头。

QX CSS 已有：

```text
.table-group-head
```

但 JS 未实现。

如果业务需要，支持：

```js
columns: [
    {
        title: 'User',
        children: [
            { key:'name' },
            { key:'email' }
        ]
    }
]
```

### 注意

必须一次考虑：

```text
fixed columns
responsive hide
column resize
column reorder
sort/filter control
colspan/rowspan
keyboard header navigation
```

所以放 P1，不要仓促做半套。

---

## T-P1-11 Responsive Detail Mode

当前只有：

```text
column.responsive = sm/md
→ CSS hide
```

隐藏后用户无法看到该数据。

可以增加可选：

```text
responsiveMode: 'scroll' | 'hide' | 'details'
```

`details` 将隐藏列内容投到 expanded/details 区域。

但不要照搬复杂自动 priority engine。

可用：

```text
column.priority
column.responsive
```

明确控制。

---

## T-P1-12 `reflow()` / `resize()` API

参考 Layui `table.resize()` 和 DataTables hidden tab / responsive recalculation 的实际问题。

增加：

```js
table.reflow()
```

用于：

```text
hidden tab → visible
font loaded
container grid/layout changed
external sidebar resize
manual width mutation
```

执行：

```text
fixed geometry
responsive calculation
virtualizer viewport
scroll visibility
```

Observer 是主路径，`reflow()` 是显式兜底。

---

# 20. Table P2：先不做或按真实需求再做

## T-P2-01 Multi-sort

DataTables 支持多列排序。

QX 当前单列 sort 对后台大多数页面已经够用。

只有真实需要时再增加：

```text
sorters: [
    { key, order },
    ...
]
```

Shift+Click 作为 multi-sort UI。

---

## T-P2-02 Advanced SearchBuilder / SearchPanes

DataTables 有非常强的高级搜索扩展。

QX 暂时不要做。

普通：

```text
global search
column filter
custom filterDropdown
remote query
```

已经覆盖绝大多数后台需求。

---

## T-P2-03 Spreadsheet 级 Range Selection / Clipboard / AutoFill

暂不做：

```text
range selection
copy/paste matrix
fill handle
formula
Excel-like selection
```

这会把 QX Table 推向 DataGrid/Spreadsheet 产品。

---

## T-P2-04 重型 Editor

QX 当前 cell edit target + 自定义 render 已经足够。

不要在 Table 核心实现类似 DataTables Editor 的完整 CRUD Form Engine。

---

## T-P2-05 TreeTable

Layui 有独立 TreeTable。

QX 也不应该把普通 Table 与 TreeModel 强绑在一起。

如果未来需要：

```text
TreeTable extension / separate component
```

复用：

```text
Table
TreeModel
Virtualizer
```

在没有实现前，应清理或隔离当前 `.table-tree-*` 幽灵 CSS。

---

# 21. Table 性能专项

## 21.1 不要在 hot path 通过公开 API 反复拼装信息

成熟 DataTables 的 Responsive 曾出现数千行时因 hot function 反复调用高层公开 API 导致严重 jank。

QX 应保持：

```text
内部 hot path
→ 使用内部 projection/cache/map
```

不要：

```text
row loop
→ api.getState()
→ api.getRow()
→ api.getColumn()
```

层层重新计算。

---

## 21.2 Selection 已有 partial render，应继续扩展

当前 QX 对：

```text
selection
```

已经有 `renderSelectionProjection()`，不用整表重建。

这个方向应该继续扩展：

```text
updateRow
loading projection
column width
column visibility
expanded state（尽量局部）
```

---

## 21.3 Projection version cache

建议：

```text
dataVersion
columnVersion
filterVersion
sortVersion
pageVersion
```

拆分 dirty source。

例如：

```text
page 改变
→ 不重新 filter/sort
→ 只 slice ordered cache

selection 改变
→ 不重新 filter/sort/page
→ 只改 selection projection

column width 改变
→ 不重新 data projection
```

这是 Table 从“能用”走到“稳定流畅”的关键。

---

## 21.4 Key maps

维护：

```text
entryByKey
sourceIndexByKey
columnByKey
columnIndexByKey
```

避免 hot path 反复 O(n) search。

---

## 21.5 Virtual measurement 批处理

禁止：

```text
append row
read rect
append row
read rect
...
```

改为：

```text
mutate DOM batch
→ measure batch
→ virtualizer update batch
```

---

## 21.6 Custom renderer 调用次数必须可诊断

用户的：

```text
column.render()
summary()
title()
expanded renderer
```

可能很昂贵。

Diagnostics 增加：

```text
table.rowRenders
table.cellRenders
table.customRendererCalls
table.projectionBuilds
table.geometryMeasures
```

便于发现用户 renderer 与框架本身谁才是瓶颈。

---

# 22. Table 推荐最终能力等级

## Level A：Table Core（默认）

必须保持轻：

```text
render
selection
sort
column filter
pagination binding
expanded rows
fixed/sticky
keyboard
virtual
loading/empty/error
summary
```

## Level B：Business Table（默认 bundle 可用，但按 option 启用）

```text
remote loader
global search
Pagination component
column visibility
column resize
column reorder
updateRow/insert/remove
toolbar
view state
scroll policy
CSV export
```

## Level C：Extensions（只有需要时）

```text
row reorder
responsive details
grouped header
state storage
multi-sort
TreeTable
```

## 明确不进入 Base Table

```text
Spreadsheet range selection
AutoFill
Formula
重型 SearchBuilder
完整 CRUD Editor
XLSX engine
```

---

# 23. Table 强化后的建议 API 草案

> 这里只作为设计方向，实施前仍应结合 Runtime Schema 收口最终命名。

```js
Table.create({
    container,

    items,
    columns,

    // local / remote
    load: null,
    searchValue: '',
    page: 1,
    pageSize: 20,

    // table behavior
    selectionMode: 'multiple',
    virtual: 'auto',
    stickyHeader: true,

    // pager uses QX Pagination
    pager: {
        layout: ['count', 'prev', 'page', 'next', 'limit'],
        showTotal: true,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100]
    },

    // column capabilities
    columns: [
        {
            key: 'name',
            field: 'name',
            title: 'Name',
            sortable: true,
            filterOptions: [],
            width: 180,
            minWidth: 120,
            maxWidth: 320,
            resizable: true,
            visible: true
        }
    ],

    // interaction
    scrollPolicy: {
        page: 'reset-y',
        filter: 'reset-y',
        sort: 'reset-y',
        refresh: 'preserve'
    },

    // optional composition
    toolbar: function (context) {
        // return DOM / QX component composition
    }
});
```

Remote loader：

```js
load: async function (query, context) {
    // query:
    // page/pageSize/search/sorters/filters
    // context.signal

    return {
        items: [],
        total: 0
    };
}
```

新增 API：

```text
updateRow()
insertRows()
removeRows()

getColumnState()
applyColumnState()
resetColumnState()
setColumnVisible()
setColumnWidth()

getViewState()
applyViewState()
resetViewState()

getExportData()

reflow()
refresh()
```

---

# 24. Table fix(11 验收矩阵

## Data

```text
local items
remote load
stale request
abort
error
retry
empty
refresh with stale rows
```

## Query

```text
search
sort
filter
page
pageSize
query reset
controlled query
```

## Columns

```text
fixed start/end
resize
reorder
hide/show
responsive hide/details
width/min/max
group header
```

## Rows

```text
selection
disabled
expanded
updateRow
insert/remove
row reorder
row click/double/contextmenu
```

## Interaction

```text
mouse
keyboard
focus
edit
nested action
filter popup
toolbar
pagination
```

## Performance

```text
1k
10k local rows
virtual
variable row
expanded row
rapid filter
rapid resize
rapid scroll
```

## Continuity

```text
virtual auto threshold crossing
filter popup open during data update
edit session during updateRow
focus during column resize
scroll during remote refresh
```

## Geometry

```text
hidden tab → visible
CSS grid container
flex container
modal/drawer
fixed columns
sticky header
narrow viewport
```

---

# 25. fix(11 优先级更新

在原 v2 顺序基础上新增：

## 新增 P0

```text
Stable Interaction DOM
Render Transaction
Open Entry Policy
Navigation Eligibility
Measurement DOM inert
Geometry Isolation

Table:
Pagination 复用
Remote loader/query
Projection/index cache
Keyed row reconcile
Row mutation API
Virtual measurement batch
Column resize
ReorderInteraction integration
```

## 新增 P1

```text
Native Input Policy
Affordance Parity
Internal Action Containment
Trigger Gesture State Machine
Transition Layering
Connected Focus Elevation
State Geometry Invariance
preventDefault 最小化
Initial Focus Determinism
Projection Idempotency

Table:
Global Search
Column State
Toolbar
Scroll Policy
View State
CSV Export Data
Error/Processing
Row double/contextmenu
Grouped Header
Responsive Details
reflow()
```

---

# 26. 下次执行任务时对 Table 的额外要求

```text
不要把 Table 直接改造成重型 DataGrid。

先确认现有 TableModel、PaginationModel、Pagination Component、
Virtualizer、KeyboardNavigation、ReorderInteraction、AsyncTask、
StateController 能复用的部分。

尤其检查并清理：
1. Table 自己的 mini pager 与 Pagination 重复；
2. table-resize-handle / table-sort-handle / table-tree-* /
   group-head / drag CSS 等“幽灵能力”；
3. full tbody rebuild；
4. variable virtual synchronous measurement；
5. virtual:'auto' renderer 切换时 popup/focus/edit/scroll 是否丢失；
6. local-only projection 与未来 remote loader 的职责边界。

目标：
“中型业务 Table，日常后台够用，基础实现不重，高级能力可组合。”
```

---

# 27. v4 新增：Layui Table 深挖后必须补充的 Table Contract

> 本章只记录 v3 尚未合并的新增问题。  
> 已经在 v3 中存在的 remote loader、reload granularity、scroll policy、column resize、row mutation、reflow、summary、toolbar 等不重复展开。

## T-P0-11 Table Data Ownership Contract

### 问题

Table 不得向用户业务 row object 注入内部字段，例如：

```text
__index
__selected
__expanded
__editing
__measuredHeight
```

否则：

```text
Table 内部升级
→ 业务对象字段一起变化
→ JSON/API/表单提交可能携带内部字段
→ 用户数据与 UI metadata 耦合
```

### 方案

业务数据保持纯净：

```text
user row object
→ 永远只包含业务字段
```

内部状态全部 sidecar：

```js
rowMetaByKey.set(rowKey, {
    sourceIndex,
    selected,
    expanded,
    disabled,
    editing,
    measuredHeight
});
```

### 验收

- `getItems()` 返回用户业务对象，不包含 Table 内部 metadata；
- selection/expand/edit/measure 都不修改原 row；
- export/submit/JSON.stringify(row) 不带内部字段；
- row object 可 frozen/sealed 时 Table 仍正常工作。

---

## T-P0-12 Projection Pipeline / Invalidation Dependency

### 问题

Table 不能继续把所有变化都等价为：

```text
anything changed
→ render all
```

应正式区分：

```text
Source
→ Normalize
→ Filter
→ Sort
→ Page
→ Visible Projection
→ DOM Projection
```

### Invalidation 规则

```text
selection changed
→ selection DOM projection only

page changed
→ page + visible + DOM

sort changed
→ sort + page + visible + DOM

filter/search changed
→ filter + sort + page + visible + DOM

column width changed
→ geometry only

updateRow(non-filter/non-sort field)
→ target row/cell only

updateRow(filter/sort field)
→ invalidate affected projections
```

### 建议内部版本

```text
dataVersion
filterVersion
sortVersion
pageVersion
columnVersion
geometryVersion
selectionVersion
```

### 验收

Diagnostics 能看到：

```text
projectionBuilds
sortRuns
filterRuns
pageRuns
rowRenders
cellRenders
```

避免无意义重复计算。

---

## T-P1-13 Update Reason / Origin

### 问题

Table 更新后，框架和用户代码都需要知道：

```text
为什么更新
```

否则无法可靠判断：

```text
是否滚回顶部
是否关闭 popup
是否保留 edit
是否 restore focus
是否记录 state
是否播放 motion
```

### 统一 reason

```text
initial
data
refresh
search
filter
sort
page
page-size
row-update
row-insert
row-remove
selection
expand
column-resize
column-reorder
column-visibility
virtual-switch
reflow
remote-result
```

### API

所有相关 callback/details 统一携带：

```js
{
    reason,
    source,
    originalEvent
}
```

与现有 `InteractionDetails.reason` 保持命名逻辑一致。

---

## T-P0-14 Layout Convergence / Geometry Epsilon

### 问题

Table 很容易产生反馈震荡：

```text
measure
→ 写 width/height
→ scrollbar 出现
→ geometry 变化
→ observer
→ 再写
→ scrollbar 消失
→ geometry 恢复
→ 无限/高频循环
```

### Contract

一次布局必须收敛：

```text
measure N
→ mutate
→ measure N+1
```

若变化低于阈值：

```text
stop
```

### 建议

```text
geometry epsilon
device-pixel normalization
stable scrollbar compensation
```

例如：

```js
const normalized = Math.round(value * dpr) / dpr;
if (Math.abs(previous - normalized) < epsilon) return;
```

### 必查

```text
sticky header
fixed start/end
summary
hidden column
column resize
browser zoom
125% scaling
retina
vertical/horizontal scrollbar
hidden container → visible
```

---

## T-P1-15 Expensive Correctness Mode 必须按需启用

### 来源启发

类似 fixed-column variable-height 同步这类能力往往需要：

```text
ResizeObserver per row
持续 measurement
跨区域同步
```

### QX 原则

默认走便宜路径：

```text
fixed/known row height
→ 不创建每行 observer
```

只有明确需要：

```text
variable row + fixed column
```

时才启用：

```text
syncFixedRowHeight / dynamic-row-sync
```

### 验收

大量 rows 时默认不会为每一行建立永久 ResizeObserver。

---

## T-P0-16 Table Event Arbitration Matrix

### 问题

Table header/row 内可能同时存在：

```text
row click
selection checkbox
radio
sort button
filter button
column menu
resize handle
drag handle
edit input
action button
link
```

不能只靠零散 `stopPropagation()`。

### Contract

例如：

```text
click checkbox
→ selection only
→ no row activation

click sort button
→ sort only
→ no header-menu activation

pointerdown resize handle
→ resize only
→ no sort

click action button
→ action only
→ no row click
```

### 实现

复用：

```text
InteractionDetails
EventDelegation
Internal Action Containment
```

由 action ownership 判定，而不是组件到处手写阻止冒泡。

---

## T-P1-17 Dynamic Editable + Reedit Contract

### Column contract

不仅：

```js
editable: true
```

还应允许：

```js
editable(row, column, context)
```

根据：

```text
row status
permissions
loading
business state
```

动态判断。

### 编辑失败

Cell Edit Transaction 应支持：

```text
begin
draft
validate
invalid
reedit/keep-open
commit
save-error
retry
cancel/rollback
```

### 要求

```text
validation error
→ editor 不无故消失

remote save reject
→ draft 不丢

Escape
→ rollback

Enter
→ commit

Tab
→ commit + move（若组件策略允许）
```

---

## T-P1-18 Remote Summary Contract

remote mode 下 summary 不应只统计当前页。

loader 可返回：

```js
{
    items,
    total,
    filteredTotal,
    summary: {
        amount: 123456,
        count: 830
    }
}
```

### 规则

```text
local mode
→ 可由 Table 本地计算

remote mode
→ 优先使用 server summary

current-page summary
→ 必须明确标识为 page scope
```

---

## T-P1-19 Cell Overflow Policy

Column 正式支持：

```text
ellipsis
wrap
tooltip
expand
```

建议：

```js
overflow: {
    mode: 'tooltip',
    maxWidth: 320
}
```

### Interaction

```text
内容未溢出
→ 不弹 tooltip

溢出
→ hover/focus 才展示

内部有 Button/Link
→ popup 不阻止操作

Escape
→ 关闭

scroll
→ reposition/close 按统一 overlay policy
```

不要每个业务页面自行拼 Tooltip。

---

## T-P1-20 Semantic Column Metadata

视觉 header 和语义 label 不应混为一体。

Column 建议：

```js
{
    key: 'price',
    label: '价格',
    header: customHeaderRenderer,
    exportLabel: '价格'
}
```

规则：

```text
label
→ 语义名称

header
→ 可视渲染

exportLabel
→ 导出名称，可省略并 fallback label
```

Column visibility / export / toolbar 不应从 `th.textContent` 反推列名称。

---

## T-P0-21 Safe Cell Renderer Contract

普通数据值：

```text
string/number/date
→ 默认作为 text
```

绝不能：

```text
string
→ 默认 innerHTML
```

自定义 renderer：

```text
Node
DocumentFragment
framework-owned static/trusted template
```

才允许 DOM 内容。

### 目标

与：

```text
Trusted Types
CSP
DOMTemplate
URLPolicy
```

保持统一安全边界。

---

## T-P1-22 Export 与 DOM Render 完全解耦

导出数据必须来自：

```text
column metadata
raw row data
export formatter
```

不能：

```text
读取 rendered cell.innerText
```

Column 可支持：

```js
{
    render(value, row) {},
    exportValue(value, row) {},
    exportable: true
}
```

例如屏幕显示：

```text
￥1,234.00
```

CSV 可输出：

```text
1234.00
```

---

## T-P0-23 Aggregate Selection Contract

Header checkbox 必须以：

```text
selectable rows
```

而不是所有 rows 计算。

例如：

```text
100 rows
20 disabled
40 selectable selected
```

应为：

```text
40 / 80
→ indeterminate
```

不是：

```text
40 / 100
```

remote mode 还必须明确：

```text
page
loaded
query
```

三种 selection scope。

---

## T-P0-24 Embedded Component Lifecycle

Table cell 里可能创建：

```text
Switch
Select
Input
Button
Popover
Tag
自定义 QX Component
```

### Contract

```text
row/cell scope owns embedded component lifecycle
```

row 被删除：

```text
scope.destroy()
```

row 只是 reorder/move：

```text
不得 destroy/recreate
```

row key 稳定且 cell renderer 可复用：

```text
尽量保留 component instance
```

### 验收

快速分页/filter/virtual scroll 后：

```text
无 orphan instance
无 listener/observer leak
无重复 component initializer
```

---

## T-P0-25 Cell Edit Transaction

编辑不能只是：

```text
把 cell 替换成 input
```

正式状态机：

```text
idle
→ begin
→ draft
→ validating
├─ invalid → editing
├─ cancelled → rollback
├─ save-error → editing/error
└─ committed → idle
```

### 组合要求

以下操作发生时必须有正式策略：

```text
sort
filter
page
virtual range change
row update
row remove
remote refresh
selection
column hide
```

不得随机丢失 draft。

---

## T-P1-26 Column Width Solver

列宽正式区分：

```text
fixed px
auto/flex
min
max
user-resized
```

求解：

```text
container width
- fixed width
- scrollbar compensation
= distributable width
```

再按 min/max 约束分配。

不能让：

```text
browser table-layout:auto
```

和 QX 自己的 sticky/fixed geometry 同时争夺控制权。

---

## T-P0-27 Row Callback Data Views 必须唯一

callback 中正式区分：

```js
{
    row,    // 用户业务 row
    key,

    meta: {
        sourceIndex,
        selected,
        expanded,
        disabled
    },

    view: {
        pageIndex,
        visibleIndex
    }
}
```

禁止以后逐渐出现：

```text
rawRow
row
rowCache
renderRow
internalRow
rowData
```

多套相似对象。

---

# 28. v4 新增：Table 数据语义 / Remote / 状态恢复

## T-P0-28 Orthogonal Cell Data

### 问题

同一字段可能拥有不同用途的数据：

```text
raw
display
sort
filter
export
```

例如：

```text
raw: 1234
display: ￥1,234.00
sort: 1234
filter: 1234 / 价格文本
export: 1234.00
```

### Column contract

可形成：

```js
{
    value(row) {},
    render(value, row) {},
    sortValue(value, row) {},
    filterValue(value, row) {},
    exportValue(value, row) {}
}
```

或等价、更精简的 API。

### 原则

sort/filter/export 不得从 rendered DOM 反推。

---

## T-P0-29 Remote Request Epoch

即使底层采用 AsyncTask，Table 仍应有 query-level generation：

```text
queryVersion
requestEpoch
```

### 规则

```text
search A → request #10
search AB → request #11

#11 先返回
→ apply

#10 后返回
→ ignore
```

page/sort/filter/search 共用同一 query epoch。

### 验收

快速连续修改：

```text
search
filter
page
sort
```

不会出现旧结果闪回。

---

## T-P1-30 total / filteredTotal 分离

remote result 支持：

```js
{
    items,
    total,
    filteredTotal
}
```

其中：

```text
total
→ 原始数据总量

filteredTotal
→ 当前 query/filter 后总量
```

Pagination 使用当前 query 对应的分页总量。

Toolbar 可显示：

```text
筛选 238 / 总计 8,420
```

---

## T-P0-31 Remote Selection Scope

全选必须显式区分：

```text
page
loaded
query
```

### query 全选

不能把几十万 key 全拉到客户端。

建议模型：

```js
{
    mode: 'all-matching',
    excludedKeys: Set
}
```

配合当前 query fingerprint。

例如：

```text
全选当前筛选结果 58,321 条
→ allMatching = true

手工取消 3 条
→ excludedKeys = 3
```

### 验收

换页、远程刷新后语义保持正确。

---

## T-P0-32 Stable Row / Column Identity 强约束

在以下能力启用时：

```text
remote
virtual
reorder
state restore
selection persistence
expanded rows
editing
```

必须拥有稳定 row key。

Column：

```text
key
```

也必须稳定，不能用数组 index 代替长期 identity。

### 行为

缺 stable key 时：

```text
简单 static Table
→ 可 fallback index

高级能力
→ create/update 时明确报错或警告
```

---

## T-P1-33 ViewState Version / Migration

`getViewState()` 应包含：

```js
{
    version,
    schemaKey,
    columns: {
        [columnKey]: {...}
    }
}
```

恢复时：

```text
按 column key merge
未知旧列 → ignore
新增列 → default
列顺序变化 → 仍可恢复
```

禁止按数组位置硬套旧状态。

---

## T-P0-34 Logical Column ≠ Visible Column

```text
visible=false
responsive hidden
virtualized-out
```

只表示 presentation。

不能自动清除：

```text
sort
filter
query value
controlled column state
```

除非 API 明确要求 reset。

---

## T-P0-35 Table Feature Combination Matrix

每个新能力必须声明与以下 feature 的组合状态：

```text
virtual
fixed
sticky
edit
expanded
resize
reorder
responsive
group-header
remote
selection
summary
```

状态：

```text
supported
supported-with-constraints
unsupported
```

不支持的组合：

```text
create/updateOptions 时直接拒绝
```

不要让用户运行后才发现“看起来能开，但一操作就坏”。

---

## T-P1-36 Expanded Row Identity

expanded state：

```text
row key
→ expanded
```

永远不能绑定：

```text
visible index
DOM index
page-local index
```

sort/filter/reorder/refresh 后：

```text
同 key
→ expansion identity 保持
```

---

## T-P0-37 Structural Style Ownership

用户 cell renderer/style 不得覆盖 Table 结构属性：

```text
position
inset
z-index
transform
sticky offsets
framework-owned width geometry
```

### DOM 结构

推荐：

```text
td
└─ cell-content
```

Table structural style 写在：

```text
td / structural shell
```

用户：

```text
className/style/render
```

尽量作用：

```text
cell-content
```

避免 custom renderer 破坏 fixed/sticky。

---

# 29. v4 新增：框架级长期风险与多套实现收口

## F-P0-01 User Callback Reentrancy

### 核心规则

所有用户 callback 都必须被视为可能立即调用：

```text
destroy()
updateOptions()
open()
close()
setValue()
setItems()
remove current item
create nested overlay
throw
```

不能假设 callback 返回后实例仍保持原状态。

### 已确认风险类型

类似：

```text
framework 改一半状态
→ 调 user callback
→ callback destroy instance
→ framework 继续访问旧内部对象
```

### 正确模式

优先：

```text
internal commit
→ 建立稳定 state
→ user callback
→ callback 返回
→ 检查 destroyed/generation
→ 才做剩余 optional work
```

### 全框架扫描

```text
onSelect
onChange
onOpenChange
onClose
onDismiss
before*
after*
render callbacks
validation callbacks
async confirm callbacks
```

---

## F-P0-02 Event Emitter Listener Error Isolation

### 当前风险

若事件 emitter 是：

```js
snapshot.forEach(handler => handler(payload));
```

任一 listener throw：

```text
→ 后续 listener 不执行
```

可能阻断：

```text
cleanup listener
state reconciliation
其他业务 subscriber
diagnostic subscriber
```

### Contract

独立 subscriber 默认：

```text
exception isolation
```

即：

```text
listener A throw
→ report
→ listener B/C 仍执行
```

### 注意

这与某些明确需要 fail-fast 的同步 validation pipeline 不同。

必须区分：

```text
event subscribers
vs
transaction/validator chain
```

---

## F-P0-03 Transition Hook Exception Safety

任何：

```text
onBeforeEnter
onEnter
onAfterEnter
onBeforeLeave
onLeave
onAfterLeave
onVisibleChanged
```

throw 时：

```text
Transition state
settle waiter
class/style cleanup
generation
mount/unmount ownership
```

仍必须完成到稳定状态。

不能：

```text
hook throw
→ component 永远停在 entering/leaving
```

---

## F-P0-04 Async Action Contract

目前不同组件可能分别支持：

```text
sync action
Promise action
loading
error
cancel
```

但语义不能分叉。

### 统一状态

```text
idle
pending
success
error
cancelled
destroyed
```

### 覆盖

```text
Popconfirm
Modal buttons
Drawer buttons
async form action
Upload actions
future editable save
```

### Contract

Promise reject：

```text
必须清 pending
必须保留/恢复可操作状态
统一 error reporting
destroy 后不回写
```

---

## F-P0-05 Callback Freshness

`updateOptions()` 修改：

```text
onChange
onOpenChange
onSelect
onClick
renderer
formatter
filter
validator
```

后，下一次事件必须使用最新 callback。

### 禁止

在 create 时把 callback 永久 capture 到：

```text
DOM listener closure
Headless controller
Trigger
OptionList
AsyncTask
Scheduler callback
```

而 updateOptions 只更新 `opts` 的另一份对象。

### 实现原则

callback 使用：

```text
live option reference
```

或 updateOptions 时正式 rebind。

---

## F-P0-06 Transactional updateOptions

### 问题

updateOptions 如果逐字段边验证边修改：

```text
前 3 个字段成功
第 4 个字段报错
→ 实例进入半新半旧状态
```

### 正确流程

```text
1. normalize candidate
2. validate all
3. compute optionImpact
4. prepare structural changes
5. atomic commit options
6. reconcile
7. notify
```

失败：

```text
→ instance 保持原配置
```

### 与 Runtime Schema

应由：

```text
ComponentRuntime Schema + optionImpact
```

统一支撑。

---

## F-P1-07 Config Live / Snapshot Semantics

每个 Config key 必须明确属于哪一类：

### A. Live CSS Config

例如：

```text
theme tokens
semantic colors
```

已有实例自动通过 CSS 更新。

### B. Live Runtime Config

例如：

```text
motion preference
```

已有实例订阅并更新内部行为。

### C. Snapshot Default

例如某些：

```text
size
variant
component default option
```

只影响之后创建的实例。

### 文档要求

用户必须明确知道：

```js
Config.configure(...)
```

是否会改变已存在 component。

不能让这种差异成为实现偶然。

---

## F-P0-08 Framework Feature Combination Contract

不只 Table。

需要组合验收的横切 primitive：

```text
Overlay
Focus
Virtualizer
Drag
Edit
Transition
Async
FormBridge
Portal
ScrollLock
```

例如：

```text
Dialog × Select
Virtualizer × Edit
Drag × Virtualizer
Transition × Portal
Async × Destroy
FormBridge × Portal
Overlay × Nested Overlay
```

### 原则

```text
primitive 单体通过测试
≠
组合必然正确
```

CI 必须有组合矩阵。

---

## F-P1-09 Structural CSS / User CSS 分层

组件 DOM 最好区分：

```text
structural shell
customizable content
```

### structural shell 拥有

```text
positioning
sticky
overflow mechanics
transform geometry
z-index plane
measurement-critical size
```

### user slot 可自定义

```text
color
background
typography
content layout
decorative style
```

用户 `style/className` 默认不要直接覆盖结构 shell。

与：

```text
SemanticStyles precedence
DOMProjection ownership
```

共同形成样式 contract。

---

## F-P0-10 Controlled State ≠ Presentation State

以下 presentation 状态：

```text
hidden
collapsed-for-layout
responsive hidden
virtualized-out
temporarily unmounted-for-render
```

不得自动导致 logical/controlled state 丢失：

```text
selected
sort
filter
open model
checked
expanded model
validation state
```

逻辑状态以 stable identity 为准。

---

## F-P1-11 Global Config / Service 不得反向污染共享配置

服务实例：

```text
Message
Notification
Modal service
Loading service
```

只能：

```text
read Config
resolve default
```

不得：

```text
为了某个实例写回全局 Config
```

### 验收

创建/销毁 service instance 前后：

```text
Config snapshot
```

不发生非用户主动的变化。

---

# 30. v4 新增：跨 Table / Framework 的兼容矩阵与 Verify

## 30.1 Callback reentrancy tests

每类 callback 至少测试：

```text
callback 中 destroy self
callback 中 updateOptions
callback 中 setValue
callback 中 close/open
callback throw
```

### 目标

实例始终：

```text
不访问已销毁资源
不重复 emit
不留下 pending state
```

---

## 30.2 Callback freshness tests

```text
create({ onChange: A })
→ trigger
→ A called

updateOptions({ onChange: B })
→ trigger
→ only B called
```

覆盖：

```text
DOM event
keyboard
pointer
async completion
overlay close
selection
render callback
```

---

## 30.3 updateOptions atomicity tests

传入：

```text
多个合法 option
+
一个非法 option
```

预期：

```text
throw
+
所有原 option 保持
+
DOM/state 不发生部分更新
```

---

## 30.4 Event isolation tests

```text
listener A throw
listener B increment
listener C cleanup
```

预期：

```text
A error 被 report
B/C 仍执行
```

---

## 30.5 Table combination matrix

至少：

```text
virtual × fixed
virtual × expanded
virtual × edit
virtual × remote
fixed × resize
fixed × reorder
edit × filter
edit × remote refresh
filter popup × virtual switch
responsive hidden × controlled sort/filter
selection × disabled
remote × select-all-query
```

---

## 30.6 Structural style tests

用户 renderer 返回自定义：

```text
style
class
nested component
```

不能破坏：

```text
sticky
fixed
column width
layering
measurement
```

---

# 31. v4：Table 强化优先级重新排序

## Table 新增 P0

```text
Table Data Ownership
Projection Pipeline
Layout Convergence / Geometry Epsilon
Event Arbitration Matrix
Safe Cell Renderer
Aggregate Selection
Embedded Component Lifecycle
Cell Edit Transaction
Orthogonal Cell Data
Remote Request Epoch
Remote Selection Scope
Stable Row/Column Identity
Logical Column != Visible Column
Feature Combination Matrix
Structural Style Ownership
Row callback data-view contract
```

## Table 新增 P1

```text
Update Reason / Origin
Expensive correctness mode
Dynamic Editable + Reedit
Remote Summary
Cell Overflow Policy
Semantic Column Metadata
Export / Render separation
Column Width Solver
total / filteredTotal
ViewState version/migration
Expanded Row Identity
```

---

# 32. v4：框架新增优先级

## Framework 新增 P0

```text
User Callback Reentrancy
Event Emitter Error Isolation
Transition Hook Exception Safety
Async Action Contract
Callback Freshness
Transactional updateOptions
Framework Feature Combination Contract
Controlled State != Presentation State
```

## Framework 新增 P1

```text
Config Live / Snapshot Semantics
Structural CSS / User CSS layering
Global Config / Service no-backwrite
```

---

# 33. v4 更新后的 fix(11 Table 最终定位

Table 的目标进一步明确为：

> **中型业务 Data Table，而不是重型 Spreadsheet/DataGrid。**

它应具备：

```text
稳定的数据 ownership
清晰的 projection pipeline
local / remote 双模式
stable identity
精确 invalidation
局部 row/cell update
列状态与 view state
虚拟化
固定列/表头
排序/筛选/搜索/分页
selection
expanded
editing transaction
remote async lifecycle
toolbar
export data contract
scroll/reflow
geometry convergence
feature compatibility matrix
```

但仍明确不进入 Base Table：

```text
Excel range selection
formula engine
AutoFill
复杂 SearchBuilder
完整 CRUD Form Engine
内建 XLSX engine
无限组合式 Pivot/DataCube
```

---

# 34. v4 下次执行任务补充指令

在原执行指令基础上增加：

```text
9. Table 不允许修改用户 row object，所有 UI metadata sidecar 化；
10. Table 必须建立明确 Filter/Sort/Page/Visible/DOM Projection pipeline；
11. remote 请求必须具备 query epoch/latest-wins；
12. 全选必须区分 page/loaded/query scope；
13. 高级 Table 能力必须使用 stable row/column key；
14. 每个 Table feature 必须加入组合兼容矩阵；
15. updateOptions 必须 transactional；
16. 所有 callback 必须按 reentrancy/freshness/throw 三类场景验收；
17. Event subscribers 与 Transition hooks 的异常不得让框架状态悬空；
18. Config key 必须声明 live-runtime / live-css / snapshot-default 语义。
```

---

# 35. v5 总目标升级：历史遗留“多套体系”成为 fix(11 第一主线

> 本章不是普通代码整理。  
> 当前 QX 经历多轮版本升级后，已经出现“新体系已经建立，但旧实现、兼容桥、旧 namespace、旧 token、旧 selector、旧 state projection 仍继续存在”的典型长期维护债。
>
> fix(11 必须把这类问题当成独立主线处理：
>
> ```text
> 找出同一职责的所有实现
> ↓
> 选定唯一 canonical owner
> ↓
> 冻结 legacy 入口
> ↓
> 迁移所有 consumer
> ↓
> verify 禁止重新引用旧体系
> ↓
> 删除 legacy runtime / CSS / bridge
> ```
>
> 目标不是“代码看起来统一”，而是：
>
> **同一个状态、能力、Token、生命周期、依赖关系，只允许有一个 source of truth。**

---

# 36. CSS Architecture Convergence：完整专项

## 36.1 明确约束：QX 不使用 `:where()`

当前 fix(10 CSS 仍约有：

```text
30 处 :where()
```

fix(11 后：

```text
QX public/runtime CSS
→ 0 :where()
```

### 注意

禁止把：

```css
:where(.a,.b,.c)
```

机械改成：

```css
.a,.b,.c
```

如果原 selector 很长，必须先判断：

```text
这些 selector 是否真的代表同一个语义角色？
```

若是：

```text
→ 提炼 shared role class / token
```

若不是：

```text
→ 保持独立规则
```

不要使用 selector trick 掩盖架构问题。

---

## 36.2 当前 CSS 复杂度快照

fix(10 主 CSS 当前大致为：

```text
16,493 行
约 888 KB

:where()                  30
!important                132
rel-* state classes       43

旧 duration token 引用    142
新 motion-duration 引用    49

public token definitions  约 498
private token definitions 约 823

legacy --color-* var()    约 339
private semantic var()    约 905

will-change               12
backdrop-filter            4
```

这不是要求为了数字减少而机械压缩。

这些指标用于判断：

```text
历史体系是否仍被 runtime 使用
selector 是否异常膨胀
token 是否存在多代并行
兼容代码是否退出失败
```

---

# 37. P0 CSS：Theme Token Cascade Contract

## 37.1 Canonical Token Pipeline

最终只允许：

```text
Foundation / Raw Scale
↓
Theme Seed
↓
Mode Recipe
↓
Semantic Token
↓
Family Token
↓
Component Token
↓
State Token
↓
Final CSS Property
```

### 禁止跨层

Component：

```text
只能 fallback Component → Family/Semantic
```

Family：

```text
只能 fallback Family → Semantic
```

Semantic：

```text
只能 fallback Semantic → Mode
```

只有 Mode：

```text
可以 fallback 到 Seed/Foundation
```

禁止：

```text
Button component token
→ 直接 fallback raw blue-6
```

这种跨层 shortcut。

---

## 37.2 Legacy Theme Token v1 / Canonical Token v2 收口

当前仍存在大量旧：

```text
--qxframe9a7c2-color-*
```

与新：

```text
--qxframe9a7c2-theme-*
--qxframe9a7c2-semantic-*
--qxframe9a7c2-family-*
--_qxframe9a7c2-*
```

并行使用。

### 最终结构

```text
Canonical Token
↓
Legacy Alias
```

只能单向：

```css
--qxframe9a7c2-color-text:
    var(--_qxframe9a7c2-semantic-text);
```

框架内部 CSS：

```text
禁止继续消费 legacy --color-* token
```

legacy 只能服务：

```text
旧项目外部 override compatibility
```

### Verify

```text
src canonical CSS 中出现 var(--qxframe9a7c2-color-*)
→ fail
```

兼容文件 allowlist 除外。

---

## 37.3 Public / Private Token 职责固定

### Public

```text
--qxframe9a7c2-*
```

定义为：

```text
用户 / Theme / Config / scoped override 输入槽
```

### Private

```text
--_qxframe9a7c2-*
```

定义为：

```text
框架 resolve 后的内部工作 token
```

流向只能：

```text
public
→ private
→ property
```

禁止：

```text
private
→ public
```

也禁止 runtime interaction state 去修改 public theme token。

---

## 37.4 Theme Boundary 只能有一个 canonical authority

当前同时存在：

```text
.qxframe9a7c2-theme-light
.qxframe9a7c2-theme-dark

[data-qxframe9a7c2-theme="light"]
[data-qxframe9a7c2-theme="dark"]
```

JS 又同时读取二者。

### fix(11 必须二选一

推荐：

```text
data-qxframe9a7c2-theme
```

作为 canonical Theme Boundary。

或者：

```text
theme class
```

也可以。

**关键是只能有一个 canonical。**

另一种：

```text
只作为 legacy input adapter
→ 进入 canonical Config/Theme state
→ 不再直接参与另一套 CSS cascade
```

不能 class 和 attribute 各自决定一部分 token。

---

## 37.5 Theme Boundary 与 Size Boundary 完全分离

当前 semantic resolver 中存在：

```text
.is-xs
.is-sm
.is-md
.is-lg
.is-xl
```

与：

```text
theme-light/theme-dark/data-theme
```

共同作为 resolver boundary。

这属于职责混合。

### 最终规则

Theme Boundary：

```text
mode
semantic colors
surface
border
text
accent
status
```

Size Boundary：

```text
font size
control height
padding
gap
icon size
density
```

二者不应互相重新 resolve。

---

## 37.6 Size 状态不得向整个任意 DOM 子树泛化

避免：

```css
.is-sm .qxframe9a7c2-icon { ... }
```

导致任意祖先 `.is-sm` 污染深层组件。

### 正确模式

组件 root：

```text
resolve current size token
```

内部 child：

```text
消费组件 size token
```

例如：

```css
.qxframe9a7c2-select.is-sm {
    --_qxframe9a7c2-select-control-height: ...;
}
```

而不是依赖远端任意 `.is-sm` ancestor。

---

# 38. P0 CSS：Theme Context / Portal Theme Transport 统一

## 38.1 当前存在两套 Theme Resolver

### Config / Scope 路径

```text
Config
Config.createScope
Theme class / attribute projection
tokens
```

### OverlayRuntime 路径

当前 Portal 会：

```text
getComputedStyle(reference)
↓
遍历全部 CSS property
↓
筛选 --qxframe9a7c2-*
↓
与 portalContainer computed style 比较
↓
将差异写到 popupHost inline style
```

并 Observer：

```text
reference → root ancestor chain
```

上的：

```text
class
style
data-theme
```

变化。

随着 Token 数量增加，这条路径会越来越重。

### 最终方案

增加统一：

```text
ThemeContext / ConfigContext Snapshot
```

例如：

```js
Config.captureContext(reference)
Config.projectContext(snapshot, popupHost)
```

snapshot 应只携带：

```text
theme mode
真正 scoped override 的 public tokens
必要 contextual variables
```

而不是每次从完整 computed style 逆向扫描所有 token。

---

## 38.2 Menu 自己的 Theme 体系收口

当前 Menu 自己支持：

```text
theme: inherit/light/dark
```

并自行：

```text
toggle theme-light / theme-dark
```

Menu item 甚至可带局部 theme。

这与：

```text
Config.theme
Config scope
Overlay Theme transport
```

形成平行主题入口。

### fix(11

若保留 Menu 局部 theme：

```text
Menu theme option
= Config scoped theme 的语法糖
```

Menu 不再自己维护 Theme Resolver。

若无真实需求：

```text
删除 Menu-specific theme path
```

---

# 39. P0 CSS：Theme Switch Contract

主题切换不能依赖每个 component 自己的：

```text
background transition
border transition
color transition
box-shadow transition
```

否则：

```text
light → dark
```

页面会按不同 component duration 分块变化。

### 默认建议

Theme Switch：

```text
原子切换
```

流程：

```text
suppress ordinary component transition
→ 切换 canonical theme boundary
→ next frame 恢复 ordinary transition
```

### 可选 Theme Transition

若未来提供：

```text
light ↔ dark fade
```

必须使用：

```text
一个统一 Theme transition
```

并：

```text
reduced-motion → instant
```

不能让 hover/focus transition 顺带承担主题动画。

---

# 40. P0 CSS：CSSCompatState / rel-* 历史体系删除

## 40.1 当前状态

Kernel 中仍有：

```text
CSSCompatState
```

维护：

```text
qxframe9a7c2-rel-1
...
qxframe9a7c2-rel-43
```

共 43 类 relational projection。

覆盖：

```text
child disabled
child checked
child focus-visible
input suffix clear/toggle/loading
image preview hover/focus
InputGroup sibling relation
SelectGroup image/color relation
Picker relation
...
```

### Runtime 成本

它当前依赖：

```text
全局 MutationObserver
```

监听：

```text
class
disabled
checked
hidden
childList
subtree
```

还通过全局 capture 事件：

```text
input
change
click
focusin
focusout
mouseover
mouseout
keydown
keyup
```

推动关系重算。

---

## 40.2 fix(11 目标

完全删除：

```text
opaque rel-* state class
global relational scanner
relationMatches()
CSSCompatState runtime
为了 rel-* 人为重复 selector specificity
```

改为：

```text
组件自己投影已知语义状态
```

例如：

```text
.has-clear
.has-toggle
.has-loading
.has-image
.is-child-disabled
.is-child-checked
```

InputGroup：

```text
统一 group-control role
+
group-control + group-control
```

不再扫描 6×6 sibling combination。

---

# 41. P0 CSS：Native Form Skin 与 QX Control 体系收口

当前实际上存在：

```text
正式 QX Control/Input/Select/Switch...
```

以及：

```text
裸 input/select/textarea/button 自动 skin
```

两套视觉状态体系。

后者也是大量 selector group 和 `:where()` 的来源。

### fix(11

定义：

```text
QX Component
= canonical form control system

Native Form Skin
= compatibility / opt-in skin
```

推荐：

```html
<form class="qxframe9a7c2-native-form">
```

只有明确 scope 内裸控件才使用兼容 skin。

### 要求

Native Skin：

```text
不重新实现完整 Component interaction system
不拥有第二套 loading/active/focus state engine
不作为新组件开发基础
```

---

# 42. P0 CSS：Pseudo State / Projected State Ownership

当前大量同时存在：

```text
:hover + .is-hover
:active + .is-active
:focus-visible + .is-focus / .is-keyboard-focus
:disabled + .is-disabled
```

### 正式规则

Native DOM state owner：

```text
button/input/select 等真正原生 control
→ native pseudo-class
```

Virtual / composite state owner：

```text
div-based item
virtual focus item
custom option
→ projected semantic class
```

只有组件确实存在两种 DOM implementation 时，才允许双入口 selector。

不能把：

```text
native pseudo
+
JS class
```

当成所有组件默认写法。

---

# 43. P0 CSS：Specificity Architecture（不使用 :where）

## 43.1 Specificity Budget

建议：

```text
普通 component rule：
≤ (0,3,0)

复杂 composite：
原则上 ≤ (0,5,0)

> (0,6,0)
→ verify warning

> (0,8,0)
→ build fail，必须 allowlist
```

当前 `(0,几十,0)` 的 selector 必须视为历史架构债。

---

## 43.2 Selector Length / Group Budget

建议：

```text
single selector > 200 chars
→ warning

selector group > 20 entries
→ warning

selector group > 50
→ fail / explicit allowlist
```

### 禁止 specificity hack

例如：

```css
.rel-5.rel-5.rel-5
```

这种重复同一 state class：

```text
→ verify fail
```

---

## 43.3 共同语义才允许合并 selector

原则：

```text
相同 declaration
≠
必须合并
```

只有：

```text
相同语义角色
```

才提炼 shared role。

例如：

```text
Button/Input/Select 都是 Focusable Control
→ 可以共享 FocusVisual role
```

但：

```text
Menu 和 Toolbar 恰好 display:flex
→ 不应该因此造无意义共用类
```

---

# 44. P0 CSS：Semantic Role Classes 消灭组合爆炸

## 44.1 InputGroup

当前历史写法枚举：

```text
Input
Button
FormInput
FormSelect
Addon
Item
```

所有 sibling 组合。

fix(11 改为：

```text
.qxframe9a7c2-group-control
```

所有可连接 control 都获得同一 role。

于是：

```css
.group-control + .group-control
```

即可表达连接边框。

---

## 44.2 Accent / Color

当前存在：

```text
N colors × M components
```

组合 selector。

改为：

```text
Color class
→ 只设置 Accent Seed

Accentable role
→ 推导 hover/active/ripple/text

Component
→ 消费 accent token
```

由：

```text
N × M
```

降为：

```text
N + M
```

---

# 45. P0 CSS：Motion v1 / v2 完全合并

当前明确存在两代：

```text
--qxframe9a7c2-duration-fast/base/moderate/slow
```

与：

```text
--qxframe9a7c2-motion-duration-fast/mid/slow
```

并行。

旧 token 当前仍被大量引用。

### fix(11

只能保留一套 canonical Motion Language。

例如：

```text
fast
mid
slow
```

具体 duration 最终统一确定。

旧：

```text
duration-*
```

只做临时 alias，不允许 canonical component CSS 继续消费。

---

# 46. P0 CSS：Reduced Motion 三套入口合并

当前同时存在：

```text
prefers-reduced-motion media query
Config.matchMedia / motion state
html.qxframe9a7c2-motion-disabled
component-specific reduced-motion override
```

并且 duration 有：

```text
0ms
0.01ms
```

等不同策略。

### 最终模型

```text
Browser Preference
+
Config Override
↓
Resolved Motion State
↓
Canonical Motion Tokens
```

组件：

```text
只消费 resolved motion token
```

不再各自写 reduced-motion 逻辑。

---

# 47. P1 CSS：`!important` Governance

当前约：

```text
132 个 !important
```

### 默认允许

```text
[hidden]
明确 utility override
必要 browser reset
```

### 普通 Component / State

```text
禁止 !important
```

### Structural Geometry

```text
原则上禁止
```

特殊情况：

```text
需要注释 + allowlist + verify
```

目标不是简单把 132 变成 0，而是所有 `!important` 都有明确 ownership。

---

# 48. P1 CSS：will-change 生命周期化

当前多个组件永久：

```text
will-change: transform / opacity
```

若：

```text
Modal/Drawer/Image/Popup keepMounted
```

浏览器可能长期维护不必要 compositing layer。

### fix(11

仅在：

```text
enter-active
leave-active
dragging
transforming
```

期间加 `will-change`。

Transition settled：

```text
删除
```

---

# 49. P1 CSS：Backdrop Filter / Compositing Policy

当前少量：

```text
backdrop-filter: blur(...)
```

应正式定义：

```text
large-area loading mask
→ 默认不用 blur

small decorative surface
→ 允许 token-controlled blur

reduced effects
→ blur:none
```

尤其 Table loading 大区域不要为了极小视觉收益制造持续 compositing 成本。

---

# 50. P0 CSS/JS：Z-index Source of Truth

当前：

```text
CSS --qxframe9a7c2-z-overlay-base = 19920510
```

与：

```text
LayerManager DEFAULT_BASE = 19920510
```

是同一语义两份 source。

### fix(11

必须统一成一份 manifest/source：

```text
Layer Token Manifest
↓
生成 JS constant
+
生成 CSS variable
```

不要每次 runtime `getComputedStyle()` 读取。

---

## 50.1 Global Layer vs Local Component Layer

### Global

由 LayerManager 管：

```text
popup
modal
notice
tooltip
blocking
```

### Local

组件内部：

```text
body
sticky cell
header
loading overlay
action
```

使用组件自己的 local z token。

禁止散落 magic：

```text
z-index: 3 / 8 / 9
```

无语义来源。

---

# 51. P0 CSS：Patch Archaeology 清理

当前主 CSS 仍可见：

```text
Stage 05A
Stage 06B
Stage 07
compatibility bridge
v2.x compatibility aliases
canonical overwrite
late fixes
```

说明源文件仍是历史 patch 层层追加。

### fix(11 推荐源码拆分

最终 dist 仍输出一个：

```text
qxframe9a7c2.css
```

但 source 拆为：

```text
00-foundation.css
01-theme.css
02-semantic.css
03-family.css
04-roles.css
05-components/*.css
06-states.css
07-composites.css
08-compat.css
```

物理 concatenation 顺序就是 cascade contract。

明确：

```text
不使用 @layer
不使用 :where()
不依赖 :is()
不依赖 :has()
```

---

# 52. P0 CSS：Compatibility Exit Contract

任何 legacy：

```text
token
selector
class
option
DOM
bridge
```

必须记录：

```text
since
replacement
deprecatedSince
removedIn
migrationNote
```

### 强规则

```text
canonical source
不得新增对 legacy contract 的引用
```

兼容层只能：

```text
Legacy → Canonical
```

不能：

```text
Canonical → Legacy → Canonical
```

---

# 53. v5：已确认 JS 历史平行体系总表

> 以下只列“同一职责存在多个 owner”的问题。  
> 正常的上下层 primitive 不算重复。

| 职责 | 当前平行实现 | 分类 | Canonical 目标 |
|---|---|---|---|
| Theme Token | legacy `--color-*` + semantic/family canonical | **Confirmed Parallel** | semantic/family canonical，legacy 单向 alias |
| Theme Boundary | class + data attribute | **Confirmed Parallel** | 一个 canonical boundary |
| Theme Resolution | Config scope + Menu theme + Overlay computed-style transport | **Confirmed Parallel** | Config/ThemeContext |
| Motion Token | duration v1 + motion-duration v2 | **Confirmed Parallel** | 单一 Motion Token |
| Reduced Motion | media + Config + html class + component override | **Confirmed Parallel** | Resolved Motion State |
| Relational CSS State | CSSCompatState rel-* + component known state | **Confirmed Parallel** | component semantic state projection |
| DOM Factory | `ComponentDOMFactories` + `ComponentRegistry` | **Confirmed Legacy Bridge** | Component definition local DOM factory |
| BuildingBlock DOM Factory | `BuildingBlockDOMFactories` + `BuildingBlockRegistry` | **Confirmed Legacy Bridge** | BuildingBlock definition local DOM factory |
| Dependency Graph | defineModule deps + Registry capability deps | **Confirmed Dual Declaration** | Module Manifest generates both |
| Registry implementation | 5 registries each实现 normalize/define/get/list | **Implementation Duplication** | shared registry factory，语义 Registry 保留 |
| Option Contract | ComponentRuntime Schema + component manual validation | **Confirmed Parallel** | Runtime Schema |
| Controlled State | StateController + component manual value state | **Migration Incomplete** | StateController where applicable |
| Async latest-wins | AsyncTask + requestId/generation/loadGeneration | **Confirmed Parallel** | AsyncTask/AsyncTaskGroup |
| Semantic style projection | SemanticStyles + Item projection + component manual class/style | **Confirmed Multi-path** | semantic slot contract + DOMProjection底层 |
| Press lifecycle | PressInteraction + Ripple input lifecycle + component manual press | **Confirmed Multi-path** | PressInteraction |
| Scheduling | Scheduler + allowlisted native timers | **Partial Parallel** | Scheduler abstraction / approved backend only |
| Programmatic focus | DOM/FocusManager + 少量 direct `.focus()` | **Migration Target** | DOM/FocusManager |
| Global layer base | CSS constant + JS DEFAULT_BASE | **Confirmed Dual Source** | Layer Token Manifest |
| Pagination | Pagination + Table mini pager | **Confirmed Duplicate UI** | Pagination |
| Reorder | Sort helper + Upload consumer + future local implementations | **Confirmed Wrong Layer** | DOMHeadless.ReorderInteraction |
| Native form visuals | QX Controls + Native Form Skin | **Confirmed Parallel Visual System** | QX Control canonical，Native Skin compatibility |
| State visuals | pseudo-state + projected state class 无统一 owner | **Confirmed Mixed Ownership** | State Ownership Contract |

---

# 54. P0 JS：ComponentDOMFactories / BuildingBlockDOMFactories 删除

## 54.1 当前结构

多个 module 当前：

```text
创建/获取 global factory namespace
↓
把 DOMFactory 挂上去
↓
同一个 module 再从 global namespace 取回
↓
交给 Registry.define()
```

当前已确认使用：

```text
ComponentDOMFactories
→ 多个 visible component

BuildingBlockDOMFactories
→ 多个 building block
```

这明显像历史时期“DOM factory 与 component module 分拆加载”遗留的桥。

### fix(11

DOM factory 应：

```text
保留 module-local
```

例如：

```js
var DOMFactory = {...};

ComponentRegistry.define('Select', {
    dom: DOMFactory,
    ...
});
```

或直接：

```text
definition.dom
```

### 删除

```text
brand.ComponentDOMFactories
brand.BuildingBlockDOMFactories
```

除非有明确公开 API 兼容要求。

若它们曾是 public：

```text
先进入 legacy adapter
→ 标记 removedIn
```

---

# 55. P0 JS：Module Dependency / Capability Dependency 单一 Manifest

当前同一组件通常有：

```text
qx.defineModule(name, moduleDeps, factory)
```

以及 Registry definition 内：

```text
core
domHeadless
buildingBlocks
components
```

两份人工 dependency description。

两者职责不同：

```text
module dependency
→ 文件/模块加载顺序

capability dependency
→ 运行时所需能力
```

但事实高度重叠。

### fix(11

定义一份：

```text
Module Manifest
```

例如：

```js
{
    name: 'select',

    modules: [...],

    capabilities: {
        core: [...],
        domHeadless: [...],
        buildingBlocks: [...],
        components: [...]
    }
}
```

build：

```text
生成 defineModule deps
生成 Registry dependency metadata
生成 verify graph
```

避免两处手工漂移。

---

# 56. P1 JS：Registry 实现统一，Registry 语义不合并

必须保留：

```text
CoreRegistry
HeadlessRegistry
DOMHeadlessRegistry
BuildingBlockRegistry
ComponentRegistry
```

它们是不同架构层。

但内部重复：

```text
normalizeName
reserved names
records
define
has
get
list
publish
dependency validation
```

应抽：

```js
createRegistry(config)
```

外部仍返回五个不同 registry。

原则：

> **统一实现，不合并语义空间。**

---

# 57. P0 JS/CSS：Theme System 统一到 ThemeContext

最终只允许：

```text
Config / ThemeContext
```

作为 theme/token source of truth。

其他：

```text
Menu theme
Overlay ThemeMirror
class/data legacy input
```

都必须变为：

```text
adapter / syntax sugar
```

不能自己 resolve theme。

### ThemeContext 必须覆盖

```text
mode
public scoped token overrides
size/density context（独立 channel）
motion context
layer/context metadata where needed
```

Portal：

```text
捕获 logical owner context
→ project 到 popup root
```

---

# 58. P0 JS：CSSCompatState Runtime 全部删除

fix(11 不是只改 CSS selector。

需要删除 kernel 中：

```text
relational table
candidateRules
relationMatches
global relation refresh
CSSCompatState public object
global observer
global capture event refresh
```

迁移顺序：

```text
rel-1..43 建表
↓
逐条找到 owner component
↓
替换成 semantic state / shared role
↓
CSS 不再引用该 rel
↓
JS 不再生成该 rel
↓
全部归零后删除 CSSCompatState
```

### Verify

```text
qxframe9a7c2-rel-
→ 全仓库 0
```

---

# 59. P0 JS：StateController adoption 要按“职责”而非盲目覆盖

以下适合 canonical StateController：

```text
value/defaultValue
controlled/uncontrolled
draft/commit
change dedupe
rollback
external sync
```

但以下不应该硬塞：

```text
DOM hover
temporary geometry
observer state
layer stack
loading resource registry
```

### migration inventory

逐组件标记：

```text
Canonical StateController
Local ephemeral state
Collection model
Selection model
AsyncTask state
```

避免为了“只剩一个 state primitive”制造巨型 StateManager。

---

# 60. P0 JS：AsyncTask / generation 全量迁移审查

已确认仍有：

```text
Autocomplete requestId
Tree loadGeneration
Cascader datasetGeneration/loadGeneration
其他局部 generation
```

逐项分类：

### Async operation generation

必须迁：

```text
AsyncTask / AsyncTaskGroup
```

### Transition/layout generation

保留在对应 primitive：

```text
Transition generation
Renderer generation
```

不能机械把所有 `generation` 都塞到 AsyncTask。

### Verify

模块中手工：

```text
requestId++
loadGeneration
datasetGeneration
```

应归零或 allowlist。

---

# 61. P0 JS：Style Projection 底层统一

上层 API 可以保留：

```text
SemanticStyles
Item state projection
Component semantic styles
Config scope tokens
```

但最终 DOM write 应统一到底层：

```text
DOMProjection / MutationLease
```

统一：

```text
setStyle
setClass
setAttribute
restore ownership
write dedupe
diagnostics
```

这样才能真正解决：

```text
外部后来修改 DOM
→ QX destroy 不应覆盖
```

以及：

```text
同值反复写 DOM
```

---

# 62. P0 JS：Press / Ripple / Manual Pointer 收口

最终职责：

### PressInteraction

拥有：

```text
pointer press
keyboard press
cancel
pointercancel
lost capture
disabled/loading gate
press lifecycle
```

### Ripple

只负责：

```text
视觉波纹
```

不再自己解释：

```text
mousedown
touchstart
keydown
```

### Component

只接：

```text
onPress / activation
```

避免三层都解释同一次 click/keydown。

---

# 63. P1 JS：Scheduler 与原生 Timer 的边界写死

目标不是：

```text
代码里绝对 0 setTimeout
```

而是：

```text
业务/component scheduling
→ Scheduler

底层经过审核的 timing backend
→ allowlist
```

例如：

```text
NoticeClock
InputNumber repeat
browser timing fallback
```

若保留 native timer：

```text
必须在 Scheduler/专用 timing primitive 后面
```

不能 component 各自直接 setTimeout。

---

# 64. P1 JS：Programmatic Focus 单一入口

正式规定：

```text
DOM.focusElement / FocusManager
```

为程序性 focus canonical入口。

默认：

```text
preventScroll:true
```

需要 reveal：

```text
显式调用 Reveal policy
```

剩余 direct：

```text
element.focus()
```

全部扫描：

```text
必要 browser compatibility
→ allowlist

普通 component
→ migration
```

---

# 65. P0 JS：Table Pager / Pagination 去重

已在 Table 章节说明。

本专项再次明确：

```text
Table mini pager
→ 删除
```

Table 绑定：

```text
PaginationModel / Pagination Component
```

不允许两个 pager：

```text
CSS
keyboard
focus
size
disabled
```

继续平行发展。

---

# 66. P0 JS：Reorder 单一体系

最终：

```text
DOMHeadless.ReorderInteraction
```

作为 flat reorder canonical primitive。

Sort：

```text
visible wrapper / API
```

Upload/Table/Transfer：

```text
直接依赖 ReorderInteraction
```

Tree：

```text
在其上增加 hierarchy policy
```

禁止未来出现：

```text
SortablePointer
DragSorter
TableDragController
UploadSorter
```

各自重新实现 pointer session。

---

# 67. P0 CSS/JS：Native Form Skin 不能成为第二个 Component Framework

Native Skin 只解决：

```text
已有普通 HTML 表单
希望视觉接近 QX
```

不能继续扩展：

```text
复杂 loading
virtual focus
popup ownership
advanced validation UI
QX-specific interaction states
```

复杂交互必须使用正式 QX Component。

---

# 68. P1：Empty / Loading / Form 等“疑似多套体系”必须专项核对

这几类当前不能简单断言全部重复，但必须进入 audit。

## 68.1 Empty

已有：

```text
Empty component
EmptyProjection
ItemCollection/Table empty projection
```

同时多个组件拥有自己的：

```text
emptyText
empty node
empty CSS
```

### Audit 目标

区分：

```text
Empty Visual Component
Empty Projection Controller
Component-specific empty copy
```

若只是不同层次：

```text
保留
```

若组件重新做：

```text
icon/layout/style/lifecycle
```

则迁入统一 Empty。

---

## 68.2 Loading

检查：

```text
Loading component
Control loading
Button loading
Table loading
Upload loading
AsyncTask pending
Notice pending
```

区分：

```text
loading semantic state
loading visual renderer
async pending state
blocking loading overlay
```

不能为了“统一 loading”做一个巨型 LoadingManager。

但同一层面的 spinner/style/activation gate 不允许多套。

---

## 68.3 Form

已有：

```text
FormBridge
Control
native authored input
component value state
```

专项确认：

```text
是否存在组件自己生成 hidden input
是否自己监听 form reset/submit
是否自己同步 name/form/disabled
```

这些一旦与 FormBridge 重复：

```text
必须迁入 FormBridge
```

---

## 68.4 Selection

已有：

```text
Headless.Selection
Component local Set
Tree checked state
Transfer selected state
Table selection
```

不是所有 Set 都应迁 Selection。

Audit 标准：

```text
业务 selection value
→ Selection primitive

temporary lookup/cache Set
→ local Set
```

---

# 69. v5：明确“不属于重复体系”的正常分层

以下不要为了“只剩一套”错误合并。

## Overlay Stack

```text
LayerManager
DismissableLayer
PopupSurface
OverlayRuntime
TriggerInteraction
```

这是：

```text
layer
dismiss
surface
runtime orchestration
trigger
```

上下层关系。

---

## Focus Stack

```text
FocusManager
FocusScope
FocusTrap
VirtualFocus
KeyboardNavigation
```

分别负责：

```text
基础 focus
scope lifecycle
trap
virtual cursor
keyboard movement
```

不是重复。

---

## DOM Stack

```text
DOMTemplate
DOMBinding
Renderer
EventDelegation
```

分别负责：

```text
template
binding
owned render
events
```

不能合并成 DOMManager。

---

## Scroll Stack

```text
Scroll
ScrollVisibility
ScrollLock
Virtualizer
```

分别负责：

```text
scroll API
visibility
locking
virtual viewport
```

不是同一职责。

---

# 70. v5：One Responsibility → One Canonical Owner 总表

fix(11 完成后，必须达到：

| Responsibility | Canonical Owner |
|---|---|
| Option contract | ComponentRuntime Schema |
| Component controlled value | StateController（适用组件） |
| Selection model | Headless.Selection |
| Async latest-wins | AsyncTask / AsyncTaskGroup |
| Component lifecycle cleanup | Lifecycle |
| Scheduler | Scheduler |
| Observer | ObserverHub |
| Event delegation | EventDelegation |
| Programmatic focus | DOM.focusElement / FocusManager |
| Virtual focus | VirtualFocus |
| Press lifecycle | PressInteraction |
| Pointer drag session | PointerSession |
| Flat reorder | ReorderInteraction |
| Overlay orchestration | OverlayRuntime |
| Global overlay stack | LayerManager |
| Dismiss semantics | DismissableLayer |
| Scroll lock | ScrollLock |
| Positioning | PositionAdapter |
| DOM side-effect restore | DOMProjection / MutationLease |
| Semantic style slots | SemanticStyles contract |
| Theme context | Config / ThemeContext |
| Motion tokens/state | Canonical Motion System |
| Z-layer source | Layer Token Manifest |
| Form/native interoperability | FormBridge |
| Empty projection | EmptyProjection |
| Pagination UI | Pagination |
| Table query/projection | TableModel + Table pipeline |
| DOM registry definition | Component/BuildingBlock Registry definition |
| Module/capability dependencies | Module Manifest |
| Registry implementation | shared `createRegistry()` factory |
| CSS relational state | component semantic state classes |
| Native form visual compatibility | scoped Native Form Skin only |

---

# 71. v5：Historical Parallel-System Audit 流程

每发现一套旧/新并行体系，都必须按下面步骤处理。

## Step 1：Inventory

记录：

```text
旧 owner
新 owner
所有 consumer
公开 API?
CSS consumer?
runtime consumer?
docs consumer?
tests consumer?
```

## Step 2：Canonical Decision

明确：

```text
最终保留哪一个
为什么
```

禁止两个都“先保留看看”。

## Step 3：Freeze Legacy

从这一刻：

```text
禁止新增 legacy consumer
```

verify 直接 fail。

## Step 4：Migration

逐个 consumer 迁移：

```text
runtime
CSS
demo
docs
tests
```

## Step 5：Compatibility Adapter

仅当必须兼容旧 API：

```text
legacy input
→ translate to canonical
```

Adapter 不允许拥有独立 state/lifecycle。

## Step 6：Zero Consumer

确认：

```text
runtime legacy reference = 0
canonical → legacy reference = 0
```

## Step 7：Delete Legacy

删除：

```text
JS
CSS
token
selector
global namespace
observer/listener
docs
test fixture
```

## Step 8：Regression Guard

verify：

```text
旧名字重新出现
→ CI fail
```

---

# 72. v5：CSS Verify 必须新增的规则

```text
:where(
→ fail

qxframe9a7c2-rel-
→ fail（迁移完成后）

canonical CSS 引用 legacy --color-*
→ fail

legacy duration token
→ fail（迁移完成后）

普通 component !important
→ fail

重复 state class specificity hack
→ fail

selector specificity > budget
→ warning/fail

selector length > budget
→ warning

selector group > budget
→ warning/fail

theme + size 混合作为同一 resolver boundary
→ fail pattern/check

random z-index magic number
→ warning

permanent will-change on keepMounted component
→ warning

canonical component CSS 使用 legacy selector/class
→ fail
```

---

# 73. v5：JS Verify 必须新增的规则

```text
ComponentDOMFactories
→ fail after migration

BuildingBlockDOMFactories
→ fail after migration

CSSCompatState
→ fail after migration

qxframe9a7c2-rel-
→ fail

manual component requestId/loadGeneration
→ fail / allowlist

visible component 依赖另一个 visible component 获取 generic primitive
→ fail

direct native timer in component
→ fail / allowlist

direct element.focus()
→ warning/fail

manual hidden form synchronization outside FormBridge
→ warning/fail

legacy option validation helper after Runtime Schema migration
→ fail

module deps / registry deps 与 Manifest 不一致
→ fail

JS/CSS layer base mismatch
→ fail

Menu/local component 自己 resolve theme
→ fail after ThemeContext migration
```

---

# 74. v5：CSS Source Order Contract（替代 @layer / :where）

QX 不使用 `@layer` 和 `:where()`。

通过文件物理顺序建立 cascade：

```text
00 Foundation
01 Theme Seed / Mode
02 Semantic
03 Family
04 Shared Roles
05 Component Base
06 Component Variant
07 Component State
08 Composite Relation
09 Utilities
10 Compatibility
```

### Rule

后层只能：

```text
消费/覆盖前层公开 contract
```

不能：

```text
Compatibility 反过来成为 canonical source
```

Compatibility 永远最后，并且只做 legacy adapter。

---

# 75. v5：优先执行顺序重新调整

用户当前最迫切目标：

> **先清历史多套体系，再继续增加新能力。**

因此 fix(11 建议顺序调整为：

## Phase 0：冻结历史扩散

立即加入 verify：

```text
禁止新增 legacy token
禁止新增 rel-* state
禁止新增 ComponentDOMFactories consumer
禁止新增 BuildingBlockDOMFactories consumer
禁止新增手工 Option validation
禁止新增手工 async generation
禁止新增 visible-component generic dependency
```

---

## Phase 1：CSS Architecture 收口

1. `:where()` 归零；
2. Theme Boundary 单一化；
3. Theme/Size boundary 分离；
4. legacy token → canonical alias；
5. Motion v1/v2 合并；
6. Reduced Motion 合并；
7. CSSCompatState rel-* 逐条删除；
8. InputGroup shared role；
9. Accent shared role；
10. specificity budget；
11. `!important` governance；
12. Layer token source；
13. source CSS 拆分并固定 concat order；
14. Compatibility exit metadata。

---

## Phase 2：JS 历史 Bridge 清理

1. ComponentDOMFactories；
2. BuildingBlockDOMFactories；
3. shared Registry factory；
4. Module Manifest；
5. ThemeContext；
6. DOMProjection；
7. AsyncTaskGroup；
8. StateController adoption；
9. PressInteraction adoption；
10. ReorderInteraction；
11. FormBridge audit；
12. Programmatic focus audit；
13. scheduler/timer audit。

---

## Phase 3：Interaction / Table / Runtime 完善

再执行本文前面已经列出的：

```text
Interaction Design System
Table reinforcement
Scheduler hardening
Callback reentrancy
Feature combination matrix
Overlay lifecycle
Diagnostics
API Manifest
```

这样不会继续在旧基础设施上增加新的 consumer。

---

# 76. v5：每个历史体系必须建立“删除完成定义”

不能以：

```text
新体系已经能工作
```

作为完成。

真正完成必须同时满足：

```text
[ ] canonical owner 已明确
[ ] legacy consumer = 0
[ ] canonical 不再依赖 legacy
[ ] runtime legacy code 删除
[ ] CSS legacy code 删除/仅兼容 adapter
[ ] docs 不再推荐 legacy
[ ] demo 不再使用 legacy
[ ] tests 不再依赖 legacy fixture
[ ] verify 禁止 legacy 回归
[ ] compatibility removedIn 已记录
```

只有全部完成，才算真正“统一成一套体系”。

---

# 77. v5：下一轮源码全面历史债审查清单

除已确认项目外，还必须逐项扫描以下责任域，不能凭模块名判断：

```text
Theme
Tokens
Motion
Size/Density
Z-index
DOM Factory
Registry
Dependency Graph
Options Schema
Controlled State
Selection
Async
Events
Lifecycle
Scheduler
Observer
Focus
Keyboard
Pointer/Press
Drag/Reorder
Overlay
Portal
Positioning
Scroll
Form
Empty
Loading
Validation
Semantic Styles
DOM Projection
Renderer
Virtualizer
Pagination
Table
URL/Security
ID generation
Diagnostics
Compatibility
```

每一项输出：

```text
Canonical owner:
Legacy owner(s):
Consumer count:
Runtime overlap:
CSS overlap:
Public compatibility:
Migration action:
Delete condition:
Verify rule:
```

最终形成：

```text
QXFRAME9A7C2-Canonical-System-Manifest
```

以后任何新增代码：

```text
必须先查 Manifest
```

避免再次创建第二套同职责系统。

---

# 78. v5：最终架构原则

fix(11 之后，QX 必须遵守：

> **可以有多个层次，但同一层次同一职责只能有一个 owner。**

允许：

```text
LayerManager
→ DismissableLayer
→ OverlayRuntime
→ TriggerInteraction
```

因为这是上下层。

不允许：

```text
Theme Resolver A
Theme Resolver B
Menu Theme Resolver C
Portal Theme Resolver D
```

同时各算一次 Theme。

允许：

```text
StateController
Selection
AsyncTask
```

因为是不同状态域。

不允许：

```text
StateController value
component manual controlled value
FormBridge 另一份 value
DOM dataset 又保存一份 value
```

四份同时成为 source of truth。

CSS 同样：

允许：

```text
Semantic
→ Family
→ Component
→ State
```

不允许：

```text
旧 color token
新 semantic token
late compatibility overwrite
component raw palette override
rel-* specificity hack
```

同时决定同一个最终颜色。

最终目标不是“少几个文件”，而是：

```text
一个事实
一个 owner
一条数据流
一个恢复责任
一套测试
一个 compatibility 出口
```


