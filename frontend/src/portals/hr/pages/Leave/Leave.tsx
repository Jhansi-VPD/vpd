import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Leave: React.FC = () => {
  const todayStr = getTodayDateString();
  const [activeTab, setActiveTab] = useState<'my' | 'queue'>('my');
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        hrApi.getMyLeaves().catch(() => ({ data: [] })),
        hrApi.getAllLeaves({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setMyLeaves(Array.isArray(myRes?.data) ? myRes.data : []);
      setAllLeaves(Array.isArray(allRes?.data) ? allRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      alert('Please select both Start Date and End Date.');
      return;
    }
    if (formData.start_date < todayStr) {
      alert('Start date cannot be in the past.');
      return;
    }
    if (formData.end_date < formData.start_date) {
      alert('End date cannot be earlier than start date.');
      return;
    }
    setSubmitting(true);
    try {
      await hrApi.applyLeave(formData);
      setShowApplyModal(false);
      setFormData({ type: 'casual', start_date: '', end_date: '', reason: '' });
      await fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReject = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      await hrApi.approveLeave(leaveId, status);
      await fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === 'approved') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">Approved</span>;
    }
    if (s === 'rejected') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#DC2626]/20 text-[#F87171] border border-[#DC2626]/30">Rejected</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/30">Pending Approval</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📅</span> Leave & Time Off Management
          </h2>
          <p className="text-xs text-[#9B9DA3]">Request personal/sick leave, inspect allowances, and review company approvals</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
          >
            <span>+</span> Apply for Leave
          </button>

          <div className="bg-[#15181D] p-1 rounded-lg border border-[#272B35] flex">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'my'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              My Leaves ({myLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'queue'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              HR Approval Queue ({allLeaves.length})
            </button>
          </div>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Paid Annual</span>
          <p className="text-xl font-bold text-white">18 Days</p>
          <div className="w-full bg-[#0E1013] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#16A34A] h-full w-[70%]" />
          </div>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Casual Leave</span>
          <p className="text-xl font-bold text-white">10 Days</p>
          <div className="w-full bg-[#0E1013] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#EDB940] h-full w-[50%]" />
          </div>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Sick Leave</span>
          <p className="text-xl font-bold text-white">12 Days</p>
          <div className="w-full bg-[#0E1013] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#38BDF8] h-full w-[90%]" />
          </div>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Compensatory / Other</span>
          <p className="text-xl font-bold text-white">5 Days</p>
          <div className="w-full bg-[#0E1013] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#C9A84C] h-full w-[100%]" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
              <tr>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Start Date</th>
                <th className="px-5 py-3.5">End Date</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                {activeTab === 'queue' && <th className="px-5 py-3.5 text-right">Approval Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272B35] text-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                    Loading leave records...
                  </td>
                </tr>
              ) : (activeTab === 'my' ? myLeaves : allLeaves).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#9B9DA3]">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                (activeTab === 'my' ? myLeaves : allLeaves).map((lv) => (
                  <tr key={lv.id} className="hover:bg-[#1A1E24] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#EDB940] capitalize">{lv.type}</td>
                    <td className="px-5 py-3.5 font-mono">{lv.start_date}</td>
                    <td className="px-5 py-3.5 font-mono">{lv.end_date}</td>
                    <td className="px-5 py-3.5 text-[#9B9DA3] max-w-xs truncate">{lv.reason || 'Personal necessity'}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(lv.status)}</td>
                    {activeTab === 'queue' && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {String(lv.status).toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(lv.id, 'approved')}
                              className="px-2.5 py-1 bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] border border-[#16A34A]/40 rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveReject(lv.id, 'rejected')}
                              className="px-2.5 py-1 bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-[#F87171] border border-[#DC2626]/40 rounded text-[11px] font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Apply for Leave</span>
              <button onClick={() => setShowApplyModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Leave Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Paid Annual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9B9DA3] mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    min={todayStr}
                    value={formData.start_date}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        start_date: newStart,
                        end_date: prev.end_date && prev.end_date < newStart ? newStart : prev.end_date,
                      }));
                    }}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C] [color-scheme:dark] cursor-pointer"
                  />
                  {formData.start_date && formData.start_date < todayStr && (
                    <p className="text-[10px] text-red-400 mt-1">Cannot select past dates</p>
                  )}
                </div>
                <div>
                  <label className="block text-[#9B9DA3] mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    min={formData.start_date || todayStr}
                    value={formData.end_date}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C] [color-scheme:dark] cursor-pointer"
                  />
                  {formData.end_date && formData.start_date && formData.end_date < formData.start_date && (
                    <p className="text-[10px] text-red-400 mt-1">Must be on or after start date</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Reason for Absence</label>
                <textarea
                  rows={3}
                  placeholder="Provide context for manager approval..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
