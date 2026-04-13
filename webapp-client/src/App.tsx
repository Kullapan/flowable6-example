import { useState } from 'react'

import { SubmitPolicy } from './pages/SubmitPolicy'
import { ApprovePolicy } from './pages/ApprovePolicy'
import { Button } from './components/ui/Button'

type Role = 'user' | 'manager'

function App() {
  const [role, setRole] = useState<Role>('user')

  return (
    <div className="min-h-screen bg-surface w-full overflow-hidden flex flex-col">
      <header className="h-14 border-b border-outline-variant/15 bg-surface-container flex items-center px-6 gap-4">
        <span className="font-bold text-on-surface tracking-wider">FLOWABLE INSURANCE INC.</span>
        <div className="flex gap-2 ml-10 border-l border-outline-variant/30 pl-4 items-center">
           <span className="text-body-sm text-on-surface-variant mr-2">Simulate Role:</span>
           <Button variant={role === 'user' ? 'primary' : 'secondary'} onClick={() => setRole('user')}>User</Button>
           <Button variant={role === 'manager' ? 'primary' : 'secondary'} onClick={() => setRole('manager')}>Underwriter</Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-surface-container-low p-6">
        {role === 'user' ? <SubmitPolicy /> : <ApprovePolicy />}
      </main>
    </div>
  )
}

export default App
