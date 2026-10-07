import React from 'react';
import DataTable from '../../../../shared/components/DataTable';

export const Activities: React.FC = () => {
  const acts = [
    { id: '1', type: 'Product Demo', lead: 'OmniChain Global', rep: 'Sales Lead', date: '2026-10-06 14:00', outcome: 'Positive - RFP Requested' },
    { id: '2', type: 'Discovery Call', lead: 'Pacific Logistics', rep: 'Account Exec', date: '2026-10-05 11:30', outcome: 'Qualified' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Sales Outreach & Activities</h2>
        <p className="text-xs text-zinc-400">Calls, presentations, and interactive client engagement history</p>
      </div>
      <DataTable
        data={acts}
        columns={[
          { header: 'Activity Type', accessor: 'type' },
          { header: 'Account / Lead', accessor: 'lead' },
          { header: 'Sales Rep', accessor: 'rep' },
          { header: 'Logged Time', accessor: 'date' },
          { header: 'Outcome', accessor: 'outcome' },
        ]}
      />
    </div>
  );
};

export default Activities;
