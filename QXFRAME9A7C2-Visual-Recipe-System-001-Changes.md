# VISUAL-RECIPE-SYSTEM-001 修改说明

基线：PR #253 / main `9e64e56de86860b67298a2fcd9b5f6f8a363e31c`。
设计依据：`QXFRAME9A7C2-Theme-Visual-Recipe-System-Post-PR253-Plan-2026-10-03.md`。

## 完成清单

| 阶段 | 实现 | 验收 |
| --- | --- | --- |
| A Foundation / Recipe | Radius / Density 直接选择语义档位，Shape Family、Surface Recipe 继续消费原有索引 Size Tree；取消 `sizeScale / radiusScale` 二次倍率层；required Schema 不变 | 离线矩阵、规模及单位检查 |
| B Typography | Body / Heading / Label / Meta / KPI / Code；同尺寸 Input、Textarea、Select、TagInput 编辑器使用统一 Body；Heading Font 与 Body Font 全局入口 | 真实 Control 字体与 input type 一致性 |
| C Control Geometry | 文字与普通图标/Spinner 共用尺度，Spinner 1px 线宽；Default Disabled 的离线 Button accent 绑定回 Neutral；Switch 的零边框值采用长度单位；Body 行高为 Control 提供最小几何预算 | Loading 高度/图标尺寸、8 Style Switch 对称检查 |
| D Compound Controls | TagInput 与 Multiple Select 共用等距 inset、Tag 高度与文字锚点；移除 hosted Tag .9em 缩小 | 文字锚点、上下间隙、五种尺寸高度一致 |
| E Card | 清晰外边缘、Divider fallback 保留；Default / Outlined / Elevated / Borderless Surface Recipe；沿用 PR #253 composition / spacing | Recipe 输出、现有 Card 合约 |
| F Shape | Choice / Toggle / Range / Compact / Identity 的 Follow / Intrinsic / Square | 120 组 Style × Radius × Shape，Light/Dark |
| G Menu | Normal / Neutral / Inverse / Brand × 6 Accent × 4 Expand；Current Menu / Menu Tree / All Menus；展开与选中分离；静态 surface-context 由调用方语义声明 | 288 组 Menu 组合；真实 popup、Menu Dropdown、picker 隔离与局部模式 |
| H Studio | 新配置入口、克制文字角色、baseColor canvas；Workspace submenu 初始关闭；保留 21 商业场景和 66 组件回归 | 实际 Studio 与原五层浏览器 suite |

## 配置与作用域

- `sizeScale / radiusScale` 已移除，`foundation` 不再是 Theme Config 的合法顶层字段。尺寸由 Density / md 几何输入决定，圆角由 Radius / md 圆角输入决定；不再对已解析尺寸做二次乘法。
- `shape: { choice, toggle, range, compact, identity }`，每类选择 `follow / intrinsic / square`。None + Follow 归零；Intrinsic 保留语义形态；Square 无条件归零。
- `surface: default / outlined / elevated / borderless`，通过共享 Surface Recipe 生成 Card 的边缘和空间关系。
- `components.menu: { scheme, accentStyle, expand, scope }`。旧 Config 的 color / appearance / accent 可导入；新的 Studio 使用上述语义策略，旧 Color 枚举映射为对应 Scheme。
- `scope: menu-tree` 默认。目标容器加 `data-qxframe9a7c2-menu-recipe="tree"`，并把 `Menu.portalContainer` 指向该容器，Root / Inline / Floating / Overflow 共用同一个真实 CSS scope。
- `scope: current-menu`：容器使用 `data-qxframe9a7c2-menu-recipe="current"`；Root 消费 Recipe，inline child level 与外部 floating panel 保持正常 Theme fallback。
- `scope: all-menus`：生成的属性 selector 覆盖 Menu context，包括实际承载 Menu 的 Dropdown 内的 Menu；Picker / Tooltip / Overlay 各自保留原 Surface。若 Dropdown 的外层 chrome 也需 Menu Surface，由调用方给真正的 Menu 容器声明 `data-qxframe9a7c2-surface-context="menu"`，不按“下拉”外观猜测语义。
- Menu / Picker / Tooltip / Overlay 的 `surface-context` 是静态内容语义，未增加 JS Theme/Token truth、颜色计算或 CSS 变量复制。
- Menu Recipe 的模式值从最近的 CSS Theme scope 继承；生产 JS 不扫描、不复制主题。
- 显式 Advanced overrides 最后应用；Current/Tree 的 portal 结构由调用方提供，沿用原架构约束。

## 收益与交互影响

本批改动统一视觉消费层，保留 Value / Focus / Interaction / Overlay / Motion 的现有业务协议。唯一业务场景的初始状态变化是 Workspace Navigation 现在默认关闭，需要 hover / click / keyboard 触发。字体与最小 Control 高度会改变旧 Style 的视觉密度，这是当前方案要求的 Typography 收敛与几何预算，避免 Input value 被当作 Meta。旧 Config 可以解析，但已移除的 `foundation.sizeScale / foundation.radiusScale` 不再兼容；新的 Menu Recipe 使用组合语义重新生成视觉。

保留 `@layer / :is() / :where()` 禁用、Flex 布局、无 Grid/fr/vw/vh、currentColor 图标、既有 Theme Schema hash；未重新执行 Controller 或 CSS Token 已完成阶段。

## 验证与进度

- Required Schema：4,028；interface hash `421bad21f47d6c90555b994664ef399051f1bf69fad4119f3dcee44c790c399c` 保持不变。
- 可选视觉槽位：532（原 499，新增 Typography / Shape / Compound / Card / Menu 输入与 context 消费）。
- 离线矩阵：120 Shape 配置 + 288 Menu 配置，覆盖 Light/Dark、可重复 JSON/CSS 输出、Picker Token 隔离和 Surface Recipe。真实浏览器另验 24 组显式 Menu-owned Dropdown 表面与内层 Menu。
- 本地：build、仓库 verify、五层真实 Chromium 回归与 Theme Studio 浏览器专项；最终证据以 PR 精确 head 的 GitHub Actions 为准。
- Phase A–H：100%。PR #254 已合并，最终 PR head `5dec1a48f5e87a65861be7eed0cd157ae05c1428`；合并 commit `965d0af5a55f8adea1f3afa3e0692c604f4cde2f`。
- GitHub Actions：PR QXFRAME CI `37097337170`、Schema Acceptance `37097337176`、main CI / Pages `37097797737` 均 SUCCESS。验收包含完整 verify、五层浏览器、Studio、legacy、release、package、standalone demo、Windows 与 Pages。
- 浏览器验收保留精确颜色/几何断言；以有上限的 CSS transition settlement 等待取代易抖动的固定帧等待。
- 已发布：https://loyaoo.github.io/QXFRAME9A7C2/ 。最终证据与下一步见 `AI_WORK_STATE.md`。
