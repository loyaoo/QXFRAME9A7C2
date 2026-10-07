import * as React from "react"
const q = new URLSearchParams(location.search)
export const PARAMS: any = {
  preset: "b0", base: "radix", item: q.get("item") || "preview",
  iconLibrary: "lucide", style: q.get("style") || "nova", theme: q.get("theme") || "neutral",
  chartColor: q.get("chartColor") || "neutral", font: "inter", fontHeading: "inherit",
  baseColor: q.get("baseColor") || "neutral", menuAccent: q.get("menuAccent") || "subtle",
  menuColor: "default", radius: q.get("radius") || "default", pointer: false, template: "next", rtl: false,
}
export function useDesignSystemSearchParams(_o?: any) { return [PARAMS, (_: any) => {}] as const }
export const designSystemSearchParams = {}
export function useSearchParamsLoader() { return PARAMS }
export default useDesignSystemSearchParams
export function serializeDesignSystemSearchParams(path: string, p: any) { const q = new URLSearchParams(location.search); return `/?item=${p.item}&style=${p.style}` + (q.get("dark") ? "&dark=1" : "") }
export const loadDesignSystemSearchParams = () => PARAMS
export type DesignSystemSearchParams = any
export function isTranslucentMenuColor(m?: string | null) { return m === "default-translucent" || m === "inverted-translucent" }
export function buildPresetUrlUpdate(..._a: any[]) { return {} }
