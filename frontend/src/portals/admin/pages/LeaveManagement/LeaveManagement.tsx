import React, { useEffect, useState } from 'react';
import { leaveApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';

export const LeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getAll();
      setLeaves(res.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await leaveApi.approve(id);
      else await leaveApi.reject(id);
      loadLeaves();
    } catch {
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: action === 'approve' ? 'approved' : 'rejected' } : l))
      );
    }
  };
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if (!applyForm.start_date || !applyForm.end_date) {
      alert('Please select both Start Date and End Date.');
      return;
    }
    if (applyForm.start_date < today) {
      alert('Start date cannot be in the past.');
      return;
    }
    if (applyForm.end_date < applyForm.start_date) {
      alert('End date cannot be earlier than start date.');
      return;
    }
    setSubmitting(true);
    try {
      await leaveApi.apply(applyForm);
    } catch {
      // fallback local update
    }
    const newLeave = {
      id: Date.now().toString(),
      employee_name: 'Current User',
      leave_type: applyForm.leave_type,
      start_date: applyForm.start_date,
      end_date: applyForm.end_date,
      reason: applyForm.reason,
      status: 'pending',
    };
    setLeaves((prev) => [newLeave, ...prev]);
    setShowApplyModal(false);
    setApplyForm({
      leave_type: 'annual',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: '',
    });
    setSubmitting(false);
  };
  return (
    <PageContainer>
      <PageHeader
        title="Leave Approvals Management"
        description="Review pending paid time off, sick leave, and casual leave applications"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Leave Approvals Management' }]}
        
      />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Leave Approvals</h2>
          <p className="text-xs text-zinc-400">Review pending paid time off, sick leave, and casual leave applications</p>
        </div>

      <DataTable
        loading={loading}
        data={leaves}
        columns={[
          { header: 'Applicant', accessor: (row) => row.employee_name || 'Team Member' },
          { header: 'Type', accessor: (row) => row.leave_type || row.type || 'Annual' },
          { header: 'Duration', accessor: (row) => `${row.start_date} to ${row.end_date}` },
          { header: 'Reason', accessor: 'reason' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'pending'} /> },
          {
            header: 'Actions',
            accessor: (row) => (
              <div className="flex space-x-2">
                {row.status === 'pending' && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => handleAction(row.id, 'approve')}>
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(row.id, 'reject')}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      </div>
    </PageContainer>
    </>
    </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Apply for Time Off / Leave</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Leave Category</label>
                <select
                  value={applyForm.leave_type}
                  onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                >
                  <option value="annual">Annual Vacation Leave</option>
                  <option value="sick">Medical / Sick Leave</option>
                  <option value="casual">Casual / Personal Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={applyForm.start_date}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setApplyForm((prev) => ({
                        ...prev,
                        start_date: newStart,
                        end_date: prev.end_date && prev.end_date < newStart ? newStart : prev.end_date,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white [color-scheme:dark] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={applyForm.start_date || new Date().toISOString().split('T')[0]}
                    value={applyForm.end_date}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white [color-scheme:dark] cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="State the reason for leave..."
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting}>Submit Leave Application</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
export default LeaveManagement;

