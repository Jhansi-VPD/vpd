import React from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const Candidates: React.FC = () => {
  const list = [
    { id: '1', name: 'Alex Mercer', role: 'Fullstack React/Python', stage: 'Technical Interview', rating: '4.8/5' },
    { id: '2', name: 'Samantha Vance', role: 'Solutions Architect', stage: 'Offer Stage', rating: '4.9/5' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Recruitment Candidates</h2>
        <p className="text-xs text-zinc-400">Applicant tracking, assessments, and pipeline progression</p>
      </div>
      <DataTable
        data={list}
        columns={[
          { header: 'Applicant', accessor: 'name' },
          { header: 'Target Role', accessor: 'role' },
          { header: 'Stage', accessor: (row) => <StatusBadge status={row.stage} variant="warning" /> },
          { header: 'Evaluation Score', accessor: 'rating' },
        ]}
      />
    </div>
  );
};

export default Candidates;
