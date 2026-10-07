import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
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
    <PageContainer>
      <PageHeader
        title="Workforce Timesheets"
        description="Billable hours logged against enterprise contracts"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Timesheets' }]}
        
      />

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
    </PageContainer>
  );
}
export default Timesheets;
