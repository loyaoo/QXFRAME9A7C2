# QXFRAME9A7C2 Theme / Visual Recipe System 后续统一方案

> 基于 PR #253 之后的讨论整理  
> 状态：方案冻结稿（尚未实施）  
> 日期：2026-10-03

---

## 1. 背景与目标

PR #253 已完成 Card Visual Recipe 与 Theme Studio 商业化 Showcase 的第一轮改造，但后续实际截图暴露的问题已经不再是单一 Card 样式问题，而是整个框架在以下几个视觉基础层面仍缺少统一规则：

- Foundation Scale
- Radius / Shape
- Typography
- Control Geometry
- Surface / Border / Shadow
- State Color
- Compound Control
- Menu Visual Recipe
- Popup Visual Ownership

后续不再采用“截图发现一个 CSS 问题就修一个”的方式，而应升级为统一的 Visual Recipe / Theme System。

总体架构：

```text
Foundation Scale
    ↓
Theme Semantic
    ↓
Style Recipe
    ↓
Component Visual Recipe
    ↓
Component CSS
    ↓
Commercial Composition
```

Theme Generator 是这套系统的“生成器 / 编译器”，而不是跳过 Token 层直接给每个组件写最终数值的组件配置器。

---

## 2. Foundation Scale 保留，由 Theme Generator 生成

Size / Radius 等预设层继续保留，但不应理解为固定死的默认值表，而应作为可生成的基础尺度。

推荐结构：

```text
html font-size
      ↓
Foundation Scale
      ↓
Theme Semantic
      ↓
Style Recipe
      ↓
Component Token
      ↓
CSS
```

### 2.1 Size Token

Size Token 不按实际尺寸命名，避免绑定具体数值。

例如：

```text
size-1
size-2
size-3
size-4
...
```

不要：

```text
size-2px
size-4px
size-8px
```

原因是后续可能整体修改比例，例如所有尺寸统一放大一级，但上层语义映射不应因此改变。

所有尺寸仍使用 `rem`，仅 1px 边框等明确像素边界例外。

### 2.2 Theme Generator 职责

Theme Generator 可以控制：

```text
Size Scale
Radius Scale
Typography Scale
Density
Style Recipe
Shape Policy
Surface Recipe
```

但不应退化成：

```text
Button padding = ...
Input height = ...
Menu radius = ...
Card title size = ...
```

这种逐组件最终值生成器。

---

## 3. Radius System 升级为 Radius + Shape Policy

单独的 Radius 选项不足以处理以下组件：

```text
Radio
Checkbox
Switch
Slider
Progress
Tag
Badge
Tabs
Segmented
Avatar
```

因为这些组件本身具有明显的形态语义。

因此 Radius 与 Shape 必须分开建模。

---

## 4. Radius Scale

建议基础 Radius Scale：

```text
radius-0
radius-1
radius-2
radius-3
radius-4
radius-5
radius-full
```

其中：

```text
radius-full → 100rem
```

仅作为基础尺度之一，不拥有豁免权。

---

## 5. Shape Policy

Shape Policy 决定特殊形态如何消费 Radius。

基础策略：

```text
follow
intrinsic
square
```

### follow

```text
遵循当前 Radius Scale
Radius=None 时归 0
```

### intrinsic

```text
使用组件自己的语义形态
Radio → circle
Switch → pill track + circle thumb
Slider → circle handle
Checkbox → soft corner
```

### square

```text
无条件 radius = 0
```

---

## 6. Radius=None 的最终语义

Radius=None 不再简单定义为“所有组件全部方形”。

正式定义：

> 所有 follow-radius 的形态归零；特殊组件是否保留 intrinsic shape，由 Shape Policy 决定。

例如：

```text
Radius=None + follow
→ Radio 方形

Radius=None + intrinsic
→ Radio 圆形

Radius=None + square
→ Radio 方形
```

这样不会出现隐式豁免。

---

## 7. Shape Family

Theme Generator 不应出现大量组件级形态开关，例如：

```text
Radio Radius
Checkbox Radius
Switch Track Radius
Switch Thumb Radius
Slider Handle Radius
...
```

应按 Shape Family 组织：

```text
Choice Shape
→ Radio / Checkbox

Toggle Shape
→ Switch track / thumb

Range Shape
→ Slider / Progress

Compact Shape
→ Tag / Badge / Tabs / Segmented

Identity Shape
→ Avatar
```

Style Recipe 可以为不同 Family 指定：

```text
follow
intrinsic
square
```

必要时组件才允许 Override。

---

## 8. optionRadius / itemRadius 规则

`optionRadius` 与 `itemRadius` 不能一概而论。

### 8.1 普通 Option / Item

例如：

```text
Select option
Menu item
Dropdown item
List item
Tree node
Cascader option
Autocomplete option
```

这些本质仍是矩形交互区域，默认：

```text
follow Radius
```

因此：

```text
Radius=None
→ radius = 0
```

不允许组件内部写死：

```css
border-radius: 100rem;
```

逃逸 Radius。

### 8.2 特殊 Item

例如：

```text
Tabs item
Segmented item
Navigation item
Tag
Badge
```

可以进入 Shape Policy，因为它们存在：

```text
corner
pill
square
```

等明确视觉语言。

因此不应使用一个模糊的全局 `itemRadius` 控制所有 item。

推荐按语义划分：

```text
option
navigation-item
selection-item
compact-item
```

---

## 9. Typography System 全框架统一

当前视觉不统一的主要根因之一是 Typography 仍然由组件自己决定。

必须改为：

```text
Typography Role
    ↓
Component
```

而不是：

```text
Component
    ↓
自己定义字号 / 字重 / 颜色
```

---

## 10. Typography Role

建议只保留少量明确语义：

```text
Heading
Body
Label
Meta / Caption
KPI / Number
Code
```

### 10.1 Body

默认用于：

```text
普通正文
Input value
Textarea
Select value
Select option
Autocomplete option
Menu item
Tabs item
Button text
Table body
List
Tree
Cascader
Chart label
```

这些不应各自拥有独立字号。

### 10.2 Heading

用于：

```text
Page title
Section title
Card title
Modal title
Drawer title
Panel title
```

### 10.3 Label

用于：

```text
Form label
Field label
Small section label
```

### 10.4 Meta / Caption

仅用于：

```text
帮助文字
次要说明
辅助状态
Metadata
```

Input value 不能被压到 Meta 尺寸。

### 10.5 KPI / Number

用于：

```text
大数字
金额
比例
统计值
```

---

## 11. 字号 / 字重 / 字色必须克制

禁止在同一页面中无意义地出现大量微小字号差异，例如：

```text
11 / 12 / 13 / 14 / 15 / 16 / 17
```

应只保留少量稳定档位：

```text
Meta   → 小
Body   → 基准
Heading → Body + 1~2 档
KPI    → 大尺寸
```

字重也应收敛：

```text
400
500
600
700
```

文字颜色收敛为：

```text
text-primary
text-secondary
text-muted
text-disabled
text-inverse
text-accent
```

组件可以消费这些角色，但不能重新创造零散灰色体系。

---

## 12. Heading Font / Body Font 成为真正全局入口

Theme Generator 中的：

```text
Heading Font
Body Font
```

必须覆盖整个框架。

### Heading Font

用于所有标题语义。

### Body Font

用于：

```text
正文
Input
Textarea
Select
Menu
Tabs
Button
Table
List
Form
Tag
Pagination
```

Input 内用户输入文字必须使用 Body Font。

---

## 13. Control Typography Policy

同一 size 的 Control：

```text
Input
Textarea
Select
Search
Autocomplete
TagInput editor
Multiple Select editor
```

其 Value Typography 必须一致：

```text
font-family
font-size
font-weight
line-height
color
```

不能因为 input type 不同就改变字号。

例如：

```text
text
number
credit-card-like
date-like
```

最多改变：

```text
font-variant-numeric
letter-spacing
```

只有强语义需求时才使用 monospace。

---

## 14. Control Content Anchor

从 shadcn Input / TagInput 对比中确认：

> 不同结构的 Control 可以拥有不同内部 geometry，但第一项可见文字的视觉起点应保持一致。

普通 Input：

```text
左边框
│
│<──── Control Content Inset ────>文字起点
```

TagInput：

```text
左边框
│
│<─ Compound Control Inset ─>Tag 背景
│                              │<─ Item Inner Inset ─>文字起点
```

应满足：

```text
Compound Control Inset
+
Item Inner Inset
≈
Control Content Inset
```

这不是简单 padding 相等，而是视觉锚点统一。

---

## 15. TagInput = Compound Input Control

TagInput 不能继续作为普通 Input 处理。

它应有独立 Geometry Recipe：

```text
TagControl padding-inline
TagControl padding-block

Tag height
Tag padding-inline
Tag radius

Tag ↔ Tag gap
Tag ↔ editor gap

Editor min-width
Editor line-height
```

必须保证：

```text
Tag 上方留白
≈
Tag 下方留白
```

同时：

```text
Tag 内文字起点
≈
普通 Input 文字起点
```

Multiple Select 也应复用这套 Compound Control 规则。

---

## 16. Switch Geometry 统一

当前 Switch 开启态 / 关闭态中，thumb 与 track 内壁空隙视觉不一致。

应由固定几何关系生成：

```text
track width
track height
thumb size
inner inset
thumb travel
border width
```

并保证：

```text
左端可视间隙
=
右端可视间隙
```

不仅数学一致，视觉也必须一致。

---

## 17. Control Icon / Loading Icon 统一

当前 Button Loading 中 Spinner 明显比文字和普通图标更大、更重。

必须建立统一关系：

```text
Control Text Size
        ↓
Control Icon Size
        ↓
Loading Spinner Size
```

Loading 状态：

```text
不能改变 control height
不能改变 typography
不能改变 icon scale
不能改变按钮视觉重量
```

Spinner 必须与普通 icon 属于同一尺寸体系。

---

## 18. State Color Policy

状态变化不得跨 Color Family。

错误示例：

```text
Default
→ Disabled
→ Primary tint
```

正确：

```text
Default
→ Default Disabled

Primary
→ Primary Disabled

Success
→ Success Disabled

Error
→ Error Disabled
```

Hover / Active / Focus / Disabled / Loading 都必须从当前 Color Family 派生。

---

## 19. Card 自身必须在任意合理背景上成立

Card 不能依赖页面背景才显得漂亮。

Card 自身必须是完整视觉对象：

```text
Surface
+
Border
+
Shadow
+
Typography
+
Spacing
```

---

## 20. Card Border / Shadow 职责

默认 Card：

```text
Border
→ 定义边缘

Shadow
→ 定义空间
```

要求：

```text
Border 接触线的清晰度
>
Shadow 接触区域的清晰度
```

禁止：

```text
Surface ~ Border ~ Shadow
```

全部糊成一个渐变。

---

## 21. Card Recipe 类型

建议明确：

```text
Default
→ border 主导 + soft shadow

Outlined
→ clear border + no/minimal shadow

Elevated
→ weak/no border + stronger shadow

Borderless
→ no border
```

不要同时把 border 和 shadow 都调得模糊、半强不弱。

---

## 22. Card Divider

视觉强度：

```text
Outer Border
>=
Internal Divider
```

内部 Divider 不能抢过外轮廓。

同时保持 PR #253 已通过 CI 的兼容契约，不随意破坏已有 Token fallback。

---

## 23. Card Spacing Rhythm

当前部分卡片存在：

```text
标题到顶部距离
与
按钮到底部距离
```

视觉上明显不协调。

后续不能只要求：

```text
padding-top = padding-bottom
```

而应统一：

```text
Card edge → Header
Header → Content
Content group → Content group
Content → Actions
Actions → Card edge
```

无论使用：

```text
CardHeader + CardContent + CardFooter
```

还是：

```text
CardContent 自由组合
```

最终视觉首尾 inset 应一致。

---

## 24. Theme Studio `.qxframe9a7c2-play-main`

`.qxframe9a7c2-play-main` 可以使用由 `baseColor` 派生的非纯白背景，以突出 Card Surface。

但必须明确：

> 这是 Theme Studio 的 Showcase Canvas 设计，不是修复组件视觉的方法。

即：

```text
Theme Studio Canvas
→ baseColor surface
```

同时：

```text
Card
→ 自身必须独立漂亮
```

用户把页面背景换成其他合理颜色时，组件仍应成立。

---

## 25. Workspace Navigation Popup 初始状态

`Workspace navigation` 商业卡片中 submenu popup 当前页面加载默认打开，不符合正常交互。

普通业务 Showcase：

```text
load
→ popup closed
```

只有：

```text
hover
click
keyboard
```

触发后才打开。

若需要演示展开态：

```text
单独建立 Expanded State demo
```

不能污染正常业务场景。

---

## 26. Menu 不允许直接设置颜色

Menu 不应提供：

```text
Background Color
Foreground Color
Active Color
```

这种 Color Picker。

所有颜色都从：

```text
themeColor
+
baseColor
+
Light / Dark mode
```

推导。

Menu 只允许选择视觉组合策略。

---

## 27. Menu Surface Scheme

不采用固定：

```text
Light
Grey
Dark
Primary
```

作为核心语义。

因为还存在全局 Light / Dark Theme 切换。

改为：

```text
Normal
Neutral
Inverse
Brand
```

### Normal

当前主题正常 surface。

Light Theme：

```text
浅背景 + 深前景
```

Dark Theme：

```text
深背景 + 浅前景
```

### Neutral

使用当前 `baseColor` 的次级 neutral surface。

不是固定 Grey。

### Inverse

当前主题反色。

Light Theme：

```text
深背景 + 浅前景
```

Dark Theme：

```text
浅背景 + 深前景
```

### Brand

使用 `themeColor` 强 surface + contrast foreground。

---

## 28. Menu Accent Style

Menu 真正需要重点定制的是 Active / Highlight 的表现方式。

建议：

```text
Text
Soft
Solid
Indicator
Neutral
Accent
```

### Text

```text
active text → themeColor
background → 基本不变
```

### Soft

```text
active text → themeColor 强阶
active bg → themeColor 浅阶
```

### Solid

```text
active bg → themeColor
active text → contrast foreground
```

### Indicator

```text
文字轻度变化
+
左侧 / 底部 indicator 使用 themeColor
```

### Neutral

```text
active bg → baseColor 强阶
active foreground → contrast
```

### Accent

```text
文字使用 themeColor
背景使用 secondary / accent semantic surface
再使用小面积 themeColor indicator
```

不允许直接选颜色。

---

## 29. Menu Surface Scheme × Accent Style 必须组合解析

不能写成两套完全独立的 CSS。

正确：

```text
Surface Scheme
        ×
Accent Style
        ↓
Resolved Menu Visual Recipe
```

例如：

```text
Brand + Solid
```

不能机械变成：

```text
Brand background = primary
Active background = primary
```

因为会失去层级。

必须根据当前 surface 自动推导 contrast / baseColor / themeColor 的合理组合。

---

## 30. Expanded 与 Active 分离

Menu 至少存在：

```text
hover
active
selected
expanded
active + expanded
```

不能：

```text
expanded == active
```

一个 parent 只是打开子菜单，不代表它就是当前页面。

---

## 31. Expand Treatment

建议作为独立选项：

```text
Minimal
Emphasized
Grouped
Inherited
```

### Minimal

```text
只改变展开箭头 / 状态
```

### Emphasized

```text
Parent 使用较弱 Accent
```

### Grouped

```text
Parent + Children 形成一个 grouped surface
```

### Inherited

```text
Expanded 使用 Active Recipe 的弱版本
```

---

## 32. Menu Apply Scope

Menu Surface Scheme 应明确作用域。

建议：

```text
Current Menu
Menu Tree
All Menus
```

默认推荐：

```text
Menu Tree
```

含义：

```text
Root Menu
Inline Submenu
Floating Submenu
Overflow Menu
```

全部继承。

`All Menus` 表示全站所有 Menu context。

但必须明确：

> All Menus ≠ All Popups

---

## 33. Menu Scheme 不控制所有 Picker

必须把底层 Popup 能力与 Visual Ownership 分开。

正确依赖：

```text
Menu
  ↓
Popup
  ↓
Floating / Scroll

Select
  ↓
Popup
  ↓
Floating / Scroll

DatePicker
  ↓
Popup
```

但：

```text
Popup
```

本身不拥有 Theme。

由调用方提供：

```text
surface-context
```

例如：

```text
Menu
→ menu

Select
→ picker

DatePicker
→ picker

Tooltip
→ tooltip

Popover
→ overlay
```

---

## 34. Menu Scheme 的作用范围

应该影响：

```text
✓ Menu root
✓ Inline submenu
✓ Floating submenu
✓ Overflow menu
✓ 真正承载 Menu 的 Dropdown
```

不影响：

```text
✗ Select
✗ TreeSelect
✗ Cascader
✗ Autocomplete
✗ DatePicker
✗ TimePicker
✗ ColorPicker
✗ Tooltip
✗ 普通 Popover
✗ Modal
✗ Drawer
```

未来如果需要控制这些，再独立设计：

```text
Overlay / Picker Scheme
```

不能借 Menu Scheme 实现。

---

## 35. Dropdown 判断标准

不能因为“都是下拉”就归入 Menu Theme。

判断标准：

> Popup 内部的内容语义是什么。

例如：

```text
Button
→ Dropdown
→ Menu
```

属于 Menu Scheme。

但是：

```text
Select dropdown
Autocomplete
Cascader
```

属于 Picker / Control context。

---

## 36. Visual Recipe 下一批优先组件

PR #253 仅完成 Card 第一层。

下一批高视觉影响组件应优先：

```text
Button
Input
Textarea
Select
TagInput / Multiple Select
Badge
Tag
Switch
Slider
Tabs / Segmented
Menu
```

原因：

这些组件决定绝大多数商业页面的整体质感。

---

## 37. 推荐实施阶段

### Phase A — Foundation / Recipe

统一：

```text
Size Scale
Radius Scale
Shape Policy
Typography Role
Surface Role
State Color Policy
```

### Phase B — Typography

统一：

```text
Heading
Body
Label
Meta
KPI
Control Typography
```

### Phase C — Control Geometry

统一：

```text
Input
Textarea
Select
Button
Icon
Loading
Switch
```

### Phase D — Compound Controls

统一：

```text
TagInput
Multiple Select
Search / InputGroup
Content Anchor
```

### Phase E — Card Visual Polish

统一：

```text
border
shadow
divider
spacing rhythm
title / description hierarchy
```

### Phase F — Shape Components

统一：

```text
Radio
Checkbox
Switch
Slider
Progress
Tag
Badge
Tabs
Segmented
```

### Phase G — Menu Visual Recipe

实现：

```text
Surface Scheme
Accent Style
Expand Treatment
Apply Scope
Popup Ownership
```

### Phase H — Theme Studio

修复 / 更新：

```text
play-main canvas
Showcase typography
Workspace navigation 默认 popup
商业卡片整体重新验收
```

---

## 38. 自动验收要求

这轮不能只靠截图“看起来差不多”。

至少增加：

```text
Radius=None / Shape Policy matrix
Style × Shape Policy
Light × Dark
Menu Scheme × Accent Style
Control typography equality
Input type typography equality
TagInput anchor alignment
Switch travel symmetry
Loading icon scale
Default Disabled 不跨 color family
Card border / shadow contract
Menu popup initial closed
Popup surface-context ownership
```

---

## 39. 继续保持现有冻结约束

必须继续保证：

```text
无 display:grid
无 fr
无 vw / vh
无 @layer
无 :is()
无 :where()
Component 不反向创造 Theme 决策
```

布局继续以 Flex 为主。

---

## 40. 最终设计原则

本轮统一方案可归纳为以下 8 条硬原则：

1. **Generator 生成系统，不直接堆组件最终值。**
2. **Radius 决定尺度，Shape Policy 决定特殊形态。**
3. **Typography 先统一 Role，组件只能消费。**
4. **同类 Control 必须共享 Typography、Geometry 和 Content Anchor。**
5. **Compound Control 不能机械复用普通 Input padding。**
6. **Component 自身必须漂亮，不能依赖页面背景救视觉。**
7. **Menu 只消费 ThemeColor + BaseColor，通过 Scheme / Accent / Expand 组合生成。**
8. **Popup 是基础能力，不拥有调用方的视觉 Theme。**

---

## 41. 当前状态

- PR #253：已完成并合并。
- 本文内容：PR #253 之后讨论确认、尚未实施的后续统一方案。
- 下一步：先以本文作为 Visual Recipe / Theme System 新主任务设计基准，再开始代码实施。
