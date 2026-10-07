import React from 'react';
import DataTable from '../../../../shared/components/DataTable';

export const Interviews: React.FC = () => {
  const schedule = [
    { id: '1', candidate: 'Alex Mercer', interviewer: 'Lead Architect', time: 'Today, 3:00 PM', type: 'System Architecture' },
    { id: '2', candidate: 'Samantha Vance', interviewer: 'VP of Engineering', time: 'Tomorrow, 11:00 AM', type: 'Executive Final' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Interview Schedules</h2>
        <p className="text-xs text-zinc-400">Upcoming panel interviews and technical assessment calendar</p>
      </div>
      <DataTable
        data={schedule}
        columns={[
          { header: 'Candidate', accessor: 'candidate' },
          { header: 'Interviewer', accessor: 'interviewer' },
          { header: 'Schedule', accessor: 'time' },
          { header: 'Format', accessor: 'type' },
        ]}
      />
    </div>
  );
};

export default Interviews;
