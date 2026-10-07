import React, { useEffect, useState } from 'react';
import { tasksApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await tasksApi.getAll();
        setTasks(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Central Task Registry</h2>
        <p className="text-xs text-zinc-400">Cross-project task backlogs, deadlines, and ownership</p>
      </div>

      <DataTable
        loading={loading}
        data={tasks}
        columns={[
          { header: 'Task Title', accessor: 'title' },
          { header: 'Assignee', accessor: (row) => row.assignee_name || 'Assigned Member' },
          { header: 'Priority', accessor: (row) => <StatusBadge status={row.priority || 'medium'} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'todo'} /> },
          { header: 'Due Date', accessor: 'due_date' },
        ]}
      />
    </div>
  );
};

export default Tasks;
