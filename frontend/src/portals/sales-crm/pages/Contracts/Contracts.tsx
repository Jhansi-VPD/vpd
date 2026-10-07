import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Contracts: React.FC = () => {
  const contracts = [
    { id: '1', contractId: 'CTR-2026-019', client: 'FinSecure Ltd', type: 'Annual Fixed SOW', value: '$240,000', status: 'active', signedDate: '2026-09-01' },
    { id: '2', contractId: 'CTR-2026-020', client: 'HealthPlus Corp', type: 'Time & Materials', value: '$180,000', status: 'active', signedDate: '2026-08-15' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Executed Client Contracts</h2>
        <p className="text-xs text-zinc-400">Binding Master Services Agreements and active delivery commitments</p>
      </div>
      <DataTable
        data={contracts}
        columns={[
          { header: 'Contract ID', accessor: 'contractId' },
          { header: 'Client Enterprise', accessor: 'client' },
          { header: 'Contract Model', accessor: 'type' },
          { header: 'Value', accessor: 'value' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  );
};

export default Contracts;
