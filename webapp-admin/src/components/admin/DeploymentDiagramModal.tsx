import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, RefreshCw, Loader2 } from 'lucide-react';
import { flowableApi } from '../../lib/flowableApi';

interface DeploymentDiagramModalProps {
  /** Raw deployment ID */
  deploymentId: string;
  /**
   * Original resource.id from Flowable's /resources endpoint.
   * May be a full Windows path for old Spring Boot auto-deployments.
   * Used as the primary lookup key; falls back to process-definition API if this fails.
   */
  resourceId: string;
  /** Display-friendly filename shown in the header */
  resourceName: string;
  /** Human-readable deployment label for the modal title */
  deploymentName: string;
  onClose: () => void;
}

export function DeploymentDiagramModal({
  deploymentId,
  resourceId,
  resourceName,
  deploymentName,
  onClose,
}: DeploymentDiagramModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [source, setSource] = useState<'direct' | 'definition' | null>(null);

  // ── Fetch BPMN XML with two-tier strategy ───────────────────────────────────
  //
  //  TIER 1 (Primary):
  //    GET /repository/deployments/{id}/resourcedata/{resourceId}
  //    Works for fresh uploads where resourceId == the relative classpath path.
  //
  //  TIER 2 (Fallback — for old Spring Boot auto-deployments):
  //    GET /repository/process-definitions?deploymentId={id}
  //    → pick first match → GET /repository/process-definitions/{defId}/resourcedata
  //    This always works regardless of how the resource path was originally stored.
  //
  const fetchXml = useCallback(async (): Promise<{ xml: string; tier: 'direct' | 'definition' }> => {
    // Tier 1 — direct resource fetch
    if (resourceId) {
      try {
        const xml = await flowableApi.getDeploymentResourceXml(
          deploymentId,
          encodeURIComponent(resourceId)
        );
        console.log('[DiagramModal] fetched via direct resource path');
        return { xml, tier: 'direct' };
      } catch (e) {
        console.warn('[DiagramModal] direct resource fetch failed, trying fallback…', e);
      }
    }

    // Tier 2 — process definition fallback
    const defData = await flowableApi.getProcessDefinitionsByDeployment(deploymentId);
    const defs: any[] = Array.isArray(defData) ? defData : (defData?.data ?? []);
    if (defs.length === 0) {
      throw new Error(`No process definitions found for deployment ${deploymentId}`);
    }
    // Prefer BPMN process type; fall back to first result
    const def = defs.find((d: any) => d.graphicalNotationDefined !== false) ?? defs[0];
    const xml = await flowableApi.getProcessDefinitionXml(def.id);
    console.log('[DiagramModal] fetched via process-definition fallback, defId=', def.id);
    return { xml, tier: 'definition' };
  }, [deploymentId, resourceId]);

  // ── Load & render ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSource(null);

    // Destroy previous viewer
    if (viewerRef.current) {
      try { viewerRef.current.destroy(); } catch (_) { /* ignore */ }
      viewerRef.current = null;
    }

    try {
      const { xml, tier } = await fetchXml();
      setSource(tier);

      if (!containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BpmnViewer = ((await import('bpmn-js/lib/NavigatedViewer')) as any).default;
      const viewer = new BpmnViewer({ container: containerRef.current, height: '100%' });
      viewerRef.current = viewer;

      await viewer.importXML(xml);
      viewer.get('canvas').zoom('fit-viewport', 'auto');
    } catch (err) {
      console.error('DeploymentDiagramModal error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [fetchXml]);

  useEffect(() => {
    load();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (_) { /* ignore */ }
        viewerRef.current = null;
      }
    };
  }, [load, onClose]);

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const getCanvas = () => { try { return viewerRef.current?.get('canvas'); } catch (_) { return null; } };
  const zoomIn    = () => { const c = getCanvas(); if (c) c.zoom(c.zoom() * 1.25); };
  const zoomOut   = () => { const c = getCanvas(); if (c) c.zoom(c.zoom() * 0.8); };
  const fitView   = () => { getCanvas()?.zoom('fit-viewport', 'auto'); };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="relative flex flex-col w-full max-w-5xl bg-surface rounded-2xl shadow-2xl overflow-hidden"
        style={{ height: 'min(90vh, 780px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15 bg-surface-container shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📐</span>
            <div className="min-w-0">
              <h2 className="text-title-md font-bold text-on-surface truncate">
                {deploymentName || resourceName}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-mono text-on-surface-variant truncate">
                  {resourceName} &nbsp;·&nbsp; Deploy:&nbsp;
                  <span className="text-amber-600">{deploymentId}</span>
                </p>
                {source === 'definition' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-medium shrink-0">
                    via process-definition fallback
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button onClick={load} disabled={loading} title="Refresh"
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={zoomIn}  title="Zoom In"  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={zoomOut} title="Zoom Out" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={fitView} title="Fit to View" className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-outline-variant/30 mx-1" />
            <button onClick={onClose} title="Close (Esc)"
              className="p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* bpmn-js canvas */}
        <div className="relative flex-1 bg-white overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-on-surface-variant">Loading BPMN diagram…</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 z-10 p-8">
              <p className="text-error font-semibold">Failed to load diagram</p>
              <p className="text-xs text-on-surface-variant font-mono text-center break-all max-w-sm">{error}</p>
              <button onClick={load} className="text-xs text-primary underline underline-offset-2 mt-1">
                Retry
              </button>
            </div>
          )}

          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          <style>{`.djs-container svg { background: #fff !important; }`}</style>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t border-outline-variant/15 bg-surface-container shrink-0 flex items-center gap-4 text-xs text-on-surface-variant">
          <span>🖱️ Scroll to zoom &nbsp;·&nbsp; Click &amp; drag to pan</span>
          <span className="ml-auto">
            Press <kbd className="px-1.5 py-0.5 rounded border border-outline-variant/30 font-mono bg-surface-container-high text-[11px]">Esc</kbd> or click outside to close
          </span>
        </div>
      </div>
    </div>
  );
}
