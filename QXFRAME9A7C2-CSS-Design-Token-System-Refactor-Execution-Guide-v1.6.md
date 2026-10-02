# QXFRAME9A7C2 CSS Token 系统重构执行手册 v1.6

日期：2026-10-01  
适用仓库：`loyaoo/QXFRAME9A7C2`

> 本文档取代 v1.5 以及更早版本中与本文冲突的内容。  
> 本阶段只完成 **CSS Token 系统重构、SCSS 源码整理、默认主题迁移与验证**。  
> **主题生成器仍是后续独立项目**；只有 CSS Token Schema v1 完成、验证、冻结之后才能开始开发主题生成器。

---

# 1. 本次重构的最终目标

QXFRAME9A7C2 的 CSS Token 体系正式收敛为：

```text
html font-size
      ↓
基础 sizeToken
      ↓
其他尺寸型预设 Token
      ↓
┌─────────────────────────────┐
│ 预设 Token 层               │
│ 固定材料、固定色阶、固定阶梯 │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 主题 Token 层               │
│ 默认主题 + 明暗模式映射      │
│ 外部主题 CSS 主要覆盖这一层  │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 组件 Token 层               │
│ Button / Input / Select ... │
└──────────────┬──────────────┘
               ↓
        组件内部最终 Token
               ↓
           CSS 属性
```

其中最重要的规则是：

> **组件 Token 永远不能直接读取预设 Token。组件只能读取主题 Token。**

因此禁止：

```css
/* 禁止 */
--qxframe9a7c2-button-height:
  var(--qxframe9a7c2-size-16);
```

必须是：

```css
/* 正确 */
--qxframe9a7c2-button-height:
  var(--qxframe9a7c2-theme-control-height-md);
```

再由主题层决定：

```css
--qxframe9a7c2-theme-control-height-md:
  var(--qxframe9a7c2-size-16);
```

这样组件与具体预设值彻底解耦。

---

# 2. 三层 Token 架构正式冻结

## 2.1 第一层：预设 Token 层

预设层回答：

> **框架有哪些可供选择的材料和阶梯？**

包括但不限于：

```text
基础 Size Tree
Spacing 预设
Font Size 预设
Icon Size 预设
Radius 预设
Border Width / Border Style 预设
Color Palette
Shadow 预设
Opacity 预设
Motion Duration / Easing 预设
```

预设层不带具体组件语义。

例如：

```text
错误：
button-height-32
select-padding-8
dark-card-bg

正确方向：
size-*
space-*
font-size-*
radius-*
palette-grey-*
```

## 2.2 第二层：主题 Token 层

主题层回答：

> **当前主题从预设材料中选择什么？**

例如：

```text
theme-control-height-md
theme-control-padding-inline-md
theme-control-radius
theme-surface-bg
theme-text-primary
theme-border-default
theme-focus-width
```

框架主 CSS 必须自带完整默认主题。

外部主题文件：

```html
<link rel="stylesheet" href="qxframe9a7c2.css">
<link rel="stylesheet" href="my-theme.css">
```

主要通过覆盖同名主题 Token 改变主题。

外部主题正常情况下：

- 不修改组件选择器；
- 不复制 Button / Input / Select 的完整样式；
- 不直接覆盖组件私有 Token；
- 不要求 `!important`；
- 不要求提高选择器优先级。

## 2.3 第三层：组件 Token 层

组件层回答：

> **这个组件具体采用哪些主题值？**

例如：

```text
button-height
button-padding-inline
button-radius
button-bg
button-text
button-shadow

input-height
input-padding-inline
input-radius
input-bg
input-border
```

组件 Token：

- 只能读取主题 Token；
- 不能越过主题层读取预设 Token；
- 不能读取另一个组件的 Component Token；
- 如果多个组件稳定共享一个设计规则，应把公共规则放在主题层，而不是互相借 Token。

## 2.4 组件内部最终 Token

这一层属于组件内部实现，不是第四个公共 Token 层。

例如：

```css
.qxframe9a7c2-button {
  --_qxframe9a7c2-button-bg:
    var(--qxframe9a7c2-button-bg);

  background:
    var(--_qxframe9a7c2-button-bg);
}

.qxframe9a7c2-button:hover,
.qxframe9a7c2-button.is-hover {
  --_qxframe9a7c2-button-bg:
    var(--qxframe9a7c2-button-bg-hover);
}
```

组件状态优先修改内部最终值，避免为每一个 CSS 属性制造无限状态变量。

---

# 3. 明亮 / 黑暗模式放在哪里

明亮 / 黑暗模式 **不增加第四个 Token 层**。

它属于：

> **主题 Token 层内部的模式映射。**

因此整体结构仍然是：

```text
预设 Token
   ↓
主题 Token
   ├ 明亮模式映射
   └ 黑暗模式映射
   ↓
组件 Token
```

组件永远只读取同一个主题 Token 名称，不需要知道当前是什么模式。

例如：

```css
:root,
.is-light {
  --qxframe9a7c2-theme-surface-bg: ...;
  --qxframe9a7c2-theme-text: ...;
  --qxframe9a7c2-theme-border: ...;
}

.is-dark {
  --qxframe9a7c2-theme-surface-bg: ...;
  --qxframe9a7c2-theme-text: ...;
  --qxframe9a7c2-theme-border: ...;
}
```

组件：

```css
.qxframe9a7c2-card {
  --qxframe9a7c2-card-bg:
    var(--qxframe9a7c2-theme-surface-bg);

  --qxframe9a7c2-card-text:
    var(--qxframe9a7c2-theme-text);
}
```

不得让组件写：

```css
/* 禁止 */
.qxframe9a7c2-card.is-dark { ... }
```

来重新实现一套组件级黑暗模式。

---

# 4. Size Tree v1 正式冻结

## 4.1 基础规则

QXFRAME 的基础 Size Tree 是整个可缩放尺寸体系的母尺。

默认计算基准：

```css
html {
  font-size: 16px;
}
```

允许宿主页面或后加载样式修改 `html font-size`，从而让所有以 `rem` 表达的视觉尺寸整体同比例缩放。

Size Tree 的 Token 名称 **绝不能按真实尺寸命名**。

禁止：

```css
--qxframe9a7c2-size-24: 1.5rem;
```

因为未来 `size-24` 可能不再等于 24px。

必须使用纯顺序编号：

```css
--qxframe9a7c2-size-1: ...;
--qxframe9a7c2-size-2: ...;
--qxframe9a7c2-size-3: ...;
```

名称只表示：

> **它是 Size Tree 的第几个节点。**

## 4.2 默认 Size Tree 不保留奇数尺寸

当前框架存在若干：

```text
3px
5px
7px
9px
11px
13px
15px
17px
以及 14.4px、8.8px 等不规则尺寸
```

这些值不能继续作为新的正式尺寸树节点。

Size Tree v1 使用：

```text
2 ～ 48：每 2 一档
52 ～ 80：每 4 一档
88 ～ 128：每 8 一档
144 ～ 256：每 16 一档
```

默认物理等价值如下：

| `size-1` | 2px | `0.125rem` |
| `size-2` | 4px | `0.25rem` |
| `size-3` | 6px | `0.375rem` |
| `size-4` | 8px | `0.5rem` |
| `size-5` | 10px | `0.625rem` |
| `size-6` | 12px | `0.75rem` |
| `size-7` | 14px | `0.875rem` |
| `size-8` | 16px | `1rem` |
| `size-9` | 18px | `1.125rem` |
| `size-10` | 20px | `1.25rem` |
| `size-11` | 22px | `1.375rem` |
| `size-12` | 24px | `1.5rem` |
| `size-13` | 26px | `1.625rem` |
| `size-14` | 28px | `1.75rem` |
| `size-15` | 30px | `1.875rem` |
| `size-16` | 32px | `2rem` |
| `size-17` | 34px | `2.125rem` |
| `size-18` | 36px | `2.25rem` |
| `size-19` | 38px | `2.375rem` |
| `size-20` | 40px | `2.5rem` |
| `size-21` | 42px | `2.625rem` |
| `size-22` | 44px | `2.75rem` |
| `size-23` | 46px | `2.875rem` |
| `size-24` | 48px | `3rem` |
| `size-25` | 52px | `3.25rem` |
| `size-26` | 56px | `3.5rem` |
| `size-27` | 60px | `3.75rem` |
| `size-28` | 64px | `4rem` |
| `size-29` | 68px | `4.25rem` |
| `size-30` | 72px | `4.5rem` |
| `size-31` | 76px | `4.75rem` |
| `size-32` | 80px | `5rem` |
| `size-33` | 88px | `5.5rem` |
| `size-34` | 96px | `6rem` |
| `size-35` | 104px | `6.5rem` |
| `size-36` | 112px | `7rem` |
| `size-37` | 120px | `7.5rem` |
| `size-38` | 128px | `8rem` |
| `size-39` | 144px | `9rem` |
| `size-40` | 160px | `10rem` |
| `size-41` | 176px | `11rem` |
| `size-42` | 192px | `12rem` |
| `size-43` | 208px | `13rem` |
| `size-44` | 224px | `14rem` |
| `size-45` | 240px | `15rem` |
| `size-46` | 256px | `16rem` |

共 **46 个基础节点**。

## 4.3 为什么这样分段

当前 QXFRAME、shadcn、Ant Design、Tabler 的实际尺寸使用有共同规律：

- 2～20 左右是字体、图标、间距、圆角、小控件内部尺寸最密集的区域；
- 20～48 是常见控件高度、图标、按钮、头像、小型视觉元素的高频区域；
- 48 以上越来越多用于 Avatar、Progress、Result、较大视觉容器；
- 尺寸越大，对 1px / 2px 的微小差异越不敏感，因此可以逐渐增大步长。

Size Tree 不追求数学上的等比数列，而追求：

```text
高频区足够密
+
低频大尺寸区不过度制造节点
+
节点规则稳定
+
不同主题容易重新映射
```

## 4.4 当前奇数值如何迁移

禁止机械执行：

```text
3 → 4
5 → 6
13 → 14
17 → 18
```

也禁止统一向下取整。

必须逐项判断其设计作用。

例如：

```text
13px 字体
```

可能应收敛到：

```text
12px
或
14px
```

取决于它在同一字号阶梯中的位置。

因此迁移必须建立：

```text
当前值
当前消费者
所属尺寸域
相邻正式节点
建议目标
最终目标
视觉变化
批准状态
```

的转换表。

只有转换表批准后才能修改。

## 4.5 1px 不进入可缩放 Size Tree

`1px` 主要用于：

```text
border
divider
hairline
精确物理细线
```

它允许继续保持：

```css
border-width: 1px;
```

不要求写成 `rem`。

`0` 直接使用 `0`，也不需要创建 `size-0`。

---

# 5. html font-size → Size Tree → 尺寸型预设 Token

尺寸体系正式采用：

```text
html font-size
      ↓
sizeToken
      ↓
其他尺寸型预设 Token
      ↓
themeToken
      ↓
componentToken
```

也就是说：

> **Spacing / Radius / Font Size / Icon Size 等只要属于可缩放尺寸，就不再各自维护一套没有共同母尺的任意数字。**

例如：

```css
:root {
  --qxframe9a7c2-size-1: .125rem;
  --qxframe9a7c2-size-2: .25rem;
  --qxframe9a7c2-size-3: .375rem;

  --qxframe9a7c2-space-xs:
    var(--qxframe9a7c2-size-2);

  --qxframe9a7c2-radius-sm:
    var(--qxframe9a7c2-size-2);

  --qxframe9a7c2-font-size-sm:
    var(--qxframe9a7c2-size-6);

  --qxframe9a7c2-icon-size-sm:
    var(--qxframe9a7c2-size-6);
}
```

这里示例只表达依赖结构，最终每个名称对应哪个节点要根据当前框架审计后确定。

## 5.1 可以消费 Size Tree 的尺寸型预设

原则上包括：

```text
Spacing
Font Size
Icon Size
Radius
Control Height
Thumb / Handle Size
Avatar Size
Badge Height
Progress Geometry
可缩放的 Shadow blur / spread（如决定开放）
可缩放的 Focus Visual 尺寸
其他真正属于视觉尺寸的预设
```

## 5.2 不强行消费 Size Tree 的内容

以下不是可缩放尺寸母尺的职责：

```text
Color
Opacity
Motion Duration
Motion Easing
z-index
百分比布局
Grid 24 栅格百分比数学
50% 圆形
1px 精确边框
功能性算法常量
```

---

# 6. 三种尺寸变化方式必须区分

以后不能把“变大”全部理解成一件事。

## 6.1 整页同比例放大 / 缩小

改：

```text
html font-size
```

例如：

```text
16px → 18px
```

所有 `rem` 尺寸一起等比例变化。

适用于：

```text
整个页面统一缩放
大屏显示
用户界面整体放大
整体可读性缩放
```

## 6.2 改变主题中的尺寸搭配

不改 Size Tree，改主题 Token 对预设节点的映射。

例如默认：

```text
theme-control-height-md
→ size-16
```

另一主题：

```text
theme-control-height-md
→ size-18
```

适用于：

```text
紧凑主题
宽松主题
不同视觉风格
某一类组件整体变化
```

这是正常主题变化时的首选方式。

## 6.3 改变整棵 Size Tree

Size Tree 节点名称不包含物理尺寸，因此技术上允许：

```text
size-1 / size-2 / size-3 ...
```

整体使用另一套 rem 数值。

但这属于：

> **全局尺寸预设更换**

而不是普通主题映射的默认行为。

正常主题文件优先覆盖主题 Token；只有明确创建“整套尺寸预设”时才覆盖 Size Tree。

这样可以避免普通颜色主题无意中改变整个框架尺寸。

---

# 7. 尺寸域与间距域仍然是两个设计概念

虽然：

```text
Spacing
Radius
Font Size
Icon Size
```

都可以从同一棵 Size Tree 取值，但它们仍然不是同一个语义。

例如：

```text
size-6
```

只是基础尺寸节点。

它可以同时被：

```text
space-sm
font-size-xs
icon-size-xs
radius-lg
```

引用。

这表示它们当前恰好选择同一个基础尺寸，不表示这些 Token 可以互相替代。

因此禁止：

```css
/* 禁止 */
--qxframe9a7c2-font-size-sm:
  var(--qxframe9a7c2-space-sm);
```

正确关系是：

```text
space-sm ─┐
          ├→ 同一个 sizeToken 节点
font-sm ──┘
```

而不是：

```text
font-sm → space-sm
```

---

# 8. CSS 单位协议冻结

## 8.1 可缩放视觉尺寸优先使用 rem

包括：

```text
width / height
min/max size 中的设计尺寸
padding
margin（属于组件内部设计时）
gap
font-size
icon-size
radius
thumb / handle
组件视觉几何
大部分可缩放 shadow geometry
可主题化 focus geometry
```

这些最终应优先追溯到 Size Tree。

## 8.2 允许百分比

允许：

```text
%
```

用于：

```text
相对宽高
24 栅格数学
圆形 50%
相对定位
必要的比例布局
```

## 8.3 允许 1px 精确物理线

允许：

```text
1px border
1px divider
1px hairline
```

它们不要求跟随 `html font-size` 缩放。

其他 `px` 使用必须经过审计，不能作为新的普通尺寸系统继续扩散。

## 8.4 禁止 vw / vh / vmin / vmax

框架最终 CSS 不使用：

```text
vw
vh
vmin
vmax
```

已有使用必须登记并逐项替换。

不得机械：

```text
100vh → 100%
```

必须确认 containing block、fixed/absolute 定位、Overlay 等功能关系后再替换。

## 8.5 禁止 fr 与 CSS Grid 布局

框架最终布局体系统一为：

```text
Flex
+
百分比
+
width / height
+
min/max
+
calc()
+
position
```

禁止：

```text
display: grid
display: inline-grid
grid-template-*
grid-column
grid-row
fr
```

注意：

> QXFRAME 的 `Grid` 组件名称可以继续存在。  
> 它指的是现有 **24 列 Flex 栅格系统**，不是 CSS Grid。

现有 CSS Grid 清理必须单独验证布局等价，不能在 Token 替换时机械转换。

---

# 9. SCSS 源码 + 单一 CSS 发行文件

本次重构建议正式把 CSS 源码改成 SCSS 模块化维护。

目标：

```text
src/styles/*.scss
        ↓
Sass 编译
        ↓
dist/qxframe9a7c2.css
```

最终使用者仍然只需要一个完整 CSS 文件。

## 9.1 推荐源码结构

```text
src/styles/
│
├ preset/
│  ├ _size.scss
│  ├ _spacing.scss
│  ├ _typography.scss
│  ├ _radius.scss
│  ├ _border.scss
│  ├ _color.scss
│  ├ _shadow.scss
│  ├ _opacity.scss
│  └ _motion.scss
│
├ theme/
│  ├ _default.scss
│  ├ _light.scss
│  └ _dark.scss
│
├ components/
│  ├ _button.scss
│  ├ _input.scss
│  ├ _select.scss
│  ├ _switch.scss
│  ├ _slider.scss
│  └ ...
│
├ _base.scss
└ qxframe9a7c2.scss
```

实际目录可以根据仓库当前构建脚本调整，但逻辑分区必须保持：

```text
预设
主题
组件
```

## 9.2 SCSS 只负责源码组织和生成

SCSS 可以用于：

```text
map
loop
mixin
function
模块拆分
重复规则生成
```

例如 Size Tree 可以由 SCSS 数据表自动生成。

但运行时主题协议必须继续使用 CSS 自定义属性。

禁止把主题改成只存在于：

```scss
$primary
$control-height
$radius
```

然后编译死。

## 9.3 禁止滥用 SCSS

禁止：

- 深层嵌套造成选择器优先级膨胀；
- 大量 `@extend` 产生不可控组合选择器；
- 使用 SCSS 数学公式重新计算当前所有组件尺寸；
- 同时维护一套 SCSS 变量主题和一套 CSS Token 主题；
- 为了“代码漂亮”改变最终 CSS 的来源顺序和优先级。

---

# 10. SCSS 迁移必须先做编译等价

不能直接：

```text
旧 CSS
↓
拆 SCSS + Token 重构 + 尺寸规范化 + 状态重构
↓
新 CSS
```

正确顺序：

```text
第一步：
旧 CSS → SCSS 模块
只拆文件，不改变最终样式

第二步：
验证编译后的 CSS 与原 CSS 的最终表现等价

第三步：
在 SCSS 源码内开始 Token 三层重构

第四步：
再执行批准过的奇数尺寸规范化
```

这样任何视觉变化都能找到来源。

---

# 11. 设计域冻结

公共设计域继续保持：

```text
1. Color
2. Size
3. Spacing
4. Typography
5. Border Width
6. Border Style
7. Radius
8. Shadow
9. Opacity
10. Motion
11. Focus Visual
```

但是现在明确：

> **设计域不等于 Token 层。**

例如：

```text
Size
```

会同时存在于：

```text
预设层
主题层
组件层
```

这三个层表示依赖关系；设计域表示值的性质。

不得把“主题层”误解成新的第 12 个设计域。

---

# 12. Typography 规则

Typography 至少包括：

```text
Font Family
Font Size
Font Weight
Line Height
Letter Spacing
```

其中：

- Font Size 属于可缩放尺寸，应从 Size Tree 派生；
- Font Family 不消费 Size Tree；
- Font Weight 使用独立的字重预设；
- Line Height 优先保留合理的无单位比例，不能为了统一 rem 强行转换；
- Letter Spacing 如果是尺寸值，应进入可追溯的尺寸体系。

当前存在的 13px、15px、17px 等字号必须进入“奇数尺寸规范化表”，不能自动改值。

---

# 13. Border 规则

Border Width 与 Size 概念保持独立。

尤其：

```text
1px 精确边框
```

可以保留物理像素。

组件变大不表示边框必须按比例变粗。

因此：

```text
html font-size 增大
```

不应自动要求：

```text
1px border → 1.125px
```

Border Style：

```text
solid
dashed
dotted
...
```

独立管理，不通过 Size Tree。

---

# 14. Radius 规则

Radius 是独立设计域，但属于尺寸型预设。

因此：

```text
Size Tree
   ↓
Radius Preset
   ↓
Theme Radius
   ↓
Component Radius
```

例如：

```text
size-x
↓
radius-sm
↓
theme-control-radius
↓
button-radius
```

禁止组件直接：

```text
button-radius → size-x
```

必须经过主题层。

`50%` 圆形属于相对几何，不要求转成 Size Token。

---

# 15. Color 规则

颜色仍然遵循：

```text
物理 Palette
      ↓
主题 Role / Surface / Text / Border / Status
      ↓
组件 Color Token
```

组件不能直接使用：

```text
palette-grey-*
palette-blue-*
```

作为最终语义。

例如：

```text
palette-grey-x
↓
theme-text-secondary
↓
input-placeholder-color
```

## 15.1 13 色阶物理编号稳定

Palette 的：

```text
1 ... 13
```

表示固定物理色阶顺序。

明亮 / 黑暗模式不通过“把编号意义反过来”实现。

模式差异在主题层映射。

## 15.2 删除运行时主题调色计算

组件与运行时主题 CSS 不再依赖大量：

```text
color-mix()
```

现场生成主题色阶。

最终默认 CSS 携带静态默认值。

后续主题生成器负责离线生成新的主题 Token 值。

---

# 16. Shadow / Opacity / Motion

## 16.1 Shadow

Shadow 是主题化视觉，不应由组件随意硬编码。

Shadow 中的颜色与几何要分清：

```text
shadow color
shadow x/y
blur
spread
```

几何部分如果属于可缩放主题尺寸，可以映射到 Size Tree；如果属于固定功能效果，必须明确登记。

## 16.2 Opacity

Opacity 独立，不消费 Size Tree。

## 16.3 Motion

Motion 允许主题化：

```text
duration
easing
```

但不得改变：

```text
动画生命周期
进入 / 离开语义
keyframe 方向
MotionCore 行为
```

---

# 17. Focus Visual

Focus 行为与 Focus 外观必须分开。

冻结行为：

```text
键盘焦点来源判断
focus-visible 触发语义
虚拟焦点归属
真实焦点归属
```

允许主题化外观：

```text
outline
border
shadow
outline + shadow
颜色
宽度
offset
```

当前默认键盘 Focus 外观可以保持现状作为默认主题。

鼠标交互不应错误继承键盘 Focus Visual。

Focus Visual 的可缩放尺寸如果进入主题体系，应通过：

```text
Size Tree
→ Focus 预设
→ Theme Focus
→ Component
```

---

# 18. 状态类统一规则

显式状态类目标统一为：

```text
.is-hover
.is-focus
.is-focus-visible
.is-active
.is-disabled
.is-checked
.is-selected
.is-loading
.is-open
.is-expanded
.is-readonly
.is-current
.is-dragging
.is-invalid
...
```

原生状态继续使用：

```text
:hover
:focus
:focus-visible
:active
:disabled
:checked
```

推荐：

```css
.qxframe9a7c2-button:hover,
.qxframe9a7c2-button.is-hover {
  ...
}
```

## 18.1 JS 状态类迁移强制冲突检查

任何：

```text
active → is-active
open → is-open
selected → is-selected
```

都不能全仓库机械替换。

如果涉及 JS，必须检查：

```text
结构 class 是否同名
语义是否一致
公开 DOM/API 是否依赖
querySelector 是否依赖
MutationObserver 是否依赖
Motion lifecycle 是否依赖
状态真值来源是否冲突
选择器优先级是否变化
现有 is-* 是否已经有不同含义
```

只要存在不确定性：

```text
KEEP-AS-IS
```

没有冲突并且最终样式正确时，才原子迁移：

```text
JS writer
JS reader
CSS selector
docs
demo
tests
```

必须一次完成。

---

# 19. 组件尺寸 API 与 Size Tree 是两件事

组件对外尺寸 API 继续：

```text
xs
sm
md
lg
xl
```

不得因为内部有 46 个 Size Tree 节点，就把组件 API 变成 46 档。

正确关系：

```text
Size Tree
46 个基础刻度
      ↓
尺寸型预设
      ↓
主题决定 xs/sm/md/lg/xl 分别选哪些刻度
      ↓
组件继续只有五档
```

例如：

```text
theme-control-height-xs → 某个 sizeToken
theme-control-height-sm → 某个 sizeToken
theme-control-height-md → 某个 sizeToken
theme-control-height-lg → 某个 sizeToken
theme-control-height-xl → 某个 sizeToken
```

不同主题可以重新映射五档，但不能改变用户已经选择的档位语义。

---

# 20. 主题层内部可以按组件族分类，但不增加层级

以前文档中的：

```text
Family Token
```

不再作为“第四层”。

公共组件族规则直接归入主题层，例如：

```text
theme-control-*
theme-surface-*
theme-overlay-*
theme-navigation-*
theme-data-*
theme-feedback-*
theme-selection-*
```

这些只是：

> **主题 Token 的分类。**

不是：

```text
Preset
→ Theme
→ Family
→ Component
```

四层。

正式依赖仍然只有：

```text
Preset
→ Theme
→ Component
```

---

# 21. 外部主题文件的合同

一个正常主题文件应该主要包含：

```text
主题 Token
明亮模式主题 Token
黑暗模式主题 Token
```

例如：

```css
:root,
.is-light {
  --qxframe9a7c2-theme-primary: ...;
  --qxframe9a7c2-theme-surface-bg: ...;
  --qxframe9a7c2-theme-control-height-md: ...;
}

.is-dark {
  --qxframe9a7c2-theme-primary: ...;
  --qxframe9a7c2-theme-surface-bg: ...;
}
```

不应该包含：

```css
/* 不应成为普通主题文件的常态 */
.qxframe9a7c2-button { ... }
.qxframe9a7c2-select { ... }
.qxframe9a7c2-date-picker { ... }
```

如果一个主题必须大量写组件 selector 才能成立，说明：

> CSS Token Schema 还缺少必要的主题控制点。

应先回到 CSS Token 项目补 Schema，而不是让主题生成器长期输出组件样式。

---

# 22. 普通主题与“尺寸预设包”分开

普通主题：

```text
主要覆盖 Theme Token Layer
```

尺寸预设包：

```text
可以有意识地覆盖 Size Tree
```

两者不要混成一个概念。

这样：

```text
换 primary 颜色
```

不会意外改尺寸。

而：

```text
整体大号界面预设
```

才允许明确覆盖：

```text
--qxframe9a7c2-size-*
```

还可以通过：

```text
html font-size
```

做真正的全页面同比例缩放。

---

# 23. Layout / Functional CSS 不属于主题 Token

以下默认不进入主题系统：

```text
display
flex 算法
position
overflow
z-index 协议
pointer-events
功能性 white-space
Grid 24 数学
响应式断点
Popup 定位
Portal 行为
Virtual List 测量
Scroll 算法
Table sticky 算法
```

Token 重构不能把所有 CSS 值都变量化。

---

# 24. Protected / Do Not Touch 合同

## 24.1 Icon Font

冻结：

```text
@font-face
font file
font-family
unicode/content
class → glyph
glyph source
```

图标默认继续继承父级 `color`。

不因为主题重构新增一个全局 icon color。

## 24.2 24 列 Grid 数学

QXFRAME Grid 是 Flex 栅格。

冻结：

```text
24-column contract
span
offset
push
pull
flex-basis %
width %
max-width %
响应式数学关系
```

Grid 的：

```text
g / gx / gy
```

可以消费 Spacing Token。

## 24.3 响应式断点

响应式仍然：

```text
xs / sm / md / lg / xl / xxl
```

组件尺寸仍然：

```text
xs / sm / md / lg / xl
```

两套含义不能混用。

## 24.4 Motion Preset

冻结现有：

```text
.fade
.slider
.move
.zoomIn
以及同类预设
```

的结构、生命周期与方向。

## 24.5 Interaction / Keyboard / Value

不得因为 CSS Token 重构改变现有组件交互合同。

包括但不限于：

```text
Select
TreeSelect
Cascader
DatePicker
TimePicker
ColorPicker
InputOTP
Tags
Menu
Collapse
Rate
Slider
Switch
Transfer
Popup
VirtualFocus
Ripple
```

## 24.6 Overlay / Popup

冻结：

```text
定位
portal
focus scope
关闭策略
Tab scope
Esc
Floating UI
Scroll ownership
```

局部主题 + Portal 的 CSS Variable 继承问题必须在现有 Overlay/Popup 基础设施内解决。

不得新建：

```text
ThemeController
TokenController
```

---

# 25. Popup / Portal 与局部主题

如果：

```text
局部容器设置主题 Token
↓
Select / DatePicker / Menu 打开 Popup
↓
Popup 被 portal 到局部主题范围之外
```

可能丢失 CSS Variable 继承。

本次必须专门验收：

```text
局部 dark Select
局部 primary DatePicker
局部 radius Menu submenu
Dialog 内 Picker
Drawer 内 Picker
嵌套 Popup
```

解决必须基于现有：

```text
portalContainer
OverlayRuntime
Popup
```

等基础设施。

不能通过 JS 建立一套主题变量复制控制器。

---

# 26. 组件 Token 之间禁止互借

禁止：

```text
Select Token
→ Button Token

DatePicker Token
→ Input Token

Card Token
→ Divider Token
```

如果共享稳定规则：

```text
上提到 Theme Token
```

例如：

```text
theme-control-border
theme-control-height-md
theme-surface-divider
```

然后各组件分别读取。

---

# 27. 公共 Token 与私有 Token

公共 Token：

```text
--qxframe9a7c2-...
```

用于：

```text
预设层
主题层
组件层
允许用户覆盖的接口
```

私有 Token：

```text
--_qxframe9a7c2-...
```

只用于组件内部最终解析。

私有 Token：

- 不保证外部稳定；
- 不作为主题生成器输出目标；
- 不进入公共 Token 文档；
- 不应被其他组件读取。

---

# 28. 状态优先级属于 CSS 合同

Token 化不能改变原来的状态优先级。

必须检查重叠状态：

```text
hover + focus
focus + focus-visible
hover + disabled
selected + hover
checked + focus
loading + hover
open + focus
invalid + focus
disabled + selected
```

迁移前后：

```text
最终 computed style
```

必须符合已确认行为。

---

# 29. 当前“视觉零漂移”规则更新

原 v1.5 的绝对 Zero Visual Drift 现在需要调整。

因为已经明确批准：

> **将当前不规则的可缩放奇数尺寸 / 小数尺寸逐步规范到 Size Tree v1。**

因此重构分两类。

## 29.1 A 类：结构迁移

包括：

```text
CSS → SCSS
literal → Token
三层依赖重构
文件拆分
Token 重命名
明暗模式映射整理
```

这些原则上必须：

```text
最终视觉完全等价
```

## 29.2 B 类：明确批准的尺寸规范化

包括：

```text
3 / 5 / 7 / 9 / 11 / 13 / 15 / 17 ...
14.4 / 8.8 等不规则可缩放尺寸
```

这些允许产生 **经过登记的视觉变化**。

但是必须满足：

```text
有旧值
有新值
有原因
有消费者列表
有截图/计算样式对比
有明确批准范围
```

除这些登记项之外，其他视觉变化一律视为回归。

## 29.3 禁止借规范化扩大重设计范围

例如：

```text
13px → 14px
```

被批准，不代表可以顺手：

```text
改变颜色
改变阴影
改变边框
改变布局
改变 hover
改变 padding
```

除非这些也在批准的迁移表中。

---

# 30. CSS Grid / vw / vh 清理也必须单列

虽然最终规范禁止：

```text
CSS Grid
vw
vh
vmin
vmax
fr
```

但已有使用不能机械删除。

每个清理项必须记录：

```text
原选择器
原布局目的
替代 Flex 结构
替代单位
布局截图
computed style
交互验证
```

目标是：

```text
结构统一
+
最终表现等价
```

而不是为了“规则正确”破坏现有页面。

---

# 31. Geometry Safety

CSS 尺寸变成可主题化之后，必须审计 JS 是否存在硬编码尺寸。

重点检查：

```text
Slider
Virtual List
Menu
Tree
Select
DatePicker
TimePicker
Table
Popup
Carousel
Scroll
Transfer
Tags overflow
```

例如 CSS：

```text
row-height
```

改成主题可变，但 JS 仍然：

```js
const rowHeight = 32;
```

就会产生错误。

因此每个可变尺寸必须判断：

```text
纯视觉
还是
JS 几何计算的一部分
```

如果属于后者，要么：

- JS 从实际 DOM 测量；
- 要么通过稳定公开配置同步；
- 要么该值保持 Functional Contract，不开放随意主题变化。

不能只改 CSS。

---

# 32. Source Order 合同

项目禁止 `@layer`，因此源码顺序本身就是优先级合同。

SCSS 拆分后仍必须固定编译顺序。

建议：

```text
1. reset / base
2. preset tokens
3. default theme tokens
4. light/dark mode theme mappings
5. component base
6. component size / appearance
7. component state
8. utilities / documented overrides
```

最终顺序以当前框架实际依赖审计后固定。

不得因为 SCSS 文件排序变化造成：

```text
hover 覆盖 focus
disabled 被 hover 覆盖
dark 被 light 覆盖
local override 失效
```

---

# 33. Token 默认值放在哪里

公共 Token 默认值必须在清晰、可预测的位置集中声明。

不要在组件 root 里重新声明公共默认值导致用户覆盖被遮蔽。

正确：

```css
:root {
  --qxframe9a7c2-button-width: ...;
}

.qxframe9a7c2-button {
  --_qxframe9a7c2-button-width:
    var(--qxframe9a7c2-button-width);
}
```

避免：

```css
:root {
  --qxframe9a7c2-button-width: ...;
}

.qxframe9a7c2-button {
  /* 再次声明同名 public token，可能遮住祖先覆盖 */
  --qxframe9a7c2-button-width: ...;
}
```

---

# 34. 组件根必须重置私有最终 Token

CSS 自定义属性会继承。

嵌套组件可能受到父组件状态污染。

因此每个 Component Root 必须重新初始化本组件的：

```text
--_qxframe9a7c2-...
```

不能假设私有 Token 不会继承。

---

# 35. 预设名不进入 Token 名称

Style / Theme Preset 名称只属于：

```text
配置
生成器
预设文件名称
```

不进入公共 Token 名。

禁止：

```text
--button-pill-width
--rhea-control-height
--compact-input-padding
--blue-theme-card-bg
```

正确：

```text
--qxframe9a7c2-theme-control-height-md
--qxframe9a7c2-button-height
```

不同预设通过重新赋值改变这些 Token。

---

# 36. 主题生成器未来只负责什么

本阶段不开发主题生成器。

CSS Schema v1 冻结后，主题生成器未来主要负责：

```text
读取主题配置
↓
离线计算颜色 / 尺寸映射 / 圆角 / 阴影等
↓
输出静态 theme.css
↓
覆盖 Theme Token Layer
```

普通生成结果不应该生成组件 selector。

如果需要大量：

```text
.qxframe9a7c2-button
.qxframe9a7c2-input
```

说明 CSS Schema 不完整，应回到框架层补 Token。

如果用户明确选择“整体尺寸预设”，生成器未来可以额外输出 Size Tree 覆盖；但这必须与普通主题映射区分。

---

# 37. 参考框架在本项目中的用途

正式参考：

```text
shadcn/ui
Ant Design
Arco Design
Element Plus
Tabler
```

用途是：

```text
统计成熟尺寸值
检查 Token 粒度
检查组件常见几何范围
检查主题能力边界
```

不能：

```text
直接照抄某框架默认视觉
直接拿它的数值覆盖 QXFRAME
直接复制它的组件 DOM
```

本项目首先服从 QXFRAME 自身的组件合同。

---

# 38. Size Tree v1 的统计原则

本次 Size Tree 不是凭感觉写出。

统计范围应包括：

```text
QXFRAME 当前 CSS / SCSS
shadcn 当前样式
Ant Design 当前主题与组件尺寸
Tabler 当前核心变量与组件尺寸
```

统计时要排除：

```text
百分比
Grid 比例
transform 百分比
颜色数字
透明度
z-index
时间
断点
unicode
功能算法常量
```

统计输出至少包括：

```text
数值
总出现次数
QXFRAME 次数
shadcn 次数
Ant Design 次数
Tabler 次数
主要用途
是否已有正式节点
是否为补间节点
```

Size Tree v1 已冻结节点结构，但统计报告仍要作为仓库内的设计依据保存。

---

# 39. 本次实施阶段

## Phase 0 — 当前仓库与基线确认

开始修改前必须读取：

```text
AGENTS.md
AI_WORK_STATE.md
当前 main SHA
当前 PR / Branch 状态
CI
现有 Token 验证脚本
```

不得从历史记忆直接假设仓库状态。

## Phase A — CSS → SCSS 等价迁移

目标：

```text
源码模块化
最终 CSS 等价
```

不做设计重构。

验收：

```text
编译成功
dist 单一 CSS
核心页面视觉一致
状态优先级一致
```

## Phase B — Current Value Inventory

扫描：

```text
rem
px
%
color
shadow
radius
font-size
spacing
component geometry
```

建立：

```text
Token 候选表
功能常量表
禁止单位表
奇数/小数尺寸表
CSS Grid 表
JS Geometry Coupling 表
```

## Phase C — Preset Token Layer

建立：

```text
Size Tree v1
Spacing
Typography
Radius
Border
Color Palette
Shadow
Opacity
Motion
```

所有尺寸型预设按本文规则追溯 Size Tree。

## Phase D — Theme Token Layer

建立完整默认主题：

```text
Color Role
Control
Surface
Overlay
Navigation
Data
Feedback
Selection
Focus
Size Mapping
Spacing Mapping
Radius Mapping
Typography Mapping
```

并把：

```text
Light / Dark
```

作为主题层内部模式映射。

## Phase E — Component Token Layer

逐组件迁移：

```text
Button
Input
Textarea
Select
TreeSelect
Cascader
Picker
Menu
Card
Table
Switch
Slider
...
```

检查：

```text
Component → Theme
```

单向依赖。

禁止：

```text
Component → Preset
Component → Other Component
```

## Phase F — 私有最终 Token 与状态

统一：

```text
--_qxframe9a7c2-...
```

并检查：

```text
hover
focus
focus-visible
active
selected
checked
disabled
loading
open
invalid
```

状态优先级。

## Phase G — 尺寸规范化

按批准映射表处理：

```text
奇数
不规则小数
脱离 Size Tree 的可缩放尺寸
```

此阶段是唯一允许已登记尺寸视觉变化的阶段。

## Phase H — 禁止布局/单位清理

审计并迁移：

```text
vw
vh
vmin
vmax
fr
CSS Grid
```

使用：

```text
Flex
%
rem
calc()
position
```

等框架允许方式重构。

必须单项验证。

## Phase I — Runtime Color Cleanup

清理：

```text
组件 runtime color-mix
主题运行时色阶生成
旧 gray/grey 冲突
无意义 alias
```

默认最终值必须与已确认颜色方案一致，除非另有批准。

## Phase J — State Class Audit

执行：

```text
is-* conflict matrix
```

有冲突保留，无冲突再原子迁移。

## Phase K — Portal / Local Theme

验证局部主题和 Portal。

## Phase L — CI / Browser Matrix

加入：

```text
Token 图验证
跨层依赖验证
Undefined Token
Cycle
Dead public token
Component → Preset 禁止检查
Component → Component 禁止检查
禁止单位检查
CSS Grid 禁止检查
Size Tree 非法尺寸检查
浏览器 computed-style 检查
```

## Phase M — Schema v1 Freeze

冻结：

```text
Token 命名
三层依赖
Size Tree v1
Light/Dark 主题规则
公共覆盖规则
SCSS 源文件结构合同
dist CSS 合同
主题文件合同
```

只有完成本阶段后，才能开始主题生成器项目。

---

# 40. CI 建议增加的硬检查

至少增加：

```text
1. Component Token 不得引用 Preset Token
2. Component Token 不得引用其他 Component Token
3. Theme Token 可引用 Preset Token
4. Size 型 Preset 必须追溯到 Size Tree
5. 不得出现未定义 Token
6. 不得出现 Token cycle
7. 不得新增 vw/vh/vmin/vmax
8. 不得新增 fr / display:grid / inline-grid
9. 不得新增未经批准的 px 视觉尺寸
10. 不得新增未经批准的奇数/小数可缩放尺寸
11. Grid 24 数学不得改变
12. icon font mapping 不得改变
13. 默认主题 Light/Dark 都完整
14. dist CSS 由 SCSS 唯一构建
```

---

# 41. 文档与自动清单

仓库应维护自动生成的 Token Manifest，至少记录：

```text
Token 名称
所属层
所属设计域
默认值
依赖对象
是否公开
是否主题可覆盖
是否尺寸型
是否明暗模式相关
消费者
```

并自动生成依赖图：

```text
Preset
↓
Theme
↓
Component
↓
Private
```

任何跨层违规应由 CI 发现，不依赖人工记忆。

---

# 42. 最终验收清单

## 三层架构

- [ ] 预设 Token 层完成。
- [ ] 主题 Token 层完成。
- [ ] 组件 Token 层完成。
- [ ] Component 不直接读取 Preset。
- [ ] Component 不读取其他 Component。
- [ ] 私有最终 Token 不对外暴露为主题接口。

## Size Tree

- [ ] Size Tree v1 共 46 个节点。
- [ ] Token 名按顺序编号，不按实际 px 命名。
- [ ] 默认值全部使用 rem。
- [ ] 默认节点不包含奇数物理尺寸。
- [ ] 1px 精确边框作为例外处理。
- [ ] 其他尺寸型预设从 Size Tree 派生。
- [ ] 组件五档 API 仍为 xs/sm/md/lg/xl。
- [ ] 当前奇数/小数尺寸全部有迁移记录。

## 主题

- [ ] 默认主题内置在框架 CSS。
- [ ] Light/Dark 属于主题层内部映射。
- [ ] 组件不知道当前 Light/Dark。
- [ ] 外部普通主题主要覆盖 Theme Token。
- [ ] 普通主题不需要复制组件 selector。
- [ ] 尺寸预设覆盖与普通主题映射概念分开。

## 单位与布局

- [ ] 可缩放视觉尺寸优先 rem。
- [ ] 百分比仅用于相对布局/数学。
- [ ] 精确 1px 线允许保留。
- [ ] 无 vw。
- [ ] 无 vh。
- [ ] 无 vmin/vmax。
- [ ] 无 fr。
- [ ] 无 CSS Grid 布局。
- [ ] 24 列 Grid 仍由 Flex + % 实现。

## SCSS

- [ ] 源码已模块化 SCSS。
- [ ] 发行仍为一个完整 CSS。
- [ ] SCSS 未建立第二套主题系统。
- [ ] 无深层嵌套导致优先级异常。
- [ ] 不滥用 @extend。
- [ ] 编译顺序稳定。

## 行为与保护合同

- [ ] Icon Font mapping 未变。
- [ ] 24 列 Grid 数学未变。
- [ ] Responsive breakpoint 未变。
- [ ] Motion lifecycle 未变。
- [ ] Interaction / Keyboard / Value 未变。
- [ ] Popup / Overlay 行为未变。
- [ ] JS Geometry Coupling 已审计。

## 视觉

- [ ] A 类结构迁移零视觉漂移。
- [ ] B 类尺寸规范化变化全部有登记。
- [ ] 未登记视觉变化为 0。
- [ ] Light 默认主题验收通过。
- [ ] Dark 默认主题验收通过。
- [ ] 全组件状态组合验收通过。

---

# 43. 最高优先级

本阶段优先级正式更新为：

```text
1. 组件交互与行为合同不变
2. Protected Contract 不变
3. 三层 Token 单向依赖正确
4. Size Tree 与单位协议正确
5. A 类结构迁移零视觉漂移
6. B 类尺寸规范化只发生在批准范围
7. Light / Dark 主题映射正确
8. Component Token 归属正确
9. 状态优先级正确
10. SCSS 源码结构清晰
11. 删除旧 alias / 重复体系
12. 代码整洁
```

不得为了：

```text
变量名更漂亮
文件更少
选择器更短
Token 更少
SCSS 更炫
```

牺牲前面的合同。

---

# 44. 本阶段明确不做

不开发：

```text
Theme Generator UI
Theme Studio
主题配置面板
在线调色器
主题市场
运行时 ThemeController
运行时 TokenController
```

这些属于后续独立的：

```text
QXFRAME9A7C2 Theme Generator
```

项目。

本阶段只负责把 CSS Schema 做到：

> **后续生成器只需要输出 Theme Token，即可稳定改变整个框架主题。**

---

# 45. 最终冻结摘要

QXFRAME9A7C2 CSS Token Schema v1 的目标结构：

```text
html font-size
      ↓
Size Tree
      ↓
其他尺寸型 Preset
      ↓
Preset Token Layer
      ↓
Theme Token Layer
  ├ Default Theme
  ├ Light Mapping
  └ Dark Mapping
      ↓
Component Token Layer
      ↓
Private Resolved Token
      ↓
CSS Property
```

硬规则：

```text
Component 不得跳过 Theme 读取 Preset
Theme 是组件唯一的公共上游
Light/Dark 不新增层级
Size Tree 使用顺序编号
Size Tree 默认只使用规则偶数阶梯
可缩放视觉尺寸以 rem 为主
允许 %
允许精确 1px 边框
禁止 vw/vh/vmin/vmax
禁止 fr
禁止 CSS Grid
布局统一 Flex
源码 SCSS 模块化
发行单一完整 CSS
```

尺寸变化有三种不同手段：

```text
整页同比例缩放
→ html font-size

改变主题尺寸搭配
→ Theme Token 映射

改变整棵尺寸曲线
→ 明确的 Size Preset 覆盖
```

其中日常主题修改优先使用：

```text
Theme Token 映射
```

而不是修改组件 CSS，也不是让组件直接读取 Size Tree。

---

# 46. 后续主题生成器的接口边界

等 CSS Schema v1 冻结后，主题生成器接收：

```text
颜色
明亮 / 黑暗模式配置
尺寸风格
间距风格
字体
圆角
阴影
Focus Visual
组件级高级覆盖
```

然后输出：

```text
静态 theme.css
```

正常情况下只包含：

```text
Theme Token Layer
```

如果用户明确选择整套 Size Preset，才额外输出：

```text
Size Tree Override
```

主题生成器不能成为修补 CSS Schema 缺陷的工具。

如果某种视觉风格无法通过 Theme Token 表达：

> 回到 CSS Token System 增加合理的主题控制点，重新冻结 Schema，再继续生成器。

---

**v1.6 结论：**

> QXFRAME 的 CSS 设计体系不再以“每个组件自己拥有一套任意尺寸和值”为核心，而是建立统一的预设材料层、主题决策层和组件消费层。  
> 所有可缩放尺寸以 `html font-size → Size Tree` 为共同母尺，再由主题决定如何组合，组件只消费主题结果。  
> 明亮/黑暗模式属于主题层内部映射；SCSS 只负责源码组织和生成，最终仍发行一个完整 CSS 文件。
