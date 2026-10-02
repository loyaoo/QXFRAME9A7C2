# QXFRAME9A7C2 Theme Generator 独立开发手册 v1

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
少量 Component Preset
```

Generator 输出完整 public token set。

---

## 2.2 Preset 只存在于 Generator

可以有：

```text
Vega
Nova
Maia
Lyra
Mira
Luma
Sera
Rhea

这些是 Style 维度，不是 QXFRAME 商业 Theme Preset 名称。QXFRAME 的 Signal / Ledger / Harbor 等 Preset 只是多个独立维度的组合包。
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

  style: "nova",

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

Style 是完整的组件视觉 recipe，不是 CSS class，也不是颜色 Theme。

当前 Style 直接以 shadcn/ui `/create` 的公开 Style 体系作为成熟参考数据：

```text
Vega — clean / familiar
Nova — reduced spacing
Maia — rounded / generous
Lyra — boxy / sharp
Mira — compact UI
Luma — fluid / soft
Sera — editorial / typographic
Rhea — soft / compact
```

QXFRAME 不复制 shadcn 的组件 selector；Generator 把这些 recipe 的视觉比例映射到 QXFRAME 已冻结的 public Theme / Component Token。

一个 Style 可以改变：

```text
control height / padding / gap / font sizing
component-relative radius mapping
Card spacing / elevation
Switch geometry
Slider rail / thumb geometry
Popup / Menu / Tabs treatment
border / shadow strength
compactness / generosity
```

Style 不能改变：

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

Density 不再作为普通配置的第二 owner。紧凑/宽松属于 Style recipe；否则 `Style=Nova + Density=Comfortable` 之类组合会产生职责冲突。

---

# 6. 配置维度必须正交

不同选项不能互相偷偷重置。当前计算职责：

```text
1. Framework frozen defaults
2. Style recipe（组件几何/视觉语言）
3. Base Color（neutral family）
4. Theme / Semantic Color
5. Chart Color（单色数据色系）
6. Typography
7. Radius（覆盖基础 radius scale；组件仍按 Style 比例消费）
8. Component Preset
9. Advanced Explicit Override
```

例：

```text
Style = Nova
Radius = Large
```

最终仍是 Nova 的控件比例、Switch/Slider/Card 语言，只把基础 Radius scale 提升到 Large；Card、Button、Popup 等不会因此获得完全相同的圆角。

切换：

```text
Theme Blue → Cyan
```

只能改变 Theme/role 色；不能重置 Style、Radius、Switch/Slider geometry。Chart Color 若保持 `Primary`，会跟随 Primary；若用户显式选择 Purple/Green 等 Chart Color，则保持独立。


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

# 13. Chart Palette

Chart Color 是独立设计维度，但配色必须克制：一套图表只使用一个 hue family，通过 lightness / chroma（明度 / 彩度）区分 series，不生成彩虹色。

输入：

```text
Primary
Neutral
Red / Orange / Yellow / Lime / Green / Teal / Cyan / Blue / Purple / Pink / Grey
```

输出：

```css
--qxframe9a7c2-theme-chart-1
--qxframe9a7c2-theme-chart-2
...
--qxframe9a7c2-theme-chart-8
```

要求：

- 同一 Chart family 的 hue 基本稳定，series 靠明度/彩度形成层级。
- Light/Dark 都可辨认。
- 默认 `Chart Color = Primary`，Primary 改变时 Chart 同步跟随。
- 用户显式选择 Chart Color 后，它与 Primary 独立。
- 不使用 Warm/Cool/Mixed 这类多 hue 彩色 preset。
- 最终输出 RGB/RGBA，不输出 `color(srgb ...)`。


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

普通设置固定为 5 个选项：

```text
Default
None
Small
Medium
Large
```

其中 shadcn/create 的参考基准为 None=0、Small≈0.45rem、Medium≈0.625rem、Large≈0.875rem；Default 使用当前 Style 自己的默认基础半径。

Radius 绝不能把所有组件设成同一个值。Generator 先生成 Foundation radius scale：

```text
xs ≈ base × 0.6
sm ≈ base × 0.8
md = base
lg ≈ base × 1.4
xl ≈ base × 1.8
pill / circle 保留语义
```

然后由 Style recipe 决定组件映射。例如 Card 可以消费更大的 radius，Button/Input 消费 control radius，Popup/Tabs 再使用各自映射。因此 `Radius=Large` 是整体圆角尺度变大，而不是“全部组件 14px”。

显式 Radius 配置覆盖 Style 的基础 radius，但不覆盖 Style 的组件相对关系。

# 16. Density / compactness ownership

Theme Studio 不再提供独立 Density 选项。

```text
Nova / Mira / Rhea → 各自拥有紧凑比例
Maia / Luma → 各自拥有更宽松比例
Vega → 中性标准
Lyra / Sera → 各自拥有锐利/编辑型比例
```

这样只有一个 geometry owner，避免 Style 与 Density 同时争夺 control height / padding / gap。


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

建议：

```text
Style
Base Color
Theme Color
Chart Color
Heading Font
Body Font
Radius
Menu Color
Menu Appearance
Menu Accent
Light/Dark
```

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
spacing / component geometry 太挤
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

当前代表性生成矩阵至少覆盖：

```text
8 Style
× 5 Primary
× 3 Base Color
= 120 Complete Themes
```

每个 Complete Theme 同时生成 Light + Dark；5 个 Radius、Chart Color、Menu 组合在 120 个配置中轮换覆盖。浏览器验收还必须逐个切换 8 Style，读取 Card/Button/Input/Switch/Slider 的 computed geometry，防止“Style 名字变了但组件没变”。

重点检测 orthogonality：

```text
改 Theme Color 不应改 geometry。
改 Radius 不应改 color。
改 Font 不应重置 Style。
显式 Chart Color 不应被 Primary 覆盖。
Default Chart=Primary 时应随 Primary。
Card / Control / Popup 不得被 Radius 拉平成同一圆角。
```


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
Style（含 compactness / generosity）
Radius
Typography
Component preset
```

## Phase TG-E — CSS Serializer

输出 deterministic 完整 Theme CSS。

## Phase TG-F — Import / Export

Config JSON / CSS。

## Phase TG-G — Theme Studio

商业化 Preview。

## Phase TG-H — Preset Library

区分两个概念：

- **Style recipe**：当前明确以 shadcn/create 的 Vega / Nova / Maia / Lyra / Mira / Luma / Sera / Rhea 为参考体系，并映射到 QXFRAME public token。
- **QX Theme Preset bundle**：继续使用 QXFRAME 自己的 Signal / Ledger / Harbor / Juniper / Ember / Orbit / Graphite / Canvas 名称，只负责组合 Style / Color / Font / Radius / Menu 等独立维度。

两者不能混为同一层。

## Phase TG-I — Regression Matrix

8 Style × Color × Light/Dark × 5 Radius，并轮换 Chart/Menu 维度。

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
- [ ] Chart palette 单 hue、明度/彩度分层；默认随 Primary，显式 Chart Color 独立。
- [ ] Radius 与 Style 正交。
- [ ] Compactness / generosity 仅由 Style 拥有，不存在第二个 Density owner。
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
Dark/compact algorithm 可组合（参考架构；QX Theme Studio 的 compactness 归 Style owner）
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
