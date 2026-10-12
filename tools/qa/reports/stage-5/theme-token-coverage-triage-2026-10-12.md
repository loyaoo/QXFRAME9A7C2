
## 2026-10-12 follow-up — Card Skeleton shared disable implementation

- **Now implemented, awaiting current-HEAD CI**: preserved Card's `qxframe9a7c2-card-skeleton` shimmer animation; inherited CSS style query `@container style(--qxframe9a7c2-theme-skeleton-animation: none)` disables it when the same Theme `none` already disables base Skeleton pulse. No additional Theme tokens or conditional Style-specific selectors.
- Chromium computed-style contract tests regular `pulse` + Card `shimmer`, both `none` after Theme override, and restoration; static verifier guards the independent Card animation identity.
- Previous status in this document noting Card Skeleton as “尚未解决” is superseded **only for Chromium-compatible Theme `none` support**; consumer states and remaining external token audit still need work.
# Stage 5 — Theme Token 覆盖审计分流记录（2026-10-12）

> 对外部审计结论进行源码核对。此记录不是完成证明，不覆盖运行时 60 组件族的全部状态。开发分支 `redesign/create-stage5`；PR #267 保持 Draft；不得合并或改动 main/backup。

## 方法与限制

- 基线：QXFRAME9A7C2 Stage 5 `b4a1cb17f691` dist+docs 离线包；文件 `docs/create/tokens.js`、`dist/qxframe9a7c2.css` 以及对应的 `src/styles/components/*` 源码。
- Token 注册表有 **211 项**（77 项颜色、134 项其他类型）。注册、消费、实际 CSS 计算值分别核对；**computed style 在一次哨兵扰动中未变化，不能单独证明完全没有 Token 接入**。要排除状态缺失、CSS 覆盖、同值组合、浏览器内建默认值和未触发的 Popup。
- `docs/admin/COMPONENT_COVERAGE.md` 与 `docs/create/preview-03-coverage.json` 属演示/组件 API 覆盖口径，**不是 Token 哨兵扰动的结果**；不得用 60 个组件族覆盖声明冒充视觉状态验收。

## 已确定需要修复

1. **离线 QA 模块语法错误**：`docs/create/offline-qa-changes.mjs` 的 toolbar caption 字符串未终止，Node `--check` 实测抛出 SyntaxError；官方 Actions ZIP/Windows 离线 ZIP 均受影响。已修复字符串；增加 `tools/verify-create-app.mjs` 的源码语法门禁，并在 `tools/qa/build-offline-demo.py` 中对最终写入 ZIP 的模块再次执行 `node --check`。必须重新用新 HEAD 的成功 CI 官方工件发包，不得复用 b4a1cb17 的失效 ZIP。
2. **JSON 等宽字体**：原 `src/styles/components/json.css` 优先 `--qxframe9a7c2-font-mono`，fallback 固定系统栈，没有消费映射 `--_qxframe9a7c2-fixed-font-family-mono:var(--qxframe9a7c2-theme-font-mono)`。已修复为 `public font-mono → Theme 映射 → 系统 fallback`，保持明确的组件自定义最高优先级，并加源码门禁。

## 误报 / 有意例外 / 待实测

| 审计声称 | 源码核对与判定 |
| --- | --- |
| Alert 圆角固定 14px | **误报（就主样式而言）**。`.qxframe9a7c2-alert-root` 消费 `--qxframe9a7c2-alert-radius`，回退 `--_qxframe9a7c2-surface-radius`。具体哨兵输出 14px 需要核查其计算、覆盖与状态。 |
| Table.is-shadow 写死阴影 | **主规则误报**。主规则 `box-shadow:var(--_qxframe9a7c2-table-shadow)`；固定列边缘/子元素另案审查，不等于整张表遗漏 Token。 |
| Notification/Message close 圆角固定 4px | **主规则误报**。控件使用 `--_qxframe9a7c2-action-radius`；检测到 4px 可能是 Theme 算出的计算值。 |
| TimePanel 主圆角固定 4px | **主规则误报**。`.qxframe9a7c2-time-panel-root` 消费 `--qxframe9a7c2-time-panel-radius` / `--_qxframe9a7c2-popup-radius`。 |
| ImagePreview 黑色半透明背景与白色描边 | **尚不能判为缺陷**。Preview 直接面对不受主题控制的图片；暗化遮罩是阅读/可见性角色，已有 `--qxframe9a7c2-image-preview-control` 与 `--qxframe9a7c2-image-preview-border` 公共覆盖口，不应盲目映射成页面 Card 背景。 |
| Card skeleton 与全局 skeleton-animation 脱节 | **确有共享动效控制缺口**。`.qxframe9a7c2-skeleton` 消费全局 `--qxframe9a7c2-theme-skeleton-animation`；`.qxframe9a7c2-card-skeleton-line` 使用自己的 shimmer 名称和 1.3s。若把全局设为 `none`，Card 不会自动停；先定统一关停机制，再改，避免擅自把 shimmer 改成 pulse。 |
| `chart-1/2/4/5`、`sidebar-group-padding-block`、`sidebar-menu-gap` 无组件消费 | **就该版本 dist CSS 而言属实**：上述命名在产物中仅有 light/dark 变量声明；Chart 与 Demo 可以消费导出 Theme Token，因此“无框架组件直接读它”不等于“无存在价值”。应先厘清是 API 导出槽位还是实际不使用的 Theme 生成量。 |
| 模态框标题 12px/正文 11px | **目前不能归因于固定源码尺寸**：主 `modal-title` 仅明确 font-weight，`modal-body` 未固定 font-size；必须在真实挂载 Modal、使用实际 Style/font/density 的上下文中复测继承链。 |
| 过渡或字号数字固定即错误 | **证据不足**：不随 `text-size` 变化可能是组件内字体比例/局部定值策略；记录谁声明、谁覆盖，再按共性决定是否归入控制字体/动作 Motion Token。 |

## shadcn/create 参照边界

- 官方 Theming 保留 `ring`、`sidebar-primary/-accent/-border/-ring`；QX 已明确采用 `pointer-focus` 与 `keyboard-focus`，**不得为了字面一致重新引入 ring**。
- 官方 `/create` 有 Menu Color、Menu Accent、Style 等独立轴，且 UI 组件代码会根据 Style 变化；QX 目标是同一套 CSS/JS 使用 Theme + Mapping 分配，不能只用“211 vs 30–40”推出设计失败。外部参考：`https://ui.shadcn.com/docs/theming`、`https://ui.shadcn.com/docs/registry/examples`、`https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create`。

## 尚未完成的验收

- 实际 Popup（Select/Cascader/TreeSelect/DatePicker/TimePicker/Tooltip/Modal/Drawer）的 open/hover/selected/disabled/focus 组合；深色、反色、半透明、不同 Size、字号的样式矩阵。
- 间距/尺寸/几何 Token 的扰动矩阵，避免只测颜色、radius/shadow 而遗漏 layout。
- Theme 配方导出与组件有效消费分离统计：保留 public API 导出槽位，标出真正冗余槽位，再考虑 Theme Token 精简。
- 对 skeleton 全局开关、固定阴影/定值文字进行专门的实际 computed style 和源码所有权复核；不能直接全局搜索替换字面量。

## 交付门禁

1. 只在 Stage5 分支完成变更和进度文档；PR #267 永远 Draft，直到所有者批准。
2. QXFRAME CI 与 CSS Schema Acceptance 两条 workflow 在**同一最终 HEAD** 均成功。
3. 官方成功 CI 的完整 dist+docs ZIP 二次打包，产物完整性/CRC、QA JS `node --check`、HTML 本地 HTTP 路径检查均通过；Windows `START-DEMO.cmd`，不需要用户 npm/git。
