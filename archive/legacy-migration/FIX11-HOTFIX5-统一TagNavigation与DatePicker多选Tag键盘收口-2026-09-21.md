# FIX11 HOTFIX5：统一 TagNavigation 与 DatePicker 多选 Tag 键盘收口

日期：2026-09-21
版本基线：QXFRAME9A7C2 v2.19.81 FIX11 FINAL HOTFIX4

## 本轮问题

1. DatePicker `multiple` 已使用 Tags 外观，但没有接入与多选 Select / TreeSelect / Cascader / TagInput 一致的 Tag 键盘游标，无法用左右方向键选择 Tag 后删除。
2. 多个带 Tags 的复合组件虽然共享 Tags 的 DOM / 样式和虚拟 Tag 基础能力，但宿主层的方向键、Backspace/Delete、退出到输入框等键盘编排各自重复实现，导致行为逐步漂移。
3. 独立 Tags 的虚拟焦点移动到最后一项（通常为 `+ Add Tag`）后再次按右方向键，会清除虚拟焦点，造成可见焦点“消失”。
4. `+ Add Tag` 只有 Enter 能进入编辑状态；当虚拟焦点停在该项时直接输入普通字符，未自动进入 input。

## 根因与架构修复

新增 canonical DOMHeadless 服务 `TagNavigation`，由它统一负责“Tags 作为复合控件子区域”时的键盘导航编排：

- ArrowLeft / ArrowRight 在 Tag 间移动虚拟焦点；
- 在宿主允许时从最后一个 Tag 向右退出到输入区；
- Backspace 从输入区武装最后一个 Tag，再次 Backspace/Delete 删除；
- 已聚焦 Tag 时 Backspace/Delete 直接删除；
- Escape 清理虚拟 Tag 焦点；
- 统一处理 IME / 原生文本编辑保护、disabled / readonly 等锁定状态。

以下组件已经迁移到同一 `TagNavigation` 依赖，不再各自维护一套 hosted-tag 键盘逻辑：

- Select
- TreeSelect
- Cascader
- TagInput
- DatePicker（multiple）

基础 Tags 仍负责 Tag DOM、虚拟焦点数据、滚动可见性与删除能力；`TagNavigation` 只负责统一键盘编排。这样视觉层、状态层和键盘交互层都有唯一 owner。

`tools/verify-core.js` 新增架构收口守卫：上述五个复合组件必须依赖 canonical `TagNavigation`，避免后续版本重新分叉出多套实现。

## 交互修复

### DatePicker multiple

- 左右方向键可进入并移动 Tag 虚拟焦点；
- Backspace/Delete 可删除当前虚拟聚焦 Tag；
- 弹出日期面板打开时，日期网格方向键优先，不与 Tag 导航抢键；
- 面板关闭后恢复多选 Tag 键盘导航。

### 独立 Tags

- 最后一项再次 ArrowRight 改为边界钳制，不再把虚拟焦点清到不可见位置；
- 当虚拟焦点位于 `+ Add Tag` 时：
  - Enter 仍进入 input；
  - 直接输入普通可打印字符也会自动进入 input，并保留该首字符；
  - 不再额外制造真实 Tab stop。

## 验证

新增浏览器回归项：

- `regression-tags-right-edge-keeps-visible-focus`
- `regression-tags-printable-key-opens-add-editor`
- `regression-date-picker-multiple-tag-navigation`
- `regression-date-picker-multiple-tag-backspace-removes`

同时保留并通过既有 TagInput、Select、TreeSelect、Cascader、DatePicker、Tabs 等键盘/虚拟焦点回归。
