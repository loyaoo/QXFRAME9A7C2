# QXFRAME9A7C2 fix(11) v5 · 1～78 章状态对照表

> 日期：2026-09-21  
> 用途：与 `FIX11-原始完整任务手册-v5.md` 配套。它不是替代原手册，而是记录当前实现对每个顶层章节的结论，防止续作时目标/边界丢失。  
> 状态定义：`Completed`=源码/contract/verify 已有明确结论；`Completed + Browser Validated`=除 Node/static contract 外，真实 Chromium 组合也已取得 PASS；`Deferred`=手册允许按真实需求以后做且不阻塞 fix(11) 核心；`Unsupported`=当前版本明确拒绝，不是假支持；`Reference`=原则/指令章节，不对应一个单独实现。

| # | 手册章节 | 当前状态 | 当前结论 / 证据 |
|---:|---|---|---|
| 1 | fix(11 总目标 | Completed + Browser Validated | Core/Interaction/CSS/verify 主线已形成；真实 Chromium 组合矩阵 PASS，证据见 R5/最终收口报告。 |
| 2 | P0 Core / Runtime / 架构 | Completed | Schema 40/40；State/Equality/Scheduler/Async/DOM/Realm/DOMProjection/Reorder/Diagnostics 均有 canonical owner 与 verify。 |
| 3 | P0 Interaction Design System | Completed + Browser Validated | Focus/Active/Selected/Hover、Tree、Slider、Press、Motion、disabled/loading 等已收口；复杂视觉组合已由 Chromium CDP smoke 验证。 |
| 4 | P1 Interaction / 组件细节 | Completed | Tabs indicator、Ripple ownership、Carousel key ownership、Overlay lifecycle/reveal/async visual 等核心 contract 已迁移/审计。 |
| 5 | P1 Core/Platform/维护能力 | Completed | Semantic precedence、FormBridge、API/d.ts、migration manifest、browser baseline、Diagnostics/InteractionDetails 均已形成。 |
| 6 | P2 需要决策/专项验证 | Completed / Deferred by contract | Shadow DOM 不承诺；strict Trusted Types CSP 不在当前 baseline；Presence 实测后只修真实 observer 浪费；Config component defaults/Virtualizer grouping 按需求延后。 |
| 7 | 高风险边界继续扫描 | Completed + Browser Validated | callback/reentrancy/async destroy/realm/updateOptions/side-effect ownership 已扫；真实浏览器 visual/IME/overlay/virtual edit 已通过 R5。 |
| 8 | 40 Component Interaction Audit | Completed + Browser Validated | 40 visible component 有 schema/state owner，Node/static contract 已覆盖；真实输入/Focus/IME/Overlay/Virtual edit 组合已通过 Chromium。 |
| 9 | Interaction Design System 10 Rules | Completed | 已落实为实现/verify 的 canonical interaction rules。 |
| 10 | fix(11 实施顺序 | Reference | A～F 已基本完成；最后剩 browser evidence + final archive/package。 |
| 11 | fix(11 最终验收结果 | Completed + Browser Validated | 自动 Release Gate 全绿；Chromium 144 组合 smoke PASS。 |
| 12 | 明确暂时不要做 | Completed | 未引入 VDOM/响应式/Fiber/SSR/Suspense/第二套 Overlay/Focus/Pointer/State。 |
| 13 | 下次对话任务指令 | Reference | 已被当前 checkpoint/续作手册取代并保留原文。 |
| 14 | 最终原则 | Completed | “一个事实/owner/数据流/恢复责任/测试/compatibility 出口”已进入 manifest/verify。 |
| 15 | v3 Stable DOM/Render/Open/Navigation 等 | Completed + Browser Validated | Table render transaction、Native Input Policy、visual proxy inert、geometry realm 等已做；真实浏览器 continuity 已通过 R5。 |
| 16 | v3 Table 专项强化计划 | Completed / Explicit boundaries | P0/P1 主能力已实现；group header/details 等不做半套。 |
| 17 | Table 历史遗留/多套实现 | Completed | mini pager/parallel reorder/ghost CSS/keepFilterPopup 等已去重。 |
| 18 | Table P0 核心能力 | Completed | Pagination/remote/projection/keyed identity/mutation/geometry/resize/reorder 已形成。 |
| 19 | Table P1 日常后台能力 | Completed / Explicit boundaries | Search/column state/toolbar/pagination/scroll/view/export/processing/events/reflow 等完成；responsive details明确 unsupported。 |
| 20 | Table P2 | Deferred | Multi-sort/SearchBuilder/Spreadsheet/重型 Editor/TreeTable 按手册明确不做。 |
| 21 | Table 性能专项 | Completed | staged projection cache、selection partial projection、geometry convergence、默认不建立 per-row permanent observer。 |
| 22 | Table 推荐能力等级 | Completed | 当前定位为中等偏完整后台 Table；不伪装 Spreadsheet/DataGrid。 |
| 23 | Table 建议 API 草案 | Completed / Adapted | remote load、column/view/export/reflow 等 API 已落地；具体实现按当前 canonical contract 调整。 |
| 24 | Table fix(11 验收矩阵 | Completed + Browser Validated | Node/static contract覆盖 data/query/columns/rows；真实 geometry/IME/overlay/virtual edit continuity 已通过 R5。 |
| 25 | fix(11 优先级更新 | Reference | 已按更新后的 P0/P1 顺序执行。 |
| 26 | Table 额外执行要求 | Completed | 不复制 Button/Input/Tooltip/Pagination；feature matrix 明确 unsupported 组合。 |
| 27 | v4 Table Contract | Completed / Explicit boundaries | Data Ownership、Event Arbitration、Edit Transaction、Structural Style、Width Solver 等均有结论。 |
| 28 | v4 Table Remote/状态恢复 | Completed | orthogonal data、request epoch、totals、remote selection、stable identity、ViewState、logical≠visible 完成。 |
| 29 | v4 Framework 长期风险 | Completed + Browser Validated | callback reentrancy/freshness/transactional update/config no-backwrite/controlled≠presentation 已收口；组合证据已由 R5 Chromium smoke 验证。 |
| 30 | v4 跨 Table/Framework Verify | Completed + Browser Validated | callback/update atomic/event isolation/resource tests进入 CI；真实 browser matrix 已 PASS。 |
| 31 | v4 Table 优先级重排 | Reference | 已按该 P0/P1 结果实施。 |
| 32 | v4 Framework 优先级 | Reference | F-P0 主项已实现。 |
| 33 | v4 Table 最终定位 | Completed | Table 不演化为第二套应用框架/DataGrid。 |
| 34 | v4 下次执行补充指令 | Reference | 已吸收到续作手册。 |
| 35 | v5 多套体系第一主线 | Completed | Canonical System Manifest + zero-consumer/compatibility exit。 |
| 36 | CSS Architecture Convergence | Completed | 11-stage source-order、token/theme/state/specificity ownership 固化。 |
| 37 | Theme Token Cascade | Completed | semantic token/cascade precedence 统一，不使用 `:where()`。 |
| 38 | Theme Context / Portal Transport | Completed | Config/ThemeContext owner统一，Menu 私有 theme resolver 删除。 |
| 39 | Theme Switch Contract | Completed | theme/config token live semantics明确。 |
| 40 | CSSCompatState / rel-* 删除 | Completed | runtime/CSS/docs consumer=0；verify禁止回归。 |
| 41 | Native Form Skin 收口 | Completed | native skin opt-in；不形成第二套组件框架。 |
| 42 | Pseudo/Projected State Ownership | Completed | state class/real pseudo ownership明确。 |
| 43 | Specificity Architecture | Completed | specificity warning=0；预算由 verify 强制。 |
| 44 | Semantic Role Classes | Completed | InputGroup/Steps/Menu/Tabs 等组合爆炸已收角色/状态类。 |
| 45 | Motion v1/v2 合并 | Completed | canonical fast/mid/slow；旧 token只兼容出口。 |
| 46 | Reduced Motion 合并 | Completed | resolved motion state + canonical tokens。 |
| 47 | !important Governance | Completed | 普通 component/state 不靠 !important 解决优先级；verify/allowlist治理。 |
| 48 | will-change 生命周期 | Completed | 动画/drag生命周期化，不常驻。 |
| 49 | Backdrop/compositing | Completed | Table 大面积 loading blur 已删除；受控小 surface 保留。 |
| 50 | Z-index Source of Truth | Completed | `src/manifests/layers.json` 生成/共享 JS+CSS，局部裸数字清零。 |
| 51 | CSS Patch Archaeology | Completed | source order 物理拆分；旧 late patch/ghost selector 清理。 |
| 52 | Compatibility Exit Contract | Completed | compatibility manifest + removedIn/migrationNote。 |
| 53 | JS 历史平行体系总表 | Completed | 已逐域建立 canonical owner。 |
| 54 | DOMFactories bridge 删除 | Completed | runtime/docs consumer=0；verify禁止回归。 |
| 55 | Dependency/Capability 单一 Manifest | Completed | defineModule 分组 capabilities；旧双声明修正。 |
| 56 | Registry 实现/语义 | Completed | 共享 registry infrastructure，语义 registry 保持独立。 |
| 57 | Theme System -> ThemeContext | Completed | 私有 theme resolver收口。 |
| 58 | CSSCompatState Runtime 删除 | Completed | consumer=0。 |
| 59 | StateController adoption 按职责 | Completed | 40 component state-ownership manifest；不机械套壳。 |
| 60 | AsyncTask/generation 全迁移 | Completed | component requestId/loadGeneration consumer=0。 |
| 61 | Style Projection 统一 | Completed | DOMProjection ownership覆盖核心临时 mutation。 |
| 62 | Press/Ripple/Pointer 收口 | Completed | Ripple只做视觉，输入由 PressInteraction。 |
| 63 | Scheduler/Timer 边界 | Completed | module bare timers/RAF 收口；NoticeClock 保留为专用 timing primitive。 |
| 64 | Programmatic Focus 入口 | Completed | instance realm/focus ownership审计完成；直接 DOM focus 不作为第二套 owner。 |
| 65 | Table Pager/Pagination 去重 | Completed | Table 复用 Pagination。 |
| 66 | Reorder 单一体系 | Completed | DOMHeadless.ReorderInteraction 是唯一通用 reorder owner。 |
| 67 | Native Form 不是第二框架 | Completed | opt-in skin + FormBridge/control contract。 |
| 68 | Empty/Loading/Form 疑似重复体系审查 | Completed | 职责边界已确认，重复 consumer 进入 verify。 |
| 69 | 正常分层（非重复体系） | Completed | manifest 中保留正常上下层职责，不为“去重”误合并。 |
| 70 | One Responsibility -> One Owner 总表 | Completed | canonical-systems manifest 38 域。 |
| 71 | Historical Parallel-System Audit 流程 | Completed | 续作流程 + manifest + zero-consumer scan 固化。 |
| 72 | CSS Verify 新规则 | Completed | specificity/selector length/group/legacy/theme/motion/z-index/ghost rules。 |
| 73 | JS Verify 新规则 | Completed | generation/realm/callback/async/reorder/hidden form/Config backwrite 等。 |
| 74 | CSS Source Order Contract | Completed | 11-stage physical source order + generated aggregate exact check。 |
| 75 | v5 优先执行顺序 | Reference | 已执行到 final release 阶段。 |
| 76 | 历史体系“删除完成定义” | Completed | canonical owner/zero consumer/runtime+CSS+docs+tests+verify+compatibility 出口均形成。 |
| 77 | 全面历史债审查清单 | Completed | 38 域 manifest + current zero-consumer scans。 |
| 78 | 最终架构原则 | Completed | 同层同责一个 owner 已成为当前实现/verify 原则。 |

---

## 最终非阻塞边界

### 1. 可选 ViewState storage adapter

状态：`Deferred / non-blocking`。核心 ViewState 已完成，按手册不把 localStorage/sessionStorage/server store 强绑到 Table core。

### 2. 明确 Unsupported

当前不应视为遗漏：

- Table grouped/complex header；
- Table automatic responsive details；
- Table overflow private tooltip/expand owner；
- Shadow DOM full composed-tree contract；
- strict Trusted Types CSP baseline；
- Table P2（multi-sort / SearchBuilder / Spreadsheet range / heavy Editor / TreeTable）。

### 3. Browser evidence

已完成：

```text
Chromium 144.0.7559.96
QX_BROWSER_REQUIRED=1 npm run verify:browser -> PASS
transport = CDP setDocumentContent + Runtime.evaluate
Diagnostics resource balance -> PASS
```

因此当前已知 mandatory blocker = **0**。

---

## 最终 release 判定

```text
Code convergence: complete against current manual decisions
Node/static verification: passed
Browser combination smoke: passed
Resource balance: passed
Deferred/unsupported: explicitly documented
Known mandatory blockers: 0
```
