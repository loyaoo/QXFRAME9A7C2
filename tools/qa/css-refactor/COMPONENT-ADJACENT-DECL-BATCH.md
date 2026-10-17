# 组件相邻同声明规则批量归并（R3/R4 前置无行为改动）

本批撤销失败的 `@scope` 尾部去壳，恢复到已三套 CI 同 HEAD 全绿的 `9bcb4317ab81d623c34bc2e4f979a86f961dbb03` 样式源。失败版本 `dbe1aeba2685d696087f6b7b74731b9d57b20045` 的正式 CI 证明存在重复所有权增加、Theme source gate 失败与 Card 249 项差异，故不得继承其结构性修改。

## 本批真实生产代码变更
只在各组件正式 CSS 源文件内部，合并**相邻且属性声明文本完全相同**的 qualified rules；保留原 selector、每个 selector 的 CSS specificity、声明内容和原规则相邻顺序。排除非相邻规则及 `::-webkit-*` / `::-moz-*` 跨引擎混合选择器，避免 unsupported selector 导致整组失效。

| 组件 | 合并组数 | 原选择器数量 | 源码减少字符 |
| --- | ---: | ---: | ---: |
| button | 4 | 9 | 1451 |
| icon | 3 | 7 | 179 |
| picker-family | 2 | 4 | 259 |
| form-native | 1 | 3 | 约 130 |
| focus-closeout | 1 | 3 | 36 |
| table | 1 | 2 | 约 14 |
| menu | 1 | 2 | 67 |
| steps | 1 | 2 | 20 |
| composition | 1 | 2 | 80 |
| card | 2 | 4 | 62 |

合并组总数 17；受影响正式组件文件 10 个。旧 CSS 历史四文件仍在；`@scope` 和 Theme/JS/DOM/公共 Token 完全恢复冻结状态。没有新增 Token、CSS 兜底 patch 或版本化样式文件。

需要当前 HEAD **QXFRAME CI + CSS Schema + Fast Chromium** 三套成功；目前标记 implemented/pending-ci，不记作 R3/R4 工作包完整交付。不得合并 PR。

## Field 拦截修正
QXFRAME #39018870785 在 `verify-create-app.mjs` 的 Field/Native Form 独立 CSS 所有者断言失败。拒绝为消除断言而修改 Field 的职责约束；恢复 `.qxframe9a7c2-field-label` 独立样式规则，仅保留该文件中 hover 同声明的归并。其他组件归并不回退，继续由真实 Chromium 与双 CI 验证。此修正的原始旧版源码直接取自已通过 CI 的 `9bcb4317ab81d623c34bc2e4f979a86f961dbb03`。

## Table 状态归属纠偏
QXFRAME #39019121482 暴露 `verify-create-app.mjs` 对 Table 选中态 CSS 规则的独立声明契约要求。恢复 `table-filter-option.is-selected / :has(checked)` 与 hover 规则的独立原文，不松动旧契约；该原文取自 `9bcb4317ab81d623c34bc2e4f979a86f961dbb03`，其他 Table 配对规则保留。
