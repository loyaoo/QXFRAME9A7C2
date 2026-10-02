# CSS Schema v1.6 验收与修复记录

**本轮结论：确认的五组问题均已实施修复，严格 Chromium 验收通过。** 原始 main 基线 `72663d3530e16b582b8891491fa8f7e8b01ccda9` 的 NOT_ACCEPTED 结果作为历史证据保留，不再表示当前实现仍有那四组阻塞。

本轮任务 `CSS-SCHEMA-ACCEPTANCE-REMEDIATION-001` 已完成：PR #245 在最终实现 HEAD 两套 CI 全部成功后，合并为 `0ded4a46d64b5fda46fc101007e0df9bd8aade92`（2026-10-02T07:13:53Z）。当前 main 发行与 Pages 状态查询 GitHub 实际结果。工具结果保持 `PROBES_PASS_REMAINING_MANUAL_GATES_REQUIRED`：本次确认问题的关闭不等于全部组件人工视觉、独立架构/安全审计或整个 Schema 的冻结签字。

## 修复结果

| 问题 | 已实施结果 | 回归证据 |
|---|---|---|
| 001 权威指南截断 | 恢复原路径完整 2,750 行、§§1–46 | 完整章节检查；没有另建冲突规范 |
| 002 五档公共 control Theme 接口 | 新增 35 个 height/font/padding/gap/radius/icon Theme 角色；私有 size recipe 消费公共角色 | 默认五档 24/28/32/36/40px、root/scoped 覆盖与无 size 的 md 控件 |
| 003 运行时调色 | canonical live color-mix 为 0；171 个独立表达式改为静态 Light/Dark/颜色轴角色 | 7,484 次核心颜色比对；保留 MixedGray r2 与显式公共颜色覆盖 |
| 004 根默认值遮蔽公共覆盖 | Card skeleton title、Icon、Composition、Notice 使用公共 override slot → 私有最终值 | Card 祖先标题 24px 生效；12 个保留根声明逐条登记功能性 owner，未分类声明会失败 |
| 005 祖先 alias 冻结局部 Theme | 66 个 Component 默认 alias 改为消费点 fallback；Mode palette 在局部解析 | scoped Card 32px、Avatar 56px、祖先 Component override 优先、嵌套私有 shadow reset |

公共颜色可由祖先或局部 Theme 覆盖，不在 scoped Theme 容器重新声明公共默认值来遮蔽祖先。Light/Dark literal palette 与私有 Mode fallback 保持单一 CSS 视觉 authority。

## 默认视觉与文档预设

- 独立离线 Chromium 在静态化前提交 `7772cadba3b095c4cf8d6c7a11e1915299a252db` 捕获 171 表达式、44 个明暗/颜色轴组合；采样关闭 transition/animation，排除瞬时过渡值。
- 保留 Nova、Ocean、Violet、Emerald、Amber、Rose 六个已有 docs 预设，覆盖 grey/mixed/gray 三种 Neutral、Light/Dark 与 bare/default/primary 轴，共 108 基线行。
- 18,144 次 docs 静态颜色角色比对通过。
- 使用不可变的原始编译 CSS fixture 比对实际 Button：6 预设 × 3 Neutral × 2 mode × 2 axis × 6 variant × 5 state，共 2,160 个用例；background/color/border/shadow/outline 均无差异。
- 默认 MixedGray r2、Primary 13 色、功能性 ColorPanel/ColorPicker 常量保持；框架没有新增 JS Theme/Token runtime 或生产主题生成器。
- 自定义主题现在提供完整静态颜色角色；单 Seed 任意现场调色与连续 mix 输入按完整指南关闭。文档保留已有静态预设选择，提示新合同，CSS 导出包含完整静态颜色覆盖。

## 已取得的发行与浏览器证据

| 实现提交 / 检查 | 结果 |
|---|---|
| `bfaae28a` / QXFRAME CI run `36975336235` | SUCCESS：完整发行与 Windows tooling |
| `bfaae28a` / CSS Schema Acceptance run `36975336207` | SUCCESS：25 探针、7,484 核心颜色比对 |
| `96f2046d` / CSS Schema Acceptance run `36976428598`、job `110741152413` | SUCCESS：25 探针、7,484 核心比对、18,144 docs 比对、2,160 Button 用例 |
| 最终实现 `9a87bdd4` / QXFRAME CI `36976881748`、Schema Acceptance `36976881857` | 两套 SUCCESS：全部发行验证、Windows、npm 打包、dist/docs 及严格浏览器验收 |
| 本地补充检查 | build + 完整 npm verify PASS；仅辅助，最终发行以 GitHub Actions 为准 |

PR #245 已按最终实现 HEAD 的成功结果合并。本次收尾提交仅更新状态记录与不可变证据引用，不修改运行时代码。main 与 Pages 的最新结果始终以 GitHub 为准。

已有 release、浏览器、源 ESM/UMD、package/import、几何耦合、安全依赖与 docs 检查保留。旧 verifier 中依赖已删除 alias/公式文本的断言改为追踪真实 Theme role/fallback；历史 Size Tree 映射与几何目标未放宽。

## 保留的完成项与范围

Size Tree 46 节点、零 actionable raw size、零 live Grid/fr/viewport、受保护断点/pill 几何、52 个 ordered component/shared partial 加 1 聚合文件均保持。核心 9 Controller 迁移保持完成；本 PR 不改 Interaction/Value/Focus/Overlay/Motion 的运行时实现。

独立 detector 的五个 mutation cases 保持通过；严格工具缺失公共接口、断开消费者、发现 live mix、未分类公共根默认值、截断文档或缺浏览器证据均拒绝验收。

历史失败基线保留在 `tools/manifests/css-schema-acceptance-2026-10-02.json`，明确标记 `HISTORICAL_PRE_REMEDIATION_BASELINE`，追加当前修复证据，不篡改旧实测结果。原 run `36970814333` 的四个失败探针均在当前 25 探针集合中通过。

本轮确认阻塞已清零。跨浏览器人工视觉、实际 scoped portal 的全部组件组合，以及广泛独立架构/安全签收仍属于完整冻结门槛；自动化通过不会替代这些签字。
