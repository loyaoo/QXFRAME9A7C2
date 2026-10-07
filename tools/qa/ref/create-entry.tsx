import * as React from "react"
import { createRoot } from "react-dom/client"
import { SiteHeader } from "@/components/site-header"
import { Customizer } from "@/app/(app)/(create)/components/customizer"
import { Preview } from "@/app/(app)/(create)/components/preview"
import { PreviewOverrideProvider } from "@/app/(app)/(create)/components/preview-override"
import { LocksProvider } from "@/app/(app)/(create)/hooks/use-locks"
import { HistoryProvider } from "@/app/(app)/(create)/hooks/use-history"
import { TooltipProvider } from "@/registry/bases/radix/ui/tooltip"
document.documentElement.style.setProperty("--font-sans", "RefInter, sans-serif")
document.body.classList.add("style-nova")
if (new URLSearchParams(location.search).get("dark")) document.documentElement.classList.add("dark")
function App() {
  return <TooltipProvider><LocksProvider><HistoryProvider>
    <div data-slot="layout" className="group/layout relative z-10 flex min-h-svh flex-col bg-background has-data-[slot=designer]:h-svh has-data-[slot=designer]:overflow-hidden">
      <SiteHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden section-soft [--customizer-width:--spacing(48)] [--gap:--spacing(4)] md:[--gap:--spacing(6)] 2xl:[--customizer-width:--spacing(56)]">
          <div data-slot="designer" className="flex min-h-0 flex-1 flex-col gap-(--gap) p-(--gap) pt-[calc(var(--gap)*0.25)] md:flex-row-reverse">
            <PreviewOverrideProvider>
              <Preview />
              <Customizer itemsByBase={{ radix: [], base: [], aria: [] } as any} />
            </PreviewOverrideProvider>
          </div>
        </div>
      </main>
    </div>
  </HistoryProvider></LocksProvider></TooltipProvider>
}
createRoot(document.getElementById("root")!).render(<App />)
