import React from 'react';
import DataTable from '../../../../shared/components/DataTable';

export const AuditLogs: React.FC = () => {
  const sampleLogs = [
{ id: '1', timestamp: '2026-10-07 10:26:40', action: 'POST_auth_login', user: 'admin@vpdtechnologies.com', ip: '127.0.0.1', status: '200 OK' },
  { id: '2', timestamp: '2026-10-07 10:14:12', action: 'UPDATE_users_role', user: 'admin@vpdtechnologies.com', ip: '127.0.0.1', status: '200 OK' },
    { id: '3', timestamp: '2026-10-07 09:45:00', action: 'POST_attendance_checkin', user: 'employee@vpdtechnologies.com', ip: '192.168.1.14', status: '201 Created' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Immutable Security Audit Logs</h2>
        <p className="text-xs text-zinc-400">SOC 2 compliant request records, IP origins, and user access trails</p>
      </div>

      <DataTable
        data={sampleLogs}
        columns={[
          { header: 'Timestamp', accessor: 'timestamp' },
          { header: 'Action Event', accessor: (row) => <code className="text-xs text-[#d4af37]">{row.action}</code> },
          { header: 'Principal User', accessor: 'user' },
          { header: 'IP Origin', accessor: 'ip' },
          { header: 'Result', accessor: (row) => <span className="text-xs font-semibold text-emerald-400">{row.status}</span> },
        ]}
      />
    </div>
  );
};

export default AuditLogs;
