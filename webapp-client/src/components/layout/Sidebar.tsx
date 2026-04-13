import { cn } from '../../lib/utils'

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-screen border-r border-outline-variant/15",
        "bg-surface-container-low/80 backdrop-blur-[20px]",
        className
      )}
    >
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <span className="text-on-primary font-bold">F</span>
        </div>
        <span className="text-title-md text-on-surface">Flowable UI</span>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2">
        <div className="px-2 pb-1 text-label-md text-on-surface-variant uppercase tracking-wider">Deployments</div>
        <a href="#" className="flex items-center px-3 py-2 text-body-md rounded-md bg-surface-container text-on-surface font-medium">
          Definitions & Deployments
        </a>
        <div className="px-2 pt-4 pb-1 text-label-md text-on-surface-variant uppercase tracking-wider">Runtime</div>
        <a href="#" className="flex items-center px-3 py-2 text-body-md rounded-md hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
          Process Instances
        </a>
        <a href="#" className="flex items-center px-3 py-2 text-body-md rounded-md hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
          Instance Detail
        </a>
        <div className="px-2 pt-4 pb-1 text-label-md text-on-surface-variant uppercase tracking-wider">Support</div>
        <a href="#" className="flex items-center px-3 py-2 text-body-md rounded-md hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
          Jobs Monitoring
        </a>
      </nav>
    </aside>
  )
}
