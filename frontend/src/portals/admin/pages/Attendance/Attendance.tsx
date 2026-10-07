import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await attendanceApi.getAll();
        setRecords(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Workforce Attendance Registry"
        description="Employee clock-in timestamps, status, and duration records"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Attendance Registry' }]}
        
      />

      <DataTable
        loading={loading}
        data={records}
        columns={[
          { header: 'Employee', accessor: (row) => row.employee_name || row.user_id || 'Employee' },
          { header: 'Date', accessor: 'date' },
          { header: 'Check In', accessor: (row) => row.check_in || '—' },
          { header: 'Check Out', accessor: (row) => row.check_out || '—' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'present'} /> },
        ]}
      />
    </PageContainer>
  );
}
export default Attendance;
