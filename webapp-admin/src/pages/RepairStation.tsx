import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { flowableApi } from '../lib/flowableApi';
import { AlertOctagon, RotateCw, RefreshCw, ChevronDown, ChevronUp, Terminal, Activity, Search } from 'lucide-react';

export function RepairStation() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stacktraces, setStacktraces] = useState<Record<string, string>>({});
  const [loadingStacktrace, setLoadingStacktrace] = useState<Set<string>>(new Set());
  
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await flowableApi.getDeadLetterJobs();
      const rawJobs = response.data || [];
      const enrichedJobs = await Promise.all(
        rawJobs.map(async (job: any) => {
          if (!job.processInstanceId) return job;
          try {
            const historic = await flowableApi.getHistoricProcessInstance(job.processInstanceId);
            return { ...job, businessKey: historic.businessKey };
          } catch {
            return job;
          }
        })
      );
      setJobs(enrichedJobs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dead-letter jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleRow = async (jobId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(jobId)) {
      newExpandedRows.delete(jobId);
      setExpandedRows(newExpandedRows);
      return;
    }
    
    // Expand row
    newExpandedRows.add(jobId);
    setExpandedRows(newExpandedRows);
    
    // Fetch stack trace if not already available
    if (!stacktraces[jobId] && !loadingStacktrace.has(jobId)) {
      setLoadingStacktrace(prev => new Set(prev).add(jobId));
      try {
        const trace = await flowableApi.getDeadLetterJobStacktrace(jobId);
        setStacktraces(prev => ({ ...prev, [jobId]: trace }));
      } catch (err) {
        console.error('Failed to fetch stack trace', err);
        setStacktraces(prev => ({ ...prev, [jobId]: 'Failed to load stack trace.' }));
      } finally {
        setLoadingStacktrace(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    }
  };

  const handleRetry = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row expansion
    if (retryingJobs.has(jobId)) return;
    
    setRetryingJobs(prev => new Set(prev).add(jobId));
    try {
      await flowableApi.moveDeadLetterJob(jobId);
      // Remove from list or refetch list
      setJobs(prev => prev.filter(job => job.id !== jobId));
      
      // Cleanup states
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } catch (err: any) {
      alert(`Failed to retry job: ${err.message}`);
    } finally {
      setRetryingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const filteredJobs = searchKey 
    ? jobs.filter((j) => j.businessKey?.toLowerCase().includes(searchKey.toLowerCase()))
    : jobs;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-sm text-on-surface font-semibold flex items-center gap-3">
            <AlertOctagon className="w-7 h-7 text-error" />
            Repair Station
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl mt-1">
            Centralized self-healing interface for resolving asynchronous processing failures caused by network anomalies, resource lockouts, or backend outages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search Business Key..." 
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 border border-outline-variant/30 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={fetchJobs} 
            disabled={loading} 
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden bg-surface-container">
        <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
          <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
            <Activity className="w-5 h-5 text-on-surface-variant" />
            Dead-Letter Incidents
          </h2>
          <Badge className="bg-error-container text-on-error-container font-medium text-sm px-3 py-1">
            {jobs.length} Active {jobs.length === 1 ? 'Incident' : 'Incidents'}
          </Badge>
        </div>

        {error ? (
          <div className="p-8 text-center text-error border-b border-outline-variant/10">
            <AlertOctagon className="w-10 h-10 mx-auto opacity-50 mb-3" />
            <p className="font-semibold">Error Loading Incidents</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            Loading incident data...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-10 text-center border-b border-outline-variant/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <RotateCw className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-title-lg font-bold text-on-surface mb-2">
              {searchKey ? 'No matches found' : 'Systems Nominal'}
            </h3>
            <p className="text-body-md text-on-surface-variant">
              {searchKey ? `No dead-letter jobs match the business key "${searchKey}".` : 'No dead-letter job failures detected.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/15">
            {filteredJobs.map((job) => {
              const isExpanded = expandedRows.has(job.id);
              const isRetrying = retryingJobs.has(job.id);
              const isLoadingTrace = loadingStacktrace.has(job.id);
              
              return (
                <div key={job.id} className="transition-all hover:bg-surface-container-low">
                  <div 
                    onClick={() => toggleRow(job.id)}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 cursor-pointer relative border-l-4 transition-colors
                      ${isExpanded ? 'border-l-error bg-surface-container-low' : 'border-l-transparent'}
                    `}
                  >
                    {/* ID & Info block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-error break-all">
                          {job.exceptionMessage ? job.exceptionMessage.substring(0, 80) + (job.exceptionMessage.length > 80 ? '...' : '') : 'Unknown Error'}
                        </span>
                        <Badge className="bg-surface-variant text-xs flex-shrink-0">
                          {job.retries} default retries used
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-on-surface-variant font-mono flex flex-wrap gap-x-4 gap-y-1">
                        <span>Job ID: {job.id}</span>
                        {job.businessKey ? (
                          <span>Business Key: <span className="text-primary font-bold">{job.businessKey}</span></span>
                        ) : (
                          <span>Process Instance ID: <span className="text-primary">{job.processInstanceId}</span></span>
                        )}
                        {job.elementId && <span>Activity ID: {job.elementId}</span>}
                        {job.elementName && <span>Activity: {job.elementName}</span>}
                        {job.createTime && <span>Created: {new Date(job.createTime).toLocaleString()}</span>}
                      </div>
                    </div>
                    
                    {/* Action block */}
                    <div className="flex items-center gap-4 flex-shrink-0 mt-3 sm:mt-0">
                      <Button
                        variant="primary"
                        onClick={(e) => handleRetry(job.id, e)}
                        disabled={isRetrying}
                        className="py-1.5 px-4 h-auto text-sm bg-primary hover:bg-primary/90 rounded-md gap-2 shadow-sm"
                      >
                        <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Retry Job'}
                      </Button>
                      
                      <button className="text-on-surface-variant p-1 rounded-full hover:bg-surface-variant/50 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Root Cause block */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 pl-[28px] border-t border-outline-variant/10 bg-surface-container-lowest overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <h4 className="text-label-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                        <Terminal className="w-4 h-4 text-on-surface-variant" />
                        Root Cause Analysis
                      </h4>
                      <div className="bg-[#1e1e1e] rounded-lg p-4 max-h-96 overflow-auto border border-outline-variant/20 shadow-inner">
                        {isLoadingTrace ? (
                          <div className="text-white/50 text-sm font-mono animate-pulse">
                            Extracting exception stack trace...
                          </div>
                        ) : stacktraces[job.id] ? (
                          <pre className="text-[#d4d4d4] font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                            {stacktraces[job.id]}
                          </pre>
                        ) : (
                          <div className="text-white/50 text-sm font-mono">
                            No stack trace available.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
