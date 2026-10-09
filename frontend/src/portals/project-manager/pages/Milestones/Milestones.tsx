"use client";
import React, { useState, useMemo } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import DataTable, { Column } from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';

export interface MilestoneRecord {
  id: string;
  title: string;
  project: string;
  phase: string;
  due: string;
  completionPercent: number;
  status: 'completed' | 'in_progress' | 'pending';
  deliverables: string[];
  billingValue: string;
  invoiceState: 'invoiced' | 'requested' | 'not_requested';
  leadOwner: string;
}

const INITIAL_MILESTONES: MilestoneRecord[] = [
  {
    id: 'MS-101',
    title: 'Phase 1: Architecture Signoff & CRM Contract Scoping',
    project: 'Core Banking Modernization',
    phase: 'Phase 1',
    due: '2026-02-15',
    completionPercent: 100,
    status: 'completed',
    deliverables: ['System Architecture Document', 'Database Schema v1.0', 'Contract Scope Alignment'],
    billingValue: '$120,000',
    invoiceState: 'invoiced',
    leadOwner: 'Alex Mercer',
  },
  {
    id: 'MS-102',
    title: 'Phase 2: Core Microservices & API Integration',
    project: 'Core Banking Modernization',
    phase: 'Phase 2',
    due: '2026-05-30',
    completionPercent: 100,
    status: 'completed',
    deliverables: ['FastAPI REST Endpoints', 'Payment Gateway Integration', 'Auth & RBAC Matrix'],
    billingValue: '$240,000',
    invoiceState: 'invoiced',
    leadOwner: 'Rahul Sharma',
  },
  {
    id: 'MS-103',
    title: 'Phase 3: QA Verification, Bug Hardening & Security Audit',
    project: 'Core Banking Modernization',
    phase: 'Phase 3',
    due: '2026-09-15',
    completionPercent: 75,
    status: 'in_progress',
    deliverables: ['Penetration Test Audit', 'Load Testing (5000 req/sec)', 'QA Regression Signoff'],
    billingValue: '$180,000',
    invoiceState: 'requested',
    leadOwner: 'Priya Patel',
  },
  {
    id: 'MS-104',
    title: 'Phase 4: Client Production Deployment & Signoff',
    project: 'Core Banking Modernization',
    phase: 'Phase 4',
    due: '2026-12-31',
    completionPercent: 0,
    status: 'pending',
    deliverables: ['Production Cluster Cutover', 'Client Acceptance Signoff', 'Final Invoicing'],
    billingValue: '$260,000',
    invoiceState: 'not_requested',
    leadOwner: 'Alex Mercer',
  },
  {
    id: 'MS-105',
    title: 'Milestone A: Webhook Signature Verification & Idempotency',
    project: 'Payment Gateway Integration',
    phase: 'Phase 1',
    due: '2026-04-10',
    completionPercent: 100,
    status: 'completed',
    deliverables: ['HMAC-SHA256 Validator', 'Redis Idempotency Store'],
    billingValue: '$95,000',
    invoiceState: 'invoiced',
    leadOwner: 'Alex Mercer',
  },
  {
    id: 'MS-106',
    title: 'Milestone B: Multi-Currency Settlement Engine',
    project: 'Payment Gateway Integration',
    phase: 'Phase 2',
    due: '2026-07-20',
    completionPercent: 100,
    status: 'completed',
    deliverables: ['FX Real-Time Conversion', 'Batch Settlement Processor'],
    billingValue: '$150,000',
    invoiceState: 'invoiced',
    leadOwner: 'Rahul Sharma',
  },
];

export const Milestones: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneRecord[]>(INITIAL_MILESTONES);
  const [selectedProject, setSelectedProject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Core Banking Modernization');
  const [newPhase, setNewPhase] = useState('Phase 3');
  const [newDue, setNewDue] = useState('2026-11-30');
  const [newDeliverables, setNewDeliverables] = useState('Production Release, Acceptance Document, QA Signoff');
  const [newBillingValue, setNewBillingValue] = useState('$150,000');
  const [newOwner, setNewOwner] = useState('Alex Mercer');

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const record: MilestoneRecord = {
      id: `MS-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      project: newProject,
      phase: newPhase,
      due: newDue,
      completionPercent: 0,
      status: 'pending',
      deliverables: newDeliverables.split(',').map((d) => d.trim()).filter(Boolean),
      billingValue: newBillingValue,
      invoiceState: 'not_requested',
      leadOwner: newOwner,
    };

    setMilestones((prev) => [record, ...prev]);
    setCreateModalOpen(false);
    setNewTitle('');
    setBannerNotice(`✓ Milestone "${record.title}" added to project roadmap.`);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  const handleRequestInvoice = (milestoneId: string, title: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, invoiceState: 'requested' } : m))
    );
    setBannerNotice(
      `✓ Milestone "${title}" verified! Invoice request dispatched to HR & Admin for official billing.`
    );
    setTimeout(() => setBannerNotice(null), 6000);
  };

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const matchProj = selectedProject === 'all' || m.project.toLowerCase().includes(selectedProject.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchProj && matchStatus;
    });
  }, [milestones, selectedProject, statusFilter]);

  const totalCompleted = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const invoiced = milestones.filter((m) => m.invoiceState === 'invoiced').length;

  const columns: Column<MilestoneRecord>[] = [
    {
      header: 'Milestone Title & Deliverables',
      accessor: (row) => (
        <div className="space-y-1.5 py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400">{row.id}</span>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              {row.phase}
            </span>
          </div>
          <p className="font-semibold text-white text-xs">{row.title}</p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {row.deliverables.map((del, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                • {del}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      header: 'Project & Owner',
      accessor: (row) => (
        <div className="text-xs">
          <p className="font-medium text-white">{row.project}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Lead: {row.leadOwner}</p>
        </div>
      ),
    },
    {
      header: 'Progress',
      accessor: (row) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Target:</span>
            <span className="text-white font-bold">{row.completionPercent}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                row.completionPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200'
              }`}
              style={{ width: `${row.completionPercent}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Target Date',
      accessor: (row) => <span className="font-mono text-xs text-zinc-300">{row.due}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Billing & Invoice State',
      className: 'text-right',
      accessor: (row) => (
        <div className="text-right space-y-1" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-xs font-bold text-white block">{row.billingValue}</span>
          {row.invoiceState === 'invoiced' ? (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Invoiced (HR/Admin)
            </span>
          ) : row.invoiceState === 'requested' ? (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⏳ Request Sent to HR/Admin
            </span>
          ) : row.completionPercent === 100 ? (
            <button
              onClick={() => handleRequestInvoice(row.id, row.title)}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-semibold border border-amber-500/40 transition-colors"
            >
              📨 Request Invoice
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500">In Dev / Testing</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="Project Deliverable Milestones"
            description="Formal contract milestones, client acceptance gates, and delivery sign-offs"
            breadcrumbs={[{ label: 'Delivery Hub' }, { label: 'Milestones' }]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Projects</option>
            <option value="Core Banking">Core Banking Modernization</option>
            <option value="Payment Gateway">Payment Gateway Integration</option>
          </select>

          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <span>+ Scope Milestone</span>
          </Button>
        </div>
      </div>

      {bannerNotice && (
        <div className="mb-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center gap-2">
          <span>📢</span>
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* 4 HIGHLIGHT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp">
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">Total Contract Milestones</span>
          <span className="text-2xl font-bold text-white mt-1 block">{milestones.length} Phases</span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Commercial deliverables</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">Completed & QA Verified</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{totalCompleted} Milestones</span>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Accepted by client</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">In QA Verification</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{inProgress} Milestone</span>
          <span className="text-[11px] text-amber-300/80 mt-1 block">Active testing phase</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">HR/Admin Invoiced</span>
          <span className="text-2xl font-bold text-white mt-1 block font-mono">{invoiced} Billed</span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Authorized by HR & Admin</span>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto text-xs">
        {['all', 'completed', 'in_progress', 'pending'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize whitespace-nowrap ${
              statusFilter === st
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {st === 'all' ? 'All Milestones' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* MILESTONES DATA TABLE */}
      <DataTable data={filteredMilestones} columns={columns} />

      {/* CREATE MILESTONE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Scope New Contract Milestone"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
          <Input
            label="Milestone Title *"
            placeholder="e.g. Phase 4: Production Deployment & Cutover"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Associated Project"
              options={[
                { value: 'Core Banking Modernization', label: 'Core Banking Modernization' },
                { value: 'Payment Gateway Integration', label: 'Payment Gateway Integration' },
              ]}
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            />
            <Input
              label="Phase Identification"
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Target Delivery Date"
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
            <Input
              label="Billing Value (USD)"
              value={newBillingValue}
              onChange={(e) => setNewBillingValue(e.target.value)}
            />
            <Input
              label="Lead Owner"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
              Deliverable Items (comma separated)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-[#171717] border border-[#2A2A2A] focus:border-[#D4AF37] rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
              value={newDeliverables}
              onChange={(e) => setNewDeliverables(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              ✓ Save Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default Milestones;
