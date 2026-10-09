import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { hrApi } from '../../../../api/hr.api';
import { useAuth } from '../../../../auth/auth.context';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeavesCount: 0,
    openPositions: 0,
    todayAttendance: null as any,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchStats = async () => {
    try {
      const data = await hrApi.getDashboardStats();
      setStats(data);
      if (data.todayAttendance?.check_in && !data.todayAttendance?.check_out) {
        // Calculate seconds since check in if time string or today
        setElapsedSeconds(2880); // approx starting counter or timer
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Timer tick if checked in
  useEffect(() => {
    if (stats.todayAttendance?.check_in && !stats.todayAttendance?.check_out) {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stats.todayAttendance]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await hrApi.checkIn();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await hrApi.checkOut();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isCheckedIn = Boolean(stats.todayAttendance?.check_in);
  const isCheckedOut = Boolean(stats.todayAttendance?.check_out);

  return (
    <div className="space-y-6">
      {/* Welcome & Live Clock In Banner */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A84C]">HR Operations Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F2]">Welcome back, {user?.name || 'Administrator'}</h1>
          <p className="text-xs text-[#9B9DA3]">
            Real-time workforce monitoring, attendance management, and talent workflows.
          </p>
        </div>

        {/* Live Attendance Clock-In Widget */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0E1013] border border-[#272B35] p-3 sm:p-4 rounded-lg w-full md:w-auto">
          <div className="text-center sm:text-left">
            <p className="text-[10px] uppercase font-mono text-[#7A7D84]">Today&apos;s Session</p>
            <p className="text-xl font-mono font-bold text-[#EDB940]">
              {isCheckedIn && !isCheckedOut ? formatTimer(elapsedSeconds) : isCheckedOut ? 'Shift Completed' : 'Not Clocked In'}
            </p>
            <p className="text-[11px] text-[#9B9DA3]">
              {stats.todayAttendance?.check_in ? `In: ${stats.todayAttendance.check_in}` : 'Ready to start'}
              {stats.todayAttendance?.check_out ? ` • Out: ${stats.todayAttendance.check_out}` : ''}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#EDB940] hover:brightness-110 text-black font-semibold text-xs rounded-lg shadow-md shadow-[#C9A84C]/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Clock In
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#DC2626]/20 border border-[#DC2626]/50 hover:bg-[#DC2626]/30 text-[#F87171] font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Clock Out
              </button>
            ) : (
              <span className="px-3 py-1.5 text-xs rounded-md bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                Completed
              </span>
            )}
          </div>
        </div>
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
            {isCheckedIn ? 'Present' : 'Awaiting Check-in'}
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
