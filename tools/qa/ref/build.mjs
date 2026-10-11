import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import fs from "fs"; import path from "path"
const R = path.dirname(fileURLToPath(import.meta.url));
const S = path.resolve(process.env.SHADCN_SOURCE || path.join(R, "source"));
const V = path.join(S, "apps/v4");
const sourceFiles = new Set();
const readSource = file => { if (path.resolve(file).startsWith(S + path.sep)) sourceFiles.add(path.resolve(file)); return fs.readFileSync(file, "utf8"); };
if (!fs.existsSync(path.join(V, "registry/bases/radix/blocks/preview-02/index.tsx"))) throw new Error("Set SHADCN_SOURCE to the checkout of shadcn/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c");
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const tw = require("tailwindcss");
const nodeModules = path.join(R, "node_modules");
const stub = (f) => R + "/stubs/" + f
const exact = {
  "cn": stub("cn.ts"), "recharts": stub("recharts.tsx"), "react-day-picker": stub("daypicker.tsx"), "react-qr-code": stub("qr.tsx"),
  "react-remove-scroll": stub("empty.ts"),
  "shadcn/icons": V + "/../../packages/shadcn/src/icons/index.ts", "shadcn/schema": V + "/../../packages/shadcn/src/schema/index.ts", "@base-ui/react": stub("baseui.tsx"),
}
const plugin = { name: "alias", setup(b) {
  // Measurement labels only: preserve the original component and DOM structure.
  b.onLoad({ filter: /[\\/]blocks[\\/]preview-02[\\/]cards[\\/].*\.tsx$/ }, args => ({
    contents: readSource(args.path).replace(/<Card(?=[\s>])/, `<Card data-qa-card="${path.basename(args.path, '.tsx')}"`),
    loader: 'tsx'
  }))
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
    if (p === "radix-ui" || p === "lucide-react") return { path: require.resolve(p) }
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
const res = await esbuild.build({ entryPoints: [R + "/entry.tsx"], bundle: true, metafile: true, outfile: out + "/app.js", format: "esm", jsx: "automatic",
  plugins: [plugin], nodePaths: [nodeModules], define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error", minify: false })
// tailwind
let g = readSource(V + "/app/globals.css").replace(/^@source.*$/gm, "").replace(/^@import "tw-animate-css";$/m, "")
let sr = readSource(V + "/app/style-registry.css").replace(/^@reference.*$/m, "")
const css = g + "\n" + sr
const loadStylesheet = async (id, base) => {
  let file
  if (id === "tailwindcss") file = require.resolve("tailwindcss/index.css")
  else if (id === "shadcn/tailwind.css") file = V + "/../../packages/shadcn/src/tailwind.css"
  else file = path.resolve(base, id)
  return { path: file, base: path.dirname(file), content: readSource(file) }
}
let shim = ""; let c
for (let i = 0; i < 200; i++) { try { c = await tw.compile(css + "\n" + shim, { base: V + "/app", loadStylesheet, loadModule: async () => ({ module: () => {}, base: "/" }) }); break } catch (e) {
  const m = /utility class `([^`]+)`/.exec(e.message); if (!m) throw e
  const u = m[1].split(":").pop(); const fn = /-(\d+|[a-z]+)$/.test(u) && /^(fade|zoom|slide|spin)-/.test(u)
  const name = u.replace(/^(fade-(in|out)|zoom-(in|out)|slide-(in|out)-from-[a-z]+|slide-(in|out)-to-[a-z]+|spin-(in|out))-.*$/, "$1")
  shim += name === u ? `@utility ${u} {--tw-shim:1}\n` : `@utility ${name}-* {--tw-shim: --value(integer, [*])}\n`; console.log("shim", u) } }
const cand = new Set()
const scan = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = d + "/" + f.name; if (f.isDirectory()) scan(p); else if (/\.(tsx?|css)$/.test(f.name)) for (const m of readSource(p).matchAll(/[^\s"'`{}<>]+/g)) cand.add(m[0]) } }
for (const d of [V + "/registry/bases/radix/ui", V + "/registry/bases/radix/blocks/preview", V + "/registry/bases/radix/blocks/preview-02", R + "/stubs"]) scan(d)
for (const f of ["/entry.tsx","/gallery.tsx","/create-entry.tsx"]) if (fs.existsSync(R + f)) for (const m of fs.readFileSync(R + f, "utf8").matchAll(/[^\s"'`{}<>]+/g)) cand.add(m[0])
fs.writeFileSync(out + "/app.css", c.build([...cand]))
fs.writeFileSync(out + "/index.html", `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=app.css></head><body><div id=root></div><script type=module src=app.js></script></body></html>`)
for (const file of Object.keys(res.metafile.inputs)) {
  const abs = path.resolve(file);
  if (abs.startsWith(S + path.sep)) sourceFiles.add(abs);
}
const sourceLock = {
  repository: "https://github.com/shadcn-ui/ui",
  commit: "295a1f114a138f23b5dfee0e0c6812394dfeb90c",
  sha256: Object.fromEntries([...sourceFiles].sort().map(file => [
    path.relative(S, file).split(path.sep).join("/"),
    createHash("sha256").update(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n")).digest("hex")
  ]))
};
const lockFile = path.join(R, "source-lock.json");
if (process.argv.includes("--record-source-lock")) fs.writeFileSync(lockFile, JSON.stringify(sourceLock, null, 2) + "\n");
else if (!fs.existsSync(lockFile) || JSON.stringify(JSON.parse(fs.readFileSync(lockFile, "utf8"))) !== JSON.stringify(sourceLock)) throw new Error("Reference source does not match source-lock.json; use the pinned checkout.");
console.log("source files verified", sourceFiles.size);
console.log("built", [...cand].length, "candidates")
