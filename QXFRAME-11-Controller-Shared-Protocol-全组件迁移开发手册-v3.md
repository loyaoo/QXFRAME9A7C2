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
selected
checked
target
sourceChecked
targetChecked
rangeAnchor
allMatching
```

典型：

- TreeSelect：checked / selected / active 分离
- Transfer：左右 checked 与最终 target value 分离
- Table：explicit selected 与 remote allMatching 分离

## 10.3 DataRevision

range anchor、focus key、remote query、lazy tree 必须绑定 dataRevision/queryRevision。

旧数据 revision 的索引、anchor、异步 load 不能继续修改新集合。

## 10.4 Remote allMatching

模型：

```text
queryKey
excludedKeys
datasetRevision
known/unknown count
```

不能把“所有匹配项”错误展开为当前页面已经加载的 keys。

---

# 11. OverlayController

## 11.1 Owns

- layer
- portal
- position
- logical child relationship
- outside/dismiss registration
- isolation
- scroll lock
- overlay resource lease

不拥有 open。

## 11.2 Open / Overlay / Motion 三态分离

```text
OpenPort：逻辑 open/close
Overlay：mounted/activated/deactivating/disposed
Motion：entering/shown/leaving/hidden
```

## 11.3 Open / Close Reason 枚举

必须统一 reason：

```text
select
confirm
cancel
escape
outside-pointer
focus-outside
tab-exit
programmatic
ancestor-close
destroy
reopen
```

`close` 本身绝不表示 commit。

## 11.4 Escape 路由

Escape 顺序：

1. IME / native editor
2. current edit lease
3. drag/pointer session
4. innermost dismissable overlay
5. current temporary navigation/session
6. pass

内层 close 被 `blocked` 后默认不能继续把同一个 Escape 关闭父层。

## 11.5 Closing 期间

视觉 leave 与资源释放不是同一时间点。

Modal/Drawer 背景隔离、scroll lock、pointer interception 在屏障尚存在时不得提前释放。

父层 destroy 时：

- descendants 按逻辑树失效
- 不允许每个 child 逐个 focus restore
- 最终 restore 由外层关闭事务统一决定

---

# 12. FeedbackController

## 12.1 Owns

与 operation/task 关联的可见反馈：

```text
idle
pending
success
warning
error
progress
```

不拥有任务或 value。

## 12.2 去重

```text
owner + operation + actionId/requestId
```

而不是只按 message 文本去重。

## 12.3 局部优先

- field error → field
- form summary → form
- upload progress → upload item
- 明确需要全局通知 → Message/Notification

禁止同一错误自动 field + toast 双重出现。

旧 task generation 的失败不得覆盖新成功。

---

# 13. ThemeController

## 13.1 Owns

- theme mode
- managed scope
- context revision
- context inheritance
- portal theme context

当前保证范围：light / dark；品牌变化走 Token preset，不随意增加无 CSS 支持的主题名。

## 13.2 Portal

Theme context 至少包含：

```text
ownerDocument
scope chain
theme
token overrides
size/variant/motion 等正式上下文字段
```

不复制整个 computedStyle。

主题变化不能：

- 重置 draft
- 重置 activeKey
- 清 selection
- 重新触发不必要 enter animation

---

# 14. TokenController

## 14.1 Owns

- token catalog
- token kind
- dependency / alias
- scope override
- CSS variable projection

组织：

```text
primitive seed
→ semantic
→ family
→ component/state（仅确实需要时）
```

## 14.2 Visual State Channels

Token / CSS 必须定义状态通道，不允许靠 selector specificity 碰运气。

建议：

```text
interaction: hover / active
keyboard-focus: focus-visible
semantic: selected / error / warning / success
availability: disabled / readonly / loading
surface/elevation: popup / floating / pressed
```

组合示例：

```text
error + keyboard-focus
border  = error token
outline = keyboard focus token
background = interaction token
```

这保证：

- selected 不抢 focus outline
- error 不吞 keyboard focus
- loading 不靠一种颜色表达所有状态

## 14.3 Catalog Gate

CI 检查：

- 未登记 CSS var
- token 循环引用
- 无 fallback 的断链
- 非主题化硬编码颜色
- 非法 z-index 越权
- light/dark/state token 缺失

---

# 15. FormController

## 15.1 Owns

- field registry
- dirty/touched/pending/valid
- validation task coordination
- submit/reset transaction

字段值仍由 ValueController 持有，原生载体仍由 FormBridge 管。

## 15.2 Field identity

`fieldId` 是唯一身份，`name` 可以重复。

不能 `Map<name, field>` 覆盖 checkbox/multiple 同名字段。

## 15.3 Submit

```text
capture form revision
→ sync validation
→ async validation generation
→ confirm revision still current
→ serialize committed values
→ submit
```

值变更后旧 validator 返回：stale。

## 15.4 Reset

```text
respect native reset cancellation
→ cancel validation/submit tasks
→ ValueController reset baseline
→ clear draft/preview/feedback/touched
→ project FormBridge
```

external controlled field：发 reset request，未 ack 前 committed/FormData 不能假装已重置。

---

# 16. 跨 Controller 统一事务

正式顺序：

```text
1. resolve owner + semantic action
2. native / IME / edit guard
3. snapshot capability/value/data/session/lifecycle revision
4. prepare candidate（纯计算，不写 DOM）
5. before* veto / candidate transform
6. re-check revision / generation / disposed
7. authority accept 或 external request
8. build single ProjectionSnapshot
9. project Control / Selection / FormBridge / CSS
10. publish public events
11. schedule Motion / Feedback / async validate / ensureVisible
```

关键：

- `before*` 是 veto；普通 `emit` 不是 veto
- callback 内 `destroy/updateOptions/setValue` 会让外层旧事务 stale
- notify 前关键 DOM/Form projection 已同步，回调读取状态一致
- 非关键 Motion/Toast 失败不能回滚 committed

---

# 17. Reentrant Dispatch 规则

仅靠 revision 防旧写还不够，必须固定 dispatch 调度语义。

建议：

- authority accept 与关键 projection 同一同步事务完成
- public callback 可触发新 action
- 新 action 允许嵌套进入新的 actionId/revision
- 旧 action callback 返回后必须 re-check；不能继续覆盖新 revision
- 同一事务最多发布一次公开 `change`
- 非关键重复 render/feedback 可进入 microtask/frame queue 合并
- 禁止无限同步递归；Diagnostics 检测过深 reentry

---

# 18. Public Event Order Contract

输入型组件统一事件语义：

```text
native input / pointer / keyboard
→ onInput / onDraftChange（如适用）
→ beforeChange / beforeConfirm
→ applied 或 requested
→ DOM/Form projection
→ onChange / onChangeRequest
→ Feedback / Motion
```

要求：

- `onInput` ≠ `onChange`
- preview 不冒充 change
- controlled `requested` 不冒充 applied
- silent 只抑制通知，不得跳过必要投影和 owner 同步

事件顺序属于公开 API 契约。

---

# 19. Picker Family Contract

适用：

- DatePicker
- TimePicker
- ColorPicker
- WheelPicker
- Cascader
- TreeSelect
- Select/Autocomplete 中的 picker-like popup 部分

## 19.1 状态定义

```text
committed = 已确认值 / FormData
 draft     = popup 当前候选
 preview   = hover/drag/keyboard 临时视觉状态
 rawInput  = 可编辑 control 的原始文本
```

## 19.2 Display Projection

为解决当前 Picker control 显示不统一，冻结默认 family rule：

```text
Popup closed:
  control = committed

Popup open + rawInput active:
  control = rawInput

Popup open + preview exists:
  control = preview（若该组件 profile 声明 previewControl=true）

Popup open + dirty draft:
  control = draft

Otherwise:
  control = committed
```

重要：

**control 显示 draft 不等于 committed 已改变。**

所以 `needConfirm=true`：

```text
用户选 B
control 显示 B
panel 显示 B
getValue/FormData 仍然 A
onChange 不触发
```

Confirm：

```text
B → committed
```

Esc：

```text
丢弃 B
control 恢复 A
```

组件如果确有独立 `draftValueTarget`，可以配置 control 保持 committed，但整个 family 必须统一声明，不允许每个 Picker 靠局部 render 偶然形成不同表现。

## 19.3 needConfirm=false

完成一次有效选择：

```text
draft/preview
→ commit
→ control立即显示 committed
→ onChange
→ 按 closeOnSelect profile 关闭
```

不能等待 Esc/close 才补提交。

## 19.4 needConfirm=true

完成选择只更新 draft。

确认来源：

- Confirm button
- 明确 confirm action
- 当前 family 规范允许的 Enter

Esc/outside/tab-exit 默认 rollback 未提交 draft。

## 19.5 Presets

Preset 与普通日期/时间选项遵守同一提交语义：

### needConfirm=false

```text
activate preset
→ commit
→ close
```

### needConfirm=true

```text
activate preset
→ update draft
→ keep popup open
→ wait confirm
```

Preset region 使用虚拟焦点：

- ArrowUp/Down（或 profile 的 Left/Right）移动 preset activeKey
- Tab 只进入/离开整个 preset region
- 每个 preset item 不成为独立 Tab stop

## 19.6 Esc

Esc 永远不是“补确认”。

即时模式已经完成并提交的选择不会被 Esc 撤销；Esc 只取消仍未提交的 draft/preview/editor session。

## 19.7 TimePicker / ColorPicker Enter

TimePicker、ColorPicker 必须与其他 Picker 拥有明确 Enter confirm 行为；不存在“只能 Esc 关闭并顺便确认”。

Color drag：

```text
pointer move → preview
pointer up   → selection-complete
needConfirm=false → commit
needConfirm=true  → draft only
```

---

# 20. Composite Navigation Contract

适用于：

- Select
- Menu
- Tree
- TreeSelect
- Cascader
- Calendar / PeriodPanel
- TimePanel
- Preset list
- Transfer
- Tags
- Table navigation
- OptionList

共同规则：

1. 一个 canonical real-focus owner，除非进入 Hybrid Edit。
2. 内部 navigation 用 activeKey，不通过 `.focus()` 在 item 间跳。
3. Tab 在 region 之间移动；Arrow/Home/End/Page 在 region 内移动。
4. activeKey ≠ selectedKey。
5. item 被卸载/disabled/dataRevision 改变后必须 reconcile。
6. VirtualList ensureVisible 只是请求；异步挂载后再次检查 revision。

---

# 21. DatePicker 双面板导航专项规范

双面板不能把左/右面板的旧 index 当作唯一焦点状态。

建议模型：

```text
calendarDataRevision
activeDateKey
activePanel = left | right
leftVisibleMonth
rightVisibleMonth
rangeAnchorKey
```

切换年月后：

```text
1. bump dataRevision
2. recompute visible month ranges
3. reconcile activeDateKey into new visible domain
4. invalidate stale range/index references
5. project active cell
```

第一次 Arrow 必须从**新 activeDateKey**计算，不得从旧开始日期/结束日期/index 恢复。

验收：

- 左面板切年/月后回 Calendar，第一次四向不跳旧结束日期
- 右面板同样
- range start/end 独立于 activeDate
- 双面板跨边界导航连续

---

# 22. Visual Interaction State Contract

统一视觉状态职责：

```text
hover            pointer interaction background/border helper
active           pressed state
selected         semantic selection border/background
keyboard-focus   2px outline
error/warning/success semantic border/status
loading          busy projection + mutation blocked
readonly         readonly projection
 disabled         disabled projection
```

禁止：

- selected 改 focus outline
- error 吞掉 keyboard outline
- box-shadow 模拟双倍边框
- root + virtual item 同时出现 keyboard outline

视觉状态投影读取同一个 ProjectionSnapshot。

---

# 23. ComponentProfile

每个组件声明需要哪些能力，而不是强制实例化 11 Controller。

示例：

```js
const profile = {
  name: 'TreeGrid',
  value: { mode: 'controlled-or-default', adapter: treeGridValueAdapter },
  selection: { mode: 'multiple', channels: ['selected'], keyOf: rowKey },
  focus: { mode: 'virtual-navigation', regions: treeGridRegions },
  interaction: { keymap: TreeGridKeymap, actions: treeGridActions },
  capability: { role: 'composite', itemDisabled: rowDisabled },
  overlay: null,
  motion: null,
  feedback: { localStatus: true },
  form: { serialize: selectedRowsToFormValue },
  tokens: ['semantic-accent', 'family-control', 'component-tree-grid'],
  ownership: {
    value: 'ValueController',
    selection: 'SelectionController',
    focus: 'FocusController'
  },
  dependencies: {
    interaction: ['focus', 'capability']
  }
};
```

Profile 只描述能力，不成为状态容器。

## 23.1 Adapter

新组件只实现领域差异：

```text
normalizeValue
copyValue
equals
keyOf
collectionRevision
navigation math
semantic action handler
serialize
render
```

## 23.2 composeControllers

可以提供内部 helper：

```text
composeControllers(profile, context)
```

但它必须是静态组合工具，不是 service locator；不能根据组件名字运行时猜测能力。

---

# 24. 40 个公开组件接入矩阵

缩写：

- V Value
- F Focus
- I Interaction
- C Capability
- M Motion
- S Selection
- O Overlay
- B Feedback
- H Theme
- T Token
- R Form

H/T 是所有组件 CSS/context 基线，不表示每个组件都要创建 Theme/Token 实例。

| 组件 | 运行时组合与必须保留的差异 |
|---|---|
| Autocomplete | V F I C S O B R；搜索 rawInput、suggestion activeKey、selected value 分离；async suggestions 带 query/dataRevision。 |
| Carousel | V F I C M；autoplay、pointer swipe、keyboard 同一 current index；focus/hover pause profile。 |
| Cascader | V F I C S O B R；path、selected、active column、lazy data 四种状态独立。 |
| Collapse | V F I C M；expanded value 受控/非受控；autosize Motion 快速反转。 |
| ColorPicker | V F I C M O B R；preview/draft/commit、gradient stop、EyeDropper generation、drag completion。 |
| DatePicker | V F I C S M O B R；single/multiple/range/time、rawInput、preset、双面板 dataRevision。 |
| Drawer | F I C M O B；modal resources、child overlays、focus return、async actions。 |
| Dropdown | V F I C S M O；selectable menu 与 action menu 不同 profile。 |
| Image | F I C M O B；preview/transform；src 不是 Form value。 |
| InputNumber | V F I C B R；parser/formatter/rawInput、precision、step、blurCommit profile。 |
| InputOTP | V F I C B R；multi-input focus mode，一个聚合 value owner；paste/IME/auto-advance。 |
| JSON | F I C B；navigation + Hybrid Edit；默认无 V。 |
| Loading | C M B O；blocking/local scope 与 focus/scroll resources 对齐。 |
| Menu | V F I C S O；virtual navigation/typeahead/submenu owner/action-selection 分离。 |
| Message | M O B；timer、dedupe、dismiss reason。 |
| Modal | F I C M O B；trap、async confirm、nested overlay、focus return。 |
| Notification | M O B；stacking、persistent actions。 |
| Pagination | V F I C；current controlled/uncontrolled、page count reconcile。 |
| Popconfirm | F I C M O B；confirm/cancel/blocked close 语义明确。 |
| Popover | F I C M O；interactive 与 display-only profiles。 |
| Progress | B；status/progress projection，不建无意义 Value。 |
| Rate | V F I C B R；hover preview、quantization、keyboard/pointer 同步。 |
| Result | B；展示型，不建无意义 Interaction。 |
| Ripple | I C M；pointer/keyboard activation 去重、reduced motion。 |
| Scroll | F I C M；native scroll 优先、边界/惯性 profile。 |
| Select | V F I C S O B R；search rawInput、option active、multiple tags、controlled request。 |
| Slider | V F I C B R；drag preview/commit、range thumbs、disabled intervals。 |
| Sort | V F I C S M O；drag session、keyboard reorder、ghost overlay。 |
| Steps | V F I C B；current/reachable；display mode 不注册 interaction。 |
| Table | V F I C S O B R；cell/row Hybrid Edit、virtualization、remote allMatching、async load。 |
| Tabs | V F I C S M O；activeKey、manual/auto activation、overflow menu。 |
| TagInput | V F I C S B R；rawInput、tokenize、tag edit/remove。 |
| Tags | V F I C S O B R；hosted mode、overflow overlay、controlled remove request。 |
| TimePicker | V F I C S M O B R；TimePanel virtual columns、rawInput、range、last-step completion。 |
| Tooltip | M O；non-interactive 不抢 focus/key；interactive profile 才装配 F/I。 |
| Transfer | V F I C S B R；sourceChecked/targetChecked/targetValue channels 分离。 |
| TreeSelect | V F I C S O B R；checked/selected/expanded/active/lazy/search 分离。 |
| Trigger | F I C M O；open port authority，不持业务 value。 |
| Upload | V F I C S O B R；file lifecycle、progress generation、preview overlay、controlled file list。 |
| WheelPicker | V F I C S M O B R；wheel settle 完成选择，confirm/cancel 与 Picker family 一致。 |

---

# 25. 内部构件也必须迁移

不能只签收 40 个公开名字。

必须覆盖：

```text
Component
FieldComponent
PopupComponent
PopupFieldComponent
PickerComponent
Control
PickerField
TextField
OptionList
ItemCollection
Tree
Calendar
PeriodPanel
TimePanel
WheelPanel
ColorPanel
OverlayComponent
Popup
VirtualList
```

原则：

- 基类只负责 lifecycle/port wiring，不存第二份业务 truth
- hosted internal component 不重复注册 overlay/focus owner
- Panel 负责领域算法，不独立创建另一套 committed value
- VirtualList 负责卸载后的 key/revision reconcile

---

# 26. 当前 P0 问题与目标架构映射

| 当前问题 | 根因 owner | 必须由本次架构解决 |
|---|---|---|
| TimePicker 选择中 control 不显示 draft，Esc 后才变化 | Value + Projection | Picker Display Contract；Esc 不 commit；Enter confirm |
| ColorPicker 新颜色闪一下又恢复旧值 | Projection revision 竞争 | ProjectionSnapshot/Scheduler |
| DatePicker/TreeSelect/Cascader 等 Picker control 显示不统一 | Family profile 不统一 | Picker Family Contract |
| TimePanel Tab 进入 column1/2/3 不可视焦点 | Focus owner 错 | canonical root + virtual region |
| DatePicker 双面板改年月后第一箭头跳旧日期 | old key/index + data revision | StableKey/DataRevision reconcile |
| Date/Time preset 不按 needConfirm 自动提交/关闭 | Picker selection completion 不统一 | Preset 使用同一 Value commit policy |
| Preset 每项通过 Tab | region 模型缺失 | Focus Region Graph |
| Collapse 快速 Enter 动画撕裂/跳跃 | autosize reverse 不完整 | AutoSizeMotion Contract |
| multiple checkbox 键盘不统一 | key→action 写死 | Interaction Keymap Profile |

这些问题应转成浏览器 regression，不允许只通过 Controller unit test 判定完成。

---

# 27. 迁移包与实施顺序

## Phase A：冻结基线与 Shared Protocol

新增/固化：

- ActionContext / OperationResult
- LogicalOwnerTree
- ControllableStateCore
- InputModality
- DataRevision
- ProjectionScheduler
- EnvironmentPort
- Diagnostics
- ComponentProfile schema

门槛：

- 不修改业务行为
- ESM graph 无环
- 现有 release gates 仍绿

## Phase B：Value + Picker Family

优先：

- DatePicker
- TimePicker
- ColorPicker
- WheelPicker
- PickerField / PickerSession / PickerComponent

然后：

- Select
- TreeSelect
- Cascader
- Autocomplete

门槛：

- controlled/uncontrolled
- needConfirm true/false
- Esc/outside/Tab
- Enter confirm
- presets
- FormData
- projection no-flicker

## Phase C：Focus + Interaction + Capability

优先：

- TimePanel
- Date Calendar/PeriodPanel
- Select
- TreeSelect
- Cascader
- Menu
- Tags
- Table Hybrid Edit

门槛：

- 一个 canonical real-focus owner
- child scope 不被 parent 抢键
- IME/native editing
- multiple checkbox Space
- Home/End/Page
- loading/readonly/disabled 同源门禁

## Phase D：Selection

迁移：

- OptionList/List/Tree
- Transfer
- Table
- Tags
- Select/TreeSelect/Cascader

门槛：

- multi-channel
- stable key
- dataRevision
- lazy/remote/range

## Phase E：Overlay + Motion

迁移：

- Trigger
- Popup base
- Modal / Drawer
- Popover / Tooltip / Popconfirm
- all picker overlays
- Collapse / Tabs / Dropdown motion

门槛：

- nested overlay
- logical parent
- quick reverse
- autosize
- focus restore
- scroll lock / isolation lease

## Phase F：Theme + Token + Visual State

门槛：

- root/light/dark/scope/portal
- state channels
- token catalog
- unmanaged var lint
- theme switch 不清业务状态

## Phase G：Feedback + Form

门槛：

- same-name fields
- native submit/reset
- async validator stale
- external reset
- local/global feedback de-dup

## Phase H：全组件迁移与旧路径删除

- 40 个公开组件
- 内部 panels/base classes
- docs canonical demos
- static native controls
- delete duplicate authority

## Phase I：发布验收

- architecture
- contracts
- esm graph
- types + negative type tests
- Node contract tests
- browser interaction suite
- visual matrix
- package/release
- GitHub Pages canonical demo

---

# 28. Controller Conformance Test Kit

框架必须提供统一测试工具，而不是每个组件自己想一套。

## 28.1 Value Contract

自动矩阵：

```text
internal/external
value/defaultValue
request/ack/reject
commit/cancel
rawInput
preview
external sync conflict
reset
destroy in callback
stale async
```

## 28.2 Focus Contract

```text
native
virtual
hybrid edit
region graph
Tab exit
item removed
item disabled
dataRevision changed
ensureVisible async
portal restore
destroy
```

## 28.3 Interaction Contract

```text
keyboard
pointer
touch
IME
repeat
modifier
child scope
parent scope
handled/blocked/pass
native default preservation
```

## 28.4 Capability Contract

```text
normal
readonly
loading/busy
disabled
item disabled
state changes mid-gesture
external sync always allowed
```

## 28.5 Motion Contract

```text
enter
leave
reverse
10x rapid reverse
auto-size
content resize
reduced motion
destroy mid-frame
stale completion
```

## 28.6 Overlay Contract

```text
nested portal
outside pointer
Esc chain
Tab exit
modal trap
ancestor destroy
reopen during leave
focus return
multi-document
```

## 28.7 Selection Contract

```text
single
multiple
range
tree checked/indeterminate
remote allMatching
query revision
lazy data
reconcileData
controlled request
```

## 28.8 Form Contract

```text
native formdata
submitter
reset cancel
same name
array values
disabled/readonly
external reset
async validation
first invalid reveal/focus
```

---

# 29. Modifier / Typeahead 规范

必须在实现 Interaction 时冻结：

- `Shift+Arrow`：仅 range/extend profile
- `Ctrl/Meta+A`：仅明确 multiple selectable domain
- `Ctrl/Meta+Arrow`：由组件 profile 定义，不全局劫持
- `Alt+Arrow`：只有既有组件明确需要时使用
- Typeahead：Menu/Select/Tree 等支持；IME composition 期间停用
- repeated characters：按缓冲时间与同字符循环规则统一
- Mac `Meta` 与 Windows/Linux `Ctrl` 通过 platform abstraction 映射

禁止组件自己实现另一套 typeahead timer。

---

# 30. Fault Containment

必须定义异常发生在哪一阶段时如何处理：

## prepare/normalize throw

- authority 不改变
- DOM 不改变
- 返回 invalid/error

## before callback throw

- 事务拒绝或转 error result
- 不接受 candidate

## public onChange throw

- committed 已接受，不回滚业务值
- Diagnostics 记录
- 后续非关键通知可继续按策略

## projection throw

- authority 不回滚
- 标记 projection dirty
- 尝试从最新 ProjectionSnapshot 重建
- 禁止用旧快照恢复

## Motion/Feedback throw

- 不回滚 committed/open
- 清理自身 lease
- Diagnostics

---

# 31. Architecture Lint

CI 默认拒绝新增以下模式，除非明确 allowlist：

```text
组件内新增裸 document/window keydown listener
组件直接管理全局 Escape
复杂组件 item 之间直接 .focus()
组件自己创建 portal/layer stack
组件直接维护 hidden form carrier
组件同时出现第二份 committed/selected truth
组件新增 setTimeout 模拟 Motion completion
组件 keydown 大量 if(event.key===...)
组件直接写绝对 z-index
组件 CSS 新增未登记主题色
```

Lint 不要求禁止所有 `keydown`：原生 editor adapter 等特殊场景允许，但必须登记 owner/reason。

---

# 32. 新组件一次性接入流程

新组件 PR 必须包含：

1. Identity / State Owner 表
2. `ComponentProfile`
3. Domain adapters
4. action→capability map
5. Focus Region Graph（如适用）
6. Form serialize/reset（如适用）
7. Theme/Token consumption
8. Controller Contract Tests
9. Browser combination test
10. destroy/resource proof

新增组件不需要：

- 修改中央 `switch(componentName)`
- 复制 keydown state machine
- 自己监听 document Esc
- 自己实现 controlled/defaultValue
- 自己实现 popup outside / focus restore

做到这一点，才证明 Controller 架构真正降低新增组件成本。

---

# 33. AI 实施时的硬性规则

后续让 AI/Codex 迁移时，任务说明必须包含：

1. **先审计现有 authority，再修改。** 不允许先新增新 Controller 后再想怎么接。
2. **一个 PR / migration pack 必须包含所有直接消费者。** 不允许半迁移 owner 发布。
3. **旧路径删除是完成条件。** 只把新 Controller 接上但旧 local state 仍可写，视为未完成。
4. **不能为了过测试改变契约。** 测试应证明规范，而不是规范迁就当前 bug。
5. **每次修改必须新增 regression。** 当前视频问题必须固化浏览器测试。
6. **不允许隐藏失败。** stale/blocked/invalid 必须可诊断。
7. **不使用组件名分支。** 差异通过 adapter/profile。
8. **不破坏静态 ESM。** 不引入全局 runtime locator。
9. **更新 docs canonical demo。** 完成的行为必须可在 `docs/components/*.html` 和指定 canonical 页面复现。
10. **每轮汇报总进度、已完成、未完成、CI、Pages。**

---

# 34. 完成定义

整个方案只有同时满足以下条件才算完成：

1. 11 Controller 各自只有一个 authority，且没有第二份镜像 truth。
2. Shared Protocol Layer 全部落地：Action、OwnerTree、Controllable、Modality、DataRevision、Projection、Environment、Diagnostics。
3. 40 个公开组件逐项签收。
4. 内部 Panel / Base / VirtualList / native controls 逐项签收。
5. Picker Family 的 control/draft/confirm/cancel 行为完全统一。
6. TimePanel、Calendar、Tree、Menu、Tags 等 composite 全部使用统一 region/navigation 协议。
7. Multiple checkbox Space/Enter/Arrow/Home/End 等行为按 profile 统一。
8. Collapse 等 autosize motion 快速反转无闪烁、撕裂、旧 completion 干扰。
9. Value/Selection/Focus/Overlay/Form 的旧异步结果全部有 stale 防护。
10. CSS visual state channel 与 Token catalog 一致。
11. native submit/reset/FormData、portal、IME、pointer、touch、multi-document 有真实浏览器回归。
12. ESM graph 无循环、types/contracts/manifests/build/release 全部通过。
13. Architecture Lint 无未授权双 owner / global listener / direct focus / duplicate keymap。
14. 新增一个代表性复合组件可以只通过 profile + adapter 接入，不修改中央分发器。
15. GitHub Pages canonical docs 部署最新通过版本，人工可复核。

---

# 35. 当前建议的第一批实际实施目标

不要同时动全部 40 组件。第一批用于验证架构本身：

```text
Shared Protocol Layer
↓
ValueController + Picker Family
↓
FocusController + InteractionController + CapabilityController
```

试点组件：

1. DatePicker
2. TimePicker / TimePanel
3. ColorPicker
4. Select
5. TreeSelect
6. Cascader
7. Collapse（Motion autosize）

这批恰好覆盖当前真实暴露的：

- draft/control 显示不统一
- Esc/Enter 语义错误
- Preset 行为错误
- TimePanel 不可视真实焦点
- DatePicker 双面板旧焦点跳跃
- multiple selection keyboard
- rapid transition reverse

第一批通过后，再迁移 Menu/Tags/Transfer/Table/Upload 等复杂消费者。

---

# 36. 最终架构判断

本方案不再追求增加更多 Controller。

真正的框架内核是：

```text
11 Controllers
+
Shared Protocol Layer
+
Family Contracts
+
Component Profiles / Adapters
+
Conformance Test Kit
+
Architecture Lint
```

11 Controller 解决“谁负责什么”；Shared Protocol 解决“它们如何共同工作”；Family Contract 解决“同类组件如何保持人机交互一致”；Conformance + Lint 解决“以后不会重新烂回组件各写一套”。

后续实施阶段发现的新问题，应优先判断是：

```text
协议缺口？
家族规范缺口？
领域 adapter 问题？
具体组件 bug？
```

只有确实无法落入上述层次时，才考虑新增框架概念。禁止因为一个组件特殊就继续扩张 Controller 数量。