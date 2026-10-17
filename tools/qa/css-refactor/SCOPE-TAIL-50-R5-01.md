# R5-01 · 原位置移除 50 条状态规则的根 Scope

- B0 `62d9a8402c19460ced37265acc6d110ae2cfda76`，前一轮双 CI / Fast 全绿 HEAD `9bcb4317ab81d623c34bc2e4f979a86f961dbb03`。
- 文件范围仅 `src/styles/main/theme-visual-v2.css`：在当前 200 条 scoped qualified rules 中，前 150 条仍 scoped，尾部 50 条脱离 `@scope (:root)`。规则选择器、声明、顺序、Theme/JS/DOM/公开接口均未改变。
- 范围包含 Picker 导航/选中、Menu、原生 choice、Switch、五档尺寸、Card/Slider/Progress/Badge 状态。仍未转移回组件源码；留待逐族解决级联所有者。
- 本地 Chromium 采用冻结 B0 CSS 与该 50 条去壳候选比较：448 个浅色节点及 890 个深色节点计算样式/关键私有槽位/几何，均为 0 差异。全部五处 `@scope` 直接去壳产生 136 处浅色差异，已否决；Menu/Choice/Switch 提前移动至组件源码也引入差异，均未推送。
- G04/G05/G06/G08/G11 仍须当前精确 HEAD 三套 CI 核对；完整 CreateApp、公开覆盖、Portal 受测范围之外仍列为未闭合。此批为在原位置解除 Scope 的中间迁移，不作为 R5-01 完成，不删除历史模块，不得自动合并 PR。
