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

export interface RiskIssueRecord {
  id: string;
  title: string;
  project: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'Technical' | 'Infrastructure' | 'Third-Party' | 'Security';
  mitigation: string;
  owner: string;
  status: 'open' | 'in_progress' | 'mitigated';
  dateLogged: string;
}

const INITIAL_RISKS: RiskIssueRecord[] = [
  {
    id: 'RSK-101',
    title: 'Upstream Third-Party Payment Gateway Latency Spikes',
    project: 'Payment Gateway Integration',
    severity: 'high',
    category: 'Third-Party',
    mitigation: 'Implemented circuit breaker pattern with Redis-backed fallback queues.',
    owner: 'Alex Mercer (Lead Dev)',
    status: 'mitigated',
    dateLogged: '2026-09-22',
  },
  {
    id: 'RSK-102',
    title: 'Supabase Direct Connection IPv4 Pooler Deprecation',
    project: 'Core Banking Modernization',
    severity: 'critical',
    category: 'Infrastructure',
    mitigation: 'Routed all background workers through Session Pooler with SSL certificate verification.',
    owner: 'Rahul Sharma (Backend)',
    status: 'mitigated',
    dateLogged: '2026-09-28',
  },
  {
    id: 'RSK-103',
    title: 'Multi-Currency 3-Decimal Float Rounding Discrepancy',
    project: 'Payment Gateway Integration',
    severity: 'critical',
    category: 'Technical',
    mitigation: 'Discovered in QA (Defect #42). Currently in active fix and retest loop.',
    owner: 'Alex Mercer & Priya Patel',
    status: 'in_progress',
    dateLogged: '2026-10-06',
  },
  {
    id: 'RSK-104',
    title: 'Snowflake ETL Query Latency on Daily Ingestion Run',
    project: 'Healthcare Data Warehouse',
    severity: 'medium',
    category: 'Technical',
    mitigation: 'Clustering keys added to partitioned tables; query execution reduced by 64%.',
    owner: 'Jonathan Reed (DevOps)',
    status: 'open',
    dateLogged: '2026-10-02',
  },
];

export const RisksIssues: React.FC = () => {
  const [risks, setRisks] = useState<RiskIssueRecord[]>(INITIAL_RISKS);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Core Banking Modernization');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Infrastructure' | 'Third-Party' | 'Security'>('Technical');
  const [newMitigation, setNewMitigation] = useState('');
  const [newOwner, setNewOwner] = useState('Alex Mercer');

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRecord: RiskIssueRecord = {
      id: `RSK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      project: newProject,
      severity: newSeverity,
      category: newCategory,
      mitigation: newMitigation.trim() || 'Investigation initiated by tech lead.',
      owner: newOwner,
      status: 'open',
      dateLogged: new Date().toISOString().split('T')[0],
    };

    setRisks((prev) => [newRecord, ...prev]);
    setCreateModalOpen(false);
    setNewTitle('');
    setNewMitigation('');
    setToastNotice(`✓ Technical risk logged: "${newRecord.title}"`);
    setTimeout(() => setToastNotice(null), 5000);
  };

  const handleToggleStatus = (id: string) => {
    setRisks((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'mitigated' ? 'open' : 'mitigated',
            }
          : r
      )
    );
  };

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (selectedSeverity === 'all') return true;
      if (selectedSeverity === 'open') return r.status === 'open' || r.status === 'in_progress';
      if (selectedSeverity === 'mitigated') return r.status === 'mitigated';
      return r.severity === selectedSeverity;
    });
  }, [risks, selectedSeverity]);

  const criticalCount = risks.filter((r) => r.severity === 'critical' && r.status !== 'mitigated').length;
  const inProgressCount = risks.filter((r) => r.status === 'in_progress').length;
  const mitigatedCount = risks.filter((r) => r.status === 'mitigated').length;

  const columns: Column<RiskIssueRecord>[] = [
    {
      header: 'Identified Issue & Mitigation Strategy',
      accessor: (row) => (
        <div className="space-y-1.5 py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400">{row.id}</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {row.category}
            </span>
          </div>
          <p className="font-semibold text-white text-xs">{row.title}</p>
          <p className="text-[11px] text-zinc-400 bg-black/40 p-1.5 rounded border border-zinc-800/80">
            🛡️ <span className="font-medium text-zinc-300">Mitigation:</span> {row.mitigation}
          </p>
        </div>
      ),
    },
    {
      header: 'Project & Lead',
      accessor: (row) => (
        <div className="text-xs">
          <p className="font-medium text-white">{row.project}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Owner: {row.owner}</p>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
            row.severity === 'critical'
              ? 'bg-red-950/70 text-red-300 border-red-800/80 animate-pulse'
              : row.severity === 'high'
              ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
              : 'bg-blue-950/70 text-blue-300 border-blue-800/80'
          }`}
        >
          {row.severity}
        </span>
      ),
    },
    {
      header: 'Date Logged',
      accessor: (row) => <span className="text-xs font-mono text-zinc-400">{row.dateLogged}</span>,
    },
    {
      header: 'Status & Action',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleStatus(row.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
              row.status === 'mitigated'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : row.status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {row.status === 'mitigated' ? '✓ Mitigated' : row.status === 'in_progress' ? 'In Progress' : 'Open'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="Project Risks & Technical Issues Matrix"
            description="Technical impediment registry, architectural risks, and mitigation tracking"
            breadcrumbs={[{ label: 'Delivery Hub' }, { label: 'Risks & Issues' }]}
          />
        </div>

        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <span>+ Log Risk / Blocker</span>
        </Button>
      </div>

      {toastNotice && (
        <div className="mb-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center gap-2">
          <span>📢</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 4 HIGHLIGHT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp">
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">Total Logged Risks</span>
          <span className="text-2xl font-bold text-white mt-1 block">{risks.length} Issues</span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Full engagement matrix</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">Active Critical Blockers</span>
          <span className="text-2xl font-bold text-red-400 mt-1 block">{criticalCount} Urgent</span>
          <span className="text-[11px] text-red-400/80 mt-1 block">Needs tech lead review</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">In Mitigation Loop</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{inProgressCount} Active</span>
          <span className="text-[11px] text-amber-300/80 mt-1 block">Patch & QA verification</span>
        </div>
        <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl card-hover-fx">
          <span className="text-xs text-zinc-400 block">Successfully Mitigated</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{mitigatedCount} Resolved</span>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Closed with architecture fix</span>
        </div>
      </div>

      {/* SEVERITY & STATUS TABS */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto text-xs">
        {[
          { key: 'all', label: 'All Items' },
          { key: 'open', label: 'Open Blockers' },
          { key: 'critical', label: 'Critical' },
          { key: 'high', label: 'High' },
          { key: 'mitigated', label: 'Resolved / Mitigated' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedSeverity(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedSeverity === tab.key
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RISKS TABLE */}
      <DataTable data={filteredRisks} columns={columns} />

      {/* CREATE RISK MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Log Technical Risk or Sprint Blocker"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRisk} className="space-y-4 text-xs">
          <Input
            label="Risk / Issue Description *"
            placeholder="e.g. Third-Party Webhook Delivery Rate Limiting"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Impacted Project"
              options={[
                { value: 'Core Banking Modernization', label: 'Core Banking Modernization' },
                { value: 'Payment Gateway Integration', label: 'Payment Gateway Integration' },
                { value: 'Healthcare Data Warehouse', label: 'Healthcare Data Warehouse' },
              ]}
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            />
            <Select
              label="Severity Level"
              options={[
                { value: 'critical', label: 'Critical (Sprint Blocker)' },
                { value: 'high', label: 'High (Impediment)' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Risk Category"
              options={[
                { value: 'Technical', label: 'Technical / Architecture' },
                { value: 'Infrastructure', label: 'Infrastructure & Cloud' },
                { value: 'Third-Party', label: 'Third-Party Integration' },
                { value: 'Security', label: 'Security & Compliance' },
              ]}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
            />
            <Input
              label="Assigned Lead / Owner"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
              Mitigation Plan / Strategy
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-[#171717] border border-[#2A2A2A] focus:border-[#D4AF37] rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
              placeholder="Actionable steps or architectural patterns being implemented..."
              value={newMitigation}
              onChange={(e) => setNewMitigation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              ✓ Log Risk
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default RisksIssues;
