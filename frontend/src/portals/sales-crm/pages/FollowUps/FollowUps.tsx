"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon, KpiCard, ActionToast } from '../../../../shared/components';

interface FollowUpItem {
  id: string;
  account: string;
  contact: string;
  action: string;
  category: 'Contract Signature' | 'SOW Scoping' | 'Discovery Follow-up' | 'Demo Prep' | 'Payment Schedule';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  assignedRep: string;
  completed: boolean;
  notes: string;
}

export const FollowUps: React.FC = () => {
  const [tasks, setTasks] = useState<FollowUpItem[]>([
    {
      id: 'f-1',
      account: 'EuroFintech SA',
      contact: 'Claire Dupont',
      action: 'Send signed counter-copy of Contract CTR-2026-019',
      category: 'Contract Signature',
      dueDate: 'Today, 5:00 PM',
      priority: 'high',
      assignedRep: 'Sarah Connor',
      completed: false,
      notes: 'Ensure client portal login link and welcome documentation are included in email dispatch.',
    },
    {
      id: 'f-2',
      account: 'Pacific Logistics Corp',
      contact: 'Marcus Sterling',
      action: 'Deliver technical scoping SOW and API documentation',
      category: 'SOW Scoping',
      dueDate: 'Tomorrow, 11:00 AM',
      priority: 'high',
      assignedRep: 'Account Exec',
      completed: false,
      notes: 'Attach fleet telemetry specs, AWS IoT data flows, and milestone schedule.',
    },
    {
      id: 'f-3',
      account: 'BioHealth Analytics',
      contact: 'Sophia Patel',
      action: 'Review HIPAA clinical compliance questionnaire',
      category: 'Discovery Follow-up',
      dueDate: 'Oct 12, 2026, 2:00 PM',
      priority: 'medium',
      assignedRep: 'Sarah Connor',
      completed: false,
      notes: 'Consult security architect before submitting official response to VP of Compliance.',
    },
    {
      id: 'f-4',
      account: 'Apex Health Systems',
      contact: 'Dr. Sarah Jenkins',
      action: 'Confirm kick-off workshop date with PM delivery team',
      category: 'Demo Prep',
      dueDate: 'Oct 14, 2026, 10:00 AM',
      priority: 'low',
      assignedRep: 'Michael Scott',
      completed: true,
      notes: 'Kickoff meeting set. Project Manager already assigned inside Delivery Hub.',
    },
    {
      id: 'f-5',
      account: 'Global Retailers Inc',
      contact: 'Jonathan Miller',
      action: 'Follow up on Enterprise Transformation proposal review',
      category: 'Contract Signature',
      dueDate: 'Today, 3:30 PM',
      priority: 'high',
      assignedRep: 'Sales Lead',
      completed: false,
      notes: 'Follow up on procurement signoff and discount schedule.',
    },
  ]);

  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high' | 'today' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowUpItem | null>(null);

  // Create Form fields
  const [account, setAccount] = useState('');
  const [contact, setContact] = useState('');
  const [action, setAction] = useState('');
  const [category, setCategory] = useState<FollowUpItem['category']>('Contract Signature');
  const [dueDate, setDueDate] = useState('Tomorrow, 3:00 PM');
  const [priority, setPriority] = useState<FollowUpItem['priority']>('medium');
  const [assignedRep, setAssignedRep] = useState('Sarah Connor');
  const [notes, setNotes] = useState('');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await leadsApi.getAll({ limit: 30 });
        if (res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items || [];
          setLeads(items);
          if (items.length > 0 && !account) {
            setAccount(items[0].company || items[0].contact_name);
            setContact(items[0].contact_name);
          }
        }
      } catch {
        // fallback
      }
    }
    loadLeads();
  }, []);

  const toggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = !t.completed;
          notify(updated ? `✓ Task marked as Completed!` : `Task reopened.`);
          return { ...t, completed: updated };
        }
        return t;
      })
    );
  };

  const handleSnooze = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          notify(`⏰ Follow-up postponed by 24 hours.`);
          return { ...t, dueDate: 'Postponed (+1 Day)' };
        }
        return t;
      })
    );
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    notify(`Follow-up task dismissed.`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: FollowUpItem = {
      id: `f-${Date.now()}`,
      account,
      contact: contact || 'Primary Stakeholder',
      action,
      category,
      dueDate,
      priority,
      assignedRep,
      completed: false,
      notes,
    };

    setTasks((prev) => [newItem, ...prev]);
    setCreateModalOpen(false);
    resetForm();
    notify(`✓ Scheduled follow-up item for "${account}"!`);
  };

  const resetForm = () => {
    setAction('');
    setDueDate('Tomorrow, 3:00 PM');
    setNotes('');
  };

  // KPIs
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'high' && !t.completed).length;
  const dueTodayCount = tasks.filter((t) => t.dueDate.toLowerCase().includes('today') && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const filtered = tasks.filter((t) => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (filter === 'high' && (t.priority !== 'high' || t.completed)) return false;
    if (filter === 'today' && (!t.dueDate.toLowerCase().includes('today') || t.completed)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.account.toLowerCase().includes(q) ||
        t.contact.toLowerCase().includes(q) ||
        t.action.toLowerCase().includes(q) ||
        t.assignedRep.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      <ActionToast
        message={notification}
        onClose={() => setNotification(null)}
        title="⚡ Action Item:"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Sales Follow-Ups & Reminders</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              Commercial Task Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Time-sensitive client deliverables, contract counter-signatures, SOW revisions, and executive touchpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/activities">
            <Button variant="secondary" size="sm">
              <Icon name="check" className="w-3.5 h-3.5 mr-1.5" />
              Outreach Log
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            + Add Follow-Up
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Pending Tasks"
          value={`${pendingCount} Active`}
          subtitle="Across sales pipeline"
        />
        <KpiCard
          label="Due Today"
          value={`${dueTodayCount} Urgent`}
          subtitle="Expiring by end-of-day"
          valueColor="text-amber-400"
        />
        <KpiCard
          label="High Priority"
          value={`${highPriorityCount} Critical`}
          subtitle="Immediate revenue impact"
          valueColor="text-red-400"
        />
        <KpiCard
          label="Resolved Tasks"
          value={`${completedCount} Completed`}
          subtitle="100% SLA adherence"
          valueColor="text-emerald-400"
        />
      </div>


      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-[#141414] border border-[#2A2A2A]">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'today', label: `Due Today (${dueTodayCount})` },
            { id: 'high', label: `High Priority (${highPriorityCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'all', label: `All Items (${tasks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search tasks, accounts, reps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks Table */}
      <DataTable
        data={filtered}
        emptyMessage="No follow-up items matching this filter."
        columns={[
          {
            header: 'Status',
            accessor: (row) => (
              <input
                type="checkbox"
                checked={row.completed}
                onChange={() => toggleComplete(row.id)}
                title={row.completed ? 'Mark pending' : 'Mark completed'}
                className="rounded border-zinc-700 text-[#D4AF37] focus:ring-0 cursor-pointer h-4 w-4"
              />
            ),
          },
          {
            header: 'Account & Contact',
            accessor: (row) => (
              <div>
                <div
                  className={`font-bold text-xs cursor-pointer hover:text-[#D4AF37] transition-colors ${
                    row.completed ? 'text-zinc-400 line-through' : 'text-white'
                  }`}
                  onClick={() => { setSelectedTask(row); setEditModalOpen(true); }}
                >
                  {row.account}
                </div>
                <div className="text-xs text-zinc-300 font-medium">{row.contact}</div>
              </div>
            ),
          },
          {
            header: 'Action Required',
            accessor: (row) => (
              <div>
                <div className={`text-xs ${row.completed ? 'text-zinc-400 line-through' : 'text-zinc-100 font-medium'}`}>
                  {row.action}
                </div>
                <div className="text-xs text-zinc-300 font-medium mt-0.5">
                  📁 {row.category}
                </div>
              </div>
            ),
          },
          {
            header: 'Due Deadline',
            accessor: (row) => (
              <span
                className={`text-xs font-mono font-medium ${
                  row.completed
                    ? 'text-zinc-500'
                    : row.dueDate.toLowerCase().includes('today')
                    ? 'text-amber-400 font-bold'
                    : 'text-zinc-300'
                }`}
              >
                {row.dueDate}
              </span>
            ),
          },
          {
            header: 'Priority',
            accessor: (row) => {
              if (row.priority === 'high') return <StatusBadge status="High Urgency" variant="danger" />;
              if (row.priority === 'medium') return <StatusBadge status="Medium" variant="warning" />;
              return <StatusBadge status="Normal" variant="neutral" />;
            },
          },
          {
            header: 'Assignee',
            accessor: (row) => <span className="text-xs text-zinc-300 font-medium">{row.assignedRep}</span>,
          },
          {
            header: 'Quick Actions',
            accessor: (row) => (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(row);
                    setEditModalOpen(true);
                  }}
                  className="text-[11px] py-1"
                >
                  Details
                </Button>
                {!row.completed && (
                  <button
                    onClick={() => handleSnooze(row.id)}
                    title="Snooze 24h"
                    className="p-1 px-2 text-[10px] rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                  >
                    ⏰ +1d
                  </button>
                )}
                <button
                  onClick={() => handleDelete(row.id)}
                  title="Dismiss Task"
                  className="p-1 text-zinc-500 hover:text-red-400 text-xs transition-colors rounded hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* MODAL 1: Add Follow-Up */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Schedule Sales Follow-Up Action">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Target Account / Enterprise</label>
            {leads.length > 0 ? (
              <select
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value);
                  const matched = leads.find((l) => (l.company || l.contact_name) === e.target.value);
                  if (matched) setContact(matched.contact_name);
                }}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.company || l.contact_name}>
                    {l.company || l.contact_name} ({l.contact_name})
                  </option>
                ))}
              </select>
            ) : (
              <Input placeholder="e.g. EuroFintech SA" value={account} onChange={(e) => setAccount(e.target.value)} required />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Stakeholder Contact" placeholder="e.g. Claire Dupont" value={contact} onChange={(e) => setContact(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Action Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Contract Signature">Contract Signature</option>
                <option value="SOW Scoping">SOW Scoping</option>
                <option value="Discovery Follow-up">Discovery Follow-up</option>
                <option value="Demo Prep">Demo Prep</option>
                <option value="Payment Schedule">Payment Schedule</option>
              </select>
            </div>
          </div>

          <Input label="Action Item Description" placeholder="e.g. Send counter-signed MSA and client onboarding link" value={action} onChange={(e) => setAction(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Target Due Deadline" placeholder="e.g. Today, 5:00 PM" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="high">🔴 High Urgency</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Normal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Action Notes & Context</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important instructions, attachments needed, or dependencies..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Schedule Action Item ➔</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: View / Details Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Task Details: ${selectedTask?.account || ''}`}>
        {selectedTask && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#181818] border border-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{selectedTask.account}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${selectedTask.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {selectedTask.completed ? '✓ Completed' : 'Pending Action'}
                </span>
              </div>
              <div className="text-zinc-300 text-xs font-semibold">{selectedTask.action}</div>
              <div className="text-[11px] text-zinc-400">
                Contact: <strong className="text-zinc-200">{selectedTask.contact}</strong> • Assigned to <strong className="text-zinc-200">{selectedTask.assignedRep}</strong>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Due: {selectedTask.dueDate} • Category: {selectedTask.category}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Internal Instructions & Notes</label>
              <div className="p-3 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-zinc-300 leading-relaxed text-xs">
                {selectedTask.notes || 'No specific instructions attached.'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toggleComplete(selectedTask.id);
                  setEditModalOpen(false);
                }}
              >
                {selectedTask.completed ? 'Reopen Task' : '✓ Mark as Completed'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setEditModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FollowUps;
