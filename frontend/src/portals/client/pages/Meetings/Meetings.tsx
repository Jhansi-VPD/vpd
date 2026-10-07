import React from 'react';
import DataTable from '../../../../shared/components/DataTable';

export const Meetings: React.FC = () => {
  const list = [
    { id: '1', title: 'Sprint 14 Review & Stakeholder Demo', date: 'Oct 14, 2026 10:00 AM', link: 'Google Meet / Enterprise Link' },
    { id: '2', title: 'Monthly Architectural Roadmap Alignment', date: 'Oct 28, 2026 02:00 PM', link: 'Google Meet / Enterprise Link' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Scheduled Executive Meetings</h2>
        <p className="text-xs text-zinc-400">Quarterly governance reviews, sprint demos, and partner touchpoints</p>
      </div>
      <DataTable
        data={list}
        columns={[
          { header: 'Meeting Topic', accessor: 'title' },
          { header: 'Scheduled Time', accessor: 'date' },
          { header: 'Conference Access', accessor: 'link' },
        ]}
      />
    </div>
  );
};

export default Meetings;
