// Generated once from the frozen HOTFIX6 ModuleManifest during Registry cutover.
export const moduleManifestData = Object.freeze([
  {
    "name": "alert",
    "modules": [
      "icon"
    ],
    "capabilities": {}
  },
  {
    "name": "autocomplete",
    "modules": [
      "component-contracts",
      "components",
      "control",
      "option-list",
      "trigger",
      "dom-headless",
      "item",
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Utils"
      ],
      "headless": [
        "AsyncTask",
        "ValueController",
        "ItemSchema",
        "OpenStateBridge",
        "ItemAccessors",
        "OptionTransaction",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "DOMBinding",
        "KeyboardNavigation",
        "FieldHost"
      ],
      "buildingBlocks": [
        "Control",
        "OptionList",
        "Item"
      ],
      "components": [
        "Trigger",
        "Scroll"
      ]
    }
  },
  {
    "name": "avatar",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "badge",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "button",
    "modules": [
      "core",
      "ripple"
    ],
    "capabilities": {}
  },
  {
    "name": "calendar",
    "modules": [
      "headless",
      "dom-headless",
      "building-block-base",
      "button",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle"
      ],
      "headless": [
        "ActiveItem",
        "ValueController",
        "DateUnit",
        "TemporalGrid"
      ],
      "domHeadless": [
        "KeyboardRegion",
        "EventDelegation",
        "Renderer",
        "DOMBinding"
      ],
      "buildingBlocks": []
    }
  },
  {
    "name": "card",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "carousel",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Config",
        "Utils"
      ],
      "domHeadless": [
        "Renderer",
        "PointerSession"
      ]
    }
  },
  {
    "name": "cascader",
    "modules": [
      "component-contracts",
      "control",
      "item-collection",
      "trigger",
      "headless",
      "dom-headless",
      "item",
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "Selection",
        "AsyncTaskGroup",
        "ItemSchema",
        "OpenStateBridge",
        "SelectionTags",
        "HierarchicalSelection",
        "SearchState",
        "InteractionPolicy",
        "ItemAccessors",
        "OptionTransaction"
      ],
      "domHeadless": [
        "DOMBinding",
        "Renderer",
        "KeyboardNavigation",
        "TagNavigation",
        "FieldHost"
      ],
      "buildingBlocks": [
        "Control",
        "ItemCollection",
        "Item"
      ],
      "components": [
        "Trigger",
        "Scroll"
      ]
    }
  },
  {
    "name": "checkbox",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "collapse",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "Disclosure",
        "ActiveItem"
      ],
      "domHeadless": [
        "KeyboardNavigation",
        "Renderer",
        "Transition",
        "RovingProjection"
      ]
    }
  },
  {
    "name": "color-panel",
    "modules": [
      "dom-headless",
      "building-block-base",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Utils"
      ],
      "headless": [
        "InteractionPolicy"
      ],
      "domHeadless": [
        "EventDelegation",
        "Renderer",
        "DOMBinding",
        "PointerSession"
      ],
      "buildingBlocks": []
    }
  },
  {
    "name": "color-picker",
    "modules": [
      "component-contracts",
      "picker-field-base",
      "color-panel",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Utils"
      ],
      "headless": [
        "ValueController",
        "OpenStateBridge",
        "PickerSession",
        "OptionTransaction",
        "InteractionPolicy",
        "ValueEquality"
      ],
      "domHeadless": [
        "PointerSession"
      ],
      "buildingBlocks": [
        "ColorPanel"
      ]
    }
  },
  {
    "name": "component-contracts",
    "modules": [
      "components"
    ],
    "capabilities": {}
  },
  {
    "name": "control",
    "modules": [
      "headless",
      "dom-headless",
      "building-block-base",
      "icon",
      "tags"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Config",
        "SemanticStyles",
        "IdManager",
        "Utils"
      ],
      "headless": [
        "SegmentedInput",
        "TextInputBehavior",
        "InteractionPolicy",
        "ClearAction",
        "ValueEquality"
      ],
      "domHeadless": [
        "Renderer",
        "DOMBinding",
        "FormBridge",
        "InteractionModality"
      ],
      "buildingBlocks": []
    }
  },
  {
    "name": "date-picker",
    "modules": [
      "component-contracts",
      "picker-field-base",
      "calendar",
      "period-panel",
      "time-panel"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Utils"
      ],
      "headless": [
        "ValueController",
        "DateUnit",
        "OpenStateBridge",
        "PickerSession",
        "SelectionTags",
        "OptionTransaction",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "TagNavigation"
      ],
      "buildingBlocks": [
        "Calendar",
        "PeriodPanel",
        "TimePanel"
      ],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "descriptions",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "drawer",
    "modules": [
      "component-contracts",
      "scroll",
      "dom-headless",
      "button",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Lifecycle",
        "Config",
        "Utils"
      ],
      "headless": [
        "OverlayFramePolicy"
      ],
      "domHeadless": [
        "Renderer",
        "OverlayRuntime",
        "OverlayFrameShell",
        "PopupSurface",
        "Transition",
        "MotionPresets"
      ],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "dropdown",
    "modules": [
      "component-contracts",
      "trigger",
      "item-collection",
      "headless",
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "Selection",
        "ItemSchema",
        "HierarchicalSelection",
        "InteractionPolicy",
        "ItemAccessors",
        "OpenStateBridge"
      ],
      "domHeadless": [
        "KeyboardNavigation"
      ],
      "buildingBlocks": [
        "ItemCollection"
      ],
      "components": [
        "Trigger",
        "Scroll"
      ]
    }
  },
  {
    "name": "empty",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "empty-projection",
    "modules": [
      "dom-headless",
      "empty"
    ],
    "capabilities": {
      "core": [
        "Utils"
      ],
      "domHeadless": [
        "Renderer"
      ]
    }
  },
  {
    "name": "form",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "grid",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "icon",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "image",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Config",
        "Utils"
      ],
      "headless": [
        "TransformModel"
      ],
      "domHeadless": [
        "Renderer",
        "OverlayRuntime",
        "PopupSurface",
        "Transition",
        "PointerSession"
      ]
    }
  },
  {
    "name": "input-number",
    "modules": [
      "component-contracts",
      "components",
      "control",
      "headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Utils"
      ],
      "headless": [
        "NumericInput",
        "OptionTransaction",
        "InteractionPolicy"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "input-otp",
    "modules": [
      "component-contracts",
      "components",
      "control"
    ],
    "capabilities": {
      "core": [
        "Scheduler",
        "DOM",
        "Utils"
      ],
      "headless": [
        "OptionTransaction"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "item",
    "modules": [
      "building-block-base",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "DOMProjection"
      ]
    }
  },
  {
    "name": "item-collection",
    "modules": [
      "headless",
      "dom-headless",
      "virtual-list",
      "item",
      "empty-projection",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "Scheduler",
        "Utils",
        "DOM",
        "ScrollVisibility"
      ],
      "headless": [
        "Collection",
        "Selection",
        "ActiveItem",
        "AsyncTask",
        "InteractionPolicy",
        "SearchState"
      ],
      "domHeadless": [
        "KeyboardNavigation",
        "InteractionModality",
        "EventDelegation",
        "Renderer",
        "DOMBinding",
        "EmptyProjection"
      ],
      "buildingBlocks": [
        "VirtualList",
        "Item"
      ]
    }
  },
  {
    "name": "json",
    "modules": [
      "component-contracts",
      "components",
      "tree",
      "button"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "domHeadless": [
        "KeyboardRegion"
      ],
      "buildingBlocks": [
        "Tree"
      ]
    }
  },
  {
    "name": "layout",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "list",
    "modules": [
      "item-collection"
    ],
    "capabilities": {
      "core": [
        "Utils"
      ],
      "buildingBlocks": [
        "ItemCollection"
      ]
    }
  },
  {
    "name": "loading",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless",
      "progress"
    ],
    "capabilities": {
      "core": [
        "Scheduler",
        "DOMProjection",
        "Utils"
      ],
      "domHeadless": [
        "OverlayRuntime",
        "PopupSurface",
        "Renderer"
      ],
      "components": [
        "Progress"
      ]
    }
  },
  {
    "name": "menu",
    "modules": [
      "component-contracts",
      "trigger",
      "dom-headless",
      "item",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Utils",
        "ScrollVisibility",
        "IdManager"
      ],
      "headless": [
        "Selection",
        "ItemSchema",
        "ItemAccessors"
      ],
      "domHeadless": [
        "DOMBinding",
        "KeyboardRegion",
        "ObserverHub",
        "Transition",
        "ResponsiveOverflow"
      ],
      "buildingBlocks": [
        "Item"
      ],
      "components": [
        "Trigger"
      ]
    }
  },
  {
    "name": "message",
    "modules": [
      "component-contracts",
      "components",
      "notice-service",
      "icon"
    ],
    "capabilities": {
      "headless": [
        "NoticePreset"
      ],
      "buildingBlocks": [
        "NoticeService"
      ]
    }
  },
  {
    "name": "modal",
    "modules": [
      "component-contracts",
      "scroll",
      "dom-headless",
      "button",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Lifecycle",
        "Config",
        "IdManager",
        "Utils"
      ],
      "headless": [
        "OverlayFramePolicy"
      ],
      "domHeadless": [
        "Renderer",
        "OverlayRuntime",
        "OverlayFrameShell",
        "PopupSurface",
        "Transition",
        "MotionPresets"
      ],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "notice-clock",
    "modules": [
      "building-block-base"
    ],
    "capabilities": {
      "buildingBlocks": []
    }
  },
  {
    "name": "notice-service",
    "modules": [
      "dom-headless",
      "notice-clock"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Config",
        "IdManager",
        "Utils"
      ],
      "domHeadless": [
        "Renderer",
        "LayerManager",
        "TransitionGroup",
        "ObserverHub"
      ],
      "buildingBlocks": [
        "NoticeClock"
      ]
    }
  },
  {
    "name": "notification",
    "modules": [
      "component-contracts",
      "components",
      "notice-service",
      "icon"
    ],
    "capabilities": {
      "headless": [
        "NoticePreset"
      ],
      "buildingBlocks": [
        "NoticeService"
      ]
    }
  },
  {
    "name": "option-list",
    "modules": [
      "item-collection"
    ],
    "capabilities": {
      "core": [],
      "headless": [],
      "domHeadless": [],
      "buildingBlocks": [
        "ItemCollection"
      ]
    }
  },
  {
    "name": "pagination",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "select",
      "button",
      "icon",
      "item"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "Utils",
        "Scheduler"
      ],
      "headless": [
        "PaginationModel"
      ],
      "domHeadless": [
        "KeyboardNavigation",
        "EventDelegation",
        "Renderer",
        "DOMBinding"
      ],
      "buildingBlocks": [
        "Item"
      ],
      "components": [
        "Select"
      ]
    }
  },
  {
    "name": "period-panel",
    "modules": [
      "headless",
      "dom-headless",
      "building-block-base",
      "button",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle"
      ],
      "headless": [
        "DateUnit",
        "TemporalGrid",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "KeyboardRegion",
        "EventDelegation",
        "DOMBinding"
      ],
      "buildingBlocks": []
    }
  },
  {
    "name": "picker-field-base",
    "modules": [
      "control",
      "trigger",
      "button"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "InteractionPolicy",
        "OpenStateBridge",
        "OptionTransaction"
      ],
      "domHeadless": [
        "DOMBinding",
        "FieldHost",
        "KeyboardNavigation"
      ],
      "buildingBlocks": [
        "Control"
      ],
      "components": [
        "Trigger"
      ]
    }
  },
  {
    "name": "popconfirm",
    "modules": [
      "component-contracts",
      "popover",
      "headless",
      "button"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Utils"
      ],
      "headless": [
        "AsyncAction"
      ],
      "components": [
        "Popover"
      ]
    }
  },
  {
    "name": "popover",
    "modules": [
      "component-contracts",
      "trigger"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "DOM",
        "Utils"
      ],
      "components": [
        "Trigger"
      ]
    }
  },
  {
    "name": "progress",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "IdManager",
        "Utils"
      ],
      "domHeadless": [
        "Renderer"
      ]
    }
  },
  {
    "name": "radio",
    "modules": [
      "core"
    ],
    "capabilities": {}
  },
  {
    "name": "rate",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "control"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "InteractionPolicy",
        "ValueController",
        "OptionTransaction"
      ],
      "domHeadless": [
        "Renderer"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "result",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Scheduler",
        "SemanticStyles",
        "Utils"
      ],
      "domHeadless": [
        "Renderer"
      ]
    }
  },
  {
    "name": "ripple",
    "modules": [
      "component-contracts",
      "component-base"
    ],
    "capabilities": {
      "core": [
        "Lifecycle",
        "DOM",
        "Config"
      ],
      "domHeadless": [
        "ObserverHub",
        "PressInteraction"
      ]
    }
  },
  {
    "name": "scroll",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless"
    ],
    "capabilities": {
      "core": [
        "Utils",
        "Events",
        "Lifecycle",
        "Scheduler",
        "DOM",
        "Config",
        "ScrollVisibility"
      ],
      "headless": [
        "InteractionPolicy"
      ],
      "domHeadless": [
        "DOMBinding",
        "DOMTemplate",
        "ObserverHub",
        "PointerSession"
      ]
    }
  },
  {
    "name": "select",
    "modules": [
      "component-contracts",
      "components",
      "control",
      "option-list",
      "trigger",
      "dom-headless",
      "icon",
      "item",
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "ValueEquality",
        "OpenStateBridge",
        "InteractionPolicy",
        "SelectionTags",
        "OptionTransaction",
        "SearchState"
      ],
      "domHeadless": [
        "DOMBinding",
        "KeyboardNavigation",
        "TagNavigation",
        "Renderer",
        "FieldHost"
      ],
      "buildingBlocks": [
        "Control",
        "OptionList",
        "Item"
      ],
      "components": [
        "Trigger",
        "Scroll"
      ]
    }
  },
  {
    "name": "slider",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "control"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "ValueController",
        "OptionTransaction"
      ],
      "domHeadless": [
        "PointerSession"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "sort",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "control",
      "item",
      "button",
      "icon"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "Collection",
        "OptionTransaction",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "EventDelegation",
        "Renderer",
        "TransitionGroup",
        "LayerManager",
        "ReorderInteraction"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "steps",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "icon",
      "item"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "Collection",
        "ActiveItem"
      ],
      "domHeadless": [
        "Renderer",
        "KeyboardNavigation",
        "RovingProjection"
      ],
      "buildingBlocks": [
        "Item"
      ]
    }
  },
  {
    "name": "switch",
    "modules": [
      "core",
      "headless",
      "dom-headless"
    ],
    "capabilities": {}
  },
  {
    "name": "table",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "empty-projection",
      "button",
      "icon",
      "form",
      "trigger",
      "pagination"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Scheduler",
        "ScrollVisibility",
        "IdManager",
        "Utils"
      ],
      "headless": [
        "TableModel",
        "AsyncTask",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "EventDelegation",
        "Renderer",
        "Virtualizer",
        "EmptyProjection",
        "KeyboardNavigation",
        "InteractionModality",
        "ObserverHub",
        "PointerSession",
        "ReorderInteraction"
      ],
      "components": [
        "Trigger",
        "Pagination"
      ]
    }
  },
  {
    "name": "tabs",
    "modules": [
      "component-contracts",
      "scroll",
      "popover",
      "headless",
      "dom-headless",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "Scheduler",
        "DOM",
        "IdManager",
        "Utils"
      ],
      "headless": [
        "Collection",
        "ActiveItem",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "Renderer",
        "KeyboardNavigation",
        "Transition",
        "ObserverHub",
        "ResponsiveOverflow",
        "RovingProjection"
      ],
      "buildingBlocks": [],
      "components": [
        "Scroll",
        "Popover"
      ]
    }
  },
  {
    "name": "tag-input",
    "modules": [
      "component-contracts",
      "components",
      "control",
      "dom-headless"
    ],
    "capabilities": {
      "core": [
        "Utils"
      ],
      "headless": [
        "OptionTransaction",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "KeyboardNavigation",
        "TagNavigation"
      ],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "tags",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "scroll",
      "popover",
      "icon"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "Scheduler",
        "DOM",
        "Utils",
        "ScrollVisibility"
      ],
      "headless": [
        "TokenInput",
        "Selection",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "FormBridge",
        "Renderer",
        "KeyboardRegion",
        "ObserverHub",
        "ResponsiveOverflow"
      ],
      "components": [
        "Scroll",
        "Popover"
      ]
    }
  },
  {
    "name": "text-field",
    "modules": [
      "control"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Scheduler",
        "Utils"
      ],
      "headless": [],
      "domHeadless": [],
      "buildingBlocks": [
        "Control"
      ]
    }
  },
  {
    "name": "time-panel",
    "modules": [
      "building-block-base",
      "wheel-panel",
      "dom-headless"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Scheduler",
        "Utils"
      ],
      "headless": [
        "InteractionPolicy"
      ],
      "domHeadless": [
        "DOMBinding"
      ],
      "buildingBlocks": [],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "time-picker",
    "modules": [
      "component-contracts",
      "picker-field-base",
      "time-panel"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Utils",
        "Scheduler"
      ],
      "headless": [
        "ValueController",
        "OpenStateBridge",
        "PickerSession",
        "OptionTransaction",
        "InteractionPolicy",
        "ValueEquality"
      ],
      "buildingBlocks": [
        "TimePanel"
      ],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "tooltip",
    "modules": [
      "component-contracts",
      "trigger"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Utils",
        "Config"
      ],
      "headless": [
        "OpenStateBridge"
      ],
      "domHeadless": [
        "TriggerInteraction",
        "LayerManager"
      ],
      "components": [
        "Trigger"
      ]
    }
  },
  {
    "name": "transfer",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "item-collection",
      "dom-headless",
      "pagination",
      "table",
      "control",
      "button",
      "form",
      "icon",
      "item"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Lifecycle",
        "Utils",
        "DOM"
      ],
      "headless": [
        "Collection",
        "InteractionPolicy",
        "OptionTransaction"
      ],
      "domHeadless": [
        "DOMBinding",
        "Renderer"
      ],
      "buildingBlocks": [
        "ItemCollection",
        "Item",
        "Control"
      ],
      "components": [
        "Pagination",
        "Table"
      ]
    }
  },
  {
    "name": "tree",
    "modules": [
      "headless",
      "dom-headless",
      "item-collection",
      "icon",
      "checkbox",
      "item"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "SearchState",
        "TreeModel",
        "Selection",
        "Disclosure",
        "AsyncTaskGroup",
        "ItemSchema",
        "ItemAccessors",
        "InteractionPolicy",
        "HierarchicalSelection"
      ],
      "domHeadless": [
        "Renderer"
      ],
      "buildingBlocks": [
        "ItemCollection",
        "Item"
      ]
    }
  },
  {
    "name": "tree-select",
    "modules": [
      "component-contracts",
      "components",
      "control",
      "tree",
      "trigger",
      "dom-headless",
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Events",
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "ValueController",
        "ItemSchema",
        "OpenStateBridge",
        "InteractionPolicy",
        "SelectionTags",
        "ItemAccessors",
        "OptionTransaction",
        "SearchState"
      ],
      "domHeadless": [
        "DOMBinding",
        "KeyboardNavigation",
        "TagNavigation",
        "FieldHost"
      ],
      "buildingBlocks": [
        "Control",
        "Tree"
      ],
      "components": [
        "Trigger",
        "Scroll"
      ]
    }
  },
  {
    "name": "trigger",
    "modules": [
      "component-contracts",
      "components",
      "dom-headless"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Utils",
        "Config"
      ],
      "headless": [
        "OpenStateBridge"
      ],
      "domHeadless": [
        "OverlayRuntime",
        "PopupSurface",
        "TriggerInteraction",
        "Transition",
        "MotionPresets",
        "LogicalOwnership"
      ]
    }
  },
  {
    "name": "upload",
    "modules": [
      "component-contracts",
      "components",
      "headless",
      "dom-headless",
      "image",
      "control",
      "item",
      "button"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Lifecycle",
        "Utils"
      ],
      "headless": [
        "UploadLifecycle",
        "OptionTransaction"
      ],
      "domHeadless": [
        "Renderer",
        "OverlayRuntime",
        "ReorderInteraction"
      ],
      "buildingBlocks": [
        "Control",
        "Item"
      ],
      "components": [
        "Image"
      ]
    }
  },
  {
    "name": "virtual-list",
    "modules": [
      "dom-headless",
      "building-block-base",
      "item"
    ],
    "capabilities": {
      "core": [
        "Events",
        "Utils"
      ],
      "domHeadless": [
        "Virtualizer",
        "Renderer",
        "DOMBinding"
      ],
      "buildingBlocks": [
        "Item"
      ]
    }
  },
  {
    "name": "wheel-panel",
    "modules": [
      "scroll"
    ],
    "capabilities": {
      "core": [
        "Utils",
        "Events",
        "DOM",
        "IdManager",
        "Scheduler"
      ],
      "headless": [
        "ValueEquality",
        "InteractionPolicy"
      ],
      "domHeadless": [
        "Renderer",
        "KeyboardRegion"
      ],
      "components": [
        "Scroll"
      ]
    }
  },
  {
    "name": "wheel-picker",
    "modules": [
      "component-contracts",
      "picker-field-base",
      "wheel-panel"
    ],
    "capabilities": {
      "core": [
        "DOM",
        "Events",
        "Utils"
      ],
      "headless": [
        "ValueController",
        "OpenStateBridge",
        "PickerSession",
        "ValueEquality",
        "InteractionPolicy"
      ],
      "components": [
        "Scroll"
      ]
    }
  }
].map(record => Object.freeze({ ...record, modules: Object.freeze(record.modules.slice()), capabilities: Object.freeze(Object.fromEntries(Object.entries(record.capabilities || {}).map(([key, value]) => [key, Object.freeze(value.slice())]))) })));
export default moduleManifestData;
