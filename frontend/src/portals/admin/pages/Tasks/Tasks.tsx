"use client";
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { tasksApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

const demoTasks = [
  { id: '1', title: 'Implement OAuth 2.0 PKCE Flow', assignee_name: 'Alex Rivera', priority: 'high', status: 'in_progress' },
  { id: '2', title: 'Database Index Optimization for Telemetry', assignee_name: 'Samantha Chen', priority: 'critical', status: 'in_progress' },
  { id: '3', title: 'SOC 2 Type II Evidence Packaging', assignee_name: 'David Vance', priority: 'medium', status: 'review' },
  { id: '4', title: 'Migrate Core Services to Multi-AZ Cluster', assignee_name: 'Elena Rostova', priority: 'high', status: 'todo' },
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await tasksApi.getAll();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setTasks(res.data);
        } else if (Array.isArray(res) && res.length > 0) {
          setTasks(res);
        } else {
          setTasks(demoTasks);
        }
      } catch (err) {
        console.warn('Tasks API unavailable, loading demo tasks', err);
        setTasks(demoTasks);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Central Task Registry"
        description="Cross-project task backlogs, deadlines, and ownership"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Central Task Registry' }]}
        
      />

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
    </PageContainer>
  );
}
export default Tasks;
