> **当前发行目录说明（ESM 架构）**：本手册历史章节中出现的旧 `js/`、`loader/`、`src/modules/`、Registry loader、聚合 kernel、独立组件 CSS 与 `.dom.js` 路径仅作历史记录，不再是当前发行结构。当前唯一权威目录契约见根目录 `README.md`：`src/index.js` + `src/components/` + `src/core/` + `src/utils/` + `src/runtime/`，生产 `dist` 由 Rollup 从该 ESM source graph 生成。

> **当前底层不变量补充**：Overlay 生命周期/焦点/Z-order 以 logical owner tree 为权威；Table 数据替换必须统一 reconcile selection/expanded，fixed geometry 以实际布局为权威；模块依赖必须在 build/cold-load 阶段可闭合；公共 URL sink 必须经过 `URLPolicy`；公共 CSS 禁止 `@layer`、`:is()`、`:has()`、`:dir()`。

# QXFRAME9A7C2 重构开发规范手册（整合重写版）

> **Canonical Source of Truth / 唯一长期规范源**
>
> 本手册用于约束 QXFRAME9A7C2 后续重构、功能维护、视觉系统维护、Docs/Demo、Browser Gate、性能验证与发布验收。
>
> 本版以当前项目包中的重构手册、虚拟焦点手册、根级状态文档、Runtime/Loader/CSS/Docs/Tools/Tests README，以及 `audit/` 中仍然有效的长期规则为输入进行合并。历史版本流水、旧 checkpoint 数字、哈希、一次性故障诊断、已关闭问题、重复验收结论不再进入规范正文。
>
> **规范正文只回答“今后必须怎么做”；历史证据回答“过去某一轮发生过什么”。两者不得混为同一个文档 owner。**

---

## 0. 文档治理与去重规则

### 0.1 文档 Owner 分层

项目文档必须按以下职责维护，禁止互相复制形成第二套规范：

| 文档 | 唯一职责 |
| --- | --- |
| `QXFRAME9A7C2-重构开发规范手册.md` | 长期、稳定、跨版本的架构/行为/视觉/测试规范 |
| `REFACTOR_STATUS.md` | 当前 checkpoint 的完成状态与当前 release truth |
| `ISSUES.md` | 当前仍然存在的问题；已关闭问题不长期堆积 |
| `STAGE_REPORT.md` | 当前轮实际执行了什么、没有执行什么 |
| `README.md` | 发布说明与历史 release ledger |
| `audit/` | 设计研究、故障分析、迁移报告、历史规则原文、验收证据 |
| `evidence/` / `artifacts/` | 机器可读结果、截图/性能/Browser 输出 |
| 模块级 `README.md` | 只描述本目录的局部装载/维护方式，不复制全局规范 |

### 0.2 主手册禁止出现的内容

下列内容不得作为长期规范反复追加到本手册：

- 按版本号新增的 H1/H2/H3 章节；
- 某一轮精确 case 数、浏览器版本、SHA-256、文件总数；
- 已关闭故障的完整排查过程；
- 历史 `OPEN` / `PENDING` / `FAIL` 状态；
- 临时 debug harness 使用说明；
- 一次性兼容 workaround；
- 与现有主题章节语义相同、仅措辞不同的重复条款；
- “为了让某次 Gate 通过”而存在、但不代表长期架构边界的临时规则。

### 0.3 新规则写入规则

新增长期规则时必须：

1. 先找到真实 owner 和现有主题章节；
2. 修改现有条款，不创建“本版本新增规则”章节；
3. 相同规则只保留一个权威表述，其他文档仅引用；
4. 故障原因、迁移过程、验证数字放入 `audit/`；
5. 当前状态同步到 `REFACTOR_STATUS.md` / `ISSUES.md` / `STAGE_REPORT.md`；
6. 若规则改变 public API、DOM contract、视觉 contract 或 Gate，必须同轮更新 Docs/Demo/Test；
7. 不允许 canonical 手册与专题手册同时拥有同一条规范的不同版本。

### 0.4 规范关键字

- **MUST / 必须**：发布前必须满足。
- **MUST NOT / 禁止/不得**：任何实现不得违反。
- **SHOULD / 应**：默认实现方式；偏离时必须有明确 owner 证据。
- **MAY / 可**：允许但不构成强制 API。

---

# 第一部分：项目工程基线

## 1. 输入基线与施工边界

每轮重构只以**当前最新完整项目包**为施工基线。

施工前必须读取：

- 本手册；
- `REFACTOR_STATUS.md`；
- `ISSUES.md`；
- `STAGE_REPORT.md`；
- 与目标 owner 直接相关的 `audit/` 证据；
- Runtime Manifest 与目标组件源码。

禁止从历史 zip、历史 README 片段或旧 Gate 反推当前事实。

当历史 Gate 与当前 canonical contract 冲突时，必须先确认当前 Runtime owner，再迁移过时 Gate；禁止为了保住旧断言恢复已经退休的 alias、双 owner 或第二交互路径。

## 2. 源码目录与构建原则

源码布局保持人类可读：

```text
js/
├─ core/        framework mechanisms / shared infrastructure
├─ utils/       low-level reusable utilities
└─ components/  visible UI; JS / DOM blueprint / CSS co-located

css/            framework-global visual resolution
runtime/        canonical runtime manifest
loader/         official zero-build loader
docs/           canonical documentation
tests/          canonical browser contracts
tools/          release / audit / browser / performance tooling
audit/          historical evidence and analysis
evidence/       generated evidence
dist/           production release artifact
```

`Headless`、`DOMHeadless`、Building Block 是责任概念/registry，不为了目录对称制造新的顶层源码树。

开发模式保持 zero-build：普通 `<script>`、官方 Loader、`file://` 场景应能工作；Runtime 不得依赖 npm、开发服务器或网络请求才能运行。

## 3. Runtime Manifest、Loader 与 Dist

`runtime/qxframe9a7c2-runtime-manifest.js` 是运行时依赖图的唯一 owner。

必须满足：

- Loader 和 release packager 消费同一份 manifest；
- manifest 明确模块依赖与装载顺序；
- 依赖图不得产生 cycle；
- Production bundle 只由 manifest 声明的 Runtime/Component/CSS 输入构建；
- debug、tests、docs、audit、tools 不得混入 production bundle；
- `dist/qxframe9a7c2.js` 必须是自包含 release runtime；
- Runtime manifest 必须在生产 JS bundle 中按 canonical 顺序生效；
- root aggregate 与 `dist/` 对应 JS/CSS 必须保持 byte-identical；
- Docs/Tests 必须直接 dogfood 发布用 `dist`，不得偷偷改用 source/loader 辅助运行时掩盖 release 缺陷；
- release packager 是发布便利工具，不是 Runtime 的运行依赖。

---

# 第二部分：核心架构硬规范

## 4. Single Path / One Owner

一个责任只能有一个真实 owner。

禁止同一能力同时存在：

- 第二状态机；
- 第二 open owner；
- 第二 selection/value owner；
- 第二表单值 owner；
- 第二坐标/滚动 owner；
- 第二 keyboard owner；
- 第二真实 focus owner；
- 第二动画 completion path；
- 第二 theme resolver；
- 第二 Docs/Demo runtime；
- 第二 seam/stacking system。

不同输入源可以汇聚到同一个 owner，但输入 intent 不得各自持有业务 truth。

正确模型：

```text
many intents
   ↓
one canonical owner
   ↓
one canonical state
   ↓
many projections
```

## 5. Source、Reason 与 Emitter

交互 detail 中：

- `source` 表示真实输入来源或上游来源；
- `reason` / `emitter` 表示业务动作语义。

禁止用 `confirm`、`preset`、`page-size`、组件名等业务词覆盖真实 `source`。

原生 action 的 `click` 来源统一通过 canonical activation-source primitive 推导。组合层转发事件时必须保留上游 `detail.source`，不得二次猜测。

## 6. Zero Legacy

Canonical API/DOM/owner 完成迁移后：

- 删除旧 alias；
- 删除 fallback option；
- 删除旧 DOM marker；
- 删除兼容转发；
- 删除双格式输入；
- 删除隐藏备用路径。

禁止“新 API + 旧实现”长期并存。

Gate 不得一边要求 legacy fail-fast，一边又把 legacy 当正向 fixture。

## 7. Extend Owner First, Otherwise Rebuild

新增能力优先扩展真实 owner。

若旧 owner 无法正确承载新责任：

1. 重构 owner；
2. 迁移全部消费者；
3. 删除旧路径；
4. 更新 Docs/Gate；
5. 再提交新能力。

禁止用 adapter、wrapper、companion object 或尾部 patch 回避 owner 重构并形成双链路。

## 8. Native Semantics First

承担普通 activation 的独立交互节点必须优先使用原生语义：

- Button → `<button type="button">`
- checkbox → `<input type="checkbox">`
- radio → `<input type="radio">`
- authored editor → 原生 input/textarea/contenteditable

禁止用 `div/span + tabIndex + click/keydown` 冒充可直接使用 native primitive 的控件。

原生 action 的业务 mutation 最终必须经过其 native activation 语义。`pointerdown` 可用于 press/repeat 前置 intent，但不得成为唯一 mutation 入口并吞掉后续 click。

当一个视觉 item 同时存在“主操作 + close/remove 次操作”时，使用稳定 wrapper + 同级 native action，不得通过伪按钮绕开合法 DOM 结构。

---

# 第三部分：Core Infrastructure

## 9. CoreRegistry

CoreRegistry 只负责已加载能力的注册、查询、依赖断言。

它不得：

- 自动请求脚本；
- 猜测缺失依赖；
- 隐式装载模块；
- 变成第二 Loader。

## 10. Events

通用 emitter 只提供 observer 机械能力。

除非有真实跨组件重复证据，否则不得为了“统一”预先创建拥有取消、变换、异常语义的 Generic HookBus。

## 11. Lifecycle

生命周期 scope 必须：

- cleanup LIFO；
- 重复 dispose 安全；
- 单个 cleanup 异常不阻断其他资源释放；
- destroy 后资源计数能回到基线。

组件不得绕过 Lifecycle 私自留下 document listener、observer、timer、RAF 或 portal resource。

## 12. Scheduler

`Core.Scheduler` 是 framework timing primitive owner。

必须：

- 同一 logical scheduler 合并重复 frame request；
- 多个 logical scheduler 可共享 browser RAF hub；
- one-shot delay 使用 canonical delay scheduler；
- 组件不得重新创建私有 RAF/timer 基础设施；
- custom backend 只能在明确测试/宿主边界内独立。

## 13. Core.DOM

`Core.DOM` 只包含无业务状态的 DOM primitive。

真实 DOM focus 写入统一通过：

```text
Core.DOM.focusElement(node, options)
```

默认应避免意外滚动。

`focusElement()` 只执行一次显式 target 的 DOM focus，不决定：

- active item；
- focus owner；
- capture/restore；
- focus trap；
- virtual key。

这些分别属于 FocusManager、KeyboardNavigation、Business Domain。

全库源码 Gate 必须扫描 native `.focus()`，除明确允许的 component-to-component 语义 API 外，不得在 canonical primitive 外直接写 DOM focus。

## 14. ScrollVisibility

普通 DOM 元素滚动可见性的唯一几何 owner 是 `Core.ScrollVisibility`。

规则：

- `calculateElementScroll(owner,target,options)` 只计算；
- `ensureVisible(owner,target,options)` 只写显式 owner；
- 公共层不得猜 scroll ancestor；
- 禁止 fallback 到 `element.scrollIntoView()`、document 或 window；
- List/Menu/Table/Scroll 等普通 DOM 复用此能力；
- Virtualizer 保持 index-based `ensureVisible(index)`，因为目标节点可能未 mount。

直接 `scrollTop/scrollLeft` 写入只允许出现在明确滚动 owner 内，如 Scroll/ScrollVisibility/Virtualizer/Notice viewport anchor/Sort drag auto-scroll。

## 15. LogicalOwnership

LogicalOwnership 只解决 Portal/Popup 打断真实 DOM 父子关系后的逻辑 owner tree 与事件传播。

它不得决定：

- keyboard policy；
- pointer/hover；
- focus；
- outside-click；
- selection/open/value。

KeyboardNavigation、EventDelegation 与具体业务 owner 继续分别负责这些能力。

## 16. PerformanceDiagnostics

PerformanceDiagnostics 只统计 QXFRAME9A7C2 自有 Scheduler/Lifecycle/DOM 等资源，不得伪装成浏览器 CPU/Memory profiler。

---

# 第四部分：Motion / Presence

## 17. MotionCore、Transition、TransitionGroup

职责冻结为：

```text
Transition        -> 单节点 semantic presence
TransitionGroup   -> keyed child presence + move continuity
MotionCore        -> interruption/reversal/completion/deadline/cleanup runtime
Core.Scheduler    -> frame/delay primitive
```

First-party component 依赖 `Transition` / `TransitionGroup`，不得直接把 MotionCore 当 public component API。

## 18. Transition 规则

Transition 只拥有 appear/enter/leave physical presence。

它不得拥有：

- 业务 open；
- value/selection；
- popup position；
- layout 数据；
- records/order。

生命周期状态保存在 JavaScript，不把 `status/step/generation` 等私有状态泄漏为 `data-*` 事实源。

Interrupted enter/leave 必须从当前视觉状态反转同一生命周期，不创建第二 element/第二 completion owner。

Reduced motion 与 `Core.Config.motion` 必须汇聚到同一 completion policy；禁止视觉已结束但逻辑 timer 仍等待。

Completion 必须基于真实 CSS transition/animation horizon 或显式 duration contract；不得用拍脑袋 timer 猜结束。

## 19. TransitionGroup 规则

业务层仍拥有 items/keys/logical order，TransitionGroup 只拥有：

- removed key 的 physical leave retention；
- same-key leave reversal；
- keyed DOM projection；
- stable child FLIP move。

FLIP transient transform 只能有一个 owner。entering/leaving child 不参与稳定 reorder move。

Duplicate key、key identity replacement、非法 rebinding 必须 fail-fast。

## 20. Motion 适用边界

统一 Presence 用于 Tooltip/Popover/Dropdown/Select/Picker/Modal/Drawer/ImagePreview/Loading/Notice 等出现消失 surface。

以下不机械强制进入 Transition：

- Carousel continuous motion；
- native Scroll；
- drag/resize；
- Slider/Progress 连续值；
- Ripple/spinner loop；
- 纯 CSS hover/focus micro-interaction。

---

# 第五部分：Trigger / Floating / Overlay

## 21. Trigger Owner

Triggered popup 的 logical open 唯一 owner 是 Trigger。

TriggerInteraction 只解释：

- click；
- hover；
- focus；
- contextmenu；
- delays。

它只产生 intent，不保存第二份 open。

Select、Autocomplete、TreeSelect、Cascader、Picker、Dropdown、Popover 等 consumer 必须转发 canonical Trigger policy，不得在组件层复制开关状态机。

## 22. OverlayRuntime

OverlayRuntime 只拥有 physical overlay resources：

- Portal；
- Position；
- DismissableLayer；
- Layer；
- Focus；
- ScrollLock。

PopupSurface 只投影 DOM visible/hidden/render，不保存第二状态。

Logical close 与 physical leave 必须分离：

```text
close logical open
→ keep physical presence during leave
→ leave complete
→ teardown physical resource
```

Re-enter 必须复用/反转同一 Transition，不建立第二节点。

## 23. Portal Theme Context

Portal 跨出 reference 祖先树后，OverlayRuntime 同时负责 inherited public theme context 的 physical projection。

必须：

- 找到 reference 最近 Light/Dark boundary；
- 桥接相对 portalContainer 不同的 public `--qxframe9a7c2-*` computed values；
- 跟随 reference/ancestor class/style/theme 属性变化；
- 允许更内层显式 surface boundary 覆盖 transport context；
- 不让每个 popup component 复制自己的 theme resolver。

Floating 节点最终需要的 private resolved channel 必须在被 transport 的节点或 portal ancestor 上成立，不能只依赖原 reference 树继承。

## 24. Floating Geometry

Popup placement/strategy/middleware/flip/match-width/autoUpdate/destroy-policy 等动态参数必须更新同一个 Trigger/Floating owner。

默认 main-axis offset：

- 无 arrow：`8px`
- 有 arrow：`12px`
- 调用方显式 offset 永远优先。

Portal DOM 位置不得被当成 open/focus/validation/group state 的事实来源；需要的状态必须由 owner 投影回 root/GroupItem。

## 25. Overlay Layer

Overlay/layer z-index 由统一 Layer/Overlay owner 管理。组件不得私自创建跨组件 z-index 王国。

局部 stacking 数字可以是 private implementation detail，但不建立 public token，也不成为业务状态 owner。

---

# 第六部分：Focus / Keyboard / Virtual Focus

## 26. 总模型：Single Real Focus

Composite Widget 的 Navigation Mode 统一遵循：

```text
1 Real DOM Focus Owner
+
1 KeyboardNavigation Owner
+
0/1 Virtual Focus Target
```

真实 DOM Focus 决定“键盘输入进入哪个组件”。

Virtual Focus 决定“组件内部当前操作哪一项”。

Business Domain 决定“下一步去哪”。

Scroll Owner 决定“怎样让目标可见”。

内部 option/tree node/tag/menu item/calendar cell/wheel item/JSON node/grid cell 不得因为方向键导航直接调用 `HTMLElement.focus()`。

## 27. Focus Owner 边界

### FocusManager

只负责真实 DOM focus 生命周期：

- focus capture/restore；
- modal/focus trap；
- activeElement 管理；
- 将具体 focus 写入委托给 `Core.DOM.focusElement()`。

### KeyboardNavigation

负责：

- 一个 composite 的 keyboard event root；
- native editing guard；
- composition guard；
- keyboard/pointer modality；
- common key intent；
- VirtualFocusController。

### VirtualFocusController

只负责：

- domain 注册/注销；
- `domain + key` identity；
- `.is-keyboard-focus` 投影；
- modality；
- ensureVisible 调度；
- reconcile/refresh。

### Business Domain

List/Tree/Tags/Cascader/Calendar/Wheel/Color/Menu/JSON/Table 等继续拥有具体业务导航算法。

VirtualFocusController 不得知道 Tree expand、Cascader column、Tag delete、Calendar date arithmetic 等业务语义。

## 28. VirtualFocus 硬约束

VirtualFocus 禁止：

- 调用 `HTMLElement.focus()`；
- 创建 `tabIndex >= 0`；
- 用 HTMLElement 作为 identity；
- 保存 selected/value/current/expanded 等业务 truth；
- 决定业务导航算法；
- 依赖 DOM attr 才能运行；
- 每次移动触发 full render。

VirtualFocus 可以：

- 保存 `domain + key`；
- 保存 reason/modality；
- resolve 当前 DOM projection；
- 投影 `.is-keyboard-focus`；
- 调用 domain ensureVisible；
- 在数据/DOM 重建后 reconcile/refresh。

## 29. Navigation Mode

一个逻辑 composite 原则上只在页面 Tab 顺序出现一次。

典型 real focus owner：

- Select/Autocomplete/TreeSelect/Cascader/Picker → Control/input；
- Dropdown → authored trigger；
- Menu/Tree/JSON Viewer → composite root；
- hosted Tags → host Control/input；
- standalone Tags → Tags root。

Popup 打开后 Arrow 导航不得把 `document.activeElement` 移进 popup。

删除/重投影 hosted 内部节点时不得主动 focus sibling/root；只有明确 Hybrid Edit restore 才允许恢复真实 focus。

## 30. Hybrid Edit Mode

真正需要 native caret/selection/IME 的场景可临时 handoff real focus：

- JSON primitive editor；
- Table cell authored editor；
- Color text editor；
- standalone Tags add/edit input。

规则：

- editor 不成为第二个常驻 Tab stop；
- transaction 结束后返回 canonical real-focus owner；
- 恢复原 virtual key；
- runtime option toggle 不替换 root/owner；
- draft 不成为第二业务数据 owner。

## 31. `.is-keyboard-focus` 与 Modality

统一视觉 class：

```css
.is-keyboard-focus
```

规则：

- 一个 composite 同时最多一个；
- 只在 keyboard modality 显示；
- pointerdown 立即隐藏；
- pointer 可改变业务 active/current，但不得伪造 keyboard-focus visual；
- selected、active/current、hover、keyboard focus 是独立状态；
- 组件不得自己 add/remove 此 class，必须由 VirtualFocusController 独占。

同一个 Document 的 pointer modality listener 应共享；每个 composite 仍保存自己的 modality/virtual key，不形成全局业务状态。

## 32. Native Text Editing Guard

KeyboardNavigation 必须优先保护：

- IME composition；
- Ctrl/Meta/Alt 原生组合键；
- input/textarea caret Left/Right；
- selection range；
- Home/End 文本语义；
- Backspace/Delete 的文本删除语义。

composition 期间禁止把 Enter/Arrow 解读成 Select/Tree/Tags/Create 行为。

## 33. Left / Right 仲裁

优先级固定：

```text
Native Text Editing
→ Executable Structural Action
→ Hosted Tags Virtual Navigation
→ No-op
```

TreeSelect hosted Tree：

- Right 仅在 `collapsed + hasChildren` 时 expand；
- Left 仅在 `expanded + hasChildren` 时 collapse；
- leaf 或无可执行结构动作时不得空消费按键。

Cascader：

- Right 仅在可产生下一列时进入；
- Left 仅在当前列可返回时返回；
- 无结构动作再回退 Tags/input。

## 34. Up / Down / Home / End / Page

Popup open 时：

- Up/Down 移动 popup virtual cursor；
- Home/End 在非 editable 场景移动 first/last；
- hosted Tags 永不消费 Home/End；
- PageUp/PageDown 由 domain 定义 page 语义。

真实 DOM focus 保持不变。

## 35. Enter / Escape / Tab

Enter：

- popup closed → open；
- popup open + active virtual target → activate/select；
- creatable 只有在无更高优先级 action、输入合法时 create；
- typing/search 本身不得自动制造 active option cursor。

Escape：

1. popup open → close；
2. popup closed + local virtual mode → clear local virtual mode；
3. 否则 no-op。

Tab / Shift+Tab：

- 永远退出整个 composite；
- 不自动选择 virtual item；
- 不在 framework-owned option/tag/clear/toggle/footer action 内循环；
- 关闭 popup；
- 继续 authored DOM 原生 Tab 顺序。

## 36. Multi Region / F6

同一 composite 存在多个明显分区的 framework navigation/edit region 时：

- `F6` → 下一个 region；
- `Shift+F6` → 上一个 region；
- 默认只切 virtual domain，不移动 real focus；
- 必须 native edit 时可临时进入 Hybrid Edit；
- 再次 F6、Escape、commit/cancel 后返回 canonical owner。

禁止把 F6 滥用成通用焦点遍历。

## 37. Popup System DOM 的 Tab Contract

framework-owned navigation/action DOM 默认不进入页面 Tab 顺序：

- option/tree/menu item；
- calendar cell；
- wheel item；
- hosted tag/remove；
- composite clear/toggle；
- picker framework confirm/cancel/Now 等。

不得递归改写 user-provided footer/panelRender 的 authored interactive DOM。

## 38. Ensure Visible

Virtual Focus 的完整合同：

```text
Domain/Key State
+ Keyboard Visual Projection
+ Domain-owned Ensure Visible
+ Data Reconciliation
```

普通 List/Tree/Menu/Tags 默认 `nearest`：

- 完全可见 → 不滚；
- 越界 → 只滚必要距离；
- 不默认 center；
- 不默认 smooth。

只能滚 domain 自己的 scroll owner。

Virtualized target identity 必须是 key：

```text
key
→ domain resolve index
→ Virtualizer scrollToIndex
→ render window
→ VirtualFocus.refresh
→ resolve mounted DOM
→ project .is-keyboard-focus
```

Measured/variable-size 第一次定位可用 estimate；真实测量后最多进行一次 keyboard transaction 所属的 nearest correction，随后立即清除 pending correction。

Manual wheel/touch/scrollbar drag 不得被 stale virtual key 拉回。

## 39. Reconcile

数据变化后 virtual key 必须合法化：

- Option 被过滤/删除 → nearest enabled / null；
- Tree node 被 collapse 隐藏 → 合法 ancestor；
- Tree node 删除 → nearest visible；
- Tags active tag 删除 → previous → next → null/input；
- async/filter 后禁止悬空 key。

## 40. Virtual Focus Performance

正常移动只允许：

```text
old target  - .is-keyboard-focus
new target  + .is-keyboard-focus
optional minimal scroll/window update
```

禁止 full render。

大数据 owner 必须维护 key/value/index cache，键盘移动/reconcile/ensureVisible 不得每次线性扫描上千行。

Virtualizer 一批 mount/recycle 完成后只 refresh 一次 virtual focus，禁止逐 row refresh。

## 41. JSON Hybrid Edit

JSON Viewer/Editor 必须：

- root 是唯一常驻 real-focus owner；
- Tree 是 hierarchy/visible projection/Virtualizer owner；
- editor 固定非 Tab stop，只在 Hybrid Edit transaction 临时获得 focus；
- identity 使用 canonical path/key，不保存 row/editor HTMLElement；
- Enter/F2 进入编辑；
- 非 IME Enter commit；
- Escape rollback；
- Tab 原生退出 composite；
- invalid draft 留在 editor，不污染 canonical data；
- `setData()`、editable/readOnly toggle 不替换 root/Tree/Virtualizer/KeyboardNavigation owner。

## 42. Table Hybrid Navigation/Edit

`keyboardNavigation:true` 时：

- Table wrap 是唯一常驻 real-focus owner；
- cell/header/pager framework action 不新增 Tab stop；
- virtual identity = stable row key + logical column；
- Arrow/Home/End/Page 只改 logical identity；
- 只有显式 `column.getEditTarget()` 声明的 authored editor 可进入 Hybrid Edit；
- virtual row 继续使用同一个 Table Virtualizer；
- runtime keyboardNavigation toggle 只原地 create/destroy KeyboardNavigation owner；
- 禁止新增 DataGrid facade 或第二套 Table navigation/edit owner。

---

# 第七部分：Control / Form / Native Field

## 43. Control 的职责

Control 是：

- field shell；
- visual projection；
- FormBridge facade。

Control 不是业务 value owner。

NumericInput、Selection、ValueDraft、SegmentedInput、TokenInput 等继续拥有自己的解析/选择/draft/commit 状态。

## 44. `formField` 唯一原生表单入口

`formField` 可为 `<input> / <textarea> / <select>`。

规则：

- authored field 保留同一 DOM 节点；
- Runtime 期间可隐藏；
- 不删除、不替换；
- 通过共享 FormFieldAdapter 取值/赋值；
- 旧 `nameInput` 等 alias 不保留兼容。

可见 UI 可以是 fake/composite：

- OTP segments；
- Tags + search；
- Picker display；
- formatted numeric field。

只有 committed canonical value 进入 native bridge。

## 45. Carrier Ownership

无 authored formField、只有 `name` 时，Control/FormBridge 或 standalone value owner 才创建 hidden carrier。

Hosted Tags 不得再创建第二份 carrier。

多值提交必须保持浏览器同名字段语义：

- 主 carrier 保存第一项；
- 其余值使用同名 hidden inputs；
- `FormData.getAll(name)` 保持原生结果。

## 46. 初始化与同步

初始化优先级：

```text
explicit JS option
> authored field property/attribute
> component default
```

通用 native field 语义由共享 bridge/adapter 处理：

- name；
- value；
- disabled；
- readOnly；
- required；
- placeholder；
- autocomplete；
- inputmode；
- select[multiple] selected options。

业务属性仍属于具体 component owner。

Committed change 才同步 carrier 并按 canonical 规则触发 native `input/change`；纯 projection refresh 不得伪造 change。

## 47. Reset / Destroy / Validity

`form.reset()`：

- 恢复业务 owner 的创建基线；
- 静默重投影 carrier；
- 不伪造 change。

destroy：

- 恢复 authored field 原 name/value/disabled/readOnly/required/style/selected options；
- 删除 owned extra carriers；
- 不留下 listener/observer。

dirty/touched/required/customValidity/checkValidity/reportValidity/invalid 等 field 状态保持单一 Control shell 投影。

disabled 同步到 native carrier，由浏览器决定 FormData 是否提交；readonly 保持可提交语义。

## 48. ValueDraft

Picker 的 ValueDraft 是 draft/commit/cancel 唯一 owner。

FormBridge 不得：

- 决定 draft→final；
- 改写 commit/cancel 时序；
- 把 draft 提前写入 FormData。

## 49. 扩展 Native-Field Bridge

Rate、Slider、Upload、Transfer、Sort 等 standalone value surface 必须复用统一 field-binding / native form bridge，不得各自建立隐藏表单系统。


### 49.1 Checkbox / Radio / SelectGroup Static Choice

Checkbox / Radio 坚持 **native state owner + visual indicator projection**：

- 普通 Form Checkbox/Radio 可直接使用 `<input type="checkbox|radio" class="qxframe9a7c2-form-check-input">`；
- rich/static choice 使用 `qxframe9a7c2-form-selectgroup-item > native input + qxframe9a7c2-form-selectgroup-label`；
- SelectGroup 的 native input 必须保持可访问，仅做 visually-hidden；禁止用 `display:none` 让 keyboard/focus/form semantics 消失；
- SelectGroup visual indicator 统一使用基础类 `qxframe9a7c2-form-selectgroup-indicator`；
- checkbox 类型只增加 modifier `is-checkbox`；
- radio 类型只增加 modifier `is-radio`；
- 禁止再建立 `form-selectgroup-checkbox` / `form-selectgroup-radio` 这种“元素名等于控件类型”的第二命名体系；indicator 是 projection，native input 才是 checkbox/radio 语义节点；
- indicator 只读取相邻 native input 的 `:checked / :indeterminate / :focus-visible / :disabled`，不得保存第二份 checked state；
- Tree / Item / Form / SelectGroup 的 checkbox glyph 与 radio dot 必须由 `css/qxframe9a7c2-choice.css` 单一 paint owner 提供；
- checked/indeterminate 动画、hover、focus-visible、disabled、reduced-motion 必须走同一 Choice visual contract。

推荐 rich markup：

```html
<label class="qxframe9a7c2-form-selectgroup-item">
  <input class="qxframe9a7c2-form-selectgroup-input" type="checkbox">
  <div class="qxframe9a7c2-form-selectgroup-label">
    <span class="qxframe9a7c2-form-selectgroup-indicator is-checkbox"></span>
    <span>Option</span>
  </div>
</label>
```

Radio 只需把 input type 改为 `radio`，并将 indicator modifier 从 `is-checkbox` 改为 `is-radio`。

静态扩展允许组合但不得新建 JS owner：

- Simple SelectGroup / connected segmented choice；
- icon + text；
- filled / Different style；
- Image Check / Image Check Radio；
- Color Input Check / Color Input Radio；
- Payment method；
- Project Manager / avatar card；
- title / subtitle / leading / trailing rich content。

这些模式只是 native checkbox/radio 的 label projection；表单提交、reset、radio exclusivity 与 native semantics 仍由浏览器原生 input 负责。

---

# 第八部分：Tags / Collection / Selection / Data

## 50. Tags Owner

Tags 的 tag DOM、measure、overflow、add/edit、remove projection 必须由 Tags/TokenInput owner 承担。

Control 在 `mode:'tags'` 时只 host 一个 compact Tags 实例并转发 intent/measurement input。

Select/TreeSelect/Cascader 不得各自复制：

- tag DOM；
- overflow calculation；
- Popover；
- hidden carrier；
- add/edit state。

## 51. Responsive Tags Overflow

`maxVisibleTags:'responsive'` 的：

- measuring；
- ResizeObserver；
- summary；
- hidden count；
- overflow Popover；
- keyed row identity；

全部属于 Tags owner。

单个 item mutation 只做 in-place patch；只要仍存在 hidden item，就不得 teardown/recreate disclosure infrastructure。

只有：

- hidden count = 0；
- overflow capability disabled；
- Tags destroy；

才允许 teardown。

`+N` 是 hover disclosure affordance，不得把 click/focus 建成第二 popup authority。

## 52. ItemCollection 与 Public List

`Item`/`ItemCollection` 是共享机械能力。

公开 `List` 是独立组件，不是 Select/Tree/Dropdown/Cascader/Transfer 的底层业务 owner。

其他组件可复用：

- collection；
- virtual；
- keyboard；
- rendering mechanics；

但必须用自己的业务 owner/语义 class 投影 Item。

`itemRender(item, ctx)` 固定两参数，index 通过 `ctx.index`。

Framework 更新/virtual recycle/destroy 只能清理 framework 投影 class，不得删 authored class。

## 53. Collection Frame

列表外框必须明确 `inset` 与 `flush`：

- `inset`：frame 提供 inner gutter，item 可保留 navigation radius；
- `flush`：内容贴边，frame gutter 与 item radius 同时归零。

普通 popup list 默认 inset；Cascader 等列式/分隔线贴边 surface 使用 flush。

禁止出现“内容贴边但 row 仍悬空圆角”的冲突 geometry。

## 54. Tree Native Checkbox

Tree checkbox 必须保留真实 `<input type="checkbox">` 作为 native activation / disabled / indeterminate projection surface；但 Tree 的可见框必须使用独立的 `qxframe9a7c2-tree-check-indicator`，并复用 canonical Choice paint。

Tree DOM 结构遵循：

```text
Tree check wrapper
├─ native checkbox（透明覆盖命中区域，tabIndex=-1）
└─ visual checkbox indicator（hidden-state，pointer-events:none）
```

Tree 只投影：

- checked；
- indeterminate；
- disabled。

visual indicator 不保存状态；native checkbox 也不成为业务 checked truth owner。真实 checked truth 仍属于 canonical Selection。

Pointer 必须命中真实 native checkbox，再由 click 发送 command；next checked 由 canonical Selection 当前状态推导，禁止用捕获阶段瞬态 `input.checked` 作为业务 truth。不得让 visual indicator 或 row 本身成为第二 checkbox activation owner。

## 55. Tree Hierarchical Selection

非 `checkStrictly`：

- parent check 向可勾选 descendants 传播；
- 部分 descendants checked → parent indeterminate；
- uncheck 必须先移除目标、后代及已 checked ancestors，再自底向上 normalize；
- 祖先 key 不得继续把刚取消的后代补回。

Tree row selection 与 checkbox checked 是独立交互。

multiple 模式下 pointer checked 必须由真实 checkbox 进入；不得让 row/label/空白同时成为第二 checked owner。

## 56. TreeSelect Multiple

TreeSelect `multiple:true` 必须直接复用 Tree hierarchical checked Selection。

`checkedStrategy` 只决定对外：

- value；
- FormData；
- tag projection。

不得创建第二套平面 multiple Selection。

## 57. Transfer Capability

Transfer operation Button 的 native `disabled` 必须由实时 command capability 推导。

没有真实可移动 selected item、处于边界或无可移动间隙时必须立即 disabled。

disabled visual 必须使用共享 Button disabled contract，不得只在业务层静默拒绝。

## 58. Calendar / PeriodPanel Shared Chrome

Calendar 与 PeriodPanel 可保留不同 selection/lifecycle owner，但同性质 date-panel chrome 必须共享：

- shell；
- header；
- title；
- navigation button；
- common geometry/state projection。

业务 grid 差异继续各自拥有。

## 59. Table / JSON Projection

Table 继续由单一 TableModel/Virtualizer/Selection/keyboard path 承担行为。

Docs 要测试 fixed column shadow 时必须制造真实 horizontal overflow。

JSON 是 code-reader projection；hierarchy/expand/virtualization 继续由 canonical Tree owner 承担。

JSON hierarchy line 必须可读；expanded/open 不得误继承 navigation Tree 的选中/背景视觉。

---

# 第九部分：Button / Ripple / Component 特殊合同

## 60. Button Variant

Button canonical variant：

- solid
- outlined
- dashed
- filled
- plain
- text
- link

Variant 是视觉轴，不创建第二 interaction/state owner。

Button Color Axis 继续消费现有 QXFRAME semantic/seed accent contract，不为 Button 单独发明第二主题色系统。

## 61. Button State Resolver

Button style state 解析必须显式处理 native 与 forced state，并保证 terminal state 不泄漏低优先级视觉。

长期优先关系：

```text
normal
< :hover
< .is-hover
< .is-focus
< :focus-visible
< :active
< .is-active
< .is-loading
< :disabled
< .is-disabled
```

说明：

- ordinary `:focus` 不拥有 Button visual；
- `.is-focus` 提供 focus surface，但不伪造 keyboard outer ring；
- `:focus-visible` 使用 focus surface + canonical keyboard ring；
- loading/disabled 必须压制 hover/active 泄漏；
- 不得使用 `pointer-events:none` 代替真实 capability owner；
- style priority 与 overlap paint/z-index priority 是两套正交解析，禁止混为一条 selector precedence。

## 62. Button Paint Priority

Connected/overlap 场景下 Button 自身拥有 paint priority。

Composition 不得再通过 ButtonGroup child hover/focus/active z-index 复制第二套 state stack。

具体数字是 private implementation detail；长期顺序保持：

```text
normal
< loading
< disabled projections
< hover
< focus
< active
```

native/forced pair 中更强、更新鲜的交互态必须位于对应静态态之上，同时 terminal visual 仍由 style resolver 保证。

## 63. Text / Link Geometry

Standalone Text/Link：

- physical border width = 0；
- Text 仍保持正常 Button control height 与 inline padding；
- Text 不回退成只包 glyph 的超小 hit area；
- Link 保持 inline-like/compact 的语义；
- Link underline 仅出现在允许的 hover/active；
- loading/disabled 必须明确去除 underline。

Connected ButtonGroup 内为保证 1px overlap geometry，可使用透明 border shell；该 border 只服务 composition geometry，不得重新变成视觉边框 owner。

## 64. Button Shadow

Shadow 继续是 opt-in API。

Shadow 只负责 elevation，不拥有：

- border；
- separator；
- group seam；
- state truth。

plain/text/link 默认不通过 elevation 模拟交互状态。

## 65. ButtonGroup

ButtonGroup 是纯 CSS Composition。

它只拥有：

- seam；
- logical overlap；
- radius；
- horizontal/vertical geometry。

它不得拥有 Button：

- hover；
- focus；
- active；
- loading；
- disabled；
- paint priority；
- color。

每个 Button 保留自己的真实边界，connected 通过 logical negative overlap 解决 seam。

## 66. Ripple 唯一 Owner

`Components.Ripple` 是 wave/ripple 唯一 owner。

Button 不实现第二 ripple system。

`.is-ripple` 是 declarative activation class，内部仍解析到 canonical Ripple enhancer。

## 67. `.is-ripple` Auto Enhance

必须支持：

- 初始 authored DOM 自动扫描；
- dynamic insertion 自动 enhance；
- runtime 添加 `.is-ripple` 自动 enhance；
- runtime 移除 `.is-ripple` 时，仅销毁 auto-owned instance；
- DOM subtree 被移除时清理 auto-owned instance；
- 预先 manual-enhanced 的 instance 不因 declarative class add/remove 被销毁。

Button module 对 Ripple 的依赖必须通过 Runtime Manifest 明确声明。

Public Ripple API 不为了 auto-enhance 增加第二套公开 auto API。

## 68. Ripple Inside / Outside Mode

Declarative contract：

```text
.is-ripple
    默认 inside-only

.is-ripple.is-ripple-inside
    explicit inside-only

.is-ripple.is-ripple-outside
    outside-only

.is-ripple.is-ripple-inside.is-ripple-outside
    inside + outside
```

规则：

- `.is-ripple` 始终是 activation class；
- `is-ripple-inside/outside` 只是 modifier，不能单独触发 auto enhance；
- plain `.is-ripple` 保持 inside-only 兼容语义；
- runtime mode class 切换必须对同一个 auto-owned Ripple instance 调用 `updateOptions()`；
- 禁止为模式切换 destroy/recreate instance；
- manually enhanced instance 保持 manual ownership，不被 declarative modifier 强制改写；
- loading/disabled Button 可以仍是 Ripple host，但不得产生 wave。

## 69. Notice

Message/Notification 共享 Notice foundation，不复制：

- records；
- order；
- geometry；
- timer；
- scroll owner。

Notice viewport 是 shadow/scroll gutter 唯一 owner；stack 不重复 padding/扣宽度。

Collapse 时只允许修正已经超出 collapsed 合法范围的 obsolete scroll offset；仍然 range-valid 的 reader-owned offset 必须保留。

Notice transition/presence 不得破坏 records/order/native scrolling ownership。

## 70. Icon

Icon 只有一个 public runtime owner。

组件状态图标、Docs 操作图标、外链/方向/装饰 glyph 必须 dogfood canonical Icon；不得用 `✓ / ! / × / i / ← / → / ↗ / ★` 等字符代替真正 UI icon。

字符只有在确实是文本内容时才允许保留。

---

# 第十部分：整体视觉系统

## 71. Canonical Visual Cascade

全库视觉解析链固定为：

```text
Primitive / Preset
→ Light / Dark private mode preset
→ Simple Theme Seed / public Semantic override
→ Family resolver + Size Recipe
→ private resolved channels
→ Component CSS
→ narrow State/context override
→ Composition geometry
```

Component CSS 不得跳过 resolver 链直接建立平行 theme/state 系统。

## 72. Cascade Layer

Framework layer order冻结为：

```css
@layer qxframe9a7c2.reset,
       qxframe9a7c2.primitive,
       qxframe9a7c2.theme,
       qxframe9a7c2.family,
       qxframe9a7c2.component,
       qxframe9a7c2.state,
       qxframe9a7c2.composition;
```

职责：

- reset：reset only；
- primitive：基础 preset；
- theme：mode/theme/semantic resolve；
- family：family + size resolve；
- component：component visual；
- state：仅承载必须压过复杂结构 selector 的 narrow state/context owner；
- composition：跨组件 geometry。

`state` 不得变成第二 component skin。

外部用户 Theme CSS 可保持 unlayered，以正常 cascade 覆盖 framework layered public slots，无需 selector 升级。

## 73. Specificity 规则

Production CSS：

- 禁止 `:where()`；
- 禁止 duplicate-class specificity trick；
- 禁止常规 `!important`；
- `:is()` 不追求机械归零。

只有在匹配语义、specificity、source-order/cascade 完全可证明等价时才展开/合并 selector。

若展开会：

- 改变 specificity；
- 改变结构 grammar；
- 造成病态 Cartesian growth；
- 破坏 Icon canonical source/order；

则保留原结构。

“统计数量更小”不得优先于正确 cascade。

## 74. Duplicate CSS Rule 处理

允许合并的前提是：

- selector+declaration 语义完全相同；
- source order 不承担优先级；
- 不涉及受保护 canonical compatibility mapping；
- 合并后 specificity/cascade 不变。

非相邻相同 body 不得仅因“看起来重复”机械 regroup，因为移动规则可能改变 source-order。

## 75. Token 层级

Token 分层：

1. Primitive / Preset — internal
2. Theme Seed — public recommended
3. Semantic — public advanced
4. Family — public expert
5. Component — public exception
6. Private resolved / layout var — internal

Component Token 不是“每个组件都必须有”的形式要求。

## 76. Public Override 与 Private Resolved

Public `--qxframe9a7c2-*` 是 override slot。

First-party Component CSS 默认消费 private `--_qxframe9a7c2-*` resolved channel，而不是直接消费 Theme/Semantic/Family public slot。

原因：

- public slot 负责用户 override；
- resolver 负责 fallback/mode/state；
- private channel 负责 component 最终视觉值。

禁止组件本体重复声明同名 public token，把祖先 override 截断。

## 77. Theme Seed 与 Color Mix

推荐 Theme 输入是单 seed：

- primary；
- success/warning/error/info；
- base；
- named color seed；
- font；
- radius。

色彩 mixing 只能在 theme intermediate layer 发生。

组件层不得重新执行 Grey + Primary 混色或再造独立 neutral palette。

Primary 13-tone、Neutral/MIX、Semantic、Family 的解析必须保持单向依赖，禁止循环 fallback。

## 78. Stable Design Value Gate

Component CSS 中稳定设计决策必须进入视觉系统：

- color/background；
- border/radius；
- shadow；
- spacing；
- font；
- icon size；
- motion duration。

结构/算法常量不机械 token 化，例如：

- `50%`；
- 局部 stacking step；
- transform centering；
- seam `-1px`；
- 与 DOM geometry 直接相关的计算值。

判断标准是：

> 禁止稳定设计决策脱离 Token 系统，而不是禁止 CSS 出现数字。

## 79. Token Promotion / Demotion

优先顺序：

```text
Semantic 能表达 → Semantic
否则 Family 能表达 → Family
否则稳定且组件独有、用户有独立覆盖需求 → Public Component Token
否则 → Private resolved/internal var
```

重复组件语义应上提 Family。

长期仅为 Family alias 的 Component Token 应降级或删除。

## 80. Headless / Layout / Static Token 策略

- Portal/FocusTrap/Presence/Observer/Virtual 等 headless 不建立视觉 Component Token；
- Grid/Flex/Stack/Space/Container 等 layout primitive 使用 API/internal layout var；
- Icon 默认 `currentColor` / `1em` / caller size；
- Spinner/Divider 等轻 primitive 优先 Semantic/Family；
- 静态展示组件消费 Token，但不为形式完整机械创建 Component Token；
- InputGroup/ButtonGroup 是 composition owner，不复制子组件 color/state token。

## 81. Size Recipe

`sm/md/lg` 必须是完整 recipe，而不是零散高度变量。

同一 Control size 一起解析：

- height；
- padding-inline；
- font-size；
- icon-size；
- gap；
- radius；
- border-width；
- line-height；
- box-sizing。

组件只声明 size intent，最终消费 resolved private size vars。

Connected group 默认统一 size。mixed size 必须显式 opt-in 并进入视觉 Gate。

## 82. Capability Matrix

Capability 与 visual state 分离。

### disabled

通常：

- 不可 mutate/open/clear；
- native carrier disabled；
- 不进入 FormData；
- suppress hover/active/open visual。

### readonly

通常：

- 可 focus；
- 可选择/复制；
- 可提交；
- 不可 mutation/clear；
- 是否允许 popup inspect/open 由具体 owner 定义。

### loading

区分：

- visual loading；
- blocking loading。

禁止简单把 loading 等同 disabled。

内部能力至少应能表达：

```text
canFocus
canMutate
canOpen
canClear
canSubmit
```

CSS 不得用 `pointer-events:none` 自行发明 capability。

## 83. State Resolver

状态轴正交：

```text
Capability : enabled / readonly / disabled / busy
Pointer    : hover / active
Focus      : focused / focus-visible
Validation : invalid / warning / success
Selection  : selected / checked / indeterminate
Disclosure : open / expanded
Progress   : loading
Content    : empty / has-value / placeholder
Composition: standalone / first / middle / last
```

禁止用一条总优先级覆盖所有视觉属性。

不同 channel 独立 resolve：

- bg；
- border；
- ring；
- text；
- cursor；
- shadow；
- opacity；
- z-index。

Validation 与 Focus 正交：

- invalid + focus 保留 validation border；
- focus 通过 validation ring 表达；
- focus 不得吃掉 invalid。

## 84. On-Accent Foreground

Brand/Primary solid surface 的配套 foreground 必须由共享 semantic-on-accent resolver 统一提供。

Button、Badge、Pagination、Steps、Tree、Calendar、PeriodPanel、Form 等不得各自重新判断 Light/Dark 对比色。

Status foreground 与 Primary foreground 保持独立，不互相污染。

## 85. Composition Protocol

任何可进入 InputGroup/ButtonGroup/segmented composition 的组件必须实现 Group Item Contract。

Child owner：

- bg/text/border-color；
- hover/active/focus；
- validation；
- disabled/readonly/loading；
- open；
- internal icon/spacing。

Composition owner：

- first/middle/last radius；
- border overlap；
- gap；
- connected/separated；
- addon geometry；
- horizontal/vertical；
- seam；
- neighbor stacking；
- focus/open/validation stacking。

Composition 禁止重定义 child state color。

## 86. Join Box

复杂组件必须明确真正 join box。

Composition 不默认修改组件第一个 div，也不得穿透 private DOM 结构猜测。

Select/Picker/InputNumber 等通过稳定 root contract/private projection 暴露 join target。

Portal popup 的 open/focus/invalid 必须投影回 GroupItem/root。

## 87. Composition Geometry

规则：

- logical edges：inline-start/end、block-start/end；
- connected seam 只看到一条边界；
- Group 不使用 `overflow:hidden` 换圆角；
- focus ring/shadow 不得被裁切；
- item 自己 resolve outer/inner radius；
- addon 是合法 GroupItem；
- horizontal/vertical 共用一个 composition owner。

现存 logical CSS 继续优先使用。当前产品若未开启 双向排版专项验收，不把历史 direction Gate 当发布 blocker；当前产品不支持双向排版；不要新增对应 class、selector 或运行时分支。

## 88. Environment Visual State

必须验证：

- Light；
- Dark；
- forced-colors；
- reduced-motion；
- keyboard focus-visible；
- high zoom；
- long copy/font changes。

forced-colors 下不能只靠品牌颜色区分 focus/selected/invalid/disabled。

Reduced motion 必须与 Runtime motion policy 同 owner。

---

# 第十一部分：Docs / Demo / Semantic DOM

## 89. Public API Dogfood

Docs/Demo 必须使用真实 public API 与 production Runtime。

禁止：

- docs-only fake store 替代 Runtime；
- 用静态 HTML mock 伪装业务组件；
- 为 Demo 复制第二状态机；
- 为 Demo 建第二 theme resolver；
- 为让示例好看而绕过 canonical component。

若 Demo 暴露 Runtime 缺陷，修真实 owner 并补 Gate；若 Runtime 无缺陷，只修 Demo。

## 90. Docs Runtime 来源

Docs/Tests 必须直接加载 canonical `dist` JS/CSS。

Docs 不得依赖 source runtime、Loader 隐式补模块或不同 CSS 版本才能正常工作。

## 91. Theme Playground

Theme Playground 必须：

- 消费同一 component catalog；
- 复用 canonical demo mount；
- 只写 public Theme/Semantic/Family override；
- 不复制 component DOM/state；
- 不建立第二 theme owner。

更新 badge/highlight 使用单一 catalog metadata owner；不得在 Playground、component page、nav 分别维护三份列表。

## 92. Semantic DOM Inspector

Semantic DOM 是 Docs projection，不是生产 owner。

它必须：

- 从真实 Runtime instance 获取 canonical DOM/refs；
- 对需要 open 的组件先进入真实状态再抓 snapshot；
- snapshot clone 不保留 listener；
- overlay snapshot 转换为文档内稳定展示；
- Live Demo 继续负责真实 Presence/focus/geometry；
- clone 只用于结构与样式调试。

状态 mirror 若为 direct-file/CSSOM 限制提供 docs-only fallback，必须由 canonical dist CSS 生成并限制作用域；不得变成第二 production state skin。

## 93. API 文档同步

新增/修改 public option/method/event 时，同轮必须：

- 更新 component API data；
- 更新至少一个表达边界的 demo；
- 更新 relevant Gate；
- 更新 component catalog metadata。

Public 文档类型不得用 `any/unknown/undefined` 长期占位逃避真实契约。

## 94. Docs Visual Rule

Docs chrome 也应消费 canonical semantic channel，避免“文档一套硬编码白灰、组件另一套主题”的双视觉 owner。

动效 Demo 必须尊重真实 mount/unmount、Presence owner、geometry owner 与 `whenSettled()`，禁止 completion timer 猜动画结束。

Button 的大规模视觉验收矩阵应挂在正常 Button Docs 内并使用真实 Button 节点；独立 review page 可以作为辅助证据，但不得成为唯一文档入口。

---

# 第十二部分：测试、Gate、性能与证据

## 95. Authoritative Stage Gate

每个正式 Stage 只保留一个 authoritative browser entry。

禁止：

- parallel debug-mini；
- 同阶段多个互相不一致的正统入口；
- 为新修复删除历史累计覆盖；
- 弱化断言掩盖回归。

临时诊断页只用于排查；保留证据时写入 `audit/`，不得与正式 Stage Gate 并列。

## 96. Browser Truth 与 Transport

Runtime truth 与 browser transport 必须分开。

- transport 失败不能直接判 Runtime FAIL；
- self-test 不能冒充正式 browser evidence；
- 替代 transport 只能修改 transport-specific assertion；
- 功能断言不得弱化；
- 当前环境无法真实执行时必须明确 `PENDING/BLOCKED/NOT EXECUTED`；
- 禁止伪报 PASS。

Headless/focus 测试必须保证 native focus/blur 事件 truth，不能用失焦环境误判 pointer blur/Hybrid Edit。

## 97. 静态 Gate

每轮至少维护：

- first-party JS syntax；
- test inline script syntax；
- CSS parse；
- Runtime Manifest dependency/cycle；
- protected owner/source guard；
- root/dist parity；
- release packager；
- Docs/public API parity；
- no forbidden legacy/debug entry；
- no accidental private DOM metadata；
- no forbidden direct focus/scroll path；
- no `:where()` regression；
- visual specificity/layer audit。

## 98. 功能 Browser Gate

长期至少覆盖：

### Architecture
- One Owner/Single Path；
- Zero Legacy；
- Trigger/Overlay/Transition 分工；
- FormBridge/ValueDraft；
- Collection/Selection；
- Notice；
- no private metadata leak。

### Focus
- composite 单 real Tab stop；
- popup open 不转移 activeElement；
- Arrow 改 virtual key；
- Tab 退出 composite；
- `.is-keyboard-focus` 唯一；
- pointer modality；
- IME/native editing；
- reconcile；
- virtualization ensure-visible；
- Hybrid Edit restore。

### Form
- authored formField preserve；
- multi-value FormData；
- disabled/readOnly；
- reset/destroy；
- validity；
- no draft leak。

### Popup
- logical close/physical leave；
- offset/arrow；
- Portal theme context；
- Scroll owner；
- focus/open state back-projection。

## 99. Visual Matrix

单组件适用状态至少覆盖：

- normal；
- hover；
- active；
- focus-visible；
- disabled；
- readonly；
- loading；
- invalid；
- selected/checked/indeterminate；
- open/expanded；
- empty/placeholder/has-value。

专项组合：

- disabled + hover；
- readonly + focus；
- loading + hover/focus；
- invalid + focus；
- invalid + readonly；
- open + focus。

## 100. Composition Matrix

至少覆盖：

- Input + Button；
- Select + Button；
- InputNumber + Select；
- DatePicker + addon；
- ColorPicker + Button/addon；
- Tags/OTP/Autocomplete/TreeSelect/Cascader in Group；
- enabled/disabled neighbor；
- invalid/focused neighbor；
- open Select + disabled Button；
- first/middle/last；
- connected/separated/rounded；
- horizontal/vertical；
- sm/md/lg；
- mixed-size opt-in。

重点检查：

- 1px seam；
- border owner；
- radius；
- focus ring clipping；
- shadow clipping；
- validation/focus/open stacking；
- Portal open state projection。

## 101. Button / Ripple Gate

Button 至少验证：

- 7 variants；
- normal/hover/focus-visible/active/loading/disabled；
- forced `.is-*` state；
- terminal state suppress lower state；
- Text/Link geometry；
- Link underline；
- ButtonGroup overlap；
- no ordinary `:focus` visual；
- no `pointer-events:none` capability hack。

Ripple 至少验证：

- `.is-ripple` initial auto enhance；
- dynamic insertion；
- class add/remove；
- manual ownership preservation；
- DOM removal cleanup；
- inside/outside/both mode；
- runtime modifier switching uses same instance；
- loading/disabled no wave。

## 102. Theme / CSS Gate

必须验证：

- Light/Dark；
- seed-only Simple Theme；
- Semantic override；
- Family override；
- Component exception override；
- external unlayered theme override；
- nested mode boundary；
- fallback 不为空；
- 无 var cycle；
- no large hardcoded stable design value regression；
- no token Cartesian explosion；
- no component mirror token inflation；
- no unsafe selector regroup；
- `:is()` 只在证明等价时优化。

## 103. Performance

Performance 判断不得依赖单次 duration。

Stage 09/Profiler 证据必须：

- 同 scenario；
- 多轮；
- environment/provenance 可比；
- round identity 对齐；
- Long Task 支持状态明确；
- QXFRAME resource balance 证据自洽；
- Original/QXFRAME 两侧采用同一采集协议。

Profiler 是开发证据工具，不是 production Runtime module。

一次采样不能被解释成 benchmark 结论。

## 104. Large Data Performance

Table/ItemCollection/VirtualList 等必须验证：

- virtual mode 真实启用；
- mounted rows 有界；
- focus/nav 不 full render；
- DOM state projection 有界；
- docs-only inspector 不引入病态 Long Task；
- manual scroll 不被 stale virtual-focus correction 拉回。

---

# 第十三部分：标准开发流程

## 105. Preflight

开始修改前：

1. 确认当前完整基线；
2. 读取 current truth；
3. 找到真实 owner；
4. 列出受影响消费者；
5. 确认 Runtime Manifest 依赖；
6. 检查是否已有 canonical primitive；
7. 检查是否存在历史旧路径需要删除；
8. 明确本轮 Gate；
9. 明确是否会影响 public API/Docs；
10. 明确是否会改变 source/dist fingerprints。

## 106. 实施顺序

推荐顺序：

```text
Owner contract
→ Core/Runtime owner
→ Consumer migration
→ Delete legacy path
→ Component projection
→ Visual resolver/composition
→ Docs/Demo
→ Static Gate
→ Browser Gate
→ Visual/Performance Gate
→ Build/Dist parity
→ Current-status update
→ Audit evidence
```

禁止先在 bundle 尾部 append override，再回头“找机会清理”。

生产源码必须在 canonical source block 内完成修改，然后统一重建 aggregate/dist。

## 107. 修 Bug 的原则

遇到失败时先分类：

```text
Runtime defect
? Gate defect
? Fixture defect
? Browser transport defect
? Docs-only projection defect
? Historical assertion already superseded
```

禁止默认把失败归因到 Runtime。

禁止通过：

- 恢复 legacy alias；
- 放宽 assertion；
- 改 schema 猜测；
- 隐藏 warning；
- 删除 case；
- 增加第二 state path；

来制造 PASS。

## 108. 变更原子性

一个 owner 迁移必须在同一可验收变更中做到：

- new owner ready；
- consumers migrated；
- old owner removed；
- Docs/Gate updated；
- no mixed old/new contract。

不允许发布“两个路径都暂时支持”的中间长期状态。

## 109. 证据记录

规范与证据分离：

- 本手册：规则；
- status/issues/stage report：当前事实；
- audit：分析与设计；
- evidence/artifacts：机器结果；
- README：release history。

每轮交付应清楚说明：

- 本轮完成什么；
- 当前累计完成度；
- 仍有哪些真实未完成项；
- 哪些测试实际执行；
- 哪些测试未执行。

“没有执行”必须明确写出，不得用旧 evidence 冒充 fresh PASS。

---

# 第十四部分：发布验收清单

## 110. 架构

- [ ] Single Path / One Owner 无新增双链路
- [ ] Zero Legacy 无 alias/fallback/private marker 回流
- [ ] native action/focus/form semantics 未被 fake DOM 替代
- [ ] Trigger/Overlay/Transition owner 边界正确
- [ ] Control 仍不是 business value owner
- [ ] Collection/Selection/Table/Tree/Menu/Tags owner 未复制
- [ ] private runtime metadata 未泄漏到 DOM

## 111. Focus / Navigation

- [ ] 一个 composite 只有一个常驻 real-focus owner
- [ ] popup navigation 不转移 activeElement
- [ ] VirtualFocus 使用 key identity
- [ ] `.is-keyboard-focus` 唯一且 modality 正确
- [ ] native text/IME 不被 composite 抢键
- [ ] Tab 原生退出 composite
- [ ] F6 只用于明确 multi-region
- [ ] ensureVisible 不误滚 page/outer container
- [ ] manual scroll 不被 stale correction 拉回
- [ ] JSON/Table Hybrid Edit restore 正确

## 112. Form

- [ ] authored formField 保留同一节点
- [ ] committed value 才进入 carrier
- [ ] multi-value FormData 正确
- [ ] disabled/readOnly 语义正确
- [ ] reset/destroy 恢复正确
- [ ] ValueDraft 不泄漏
- [ ] validity 投影单 owner

## 113. Visual System

- [ ] canonical cascade/layer 未破坏
- [ ] public override → private resolved 单向链路
- [ ] 无稳定设计裸值大面积回流
- [ ] 无 Component Token 镜像膨胀
- [ ] no `:where()`
- [ ] 无常规 `!important`
- [ ] `:is()` 优化不破坏 specificity
- [ ] state/capability 正交
- [ ] invalid + focus 正确
- [ ] forced-colors/reduced-motion/focus-visible 正确
- [ ] composition 不复制 child visual state

## 114. Button / Ripple

- [ ] 7 variants 正确
- [ ] terminal state 不泄漏 hover/active
- [ ] Text/Link geometry 正确
- [ ] ButtonGroup 只拥有 geometry
- [ ] `.is-ripple` auto ownership 正确
- [ ] manual Ripple 不被 declarative class 破坏
- [ ] inside/outside mode 原地更新
- [ ] loading/disabled 不产生 wave

## 115. Docs

- [ ] Docs/Tests 使用 dist
- [ ] Public API/Demo 同步
- [ ] Theme Playground 复用 canonical catalog/mount
- [ ] Semantic DOM 只是 projection
- [ ] docs-only mirror 不污染 production
- [ ] 真实交互场景由 Live Demo/Gate 承担
- [ ] 当前修改组件的 update badge 单 owner

## 116. Package / Gate

- [ ] JS syntax PASS
- [ ] CSS parse PASS
- [ ] Runtime dependency/cycle PASS
- [ ] release packager PASS
- [ ] root/dist parity PASS
- [ ] authoritative browser gate 实际执行或明确 pending
- [ ] visual/state matrix 实际执行或明确 pending
- [ ] performance/profile 若要求则使用可比证据
- [ ] 当前状态文件只写 current truth
- [ ] 历史证据没有重新混入 canonical 手册

---

# 第十五部分：文档清洗后的长期维护边界

## 117. 主手册与虚拟焦点专题

虚拟焦点的长期规则已经并入本手册“Focus / Keyboard / Virtual Focus”部分。

若项目继续保留 `QXFRAME9A7C2-虚拟焦点开发方案手册.md`，其角色应是**专题摘录/解释文档**，不得与本手册同时拥有不同版本的 normative rule。

任何冲突以本手册为准，随后同步专题摘录。

## 118. 历史 Audit 的用途

`audit/` 中大量 Stage、Repair、Validation、Reference、Closure、History 文档继续保留，但只用于：

- 追踪某条规则来源；
- 解释为什么做过某次重构；
- 保存当时 fingerprint；
- 保存 Browser/Visual/Performance evidence；
- 恢复历史上下文。

它们不再拥有新的长期规范。

## 119. 当前状态与长期规范彻底分离

Windows direct-file、Stage09 profile、某个 Browser case、某个 dist hash 是否当前 PASS，属于 current truth，不属于本手册。

本手册只规定：

- **什么情况下才可以宣称 PASS；**
- **什么证据才有效；**
- **没有执行时必须如何表达。**

## 120. 最终总纲

架构开发遵循：

```text
Single Path
+ One Owner
+ Zero Legacy
+ Native Semantics
+ Public API Dogfood
+ Browser Truth
```

交互开发遵循：

```text
Real Focus 决定输入入口
+ KeyboardNavigation 决定键盘 intent
+ VirtualFocus 决定内部目标
+ Business Domain 决定业务导航
+ Scroll Owner 决定可见性
```

视觉开发遵循：

```text
Token 决定值
+ Size Recipe 决定尺度
+ Capability 决定能不能做
+ State Resolver 决定当前怎么表现
+ Composition 决定组件怎么拼
```

发布验收遵循：

```text
Runtime Truth
+ Visual Truth
+ Form/Focus/Popup Truth
+ Docs Dogfood
+ Static/Package Integrity
+ Honest Evidence Boundary
```

**任何“看起来通过”的结果，都不能以恢复第二 owner、遗留兼容、伪造 Browser Truth、复制视觉系统或削弱 Gate 为代价。**
