"use client";
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { employeesApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultEmployees = [
    { employee_code: 'VPD-001', first_name: 'Alexander', last_name: 'Vance', designation: 'Principal Architect', department: 'Engineering', status: 'active' },
    { employee_code: 'VPD-002', first_name: 'Elena', last_name: 'Rostova', designation: 'VP of Product', department: 'Product', status: 'active' },
    { employee_code: 'VPD-003', first_name: 'Marcus', last_name: 'Chen', designation: 'Senior DevOps Engineer', department: 'Infrastructure', status: 'active' },
    { employee_code: 'VPD-004', first_name: 'Sarah', last_name: 'Jenkins', designation: 'Enterprise Account Executive', department: 'Sales', status: 'active' },
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await employeesApi.getAll();
        setEmployees(res?.data && res.data.length > 0 ? res.data : defaultEmployees);
      } catch (err) {
        console.warn('Employees API unavailable, using demo employees', err);
        setEmployees(defaultEmployees);
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
