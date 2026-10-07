import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await projectsApi.getAll();
        setProjects(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="All Operational Projects"
        description="Enterprise accounts, delivery health, and budget tracking"
        breadcrumbs={[{ label: 'Admin' }, { label: 'All Operational Projects' }]}
        
      />

      <DataTable
        loading={loading}
        data={projects}
        columns={[
          { header: 'Project Name', accessor: 'name' },
          { header: 'Client', accessor: (row) => row.client_name || 'Enterprise Client' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'in_progress'} /> },
          {
            header: 'Progress',
            accessor: (row) => (
              <div className="w-32 bg-zinc-800 rounded-full h-2">
                <div className="bg-[#d4af37] h-2 rounded-full" style={{ width: `${row.progress || 60}%` }} />
              </div>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}