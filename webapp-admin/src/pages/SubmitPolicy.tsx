import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CheckCircle2 } from 'lucide-react'

export function SubmitPolicy() {
  const [clientName, setClientName] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, requestedAmount: parseInt(requestedAmount) })
      })
      if (response.ok) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto mt-20 p-8 text-center bg-surface-container-highest">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-headline-sm font-semibold text-on-surface">Policy Submitted!</h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          Your insurance policy has been submitted for manager approval.
        </p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>Submit Another</Button>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto mt-20 p-6 bg-surface-container-lowest">
      <h2 className="text-headline-sm text-on-surface font-semibold mb-2">New Insurance Policy</h2>
      <p className="text-body-md text-on-surface-variant mb-6">Complete the form below to begin the application flow.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">Client Name</label>
          <input 
            type="text" 
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">Requested Amount ($)</label>
          <input 
            type="number" 
            required
            value={requestedAmount}
            onChange={(e) => setRequestedAmount(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary"
            placeholder="50000"
          />
        </div>
        <Button type="submit" variant="primary" className="w-full mt-4">
          Submit Application
        </Button>
      </form>
    </Card>
  )
}
