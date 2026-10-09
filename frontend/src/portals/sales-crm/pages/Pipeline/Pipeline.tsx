"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi, salesApi, proposalsApi, contractsApi } from '../../../../api';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon, KpiCard, ActionToast } from '../../../../shared/components';

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: 'discovery' | 'requirements' | 'proposal' | 'negotiation' | 'won';
  probability: number;
  notes?: string;
  leadId?: string;
}

export const Pipeline: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: 'd-1',
      title: 'Automated Fleet Telemetry API',
      company: 'Pacific Logistics Corp',
      contact: 'Marcus Sterling',
      value: 85000,
      stage: 'requirements',
      probability: 60,
      notes: 'Finalizing technical specifications and AWS IoT architecture.',
    },
    {
      id: 'd-2',
      title: 'Open Banking Aggregation Platform',
      company: 'EuroFintech SA',
      contact: 'Claire Dupont',
      value: 140000,
      stage: 'negotiation',
      probability: 90,
      notes: 'Proposal approved by client board. Contract drafting in progress.',
    },
    {
      id: 'd-3',
      title: 'Microservices & Payment Modernization',
      company: 'Apex Cloud Logistics',
      contact: 'Alexander Wright',
      value: 180000,
      stage: 'discovery',
      probability: 30,
      notes: 'Inbound contact converted. Discovery call scheduled.',
    },
    {
      id: 'd-4',
      title: 'Telehealth Patient Portal & EHR Sync',
      company: 'BioHealth Analytics',
      contact: 'Sophia Patel',
      value: 110000,
      stage: 'proposal',
      probability: 75,
      notes: 'Proposal v1 sent to client. Awaiting executive signoff.',
    },
    {
      id: 'd-5',
      title: 'Enterprise Multi-Cloud Infrastructure',
      company: 'Nexus Digital Infrastructure',
      contact: 'David Vance',
      value: 220000,
      stage: 'won',
      probability: 100,
      notes: 'Contract executed! Project provisioned in Delivery Hub.',
    },
    {
      id: 'd-6',
      title: 'Warehouse Robotics Integration Layer',
      company: 'OmniChain Global',
      contact: 'Rachel Tanaka',
      value: 95000,
      stage: 'requirements',
      probability: 60,
      notes: 'Drafting milestone schedule and hardware communication protocols.',
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: 'advance' | 'new_deal'; deal?: Deal } | null>(null);
  const [newDealCompany, setNewDealCompany] = useState('');
  const [newDealContact, setNewDealContact] = useState('');
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('80000');
  const [newDealStage, setNewDealStage] = useState<'discovery' | 'requirements' | 'proposal' | 'negotiation' | 'won'>('discovery');

  useEffect(() => {
    async function loadPipelineData() {
      try {
        const [pipelineRes, leadsRes] = await Promise.allSettled([
          salesApi.getPipeline(),
          leadsApi.getAll({ limit: 40 }),
        ]);

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
          const raw = leadsRes.value.data;
          const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
          if (items.length > 0) {
            // Map real leads to pipeline cards
            const mapped: Deal[] = items.map((l: any, idx: number) => {
              let stage: Deal['stage'] = 'discovery';
              let prob = 30;
              if (l.status === 'requirement_gathering') {
                stage = 'requirements';
                prob = 55;
              } else if (['proposal_created', 'proposal_sent'].includes(l.status)) {
                stage = 'proposal';
                prob = 75;
              } else if (l.status === 'proposal_approved') {
                stage = 'negotiation';
                prob = 90;
              } else if (l.status === 'converted') {
                stage = 'won';
                prob = 100;
              }

              return {
                id: l.id || `lead-${idx}`,
                title: l.notes?.slice(0, 40) || `${l.company || l.contact_name} Project`,
                company: l.company || l.contact_name || 'Enterprise Client',
                contact: l.contact_name || 'Primary Contact',
                value: Number(l.estimated_value) || 75000,
                stage,
                probability: prob,
                notes: l.notes,
                leadId: l.id,
              };
            });
            setDeals(mapped);
          }
        }
      } catch {
        // Fallback demo state used
      }
    }
    loadPipelineData();
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const stages: { key: Deal['stage']; label: string; color: string; step: string }[] = [
    { key: 'discovery', label: '1. Inbound & Discovery', color: 'border-blue-500/40 text-blue-400', step: 'Contact Form ➔ Call' },
    { key: 'requirements', label: '2. Scoping & Requirements', color: 'border-amber-500/40 text-amber-400', step: 'Technical Specs' },
    { key: 'proposal', label: '3. Proposal & SOW', color: 'border-purple-500/40 text-purple-400', step: 'Commercial Review' },
    { key: 'negotiation', label: '4. Contract Execution', color: 'border-cyan-500/40 text-cyan-400', step: 'Legal & Signatures' },
    { key: 'won', label: '5. Closed Won (Client)', color: 'border-[#D4AF37]/50 text-[#D4AF37]', step: 'Delivery Hub Active' },
  ];

  // Stage advancement action
  const advanceDeal = async (deal: Deal) => {
    let nextStage: Deal['stage'] = 'discovery';
    if (deal.stage === 'discovery') nextStage = 'requirements';
    else if (deal.stage === 'requirements') nextStage = 'proposal';
    else if (deal.stage === 'proposal') nextStage = 'negotiation';
    else if (deal.stage === 'negotiation') nextStage = 'won';
    else return;

    // Backend sync if deal has leadId
    if (deal.leadId) {
      try {
        if (nextStage === 'requirements') {
          await leadsApi.requirementGathering(deal.leadId, 'Requirements advanced from Pipeline Board');
        } else if (nextStage === 'won') {
          await leadsApi.convert(deal.leadId);
        }
      } catch {
        // Fallback local state
      }
    }

    setDeals((prev) =>
      prev.map((d) =>
        d.id === deal.id
          ? {
              ...d,
              stage: nextStage,
              probability: nextStage === 'won' ? 100 : nextStage === 'negotiation' ? 90 : nextStage === 'proposal' ? 75 : 60,
            }
          : d
      )
    );

    notify(`⚡ Moved "${deal.company}" to ${stages.find((s) => s.key === nextStage)?.label}!`);
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeal: Deal = {
      id: `d-${Date.now()}`,
      title: newDealTitle,
      company: newDealCompany,
      contact: newDealContact,
      value: Number(newDealValue) || 60000,
      stage: newDealStage,
      probability: newDealStage === 'won' ? 100 : newDealStage === 'negotiation' ? 90 : 40,
    };
    setDeals((prev) => [newDeal, ...prev]);
    setActiveModal(null);
    setNewDealTitle('');
    setNewDealCompany('');
    setNewDealContact('');
    notify(`✓ Created pipeline opportunity for "${newDealCompany}"!`);
  };

  const totalValue = deals.reduce((acc, d) => acc + d.value, 0);
  const weightedValue = deals.reduce((acc, d) => acc + (d.value * d.probability) / 100, 0);
  const wonCount = deals.filter((d) => d.stage === 'won').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      <ActionToast
        message={notification}
        onClose={() => setNotification(null)}
        title="⚡ Status Updated:"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Commercial Deal Pipeline Board</h2>
          <p className="text-xs text-zinc-300 mt-1">
            Visual stage progression from Contact Form submission to Signed Contract & Client Project initiation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/leads">
            <Button variant="secondary" size="sm">
              <Icon name="users" className="w-3.5 h-3.5 mr-1.5" />
              Leads Table
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'new_deal' })}>
            + Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Pipeline Value"
          value={`$${totalValue.toLocaleString()}`}
          subtitle={`${deals.length} active opportunities`}
        />
        <KpiCard
          label="Weighted Forecast"
          value={`$${Math.round(weightedValue).toLocaleString()}`}
          subtitle="Probability-adjusted ARR"
          valueColor="text-[#D4AF37]"
        />
        <KpiCard
          label="Closed Won Clients"
          value={`${wonCount} Accounts`}
          subtitle="Active in Delivery Hub"
          valueColor="text-emerald-400"
        />
        <KpiCard
          label="Win Conversion Rate"
          value={`${deals.length ? Math.round((wonCount / deals.length) * 100) : 0}%`}
          subtitle="Stage velocity benchmark"
          valueColor="text-cyan-400"
        />
      </div>


      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 min-h-[550px]">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.key}
              className="bg-[#121214] border border-[#222224] rounded-xl p-3 flex flex-col space-y-3 shadow-inner"
            >
              {/* Column Header */}
              <div className="pb-2.5 border-b border-[#222224]">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-white font-mono font-bold">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-zinc-300 font-medium">
                  <span>{stage.step}</span>
                  <span className="text-white font-bold">${stageTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg bg-[#18181a] border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-all kanban-card-fx space-y-2 group shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                          {deal.company}
                        </h4>
                        <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">{deal.title}</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 whitespace-nowrap">
                        {deal.probability}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-xs">
                      <span className="text-zinc-300 text-xs font-medium">👤 {deal.contact}</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">${deal.value.toLocaleString()}</span>
                    </div>

                    {/* Action button per stage */}
                    <div className="pt-1.5 flex items-center justify-between gap-1">
                      {deal.stage === 'discovery' && (
                        <button
                          onClick={() => advanceDeal(deal)}
                          className="w-full text-center py-1.5 px-2 rounded text-xs font-medium bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border border-blue-400/40 transition-colors"
                        >
                          Scoping Call Done ➔
                        </button>
                      )}
                      {deal.stage === 'requirements' && (
                        <button
                          onClick={() => advanceDeal(deal)}
                          className="w-full text-center py-1.5 px-2 rounded text-xs font-medium bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/40 transition-colors"
                        >
                          Draft Proposal ➔
                        </button>
                      )}
                      {deal.stage === 'proposal' && (
                        <button
                          onClick={() => advanceDeal(deal)}
                          className="w-full text-center py-1.5 px-2 rounded text-xs font-medium bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-400/40 transition-colors"
                        >
                          Client Accepted ➔
                        </button>
                      )}
                      {deal.stage === 'negotiation' && (
                        <button
                          onClick={() => advanceDeal(deal)}
                          className="w-full text-center py-1.5 px-2 rounded text-xs font-bold bg-[#D4AF37] text-black hover:bg-[#e5c358] transition-colors"
                        >
                          Sign Contract ➔ Client
                        </button>
                      )}
                      {deal.stage === 'won' && (
                        <div className="w-full flex items-center justify-between text-xs pt-1">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            ✓ Active Client
                          </span>
                          <Link href="/delivery/projects" className="text-[#D4AF37] hover:text-[#f3d97d] font-semibold">
                            Delivery Hub ➔
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="p-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 text-center text-zinc-300 text-xs font-medium my-4">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Deal */}
      <Modal isOpen={activeModal?.type === 'new_deal'} onClose={() => setActiveModal(null)} title="Create Pipeline Opportunity">
        <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
          <Input label="Opportunity Title" placeholder="e.g. SOC2 Cloud Infrastructure Migration" value={newDealTitle} onChange={(e) => setNewDealTitle(e.target.value)} required />
          <Input label="Company / Account" placeholder="e.g. Apex Health Corp" value={newDealCompany} onChange={(e) => setNewDealCompany(e.target.value)} required />
          <Input label="Primary Contact" placeholder="e.g. Sarah Jenkins (CTO)" value={newDealContact} onChange={(e) => setNewDealContact(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Deal Value ($)" type="number" value={newDealValue} onChange={(e) => setNewDealValue(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Pipeline Stage</label>
              <select
                value={newDealStage}
                onChange={(e) => setNewDealStage(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="discovery">1. Inbound & Discovery</option>
                <option value="requirements">2. Scoping & Requirements</option>
                <option value="proposal">3. Proposal & SOW</option>
                <option value="negotiation">4. Contract Execution</option>
                <option value="won">5. Closed Won (Client)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Add to Board</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pipeline;
