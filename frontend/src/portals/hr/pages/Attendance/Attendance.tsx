import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';
import AttendanceTrackerCard from '../../../../shared/components/AttendanceTracker';

export const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'company'>('my');
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [companyAttendance, setCompanyAttendance] = useState<any[]>([]);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [todayRes, myRes, allRes] = await Promise.all([
        hrApi.getMyTodayAttendance().catch(() => ({ data: null })),
        hrApi.getMyAttendanceHistory({ limit: 50 }).catch(() => ({ data: [] })),
        hrApi.getAllAttendance({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setTodayStatus(todayRes?.data || null);
      setMyAttendance(Array.isArray(myRes?.data) ? myRes.data : []);
      setCompanyAttendance(Array.isArray(allRes?.data) ? allRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await hrApi.checkIn();
      await fetchAttendance();
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
      await fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = Boolean(todayStatus?.check_in);
  const isCheckedOut = Boolean(todayStatus?.check_out);

  return (
    <div className="space-y-6">
      {/* Attendance Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⏰</span> Time & Attendance Tracking
          </h2>
          <p className="text-xs text-[#9B9DA3]">Daily biometric time clocking, shift logs, and workforce presence records</p>
        </div>

        <div className="flex items-center gap-3">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-2 shadow-md shadow-[#C9A84C]/20"
            >
              <span>▶</span> Check In Now
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#DC2626]/20 border border-[#DC2626]/50 hover:bg-[#DC2626]/30 text-[#F87171] font-semibold text-xs rounded-lg transition-all flex items-center gap-2"
            >
              <span>⏹</span> Check Out
            </button>
          ) : (
            <span className="px-3 py-1.5 text-xs rounded-md bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
              Shift Finished
            </span>
          )}

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'my'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              My Attendance
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'company'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Team Logs ({companyAttendance.length})
            </button>
          </div>
        </div>
      </div>

      {/* Live Attendance & Break Tracker Card for Personal Tab */}
      {activeTab === 'my' && (
        <AttendanceTrackerCard
          onPunchChange={() => {
            fetchAttendance();
          }}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Today&apos;s Status</span>
          <p className="text-lg font-bold text-white">{isCheckedIn ? (isCheckedOut ? 'Completed' : 'Clocked In') : 'Not Started'}</p>
          <p className="text-xs text-[#16A34A]">{todayStatus?.check_in ? `In at ${todayStatus.check_in}` : '—'}</p>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Check-Out Time</span>
          <p className="text-lg font-bold text-white">{todayStatus?.check_out || 'Pending'}</p>
          <p className="text-xs text-[#9B9DA3]">{todayStatus?.check_out ? 'Shift concluded' : 'Awaiting end of shift'}</p>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Total Shift Records</span>
          <p className="text-lg font-bold text-[#EDB940]">{activeTab === 'my' ? myAttendance.length : companyAttendance.length} Logs</p>
          <p className="text-xs text-[#9B9DA3]">Synchronized with FastAPI</p>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                {activeTab === 'company' && <th className="px-5 py-3.5">Employee ID</th>}
                <th className="px-5 py-3.5">Check-In</th>
                <th className="px-5 py-3.5">Check-Out</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272B35] text-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                    Loading attendance entries...
                  </td>
                </tr>
              ) : (activeTab === 'my' ? myAttendance : companyAttendance).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                (activeTab === 'my' ? myAttendance : companyAttendance).map((att) => (
                  <tr key={att.id} className="hover:bg-[#1A1E24] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#C9A84C] font-semibold">{att.date}</td>
                    {activeTab === 'company' && (
                      <td className="px-5 py-3.5 font-mono text-xs text-[#9B9DA3]">
                        {att.employee_id ? String(att.employee_id).substring(0, 8) : '—'}
                      </td>
                    )}
                    <td className="px-5 py-3.5">{att.check_in || '—'}</td>
                    <td className="px-5 py-3.5">{att.check_out || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                        {att.status || 'present'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
