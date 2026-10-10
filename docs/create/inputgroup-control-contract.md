# InputGroup / Control 组合职责与嵌套策略（2026-10-10）

本次为共享框架修复，非 Create 卡片特例。

## 组件所有权

- **Control / Input / Native Form Input / JS Select**：拥有输入值、禁用/只读、校验、真实焦点及交互。单体 Control 不自动创建外部按钮或 Addon。
- **InputGroup**：仅管理一组相邻控件的 Flex 排列、共享尺寸、连接接缝、整体边框与键盘焦点轮廓。绝不复制孩子的 Value/Selection/Interaction Controller。
- **Addon**：只表现前缀/后缀提示或操作区域；可点击的 addon 保留自身事件，但被连接到同一 field 外框时不得再绘制第二道输入轮廓。
- **InputGroupField**：当 Prefix / [Addon + Input] / Suffix 混排时唯一承载输入外框的组合节点；根 InputGroup 则负责各独立段的连接接缝。

## 连接与嵌套

1. 单层 `InputGroup > Addon + Input`：外层拥有一个边框，子 Input 不绘制第二个边框或 keyboard outline；相接边界改用半边距，外边缘仍使用完整 Theme Padding。
2. `InputGroup > InputGroupField > Addon + Input`：InputGroupField 拥有输入框，外层连接其他 Prefix/Suffix；键盘轮廓仅在 InputGroupField。
3. `InputGroup > InputGroup`：**允许作为独立子组合布局岛**（保留 Flex 缩放和各自外框），但**不承诺隐式连接成一个公共边框**。如需连接必须使用明确的 `InputGroupField`／段接口，避免双层 Root 状态和焦点竞争。
4. `InputGroup > Control`：支持；Control 自己拥有交互。输入组合可以复用 CSS size，不能改变其值、picker 展开与底层 Controller。
5. 竖排和 `is-separated` 不启用横向共享边框与接缝半距；它们按独立控件处理。

## 约束与后续验证

Theme → 组件映射，不产生卡片私有 `pv-*` 样式或新增 JS Controller。浏览器回归需覆盖键盘/鼠标轮廓所有权、交叉焦点、Addon 两端、混合段、缩放、溢出及已支持的 InputGroupField。当前只将三种主要结构纳入共享 CSS；组合嵌套并非全部自动无缝连接。

## 2026-10-10 追加：Pointer Focus、Tabs 和原生 Select

- 连体 InputGroup / InputGroupField 是鼠标与键盘焦点的**视觉所有者**；input/control 仍是 DOM 焦点及交互所有者。
- 键盘焦点继续使用框架 2px focus-visible；鼠标焦点在 Theme v2 的 `@scope (:root)` 中复用独立 Input 的 `--qxframe9a7c2-theme-pointer-width/opacity/offset`，默认 0 宽保留 border feedback，配置不为 0 时由 Group 外框单独绘制；避免内部重复 outline。
- 分段 Tabs 不允许以删除滚动容器上下 padding 为代价修剪裁切。应使用固定 Scroll 轨道 = TabItem 高度 + 2 × 4px，Viewport 使用 border-box，Panels 不重复提供在当前源 Source Card 中已由 Tabs 轨道消费的 6px 空白；普通 Tabs 与垂直 Tabs 保留既有职责。
- 原生 Select 的箭头为与 JS Select 相同的 round-stroke SVG chevron-down，使用可替换 CSS 图像 token（数据 URI 图像不继承 currentColor，所以光暗模式分别提供中性色笔画）。

- 焦点协议门禁补充：输入组的指针 outline 必须以真实子 Input 的 `:focus-visible` 匹配为前提；不可仅靠 Root `:focus-within` 绘制轮廓，因为普通鼠标/程序化 focus 与键盘 focus 需要统一 FocusOrigin 解释。可用 `:has(> .form-input:focus-visible)` 投射到 border owner，再通过 `html:not(.qxframe9a7c2-keyboard-focus-origin)` 区分指针。