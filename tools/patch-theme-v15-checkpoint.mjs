import fs from 'node:fs';

// Fix the only ambiguous Chinese label in the Studio.
{
  const file='docs/assets/theme-generator/studio-v2.mjs';
  let text=fs.readFileSync(file,'utf8');
  const from="subtle:'轻微',soft:'柔和',elevated:'抬升'";
  if(!text.includes(from))throw new Error('Studio label anchor missing');
  text=text.replace(from,"subtle:'轻微',soft:'柔和填充',elevated:'抬升'");
  fs.writeFileSync(file,text);
}

// Record the user's later implementation decision at the top of the master v1.5 doc.
{
  const file='QXFRAME9A7C2-Theme-Visual-System-v1.5.md';
  let text=fs.readFileSync(file,'utf8');
  const anchor='本轮最终架构：**Theme 输入 → 框架公共派生规则 → Component 消费。取消独立的基础预设 CSS Token 层。**';
  if(!text.includes(anchor))throw new Error('v1.5 doc anchor missing');
  const decision=`## 0. 2026-10-04 实施决策覆盖（优先于本文早期阶段安排）\n\n以下决定来自后续明确要求，优先级高于本文中“先并行保留旧系统、最后 Phase H 再替换”的早期阶段描述：\n\n1. **框架尚未投入生产，不保留旧主题兼容层。** 旧 \`.qxframe9a7c2-play-settings\` 控制区、旧 Theme Studio、旧生成器配置 JS、Schema1 主题生成契约以及旧公开 Theme Token 链直接退休；运行时只允许一套公开 Theme 系统。\n2. **Theme v2 提升为 canonical Theme。** 旧 \`theme/default\`、\`theme/family\` 与旧基础预设公开 Theme 链不得重新接回。尚未迁完的非主题几何常量可以暂时作为 \`--_qxframe9a7c2-*\` 私有实现常量存在，但不能对外成为第二套 Theme 配置接口；旧 paint/color fallback 必须继续迁离真实组件消费。\n3. **生成器只保留新版 Studio。** 新配置界面的用户可见名称使用中文；内部枚举、JSON key 和工程标识可以保持英文，以保证配置稳定性。\n4. **尺寸契约已进入 \`qx-md-2\`。** 仍只有 21 个 md 输入和一套固定五档 CSS 派生；Sera 的 12px 编辑式控件字号通过“文字风格 + md 输入”联合解析，不增加 Style 专属五档曲线。\n5. **非颜色 Style 已进入 \`qx-style-3\`。** Style 只选择可见的有限默认项；用户单独修改后就是最终配置。当前新增“控件外观”：描边、着色描边、轻着色描边、柔和填充、下划线。Sera 默认下划线，但可直接切换到其他外观。\n6. 本文后续所有写着“默认替换只在 H”“必须同时保留 Schema1/v2”的旧阶段句子，均按本节视为**已被替代**；不得据此恢复双轨。\n\n`;
  text=text.replace(anchor,decision+anchor);
  text=text.replace('现有默认 CSS 是过渡版本。先完善生成器和消费链，完成视觉验收，最后用生成器生成选定主题并替换旧默认主题。','旧默认 Theme 链已按 2026-10-04 决策提前退休；当前工作是在唯一 canonical Theme 上继续完善消费链、Style、Studio 与视觉验收，不再等待 Phase H 才切换。');
  text=text.replace('| R15 | 当前阶段整理、完善方案；仓库代码实现需作为后续工作单独开展。 |','| R15 | 当前已进入仓库实现与验收；方案中的未定项必须先补来源/契约，再进入代码，不得恢复已退休的双轨 Theme。 |');
  fs.writeFileSync(file,text);
}

// Replace stale THEME-VISUAL-V2 CURRENT block with current implementation truth.
{
  const file='AI_WORK_STATE.md';
  let text=fs.readFileSync(file,'utf8');
  text=text.replace(/- Current Phase: THEME-VISUAL-V2-001[^\n]*/, '- Current Phase: THEME-VISUAL-V2-001 — single public Theme canonicalization complete; color/physical Type and md geometry substantially migrated; non-color Style/consumer migration and full visual acceptance continue.');
  text=text.replace(/- Current Task: `THEME-VISUAL-V2-001`[^\n]*/, '- Current Task: `THEME-VISUAL-V2-001` — IMPLEMENTING; approximately 65% scope estimate across v1.5 A–H after the 2026-10-04 single-system decision.');
  const start=text.indexOf('## CURRENT\n');
  const end=text.indexOf('## Current authority snapshot — after Phase A');
  if(start<0||end<0||end<=start)throw new Error('AI_WORK_STATE CURRENT anchors missing');
  const current=`## CURRENT\n\nTask: THEME-VISUAL-V2-001 — Theme input → shared rules → Component, per QXFRAME9A7C2-Theme-Visual-System-v1.5.md and its 2026-10-04 implementation-decision override.\nStatus: IMPLEMENTING; approximately 65% scope estimate. Query GitHub for the active PR/head/CI on resume; do not reuse run IDs from this checkpoint.\n\nCurrent architecture truth:\n- There is one public CSS Theme system. The old .qxframe9a7c2-play-settings configurator, old Theme Studio assets, old generator/Schema1 Theme contract, old theme/default and theme/family public chain and old visual opt-in marker are retired and must not return.\n- Theme v2 is canonical without data-qxframe9a7c2-visual=2. Private --_qxframe9a7c2-* implementation constants may temporarily carry non-theme geometry while migration continues; they are not a second public Theme interface. Retired private paint/color fallbacks are actively poisoned in real-DOM acceptance so remaining consumers are exposed and migrated.\n- Studio v2 is the sole generator surface. User-facing configuration labels are Chinese; internal enum/JSON keys may remain English.\n- Color authority: locked shadcn source SHA 295a1f114a138f23b5dfee0e0c6812394dfeb90c, complete semantic colors plus physical Types and sparse optional overrides. Do not invent pressed/state intensity or reintroduce palette/state matrices.\n- Geometry authority: qx-md-2, 21 md inputs only, fixed xs/sm/md/lg/xl CSS derivation, independent density/radius/surface spacing. Sera editorial text resolves md control font to 12px without a second size curve; explicit advanced md override still wins.\n- Non-color authority: qx-style-3. Visible finite axes currently include typography density, text style, body/heading/mono fonts, control appearance, border, shadow, motion pace, surface and Shape families. Style chooses defaults; user changes are final and must not be overwritten by hidden Style values.\n- Control Appearance is shared and source-backed: outline / tinted / tinted-subtle / soft / underline, shown in Studio as 描边 / 着色描边 / 轻着色描边 / 柔和填充 / 下划线. Vega/Nova/Lyra default outline; Maia tinted; Mira tinted-subtle; Luma/Rhea soft; Sera underline. Focus/invalid border topology remains visible while disabled source-specific fills are preserved.\n- Sera text style is source-backed editorial: serif heading; Button 12px/600/uppercase/wide tracking; Card title wider tracking/uppercase; changing 文字风格 or 控件外观 in Studio must immediately replace those defaults. Chinese content itself is never transformed in source text.\n\nCompleted in the current batch and do not redo:\n- destructive retirement of old Theme UI/JS/public Token chain and legacy Schema1 generator artifacts; reverse gates enforce absence.\n- Chinese Studio labels, physical Type editing, sparse delete/restore, JSON import/export and CSS export.\n- shared color consumer expansion, physical Types, 21-md geometry, qx-md-2 Sera correction, qx-style-3 typography/text/control-appearance work.\n- PR description and master v1.5 doc updated to the single-system decision.\n\nCurrent acceptance work:\n- Real canonical DOM consumer poison must target only retired private paint roles, never geometry/motion constants. Earlier 3,500-input poison was invalid because it corrupted border widths/shadow geometry; the probe is now narrowed. Any remaining magenta paint mismatch after narrowing is a real legacy paint dependency and must be migrated rather than ignored.\n- Required source/color/physical-Type equivalence, geometry, Studio static/browser, full release, Windows and Pages gates must pass on the same accepted head before merge. Do not weaken exact color or CSS-pixel tolerances to get green CI.\n\nNext exact steps:\n1. Run current PR gates after qx-style-3/controlAppearance and the narrowed private-paint poison probe.\n2. Fix genuine remaining consumer paint dependencies revealed by that probe; preserve shared ownership rather than adding component-local Theme chains.\n3. Continue v1.5 non-color axes only where pinned source/commonality supports them (surface separation/border/shadow allocation, motion role sharing, Menu/feedback/material candidates). Do not invent eight different motion curves when source evidence does not support them.\n4. Complete broad all-component/narrow-container/native/Popup/cross-browser visual G acceptance and final private-paint cleanup.\n5. Update this checkpoint and change documentation with final counts before merge; then verify merged main release, Windows and Pages.\n\nFrozen constraints: pure CSS runtime authority; no ThemeController/TokenController; Flex-only framework layout, no display:grid/fr/vw/vh; no @layer/:is()/:where(); existing focus-origin, Popup/Scroll and Controller ownership protocols remain intact.\n\n`;
  text=text.slice(0,start)+current+text.slice(end);
  fs.writeFileSync(file,text);
}

console.log(JSON.stringify({ok:true,decisionOverride:true,chineseSoftLabel:true,checkpoint:true}));
