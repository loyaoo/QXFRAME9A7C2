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