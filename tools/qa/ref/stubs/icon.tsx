import * as React from "react"
// @ts-ignore
import ICONS from "virtual:lucide"
function kebab(n: string) { return n.replace(/Icon$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase() }
export function IconPlaceholder({ lucide, tabler, hugeicons, phosphor, remixicon, ...props }: any) {
  const key = kebab(lucide || "square"); const inner = ICONS[key] ?? ICONS[key.replace(/-(\d)/g, "$1")] ?? ""
  if (!inner) console.warn("missing icon", lucide, key)
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props} dangerouslySetInnerHTML={{ __html: inner }} />
}
export default IconPlaceholder
