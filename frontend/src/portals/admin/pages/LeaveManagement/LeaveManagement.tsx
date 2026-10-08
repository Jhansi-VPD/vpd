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

  return (
    <>
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
  );
}
export default LeaveManagement;

