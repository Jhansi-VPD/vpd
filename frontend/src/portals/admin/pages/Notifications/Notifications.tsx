import React from 'react';

export const Notifications: React.FC = () => {
  const alerts = [
    { id: '1', title: 'Supabase Replication Lag Nominal', time: '10 mins ago', type: 'info' },
    { id: '2', title: 'New Employee Profile Provisioned: Fullstack Developer', time: '1 hour ago', type: 'success' },
    { id: '3', title: 'Invoice INV-2026-081 Settled via Wire Transfer', time: '3 hours ago', type: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">System Notification Hub</h2>
        <p className="text-xs text-zinc-400">Critical operational alerts and compliance notifications</p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 bg-[#121214] border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-200">{a.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{a.time}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">Logged</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;

