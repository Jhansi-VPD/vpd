import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

export const Attendance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tappedIn, setTappedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [tapLoading, setTapLoading] = useState(false);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getAll();
      const list = res.data || [];
      setRecords(list);

      const today = new Date().toISOString().split('T')[0];
      const todayLog = list.find((a: any) => a.date === today && a.check_in);
      if (todayLog) {
        setTappedIn(!todayLog.check_out);
        setCheckInTime(todayLog.check_in);
        setCheckOutTime(todayLog.check_out || '');
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleTapIn = async () => {
    setTapLoading(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toISOString().split('T')[0];
    try {
      await attendanceApi.checkIn({ date: today, check_in: nowTime });
    } catch {
      // local fallback
    }
    setTappedIn(true);
    setCheckInTime(nowTime);
    setCheckOutTime('');
    setRecords((prev) => [
      { id: Date.now().toString(), date: today, check_in: nowTime, check_out: null, status: 'present' },
      ...prev,
    ]);
    setTapLoading(false);
  };

  const handleTapOut = async () => {
    setTapLoading(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toISOString().split('T')[0];
    try {
      await attendanceApi.checkOut({ date: today, check_out: nowTime });
    } catch {
      // local fallback
    }
    setTappedIn(false);
    setCheckOutTime(nowTime);
    setRecords((prev) =>
      prev.map((r) => (r.date === today ? { ...r, check_out: nowTime } : r))
    );
    setTapLoading(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Workforce Attendance Registry"
        description="Employee clock-in timestamps, status, and duration records"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Attendance Registry' }]}
        
      />

    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Workforce Attendance Registry</h2>
          <p className="text-xs text-zinc-400">Employee clock-in timestamps, status, and duration records</p>
        </div>
        <div className="flex items-center gap-2">
          {!tappedIn ? (
            <Button variant="primary" size="sm" loading={tapLoading} onClick={handleTapIn}>
              👉 Tap In (Check In)
            </Button>
          ) : (
            <Button variant="danger" size="sm" loading={tapLoading} onClick={handleTapOut}>
              👈 Tap Out (Check Out)
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${tappedIn ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <div>
            <span className="text-xs font-semibold text-white">
              {tappedIn ? 'Currently Tapped In (Working)' : 'Not Tapped In Today'}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {checkInTime ? `Checked in at ${checkInTime}` : 'Tap in to record your presence for today.'}
              {checkOutTime ? ` • Checked out at ${checkOutTime}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={tappedIn ? 'secondary' : 'primary'} onClick={handleTapIn} disabled={tappedIn || tapLoading}>
            Tap In
          </Button>
          <Button size="sm" variant={!tappedIn ? 'secondary' : 'danger'} onClick={handleTapOut} disabled={!tappedIn || tapLoading}>
            Tap Out
          </Button>
        </div>
      </div>
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
    </PageContainer>
  );
}
export default Attendance;

