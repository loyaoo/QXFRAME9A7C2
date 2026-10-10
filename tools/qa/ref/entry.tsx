import * as React from "react"
import { createRoot } from "react-dom/client"
import { buildRegistryTheme, DEFAULT_CONFIG } from "@/registry/config"
import { PARAMS } from "./stubs/params"
import { TooltipProvider } from "@/registry/bases/radix/ui/tooltip"
import Preview from "@/registry/bases/radix/blocks/preview/index"
import Preview02 from "@/registry/bases/radix/blocks/preview-02/index"
import Gallery from "./gallery"
const p = PARAMS
document.body.classList.add(`style-${p.style}`, `base-color-${p.baseColor}`)
if (new URLSearchParams(location.search).get("dark")) document.documentElement.classList.add("dark")
const radius = (p.style === "lyra" || p.style === "sera") ? "none" : p.radius
const t: any = buildRegistryTheme({ ...DEFAULT_CONFIG, baseColor: p.baseColor, theme: p.theme, chartColor: p.chartColor, menuAccent: p.menuAccent, radius } as any)
const rule = (sel: string, v: any) => `${sel}{${Object.entries(v || {}).map(([k, x]) => `--${k}:${x};`).join("")}}`
const st = document.createElement("style"); st.textContent = rule(":root", { ...(t.cssVars.theme || {}), ...t.cssVars.light }) + rule(".dark", t.cssVars.dark); document.head.appendChild(st)
document.documentElement.style.setProperty("--font-sans", "system-ui, sans-serif")
document.documentElement.style.setProperty("--font-heading", "system-ui, sans-serif")
const C = p.item === "gallery" ? Gallery : p.item === "preview-02" ? Preview02 : Preview
createRoot(document.getElementById("root")!).render(<TooltipProvider><div className="relative bg-background"><C /></div></TooltipProvider>)
setTimeout(() => { (window as any).__ready = true }, 300)
