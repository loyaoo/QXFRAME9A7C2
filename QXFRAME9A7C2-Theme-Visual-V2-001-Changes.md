# THEME-VISUAL-V2-001：v1.5 阶段性交付

日期：2026-10-03。基线：main@54d118c8f303094c27bc957bf16f630ae2efaa88。
权威：[主题视觉 v1.5](QXFRAME9A7C2-Theme-Visual-System-v1.5.md)。

## 首批范围与进度（PR #255 历史证据）

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

## 当前未完成清单与下一步

1. B/D：物理颜色 Type 轴、全部消费用途与 Menu scheme/context/ownership 的穷举迁移，消除全部旧默认色阶依赖。代表链和第二批已实现用途不重做。
2. D/E：完整非颜色 Style 排版、边界、投影、动效、Shape 标定及 Studio 输入；密度／半径／留白候选数值仍需 G 的全场景确认。
3. F：完整旧配置转换和总量统计。v2 颜色＋md 输入已支持往返与稀疏导出，不能冒称已迁移整个旧主题。
4. G：真实外部挂载 Popup、全组件、窄容器、原生输入、图表／halo、跨浏览器与人工视觉确认。v2 跨浏览器基线待 G 锁定。
5. H：全部必要检查通过后才替换正式默认 CSS，删除旧主链并实测框架＋主题总量。

接力时读 AGENTS.md → AI_WORK_STATE.md → 本 v1.5 文档，查询真实 PR/CI；不要重新启动旧 CSS 重构。

## PR #255 验收与合并

首轮等价检查发现 Nova 禁用 Input 源规则为 input50/light、input80/dark，Mira mask 源为 black80，均按原比例补齐；错误边框参考绑定从误用 Primary 改为 source destructive→QX error。透明颜色同时检查原 alpha 和实际模式表面合成，不用白色底板掩盖暗色透明差异。

合并前覆盖复查：Card 标题继承当前表面文字，使显式 surface-foreground 覆盖作用于标题；父容器／标题覆盖、描述 muted 隔离、删除回退的五项浏览器检查通过。

- 最终实现 head：`b08f105866bf7434d8efa9d1e31d2e4a06fe0ca8`。
- CSS Schema Acceptance `37134518212`：SUCCESS，4,176 个 Chromium 场景、13,067 项检查、零失败。
- QXFRAME CI `37134518247`：SUCCESS，包括完整 release、Windows、npm 包、独立 dist／演示与 Pages 产物。
- PR #255 已合并，main 合并提交：`a59c2d4664125d72f1950c4c6faff10b4fe2adf3`。主分支 CI／Pages 部署以实时 GitHub 为准。
- 本批交付完成，整个 THEME-VISUAL-V2-001 仍约 30%，继续剩余 B/C 后进入 D；没有替换生产默认主题。

## 第二批交付：共享消费端、md 固定派生与 Studio（2026-10-04）

- 公共 Popup/Popover/Submenu/Modal/Drawer 的完整表面、原 ring 色边界和 Style 投影分布；原生物理 ownership 不变。
- 必要输入增加 shadow（黑色投影基色）与 thumb（源 Slider 白色手柄），共 30 个核心完整颜色。用于关闭硬编码业务颜色端点；不是状态展开。
- shadcn 锁文件确认 Tailwind 4.3.0；保留其阴影颜色原 alpha（10%/25%）及 Style 级别分配。QX 阴影几何使用偶数 rem，未声称复制外部每个几何像素。
- 源摘录扩展至 464 条；共享规则沿现有消费槽位接入 Tag/Badge、反馈、Table、List/Tree/Transfer、Progress、Slider、Scroll、Tooltip。新增代表组合已通过 Chromium 来源等价 CI。
- 危险 Menu normal/hover/selected/open/descendant-selected/disabled 的源等价用例已登记。
- 接下来继续 md 固定派生与剩余颜色端；生产默认不在本批提前切换。

### md 固定派生实现与 Chromium 验收

- 21 个完整 md rem 输入；有限四档密度、六档半径、三档独立容器留白，数值仍为候选标定。五档指数由组件自己初始化，连体组显式共享；普通嵌套控件回到 md。
- 控件最小尺寸固定 4px 步长，padding/gap/icon 固定 2px；字号/行盒限档增长；follow 半径与表面留白固定温和比例、统一偶数舍入。纵向 padding 从内容盒和边框计算，多行允许增长。
- Switch/Slider/Progress 专用 md 输入独立派生；Switch 按实际边框盒校准内缩和有效行程。旧五档几何接口不作为 v2 隐藏覆盖入口。
- build/Studio 生成器完整配置往返；导出仅有必要完整颜色和 md 输入，没有 size/state/component 结果矩阵。576 个 Style×密度×半径×留白配置通过静态序列化检查；浏览器测量五档几何、嵌套、连体、多行、局部 md 覆盖和删除回退。
- Schema 1 Size Tree 门禁仅排除版本化 v2 模块，排除前必须通过新 v2 md/even/fixed-rule 检查；原 37 个受保护候选与零 actionable/review 不变。
- 初次第二批 CI 暴露 Badge dark hover、Sera transparent/hover text70、Table 选择器优先级、disabled danger Menu 与 Maia generic Popup border，已按锁定来源修复，零字节颜色容差保持。

### 原生 Choice 与 Studio v2 预览和验收

- Native Checkbox/Radio 和投影视觉选择器复用 source checked/unchecked 分配；补齐 Sera Radio 透明底＋foreground 点、Luma/Rhea input90 与透明边界。Switch thumb 按亮暗、checked 正确读 background/foreground/Type foreground。Slider 保留 source 的各 Style rail/thumb/border 差异。
- canonical Theme Playground 增加隔离的 v2 Studio：八 Style 解析为真实密度/圆角/留白档位；五档组件、亮暗、语义反馈和 Native Choice 预览；完整颜色编辑、可选覆盖删除、JSON 校验导入、CSS/JSON 下载和持久设置。旧 Studio 保留至 H。
- 新 Studio 的实际 UI 联动、Sera follow 半径、独立容器留白、无半径全五档、配置往返、覆盖消费/删除和无效导入不破坏当前配置加入 mandatory Chromium CI。
- 初次几何浏览器 fixture 错误地将 Progress line 与 ring 放在同一个 flex root，造成圆环 flex shrink；已按实际组件 DOM 拆开。颜色等价没有新增容差。

### 中间验收发现与收尾修正（历史记录）

- head `4ae35349cf96f9b71f5533129cf71a85afd21efd` 的 Chromium 颜色矩阵：5,168 场景、15,035 检查；几何：51,855 检查；全部零失败。Studio 和完整发布仍未验收通过。
- 专用 Studio 探针显式执行真实 Rollup 模块；旧 Playground smoke 按 module 类型打包入口及依赖，保持原脚本顺序，不跳过新 Studio。CDP 异常保留实际描述。
- Card Body 字号保持自身排版职责，不随 Control 密度改变；增加浏览器回归。原生 disabled Checkbox/Radio/Switch opacity 加入精确来源检查。
- 当前完整 v2 默认主题为 30 个核心颜色＋21 个 md 输入，4,715 bytes / gzip 810 bytes；框架同时包含旧链，整体压缩尚未完成。

- 后续 head `d17b64d` 的 15,131 颜色＋51,855 几何检查全部通过。Studio 样式标签原先与根节点共用标记，已拆分并增加唯一根节点断言；字号隔离验证比较密度修改前后，沿用实际 Body 排版。

- Studio 验收继续发现实际导出级联问题：md 选择器与框架 :scope 默认同优先级，在隔离预览内被较近的默认 scope 压过。导出采用 canonical visual＋theme 双属性选择器，确保完整 Theme 输入覆盖 Style 默认；UI 门禁同时断言配置提交和实际五档几何。

## 第二批浏览器验收证据

- 实现 head：`10587b2862455d9d60e5fd7e058b8b495b9e20c2`；CSS Schema Acceptance `37164122219` SUCCESS。
- 5,168 颜色场景 / 15,131 检查；576 配置×五档 / 51,855 几何检查；Studio 23 个实际 UI 断言；全部零失败。完整 release 与合并后 main／Pages 以实时 CI 为准，不能用单个 Schema 成功代替发布验收。
- 当前 v1.5 总体约 45%；A 100%、B 80%、C 95%、D 35%、E 40%、F 45%、G/H 0%。当前交付覆盖代表链和新增用途，保留 opt-in；未完成清单在前文列明。

## PR #256 合并与主分支发布

- 最终 head：`e6d63a8097413a08a02bfa46a0ee1b793cc1e478`。CSS Schema Acceptance `37164297428` 与 QXFRAME CI `37164297455` 均 SUCCESS。
- PR #256 已合并为 `e7bbf6b7800a2a82db1bd04ac115e0ba5ff62ea4`。主分支 QXFRAME CI `37164806216` SUCCESS，release / Windows / npm 包 /独立演示 / docs / Pages 部署均通过，deploy-pages job `111326754850` SUCCESS。
- 主分支再次通过 15,131 颜色、51,855 几何和 23 Studio UI 检查，零失败。
- 本批交付 100%；整个 v1.5 约 45%。下一步为 B/D 物理颜色 Type 与完整消费上下文迁移。生产默认保留至 H；主分支发布与代表浏览器矩阵不代替全组件、跨浏览器及人工视觉 G。

## 第三批实现：完整物理 Type 与剩余颜色消费（2026-10-04，待 CI）

- 14 个既有物理颜色 Type 与 gray→grey 别名；完整参考色和配套前景来自已验收 QX 输入并锁定源文件哈希，复用固定 shadcn 公式。新增 28 个按需公开输入，正常导出仍为 30 核心颜色＋21 md 输入；不生成色阶、Type/state 或组件结果矩阵。
- Type 绑定在消费处解析，修正旧 `.is-blue` 等选择器抢占共享角色以及 Tags 显式子 Type 的继承优先级；物理输入修改与 primary 独立。
- 实际 Message/Notification root、Badge count/ribbon/status、Carousel、Image/Upload mask 和 toolbar、native input/OTP/ColorPanel/Pagination input 的剩余直接颜色用途接入完整 Theme 输入。Popover arrow 复用当前 popup 表面。
- 浏览器门禁扩展 4,032 物理 Type 来源等价场景，独立分片保持每次测量有界；保留零 RGBA 字节容差，验证局部透明输入、嵌套 Light/Dark、别名、Tags 继承与删除回退。
- Studio 增加全部物理 Type 预览；实际 UI 验证完整色、配套前景、primary 独立、JSON 往返、删除恢复及稀疏导出。
- 原 Schema-1 Playground smoke 完成后，真实 canonical demo DOM 在八 Style×亮暗下毒化旧 palette/Theme color/derived mode 输入，测量普通部位与伪元素的 paint；任何变化令 CI 失败，覆盖和未挂载部位均记录，不能据此宣称完整 G。
- 当前本地静态门禁通过，浏览器和完整 release 尚待 CI；总体进度仍以 CURRENT 记录为准，生产默认保留至 H。

### 第三批中间验收与继续迁移

- 初始 head `456df680c49643f581efedefd1c6daad97946c77`：Schema `37167570477` SUCCESS，9,200 颜色场景／26,150 检查、51,855 几何检查、30 Studio 操作检查，零失败。完整 release `37167570441` 在新增真实 DOM 旧色毒化检查失败；旧 canonical demos 全部挂载且无运行错误。未合并。
- Suite 失败摘要原先遗漏新增 consumer 数据，现转发具体部位／属性并保存失败时的验收报告。毒化探针遇到真实失败即可中止当前批报告，成功必须完整运行全部 16 个配置；不改变通过条件。
- 补齐六类原生 Control 的共享可选覆盖、invalid/focus/disabled 与 Sera 下划线责任；新增 288 个来源等价场景。

- 第二次 Schema `37168952190` SUCCESS：9,488 场景／26,726 颜色检查。真实 Playground 为 9,406 节点／744 已挂载类；首个配置 126,444 paint 检查暴露 180 个旧输入变化，正在修复 shared surface/data、日期 selected-active、Focus 可见色和装饰投影职责。Vega/Luma/Sera/Rhea Card、各 Style Slider/Switch 的投影有锁定来源分配；inline Alert 去掉浮层阴影。投影几何保留 QX 偶数规则，颜色使用锁定 Tailwind xs 5%、sm/md 10% alpha，未调比例。

## PR #258 第三批 canonical single-system 收尾（2026-10-04）

本节覆盖并更新上文“待 CI”的第三批状态；历史记录保留用于解释迁移过程，但恢复工作时以本节和 `AI_WORK_STATE.md` 为当前真相。

### 单一 Theme 与消费链

- Theme v2 已成为唯一公开 Theme 系统；旧 `.qxframe9a7c2-play-settings`、旧 Theme Studio / generator / Schema1 Theme contract、旧 theme/default/family public chain 与 `data-qxframe9a7c2-visual="2"` opt-in 均已退休，并有 reverse gate 防止回归。
- 公共颜色权威保持 30 个完整颜色输入；14 个物理 Type 及前景作为按需完整输入，不展开 palette/state/component 结果矩阵。锁定 shadcn source SHA 仍为 `295a1f114a138f23b5dfee0e0c6812394dfeb90c`。
- `qx-md-2` 是唯一公开几何权威：21 个 md 输入，xs/sm/md/lg/xl 由固定 CSS 规则派生；控件最小尺寸每档 4px，文本/多选/多行允许内容盒自然增长。旧 family-control-height / 五档覆盖接口不再是 Theme API。
- `qx-style-3` 继续承载来源支持的非颜色有限轴：typography density、text style、body/heading/mono fonts、Control Appearance、border、shadow、motion pace、surface 与 Shape family。Style 只提供默认值，用户显式配置最终优先。
- Theme boundary 明确投影继承型 body font；Control focus border/ring 走共享 state topology，underline 仍只亮底边，invalid/warning 优先级不被普通 focus 覆盖。

### 实际 DOM 与浏览器验收

- canonical Theme Playground 的真实 DOM poison 只毒化已退休 private paint roles，不再破坏 geometry/motion 常量。16 个配置共检查 **660,143** 个 paint 结果；覆盖 739 个已挂载 class，记录 2,158 个未挂载 class、3,206 个 poisoned inputs；**mismatchCount=0**。
- source-equivalence 浏览器矩阵：5,456 cases / **15,714** checks；物理 Type 两个分片合计 4,032 cases / **11,012** checks；所有颜色比较保持透明画布和实际 mode surface 合成后 **0 RGBA byte** 差。
- 几何：576 配置 × 5 sizes，共 **51,855** checks，失败 0；容差仍为 `1e-6 CSS px`，保留 1px border 例外与偶数参考几何规则。
- Studio 浏览器门禁扩大到 **73** 个实际 UI checks，失败 0；覆盖完整颜色、物理 Type、21 md 输入、41 个 Style declarations、中文配置、字体/文字风格/Control Appearance、JSON/CSS 往返与 visible computed-style。
- Studio 最后一项 soft focused border 失败被确认是 `border-color` transition 起点同 tick 读取；verifier 改为 async 并等待有界 transition settle 后再读 computed style。组件 CSS、颜色容差与几何容差均未放宽。

### 历史 smoke 契约迁移

- Full release 曾暴露两条旧 browser smoke 仍写已退休的 `--qxframe9a7c2-family-control-height` / `--qxframe9a7c2-family-control-font-size`，并错误要求 Select single/multiple 固定等高、Collapse xs/md/xl 全等高。
- 未恢复旧 token，也未把失败加入白名单。`verify-browser-suite.mjs` 在严格 release runner 内对这两条历史用例生成临时 canonical smoke：把 md min-block 覆盖到 40px，Select 要求 single≈40px、multiple≥40px 且允许 intrinsic growth；Collapse 要求 xs/md/xl 精确派生为 32/40/48px，仍使用 `<0.75px` 的原浏览器几何容差。
- 任何原历史片段漂移会在适配前直接 assert 失败；临时 smoke 执行完成即删除。其余 browser smoke、source ESM/UMD、高风险与 preserve-subpath 层不跳过。

### PR #258 合并前证据

- 已验证实现 head：`c34aa95c95c8cba0dc1f997771618a5c7c50d028`。
- CSS Schema Acceptance #277 / run `37190097101`：**SUCCESS**；single-system、sole Studio、660,143 consumer poison、15,714 source/color checks、11,012 physical-Type checks、51,855 geometry checks、73 Studio UI checks 全部通过。
- QXFRAME CI #1523 / run `37190097110`：**SUCCESS**；Full release verification、Windows tools、npm pack、standalone dist/docs build、verification/dist/demo artifacts 全部通过。PR run 不执行 deploy-pages，Pages 必须在合并 main 后单独确认。
- 本次文档提交之后仍必须以新的 exact head 再跑同一 required gates；不能用 `c34aa95c` 的实现证据代替最终 PR head。

### 当前进度与未完成项

- PR #258 本批实现范围约 **100%**；整个 THEME-VISUAL-V2-001 / v1.5 按 A–H 范围保守估计约 **70%**。
- 仍未完成：G 的全组件窄容器、真实外挂 Popup、原生输入、图表/halo、更多浏览器与人工视觉确认；剩余非颜色 source-backed consumer 收口；最终 private paint 清理、总量/压缩统计与 H 的最终主分支发布验收。
- 合并前最后动作：文档后 exact-head Schema + QXFRAME CI 全绿；合并后确认 main release / Windows / deploy-pages。不要重新执行已完成的单一 Theme、物理 Type、qx-md-2、qx-style-3 或 Studio 基础迁移。
