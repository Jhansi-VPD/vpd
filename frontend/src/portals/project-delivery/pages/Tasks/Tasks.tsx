import React, { useState } from 'react';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

export const Tasks: React.FC = () => {
  const [board, setBoard] = useState({
    todo: [
      { id: '1', title: 'Implement JWT refresh rotation in FastAPI', points: '5 SP', priority: 'high' },
      { id: '2', title: 'Audit Supabase transaction pooler timeouts', points: '3 SP', priority: 'urgent' },
    ],
    in_progress: [
      { id: '3', title: 'Connect Client Portal invoices endpoint', points: '8 SP', priority: 'medium' },
      { id: '4', title: 'Refactor role-based routing layout guards', points: '5 SP', priority: 'high' },
    ],
    done: [
      { id: '5', title: 'Setup Argon2id user credential synchronization', points: '3 SP', priority: 'medium' },
      { id: '6', title: 'Establish global dark theme and gold accents', points: '2 SP', priority: 'low' },
    ],
  });

  const columns = [
    { key: 'todo', title: 'To Do Backlog' },
    { key: 'in_progress', title: 'In Active Development' },
    { key: 'done', title: 'Verified & Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sprint Execution Kanban Board</h2>
          <p className="text-xs text-zinc-400">Live task flow, engineering tickets, and velocity monitoring</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('New ticket created!')}>
          + Create Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.key} className="bg-[#121214] border border-zinc-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-200">{col.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {(board as any)[col.key].length}
              </span>
            </div>
            <div className="space-y-3 flex-1">
              {(board as any)[col.key].map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-[#d4af37] transition-all cursor-pointer"
                >
                  <p className="text-xs font-medium text-zinc-100">{item.title}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-400 font-mono">{item.points}</span>
                    <StatusBadge status={item.priority} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
