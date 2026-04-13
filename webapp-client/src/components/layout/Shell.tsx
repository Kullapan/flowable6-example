import { Sidebar } from "./Sidebar"
import { cn } from "../../lib/utils"

export function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen bg-surface w-full overflow-hidden">
      <Sidebar />
      <main className={cn("flex-1 overflow-auto bg-surface-container-low p-6", className)}>
        {children}
      </main>
    </div>
  )
}
