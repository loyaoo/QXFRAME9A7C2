# Stage 5｜Tabler / daisyUI 静态组件形态对照与验收

日期：2026-10-15 · 分支：`redesign/create-stage5` · PR #267 Draft（不可自动合并）

## 范围与硬约束

参考 Tabler 的 Card、Badge、Status、Avatar、Alert、Progress、Progress Step、Segmented Control、Tag、Form Elements，以及 daisyUI Kbd 的表现方式，只移植缺失的**静态表达**。所有组件保持 QXFRAME 现有结构、CSS Theme Token、`is-` 外观状态和 Flex 布局；不引入 Tabler/daisyUI 依赖、第二套状态模型、`display:grid`、`vw/vh/fr` 或历史版本 Token。

## 完成形态与现有形态

| 组件 | 本轮新增的静态形态 | 已有形态（保持） |
| --- | --- | --- |
| Card | `.is-stacked` 叠纸；`.card-stamp` 角标；`.card-deck` Flex 卡片组 | Header/Footer、Cover、分段背景、Grid/Flex 子区、横向、Skeleton、可点击/阴影 |
| Badge / Status | `.is-soft` / `.is-subtle`；状态文字、muted/脉冲指示 | 5 Size、语义色、dot、status、ribbon、count、outline/solid |
| Avatar | outlined/muted/primary；status online/away/busy/offline；spaced group | 5 Size、头像组重叠、状态圆点、square/circle |
| Alert | compact 排版 | 语义状态 + muted/outline/shadow 多外观组合 |
| Progress | striped、warning/error/muted、Current/Error/Warning Steps、Step 标签排版 | 普通条、steps、vertical、circle/dashboard、成功状态 |
| Tabs / Segmented | pills、soft 选中 | normal/line/card/segmented、横/竖、滚动和焦点 |
| Tag / Tags | standalone muted/outline/shadow | 语义色、选择、多项、Add Tag 共享 Tag 绘制 |
| Input / InputGroup | soft/compact Group、文本/图标 Addon | JS/native input、组合 Field、状态/焦点、filled/underlined/borderless |
| Form | help/hint/错误/成功状态、stacked field、输入图标辅助 | Native input/select/textarea、FormLayout、SelectGroup、验证 |
| Kbd | 新增静态 `.qxframe9a7c2-kbd`，xs/sm/md/lg/xl、outline/primary、kbd-group | 无同职能原始组件 |

新增样式直接写在已有家族 `src/styles/components/*.css`；Kbd 实际上已有静态基础于 `src/styles/components/composition.css`，本轮只扩展这个原有所有者；不保留第二个 `kbd.css` 或 Manifest 模块。

## Calendar / RangePicker 当前几何

- 连续 Range 条的每行首尾均在 Cell `::before` 画圆角；端点自身保持不透明，选中与 Hover 共享行范围绘制。
- 双日期面板以 `gap:1rem` 真实分隔，移除中心阴影分割线；Date+Time 中线改为独立列间距。
- Calendar 复用已有 delegated `calendarNav`，前后月为 -1/+1，新增左右年份为 -12/+12；双面板只保留外侧年月按钮，内侧使用 `display:none` 不占位。
- 已通过的 xs/sm/md/lg/xl = 28/32/36/40/44px 与 `1 Weekday + 6 weeks = 7 Wheel items` 方案不重做。

## 验收门禁

1. CSS 源码 Manifest 唯一来源、零新增 Important/非 rem 尺寸、无重复 Painter、Theme Token 无越权。
2. 66 张既有 Preview03 商业卡片不增加、不删减；其后另设无 `data-card` 的静态效果陈列区。
3. 浏览器以真实 computed-style 校验 Card / Badge / Avatar / Progress / Pills / Tag / Form / Kbd 在 8 Styles × light/dark 下可见；Calendar 年份切换 +1/-1 年。
4. 按最新 HEAD 运行 QXFRAME CI、CSS Schema Acceptance、Windows 完整 dist+docs 离线包 CRC/HTTP 校验；离线包仅高亮本轮 10 处变化。
5. 最后仍需用户人工视觉验收。**本记录只确认实现范围，不等于像素级完全复刻 Tabler，亦不等于 Stage 5 全部组件状态都已通过。**

## 参考

- https://docs.tabler.io/ui/components/card
- https://docs.tabler.io/ui/components/badge
- https://docs.tabler.io/ui/components/status
- https://docs.tabler.io/ui/components/avatar
- https://docs.tabler.io/ui/components/alert
- https://docs.tabler.io/ui/components/progress
- https://docs.tabler.io/ui/components/progress-step
- https://docs.tabler.io/ui/components/segmented-control
- https://docs.tabler.io/ui/components/tag
- https://docs.tabler.io/ui/forms/elements
- https://preview.tabler.io/form-elements.html
- https://daisyui.com/components/kbd/

