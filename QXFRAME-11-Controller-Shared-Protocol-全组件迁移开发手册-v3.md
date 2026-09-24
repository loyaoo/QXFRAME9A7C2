# QXFRAME9A7C2：11 Controller + Shared Protocol Layer 全组件迁移开发手册 v3

> **文档性质**：架构冻结稿 + 实施手册 + 全组件迁移与验收标准。  
> **仓库**：`loyaoo/QXFRAME9A7C2`  
> **基准**：`main@156453275a9c6073a0962bff74ba20d3283b922b`，包版本 `2.19.81`。  
> **状态**：本文定义目标架构与实施门槛，不代表 11 Controller 已经完成源码迁移。  
> **取代范围**：取代此前分散的 Controller 架构稿、接口取舍稿、跨控制器事务稿、全组件接入矩阵中重复或冲突的描述；后续实现以本文为唯一开发依据。

---

## 0. 总目标

QXFRAME9A7C2 的目标不是“组件数量多”，而是成为一套**视觉一致、操作一致、反馈一致、使用一致、状态归属一致**的前端 UI Framework。

本次架构升级固定 11 个正式 Controller：

1. `ValueController`
2. `FocusController`
3. `InteractionController`
4. `CapabilityController`
5. `MotionController`
6. `SelectionController`
7. `OverlayController`
8. `FeedbackController`
9. `ThemeController`
10. `TokenController`
11. `FormController`

但 11 Controller 之下还必须存在一层**Shared Protocol Layer**。它不是第 12 个 Controller，不拥有任何组件业务真值，而是提供所有 Controller 共用的：

- Action / Mutation 事务协议
- Logical Owner Tree
- Controllable State 基础协议
- Input Modality
- StableKey / DataRevision
- Projection Snapshot / Scheduler
- Environment Port / Resource Lease
- Diagnostics / Architecture Lint

最终目标：以后新增组件不再重新设计 value、focus、keyboard、popup、loading、form、theme、motion 等基础行为，只需声明能力 profile、实现领域 adapter、通过统一 contract suite。

---

# 1. 设计边界与不可破坏原则

## 1.1 不重复现有成熟 authority

当前仓库已经存在成熟或半成熟能力：

- `ValueDraft / StateController`
- `KeyboardNavigation / FocusScope / FocusManager / VirtualFocus`
- `InteractionPolicy`
- `MotionCore / Transition / TransitionGroup`
- `OverlayRuntime / LayerManager / DismissableLayer / PositionAdapter`
- `FormBridge`
- `Config`
- `Selection / HierarchicalSelection / ActiveItem / TableModel`
- `NoticeService / NoticeClock`

11 Controller 必须从这些能力**演进、封装、统一协议**，不得复制出第二套 owner。

例如：

```text
错误：
MotionCore 一套 generation
MotionController 再维护一套 generation

正确：
MotionController = 高层意图与统一结果协议
MotionCore       = 底层动画 authority
```

## 1.2 One Owner / One Truth

任何可变状态只能有一个 owner。

禁止：

```text
DatePicker.value
Calendar.selectedDate
PickerSession.committed
Control.displayValue
```

四套都能写。

必须区分：

```text
committed      对外稳定值 / Form 序列化源
 draft          本编辑会话候选值
 preview        hover / drag / keyboard navigation 临时视觉值
 rawInput       尚未解析或尚未提交的原始文本
 activeKey      当前虚拟焦点
 selectedKeys   选择状态
 open           逻辑打开状态
 presence       动画视觉存在状态
```

这些状态之间只能通过显式 transaction、projection 或 adapter 转换，不能由 render、close、focus restore、animation completion 暗中回写。

## 1.3 Controller 不认识组件名

任何 Controller 内出现：

```js
if (componentName === 'DatePicker') {}
if (componentName === 'TreeSelect') {}
```

视为架构失败。

Controller 只处理协议；业务差异由 `ComponentProfile` 与 adapter 注入。

## 1.4 不建立全局抢键器

`InteractionController` 不是 `document.addEventListener('keydown', ...)` 的全局快捷键层。

事件必须从最深逻辑 owner / scope 向父层路由：

```text
Native editor
→ child composite scope
→ active overlay scope
→ parent component scope
→ page/browser default
```

只有真正消费动作时才 `preventDefault()`。

## 1.5 兼容不是保留双路径

迁移期间可以通过 adapter 保留现有公开 API，但最终：

- 不能长期保留旧 owner + 新 owner 双写
- 不能长期保留旧 boolean 结果与新结构化结果两套内部协议
- 不能为错误旧行为继续保留隐式 `close = commit`

行为变化要写入发布说明，而不是把错误行为永久化。

## 1.6 当前范围不额外扩张

本次不新增：

- RTL 体系
- 全局 a11y/ARIA 生成层
- 全局 service locator / DI container
- 运行时组件名 dispatch
- 与现有 ESM 静态导入冲突的动态 registry

原生元素已有行为保持 native-first；本次不以扩大语义辅助层为目标。

---

# 2. Shared Protocol Layer

Shared Protocol Layer 是本次架构能否长期稳定的关键。11 Controller 共享这一层，但它本身不持有 Date、Color、Tree、Form 等业务状态。

## 2.1 ActionContext

每一次用户动作、程序动作、外部同步都必须携带统一上下文：

```ts
interface ActionContext {
  actionId: string;
  parentActionId?: string;
  source: 'keyboard' | 'pointer' | 'touch' | 'native' | 'programmatic' | 'external';
  reason: string;
  scopeId?: string;
  ownerId?: string;
  originalEvent?: Event;   // 仅同步阶段持有
  inputModality?: 'keyboard' | 'pointer' | 'touch' | 'programmatic';
}
```

语义必须固定：

- `source` = 输入来源
- `reason` = 为什么发生
- `actionId` = 一次语义动作身份
- `parentActionId` = 因果链

不要把 `confirm / clear / outside / reset` 塞进 `source`。

异步阶段不得继续依赖可变 `originalEvent`。

## 2.2 OperationResult

禁止用一个 `true/false` 表示：成功、无变化、被拒绝、等待外部、已销毁。

正式结果：

```ts
type OperationStatus =
  | 'applied'
  | 'requested'
  | 'unchanged'
  | 'blocked'
  | 'invalid'
  | 'stale'
  | 'disposed';
```

建议判别联合：

```ts
interface OperationResult {
  status: OperationStatus;
  actionId: string;
  reason?: string;
  requestId?: string;
  revision?: number;
  generation?: number;
}
```

约束：

- `applied`：authority 已经改变
- `requested`：等待外部 owner 接受
- `unchanged`：动作有效但没有值变化
- `blocked`：Capability / policy 拒绝
- `invalid`：候选本身非法
- `stale`：旧事务、旧异步结果或旧 revision
- `disposed`：owner 已销毁

Interaction 路由结果另外使用：

```text
pass / handled / blocked
```

不要混成 OperationResult。

## 2.3 LogicalOwnerTree

Focus、Interaction、Overlay、Theme 都必须共享**同一棵逻辑 owner tree**，不能各自维护一套 parent 关系。

例如 DOM 因 portal 分离：

```text
Modal
└─ DatePicker
   ├─ PresetRegion
   ├─ CalendarRegion
   └─ TimePanel (portal to body)
```

逻辑关系仍然保持上述结构。

Shared API 示例：

```ts
registerOwner({ id, parentId, document, rootResolver })
resolveOwnerFromEvent(event)
isLogicalDescendant(childId, parentId)
releaseOwner(id)
```

用途：

- Interaction scope 路由
- Overlay outside 判断
- Focus restore
- Theme context inheritance
- 父层 destroy 使所有逻辑后代失效

## 2.4 ControllableStateCore

受控 / 非受控不是 Value 独有问题。

需要抽出底层：

```text
ControllableStateCore<T>
```

负责：

- ownership: `internal | external`
- initial/default seed
- requestId
- baseRevision
- external sync
- stale request
- ack / reject

典型消费者：

- ValueController 的 committed 值
- Trigger 的 `open/defaultOpen`
- Tabs active key
- Pagination current page
- Collapse expanded keys

`ValueController` 在此基础上额外提供 draft / preview / rawInput / session。

### Controlledness 生命周期必须冻结

不能仅因为运行期 `updateOptions({ value })` 出现 value 字段就“无意切换” ownership。

每个公开组件必须在契约中明确其策略：

1. 构造时确定后固定；或
2. 允许显式 ownership transition，但必须走专门 transition transaction。

禁止隐式模式切换。

## 2.5 Input Modality

必须正式追踪最近有效输入模态：

```text
keyboard
pointer
 touch
programmatic
```

用途：

- keyboard focus outline 是否显示
- pointer focus 不错误显示 2px keyboard ring
- virtual active item 是否投影 keyboard focus 样式
- interaction feedback 选择

Input Modality 是 Interaction → Focus / Visual Projection 的只读上下文，不是 Value 状态。

## 2.6 StableKey + DataRevision

所有 Collection 类组件必须使用：

```ts
interface CollectionRef<K> {
  key: K;
  dataRevision: number;
}
```

禁止以裸 `index` 作为跨数据更新的身份。

必须覆盖：

- List / OptionList
- Tree / TreeSelect
- Cascader
- Calendar / PeriodPanel
- DatePicker 双面板
- Transfer
- Table
- VirtualList
- Tags

`dataRevision` 每次数据语义变化递增：

- options 替换
- filter/query 改变
- month/year panel 数据切换
- tree lazy load
- table sort/page/filter

Focus、Selection、Range anchor、ensureVisible、async load 返回时都必须核对 revision。

这条直接用于防止 DatePicker 改年月后第一次方向键仍按旧 active/index 计算而跳跃。

## 2.7 ProjectionSnapshot + ProjectionScheduler

ProjectionScheduler 不是性能优化，而是正确性机制。

一次状态接受顺序：

```text
resolve
→ authorize
→ prepare
→ before
→ accept revision #N
→ build ProjectionSnapshot #N
→ project DOM/Form/CSS from #N
→ notify
→ schedule non-critical async work
```

统一快照示例：

```ts
interface ProjectionSnapshot {
  revision: number;
  dataRevision?: number;
  committed?: unknown;
  draft?: unknown;
  preview?: unknown;
  rawInput?: string;
  activeKey?: unknown;
  selection?: unknown;
  capability?: unknown;
  feedback?: unknown;
  modality?: string;
}
```

任何旧 revision 的 render / async projection 晚到：

```text
revision < currentRevision
→ stale
→ 禁止覆盖 DOM/Form/CSS
```

这条用于彻底杜绝 ColorPicker “新颜色显示一瞬间又被旧 render 覆盖”的状态竞争。

## 2.8 EnvironmentPort

组件禁止默认使用全局：

```text
document
window
requestAnimationFrame
ResizeObserver
MutationObserver
getComputedStyle
matchMedia
```

通过实例环境解析：

```ts
interface EnvironmentPort {
  document: Document;
  window: Window;
  raf(...): number;
  cancelRaf(id): void;
  createResizeObserver(...): ResizeObserverLike;
  createMutationObserver(...): MutationObserverLike;
  getComputedStyle(el): CSSStyleDeclaration;
}
```

作用：

- 多 document / iframe
- 测试环境
- observer 能力检测
- 避免 `observer.observe is not a function` 类型的运行时差异

## 2.9 Resource Lease

Overlay、Focus editor、Pointer capture、scroll lock、observer、timer 都应通过 lease/token 管理。

原则：

```text
申请者释放自己的 token
而不是修改一个全局 boolean
```

典型：

- scrollLock lease
- focus edit lease
- pointer session lease
- modal isolation lease
- theme projection lease

旧 generation 的 cleanup 不能释放新 generation 的资源。

## 2.10 Diagnostics

开发模式必须主动检测：

- duplicate value owner
- duplicate selection truth
- duplicate activeKey owner
- stale generation publish
- controller used after dispose
- duplicate stable key
- overlay orphan layer
- focus restore to disconnected node
- motion handle never settled
- form carrier duplicate
- same action double mutation
- unmanaged document/global listener

Diagnostics 必须有稳定 code，不以中文提示文案作为程序分支。

---

# 3. 11 Controller 的依赖边界

推荐 DAG：

```text
Token ───────────────→ Theme
                         │
                         ↓
                       Overlay ← Motion
                         ↑
                         │
Focus ←────────── Interaction ─────────→ Component Adapter
 ↑                    ↑                      │
 │                    │                      ↓
 └──────────── Capability             Value / Selection / OpenPort
                                             │
                         Value ───────────────┼→ Form
                                             └→ Feedback
```

关键限制：

- Controller 之间优先读取 Port，不互相拥有对方状态
- `InteractionController` 不直接修改 Value / Selection
- Interaction 产生 semantic action，由组件 adapter 调用对应 Port
- Selection 若是公开 value，只通过 ValuePort 发布候选，不另存第二份 selected truth
- Overlay 不拥有 open
- Motion 不拥有业务 open/value
- Form 不拥有 field value
- Theme 不拥有 token catalog

---

# 4. Controller 公共形态

建议统一：

```ts
create(options) => {
  getState(),
  updateOptions(patch),
  on(type, fn),
  destroy()
}
```

但不是所有 Controller 必须字面相同；真正强制的是：

- 幂等 destroy
- revision / generation 可诊断
- 结构化 OperationResult
- source/reason/actionId 一致
- 不自行创建未登记的全局 listener/timer/portal
- 用户 callback 重入后重新校验 revision

---

# 5. ValueController

## 5.1 Owns

- committed
- draft
- preview channel
- rawInput channel
- edit session
- revision
- pending controlled request
- reset baseline

## 5.2 Does not own

- selected item navigation
- activeKey
- popup open
- DOM focus
- animation
- Form field registry

## 5.3 Adapter

组件提供：

```text
parse
normalize
copy
equals
validateCommit
format
serialize
rebase(optional)
```

## 5.4 API

```text
begin()
setDraft()
preview()
commit()
cancel()
requestChange()
syncExternal()
ack()
reject()
reset()
snapshot()
```

## 5.5 Reset baseline

正式规则：

- ValueController 是业务 value reset baseline 的唯一 owner
- FormBridge 只保存 authored DOM identity / native baseline
- FormController 只协调 reset，不复制业务 value baseline

`defaultValue` 的运行期修改必须由组件契约明确：是否只影响 future seed，或显式更新 reset baseline。禁止组件各自猜测。

---

# 6. FocusController

## 6.1 Owns

- real focus ownership
- virtual activeKey
- active region
- Focus Region Graph
- focus return target
- edit lease

## 6.2 Focus Mode

```text
native
virtual-navigation
hybrid-edit
multi-input
modal-scope
```

## 6.3 Focus Region Graph

复杂组件必须把 Tab 区域与区域内部导航分开。

DatePicker 示例：

```text
control
  ↓ Tab
preset-region
  ↓ Tab
calendar-region
  ↓ Tab
time-region
  ↓ Tab
footer-region
  ↓ Tab
outside
```

而 region 内：

```text
Arrow / Home / End / Page
→ virtual focus
```

不是每个 item 都成为 Tab stop。

## 6.4 TimePanel 硬规则

TimePanel：

```text
real focus = TimePanel canonical root
activeRegion = column
activeKey = current time option
```

hour/minute/second column 不得成为额外 Tab stop。

Tab：

```text
进入 TimePanel 一次
→ 下一次 Tab 离开整个 TimePanel
```

ArrowLeft/Right：切换虚拟列。  
ArrowUp/Down：切换当前列虚拟值。

---

# 7. InteractionController

## 7.1 Owns

- event ownership
- scope routing
- input source normalization
- semantic action dispatch
- handled / blocked / pass

不拥有 value、selection、open、focus state。

## 7.2 Input adapters

内部可以有：

```text
keyboard adapter
pointer adapter
touch adapter
gesture adapter
```

但外部统一进入 InteractionController。

## 7.3 Semantic Actions

### Navigation

```text
MOVE_UP
MOVE_DOWN
MOVE_LEFT
MOVE_RIGHT
MOVE_FIRST
MOVE_LAST
PAGE_PREVIOUS
PAGE_NEXT
NEXT_REGION
PREVIOUS_REGION
```

### Activation

```text
ACTIVATE
TOGGLE
OPEN
CLOSE
```

### Selection

```text
SELECT
UNSELECT
SELECT_ALL
CLEAR_SELECTION
REMOVE
RANGE_EXTEND
```

### Editing

```text
ENTER_EDIT
COMMIT_EDIT
CANCEL_EDIT
DELETE
BACKSPACE
TYPEAHEAD
```

### Session / Popup

```text
CONFIRM
CANCEL
DISMISS
```

## 7.4 Keymap Profile

物理键不全局绑定固定业务动作。

正确流程：

```text
physical key
→ native/edit guard
→ current scope profile
→ semantic action
→ component adapter
```

### Enter

- native button：保留 click activation
- text/textarea/contenteditable：按编辑 profile
- closed composite：可 OPEN
- open + active item：可 ACTIVATE / SELECT
- 明确 confirm region：才 CONFIRM

不存在全局 `Enter = CONFIRM`。

### Space

- text editor：输入空格
- checkbox / switch / multiple option：TOGGLE
- button：native activation
- drag/reorder：只有 profile 明确时接管

不存在全局 `Space = Enter`。

### Multiple Checkbox 统一规则

```text
ArrowUp/Down  → 移动虚拟焦点
Home/End      → 首尾
Space         → toggle 当前 checkbox
Enter         → activate/select 当前 item（是否等于 toggle 由 profile 决定）
Ctrl/Meta+A   → 仅明确支持 select-all 的 multiple domain
Esc           → 退出当前编辑/临时 session；无临时 session 再交父层
Tab           → 离开整个 composite region
```

按住 Space/Enter 默认不得重复 toggle/submit；`event.repeat` 默认只允许 navigation/step 类动作，其他动作 profile 显式开启。

### ArrowLeft / ArrowRight

优先级：

```text
native caret
→ structural expand/collapse
→ region/domain switch
→ hosted tag navigation
→ pass
```

### Home / End

- native text：光标移动
- composite navigation：首尾

### PageUp / PageDown

由当前 domain adapter 定义：Calendar 可切月，List 可翻页，Table 可滚动页；不做全局同义动作。

### Backspace / Delete

- 文本非空：native editing
- 空输入 + tag navigation：REMOVE tag
- selected item + profile 支持：REMOVE

### Tab

默认保留浏览器 Tab 顺序。

- composite：退出当前 region
- non-modal popup：按明确 `tab-exit` policy 请求关闭
- Modal：由 FocusScope trap
- Tab 本身绝不等于 confirm

## 7.5 IME / composition

composition 期间：

- 不把 Enter 当 confirm
- 不把 Escape 直接上送父 overlay
- 不运行 typeahead

必须浏览器回归验证。

## 7.6 Pointer / Touch

- pointerdown 只记录 intent 或开始 drag session
- mutation 优先走 native click 规范链，避免 key/pointer/click 双触发
- 坐标 0 是合法值
- pointercancel / lostcapture / window blur 清理临时 session
- touch scrolling 与 drag threshold 明确竞争策略

---

# 8. CapabilityController

## 8.1 Owns

- disabled
- readOnly
- loading / busy channels
- operation-level permission
- item-level permission

## 8.2 不是一个 boolean gate

必须按 operation 判断：

```text
focus
navigate
open
close
activate
edit
select
clear
remove
drag
drop
submit
inspect
copy
abort
```

## 8.3 基础行为矩阵

| 状态 | 聚焦/浏览 | 导航/展开 | 用户 mutation | 外部权威同步 |
|---|---|---|---|---|
| normal | 允许 | 允许 | 按 operation/item | 允许 |
| readOnly | 允许 | 通常允许无写操作 | 拒绝编辑/选择/删除/确认 | 允许 |
| loading/busy | 保留已有焦点 | 允许不冲突的浏览 | 按 channel 阻止重复/破坏性写入 | 允许并使旧任务失效 |
| disabled | 不进入 Tab | 拒绝 | 拒绝 | 允许重新启用/外部回写 |

入口 affordance、semantic action、最终 mutation sink 都检查**同一 capability snapshot**。

禁止出现：鼠标被挡，但键盘/API 用户动作仍能改变值。

---

# 9. MotionController

## 9.1 Owns

- transition intent
- visual presence
- generation
- animation resource lifecycle

不拥有业务 open/value。

## 9.2 API

```text
show
hide
retarget
reverse
cancel
whenSettled
destroy
```

结果：

```text
completed
superseded
cancelled
disposed
```

## 9.3 AutoSizeMotion Contract

Collapse 等 `height:auto` 组件必须使用统一 autosize profile。

规则：

```text
closed: 0
opening: currentComputedHeight → measuredTargetHeight
open: auto
closing: currentComputedHeight → 0
rapid reverse: 从当前视觉帧继续，不重新从 0/full 开始
```

必须覆盖：

- open → close → open 快速连续反转
- 10 次快速 Enter
- 动画过程中内容高度改变
- nested Collapse
- ResizeObserver 更新
- reduced motion
- destroy mid-frame

旧 generation 的 completion 禁止：

- unmount 新状态 DOM
- 释放新 generation lease
- 发出错误的 opened/closed

---

# 10. SelectionController

## 10.1 Owns

- stable selected keys
- anchor / range
- checked / indeterminate projection
- remote selection semantic
- selection request

不拥有 activeKey。

## 10.2 Multi-channel Selection

不能把所有选择都扁平为一个数组。

正式 channel 可包括：

```text