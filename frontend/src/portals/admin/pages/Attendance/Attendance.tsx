"use client";
import React, { useEffect, useState } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { attendanceApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import AttendanceTrackerCard from '../../../../shared/components/AttendanceTracker';

export const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getAll();
      setRecords(res.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Workforce Attendance Registry"
        description="Employee clock-in timestamps, status, and duration records"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Attendance Registry' }]}
      />

      <div className="space-y-6 mt-6">
        {/* Live Attendance & Break Tracker Card */}
        <AttendanceTrackerCard
          onPunchChange={() => {
            loadAttendance();
          }}
        />

        <DataTable
          loading={loading}
          data={records}
          columns={[
            { header: 'Employee', accessor: (row) => row.employee_name || row.user_id || 'Current User' },
            { header: 'Date', accessor: 'date' },
            { header: 'Check In', accessor: (row) => row.check_in || '—' },
            { header: 'Check Out', accessor: (row) => row.check_out || '—' },
            { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'present'} /> },
          ]}
        />
      </div>
    </PageContainer>
  );
};

export default Attendance;
