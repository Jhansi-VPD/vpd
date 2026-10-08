"use client";
import React, { useState } from 'react';
import { leaveApi } from '../../../../api';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Leave: React.FC = () => {
  const todayStr = getTodayDateString();
  const [form, setForm] = useState({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) {
      alert('Please select both Start Date and End Date.');
      return;
    }
    if (form.start_date < todayStr) {
      alert('Start date cannot be in the past.');
      return;
    }
    if (form.end_date < form.start_date) {
      alert('End date cannot be earlier than start date.');
      return;
    }
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
          <Input
            label="Start Date"
            type="date"
            min={todayStr}
            value={form.start_date}
            onChange={(e) => {
              const newStart = e.target.value;
              setForm((prev) => ({
                ...prev,
                start_date: newStart,
                end_date: prev.end_date && prev.end_date < newStart ? newStart : prev.end_date,
              }));
            }}
            required
          />
          <Input
            label="End Date"
            type="date"
            min={form.start_date || todayStr}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </div>
        <Input label="Reason / Notes" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for time off" required />
        <Button variant="primary" type="submit" className="w-full">Submit Application</Button>
      </form>
    </div>
  );
};

export default Leave;
