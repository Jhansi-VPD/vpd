import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Proposals: React.FC = () => {
  const proposals = [
    { id: '1', number: 'RFP-2026-041', title: 'Comprehensive DevOps Modernization', client: 'Apex Health Systems', value: '$180,000', status: 'sent', validUntil: '2026-10-31' },
    { id: '2', number: 'RFP-2026-042', title: 'AI-Driven Logistics Routing Engine', client: 'OmniChain Global', value: '$95,000', status: 'approved', validUntil: '2026-11-15' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Commercial Proposals & RFPs</h2>
        <p className="text-xs text-zinc-400">Statement of Work (SOW) submissions and price quotes</p>
      </div>
      <DataTable
        data={proposals}
        columns={[
          { header: 'Proposal Ref', accessor: 'number' },
          { header: 'Project Scope', accessor: 'title' },
          { header: 'Client', accessor: 'client' },
          { header: 'Proposed Total', accessor: 'value' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Proposals;
