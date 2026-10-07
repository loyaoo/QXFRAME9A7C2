import * as React from "react"
const R = (tag: string) => ({ render, children, ...p }: any) => render ? React.cloneElement(render, { ...p, children: children ?? render.props.children }) : React.createElement(tag, p, children)
const Null = () => null
const Pass = ({ children }: any) => <>{children}</>
export const Combobox: any = { Root: Pass, Value: Null, Trigger: R("button"), Clear: Null, Input: R("input"), Portal: Null, Positioner: Null, Popup: Null, List: Null, Item: Null, ItemIndicator: Null, Group: Null, GroupLabel: Null, Collection: Null, Empty: Null, Separator: Null, Chips: R("div"), Chip: R("div"), ChipRemove: Null }
