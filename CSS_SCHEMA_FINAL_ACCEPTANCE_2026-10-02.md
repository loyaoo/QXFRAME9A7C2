# CSS Schema v1.6 最终验收记录

验收基线：`main@72663d3530e16b582b8891491fa8f7e8b01ccda9`。

**当前结论：NOT_ACCEPTED。不得冻结 Schema，不得以 Size Tree 候选归零替代全部验收。**

本记录是当前执行者对 CSS Schema / SCSS 的验收；任务沿用 `ASTRA-HIGH-FINAL-ACCEPTANCE` 名称，但没有把该名称当成实际模型身份。本次不宣称完成另一模型的独立架构、安全或全部组件人工视觉审计。

## 已验证的完成项

| 合同 | 证据 |
|---|---|
| 原 main 完整发行与 Pages | QXFRAME CI #1232，run `36969105888` SUCCESS |
| Size Tree | 46 节点；0 exact-node candidates；0 needs-review；36 真实断点与 1 pill sentinel 保留 |
| 禁止布局与单位 | 专用 live map：0 CSS Grid/fr，0 viewport-unit 消费者 |
| Token 图 | 1938 定义；0 cycle；94 个 Light/Dark recipe 变量对称；4 个动态无 fallback 通道有 owner |
| 模块化 | 52 个编译消费的 component/shared partial + 1 个 `_components.scss` 聚合文件，共 53 文件；3 个临时 holding 文件不存在 |
| 模块拆分历史等价 | 独立从 `33e5cf4`（拆分前）取出 ordered sources 编译，与 `72663d3` 编译 CSS 完全一致；旧 5 个模块、新 56 个模块，CSS 997588 字节（去尾换行比较） |
| 当前构建顺序 | 规范 entry 与 manifest ordered concatenation 编译完全一致；聚合 `@use` 顺序有 verifier |

`audit-css-token-migration` 的宽泛 `cssGridDeclarations` 计数会命中包含 grid 名字的自定义属性，不能作为仍存在 CSS Grid 的证据；本记录采用专用真实属性扫描结果。

## 确认的问题与处置

### SCHEMA-ACCEPT-001 — 仓库权威手册截断（本 PR 修复）

仓库同名 v1.6 文档只有 999 行，在 §12 的 Font Weight 处终止；用户本次提供的完整文档为 2750 行，包含 §§1–46。缺失章节包括运行时调色清理、公共覆盖、私有继承、局部主题、完整阶段与冻结门槛。

已将用户附带的完整内容写回原仓库路径，保持单一权威文档身份；未另造一份同名不同规则的手册。

### SCHEMA-ACCEPT-002 — 普通 control 缺少五档公共主题高度接口（未完成）

`src/styles/theme/_family.scss` 的 `.is-xs/sm/md/lg/xl` 直接把 `--_qxframe9a7c2-size-control-height` 映射为 `size-12/14/16/18/20`。`--qxframe9a7c2-theme-control-height-xs/sm/md/lg/xl` 五个公共角色均没有定义、没有消费者。

因此不能通过手册 §§1/19/20 的公共 Theme 接口重新映射普通控件五档高度。原 verifier 将 `_family.scss` 整个文件视为 Theme，无法发现公共接口缺失。

处置：保持默认 24/28/32/36/40px，补齐 Theme roles，并让私有 size recipe 消费这些角色；覆盖 root、scoped、显式 size、混合嵌套的浏览器计算样式。不能仅增加没有消费者的 alias。

### SCHEMA-ACCEPT-003 — 运行时调色清理没有完成（未完成）

对 canonical modules 排除注释后：**205 个 live `color-mix()`**，Theme 138、Component 67。示例包含 Button variant/focus/disabled、Card shadow、主题 seed/semantic/mask/focus。

这与完整版 §§15.2/39 Phase I 的“静态默认值、后续离线主题生成”收尾不一致。计数不是 205 个独立 bug；各消费者必须判断是需静态化的默认调色、明确保留的混色协议，还是领域功能常量。当前没有把这份决策与完整规范对齐的关闭证据。

处置：按颜色 role 与组件族建立消费者决策表。保留已确认 Neutral 默认 RGB、Light/Dark/状态默认视觉；不要机械删除 `color-mix()` 或照抄另一框架颜色，也不要复活 JS Theme/Token runtime。

### SCHEMA-ACCEPT-004 — 公共组件默认值在组件根重新声明（Chromium 已确认）

具体例子：`_card.scss` 的 `.qxframe9a7c2-card` 在组件根直接声明 `--qxframe9a7c2-card-skeleton-title-height`，掩盖祖先同名公共 Token 覆盖，违反 §33。

扫描得到 22 个简单根 selector 下的公共默认值候选。不是全部自动判 bug：Icon 的继承/旋转约定、Motion disabled 和实例几何通道需分类。Card title 用 Chromium 设置祖先 24px 并读取实际高度验证；已由 GitHub Actions Chromium 存档。

### SCHEMA-ACCEPT-005 — :root 公共 alias 的局部主题重计算（Chromium 已确认）

Avatar/Card 的部分公共默认 alias 只在 `:root` 绑定 Theme；CSS 自定义属性在声明元素计算后继承，局部 Theme 改值不意味着祖先 alias 重新求值。

浏览器探针分别设置局部 `theme-avatar-size-md:3.5rem` 与 `theme-space-6:2rem`，验证 Avatar 宽度和 Card padding；同时包含祖先公共 Card padding、root font-size 缩放和局部 Popup 明暗的正向对照。GitHub Actions Chromium 已确认两个局部覆盖均失败。

## 验收验证工具

- `node tools/verify-css-schema-acceptance-audit.mjs`：五个独立 mutation cases，证明缺失接口、断开的接口、live mix、公共根默认值、截断文档可被识别；注释不作为 live 消费者。
- `node tools/audit-css-schema-acceptance.mjs --browser --enforce --write=artifacts/css-schema-acceptance.json`：真正验收门槛；有确认缺口或没有浏览器证据必须非零退出。
- `.github/workflows/css-schema-acceptance.yml`：独立 PR / 手动验收 workflow，保存 Chromium 计算样式与完整消费者清单，即使验收失败也上传证据。

工具的 evidence-only 模式成功生成报告不等于验收通过；`acceptance` 字段必须明确读取。既有 release gate 未被删除、改写或放宽。

## 未签收项与进度

- 本轮 Size Tree / Grid / viewport 清理与物理拆分：实施子集 100%，保持完成。
- 完整 CSS Schema v1.6：NOT_ACCEPTED，不再给未经覆盖证据支撑的 100%。
- 本轮验收检查：100%，结论 NOT_ACCEPTED；5 类发现中手册已修复，4 类 Schema 修复尚未实施。原完整发行 CI 对新增证据工具的验证另列下方。
- 广泛 controller/内部构件/安全/跨浏览器人工视觉最终审计不因本 CSS 检查自动完成。
- 新任务必须从本记录的确认问题继续，不要重开 Phase A、已归零单位清理或 superseded PR #242/#243。

当前改动只有完整手册、验收工具与状态证据，没有改变组件样式、值、键盘、定位、Motion 或发行 API。

## GitHub Chromium 实测证据

测试提交：`0dcfc4e369c0f8511000f5c2a45a72ed8bf782ae`（PR #245）；GitHub PR merge checkout `aa24962cf8bc5e39a0f0df3e09f227a2f27a7ca8`。

CSS Schema Acceptance #3 / run `36970814333`：FAILURE，由 `--enforce` 正确拒绝现有 Schema 缺口；detector 自测 SUCCESS，证据 artifact 上传 SUCCESS，artifact ID `11211931251`。浏览器 HeadlessChrome/154.0.0.0。

| 探针 | 预期 | 实测 | 结果 |
|---|---:|---:|---|
| 默认 md control height | 32px | 32px | PASS |
| 默认 Card body padding | 12px | 12px | PASS |
| 后加载普通主题 control-height-md | 52px | 32px | FAIL |
| 祖先公共 Card skeleton title height | 24px | 16px | FAIL |
| 局部 theme-space-6 → Card body padding | 32px | 12px | FAIL |
| 局部 theme-avatar-size-md → Avatar | 56px | 36px | FAIL |
| 祖先公共 Card padding 正向对照 | 20px | 20px | PASS |
| html font-size 20px → md control height | 40px | 40px | PASS |
| scoped Popup Light/Dark 配方变化 | 背景不同 | 背景不同 | PASS |

前两次证据工作流分别暴露了工具的浏览器 profile 清理竞争，以及 Card padding 探针应测量 body 而非无 padding 的 root；两者已修正。当前判断仅使用 #3 的有效结果，未将这些工具缺陷算作组件缺陷。

原 QXFRAME CI #1235 / run `36970814254` 正在验证本提交（Windows tooling 已成功）。最终文档提交可能触发新 run；真实最新状态请查询 GitHub，不以本文件固定 run 声称最终 head 已绿。

额外本地结构/合同检查：40 个公开 component profiles 与 authority manifest 对齐；184 源文件、1431 ESM edges 无 cycle、legacy import 或外部 import；Shared Protocol、Value/Focus/Interaction/Capability/Selection、final async/form 生命周期、状态 cascade/specificity/color channels/static closeout 检查通过。这些是既有 gate 的复核，不等价于新的全部业务人工验收。

## 后续修复的收益与风险边界

| 修复组 | 目标与收益 | 默认行为约束 / 风险 |
|---|---|---|
| 002 control Theme API | 五档高度由公共 Theme role 决定，外部主题无需改组件 selector | 默认 24/28/32/36/40px 保持；逐项核对所有 `.is-*`、native/managed controls、nested controls，不可只加断开的变量 |
| 004 public override | Card 骨架标题等祖先公共覆盖真实生效 | 将公共输入作为 override slot；默认材料集中在 Theme，组件根只重置私有最终值；不能修遮蔽却新增 root alias 冻结 |
| 005 scoped aliases | 局部 Theme 的 Avatar/Card 等消费者重新解析，嵌套主题有效 | 为全部 :root Component aliases 建消费者清单；显式 Component override 必须仍优先，不能机械给 theme container 重声明公共默认值而再次遮蔽祖先 |
| 003 runtime colors | 与离线主题生成 / 静态默认值协议一致 | 按 role、颜色轴和明暗模式决定静态化/登记保留范围；保留默认 computed color，保护功能性 ColorPanel 颜色，禁止跨层读取或 JS 复制主题 |

修复后的必需复测：9 个探针全部通过，并补充五档/嵌套覆盖、所有受影响状态、实际 scoped portalContainer 里的 Select/DatePicker/Menu、Dialog/Drawer/嵌套 Popup、html font-size 变化时的 JS geometry 合同。通过后再执行全部 release CI；本记录不能提前签收这些尚未完成的组合。
