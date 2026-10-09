"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon } from '../../../../shared/components';

interface Activity {
  id: string;
  type: 'discovery_call' | 'demo' | 'scoping_meeting' | 'proposal_review' | 'contract_negotiation' | 'email_outreach';
  account: string;
  contactPerson: string;
  rep: string;
  date: string;
  duration: string;
  outcome: 'Qualified' | 'Proposal Requested' | 'Follow-up Needed' | 'Contract Approved' | 'Pending Review' | 'Rescheduled';
  notes: string;
}

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      type: 'demo',
      account: 'OmniChain Global',
      contactPerson: 'Rachel Tanaka (VP Ops)',
      rep: 'Sales Lead',
      date: '2026-10-09 11:30',
      duration: '45 mins',
      outcome: 'Proposal Requested',
      notes: 'Demonstrated automated routing telemetry engine. Client requested formal Statement of Work by Friday.',
    },
    {
      id: 'act-2',
      type: 'contract_negotiation',
      account: 'EuroFintech SA',
      contactPerson: 'Claire Dupont (CTO)',
      rep: 'Sarah Connor',
      date: '2026-10-08 15:00',
      duration: '30 mins',
      outcome: 'Contract Approved',
      notes: 'Reviewed mutual indemnity and SLA provisions. Client signatory approved draft CTR-2026-019.',
    },
    {
      id: 'act-3',
      type: 'discovery_call',
      account: 'Pacific Logistics Corp',
      contactPerson: 'Marcus Sterling',
      rep: 'Account Exec',
      date: '2026-10-08 10:15',
      duration: '25 mins',
      outcome: 'Qualified',
      notes: 'Inbound RFQ discovery. Confirmed $85k budget for fleet tracking telemetry API integration.',
    },
    {
      id: 'act-4',
      type: 'proposal_review',
      account: 'BioHealth Analytics',
      contactPerson: 'Sophia Patel',
      rep: 'Sarah Connor',
      date: '2026-10-07 14:00',
      duration: '40 mins',
      outcome: 'Follow-up Needed',
      notes: 'Walked through EHR compliance architecture. Clinical stakeholders requested HIPAA addendum before signoff.',
    },
    {
      id: 'act-5',
      type: 'scoping_meeting',
      account: 'Apex Health Systems',
      contactPerson: 'Dr. Sarah Jenkins',
      rep: 'Michael Scott',
      date: '2026-10-06 09:30',
      duration: '60 mins',
      outcome: 'Qualified',
      notes: 'Deep-dive architectural scoping with Chief Medical Informatics Officer on FHIR API connectors.',
    },
    {
      id: 'act-6',
      type: 'email_outreach',
      account: 'Global Retailers Inc',
      contactPerson: 'Jonathan Miller',
      rep: 'Sales Lead',
      date: '2026-10-05 16:45',
      duration: '15 mins',
      outcome: 'Pending Review',
      notes: 'Sent executive summary and revised pricing schedule for Enterprise Transformation Suite.',
    },
  ]);

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Form
  const [formAccount, setFormAccount] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formType, setFormType] = useState<Activity['type']>('discovery_call');
  const [formRep, setFormRep] = useState('Sales Lead');
  const [formDuration, setFormDuration] = useState('30 mins');
  const [formOutcome, setFormOutcome] = useState<Activity['outcome']>('Qualified');
  const [formNotes, setFormNotes] = useState('');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await leadsApi.getAll({ limit: 30 });
        if (res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items || [];
          setLeads(items);
          if (items.length > 0 && !formAccount) {
            setFormAccount(items[0].company || items[0].contact_name);
            setFormContact(items[0].contact_name);
          }
        }
      } catch {
        // fallback
      }
    }
    fetchLeads();
  }, []);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      type: formType,
      account: formAccount || 'Enterprise Account',
      contactPerson: formContact || 'Primary Stakeholder',
      rep: formRep,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      duration: formDuration,
      outcome: formOutcome,
      notes: formNotes,
    };

    setActivities((prev) => [newAct, ...prev]);
    setCreateModalOpen(false);
    resetForm();
    notify(`✓ Activity logged for "${newAct.account}" (${newAct.outcome})!`);
  };

  const resetForm = () => {
    setFormNotes('');
    setFormDuration('30 mins');
    setFormOutcome('Qualified');
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'discovery_call':
        return { icon: '📞', label: 'Discovery Call', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'demo':
        return { icon: '💻', label: 'Product Demo', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'scoping_meeting':
        return { icon: '📋', label: 'Technical Scoping', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'proposal_review':
        return { icon: '📄', label: 'Proposal Review', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'contract_negotiation':
        return { icon: '🤝', label: 'Contract Review', color: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30' };
      case 'email_outreach':
        return { icon: '✉️', label: 'Email Outreach', color: 'text-zinc-300 bg-zinc-800 border-zinc-700' };
    }
  };

  const getOutcomeBadge = (outcome: Activity['outcome']) => {
    switch (outcome) {
      case 'Qualified':
      case 'Contract Approved':
        return <StatusBadge status={outcome} variant="success" />;
      case 'Proposal Requested':
        return <StatusBadge status={outcome} variant="gold" />;
      case 'Follow-up Needed':
      case 'Pending Review':
        return <StatusBadge status={outcome} variant="warning" />;
      case 'Rescheduled':
        return <StatusBadge status={outcome} variant="neutral" />;
      default:
        return <StatusBadge status={outcome} />;
    }
  };

  // KPIs
  const totalCalls = activities.filter((a) => a.type === 'discovery_call').length;
  const totalDemos = activities.filter((a) => a.type === 'demo').length;
  const proposalWins = activities.filter((a) => ['Proposal Requested', 'Contract Approved'].includes(a.outcome)).length;

  // Filter & Search
  const filtered = activities.filter((a) => {
    if (activeTab !== 'all' && a.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.account.toLowerCase().includes(q) ||
        a.contactPerson.toLowerCase().includes(q) ||
        a.rep.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q) ||
        a.outcome.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-slideDown">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">⚡ Activity Recorded:</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Sales Outreach & Engagement History</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              Live Interaction Feed
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Complete audit trail of stakeholder discovery calls, technical demos, scoping workshops, and commercial reviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/follow-ups">
            <Button variant="secondary" size="sm">
              <Icon name="calendar" className="w-3.5 h-3.5 mr-1.5" />
              Follow-ups
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            + Log Activity
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Total Activities Logged</div>
          <div className="text-xl font-extrabold text-white font-mono mt-0.5">{activities.length} Touchpoints</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Current quarterly cycle</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Discovery Calls Held</div>
          <div className="text-xl font-extrabold text-blue-400 font-mono mt-0.5">{totalCalls} Completed</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Inbound qualification</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Client Demos Delivered</div>
          <div className="text-xl font-extrabold text-purple-400 font-mono mt-0.5">{totalDemos} Sessions</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Architecture walkthroughs</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Commercial Conversions</div>
          <div className="text-xl font-extrabold text-[#D4AF37] font-mono mt-0.5">{proposalWins} Advanced</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Proposal/contract outcomes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-[#141414] border border-[#2A2A2A]">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'discovery_call', label: 'Discovery Calls' },
            { id: 'demo', label: 'Product Demos' },
            { id: 'scoping_meeting', label: 'Scoping' },
            { id: 'proposal_review', label: 'Proposal Reviews' },
            { id: 'contract_negotiation', label: 'Contract Negotiation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search account, rep, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Activities Table */}
      <DataTable
        loading={loading}
        data={filtered}
        emptyMessage="No engagement activities logged for this criteria. Click '+ Log Activity' to record one."
        columns={[
          {
            header: 'Activity Type',
            accessor: (row) => {
              const meta = getTypeIcon(row.type);
              return (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${meta.color}`}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Account / Enterprise',
            accessor: (row) => (
              <div>
                <div className="font-bold text-white text-xs hover:text-[#D4AF37] transition-colors cursor-pointer" onClick={() => { setSelectedActivity(row); setViewModalOpen(true); }}>
                  {row.account}
                </div>
                <div className="text-xs text-zinc-300 font-medium">{row.contactPerson}</div>
              </div>
            ),
          },
          {
            header: 'Sales Rep & Timing',
            accessor: (row) => (
              <div>
                <div className="text-xs text-white font-medium">{row.rep}</div>
                <div className="text-xs text-zinc-300 font-mono">
                  {row.date} • ({row.duration})
                </div>
              </div>
            ),
          },
          {
            header: 'Outcome',
            accessor: (row) => getOutcomeBadge(row.outcome),
          },
          {
            header: 'Meeting Summary / Notes',
            accessor: (row) => (
              <div
                className="max-w-md text-xs text-zinc-300 line-clamp-1 cursor-pointer hover:text-white transition-colors"
                title={row.notes}
                onClick={() => { setSelectedActivity(row); setViewModalOpen(true); }}
              >
                {row.notes}
              </div>
            ),
          },
          {
            header: 'Action',
            accessor: (row) => (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedActivity(row);
                  setViewModalOpen(true);
                }}
                className="text-[11px] py-1"
              >
                View
              </Button>
            ),
          },
        ]}
      />

      {/* MODAL 1: Log New Activity */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Log Customer Engagement Activity">
        <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Target Account / Enterprise</label>
            {leads.length > 0 ? (
              <select
                value={formAccount}
                onChange={(e) => {
                  setFormAccount(e.target.value);
                  const matched = leads.find((l) => (l.company || l.contact_name) === e.target.value);
                  if (matched) setFormContact(matched.contact_name);
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
              <Input placeholder="e.g. Acme FinTech Corp" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} required />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Primary Stakeholder Name" placeholder="e.g. Rachel Tanaka" value={formContact} onChange={(e) => setFormContact(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Engagement Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="discovery_call">📞 Discovery Call</option>
                <option value="demo">💻 Product Demo</option>
                <option value="scoping_meeting">📋 Technical Scoping</option>
                <option value="proposal_review">📄 Proposal Review</option>
                <option value="contract_negotiation">🤝 Contract Negotiation</option>
                <option value="email_outreach">✉️ Email Outreach</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Activity Outcome</label>
              <select
                value={formOutcome}
                onChange={(e) => setFormOutcome(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Qualified">Qualified</option>
                <option value="Proposal Requested">Proposal Requested</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
                <option value="Contract Approved">Contract Approved</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>
            <Input label="Meeting Duration" placeholder="e.g. 45 mins" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Meeting Notes & Key Takeaways</label>
            <textarea
              rows={4}
              required
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Summary of topics discussed, customer objections or requirements, and next action items..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Log Activity ➔</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: View Activity Detail */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Activity Record: ${selectedActivity?.account || ''}`}>
        {selectedActivity && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#181818] border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{selectedActivity.account}</span>
                {getOutcomeBadge(selectedActivity.outcome)}
              </div>
              <div className="text-[11px] text-zinc-400">
                Contact: <strong className="text-zinc-200">{selectedActivity.contactPerson}</strong> • Logged by <strong className="text-zinc-200">{selectedActivity.rep}</strong>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {selectedActivity.date} • Duration: {selectedActivity.duration}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Detailed Discussion Notes</label>
              <div className="p-3 rounded-lg bg-[#1C1C1E] border border-[#2A2A2A] text-zinc-300 leading-relaxed text-xs">
                {selectedActivity.notes}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <Button variant="secondary" size="sm" onClick={() => setViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Activities;
