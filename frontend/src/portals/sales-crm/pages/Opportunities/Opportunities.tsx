import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Opportunities: React.FC = () => {
  const opps = [
    { id: '1', title: 'Enterprise Digital Transformation Suite', account: 'Global Retailers Inc', value: '$350,000', probability: '80%', closeDate: '2026-11-15' },
    { id: '2', title: 'Managed Cloud Infrastructure Migrations', account: 'Apex Health Systems', value: '$220,000', probability: '60%', closeDate: '2026-12-01' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Commercial Opportunities</h2>
        <p className="text-xs text-zinc-400">High-probability qualified transactions progressing through sales stages</p>
      </div>
      <DataTable
        data={opps}
        columns={[
          { header: 'Opportunity Title', accessor: 'title' },
          { header: 'Target Account', accessor: 'account' },
          { header: 'Deal Value', accessor: 'value' },
          { header: 'Probability', accessor: (row) => <StatusBadge status={row.probability} variant="gold" /> },
          { header: 'Target Closing', accessor: 'closeDate' },
        ]}
      />
    </div>
  );
};

export default Opportunities;
