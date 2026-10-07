import React, { useEffect, useState } from 'react';
import { timesheetsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Timesheets: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await timesheetsApi.getAll();
        setEntries(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Workforce Timesheets</h2>
        <p className="text-xs text-zinc-400">Billable hours logged against enterprise contracts</p>
      </div>

      <DataTable
        loading={loading}
        data={entries}
        columns={[
          { header: 'Date', accessor: 'date' },
          { header: 'Project', accessor: (row) => row.project_name || 'Enterprise Project' },
          { header: 'Hours', accessor: (row) => `${row.hours || 0} hrs` },
          { header: 'Description', accessor: 'description' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'submitted'} /> },
        ]}
      />
    </div>
  );
};

export default Timesheets;
