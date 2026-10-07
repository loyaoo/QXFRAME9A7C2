import * as React from "react"
// Generic headless-primitive stub: closed popups render nothing, triggers/inputs render their element.
const NULLS = /^(Portal|Positioner|Popup|Backdrop|Viewport|Arrow|Content|Overlay|Panel|List|Empty|Collection|Item|ItemIndicator|ItemText|Group|GroupLabel|Separator|Sub|SubmenuRoot|SubmenuTrigger|RadioGroup|RadioItem|CheckboxItem|CheckboxItemIndicator|RadioItemIndicator|Description|Title|Close)$/
function make(name: string): any {
  const C: any = React.forwardRef(({ render, children, ...p }: any, ref: any) => {
    if (NULLS.test(name)) return null
    if (name === "Root" || name === "Provider") return <>{typeof children === "function" ? children({}) : children}</>
    if (render) return React.isValidElement(render) ? React.cloneElement(render as any, { ...p, ref, children: children ?? (render as any).props.children }) : render(p)
    const tag = /Trigger|Button/.test(name) ? "button" : name === "Input" ? "input" : name === "Value" ? "span" : "div"
    const { nativeButton, openOnHover, delay, closeDelay, modal, ...rest } = p
    return React.createElement(tag, { ref, ...rest }, children)
  })
  C.displayName = name
  return new Proxy(C, { get: (t, k: string) => (k in t ? (t as any)[k] : make(k)) })
}
const ns = new Proxy({}, { get: (_t, k: string) => k === "__esModule" ? true : make(k) })
export default ns
export const Menu = make("Menu"), Popover = make("Popover"), Dialog = make("Dialog"), Tooltip = make("Tooltip"), Combobox = make("Combobox"), Select = make("Select"), Tabs = make("Tabs"), AlertDialog = make("AlertDialog"), Switch = make("Switch"), Radio = make("Radio"), RadioGroup = make("RadioGroup"), Toggle = make("Toggle"), ToggleGroup = make("ToggleGroup"), Field = make("Field"), Input = make("Input"), Separator = make("Separator"), ScrollArea = make("ScrollArea"), Collapsible = make("Collapsible"), Accordion = make("Accordion"), Avatar = make("Avatar"), Checkbox = make("Checkbox"), Slider = make("Slider"), Progress = make("Progress"), NavigationMenu = make("NavigationMenu"), PreviewCard = make("PreviewCard"), ContextMenu = make("ContextMenu"), Menubar = make("Menubar"), Toolbar = make("Toolbar"), Fieldset = make("Fieldset"), Form = make("Form"), NumberField = make("NumberField"), Meter = make("Meter"), Toast = make("Toast"), Autocomplete = make("Autocomplete"), Drawer = make("Drawer")
export function useRender({ render, props, defaultTagName = "div" }: any) { return render ? React.cloneElement(render, props) : React.createElement(defaultTagName, props) }
export function mergeProps(...a: any[]) { return Object.assign({}, ...a) }
export const DirectionProvider = ({ children }: any) => children
