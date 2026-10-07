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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">All Operational Projects</h2>
        <p className="text-xs text-zinc-400">Enterprise accounts, delivery health, and budget tracking</p>
      </div>

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
    </div>
  );
};

export default Projects;
