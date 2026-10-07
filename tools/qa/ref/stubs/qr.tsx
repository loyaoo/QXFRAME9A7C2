import * as React from "react"
export default function QRCode({ size = 128, value, ...p }: any) { return <svg width={size} height={size} viewBox="0 0 21 21" {...p}><rect width="21" height="21" fill={p.bgColor||"transparent"} /><path d="M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0z" fill={p.fgColor||"currentColor"} /></svg> }
