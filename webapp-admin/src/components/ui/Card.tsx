import { cn } from "../../lib/utils"

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border border-outline-variant/15 bg-surface-container-lowest text-on-surface",
      "shadow-[0_8px_24px_-4px_rgba(19,27,46,0.04)]", // Ambient Shadow parameter
      className
    )}>
      {children}
    </div>
  )
}
