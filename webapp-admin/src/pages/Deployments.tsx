import { useRef, useState, useEffect, useCallback } from "react"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table"
import {
  Download,
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FileCode2,
  FolderOpen,
  Eye,
} from "lucide-react"
import { flowableApi } from "../lib/flowableApi"
import { DeploymentDiagramModal } from "../components/admin/DeploymentDiagramModal"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeploymentRow {
  deploymentId: string
  deploymentName: string
  /** Display-friendly basename shown in the table */
  resourceName: string
  /** Original resource.id from Flowable — used for API calls, may be a full path */
  resourceId: string
  deployTime: string
}

type UploadStatus = "idle" | "uploading" | "success" | "error"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return iso
  }
}

function extractResourceName(raw: string): string {
  // Handles both URL-encoded REST paths (/processes%2Ffoo.bpmn) and
  // Windows absolute paths stored by SpringBootAutoDeployment (C:\...\foo.bpmn)
  const decoded = decodeURIComponent(raw)
  // Split on either forward slash OR backslash
  const parts = decoded.split(/[\/\\]/)
  return parts[parts.length - 1] || decoded
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onUpload,
}: {
  onUpload: (file: File, name: string) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deployName, setDeployName] = useState("")
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    setSelectedFile(f)
    if (!deployName) {
      setDeployName(f.name.replace(/\.(bpmn20\.xml|bpmn|xml)$/i, ""))
    }
    setStatus("idle")
    setErrorMsg("")
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [deployName]
  )

  const handleDeploy = async () => {
    if (!selectedFile) return
    const name = deployName.trim() || selectedFile.name
    setStatus("uploading")
    setErrorMsg("")
    try {
      await onUpload(selectedFile, name)
      setStatus("success")
      setSelectedFile(null)
      setDeployName("")
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err?.message ?? "Upload failed")
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 px-8 py-12 select-none",
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container-low",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".bpmn,.xml,.bpmn20.xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <UploadCloud className="w-7 h-7 text-primary" />
        </div>
        {selectedFile ? (
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <FileCode2 className="w-4 h-4 text-primary" />
              <span className="text-body-md text-on-surface font-semibold">
                {selectedFile.name}
              </span>
            </div>
            <span className="text-body-sm text-on-surface-variant">
              {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop to replace
            </span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-body-md text-on-surface font-semibold">
              Drop your BPMN / XML file here
            </p>
            <p className="text-body-sm text-on-surface-variant">
              or <span className="text-primary underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-body-xs text-on-surface-variant mt-1">
              Supported: .bpmn, .bpmn20.xml, .xml
            </p>
          </div>
        )}
      </div>

      {/* Deployment Name + Submit */}
      {selectedFile && (
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-label-sm text-on-surface-variant font-medium">
              Deployment Name
            </label>
            <input
              type="text"
              value={deployName}
              onChange={(e) => setDeployName(e.target.value)}
              placeholder="e.g. Loan Process v2"
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>
          <Button
            variant="primary"
            className="gap-2 h-10 shrink-0"
            disabled={status === "uploading"}
            onClick={handleDeploy}
          >
            {status === "uploading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {status === "uploading" ? "Deploying…" : "Deploy"}
          </Button>
        </div>
      )}

      {/* Status Feedback */}
      {status === "success" && (
        <div className="flex items-center gap-2 rounded-lg bg-primary-container/40 border border-primary/20 px-4 py-3 text-body-md text-on-primary-container">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
          Deployment successful! The table below has been refreshed.
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container/40 border border-error/20 px-4 py-3 text-body-md text-on-error-container">
          <XCircle className="w-5 h-5 shrink-0 text-error" />
          <span className="break-all">{errorMsg}</span>
        </div>
      )}
    </div>
  )
}

// ─── Deployment History Table ─────────────────────────────────────────────────

function DeploymentHistoryTable({
  rows,
  loading,
  onRefresh,
}: {
  rows: DeploymentRow[]
  loading: boolean
  onRefresh: () => void
}) {
  // Modal state
  const [diagramTarget, setDiagramTarget] = useState<DeploymentRow | null>(null)

  const handleDownload = async (row: DeploymentRow) => {
    try {
      // Use resourceId (the raw Flowable path) — not just the display filename
      const blobUrl = await flowableApi.downloadDeploymentResource(
        row.deploymentId,
        encodeURIComponent(row.resourceId)
      )
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = row.resourceName  // save with the friendly filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (e: any) {
      alert(`Download failed: ${e?.message}`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title-md text-on-surface font-semibold">
          Deployment History
        </h2>
        <Button
          variant="secondary"
          className="gap-2 text-body-sm py-1.5"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        {loading && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-body-md">Loading deployments…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <p className="text-body-md">No deployments found.</p>
            <p className="text-body-sm">Upload a BPMN file above to get started.</p>
          </div>
        ) : (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Deployment Name</TableHead>
                <TableHead>Resource Name</TableHead>
                <TableHead>Deployment ID</TableHead>
                <TableHead>Deployed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.deploymentId}-${row.resourceName}`}>
                  <TableCell className="font-medium text-on-surface">
                    {row.deploymentName || <span className="text-on-surface-variant italic">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-on-surface-variant">
                    {row.resourceName}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-surface-container px-2 py-1 rounded-md text-on-surface-variant select-all">
                      {row.deploymentId}
                    </span>
                  </TableCell>
                  <TableCell className="text-body-sm text-on-surface-variant whitespace-nowrap">
                    {formatDate(row.deployTime)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="tertiary"
                        className="gap-1.5 text-body-sm"
                        onClick={() => setDiagramTarget(row)}
                        title="View BPMN diagram"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Diagram
                      </Button>
                      <Button
                        variant="tertiary"
                        className="gap-1.5 text-body-sm"
                        onClick={() => handleDownload(row)}
                        title="Download resource file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Diagram modal */}
      {diagramTarget && (
        <DeploymentDiagramModal
          deploymentId={diagramTarget.deploymentId}
          resourceId={diagramTarget.resourceId}
          resourceName={diagramTarget.resourceName}
          deploymentName={diagramTarget.deploymentName}
          onClose={() => setDiagramTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Deployments() {
  const [deploymentRows, setDeploymentRows] = useState<DeploymentRow[]>([])
  const [loadingDeployments, setLoadingDeployments] = useState(false)

  const loadDeployments = useCallback(async () => {
    setLoadingDeployments(true)
    try {
      const data = await flowableApi.getDeployments()
      const deployments: any[] = Array.isArray(data) ? data : (data?.data ?? [])
      console.log('[Deployments] raw response:', data, '— parsed count:', deployments.length)

      const rows: DeploymentRow[] = []
      await Promise.all(
        deployments.map(async (dep) => {
          try {
            const resData = await flowableApi.getDeploymentResources(dep.id)
            // Resources endpoint returns a plain array, NOT { data: [] }
            const resources: any[] = Array.isArray(resData)
              ? resData
              : (resData?.data ?? [])
            console.log(`[Deployments] dep=${dep.id} resources:`, resources)

            // Filter to BPMN / XML resources only (exclude PNG diagrams)
            const bpmnResources = resources.filter((r: any) => {
              const name: string = (r.id ?? r.name ?? "").toLowerCase()
              return (
                name.endsWith(".bpmn") ||
                name.endsWith(".xml") ||
                name.endsWith(".bpmn20.xml")
              )
            })
            const relevant = bpmnResources.length > 0 ? bpmnResources : resources.slice(0, 1)
            for (const resource of relevant) {
              rows.push({
                deploymentId: dep.id,
                deploymentName: dep.name ?? "",
                resourceName: extractResourceName(resource.url ?? resource.id ?? resource.name ?? ""),
                resourceId: resource.id ?? resource.name ?? "",
                deployTime: dep.deploymentTime ?? dep.deployTime ?? "",
              })
            }
          } catch (resourceErr) {
            console.warn(`[Deployments] failed to fetch resources for dep=${dep.id}`, resourceErr)
            rows.push({
              deploymentId: dep.id,
              deploymentName: dep.name ?? "",
              resourceName: "—",
              resourceId: "",
              deployTime: dep.deploymentTime ?? dep.deployTime ?? "",
            })
          }
        })
      )
      rows.sort((a, b) => new Date(b.deployTime).getTime() - new Date(a.deployTime).getTime())
      setDeploymentRows(rows)
    } catch (err) {
      console.error("Failed to load deployments", err)
    } finally {
      setLoadingDeployments(false)
    }
  }, [])

  type PageTab = "upload" | "history"
  const [activeTab, setActiveTab] = useState<PageTab>("upload")

  // Load on mount and whenever switching to the History tab
  useEffect(() => {
    if (activeTab === "history") {
      loadDeployments()
    }
  }, [activeTab, loadDeployments])

  // After a successful upload → refresh list and jump to History tab
  const handleUpload = async (file: File, name: string) => {
    await flowableApi.deployBpmnFile(file, name)
    await loadDeployments()
    setActiveTab("history")
  }

  const tabs: { id: PageTab; label: string; icon: string }[] = [
    { id: "upload",  label: "Upload New Version", icon: "⬆️" },
    { id: "history", label: "Deployment History",  icon: "📋" },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-headline-sm text-on-surface font-semibold">
          Deployment Management
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Upload and manage process definitions deployed to the Flowable engine.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline-variant/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex items-center gap-2 px-5 py-2.5 text-label-lg font-semibold border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline-variant/40",
            ].join(" ")}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Upload New Version ── */}
      {activeTab === "upload" && (
        <Card>
          <div className="p-4 border-b border-outline-variant/15 bg-surface-container-lowest rounded-t-lg">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              <h2 className="text-title-md text-on-surface font-semibold">
                Upload New Version
              </h2>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Upload a BPMN or XML file to deploy it directly into the Flowable engine.
              Flowable will auto-increment the version for existing process keys.
              After deploying, you will be taken to the Deployment History tab automatically.
            </p>
          </div>
          <div className="p-6">
            <UploadZone onUpload={handleUpload} />
          </div>
        </Card>
      )}

      {/* ── Tab: Deployment History ── */}
      {activeTab === "history" && (
        <DeploymentHistoryTable
          rows={deploymentRows}
          loading={loadingDeployments}
          onRefresh={loadDeployments}
        />
      )}
    </div>
  )
}
