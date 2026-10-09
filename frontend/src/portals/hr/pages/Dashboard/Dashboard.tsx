import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { hrApi } from '../../../../api/hr.api';
import { useAuth } from '../../../../auth/auth.context';
import AttendanceTrackerCard from '../../../../shared/components/AttendanceTracker';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeavesCount: 0,
    openPositions: 0,
    todayAttendance: null as any,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await hrApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Sleek Attendance Controls */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A84C]">HR Operations Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F2]">Welcome back, {user?.name || 'Administrator'}</h1>
          <p className="text-xs text-[#9B9DA3]">
            Real-time workforce monitoring, attendance management, and talent workflows.
          </p>
        </div>

        {/* Sleek Mini Attendance Widget */}
        <AttendanceTrackerCard
          variant="banner"
          onPunchChange={() => {
            fetchStats();
          }}
        />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9B9DA3]">
            <span>Total Workforce</span>
            <span className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#EDB940]">👥</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats.totalEmployees}
          </div>
          <div className="text-[11px] text-[#16A34A] flex items-center gap-1">
            <span>●</span> Active employee records
          </div>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9B9DA3]">
            <span>Pending Leaves</span>
            <span className="p-1.5 rounded-lg bg-[#D97706]/10 text-[#D97706]">📅</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats.pendingLeavesCount}
          </div>
          <Link href="/hr/leave" className="text-[11px] text-[#C9A84C] hover:underline flex items-center gap-1">
            Review approval queue →
          </Link>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9B9DA3]">
            <span>Open Career Positions</span>
            <span className="p-1.5 rounded-lg bg-[#C9A84C]/10 text-[#EDB940]">💼</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? '...' : stats.openPositions}
          </div>
          <Link href="/hr/recruitment" className="text-[11px] text-[#C9A84C] hover:underline flex items-center gap-1">
            View ATS jobs →
          </Link>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9B9DA3]">
            <span>Today&apos;s Status</span>
            <span className="p-1.5 rounded-lg bg-[#16A34A]/10 text-[#16A34A]">⏰</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.todayAttendance?.check_in ? 'Present' : 'Awaiting Check-in'}
          </div>
          <Link href="/hr/attendance" className="text-[11px] text-[#C9A84C] hover:underline flex items-center gap-1">
            View attendance logs →
          </Link>
        </div>
      </div>

      {/* Quick Operations Matrix */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#C9A84C]">HR Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/hr/employees"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">👥</div>
            <p className="text-xs font-semibold text-white">Add Employee</p>
          </Link>

          <Link
            href="/hr/leave"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">📅</div>
            <p className="text-xs font-semibold text-white">Apply Leave</p>
          </Link>

          <Link
            href="/hr/timesheets"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">⏱️</div>
            <p className="text-xs font-semibold text-white">Log Timesheet</p>
          </Link>

          <Link
            href="/hr/payroll"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">💵</div>
            <p className="text-xs font-semibold text-white">View Payroll</p>
          </Link>

          <Link
            href="/hr/performance"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">🎯</div>
            <p className="text-xs font-semibold text-white">Appraisals</p>
          </Link>

          <Link
            href="/hr/recruitment"
            className="p-3 bg-[#0E1013] hover:bg-[#1A1E24] border border-[#272B35] rounded-lg text-center space-y-2 group transition-all"
          >
            <div className="text-xl group-hover:scale-110 transition-transform">💼</div>
            <p className="text-xs font-semibold text-white">Job Postings</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
