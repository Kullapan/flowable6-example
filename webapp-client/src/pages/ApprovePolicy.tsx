import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CheckCircle2, XCircle, Shield, ChevronDown } from 'lucide-react'

interface FlowableTask {
  id: string;
  name: string;
  variables: { name: string; value: unknown }[];
}

interface ParsedTask {
  id: string;
  appNumber: string;
  customerName: string;
  policyType: string;
  premiumAmount: number;
}

type ActionState = 'approved' | 'rejected'

export function ApprovePolicy() {
  const [tasks,   setTasks]   = useState<ParsedTask[]>([])
  const [actioned, setActioned] = useState<Record<string, ActionState>>({})
  // Track which task has the reject form open, and its reason text
  const [rejectOpen,   setRejectOpen]   = useState<Record<string, boolean>>({})
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/policies/tasks')
      if (res.ok) {
        const rawTasks: FlowableTask[] = await res.json()
        const parsed = rawTasks.map((t) => {
          const getVar = (name: string) => t.variables?.find((v) => v.name === name)?.value
          return {
            id:            t.id,
            appNumber:     String(getVar('appNumber')     ?? ''),
            customerName:  String(getVar('customerName')  ?? 'Unknown'),
            policyType:    String(getVar('policyType')    ?? 'Unknown Policy'),
            premiumAmount: Number(getVar('premiumAmount') ?? 0),
          }
        })
        setTasks(parsed)
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleApprove = async (taskId: string) => {
    try {
      const res = await fetch(`/api/policies/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: true, rejectReason: '' }),
      })
      if (res.ok) {
        setActioned((prev) => ({ ...prev, [taskId]: 'approved' }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = (taskId: string) => {
    setRejectOpen((prev) => ({ ...prev, [taskId]: true }))
  }

  const handleConfirmReject = async (taskId: string) => {
    const reason = rejectReason[taskId] ?? ''
    try {
      const res = await fetch(`/api/policies/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: false, rejectReason: reason }),
      })
      if (res.ok) {
        setActioned((prev) => ({ ...prev, [taskId]: 'rejected' }))
        setRejectOpen((prev) => ({ ...prev, [taskId]: false }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-headline-sm text-on-surface font-semibold">Underwriter Review</h1>
          <p className="text-body-md text-on-surface-variant">
            Review and decide on pending policy applications.
          </p>
        </div>
      </div>

      <div className="grid gap-4 max-w-3xl">
        {tasks.map((task) => {
          const action = actioned[task.id]

          // ── Already actioned ──────────────────────────────────────────────
          if (action) {
            return (
              <Card key={task.id} className="p-4 flex items-center justify-between border-l-4 border-l-primary">
                <div className="flex items-center gap-3">
                  {action === 'approved'
                    ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    : <XCircle      className="w-5 h-5 text-error flex-shrink-0" />}
                  <div>
                    <p className="text-title-sm text-on-surface line-through">
                      {task.policyType} — {task.customerName}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Status: <span className="capitalize font-medium">{action}</span>
                      {action === 'rejected' && rejectReason[task.id] && (
                        <span className="text-error"> · {rejectReason[task.id]}</span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            )
          }

          const isRejectOpen = rejectOpen[task.id] ?? false

          // ── Pending task ──────────────────────────────────────────────────
          return (
            <Card key={task.id} className="p-6">
              {/* Header row */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant font-mono mb-1">
                    APP# {task.appNumber || '—'}
                  </p>
                  <h3 className="text-title-md font-semibold text-on-surface">{task.policyType}</h3>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    Applicant: <span className="font-medium text-on-surface">{task.customerName}</span>
                  </p>
                </div>
                <Badge className="bg-secondary-container text-on-secondary-container text-title-sm py-1 px-3">
                  ${(Number(task.premiumAmount) || 0).toLocaleString()}
                </Badge>
              </div>

              {/* Reject reason form (shown when reject is clicked) */}
              {isRejectOpen && (
                <div className="mb-4 p-3 rounded-md bg-error-container/20 border border-error/20">
                  <label
                    htmlFor={`reject-reason-${task.id}`}
                    className="block text-label-md text-on-surface-variant mb-1"
                  >
                    Reject Reason <span className="text-error">*</span>
                  </label>
                  <textarea
                    id={`reject-reason-${task.id}`}
                    rows={3}
                    required
                    value={rejectReason[task.id] ?? ''}
                    onChange={(e) =>
                      setRejectReason((prev) => ({ ...prev, [task.id]: e.target.value }))
                    }
                    placeholder="Provide a reason for rejection…"
                    className="w-full px-3 py-2 rounded-md border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:border-error resize-none"
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <Button
                      id={`cancel-reject-btn-${task.id}`}
                      variant="secondary"
                      onClick={() => setRejectOpen((prev) => ({ ...prev, [task.id]: false }))}
                    >
                      Cancel
                    </Button>
                    <Button
                      id={`confirm-reject-btn-${task.id}`}
                      variant="primary"
                      onClick={() => handleConfirmReject(task.id)}
                      disabled={!rejectReason[task.id]?.trim()}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons (hidden while reject form is visible) */}
              {!isRejectOpen && (
                <div className="flex gap-3 justify-end mt-4">
                  <Button
                    id={`reject-btn-${task.id}`}
                    variant="secondary"
                    onClick={() => handleReject(task.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button
                    id={`approve-btn-${task.id}`}
                    variant="primary"
                    onClick={() => handleApprove(task.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Policy
                  </Button>
                </div>
              )}
            </Card>
          )
        })}

        {tasks.length === 0 && (
          <Card className="p-8 text-center text-on-surface-variant">
            <ChevronDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No applications pending underwriter review.
          </Card>
        )}
      </div>
    </div>
  )
}

