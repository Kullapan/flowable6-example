import { useState } from 'react'
import { Deployments } from './pages/Deployments'
import { MonitoringBAU } from './pages/MonitoringBAU'
import { RepairStation } from './pages/RepairStation'
import { IdmManagement } from './pages/IdmManagement'
import { useAuth } from './lib/AuthContext'
import { Login } from './pages/Login'
import { LogOut } from 'lucide-react'

function App() {
  const { isAuthenticated, logout } = useAuth()
  const [currentView, setCurrentView] = useState<'deployments' | 'monitoring' | 'repair-station' | 'idm'>('monitoring')

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-surface w-full overflow-hidden flex flex-col">
      <header className="h-14 border-b border-outline-variant/15 bg-surface-container flex items-center px-6 gap-6 shrink-0 justify-between">
        <div className="flex items-center h-full gap-6 flex-1 min-w-0">
          <span className="font-bold text-on-surface tracking-wider shrink-0 whitespace-nowrap">ADMIN</span>
          <nav className="flex items-center gap-4 border-l border-outline-variant/30 pl-6 h-full overflow-x-auto overflow-y-hidden flex-1">
            <button
              className={`h-full px-2 text-label-lg font-semibold border-b-2 transition-colors whitespace-nowrap ${currentView === 'monitoring' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
              onClick={() => setCurrentView('monitoring')}
            >
              Monitoring (BAU)
            </button>
            <button
              className={`h-full px-2 text-label-lg font-semibold border-b-2 transition-colors whitespace-nowrap ${currentView === 'deployments' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
              onClick={() => setCurrentView('deployments')}
            >
              Deployment Management
            </button>
            <button
              className={`h-full px-2 text-label-lg font-semibold border-b-2 transition-colors whitespace-nowrap ${currentView === 'repair-station' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
              onClick={() => setCurrentView('repair-station')}
            >
              Repair Station
            </button>
            <button
              className={`h-full px-2 text-label-lg font-semibold border-b-2 transition-colors whitespace-nowrap ${currentView === 'idm' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
              onClick={() => setCurrentView('idm')}
            >
              IDM Management
            </button>
          </nav>
        </div>
        
        {/* Logout Toggle */}
        <div className="flex-shrink-0 flex items-center border-l border-outline-variant/30 pl-6 h-full">
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-label-md font-semibold text-error/80 hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-error/10"
            title="Log out of Admin Dashboard"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-surface-container-low p-6">
        {currentView === 'deployments' && <Deployments />}
        {currentView === 'monitoring' && <MonitoringBAU />}
        {currentView === 'repair-station' && <RepairStation />}
        {currentView === 'idm' && <IdmManagement />}
      </main>
    </div>
  )
}

export default App

