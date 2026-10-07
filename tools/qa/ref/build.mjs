import { createRequire } from "module"
import fs from "fs"; import path from "path"
const require = createRequire("/opt/npm-tools/node_modules/x.js")
const esbuild = require("esbuild")
const tw = require("tailwindcss")
const S = path.resolve(".."), V = S + "/shadcn/apps/v4", RX = S + "/radix/packages", R = path.resolve(".")
// lucide virtual module
const icons = {}
for (const f of fs.readdirSync(S + "/lucide/icons")) if (f.endsWith(".svg")) {
  const t = fs.readFileSync(S + "/lucide/icons/" + f, "utf8"); icons[f.slice(0, -4)] = t.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim()
}
const radixPkgs = {}
for (const grp of ["react", "core"]) for (const d of fs.readdirSync(RX + "/" + grp)) {
  const pj = RX + "/" + grp + "/" + d + "/package.json"; if (!fs.existsSync(pj)) continue
  const name = JSON.parse(fs.readFileSync(pj, "utf8")).name
  const src = ["src/index.ts", "src/index.tsx"].map(x => RX + "/" + grp + "/" + d + "/" + x).find(fs.existsSync)
  if (src) radixPkgs[name] = src
}
const stub = (f) => R + "/stubs/" + f
const exact = {
  "cn": stub("cn.ts"), "recharts": stub("recharts.tsx"), "react-day-picker": stub("daypicker.tsx"), "react-qr-code": stub("qr.tsx"),
  "lucide-react": stub("lucidecjs.js"), "react-remove-scroll": stub("empty.ts"),
  "shadcn/icons": V + "/../../packages/shadcn/src/icons/index.ts", "shadcn/schema": V + "/../../packages/shadcn/src/schema/index.ts", "@base-ui/react": stub("baseui.tsx"), "@radix-ui/primitive/is-development": RX + "/core/primitive/src/internal/is-development.false.ts",
}
const plugin = { name: "alias", setup(b) {
  b.onResolve({ filter: /^virtual:lucide$/ }, () => ({ path: "lucide", namespace: "v" }))
  b.onLoad({ filter: /.*/, namespace: "v" }, () => ({ contents: "export default " + JSON.stringify(icons), loader: "js" }))
  b.onResolve({ filter: /.*/ }, (a) => {
    const p = a.path
    if (exact[p]) return { path: exact[p] }
    if (p === "@base-ui/react" || p.startsWith("@base-ui/react/")) return { path: stub("cjsproxy.js") }
    if (p.startsWith("@hugeicons/")) return { path: stub("hugecjs.js") }
    if (p === "@tabler/icons-react" || p.startsWith("@phosphor-icons/") || p.startsWith("@remixicon/")) return { path: stub("hugecjs.js") }
    if (["swr", "vaul", "cmdk", "sonner", "input-otp", "embla-carousel-react", "react-resizable-panels", "streamdown", "motion/react", "@vercel/analytics/react", "@vercel/analytics"].includes(p) || p.startsWith("fumadocs")) return { path: stub("misc.js") }
    if (p === "@/.source/server" || p === "@/lib/source") return { path: stub("source.ts") }
    if (p === "shadcn/preset") { for (const q of [V + "/../../packages/shadcn/src/preset/index.ts", V + "/../../packages/registry/src/preset/index.ts"]) if (fs.existsSync(q)) return { path: q } }
    if (/^next(\/|$)/.test(p) || p === "next-themes" || p === "nuqs" || p.startsWith("nuqs/")) return { path: stub("next.tsx") }
    { const m = /^@\/styles\/(?:base|radix)-[a-z]+\/ui\/(.+)$/.exec(p); if (m) { const q = V + "/registry/bases/radix/ui/" + m[1]; for (const e of [".tsx", ".ts"]) if (fs.existsSync(q + e)) return { path: q + e } } }
    if (p === "@shadcn/registry/schema") return { path: V + "/../../packages/registry/src/schema/index.ts" }
    if (p.startsWith("@shadcn/registry/internal/")) { const q = V + "/../../packages/registry/src/" + p.slice(26); for (const e of [".ts", "/index.ts"]) if (fs.existsSync(q + e)) return { path: q + e } }
    if (radixPkgs[p]) return { path: radixPkgs[p] }
    if (/icon-placeholder$/.test(p)) return { path: stub("icon.tsx") }
    if (/(\(create\)|create)\/lib\/search-params$/.test(p)) return { path: stub("params.ts") }
    if (p.startsWith("@/")) {
      let q = V + "/" + p.slice(2).replace(/^app\/\(create\)\//, "app/(app)/(create)/").replace(/^app\/\(app\)\/create\//, "app/(app)/(create)/")
      for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) if (fs.existsSync(q + ext) && fs.statSync(q + ext).isFile()) return { path: q + ext }
    }
    if (p === "react" || p.startsWith("react/") || p === "react-dom" || p.startsWith("react-dom/")) return { path: require.resolve(p) }
  })
} }
const out = R + "/dist"; fs.mkdirSync(out, { recursive: true })
await esbuild.build({ entryPoints: [R + "/create-entry.tsx"], bundle: true, outfile: out + "/create.js", format: "esm", jsx: "automatic", plugins: [plugin], nodePaths: ["/opt/npm-tools/node_modules"], define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" }).catch(e => console.log("CREATE BUILD FAILED"))
const res = await esbuild.build({ entryPoints: [R + "/entry.tsx"], bundle: true, outfile: out + "/app.js", format: "esm", jsx: "automatic",
  plugins: [plugin], nodePaths: ["/opt/npm-tools/node_modules"], define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error", minify: false })
// tailwind
let g = fs.readFileSync(V + "/app/globals.css", "utf8").replace(/^@source.*$/gm, "").replace(/^@import "tw-animate-css";$/m, "")
let sr = fs.readFileSync(V + "/app/style-registry.css", "utf8").replace(/^@reference.*$/m, "")
const css = g + "\n" + sr
const loadStylesheet = async (id, base) => {
  let file
  if (id === "tailwindcss") file = "/opt/npm-tools/node_modules/tailwindcss/index.css"
  else if (id === "shadcn/tailwind.css") file = V + "/../../packages/shadcn/src/tailwind.css"
  else file = path.resolve(base, id)
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") }
}
let shim = ""; let c
for (let i = 0; i < 200; i++) { try { c = await tw.compile(css + "\n" + shim, { base: V + "/app", loadStylesheet, loadModule: async () => ({ module: () => {}, base: "/" }) }); break } catch (e) {
  const m = /utility class `([^`]+)`/.exec(e.message); if (!m) throw e
  const u = m[1].split(":").pop(); const fn = /-(\d+|[a-z]+)$/.test(u) && /^(fade|zoom|slide|spin)-/.test(u)
  const name = u.replace(/^(fade-(in|out)|zoom-(in|out)|slide-(in|out)-from-[a-z]+|slide-(in|out)-to-[a-z]+|spin-(in|out))-.*$/, "$1")
  shim += name === u ? `@utility ${u} {--tw-shim:1}\n` : `@utility ${name}-* {--tw-shim: --value(integer, [*])}\n`; console.log("shim", u) } }
const cand = new Set()
const scan = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = d + "/" + f.name; if (f.isDirectory()) scan(p); else if (/\.(tsx?|css)$/.test(f.name)) for (const m of fs.readFileSync(p, "utf8").matchAll(/[^\s"'`{}<>]+/g)) cand.add(m[0]) } }
for (const d of [V + "/registry/bases/radix/ui", V + "/registry/bases/radix/blocks/preview", V + "/registry/bases/radix/blocks/preview-02", R + "/stubs"]) scan(d)
for (const f of ["/entry.tsx","/gallery.tsx","/create-entry.tsx","/dist/create.js","/dist/app.js"]) if (fs.existsSync(R + f)) for (const m of fs.readFileSync(R + f, "utf8").matchAll(/[^\s"'`{}<>]+/g)) cand.add(m[0])
const fontDir = S + "/b/qxframe9a7c2-theme-v7.2.0/qxframe/fonts/body/inter/inter-latin-wght-normal.woff2"
fs.copyFileSync(fontDir, out + "/inter.woff2")
fs.writeFileSync(out + "/app.css", `@font-face{font-family:RefInter;src:url(inter.woff2) format("woff2");font-weight:100 900}\n` + c.build([...cand]))
fs.writeFileSync(out + "/create.html", `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=app.css></head><body><div id=root></div><script>window.process={env:{NEXT_PUBLIC_APP_URL:location.origin},emit(){}}</script><script type=module src=create.js></script></body></html>`)
fs.writeFileSync(out + "/index.html", `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=app.css></head><body><div id=root></div><script type=module src=app.js></script></body></html>`)
console.log("built", [...cand].length, "candidates")
