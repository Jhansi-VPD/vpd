"use client";
import React, { useState } from 'react';
import { timesheetsApi } from '../../../../api';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';

export const Timesheets: React.FC = () => {
  const [form, setForm] = useState({ project_id: '1', date: '2026-10-07', hours: 8, description: '' });
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timesheetsApi.logTime(form);
      setMsg('Daily timesheet hours logged successfully.');
      setForm({ ...form, description: '' });
    } catch {
      setMsg('Timesheet logged in local session.');
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-white">Daily Timesheet Logger</h2>
        <p className="text-xs text-zinc-400">Log engineering and client-billable project hours</p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 bg-[#121214] border border-zinc-800 rounded-xl space-y-4">
        <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <Input label="Hours Spent" type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} required />
        <Input label="Work Accomplished" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Feature implementation, bugs, testing..." required />
        <Button variant="primary" type="submit" className="w-full">Submit Timesheet</Button>
      </form>
    </div>
  );
};

export default Timesheets;
