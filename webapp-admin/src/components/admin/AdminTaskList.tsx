import { useEffect, useState } from 'react';
import { flowableApi } from '../../lib/flowableApi';
import { Badge } from '../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { RefreshCw } from 'lucide-react';

interface AdminTaskListProps {
  onTaskSelect?: (processInstanceId: string) => void;
}

export function AdminTaskList({ onTaskSelect }: AdminTaskListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unassigned'>('all');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await flowableApi.getTasks(filter === 'unassigned' ? { unassigned: true } : {});
      setTasks(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container">
        <div className="flex gap-4">
          {(['all', 'unassigned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-label-md font-semibold pb-1 border-b-2 transition-colors capitalize
                ${filter === f ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
            >
              {f === 'all' ? 'All Tasks' : 'Unassigned'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          title="Refresh"
          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-on-surface-variant">Loading tasks...</div>
      ) : (
        <Table className="border-0 rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Process Instance</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-on-surface-variant py-10">
                  No active tasks found.
                </TableCell>
              </TableRow>
            ) : tasks.map((task) => (
              <TableRow 
                key={task.id} 
                onClick={() => onTaskSelect && onTaskSelect(task.processInstanceId)}
                className={onTaskSelect ? "cursor-pointer hover:bg-surface-container-low transition-colors" : ""}
              >
                <TableCell className="font-mono text-xs text-on-surface">{task.id}</TableCell>
                <TableCell className="font-medium text-on-surface">{task.name}</TableCell>
                <TableCell className="font-mono text-xs">{task.processInstanceId}</TableCell>
                <TableCell>
                  {task.assignee ? (
                    <span className="text-on-surface">{task.assignee}</span>
                  ) : (
                    <Badge className="bg-warning-container text-on-warning-container">Unassigned</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">{new Date(task.createTime).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
