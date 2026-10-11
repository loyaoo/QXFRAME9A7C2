import * as React from "react"
import * as Icons from "lucide-react"
export function IconPlaceholder({ lucide, tabler, hugeicons, phosphor, remixicon, ...props }: any) {
  const Component = (Icons as any)[lucide] || (Icons as any)[(lucide || "Square").replace(/Icon$/, "")] || Icons.Square;
  return <Component {...props} />
}
export default IconPlaceholder
