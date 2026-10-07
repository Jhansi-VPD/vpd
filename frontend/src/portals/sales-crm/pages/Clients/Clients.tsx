import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Clients: React.FC = () => {
  const clients = [
    { id: '1', name: 'Apex Health Systems', industry: 'Healthcare & Life Sciences', rep: 'VP Sales', status: 'active', revenue: '$340,000' },
    { id: '2', name: 'EuroFintech SA', industry: 'Financial Services', rep: 'Account Exec', status: 'active', revenue: '$180,000' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Client Accounts Directory</h2>
        <p className="text-xs text-zinc-400">Institutional relationship profiles, account tiers, and ARR contribution</p>
      </div>
      <DataTable
        data={clients}
        columns={[
          { header: 'Account Name', accessor: 'name' },
          { header: 'Industry Vertical', accessor: 'industry' },
          { header: 'Account Owner', accessor: 'rep' },
          { header: 'Total Contract Value', accessor: 'revenue' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Clients;
