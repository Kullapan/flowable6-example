import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CheckCircle2, ClipboardCopy, FileText } from 'lucide-react'

const POLICY_TYPES = [
  { value: 'life',     label: 'Life Insurance' },
  { value: 'health',   label: 'Health Insurance' },
  { value: 'auto',     label: 'Auto Insurance' },
  { value: 'property', label: 'Property Insurance' },
]

export function SubmitPolicy() {
  const [appNumber,     setAppNumber]     = useState('')
  const [customerName,  setCustomerName]  = useState('')
  const [policyType,    setPolicyType]    = useState('life')
  const [premiumAmount, setPremiumAmount] = useState('')
  const [submitted,     setSubmitted]     = useState(false)
  const [submittedApp,  setSubmittedApp]  = useState('')
  const [copied,        setCopied]        = useState(false)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appNumber,
          customerName,
          policyType,
          premiumAmount: parseFloat(premiumAmount),
        }),
      })
      if (response.ok) {
        setSubmittedApp(appNumber)
        setSubmitted(true)
      } else {
        // Safely parse error body — some 500 responses are not JSON
        let msg = `Server error (HTTP ${response.status})`
        try {
          const text = await response.text()
          if (text) {
            const data = JSON.parse(text)
            msg = data?.message || data?.error || msg
          }
        } catch { /* non-JSON body — keep the status code message */ }
        setError(msg)
      }
    } catch (err) {
      setError('Cannot connect to server — is the custom-backend running on port 8080?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleCopy = () => {
    navigator.clipboard.writeText(submittedApp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setSubmitted(false)
    setAppNumber('')
    setCustomerName('')
    setPolicyType('life')
    setPremiumAmount('')
    setSubmittedApp('')
  }

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto mt-20 p-8 text-center bg-surface-container-highest">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-headline-sm font-semibold text-on-surface">Application Submitted!</h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          Your policy application is pending underwriter review.
        </p>
        <div className="mt-6 p-4 rounded-lg bg-primary-container/30 border border-primary/20">
          <p className="text-label-sm text-on-surface-variant mb-1">Application Reference Number</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-title-lg font-mono font-bold text-primary">{submittedApp}</span>
            <button
              id="copy-app-number-btn"
              onClick={handleCopy}
              className="p-1 rounded hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
              title="Copy to clipboard"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </div>
          {copied && <p className="text-xs text-primary mt-1">Copied!</p>}
          <p className="text-xs text-on-surface-variant mt-2">
            Save this number to track your approval status.
          </p>
        </div>
        <Button className="mt-6" onClick={handleReset}>Submit Another</Button>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto mt-16 p-6 bg-surface-container-lowest">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-headline-sm text-on-surface font-semibold">New Policy Application</h2>
          <p className="text-body-sm text-on-surface-variant">Complete the form to begin the underwriting flow.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error-container text-on-error-container text-body-sm">
          {error}
        </div>
      )}

      <form id="submit-policy-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Application Number */}
        <div>
          <label htmlFor="appNumber" className="block text-label-md text-on-surface-variant mb-1">
            Application Number <span className="text-error">*</span>
          </label>
          <input
            id="appNumber"
            type="text"
            required
            value={appNumber}
            onChange={(e) => setAppNumber(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary font-mono"
            placeholder="e.g. APP-2024-00123"
          />
          <p className="mt-1 text-xs text-on-surface-variant">Used as your reference number for tracking.</p>
        </div>

        {/* Customer Name */}
        <div>
          <label htmlFor="customerName" className="block text-label-md text-on-surface-variant mb-1">
            Customer Name <span className="text-error">*</span>
          </label>
          <input
            id="customerName"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary"
            placeholder="John Doe"
          />
        </div>

        {/* Policy Type */}
        <div>
          <label htmlFor="policyType" className="block text-label-md text-on-surface-variant mb-1">
            Policy Type <span className="text-error">*</span>
          </label>
          <select
            id="policyType"
            required
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary"
          >
            {POLICY_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Premium Amount */}
        <div>
          <label htmlFor="premiumAmount" className="block text-label-md text-on-surface-variant mb-1">
            Premium Amount ($) <span className="text-error">*</span>
          </label>
          <input
            id="premiumAmount"
            type="number"
            required
            min={1}
            step="0.01"
            value={premiumAmount}
            onChange={(e) => setPremiumAmount(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-primary"
            placeholder="50000"
          />
        </div>

        <Button
          id="submit-policy-btn"
          type="submit"
          variant="primary"
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </Button>
      </form>
    </Card>
  )
}

