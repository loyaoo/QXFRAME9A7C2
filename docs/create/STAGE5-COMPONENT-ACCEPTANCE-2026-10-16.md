# Stage 5｜全组件覆盖与剩余验收矩阵（2026-10-16）

## 范围与判断边界

- 来源：`src/components/index.js` 的模块导出、`preview-03-coverage.json` 的 66 张商业演示卡片，以及真实 Chromium 测试名称。当前 PR #267 仍为 Draft，禁止合并或更改 main。
- 66 张卡片覆盖 65 种 Preview03 组件族；另外 10 个导出的共享/宿主模块没有单独商业卡片。**组件展示不等于 Shadcn 对齐或 Theme 全状态验收。**
- `pending-individual-review`：此组件没有逐组件、逐状态的 shadcn 0.5px 验收证据；这不代表组件实现错误。Stage3/4 的 Preview01/02 对齐结论仍独立保留。
- `targeted-browser-evidence`：现有 CI 确实存在具名 Chromium 覆盖，但范围仅限该测试声明的状态/属性，并不宣称全矩阵完成。
- `individual-theme-matrix-pending`：当前只有演示卡片对应，缺独立 8 Styles × 明暗 × 状态／密度／形状／弹层的逐组件实测；**不是断言 Theme 尚未接入**。
- `inherited-through-owner-not-independently-certified`：共享底层出口透过上层组件使用，缺独立测试，不能额外创建第二套 CSS/JS 实现。
- 证据单源：本表由 `preview-03-coverage.json.stage5Acceptance` 定义，`verify-create-app.mjs` 校验组件入口、演示卡片与具名测试证据，防止将无效的 66/66 卡片当作全框架完成率。

## 状态清单（65 + 10）

| 组件 / 模块 | 实际演示载体 | Shadcn 对齐状态 | Theme 验收状态 | 具名证据或边界 |
| --- | --- | --- | --- | --- |
| `alert` | `alert-triage` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 Alert/Dropdown/Tags appearance and Image Preview chrome/leave lifecycle` |
| `autocomplete` | `contact-lookup` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `avatar` | `stakeholder-roster` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `badge` | `compliance-flags` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `button` | `trading-toolbar` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `calendar` | `fiscal-periods` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 Calendar Week Hover selects seven contiguous dates with opaque Range endpoints` |
| `card` | `revenue-surfaces` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 shape parity: 8 styles` |
| `carousel` | `marketing-creative` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `cascader` | `order-routing` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `checkbox` | `audit-checklist` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `collapse` | `rules-automation` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `color-panel` | `palette-laboratory` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `color-picker` | `brand-studio` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `control` | `field-workbench` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `date-picker` | `release-planner` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `descriptions` | `asset-properties` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `drawer` | `account-drawer` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `dropdown` | `quick-action-menu` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 Dropdown all/block/none list-frame padding owns root/submenus and dynamic updates` |
| `empty` | `blank-workspace` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `form` | `vendor-intake` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `grid` | `product-bins` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `icon` | `icon-tokens` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `image` | `asset-preview` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 Alert/Dropdown/Tags appearance and Image Preview chrome/leave lifecycle` |
| `input-number` | `finance-approval` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `input-otp` | `identity-otp` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `item` | `approval-queue-item` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `json` | `data-inspector` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `layout` | `admin-shell-layout` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `list` | `activity-timeline` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `loading` | `task-processing` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `menu` | `navigation-workspace` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Inverted Select ItemCollection idle/selected/hover/disabled colors` |
| `message` | `inbox-notice` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `modal` | `danger-dialog` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `notification` | `alerts-center` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `option-list` | `command-palette` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `pagination` | `plan-governance` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `popconfirm` | `delete-policy` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `popover` | `customer-insights` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `progress` | `service-health` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `radio` | `fraud-decision` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `rate` | `customer-quality` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `result` | `transaction-outcome` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `ripple` | `ripple-commands` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `scroll` | `operational-feed` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `select` | `order-routing` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Inverted Select ItemCollection idle/selected/hover/disabled colors` |
| `slider` | `usage-meter` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `sort` | `backlog-ordering` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `steps` | `onboarding-flow` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `switch` | `feature-flags` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `table` | `plan-governance` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `tabs` | `segmented-console` | 待逐组件复核 | 已有针对性 Chromium 测试 | `FAQ segmented Tabs typography` |
| `tag-input` | `customer-quality` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `tags` | `support-triage` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 Alert/Dropdown/Tags appearance and Image Preview chrome/leave lifecycle` |
| `time-panel` | `shift-allocation` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 shared WheelPanel / WheelPicker / TimePicker guide and unified passive dividers` |
| `time-picker` | `release-planner` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 shared WheelPanel / WheelPicker / TimePicker guide and unified passive dividers` |
| `tooltip` | `sla-tooltip` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `transfer` | `workforce-access` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `transition` | `state-transitions` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `transition-group` | `stream-animation` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `tree` | `org-hierarchy` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `tree-select` | `platform-tree` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `trigger` | `context-triggers` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `upload` | `contract-documents` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `virtual-list` | `virtual-monitor` | 待逐组件复核 | 缺独立矩阵 | 不能因卡片存在认定已验收 |
| `wheel-picker` | `dial-settings` | 待逐组件复核 | 已有针对性 Chromium 测试 | `Stage5 shared WheelPanel / WheelPicker / TimePicker guide and unified passive dividers` |
| `field`（共享出口） | `field-workbench` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | Control / Field semantic projection |
| `text-field`（共享出口） | `field-workbench` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | native and JS TextField in the Control family |
| `period-panel`（共享出口） | `fiscal-periods` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | Calendar period/unit selector |
| `popup-field`（共享出口） | `release-planner` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | DatePicker hosted PopupField |
| `popup`（共享出口） | `quick-action-menu` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | Dropdown PopupComponent base |
| `item-collection`（共享出口） | `quick-action-menu` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | Dropdown ItemCollection rows and groups |
| `overlay`（共享出口） | `danger-dialog` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | Modal OverlayComponent base |
| `picker`（共享出口） | `release-planner` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | DatePicker PickerComponent base |
| `picker-field`（共享出口） | `release-planner` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | DatePicker PickerField host |
| `wheel-panel`（共享出口） | `shift-allocation` | 不对应独立 shadcn 组件 | 继承宿主、待独立测试 | TimePanel WheelPanel columns |

## 仍需处理，不应提前关闭

1. 对没有具名测试的 Preview03 组件逐批补 8 Style × light/dark 真实计算样式；优先包含当前用户关心的不同状态、密度、圆角、反色/弹层情形。逐批在相同组件主人处修问题，避免建第二套 painter。
2. 10 个共享出口必须按其上层宿主验证，不新增重复商业卡片。验收数目应分别统计：卡片 66、独立组件族 65、共享出口 10，而非简单加和视为全部通过。
3. shadcn create 的逐卡几何对齐属于 Stage3/4 和锁定参照；对无直接对应的 QX 组件按 QX Theme/交互规则验收。当前矩阵不会虚构“与 shadcn 已像素级一致”。
4. Image Preview 的历史录像已经显示退场闪动，但现有源码/CI 修复仍需用户使用**最新 HEAD**录像对照；必须保留人工验收状态。
5. 新 theme-generator 仍待用户最终验收。`docs/assets/theme-generator` 旧资源只有新版通过且明确允许移除之后才可删除。
6. 所有模块对齐结果与视觉终验尚未完成；PR #267 必须保持 Draft，不修改 main。

**工程进度**：本次完成清单覆盖及缺口防漂移门禁；阶段总体百分比仍不应按 66/66 卡片推算为 100%。
