import React, { useState } from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';

export const Support: React.FC = () => {
  const [tickets, setTickets] = useState([
    { id: '1', number: 'TKT-991', subject: 'Whitelisting IP ranges for webhook ingress', priority: 'medium', status: 'resolved' },
    { id: '2', number: 'TKT-992', subject: 'Inquiry regarding Q1-2027 cloud expansion scope', priority: 'low', status: 'open' },
  ]);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;
    setTickets([{ id: String(Date.now()), number: `TKT-${Math.floor(Math.random()*900+100)}`, subject, priority: 'medium', status: 'open' }, ...tickets]);
    setSubject('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Dedicated Support & SLA Center</h2>
          <p className="text-xs text-zinc-400">Enterprise support tickets and engineering assistance</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>+ Open Support Ticket</Button>
      </div>

      <DataTable
        data={tickets}
        columns={[
          { header: 'Ticket Number', accessor: 'number' },
          { header: 'Subject', accessor: 'subject' },
          { header: 'Priority', accessor: (row) => <StatusBadge status={row.priority} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Open Support Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Subject / Issue Summary" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Submit Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Support;
