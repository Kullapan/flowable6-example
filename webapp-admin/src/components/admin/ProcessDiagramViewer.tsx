import { useEffect, useState } from 'react';
import { flowableApi } from '../../lib/flowableApi';

interface ProcessDiagramViewerProps {
  processInstanceId: string;
}

export function ProcessDiagramViewer({ processInstanceId }: ProcessDiagramViewerProps) {
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!processInstanceId) return;

    setLoading(true);
    setError(null);
    
    flowableApi.getProcessDiagramUrl(processInstanceId)
      .then(url => {
        setDiagramUrl(url);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load process diagram. Ensure the process is active or history diagram is available.');
      })
      .finally(() => {
        setLoading(false);
      });

    // Cleanup object URL
    return () => {
      if (diagramUrl) {
        URL.revokeObjectURL(diagramUrl);
      }
    };
    // We intentionally don't add diagramUrl to dependencies to avoid re-triggering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processInstanceId]);

  if (loading) return <div className="p-4 text-on-surface-variant">Loading diagram...</div>;
  if (error) return <div className="p-4 text-error">{error}</div>;
  if (!diagramUrl) return <div className="p-4 text-on-surface-variant">No diagram available.</div>;

  return (
    <div className="overflow-auto border border-outline-variant/20 rounded-md bg-surface-container-lowest p-2 max-h-[500px]">
      <img 
        src={diagramUrl} 
        alt="Live Process Diagram" 
        className="max-w-none" 
      />
    </div>
  );
}
