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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Workforce Attendance Registry</h2>
        <p className="text-xs text-zinc-400">Employee clock-in timestamps, status, and duration records</p>
      </div>

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
    </div>
  );
};

export default Attendance;
