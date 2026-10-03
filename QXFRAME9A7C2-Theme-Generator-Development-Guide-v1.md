# QXFRAME9A7C2 Theme Generator 独立开发手册 v1


> ## 2026-10-03 Style Recipe v2 authority addendum
>
> This addendum supersedes older examples in this guide where they conflict.
>
> - **Style responsibility:** Style owns component geometry/treatment and normal density/spacing. The canonical Style ids are **Vega, Nova, Maia, Lyra, Mira, Luma, Sera, Rhea**, translated from the public shadcn/create Style recipes into QXFRAME public tokens. Do not invent a parallel Balanced/Soft/Precision/Compact vocabulary.
> - **Density:** Density is no longer a first-class Theme Studio control. Legacy `density` remains readable for old Config/import compatibility only. New Studio output keeps it at `default`; Style owns ordinary density.
> - **Radius:** expose exactly five choices: **Default / None / Small / Medium / Large**. Default follows the selected Style; explicit Radius changes the shared radius scale. Style maps different families/components to different levels (for example Card/surface and Button/action are not forced to the same radius).
> - **Chart:** Chart Color selects one hue/source. The eight chart series are restrained monochrome steps of that hue using lightness/chroma variation. Do not expose Mixed/rainbow chart presets in the normal Studio.
> - **Control separation:** Style = geometry/treatment; Base Color = neutral/surface family; Theme Color = primary/brand semantic color; Chart Color = chart hue; Typography = fonts; Radius = shared radius scale; Menu controls = Menu-only treatment; Advanced = explicit low-level overrides.
> - **Style fidelity:** use shadcn/create's public `apps/v4/registry/styles/style-*.css` as the data reference for relative control height, spacing, radius, Switch, Slider, Card, Input, Select, Tabs, Popup/Dialog treatment. Translate those decisions through QXFRAME tokens; do not copy Tailwind selectors/classes into QXFRAME output.
> - **Schema extension rule:** required Palette/Theme inputs remain 4,028 with the existing interface hash. Additive optional Component slots may be registered when an existing component rule hardcodes geometry that blocks a Style expression; fallback behavior must preserve the previous default when those optional slots are absent.
> - **Color serialization:** production/generated Theme output uses `rgb()` / `rgba()`. `color(srgb ...)` may be parsed only as import compatibility. No live `color-mix()` is required in Core/Studio styling.
> - **Regression matrix:** cover all 8 Styles, all 5 Radius choices, representative Base/Theme colors, Light/Dark, monochrome Chart Color, and actual Switch/Slider/Card/Button geometry in Chromium.
>

> 日期：2026-10-01  
> 仓库：`loyaoo/QXFRAME9A7C2`  
> 本文只负责 **Theme Generator / Theme Studio / Theme CSS 输出**。  
> **前置条件：CSS Design Token System 已按独立开发手册完成并冻结 Schema v1。**  
> 在 CSS Token Schema 未冻结之前，禁止提前实现 Generator，避免生成器反向绑架 CSS 架构。

---

# 0. 项目定位

Theme Generator 不是 Runtime ThemeController。

它是：

```text
少量高层设计输入
        ↓
Generator
        ↓
完整静态 CSS Token 文件
        ↓
后加载覆盖 QXFRAME 默认 Token
```

最终运行方式：

```html
<link rel="stylesheet" href="qxframe9a7c2.css">
<link rel="stylesheet" href="my-theme.css">
```

`my-theme.css` 后加载。

QXFRAME 组件运行时仍然只依赖 CSS Variable。

不增加：

```text
ThemeController
TokenController
runtime color-mix engine
component runtime style injection
CSS-in-JS theme dependency
```

---

# 1. Generator 前置门槛

以下条件全部满足才能开始开发 Generator：

- CSS Token Schema v1 已冻结。
- Palette / Role / Foundation / Family / Component / Private ownership 已确定。
- Switch / Slider / Button / Input / Card / Menu 等样板组件已证明 Token 表达能力足够。
- Light / Dark token contract 已确定。
- Public themeable token 列表已固定。
- Private resolved token 不允许 Generator 输出。
- Geometry Safety 已完成。
- Token Graph CI 已完成。
- 核心 CSS 默认主题无需 Generator 即可完整工作。

如果其中一项未完成：

> 返回 CSS Token System 项目继续完善，不在 Generator 中补洞。

---

# 2. Theme Generator 核心原则

## 2.1 输入少，输出完整

普通用户不编辑几百个 token。

用户设置的是：

```text
Style
Base Color
Theme Color
Semantic Colors
Chart Color
Typography
Radius
Density
少量 Component Preset
```

Generator 输出完整 public token set。

---

## 2.2 Preset 只存在于 Generator

可以有：

```text
Soft
Sharp
Mira-like
Luma-like
Enterprise
Rounded
Compact
```

但生成 CSS 中不能出现：

```css
--luma-switch-width
--soft-card-radius
```

Preset 只是规则集合。

---

## 2.3 Generator 不生成 Component CSS

Theme CSS 只能主要包含：

```css
:root { --token: value; }
[data-qxframe9a7c2-theme="dark"] { --token: value; }
```

禁止输出：

```css
.qxframe9a7c2-switch { ... }
.qxframe9a7c2-button:hover { ... }
```

组件规则必须全部存在于框架 CSS。

如果某个 Style 必须靠额外 selector 才能实现：

> 说明 CSS Token System 不够细，先回 CSS Token 项目补 token，再回来。

---

# 3. 建议 Theme Config Schema

第一版建议：

```js
{
  schema: 1,

  style: "vega",

  baseColor: "neutral",

  palette: {
    red: null,
    orange: null,
    yellow: null,
    lime: null,
    green: null,
    teal: null,
    cyan: null,
    blue: null,
    purple: null,
    pink: null,
    grey: null
  },

  roles: {
    primary: "blue",
    success: "green",
    warning: "orange",
    error: "red",
    info: "cyan"
  },

  chart: {
    color: "primary"
  },

  typography: {
    body: "system-ui",
    heading: "inherit",
    mono: "ui-monospace",
    baseSize: 14
  },

  radius: "default",

  density: "default",

  components: {
    menu: {
      color: "default",
      appearance: "solid",
      accent: "subtle"
    }
  }
}
```

---

# 4. 普通配置与高级配置分离

## 普通模式

参考 shadcn Theme 页的成功经验，主要配置：

```text
Style
Base Color
Theme
Chart Color
Heading Font
Body Font
Radius
Density
Menu Color
Menu Appearance
Menu Accent
```

Icon Library 如果 QXFRAME 后续具备稳定统一 Icon API，再加入。

## 高级模式

才开放：

```text
Palette Seeds
Semantic Role Seeds
Shadow Profile
Border Profile
Motion Profile
Specific Component Token Override
```

不能一开始把 500 个 token 摊给用户。

---

# 5. Style Preset 的职责

Style 是一组设计决策，不是一个 CSS class。

一个 Style 可以改变：

```text
shape
radius default mapping
border strength
surface elevation
control fill strategy
density default
switch geometry
slider geometry
state visual strength
shadow profile
```

不能改变：

```text
DOM structure
keyboard behavior
focus scope
value behavior
popup close behavior
loading semantics
disabled semantics
Grid contract
virtualization contract
```

### 示例

```js
const styles = {
  soft: {
    foundation: {
      shadowProfile: "soft",
      borderProfile: "subtle"
    },
    family: {
      controlFill: "filled"
    },
    components: {
      switch: {
        width: 44,
        height: 22,
        thumbWidth: 24,
        thumbHeight: 18
      },
      slider: {
        trackHeight: 8,
        thumbWidth: 24,
        thumbHeight: 16
      }
    }
  }
}
```

Generator 最终把这些规则解析成标准 token。

---

# 6. 配置维度必须正交

这是 Theme Generator 最重要的规则之一。

不同选项不能互相偷偷重置。

推荐计算优先级：

```text
1. Framework Default Config
2. Style Preset
3. Base Color
4. Theme / Semantic Color
5. Chart Color
6. Typography
7. Radius
8. Density
9. Component Preset
10. Advanced Explicit Override
```

例：

```text
Style = Soft
```

给默认 `radius = large`。

用户随后：

```text
Radius = Small
```

最终必须 Small。

切换：

```text
Theme Blue → Cyan
```

只能改变颜色，不得把 Radius / Slider thickness / Switch geometry 重置。

切换：

```text
Density Default → Compact
```

不得改变 Theme Color。

---

# 7. Base Color

Base Color 不是 Primary。

它控制中性色体系：

```text
background
surface
muted
border
text
placeholder
control neutral
```

可以预设：

```text
Neutral
Stone
Zinc
Mauve
Olive
Mist
Taupe
```

这些本质上是不同 neutral hue/chroma 曲线。

用户也可以：

```text
Base Color = Custom
Grey Seed = #xxxxxx
```

Generator 再生成完整 neutral 13 阶。

---

# 8. Palette Color Generator

用户可以修改物理预设色：

```text
red
orange
yellow
lime
green
teal
cyan
blue
purple
pink
grey
```

输入允许：

```text
HEX
RGB
HSL
OKLCH
```

但内部必须 normalize。

最终输出统一为：

```css
--qxframe9a7c2-palette-blue-7: 22, 119, 255;
```

不要把原始 `#hex` 直接混入一部分 token、RGB 放另一部分。

---

# 9. 13 色阶生成算法

不能简单：

```text
seed + white
seed + black
```

一条直线处理所有颜色。

Generator 应使用感知色彩空间，例如 OKLCH / OKLab，至少考虑：

```text
lightness curve
chroma curve
hue stability
gamut clipping
light/dark usage
```

### 彩色 Palette

目标：

- 中部保留品牌辨识。
- 浅色不发灰、不脏。
- 深色不过黑。
- hue 漂移受控。
- 高 chroma 颜色避免超 gamut 后剪裁造成断层。

### Neutral

单独算法。

不能沿用彩色 palette 算法。

Base Color preset 可以决定少量 chroma / hue 倾向：

```text
Neutral = 近 0 chroma
Stone = 偏暖
Zinc = 冷中性
Mauve = 微紫
Olive = 微黄绿
Mist = 微冷柔和
Taupe = 微暖灰
```

---

# 10. Theme Role 生成

Role 可以引用 Palette：

```text
primary = blue
success = green
warning = orange
error = red
info = cyan
```

也可以独立 seed：

```text
primary = #7c3aed
```

独立 seed 时：

```text
生成 primary-1~13
```

但不修改 physical purple。

---

# 11. Light / Dark 生成

Dark 不是简单反转数组。

Generator 应为同一 Theme Config 同时输出：

```text
Light token values
Dark token values
```

至少处理：

```text
background/surface hierarchy
text hierarchy
border hierarchy
primary/state role
on-color foreground
control fill
shadow/elevation
chart palette
```

输出：

```css
:root,
[data-qxframe9a7c2-theme="light"] {
  ...
}

[data-qxframe9a7c2-theme="dark"] {
  ...
}
```

Component CSS 不知道 light/dark。

---

# 12. On-color / Foreground 算法

必须生成：

```text
on-primary
on-success
on-warning
on-error
on-info
```

不能统一白字。

建议基于相对亮度 / APCA 或成熟对比策略选择前景，并为设计结果设置最低可读性阈值。

Theme Studio 应对明显不合格组合给出提示。

Generator 输出最终 RGB 值；不要依赖 runtime `contrast-color()`。

---

# 13. Chart Color

Chart 是独立设计维度，但颜色必须克制：**一套图表只使用一个色相族**，通过 lightness / chroma / saturation 的离散阶梯区分 series，不生成 Warm / Cool / Mixed 等彩虹方案。

输入：

```text
Chart Color = Primary / Neutral / Blue / Purple / Cyan / Teal / Green / Lime / Yellow / Orange / Red / Pink / Grey
```

输出：

```css
--qxframe9a7c2-theme-chart-1
--qxframe9a7c2-theme-chart-2
...
--qxframe9a7c2-theme-chart-8
```

要求：

- 同一 Chart Color 的 8 个 series 保持同一 hue family，只改变可感知明暗与 chroma。
- Light/Dark 分别生成适合各自背景的阶梯。
- 默认 Chart Color = Primary；用户显式选择其他 Chart Color 后，Theme/Primary 改变不得覆盖它。
- 不拿 success/error/warning 等语义色拼凑多彩图表。

---

# 14. Typography Generator

普通配置：

```text
Body Font
Heading Font
Mono Font
Base Size
```

可以派生：

```text
font-size scale
line-height scale
heading weight
body weight
```

但注意：

- Generator 只输出 CSS font stack / token。
- 不自动下载第三方字体。
- Theme Studio 可以提供字体推荐，但输出 CSS 必须能在资源缺失时 fallback。
- 字体变化不能改变 JS 几何协议。

---

# 15. Radius Generator

用户普通设置固定为 shadcn/create 同样的五档：

```text
Default
None
Small   = 0.45rem
Medium  = 0.625rem
Large   = 0.875rem
```

`Default` 表示跟随当前 Style 的默认 radius；其余四档是用户显式覆盖。

Radius **不是把所有组件设成同一个圆角**。Generator 先生成 Foundation radius scale：

```text
xs
sm
md
lg
xl
pill
circle
```

随后由 Style 把组件族映射到不同层级，例如：

```text
Button / Input / Select -> control/action tier
Tabs / Menu item        -> navigation tier
Table / Tag / Badge     -> data tier
Popover / Select popup  -> popup tier
Card / Modal surface    -> surface tier
Switch / Slider         -> own track/thumb tier
```

因此同一个 Medium 主题中，Card/Popup 可以明显比 Button/Input 更圆，这正是 create 的实际做法。显式 `Radius` 只替换 scale 数值，不破坏 Style 的组件层级映射。

---

# 16. Density Compatibility

Theme Studio 普通面板不再提供独立 Density 选项。create 风格下，控件高度、padding、gap、Card spacing、Switch/Slider geometry 属于 **Style recipe** 的职责，避免 Style 与 Density 两个入口同时改同一组尺寸而职责重叠。

Config v1 暂时保留：

```text
compact / default / comfortable
```

仅用于旧 Config/Import 兼容。非 `default` 值作为显式 legacy override，在 Style 之后覆盖共享 control/table spacing；新主题不要依赖它作为常规设计维度。后续 Config schema 大版本可移除。

---

# 17. Component Preset

只开放少量真正有高层设计意义的组件配置。

初期建议只有：

```text
Menu Color
Menu Appearance
Menu Accent
```

以后如果有充分价值，再考虑：

```text
Button treatment
Input treatment
```

不要开放：

```text
Switch width
Slider thumb width
Input padding-left
```

这些是底层 token，不是普通用户配置。

高级模式可以允许 manual override。

---

# 18. Theme CSS 输出契约

生成文件：

```text
qxframe-theme-<name>.css
```

顶部：

```css
/*
 * QXFRAME9A7C2 Theme
 * Theme Schema: 1
 * Generator Version: x.y.z
 * Generated: ...
 */
```

原则：

1. 输出完整 public theme token set。
2. 不输出 private `--_qxframe...` token。
3. 不输出组件 selector。
4. 不输出 `!important`。
5. 不使用更高 specificity 抢框架 CSS。
6. 依赖“后加载”覆盖。
7. 输出顺序稳定，保证 git diff 可读。
8. 相同 config 必须 deterministic 生成完全相同内容。

---

# 19. CSS Cascade 契约

框架：

```html
<link href="qxframe9a7c2.css" rel="stylesheet">
```

主题：

```html
<link href="my-theme.css" rel="stylesheet">
```

Theme CSS 后加载。

Generator 使用与 core CSS 相同的低 specificity boundary，例如：

```css
:root,
[data-qxframe9a7c2-theme="light"] {
  ...
}

[data-qxframe9a7c2-theme="dark"] {
  ...
}
```

不能生成：

```css
html:root
body[data-theme]
!important
```

---

# 20. Complete Theme vs Patch Theme

默认导出应为 **Complete Theme**。

即使用户只改：

```text
Primary = Cyan
```

导出也建议完整输出 Theme Schema public tokens。

原因：

- 切换主题没有残留变量。
- 不依赖前一个主题。
- 可复现。
- 可独立缓存。
- CI diff 稳定。

可以另提供高级：

```text
Export Patch
```

但不作为默认行为。

---

# 21. Theme Schema Version

Theme Config：

```json
{
  "schema": 1
}
```

Generated CSS：

```css
/* Theme Schema: 1 */
```

框架新增 token 时：

- Core CSS 自带 default fallback。
- 旧 Theme CSS 继续能工作。
- Theme Studio 检测旧 schema，提示重新生成。
- 禁止因为新增一个 token 让旧主题直接报废。

---

# 22. Generator 内部架构

建议纯函数流水线：

```text
parseConfig()
↓
normalizeConfig()
↓
applyStylePreset()
↓
applyBaseColor()
↓
applyThemeColors()
↓
applyChart()
↓
applyTypography()
↓
applyRadius()
↓
applyDensity()
↓
applyComponentPresets()
↓
applyExplicitOverrides()
↓
validateTokens()
↓
serializeCss()
```

不要写成一个巨型：

```js
generateTheme() {
  if (...) ...
  if (...) ...
  if (...) ...
}
```

---

# 23. Data Model

建议内部统一成：

```js
{
  light: {
    tokenName: value
  },
  dark: {
    tokenName: value
  }
}
```

Generator 各步骤修改标准 token map。

Style Preset 不直接拼 CSS 字符串。

最后统一 serialize。

---

# 24. Validation

Generator 必须校验：

```text
unknown config key
invalid color
invalid enum
unsupported font value
token missing
private token output
unknown public token
non-deterministic output
light/dark incomplete
foreground contrast warning
invalid CSS value
```

开发模式下：

```text
unknown key = error
```

不要静默吞掉配置 typo。

---

# 25. Theme Studio 页面定位

Theme Studio 不再是“几个 color picker + demo”。

布局建议：

```text
左：Config Panel
右：Commercial Preview Canvas
```

参考 shadcn Theme 页最值得借鉴的是：

> 少量配置可以驱动大量真实业务组合场景。

Preview 必须使用真正 QXFRAME 组件。

不能自制：

```text
假 Card
假 Input
假 Button
```

---

# 26. Theme Studio 配置面板

普通面板职责必须互不重叠：

```text
Style        -> 整套组件 recipe：尺寸、间距、组件族圆角映射、边框/阴影 treatment、Switch/Slider geometry
Base Color   -> Neutral/background/surface/text/border 中性色体系
Theme Color  -> Primary 与语义主题色
Chart Color  -> 单一色相的 8 阶图表序列
Heading Font -> 标题字体
Body Font    -> 正文字体
Radius       -> 5 档基础圆角 scale；组件仍按 Style 的层级映射消费
Menu         -> Menu Color / Appearance / Accent
Light/Dark   -> 预览模式
```

Density 不再作为普通面板入口；只保留旧 Config 导入兼容。

高级抽屉：

```text
Palette Seed
Semantic Seed
Shadow
Border
Motion
Specific Component Token
```

---

# 27. Commercial Preview

不要按“组件 API 文档”排列。

使用组合卡片：

```text
Analytics Dashboard
Settings Form
Profile
Invoice
Team Invite
Upload
Notifications
Scheduling
Table / Transactions
Navigation
Dialog
Empty State
Error State
Charts
```

覆盖：

```text
Button
Input
Textarea
Select
Picker
Switch
Slider
Checkbox
Radio
Badge
Tag
Card
Menu
Tabs
Table
List
Dialog
Drawer
Tooltip
Alert
Message
Progress
Pagination
Calendar
Upload
```

这样才能真实暴露：

```text
neutral 太脏
边框层级乱
radius 失衡
density 太挤
shadow 太重
primary 抢层级
dark mode 刺眼
```

---

# 28. Randomize / Lock

shadcn Theme Studio 的随机组合值得吸收。

可以支持：

```text
Randomize
Lock individual dimension
Reset
```

例如锁定：

```text
Radius = Small
```

Randomize 时：

```text
Style / Base / Theme / Font 改变
Radius 不变
```

Randomize 必须只在合法 preset 设计空间内组合，不能随机几百个 token。

---

# 29. Import / Export

至少：

```text
Export CSS
Export Config JSON
Import Config JSON
Copy CSS
Reset
```

Config JSON 是 source of truth。

CSS 是构建产物。

不要从生成后的 CSS 反向推导 Theme Config。

---

# 30. Generator 与 Core CSS 的兼容策略

Generator 只认一个冻结的 Public Token Manifest，例如：

```json
{
  "schema": 1,
  "tokens": [...]
}
```

不要通过正则扫描 CSS 临时猜有哪些变量。

Core CSS Token Schema 更新时：

1. 更新 manifest。
2. 更新 generator schema。
3. 迁移 preset。
4. 跑完整生成测试。

---

# 31. Generator 测试矩阵

至少：

```text
8 Style
× 5 Theme Color
× 3 Base Color
```

Generator 代表矩阵为 120 套 Complete Theme，并轮换覆盖 5 档 Radius、Chart Color 与 Menu 组合；浏览器验收再覆盖代表 Style × Light/Dark。

不要求做全部组合截图，但要：

- token generation property tests。
- 代表性 visual snapshots。
- 浏览器页面组合 smoke test。

重点检测 orthogonality：

```text
改 Theme Color 不应改 geometry。
改 Radius 不应改 color。
改 Density 不应改 primary。
改 Font 不应重置 Style。
```

---

# 32. Generator 性能

这是离线/交互式生成器，不是组件每帧 runtime。

允许：

```text
OKLCH calculations
color gamut mapping
token graph expansion
full CSS serialization
```

但 Theme Studio 实时预览仍应：

- debounce 高频 color input。
- 一次性替换 `<style>` / stylesheet。
- 避免每个 token 单独 `documentElement.style.setProperty()` 造成大量重计算。
- Preview 更新后按一帧批量刷新。

最终用户生产环境优先加载生成好的静态 CSS。

---

# 33. 生成器不负责的事情

明确禁止：

```text
修改 Component DOM
修改 Keyboard behavior
修改 focus contract
修改 Overlay architecture
动态接管 Motion lifecycle
修复 CSS Token 缺口
创建新的私有 token
给组件注入 selector
```

发现缺口：

> 回 CSS Token System 修改并重新冻结 schema。

---

# 34. 开发阶段

## Phase TG-A — Schema Reader

读取冻结的 CSS Token Manifest。

## Phase TG-B — Config Model

实现 config schema、默认值、校验。

## Phase TG-C — Color Engine

实现：

```text
parse color
normalize
palette 13-step
neutral algorithm
role algorithm
on-color
light/dark
chart palette
```

## Phase TG-D — Design Presets

实现：

```text
Style
Radius
Density
Typography
Component preset
```

## Phase TG-E — CSS Serializer

输出 deterministic 完整 Theme CSS。

## Phase TG-F — Import / Export

Config JSON / CSS。

## Phase TG-G — Theme Studio

商业化 Preview。

## Phase TG-H — Style Recipe Library

Style 维度直接采用 shadcn/create 已公开并经过实际产品验证的八套 recipe 作为设计参考与命名：

```text
Vega / Nova / Maia / Lyra / Mira / Luma / Sera / Rhea
```

QXFRAME **不复制 Tailwind selector/utility 实现**，而是把每套 recipe 的可表达设计决策翻译为已冻结的 Public Theme / Optional Component Token：control height、padding、family radius tier、Card spacing、Switch/Slider geometry、border/shadow treatment 等。

颜色、Base Color、Chart Color、Radius、Typography、Menu 仍是独立维度；Style 不应偷偷重置这些用户显式选择。

## Phase TG-I — Regression Matrix

多 Style × Color × Light/Dark × Radius × Density。

---

# 35. Theme Generator 验收

- [ ] CSS Token Schema v1 已冻结后才开始。
- [ ] Generator 不改变 Core CSS architecture。
- [ ] Generator 不产生 component selector。
- [ ] Generator 不输出 private token。
- [ ] Style 名称不进入 token 名称。
- [ ] HEX/RGB/HSL/OKLCH 可正确 normalize。
- [ ] Palette 13 阶可生成。
- [ ] Neutral 使用独立算法。
- [ ] Role 13 阶可生成。
- [ ] Light/Dark 独立生成，不是简单 reverse。
- [ ] on-color 自动计算。
- [ ] Chart palette 独立。
- [ ] Radius 与 Style 正交。
- [ ] Density 与 Style 正交。
- [ ] Typography 不重置其他维度。
- [ ] Component Preset 不影响非目标组件。
- [ ] Explicit Override 最后生效。
- [ ] 相同 Config 输出完全 deterministic。
- [ ] Complete Theme 无残留变量问题。
- [ ] Theme Schema 有版本。
- [ ] 旧 schema 有兼容/升级策略。
- [ ] Preview 使用真实 QXFRAME。
- [ ] Randomize 只组合高层合法 preset。
- [ ] Export Config JSON 是 source of truth。
- [ ] 生产环境最终只需要后加载 CSS。
- [ ] 不引入 ThemeController / TokenController runtime。

---

# 36. 与 shadcn / Ant / Arco / Element Plus 的借鉴边界

## shadcn

借鉴：

```text
Style
Base Color
Theme
Chart Color
Typography
Radius
少量 component treatment
商业化 Preview
```

以及“配置项少但设计变化明显”的 Theme Studio UX。

不复制其多套 style-specific component CSS；QXFRAME 应通过已冻结的 Component Token 实现同类表达能力。

## Ant Design

借鉴：

```text
Seed + algorithm + component token
Dark/Compact 可组合
```

但算法只存在 Generator，最终输出静态 CSS。

## Arco Design

借鉴：

```text
稳定色阶
text/border/fill/background 使用等级
大量 component token
```

## Element Plus

借鉴：

```text
global/common → component variables
CSS Variable override
```

QXFRAME 最终保持更严格的 Token Manifest 和 schema 版本。

---

# 37. 最终工作顺序

严格执行：

```text
① CSS Design Token System
   完成全部组件 Token 审计
   完成 State Resolved Token
   完成 Geometry Safety
   清理 runtime mix
   冻结 CSS Token Schema v1

             ↓

② Theme Generator
   配置模型
   颜色算法
   Style preset
   static theme.css
   Theme Studio
```

禁止两边同时边做边改 schema。

原因：

> 如果 Generator 开发过程中不断发现 CSS 不够表达，又回头添加 token，会导致 Generator、Theme Studio、Preview、CSS 四套东西一起反复重构。

因此本项目明确采用：

**先完善 CSS 设计语言表达能力，再开发生成器。**
