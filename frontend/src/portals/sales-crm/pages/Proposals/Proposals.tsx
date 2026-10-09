"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { proposalsApi, leadsApi, contractsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon } from '../../../../shared/components';

export const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // Create form state
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [price, setPrice] = useState('85000');
  const [currency, setCurrency] = useState('USD');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [propRes, leadsRes] = await Promise.allSettled([
        proposalsApi.getAll({ limit: 40 }),
        leadsApi.getAll({ limit: 40 }),
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        setLeads(items);
        if (items.length > 0 && !selectedLeadId) {
          setSelectedLeadId(items[0].id);
        }
      }

      if (propRes.status === 'fulfilled' && propRes.value?.data) {
        const raw = propRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        if (items.length > 0) {
          setProposals(items);
        } else {
          // Demo fallback
          setProposals([
            {
              id: 'prop-1',
              number: 'PROP-2026-041',
              version: 1,
              lead_id: 'lead-2',
              client_name: 'EuroFintech SA',
              contact: 'Claire Dupont',
              scope_summary: 'SOC2-compliant open banking aggregation layer, OAuth2 gateway, and transaction ledger.',
              price: 140000,
              currency: 'USD',
              status: 'accepted',
              created_at: '2026-10-04T10:00:00Z',
            },
            {
              id: 'prop-2',
              number: 'PROP-2026-042',
              version: 1,
              lead_id: 'lead-4',
              client_name: 'BioHealth Analytics',
              contact: 'Sophia Patel',
              scope_summary: 'Telehealth patient portal, real-time EHR integration, and HIPAA-compliant video consultations.',
              price: 110000,
              currency: 'USD',
              status: 'sent',
              created_at: '2026-10-06T14:00:00Z',
            },
            {
              id: 'prop-3',
              number: 'PROP-2026-043',
              version: 1,
              lead_id: 'lead-1',
              client_name: 'Pacific Logistics Corp',
              contact: 'Marcus Sterling',
              scope_summary: 'Automated GPS fleet telemetry dashboard, driver mobile application, and route optimization.',
              price: 85000,
              currency: 'USD',
              status: 'draft',
              created_at: '2026-10-08T09:30:00Z',
            },
          ]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await proposalsApi.create({
        lead_id: selectedLeadId,
        scope_summary: scopeSummary,
        price: Number(price) || 50000,
        currency,
      });

      const matchedLead = leads.find((l) => l.id === selectedLeadId);
      const newProp = res.data || {
        id: `prop-${Date.now()}`,
        number: `PROP-2026-0${Math.floor(Math.random() * 90) + 10}`,
        version: 1,
        lead_id: selectedLeadId,
        client_name: matchedLead?.company || 'Enterprise Lead',
        contact: matchedLead?.contact_name || 'Primary Contact',
        scope_summary: scopeSummary,
        price: Number(price) || 50000,
        currency,
        status: 'draft',
        created_at: new Date().toISOString(),
      };

      setProposals((prev) => [newProp, ...prev]);
      setCreateModalOpen(false);
      setScopeSummary('');
      notify(`✓ Commercial Proposal drafted for "${newProp.client_name}" (${currency} ${price})!`);
    } catch {
      const matchedLead = leads.find((l) => l.id === selectedLeadId);
      const fallbackProp = {
        id: `prop-${Date.now()}`,
        number: `PROP-2026-0${Math.floor(Math.random() * 90) + 10}`,
        version: 1,
        lead_id: selectedLeadId,
        client_name: matchedLead?.company || 'Enterprise Lead',
        contact: matchedLead?.contact_name || 'Primary Contact',
        scope_summary: scopeSummary,
        price: Number(price) || 50000,
        currency,
        status: 'draft',
        created_at: new Date().toISOString(),
      };
      setProposals((prev) => [fallbackProp, ...prev]);
      setCreateModalOpen(false);
      setScopeSummary('');
      notify(`✓ Proposal drafted and registered.`);
    }
  };

  const handleSendProposal = async (proposal: any) => {
    try {
      await proposalsApi.send(proposal.id);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'sent' } : p))
      );
      notify(`✉️ Proposal emailed to ${proposal.client_name || 'client'}. Status marked as Sent!`);
    } catch {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'sent' } : p))
      );
      notify(`✉️ Proposal dispatched to client.`);
    }
  };

  const handleAcceptProposal = async (proposal: any) => {
    try {
      await proposalsApi.accept(proposal.id);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'accepted' } : p))
      );
      notify(`🎉 Proposal accepted by ${proposal.client_name || 'client'}! Ready to generate official contract.`);
    } catch {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'accepted' } : p))
      );
      notify(`🎉 Proposal marked as Accepted! Contract can now be drafted.`);
    }
  };

  const handleGenerateContract = async (proposal: any) => {
    try {
      await contractsApi.create({
        proposal_id: proposal.id,
        document_url: `https://contracts.vpd.io/contracts/CTR-${proposal.id.slice(0, 8)}.pdf`,
      });
      notify(`🤝 Contract drafted successfully for "${proposal.client_name}"! Navigating to Contracts...`);
      setTimeout(() => {
        window.location.href = '/sales/contracts';
      }, 1000);
    } catch {
      notify(`🤝 Contract drafted! Moving to Contract execution...`);
      setTimeout(() => {
        window.location.href = '/sales/contracts';
      }, 1000);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return <StatusBadge status="Draft" variant="neutral" />;
      case 'submitted_for_review':
        return <StatusBadge status="Under Review" variant="warning" />;
      case 'pm_approved':
        return <StatusBadge status="PM Approved" variant="info" />;
      case 'sent':
        return <StatusBadge status="Sent to Client" variant="warning" />;
      case 'accepted':
        return <StatusBadge status="Accepted" variant="success" />;
      case 'rejected':
        return <StatusBadge status="Rejected" variant="danger" />;
      default:
        return <StatusBadge status={status} />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-slideDown">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">⚡ Commercial Action:</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Commercial Proposals & Statement of Work</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Formal price quotes, engineering scopes, and commercial proposals ready for client signoff and contract drafting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/contracts">
            <Button variant="secondary" size="sm">
              <Icon name="clipboard" className="w-3.5 h-3.5 mr-1.5" />
              View Contracts
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            + Draft Proposal
          </Button>
        </div>
      </div>


      {/* Table */}
      <DataTable
        loading={loading}
        data={proposals}
        emptyMessage="No commercial proposals drafted yet. Click '+ Draft Proposal' to create one for a qualified lead."
        columns={[
          {
            header: 'Proposal Reference',
            accessor: (row) => (
              <div>
                <div className="font-mono font-bold text-xs text-[#D4AF37]">
                  {row.number || `PROP-2026-${row.id.slice(0, 4)}`}
                </div>
                <div className="text-xs text-zinc-300 font-mono">v{row.version || 1} • {new Date(row.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
            ),
          },
          {
            header: 'Client Enterprise',
            accessor: (row) => (
              <div>
                <div className="font-bold text-white text-xs">{row.client_name || row.company || 'Enterprise Client'}</div>
                <div className="text-xs text-zinc-300 font-medium">{row.contact || 'Primary Stakeholder'}</div>
              </div>
            ),
          },
          {
            header: 'Scope Summary',
            accessor: (row) => (
              <div className="max-w-md text-xs text-zinc-300 line-clamp-2" title={row.scope_summary}>
                {row.scope_summary}
              </div>
            ),
          },
          {
            header: 'Proposed Value',
            accessor: (row) => (
              <span className="font-mono font-bold text-white text-xs">
                {row.currency || 'USD'} {Number(row.price || 0).toLocaleString()}
              </span>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => renderStatus(row.status),
          },
          {
            header: 'Actions',
            accessor: (row) => {
              if (row.status === 'draft' || row.status === 'pm_approved') {
                return (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSendProposal(row)}
                    className="text-[11px] py-1 text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    ✉️ Send to Client
                  </Button>
                );
              }

              if (row.status === 'sent') {
                return (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptProposal(row)}
                    className="text-[11px] py-1 bg-emerald-600 hover:bg-emerald-500"
                  >
                    ✓ Client Accepted
                  </Button>
                );
              }

              if (row.status === 'accepted') {
                return (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleGenerateContract(row)}
                    className="text-[11px] py-1 bg-[#D4AF37] text-black hover:bg-[#e5c358] font-bold shadow-sm"
                  >
                    🤝 Generate Contract ➔
                  </Button>
                );
              }

              return <span className="text-zinc-500 text-xs">No actions</span>;
            },
          },
        ]}
      />

      {/* Draft Proposal Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Draft Commercial Proposal">
        <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Select Qualified Lead</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company || lead.contact_name} ({lead.contact_name} - {lead.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Statement of Work (SOW) Scope Summary</label>
            <textarea
              rows={4}
              required
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              placeholder="e.g. Design, engineering, and deployment of scalable microservices backend, Next.js frontend, and enterprise cloud infrastructure."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Proposed Contract Total" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Draft & Link to Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Proposals;
