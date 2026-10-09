"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi, salesApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon } from '../../../../shared/components';

interface Opportunity {
  id: string;
  title: string;
  account: string;
  contactPerson: string;
  value: number;
  stage: 'qualification' | 'scoping' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  closeDate: string;
  owner: string;
  notes?: string;
  leadId?: string;
}

export const Opportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: 'opp-1',
      title: 'Enterprise Digital Transformation Suite',
      account: 'Global Retailers Inc',
      contactPerson: 'Jonathan Miller (CIO)',
      value: 350000,
      stage: 'negotiation',
      probability: 85,
      closeDate: '2026-11-15',
      owner: 'Sarah Connor',
      notes: 'Final MSA legal terms under mutual review with Procurement VP.',
    },
    {
      id: 'opp-2',
      title: 'Managed Cloud Infrastructure Migrations',
      account: 'Apex Health Systems',
      contactPerson: 'Dr. Sarah Jenkins',
      value: 220000,
      stage: 'proposal',
      probability: 70,
      closeDate: '2026-12-01',
      owner: 'Michael Scott',
      notes: 'Commercial SOW proposal delivered. Technical compliance validated.',
    },
    {
      id: 'opp-3',
      title: 'SOC2 Automated Compliance & Payment Ledger',
      account: 'EuroFintech SA',
      contactPerson: 'Claire Dupont',
      value: 140000,
      stage: 'negotiation',
      probability: 90,
      closeDate: '2026-10-28',
      owner: 'Sarah Connor',
      notes: 'Proposal accepted. Pending contract execution and delivery kick-off.',
    },
    {
      id: 'opp-4',
      title: 'Autonomous Fleet Telemetry & GPS Gateway',
      account: 'Pacific Logistics Corp',
      contactPerson: 'Marcus Sterling',
      value: 85000,
      stage: 'scoping',
      probability: 50,
      closeDate: '2026-11-30',
      owner: 'David Zhao',
      notes: 'Requirements gathering workshop completed. Preparing formal quote.',
    },
    {
      id: 'opp-5',
      title: 'Enterprise EHR Patient Portal',
      account: 'BioHealth Analytics',
      contactPerson: 'Sophia Patel',
      value: 110000,
      stage: 'proposal',
      probability: 75,
      closeDate: '2026-11-10',
      owner: 'Sarah Connor',
      notes: 'RFP submission approved. Scheduling demonstration call next week.',
    },
    {
      id: 'opp-6',
      title: 'Warehouse Robotics Telemetry Layer',
      account: 'OmniChain Global',
      contactPerson: 'Rachel Tanaka',
      value: 95000,
      stage: 'qualification',
      probability: 30,
      closeDate: '2026-12-15',
      owner: 'David Zhao',
      notes: 'Initial discovery call logged. Scoping budget and cloud architecture.',
    },
    {
      id: 'opp-7',
      title: 'Enterprise Multi-Cloud Infrastructure & Kubernetes',
      account: 'Nexus Digital Infrastructure',
      contactPerson: 'David Vance',
      value: 220000,
      stage: 'closed_won',
      probability: 100,
      closeDate: '2026-09-30',
      owner: 'Sarah Connor',
      notes: 'Contract executed. Converted into active Delivery Hub project.',
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [account, setAccount] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [value, setValue] = useState('120000');
  const [stage, setStage] = useState<Opportunity['stage']>('qualification');
  const [probability, setProbability] = useState('40');
  const [closeDate, setCloseDate] = useState('2026-11-30');
  const [owner, setOwner] = useState('Sarah Connor');
  const [notes, setNotes] = useState('');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [pipelineRes, leadsRes] = await Promise.allSettled([
          salesApi.getPipeline(),
          leadsApi.getAll({ limit: 40 }),
        ]);

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
          const raw = leadsRes.value.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          if (items.length > 0) {
            const mapped: Opportunity[] = items.map((l: any, idx: number) => {
              let st: Opportunity['stage'] = 'qualification';
              let prob = 30;
              if (l.status === 'contacted') {
                st = 'qualification';
                prob = 35;
              } else if (l.status === 'requirement_gathering') {
                st = 'scoping';
                prob = 55;
              } else if (['proposal_created', 'proposal_sent'].includes(l.status)) {
                st = 'proposal';
                prob = 75;
              } else if (l.status === 'proposal_approved') {
                st = 'negotiation';
                prob = 90;
              } else if (l.status === 'converted') {
                st = 'closed_won';
                prob = 100;
              } else if (l.status === 'disqualified') {
                st = 'closed_lost';
                prob = 0;
              }

              return {
                id: l.id || `opp-db-${idx}`,
                title: l.notes?.slice(0, 42) || `${l.company || l.contact_name} Modernization`,
                account: l.company || l.contact_name || 'Enterprise Account',
                contactPerson: l.contact_name || 'Primary Contact',
                value: Number(l.estimated_value) || 85000,
                stage: st,
                probability: prob,
                closeDate: '2026-11-30',
                owner: 'Sales Lead',
                notes: l.notes,
                leadId: l.id,
              };
            });
            setOpportunities(mapped);
          }
        }
      } catch {
        // Keep initial rich data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      title,
      account,
      contactPerson: contactPerson || 'Primary Contact',
      value: Number(value) || 75000,
      stage,
      probability: Number(probability) || 40,
      closeDate,
      owner,
      notes,
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    setCreateModalOpen(false);
    resetForm();
    notify(`✓ Opportunity "${title}" for ${account} created successfully!`);
  };

  const handleUpdateStage = (opp: Opportunity, newStage: Opportunity['stage']) => {
    const probMap: Record<Opportunity['stage'], number> = {
      qualification: 35,
      scoping: 55,
      proposal: 75,
      negotiation: 90,
      closed_won: 100,
      closed_lost: 0,
    };

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === opp.id
          ? { ...o, stage: newStage, probability: probMap[newStage] }
          : o
      )
    );
    setEditModalOpen(false);
    notify(`⚡ Opportunity "${opp.account}" advanced to ${getStageLabel(newStage)}!`);
  };

  const resetForm = () => {
    setTitle('');
    setAccount('');
    setContactPerson('');
    setValue('120000');
    setStage('qualification');
    setProbability('40');
    setCloseDate('2026-11-30');
    setNotes('');
  };

  const getStageLabel = (st: Opportunity['stage']) => {
    switch (st) {
      case 'qualification':
        return '1. Qualification';
      case 'scoping':
        return '2. Technical Scoping';
      case 'proposal':
        return '3. Proposal / SOW';
      case 'negotiation':
        return '4. Contract Negotiation';
      case 'closed_won':
        return '5. Closed Won (Client)';
      case 'closed_lost':
        return 'Closed Lost';
      default:
        return st;
    }
  };

  const getStageBadge = (st: Opportunity['stage']) => {
    switch (st) {
      case 'qualification':
        return <StatusBadge status="Qualification" variant="neutral" />;
      case 'scoping':
        return <StatusBadge status="Scoping Specs" variant="warning" />;
      case 'proposal':
        return <StatusBadge status="Proposal Sent" variant="info" />;
      case 'negotiation':
        return <StatusBadge status="Contract Review" variant="gold" />;
      case 'closed_won':
        return <StatusBadge status="Closed Won" variant="success" />;
      case 'closed_lost':
        return <StatusBadge status="Closed Lost" variant="danger" />;
      default:
        return <StatusBadge status={st} />;
    }
  };

  // Metrics
  const activeOpps = opportunities.filter((o) => o.stage !== 'closed_lost');
  const totalPipeline = activeOpps.reduce((sum, o) => sum + o.value, 0);
  const weightedPipeline = activeOpps.reduce((sum, o) => sum + (o.value * o.probability) / 100, 0);
  const wonOpps = opportunities.filter((o) => o.stage === 'closed_won');
  const avgDealSize = activeOpps.length ? Math.round(totalPipeline / activeOpps.length) : 0;

  // Filter
  const filtered = opportunities.filter((o) => {
    if (activeTab !== 'all' && o.stage !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.account.toLowerCase().includes(q) ||
        o.contactPerson.toLowerCase().includes(q) ||
        o.owner.toLowerCase().includes(q)
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
            <span className="font-bold text-emerald-400">⚡ Opportunity Updated:</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Commercial Opportunities</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              High-Velocity Deals
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Qualified corporate transactions progressing through technical scoping, proposal submission, and contract execution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/pipeline">
            <Button variant="secondary" size="sm">
              <Icon name="grid" className="w-3.5 h-3.5 mr-1.5" />
              Kanban Pipeline
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            + New Opportunity
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Total Pipeline Value</div>
          <div className="text-xl font-extrabold text-white font-mono mt-0.5">${totalPipeline.toLocaleString()}</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">{activeOpps.length} qualified opportunities</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Weighted Forecast (ARR)</div>
          <div className="text-xl font-extrabold text-[#D4AF37] font-mono mt-0.5">${Math.round(weightedPipeline).toLocaleString()}</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Probability-adjusted revenue</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Avg Deal Value</div>
          <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">${avgDealSize.toLocaleString()}</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Enterprise contract average</div>
        </div>
        <div className="card-hover-fx p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
          <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold font-mono">Closed Won Deals</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">{wonOpps.length} Accounts</div>
          <div className="text-xs text-zinc-300 mt-1 font-medium">Active in Delivery Hub</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-[#141414] border border-[#2A2A2A]">
        {/* Stage Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'qualification', label: 'Qualification' },
            { id: 'scoping', label: 'Scoping' },
            { id: 'proposal', label: 'Proposal / SOW' },
            { id: 'negotiation', label: 'Negotiation' },
            { id: 'closed_won', label: 'Closed Won' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1C1C1E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search deals, accounts, reps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Opportunities DataTable */}
      <DataTable
        loading={loading}
        data={filtered}
        emptyMessage="No opportunities found matching this criteria."
        columns={[
          {
            header: 'Opportunity & Enterprise',
            accessor: (row) => (
              <div>
                <div className="font-bold text-white text-xs hover:text-[#D4AF37] transition-colors cursor-pointer" onClick={() => { setSelectedOpp(row); setEditModalOpen(true); }}>
                  {row.title}
                </div>
                <div className="text-xs text-zinc-300 flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-white">{row.account}</span>
                  <span>•</span>
                  <span>{row.contactPerson}</span>
                </div>
              </div>
            ),
          },
          {
            header: 'Deal Value',
            accessor: (row) => (
              <div>
                <div className="font-mono font-bold text-xs text-white">
                  ${row.value.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-300 font-mono font-medium">
                  Weighted: ${Math.round((row.value * row.probability) / 100).toLocaleString()}
                </div>
              </div>
            ),
          },
          {
            header: 'Sales Stage',
            accessor: (row) => getStageBadge(row.stage),
          },
          {
            header: 'Win Probability',
            accessor: (row) => (
              <div className="w-28 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <span>Chance</span>
                  <span className="font-bold text-[#D4AF37]">{row.probability}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      row.probability >= 80
                        ? 'bg-emerald-500'
                        : row.probability >= 50
                        ? 'bg-[#D4AF37]'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${row.probability}%` }}
                  />
                </div>
              </div>
            ),
          },
          {
            header: 'Target Closing',
            accessor: (row) => (
              <div>
                <div className="text-xs text-zinc-200 font-mono font-medium">{row.closeDate}</div>
                <div className="text-xs text-zinc-300 font-medium">Rep: {row.owner}</div>
              </div>
            ),
          },
          {
            header: 'Actions & Transitions',
            accessor: (row) => {
              if (row.stage === 'closed_won') {
                return (
                  <div className="flex items-center gap-1.5">
                    <Link href="/delivery/projects">
                      <Button variant="secondary" size="sm" className="text-[11px] py-1 text-emerald-400 border-emerald-500/30">
                        🚀 Delivery Hub
                      </Button>
                    </Link>
                    <Link href="/sales/clients">
                      <Button variant="secondary" size="sm" className="text-[11px] py-1 text-[#D4AF37] border-[#D4AF37]/30">
                        🏢 Client
                      </Button>
                    </Link>
                  </div>
                );
              }

              return (
                <div className="flex items-center gap-1.5">
                  {row.stage === 'scoping' && (
                    <Link href="/sales/proposals">
                      <Button variant="primary" size="sm" className="text-[11px] py-1">
                        📝 Draft Proposal
                      </Button>
                    </Link>
                  )}
                  {row.stage === 'proposal' && (
                    <Link href="/sales/proposals">
                      <Button variant="secondary" size="sm" className="text-[11px] py-1 text-purple-300 border-purple-500/30">
                        📄 View SOW
                      </Button>
                    </Link>
                  )}
                  {row.stage === 'negotiation' && (
                    <Link href="/sales/contracts">
                      <Button variant="primary" size="sm" className="text-[11px] py-1 bg-[#D4AF37] text-black hover:bg-[#e5c358] font-bold">
                        🤝 Sign Contract
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedOpp(row);
                      setEditModalOpen(true);
                    }}
                    className="text-[11px] py-1"
                  >
                    Edit
                  </Button>
                </div>
              );
            },
          },
        ]}
      />

      {/* MODAL 1: Create New Opportunity */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Commercial Opportunity">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <Input label="Opportunity Title" placeholder="e.g. SOC2 Cloud Platform Modernization" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Target Account Enterprise" placeholder="e.g. Apex Health Systems" value={account} onChange={(e) => setAccount(e.target.value)} required />
            <Input label="Primary Stakeholder / Contact" placeholder="e.g. Dr. Sarah Jenkins" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estimated Deal Value ($)" type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Current Sales Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="qualification">1. Qualification (35%)</option>
                <option value="scoping">2. Technical Scoping (55%)</option>
                <option value="proposal">3. Proposal / SOW (75%)</option>
                <option value="negotiation">4. Contract Negotiation (90%)</option>
                <option value="closed_won">5. Closed Won (100%)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Win Probability (%)" type="number" value={probability} onChange={(e) => setProbability(e.target.value)} required />
            <Input label="Target Closing Date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Key Objectives & Scope Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commercial objectives, key decision-makers, competition, and timeline..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Opportunity</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Quick Stage Update Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Update Deal: ${selectedOpp?.account || ''}`}>
        {selectedOpp && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#181818] border border-zinc-800 space-y-1">
              <div className="font-bold text-white text-sm">{selectedOpp.title}</div>
              <div className="text-zinc-400">Account: <strong className="text-zinc-200">{selectedOpp.account}</strong></div>
              <div className="text-emerald-400 font-mono font-bold">${selectedOpp.value.toLocaleString()}</div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Advance Pipeline Stage</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'qualification', label: '1. Qualification (35%)' },
                  { key: 'scoping', label: '2. Technical Scoping (55%)' },
                  { key: 'proposal', label: '3. Proposal / SOW (75%)' },
                  { key: 'negotiation', label: '4. Contract Negotiation (90%)' },
                  { key: 'closed_won', label: '5. Closed Won (Client) (100%)' },
                  { key: 'closed_lost', label: 'Closed Lost (0%)' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => handleUpdateStage(selectedOpp, st.key as any)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      selectedOpp.stage === st.key
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white font-bold'
                        : 'border-zinc-800 bg-[#1C1C1E] text-zinc-300 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Opportunities;
