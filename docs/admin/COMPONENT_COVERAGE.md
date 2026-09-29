# Admin component integration coverage

This is the acceptance ledger for using every public QXFRAME9A7C2 component in normal admin-template scenarios. It is not a second component showcase. Component-specific exhaustive API/state matrices remain in `docs/components/*.html`; this ledger requires each component's normal public usage family to be represented by the complete admin preset.

| Component | Admin scenario | Runtime/DOM evidence |
| --- | --- | --- |
| alert | monitor | `qxframe9a7c2-alert-root` |
| autocomplete | shell / search | `C.Autocomplete` |
| avatar | shell / workplace | `qxframe9a7c2-avatar` |
| badge | dashboard / business pages | `qxframe9a7c2-badge` |
| button | all admin pages | `qxframe9a7c2-button` |
| calendar | schedule | `C.Calendar` |
| card | all admin pages | `qxframe9a7c2-card` |
| carousel | marketing | `C.Carousel` |
| cascader | workflow / content-add | `C.Cascader` |
| checkbox | theme-center / forms | `type="checkbox"` |
| collapse | workflow | `C.Collapse` |
| color-panel | theme-center | `C.ColorPanel` |
| color-picker | theme-center | `C.ColorPicker` |
| control | forms / filters | `Control.enhance` |
| date-picker | schedule / filters | `C.DatePicker` |
| descriptions | basic-detail / profile | `qxframe9a7c2-descriptions` |
| drawer | products | `C.Drawer` |
| dropdown | admin shell | `C.Dropdown` |
| empty | developer-tools / search states | `qxframe9a7c2-empty` |
| form | basic-form | `qxframe9a7c2-form qx-admin-form-layout` |
| grid | all admin views | `qxframe9a7c2-row` |
| icon | admin shell / alerts | `qxframe9a7c2-icon` |
| image | products / media | `C.Image` |
| input-number | theme-center / content form | `C.InputNumber` |
| input-otp | account-settings | `C.InputOTP` |
| item | workflow | `C.Item` |
| json | developer-tools | `C.JSON` |
| layout | dashboard shell | `qxframe9a7c2-layout` |
| list | monitor | `C.List` |
| loading | developer-tools | `C.Loading` |
| menu | admin shell | `C.Menu` |
| message | developer-tools | `C.Message` |
| modal | products | `C.Modal` |
| notification | developer-tools | `C.Notification` |
| option-list | developer-tools | `C.OptionList` |
| pagination | table-list / admin list | `C.Pagination` |
| period-panel | schedule | `C.PeriodPanel` |
| popconfirm | products | `C.Popconfirm` |
| popover | theme-center | `C.Popover` |
| progress | monitor / dashboard | `C.Progress` |
| radio | theme-center | `type="radio"` |
| rate | customers | `C.Rate` |
| result | developer-tools / result pages | `C.Result` |
| ripple | theme-center actions | `is-ripple` |
| scroll | developer-tools | `C.Scroll` |
| select | forms / filters | `C.Select` |
| slider | theme-center | `C.Slider` |
| sort | workflow | `C.Sort` |
| steps | workflow / step-form | `C.Steps` |
| switch | theme-center / settings | `qxframe9a7c2-switch` |
| table | business lists | `C.Table` |
| tabs | admin shell | `C.Tabs` |
| tag-input | products / content form | `C.TagInput` |
| tags | products | `C.Tags` |
| time-panel | schedule | `C.TimePanel` |
| time-picker | schedule | `C.TimePicker` |
| tooltip | theme-center | `C.Tooltip` |
| transfer | workflow | `C.Transfer` |
| transition-group | developer-tools | `DOMHeadless.TransitionGroup` |
| transition | developer-tools | `DOMHeadless.Transition.create` |
| tree-select | workflow | `C.TreeSelect` |
| tree | workflow | `C.Tree` |
| trigger | developer-tools | `C.Trigger` |
| upload | media | `C.Upload` |
| virtual-list | developer-tools | `C.VirtualList` |
| wheel-picker | schedule | `C.WheelPicker` |

## Acceptance rule

- CSS/DOM primitives use their canonical authored DOM contract.
- Stateful/runtime components are created through the same public owner/API used by the component documentation.
- Low-level Trigger / Transition / TransitionGroup are limited to the developer/diagnostic workspace, where those primitives are a legitimate product requirement.
- Third-party admin projects are information-architecture references only; no third-party UI implementation or assets are copied.
