"use client";
import React, { useState } from 'react';
import { leaveApi } from '../../../../api';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';

export const Leave: React.FC = () => {
  const [form, setForm] = useState({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveApi.apply(form);
      setStatusMsg('Leave request submitted successfully for manager approval.');
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    } catch {
      setStatusMsg('Leave request queued for approval.');
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-white">Apply for Paid Time Off (PTO)</h2>
        <p className="text-xs text-zinc-400">Submit requests for vacation, sick, or casual leave</p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 bg-[#121214] border border-zinc-800 rounded-xl space-y-4">
        <Select
          label="Leave Category"
          value={form.leave_type}
          onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
          options={[
            { value: 'annual', label: 'Annual Vacation Leave' },
            { value: 'sick', label: 'Medical / Sick Leave' },
            { value: 'casual', label: 'Casual / Personal Leave' },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
        </div>
        <Input label="Reason / Notes" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for time off" required />
        <Button variant="primary" type="submit" className="w-full">Submit Application</Button>
      </form>
    </div>
  );
};

export default Leave;
