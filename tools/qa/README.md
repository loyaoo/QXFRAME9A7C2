# tools/qa — shadcn create 对照工具

本目录承载 createApp 重做（`QXFRAME9A7C2-createApp-重做任务要求-v3.md`，第 7 节第 9 条）所需的参照渲染器、测量脚本与对比报告。

| 路径 | 内容 |
|---|---|
| `spec.json` | shadcn create（锁定提交 `295a1f114a138f23b5dfee0e0c6812394dfeb90c`）8 风格 × 明暗的实测几何/颜色数据。v3 文档中"按实测表"的数值一律以此文件为准。 |
| `ref/` | 参照渲染器源码：基于 shadcn 锁定源码 + 桩模块，用 esbuild/tailwind 构建出可离线运行的 gallery / create 页面。构建需要 shadcn、radix、lucide 源码检出，见 `ref/build.mjs` 顶部路径。 |
| `scripts/` | 交接时的测量与截图脚本（Python + Playwright）。其中的绝对路径、端口来自交接环境，在第 3 阶段逐卡对齐时改为仓库相对路径。 |
| `css-equivalence.mjs` | 第 0 阶段：同一批文档页分别加载基线 CSS 与候选 CSS，逐像素比较整页截图并逐元素比较计算样式。 |
| `reports/` | 各阶段对比报告。CI 把整个目录作为 `qa-reports-<sha>` 附件上传。 |

视觉对比在开发会话中运行（需要 Playwright + Chromium），CI 只跑快检查。
