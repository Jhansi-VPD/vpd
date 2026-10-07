import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const FollowUps: React.FC = () => {
  const tasks = [
    { id: '1', contact: 'Marcus Sterling', action: 'Send customized SOW draft', due: 'Tomorrow 5:00 PM', priority: 'high' },
    { id: '2', contact: 'Claire Dupont', action: 'Schedule technical deep-dive', due: 'Oct 12, 2026', priority: 'medium' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Scheduled Follow-Ups</h2>
        <p className="text-xs text-zinc-400">Action items, reminders, and pending touchpoints</p>
      </div>
      <DataTable
        data={tasks}
        columns={[
          { header: 'Contact', accessor: 'contact' },
          { header: 'Action Required', accessor: 'action' },
          { header: 'Due Date', accessor: 'due' },
          { header: 'Urgency', accessor: (row) => <StatusBadge status={row.priority} /> },
        ]}
      />
    </div>
  );
};

export default FollowUps;
