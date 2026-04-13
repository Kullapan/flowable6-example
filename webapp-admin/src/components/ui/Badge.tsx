import { cn } from "../../lib/utils"

export function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold max-h-6",
      "bg-primary-container text-on-primary-container",
      className
    )}>
      {children}
    </span>
  )
}
