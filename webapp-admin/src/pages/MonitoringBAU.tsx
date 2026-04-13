import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, ListTodo, GitBranch, ChevronDown } from 'lucide-react';
import { flowableApi } from '../lib/flowableApi';
import { ProcessDiagramViewer } from '../components/admin/ProcessDiagramViewer';
import { VariableViewer } from '../components/admin/VariableViewer';
import { AdminTaskList } from '../components/admin/AdminTaskList';
import { Badge } from '../components/ui/Badge';
import { ExecutionPathViewer } from '../components/admin/ExecutionPathViewer';

// ─── Tab helper ───────────────────────────────────────────────────────
type TopTab    = 'instances' | 'tasks';
type DetailTab = 'diagram'   | 'variables' | 'execution-path';

function TabBtn({
  active, onClick, children
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-label-md font-semibold border-b-2 transition-colors whitespace-nowrap
        ${active
          ? 'text-primary border-primary bg-primary/5'
          : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low'
        }`}
    >
      {children}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export function MonitoringBAU() {
  // Top tabs: Process Instances vs Global Tasks
  const [topTab, setTopTab] = useState<TopTab>('instances');

  // Instance search state
  const [searchKey, setSearchKey]             = useState('');
  const [statusFilter, setStatusFilter]       = useState<'active' | 'completed'>('active');
  const [instances, setInstances]             = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<any | null>(null);
  const [loading, setLoading]                 = useState(false);

  // Process Details sub-tabs
  const [detailTab, setDetailTab] = useState<DetailTab>('diagram');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedInstance(null);
    try {
      // Step 1 — fetch process instances based on filter
      let rawInstances: any[] = [];
      if (statusFilter === 'active') {
        const resp = await flowableApi.getProcessInstances(searchKey);
        rawInstances = resp.data || [];
      } else {
        const resp = await flowableApi.getCompletedProcessInstances(searchKey);
        rawInstances = resp.data || [];
      }

      // Step 2 — enrich each instance with deploymentId.
      //
      // Strategy (per technical spec):
      //   PRIMARY:  History API in ONE call →
      //     GET /history/historic-process-instances/{id}
      //     Response contains `deploymentId` directly.
      //
      //   FALLBACK: 2-step repo path →
      //     inst.processDefinitionId → GET /repository/process-definitions/{id}
      //     Response contains `deploymentId`.
      const enriched = await Promise.all(
        rawInstances.map(async (inst: any) => {
          try {
            // PRIMARY: History API shortcut
            const historic = await flowableApi.getHistoricProcessInstance(inst.id);
            const deploymentId =
              historic.deploymentId ??
              // FALLBACK: 2-step if history response omitted it
              (inst.processDefinitionId
                ? (await flowableApi.getProcessDefinition(inst.processDefinitionId)).deploymentId
                : undefined) ??
              null;
            return { ...inst, deploymentId };
          } catch {
            // If enrichment fails entirely, return the raw instance unchanged
            return { ...inst, deploymentId: null };
          }
        })
      );

      // Sort instances by start time descending
      enriched.sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeB - timeA;
      });

      setInstances(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = async (procInstanceId: string) => {
    // Optimistic fast-open
    setSelectedInstance({ id: procInstanceId });
    setDetailTab('diagram');

    // Fetch enrichment data in background
    try {
      const historic = await flowableApi.getHistoricProcessInstance(procInstanceId);
      const deploymentId = historic.deploymentId ?? 
        (historic.processDefinitionId ? (await flowableApi.getProcessDefinition(historic.processDefinitionId)).deploymentId : null);
      
      setSelectedInstance((prev: any) => 
        prev?.id === procInstanceId ? { ...historic, deploymentId } : prev
      );
    } catch(err) {
      console.error("Failed to enrich task instance details", err);
    }
  };

  const selectedInstanceId = selectedInstance?.id ?? null;

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-headline-sm text-on-surface font-semibold">Monitoring &amp; Visibility (BAU)</h1>
        <p className="text-body-md text-on-surface-variant">Track business processes, view live status, and inspect variables.</p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOP SECTION — tabbed between Instances and Task List
          ══════════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container">
          <TabBtn active={topTab === 'instances'} onClick={() => { setTopTab('instances'); setSelectedInstance(null); }}>
            <GitBranch className="w-4 h-4" />
            Process Instances
            {instances.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold leading-none">
                {instances.length}
              </span>
            )}
          </TabBtn>
          <TabBtn active={topTab === 'tasks'} onClick={() => { setTopTab('tasks'); setSelectedInstance(null); }}>
            <ListTodo className="w-4 h-4" />
            Global Task List
          </TabBtn>
        </div>

        {/* ── Tab: Process Instances ── */}
        {topTab === 'instances' && (
          <div className="p-5 space-y-5">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-label-md text-on-surface-variant mb-1">
                  Search by Business Key
                </label>
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  placeholder="e.g. POL-12345 or leave empty for all"
                />
              </div>
              <div className="w-40">
                <label className="block text-label-md text-on-surface-variant mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'active' | 'completed')}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'calc(100% - 12px) center'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Button type="submit" variant="primary" className="h-10 gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </form>

            {/* Instance list */}
            {loading ? (
              <div className="py-10 text-center text-on-surface-variant">Searching...</div>
            ) : instances.length === 0 ? (
              <div className="border border-dashed border-outline-variant/50 rounded-xl p-10 text-center text-on-surface-variant text-body-md">
                Search to find process instances.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-outline-variant/20">
                {instances.map((inst) => {
                  const isSelected = selectedInstance?.id === inst.id;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        setSelectedInstance(inst);
                        setDetailTab('diagram');
                      }}
                      className={`flex items-center gap-4 px-5 py-4 cursor-pointer border-b last:border-0 transition-all
                        border-l-4
                        ${isSelected
                          ? 'bg-primary/8 border-l-primary border-outline-variant/10'
                          : 'hover:bg-surface-container-low border-l-transparent border-outline-variant/10'
                        }`}
                    >
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inst.suspended ? 'bg-error' : 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]'}`} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-on-surface truncate">
                          {inst.name || inst.processDefinitionName}
                        </div>
                        <div className="text-xs text-on-surface-variant font-mono mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>ID: {inst.id}</span>
                          {inst.businessKey && <span className="text-primary">Key: {inst.businessKey}</span>}
                          {inst.deploymentId && (
                            <span className="text-on-surface-variant/70" title="Deployment ID">
                              Deploy: <span className="text-amber-600">{inst.deploymentId}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {inst.endTime ? (
                          <Badge className="bg-surface-variant text-on-surface-variant">Completed</Badge>
                        ) : inst.suspended ? (
                          <Badge className="bg-error-container text-on-error-container">Suspended</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-600">Active</Badge>
                        )}
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(inst.startTime).toLocaleString()}
                        </span>
                      </div>

                      {/* Arrow indicator */}
                      {isSelected && <ChevronDown className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Global Task List ── */}
        {topTab === 'tasks' && (
          <div className="p-0">
            <AdminTaskList onTaskSelect={handleTaskSelect} />
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SECTION — Process Details (expands when selected)
          ══════════════════════════════════════════════════════════ */}
      {selectedInstanceId && (
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/15 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Process Details
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                <span className="text-xs font-mono text-on-surface-variant">
                  Instance: <span className="text-primary">{selectedInstanceId}</span>
                </span>
                {selectedInstance?.businessKey && (
                  <span className="text-xs font-mono text-on-surface-variant">
                    Key: <span className="text-on-surface">{selectedInstance.businessKey}</span>
                  </span>
                )}
                {selectedInstance?.processDefinitionName && (
                  <span className="text-xs text-on-surface-variant">
                    Process: <span className="text-on-surface">{selectedInstance.processDefinitionName}</span>
                  </span>
                )}
                {selectedInstance?.deploymentId && (
                  <span className="text-xs font-mono text-on-surface-variant">
                    Deployment ID:{" "}
                    <span className="text-amber-600 select-all">{selectedInstance.deploymentId}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedInstance(null)}
              className="text-xs text-on-surface-variant hover:text-error transition-colors mt-1"
            >
              ✕ Close
            </button>
          </div>

          {/* Detail sub-tabs */}
          <div className="flex border-b border-outline-variant/15 bg-surface-container-low px-2">
            {(
              [
                { id: 'diagram',         label: 'Live Diagram',    icon: '📐' },
                { id: 'variables',       label: 'Variables',       icon: '📦' },
                { id: 'execution-path',  label: 'Execution Path',  icon: '🗺' },
              ] as { id: DetailTab; label: string; icon: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-label-md font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap
                  ${detailTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-on-surface-variant border-transparent hover:text-on-surface'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Detail content */}
          <div className="p-6 bg-surface-container-lowest">
            {detailTab === 'diagram'        && <ProcessDiagramViewer processInstanceId={selectedInstanceId} />}
            {detailTab === 'variables'      && <VariableViewer        processInstanceId={selectedInstanceId} isCompleted={!!selectedInstance?.endTime} />}
            {detailTab === 'execution-path' && <ExecutionPathViewer   processInstanceId={selectedInstanceId} />}
          </div>
        </Card>
      )}

      {/* Hint when nothing selected */}
      {!selectedInstanceId && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant text-body-md">
          <span className="text-xl">👆</span>
          Select a process instance above to view its diagram, variables, or execution path.
        </div>
      )}
    </div>
  );
}
