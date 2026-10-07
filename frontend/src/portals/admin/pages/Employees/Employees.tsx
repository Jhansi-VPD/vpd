import React, { useEffect, useState } from 'react';
import { employeesApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await employeesApi.getAll();
        setEmployees(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Employee Directory</h2>
        <p className="text-xs text-zinc-400">Formal employment profiles, designations, and departments</p>
      </div>

      <DataTable
        loading={loading}
        data={employees}
        columns={[
          { header: 'Employee Code', accessor: 'employee_code' },
          { header: 'Full Name', accessor: (row) => `${row.first_name || ''} ${row.last_name || ''}` },
          { header: 'Designation', accessor: 'designation' },
          { header: 'Department', accessor: 'department' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'active'} /> },
        ]}
      />
    </div>
  );
};

export default Employees;
