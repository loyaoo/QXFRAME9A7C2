import * as React from "react"
export default function dynamic(loader: any, opts: any = {}) { const L = React.lazy(() => loader().then((m: any) => ({ default: m.default || m }))); return (p: any) => <React.Suspense fallback={opts.loading ? opts.loading() : null}><L {...p} /></React.Suspense> }
export function useRouter() { return { push() {}, replace() {}, prefetch() {}, back() {} } }
export function usePathname() { return "/create" }
export function useSearchParams() { return new URLSearchParams(location.search) }
export function notFound() { throw new Error("nf") }
export function redirect() {}
export const Link = React.forwardRef(({ href, prefetch, ...p }: any, r: any) => <a ref={r} href={typeof href === "string" ? href : "#"} {...p} />)
export const Script = () => null
export function useTheme() { return { theme: "light", resolvedTheme: "light", setTheme() {}, themes: ["light", "dark"] } }
export const ThemeProvider = ({ children }: any) => children
export function useQueryState(_k: string, o?: any) { return [o?.defaultValue ?? null, () => {}] }
export function useQueryStates(p: any) { return [{}, () => {}] }
export const Image = (p: any) => <img {...p} />
