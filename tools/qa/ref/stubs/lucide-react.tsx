import * as React from "react"
import { IconPlaceholder } from "./icon"
export default new Proxy({}, { get: (_t, name: string) => (p: any) => <IconPlaceholder lucide={name} {...p} /> })
