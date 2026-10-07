import React, { useEffect, useState } from 'react';
import { timesheetsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

export const Timesheets: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    description: '',
    project_name: 'Enterprise Project',
  });

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const res = await timesheetsApi.getAll();
      setEntries(res.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheets();
  }, []);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await timesheetsApi.logTime(form);
    } catch {
      // fallback local update
    }
    const newEntry = {
      id: Date.now().toString(),
      date: form.date,
      hours: Number(form.hours),
      description: form.description,
      project_name: form.project_name,
      status: 'submitted',
    };
    setEntries((prev) => [newEntry, ...prev]);
    setShowModal(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      hours: 8,
      description: '',
      project_name: 'Enterprise Project',
    });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Workforce Timesheets</h2>
          <p className="text-xs text-zinc-400">Billable hours logged against enterprise contracts</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + Log Hours
        </Button>
      </div>

      <DataTable
        loading={loading}
        data={entries}
        columns={[
          { header: 'Date', accessor: 'date' },
          { header: 'Project', accessor: (row) => row.project_name || 'Enterprise Project' },
          { header: 'Hours', accessor: (row) => `${row.hours || 0} hrs` },
          { header: 'Description', accessor: 'description' },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status || 'submitted'} /> },
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Log Work Hours</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>
            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={form.project_name}
                  onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Work Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details of tasks worked on..."
                  className="w-full px-3 py-2 bg-[#18181b] border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting}>Submit Log Hours</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;

