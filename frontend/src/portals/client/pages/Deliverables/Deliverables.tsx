import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Deliverables: React.FC = () => {
  const items = [
    { id: '1', title: 'Production Docker Cluster & Terraform Modules', date: '2026-10-01', status: 'approved' },
    { id: '2', title: 'OpenAPI Documentation & Client SDK', date: '2026-10-05', status: 'approved' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">SOW Deliverables & Artifacts</h2>
        <p className="text-xs text-zinc-400">Formal sign-off register on technical deliverables</p>
      </div>
      <DataTable
        data={items}
        columns={[
          { header: 'Deliverable Title', accessor: 'title' },
          { header: 'Handover Date', accessor: 'date' },
          { header: 'Sign-off Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Deliverables;
