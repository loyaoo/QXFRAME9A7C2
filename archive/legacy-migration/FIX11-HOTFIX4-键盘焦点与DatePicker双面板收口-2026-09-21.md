# QXFRAME9A7C2 v2.19.81 FIX11 FINAL HOTFIX4

日期：2026-09-21  
基线：`QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX3-2026-09-21`

## 本轮收口范围

本轮针对 HOTFIX3 后继续暴露的键盘焦点、虚拟焦点与 DatePicker 双面板状态同步问题进行收口，不改变组件公开业务语义，重点统一“真实焦点 owner + 组件内部虚拟焦点”的交互模型。

### 1. TreeSelect Multiple

- Multiple / checkable 模式下，列表活动项现在可使用 `Enter` 勾选/取消勾选。
- 搜索框为空时，`Space` 也可对活动树节点执行勾选。
- 搜索框存在实际输入内容时，空格仍保留为文本输入，不抢占搜索输入行为。
- 单选 TreeSelect 原有 Enter 提交与关闭逻辑保持不变。

### 2. Tags overflow 与 Add Tag

- `.qxframe9a7c2-tag-overflow` 恢复为不可 Tab、不可虚拟聚焦目标，`tabIndex=-1`。
- `+ Add Tag` 不再作为真实 Tab stop，统一纳入 Tags 内部虚拟焦点序列。
- 左右方向键可在可见 tag shell 与 `+ Add Tag` 之间移动虚拟焦点。
- 虚拟焦点位于 `+ Add Tag` 时按 Enter 进入输入态。
- 输入态按 Enter：
  - 空内容：退出输入态并回到虚拟 `+ Add Tag`；
  - 重复内容：不创建、不清空输入、不退出输入态；
  - 有效新内容：创建后回到虚拟 `+ Add Tag`。
- tag close 按钮仍不进入独立 Tab 焦点序列。

### 3. TagInput

- TagInput 增加与 MultipleSelect tags 一致的内部虚拟 tag 导航。
- 输入光标处于文本起点时，`ArrowLeft` 可进入最后一个 tag；`ArrowLeft/ArrowRight` 在 tag 之间切换。
- 虚拟 tag 上按 `Backspace/Delete` 删除对应 tag，并继续维持合理的虚拟焦点。
- 从最后一个 tag 向右可返回真实 input 文本编辑位置。

### 4. DatePicker 年/月 drill 后返回日期网格

- 年、月面板键盘选中后，真实键盘 owner 会回到 DatePicker field host。
- 日期 Calendar 的 active date 同步后重新激活日期 cell 的虚拟焦点。
- 随后继续按方向键，不再重新跳回旧的年/月状态，日期 cell 导航保持有效。

### 5. DatePicker 双面板范围选择后 Tab 导致月份漂移

已定位键盘路径与鼠标路径表现不同的根因：

1. 范围选择完成第二个端点后，`activeRangePart` 指向结束日期；
2. 键盘 `Tab` 从 field 进入左侧 Calendar 的年份按钮时会触发 input `blur`；
3. 原 `handleBlur()` 把“焦点进入自身 popup”误判成真正离开 DatePicker；
4. blur 流程重新解析 field，并调用 `syncSelectionPanel(true)`；
5. 因当前活动端点是 2026-10-20，双面板主视图被错误同步到 10 月，次面板随之变成 11 月。

修复后，`blur.relatedTarget` 若仍位于当前 DatePicker popup 内部，则视为组件内部焦点交接，不再执行 editor blur commit / selection-panel resync。因此键盘选择 `2026-09-26 ~ 2026-10-20` 后，从日期区 Tab 到左侧年份设置，面板继续保持 **2026-09 / 2026-10**，不会漂移为 10 / 11 月。鼠标与键盘路径由此统一。

### 6. Tabs close

- `.qxframe9a7c2-tabs-close` 全部设为 `tabIndex=-1`。
- close 的 pointerdown 阻止默认聚焦，因此鼠标点击关闭也不会把真实焦点短暂转移到 close 按钮。
- Tabs 的键盘焦点仍由 tab item/action 体系统一管理。

## 自动回归覆盖

本轮新增或强化的浏览器回归包括：

- `regression-tree-select-multiple-enter-checks`
- `regression-tree-select-multiple-space-checks-empty-search`
- `regression-date-drill-restores-date-cell-focus`
- `regression-date-drill-arrow-keeps-date-focus`
- `regression-date-range-keyboard-selection-value`
- `regression-date-dual-tab-does-not-shift-view`
- `regression-tags-focus-contract`
- `regression-tags-add-is-virtual-focus-target`
- `regression-tags-add-enter-opens-input`
- `regression-tags-empty-enter-returns-add`
- `regression-tags-duplicate-enter-preserves-editor`
- `regression-tag-input-virtual-tag-navigation`
- `regression-tag-input-backspace-removes-virtual-tag`
- `regression-tabs-close-not-tabbable`

## 验证结果

### Node / build / contracts / platform / release

执行：

```bash
npm test
```

结果：**PASS**。

- Build：72 modules，dependency graph verified
- `verify:core`：PASS
- `verify:contracts`：PASS
- `verify:platform`：PASS
- `verify:release`：PASS
- Bundle SHA-256：`7486f7efc4c627b8ed3079db463f33fc991c2cf5627d64e2b19fc76ce7f9f835`
- CSS SHA-256：`5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`

完整输出：`FIX11-HOTFIX4-node-test.txt`

### Browser smoke / regression

执行：

```bash
QX_BROWSER_REQUIRED=1 npm run verify:browser
```

结果：**PASS**，`"ok":true`，Chromium 实际执行，未跳过浏览器验证。

完整输出：`FIX11-HOTFIX4-browser-test.txt`

## 说明

包内保留 HOTFIX1 / HOTFIX2 / HOTFIX3 的历史报告与日志用于追溯；本文件是 HOTFIX4 对本轮新增问题的最新收口说明。若历史文档中的某项焦点规则与本文件冲突，以 HOTFIX4 当前源码、当前测试和本文件为准。
