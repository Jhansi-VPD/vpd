import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Milestones: React.FC = () => {
  const milestones = [
    { id: '1', title: 'Architecture Signoff & Database Schema', project: 'OmniChain Core API', due: '2026-10-15', status: 'completed' },
    { id: '2', title: 'Supabase Data Migration & Dual Writes', project: 'OmniChain Core API', due: '2026-10-28', status: 'in_progress' },
    { id: '3', title: 'End-to-End Penetration Test & Security Audit', project: 'OmniChain Core API', due: '2026-11-15', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Project Deliverable Milestones</h2>
        <p className="text-xs text-zinc-400">Formal sprint phases, client acceptance gates, and delivery commitments</p>
      </div>
      <DataTable
        data={milestones}
        columns={[
          { header: 'Milestone Title', accessor: 'title' },
          { header: 'Project', accessor: 'project' },
          { header: 'Target Delivery', accessor: 'due' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Milestones;
