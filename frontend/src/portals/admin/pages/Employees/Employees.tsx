import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
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
    <PageContainer>
      <PageHeader
        title="Employee Directory"
        description="Formal employment profiles, designations, and departments"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Employee Directory' }]}
        
      />

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
    </PageContainer>
  );
}
export default Employees;
