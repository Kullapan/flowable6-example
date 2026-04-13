import { useEffect, useRef, useState, useCallback } from 'react';
import { flowableApi } from '../../lib/flowableApi';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, CheckCircle2, Circle, Clock } from 'lucide-react';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ActivityInstance {
  id: string;
  activityId: string;
  activityName: string;
  activityType: string;
  processInstanceId: string;
  startTime: string;
  endTime: string | null;
  durationInMillis: number | null;
  assignee?: string | null;
}

interface ExecutionPathViewerProps {
  processInstanceId: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function classifyActivities(activities: ActivityInstance[]) {
  const completed = new Set<string>();
  const active = new Set<string>();
  activities.forEach((a) => {
    if (a.endTime) {
      completed.add(a.activityId);
    } else {
      active.add(a.activityId);
    }
  });
  return { completed, active };
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export function ExecutionPathViewer({ processInstanceId }: ExecutionPathViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  const [activities, setActivities] = useState<ActivityInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Apply heatmap markers ────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyHeatmap(viewer: any, acts: ActivityInstance[]) {
    const { completed, active } = classifyActivities(acts);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elementRegistry = viewer.get('elementRegistry');
      const canvas = viewer.get('canvas');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      elementRegistry.forEach((element: any) => {
        const id: string = element.id;
        const type: string = element.type || '';
        if (type === 'bpmn:Process' || type === 'label') return;

        if (type === 'bpmn:SequenceFlow') {
          const sourceId = element.source?.id;
          const targetId = element.target?.id;
          if ((completed.has(sourceId) || active.has(sourceId)) && (completed.has(targetId) || active.has(targetId))) {
            canvas.addMarker(id, 'execution-flow-completed');
          } else if (active.has(sourceId)) {
            canvas.addMarker(id, 'execution-flow-active');
          }
        } else {
          if (active.has(id)) {
            canvas.addMarker(id, 'execution-active');
          } else if (completed.has(id)) {
            canvas.addMarker(id, 'execution-completed');
          } else {
            canvas.addMarker(id, 'execution-unreached');
          }
        }
      });
    } catch (e) {
      console.warn('Could not apply heatmap markers:', e);
    }
  }

  // ── Load data ────────────────────────────────
  const load = useCallback(async () => {
    if (!processInstanceId) return;
    setLoading(true);
    setError(null);
    setActivities([]);

    // Destroy old viewer up front
    if (viewerRef.current) {
      try { viewerRef.current.destroy(); } catch (_) { /* ignore */ }
      viewerRef.current = null;
    }

    try {
      // 1. Get processDefinitionId via historic process instance
      const procDetail = await flowableApi.getHistoricProcessInstance(processInstanceId);
      const defId: string = procDetail.processDefinitionId;

      // 2. Fetch all activity history
      const histResp = await flowableApi.getHistoricActivityInstances(processInstanceId);
      const acts: ActivityInstance[] = histResp.data || [];
      setActivities(acts);

      // 3. Fetch BPMN XML
      const xml = await flowableApi.getProcessDefinitionXml(defId);

      // 4. Make sure our container is still mounted
      if (!containerRef.current) return;

      // 5. Import and init bpmn-js viewer (dynamic import for code-splitting)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BpmnViewer = ((await import('bpmn-js/lib/NavigatedViewer')) as any).default;

      const viewer = new BpmnViewer({
        container: containerRef.current,
        height: '100%',
      });
      viewerRef.current = viewer;

      // 6. Import XML — bpmn-js v9+ returns a Promise, no callback
      await viewer.importXML(xml);

      // 7. Fit to viewport then apply colours
      const canvas = viewer.get('canvas');
      canvas.zoom('fit-viewport', 'auto');

      applyHeatmap(viewer, acts);
    } catch (err) {
      console.error('ExecutionPathViewer error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processInstanceId]);

  useEffect(() => {
    load();
    return () => {
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (_) { /* ignore */ }
        viewerRef.current = null;
      }
    };
  }, [load]);

  // ── Zoom controls ─────────────────────────────
  const getCanvas = () => {
    try { return viewerRef.current?.get('canvas'); } catch (_) { return null; }
  };
  const zoomIn  = () => { const c = getCanvas(); c?.zoom(c.zoom() * 1.25); };
  const zoomOut = () => { const c = getCanvas(); c?.zoom(c.zoom() * 0.8); };
  const fitView = () => { getCanvas()?.zoom('fit-viewport', 'auto'); };

  // ── Derived ───────────────────────────────────
  // Raw sets used for correctly rendering BPMN diagram lines
  const { completed, active } = classifyActivities(activities);
  
  // Filtered array used for Audit Trail and UX metrics
  const auditRows = activities.filter(
    (a) => a.activityType !== 'sequenceFlow'
  );
  
  // UX metric counts
  let completedStepCount = 0;
  let activeStepCount = 0;
  auditRows.forEach(a => {
    if (a.endTime) completedStepCount++;
    else activeStepCount++;
  });

  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Legend + toolbar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/30 animate-pulse" />
          Active now
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-outline-variant/40 ring-2 ring-outline-variant/20" />
          Not reached
        </span>
        <div className="ml-auto flex gap-1">
          <button onClick={load} disabled={loading} title="Refresh"
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={zoomIn}  title="Zoom In"  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={zoomOut} title="Zoom Out" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={fitView} title="Fit View" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

        {/* BPMN Viewer */}
        <div className="relative border border-outline-variant/20 rounded-xl overflow-hidden bg-white" style={{ minHeight: 420 }}>
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                <span className="text-sm text-on-surface-variant">Loading execution path...</span>
              </div>
            </div>
          )}
          {/* Error overlay */}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 p-6">
              <div className="text-center max-w-xs">
                <p className="text-error font-semibold mb-1">Failed to load diagram</p>
                <p className="text-xs text-on-surface-variant font-mono break-all">{error}</p>
                <button onClick={load} className="mt-3 text-xs text-primary underline">Retry</button>
              </div>
            </div>
          )}

          {/* bpmn-js mount target */}
          <div ref={containerRef} style={{ width: '100%', height: 420 }} />

          {/* CSS markers injected inline */}
          <style>{`
            /* White background for the canvas */
            .djs-container svg { background: #fff !important; }

            /* Completed — green */
            .execution-completed .djs-visual > :is(rect,circle,polygon,path) {
              stroke: #059669 !important; stroke-width: 2.5px !important;
              fill: rgba(5,150,105,0.10) !important;
            }
            .execution-completed .djs-visual text { fill: #047857 !important; }

            /* Active — red, glowing */
            .execution-active .djs-visual > :is(rect,circle,polygon,path) {
              stroke: #ef4444 !important; stroke-width: 2.5px !important;
              fill: rgba(239,68,68,0.12) !important;
              filter: drop-shadow(0 0 6px rgba(239,68,68,0.5));
            }
            .execution-active .djs-visual text { fill: #b91c1c !important; }

            /* Unreached — light grey */
            .execution-unreached .djs-visual > :is(rect,circle,polygon,path) {
              stroke: #cbd5e1 !important; fill: #f8fafc !important;
            }
            .execution-unreached .djs-visual text { fill: #94a3b8 !important; }

            /* Sequence flows */
            .execution-flow-completed .djs-visual path     { stroke: #059669 !important; stroke-width: 2px !important; }
            .execution-flow-completed .djs-visual polyline { stroke: #059669 !important; }
            .execution-flow-active    .djs-visual path     { stroke: #ef4444 !important; stroke-width: 2px !important; }
            .execution-flow-active    .djs-visual polyline { stroke: #ef4444 !important; }
          `}</style>
        </div>

        {/* Audit Trail */}
        <div className="flex flex-col border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container-lowest">
          <div className="px-4 py-3 border-b border-outline-variant/15 bg-surface-container">
            <h4 className="text-label-lg font-semibold text-on-surface">📋 Audit Trail</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {auditRows.length > 0 ? `${auditRows.length} human & service steps` : loading ? 'Loading…' : 'No data'}
            </p>
          </div>

          {auditRows.length === 0 && !loading ? (
            <div className="flex-1 flex items-center justify-center p-6 text-sm text-on-surface-variant">
              No activity history yet.
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
              {auditRows.map((a, idx) => {
                const isActive = active.has(a.activityId);
                const isDone   = !isActive && completed.has(a.activityId);
                return (
                  <div key={`${a.activityId}-${idx}`}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-0
                      ${isActive ? 'bg-red-500/10' : ''}`}>
                    <div className="mt-0.5 flex-shrink-0">
                      {isActive ? (
                        <Circle className="w-4 h-4 text-red-400 animate-pulse" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-outline-variant/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate
                        ${isActive ? 'text-red-400' : isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {a.activityName || a.activityId}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5 font-mono space-y-0.5">
                        <div>▶ {formatTime(a.startTime)}</div>
                        {a.endTime && <div>⏹ {formatTime(a.endTime)}</div>}
                        {a.durationInMillis !== null && (
                          <div className="text-primary/80">⏱ {formatDuration(a.durationInMillis)}</div>
                        )}
                        {a.assignee && <div className="text-sky-400">👤 {a.assignee}</div>}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant flex-shrink-0 uppercase tracking-wide">
                      {(a.activityType || '').replace(/Task|Event/g, '').trim() || 'node'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {auditRows.length > 0 && !loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Completed Steps', count: completedStepCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Active Steps',    count: activeStepCount,    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-400/20'         },
            { label: 'Total Steps',     count: auditRows.length, color: 'text-primary',  bg: 'bg-primary/10 border-primary/20'          },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col items-center p-3 rounded-xl border ${s.bg}`}>
              <span className={`text-xl font-bold ${s.color}`}>{s.count}</span>
              <span className="text-xs text-on-surface-variant mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
