import * as React from "react"
export function HugeiconsIcon({ icon, strokeWidth, size, ...p }: any) { return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...p}><rect x="4" y="4" width="16" height="16" rx="3" /></svg> }
const icons: any = new Proxy({}, { get: () => [] })
export default icons
