import { useEffect, useState } from 'react';
import { flowableApi } from '../../lib/flowableApi';

interface VariableViewerProps {
  processInstanceId: string;
  isCompleted?: boolean;
}

export function VariableViewer({ processInstanceId, isCompleted }: VariableViewerProps) {
  const [variables, setVariables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!processInstanceId) return;
    
    setLoading(true);
    setError(null);

    const fetchVariables = isCompleted
      ? flowableApi.getHistoricProcessVariables(processInstanceId)
      : flowableApi.getProcessVariables(processInstanceId);

    fetchVariables
      .then((data: any) => {
        setVariables(data || []);
      })
      .catch((err: any) => {
        console.error(err);
        setError('Failed to load variables');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [processInstanceId]);

  if (loading) return <div className="p-4 text-on-surface-variant">Loading variables...</div>;
  if (error) return <div className="p-4 text-error">{error}</div>;
  if (variables.length === 0) return <div className="p-4 text-on-surface-variant">No variables found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant/20 bg-surface-container-low">
            <th className="p-3 text-label-md text-on-surface font-semibold">Name</th>
            <th className="p-3 text-label-md text-on-surface font-semibold">Type</th>
            <th className="p-3 text-label-md text-on-surface font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((v, i) => (
            <tr key={v.name || i} className="border-b border-outline-variant/10 text-body-md text-on-surface-variant">
              <td className="p-3 font-mono text-primary">{v.name}</td>
              <td className="p-3">{v.type}</td>
              <td className="p-3">
                {typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
