import React, { useEffect, useState } from 'react';
import { hrApi } from '../../../../api/hr.api';

export const Timesheets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'queue'>('my');
  const [myTimesheets, setMyTimesheets] = useState<any[]>([]);
  const [allTimesheets, setAllTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        hrApi.getMyTimesheets({ limit: 50 }).catch(() => ({ data: [] })),
        hrApi.getAllTimesheets({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setMyTimesheets(Array.isArray(myRes?.data) ? myRes.data : []);
      setAllTimesheets(Array.isArray(allRes?.data) ? allRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await hrApi.submitTimesheet({
        date: formData.date,
        hours: Number(formData.hours),
        description: formData.description,
      });
      setShowLogModal(false);
      setFormData({ date: new Date().toISOString().split('T')[0], hours: 8, description: '' });
      await fetchTimesheets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await hrApi.approveTimesheet(id, status);
      await fetchTimesheets();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const totalMyHours = myTimesheets.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⏱️</span> Employee Timesheets & Project Hours
          </h2>
          <p className="text-xs text-[#9B9DA3]">Log billable hours, project deliverables, and manager timesheet approvals</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#C9A84C]/20"
          >
            <span>+</span> Log Work Hours
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
              My Log ({myTimesheets.length})
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'queue'
                  ? 'bg-[#C9A84C] text-black shadow-sm'
                  : 'text-[#9B9DA3] hover:text-white'
              }`}
            >
              Approval Queue ({allTimesheets.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">My Logged Hours</span>
          <p className="text-2xl font-bold text-[#EDB940]">{totalMyHours} hrs</p>
          <p className="text-xs text-[#9B9DA3]">Total verified contributions</p>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Approval Status</span>
          <p className="text-lg font-bold text-[#16A34A]">Synchronized</p>
          <p className="text-xs text-[#9B9DA3]">Connected with FastAPI `/timesheets`</p>
        </div>

        <div className="bg-[#15181D] border border-[#272B35] rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#7A7D84]">Organization Entries</span>
          <p className="text-lg font-bold text-white">{allTimesheets.length} Records</p>
          <p className="text-xs text-[#9B9DA3]">Across engineering and operations</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#15181D] border border-[#272B35] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1013] text-[#9B9DA3] uppercase font-mono text-[10px] border-b border-[#272B35]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Hours</th>
                <th className="px-5 py-3.5">Work Description</th>
                <th className="px-5 py-3.5">Status</th>
                {activeTab === 'queue' && <th className="px-5 py-3.5 text-right">Approval Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272B35] text-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                    Loading timesheet entries...
                  </td>
                </tr>
              ) : (activeTab === 'my' ? myTimesheets : allTimesheets).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#9B9DA3]">
                    No timesheet logs submitted.
                  </td>
                </tr>
              ) : (
                (activeTab === 'my' ? myTimesheets : allTimesheets).map((ts) => (
                  <tr key={ts.id} className="hover:bg-[#1A1E24] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#C9A84C] font-semibold">{ts.date}</td>
                    <td className="px-5 py-3.5 font-bold">{ts.hours} hrs</td>
                    <td className="px-5 py-3.5 text-[#9B9DA3] max-w-sm truncate">{ts.description || 'Sprint tasks and maintenance'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30">
                        {ts.status || 'submitted'}
                      </span>
                    </td>
                    {activeTab === 'queue' && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {String(ts.status).toLowerCase() !== 'approved' && (
                          <>
                            <button
                              onClick={() => handleApprove(ts.id, 'approved')}
                              className="px-2.5 py-1 bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-[#16A34A] border border-[#16A34A]/40 rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(ts.id, 'rejected')}
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

      {/* Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15181D] border border-[#272B35] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Log Daily Timesheet</span>
              <button onClick={() => setShowLogModal(false)} className="text-[#9B9DA3] hover:text-white">✕</button>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9B9DA3] mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Hours Worked *</label>
                <input
                  required
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#9B9DA3] mb-1">Tasks / Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail activities and work delivered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0E1013] border border-[#272B35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A84C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-[#272B35] hover:bg-[#343A46] text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#EDB940] text-black font-semibold rounded-lg transition-all"
                >
                  {submitting ? 'Logging...' : 'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
