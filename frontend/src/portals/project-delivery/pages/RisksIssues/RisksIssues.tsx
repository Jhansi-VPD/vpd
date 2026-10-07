import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const RisksIssues: React.FC = () => {
  const risks = [
    { id: '1', title: 'Upstream Third-Party Payment Gateway Latency', severity: 'medium', mitigation: 'Implemented circuit breakers and fallback queues', status: 'open' },
    { id: '2', title: 'Supabase Direct Connection IPv4 Constraint', severity: 'high', mitigation: 'Resolved: Routed through IPv4 Session Pooler with SSL', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Project Risks & Issues Matrix</h2>
        <p className="text-xs text-zinc-400">Technical impediment log, architectural risks, and resolution tracking</p>
      </div>
      <DataTable
        data={risks}
        columns={[
          { header: 'Identified Issue / Risk', accessor: 'title' },
          { header: 'Severity', accessor: (row) => <StatusBadge status={row.severity} /> },
          { header: 'Mitigation Strategy', accessor: 'mitigation' },
          { header: 'Resolution Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default RisksIssues;
