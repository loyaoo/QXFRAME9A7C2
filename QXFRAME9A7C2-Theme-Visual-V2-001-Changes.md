# THEME-VISUAL-V2-001：v1.5 首批实现

日期：2026-10-03。基线：main@54d118c8f303094c27bc957bf16f630ae2efaa88。
权威：[主题视觉 v1.5](QXFRAME9A7C2-Theme-Visual-System-v1.5.md)。

## 当前范围与进度

本批建立版本化颜色代表链，不宣称整个 v1.5 完成。整体约 30%；A 100%，B 80%，C 90%（代表链浏览器等价门禁已通过）；D–H 尚未完成。
旧 Controller、CSS Token、Popup/Scroll、PR #253/#254 工作继续有效。本轮不重新审计它们。

## 已实现

- Schema 2 登记 28 个核心完整颜色输入、14 个可选颜色输入、12 个按需精细覆盖。核心输入共 56 条亮暗声明；可选和覆盖未启用时不输出。
- `semantic-engine.mjs` 提供完整颜色校验、亮暗参考值、版本锁定、颜色稀疏序列化与 JSON 往返；保留 OKLCH 和原 alpha，不转成 RGB 通道串。
- 锁定 shadcn `295a1f114a138f23b5dfee0e0c6812394dfeb90c`，保存八套 Style 的 128 个原规则摘录、源行号和原文件 SHA256，以及 Radix Button 的整体 disabled opacity 规则。MIT 署名和许可已保存。
- 共享规则按 action/control/surface/popup/navigation 职责抽取。只差 Type 的 solid/soft 规则共用当前输入；secondary 是中性次级操作；没有自拟 pressed 强度。
- 代表消费端：Button 六形态及七个语义 Type、Input（含现有 Picker Control）、Card 内容/描述/边界、Menu 高亮/危险项、公共 Popup 和 Dialog 表面/遮罩。
- 八种 Style 的真实 Input、outline、Card 边界与 mask 差异保留；透明度采用 OKLab 与 transparent，两色混合保持 OKLCH。
- CSS 在当前消费者解析输入。采用 `data-qxframe9a7c2-visual="2"` 显式试运行范围；局部 mode 用当前 CSS color-scheme，复用物理 `portalContainer`，无 JS 主题复制。
- 新验收样例加入现有 `docs/theme-playground.html#theme-visual-v2`，并排显示八 Style × light/dark；不是另建编号演示体系。
- 单一发布 CSS 仍由既有 canonical SCSS entry 打包。旧默认主题不切换；Schema 1 的冻结接口继续独立验收。
- GitHub CI 增加 v2 原规则等价验收。旧“全面禁止 color-mix”现在只约束 Schema 1；v2 模块必须通过公式、空间、来源、范围和无旧色阶依赖门禁。未知文件、未知公式、修改比例仍失败。

## 覆盖与使用契约

试运行容器同时声明 `data-qxframe9a7c2-visual="2"`、`data-qxframe9a7c2-theme="light|dark"` 和 `data-qxframe9a7c2-style="vega|…|rhea"`。CSS 不创建这些 DOM 属性，也不引入 Runtime Controller。

正常属性路径是已启用的 `--qxframe9a7c2-theme-v2-override-*` → 当前公共规则 → 完整 Theme 参考值。覆盖按原生 CSS 继承；嵌套 v2 Theme 边界重置核心默认输入，可选覆盖继续继承，显式局部声明胜过继承。移除局部覆盖后恢复上级覆盖或公共关系。Style 默认 mask 不遮蔽后加载的显式完整颜色输入。

目前 v2 导出是**颜色子集**，还不能代替全部正式主题。示例 CSS 为 3,309 bytes / gzip 563 bytes；这不是与旧完整 630 KiB 主题等范围的压缩率比较。框架仍含旧主题，整体压缩须在全迁移与 H 退役后测量。

## 验证

- 本地 canonical 构建、Schema 1 冻结、v2 来源/公式/输出/往返和既有完整 `npm run verify` 已通过。
- 本地浏览器被执行环境的 socket 权限阻止，因此不记录本地浏览器通过。GitHub Actions 的 Chromium 是本批实际浏览器证据来源。
- v2 浏览器门禁独立从源摘录翻译 COLOR 工具表达式，与实际 QX 计算样式对比；包含 Type/variant/state/mode、alpha 的最终合成、局部变更、嵌套 mode、覆盖删除和无关 Card 隔离。
- 数值容差：优先精确计算字符串；不同颜色序列化允许浏览器 Canvas 透明画布 RGBA 与实际模式表面合成后的 RGBA 四通道均 **0 byte** 差。未新增色值容差，也未将测试输出设置为人工已确认视觉基准。

## 未完成清单与下一步

1. B：完善全部消费端/Type 映射、未映射用途登记和最终输入契约；当前 42 个候选名字不是最终无条件必填数量。
2. C/D：危险 Menu 全组合、Dialog/Popup 边界和投影，以及正常以外的 Menu scheme/context/ownership，仍需补齐。
3. D：迁移其余组件、物理颜色 Type 轴、md 默认尺寸与固定派生；旧 palette/预设层尚未退役。
4. E：正式 Studio 接入 v2、四档密度/独立留白/六档 Radius 和八 Style 非颜色标定。
5. F：完整配置导入/稀疏导出和总量统计；当前迁移函数只转换明确命名的角色颜色与旧 RGB 三通道，报告不认识的项，不能冒称能迁移整个旧主题。
6. G：真实外部挂载 Popup、全组件、窄容器、原生输入、图表/halo、跨浏览器与人工视觉确认。v2 依赖浏览器支持 color-mix/light-dark/@scope；旧 Schema 1 浏览器基线不变，v2 的跨浏览器基线待 G 锁定。
7. H：全部必要检查通过后才替换正式默认 CSS，删除旧主链并实测框架＋主题总量。

接力时读 AGENTS.md → AI_WORK_STATE.md → 本 v1.5 文档，查询真实 PR/CI；不要重新启动旧 CSS 重构。

## PR #255 验收与合并

首轮等价检查发现 Nova 禁用 Input 源规则为 input50/light、input80/dark，Mira mask 源为 black80，均按原比例补齐；错误边框参考绑定从误用 Primary 改为 source destructive→QX error。透明颜色同时检查原 alpha 和实际模式表面合成，不用白色底板掩盖暗色透明差异。

合并前覆盖复查：Card 标题继承当前表面文字，使显式 surface-foreground 覆盖作用于标题；父容器／标题覆盖、描述 muted 隔离、删除回退的五项浏览器检查通过。

- 最终实现 head：`b08f105866bf7434d8efa9d1e31d2e4a06fe0ca8`。
- CSS Schema Acceptance `37134518212`：SUCCESS，4,176 个 Chromium 场景、13,067 项检查、零失败。
- QXFRAME CI `37134518247`：SUCCESS，包括完整 release、Windows、npm 包、独立 dist／演示与 Pages 产物。
- PR #255 已合并，main 合并提交：`a59c2d4664125d72f1950c4c6faff10b4fe2adf3`。主分支 CI／Pages 部署以实时 GitHub 为准。
- 本批交付完成，整个 THEME-VISUAL-V2-001 仍约 30%，继续剩余 B/C 后进入 D；没有替换生产默认主题。
