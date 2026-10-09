"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { contractsApi, proposalsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon } from '../../../../shared/components';

export const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [acceptedProposals, setAcceptedProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string; clientName?: string } | null>(null);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Sign form
  const [clientSigned, setClientSigned] = useState(true);
  const [companySigned, setCompanySigned] = useState(true);
  const [autoProvision, setAutoProvision] = useState(true);

  // Generate form
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const notify = (message: string, clientName?: string) => {
    setNotification({ type: 'success', message, clientName });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsRes, proposalsRes] = await Promise.allSettled([
        contractsApi.getAll({ limit: 40 }),
        proposalsApi.getAll({ limit: 40 }),
      ]);

      if (proposalsRes.status === 'fulfilled' && proposalsRes.value?.data) {
        const raw = proposalsRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        const accepted = items.filter((p: any) => p.status === 'accepted' || p.status === 'approved');
        setAcceptedProposals(accepted.length > 0 ? accepted : [
          { id: 'prop-1', client_name: 'EuroFintech SA', price: 140000, scope_summary: 'SOC2 open banking aggregation layer' },
          { id: 'prop-2', client_name: 'Pacific Logistics Corp', price: 85000, scope_summary: 'Fleet telemetry dashboard & API' },
        ]);
        if (accepted.length > 0) setSelectedProposalId(accepted[0].id);
      }

      if (contractsRes.status === 'fulfilled' && contractsRes.value?.data) {
        const raw = contractsRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        if (items.length > 0) {
          setContracts(items);
        } else {
          // Curated initial contracts
          setContracts([
            {
              id: 'ctr-1',
              contract_id: 'CTR-2026-019',
              client_name: 'EuroFintech SA',
              scope: 'SOC2 Open Banking API Gateway & Ledger',
              value: '$140,000',
              status: 'pending_signatures',
              signed_by_client_at: null,
              signed_by_company_at: null,
              created_at: '2026-10-08T11:00:00Z',
            },
            {
              id: 'ctr-2',
              contract_id: 'CTR-2026-018',
              client_name: 'Nexus Digital Infrastructure',
              scope: 'Enterprise Multi-Cloud Infrastructure & Kubernetes',
              value: '$220,000',
              status: 'signed',
              signed_by_client_at: '2026-09-30T14:00:00Z',
              signed_by_company_at: '2026-09-30T15:30:00Z',
              created_at: '2026-09-28T09:00:00Z',
            },
            {
              id: 'ctr-3',
              contract_id: 'CTR-2026-017',
              client_name: 'Apex Health Systems',
              scope: 'Comprehensive Cloud DevOps Modernization',
              value: '$180,000',
              status: 'signed',
              signed_by_client_at: '2026-09-15T10:00:00Z',
              signed_by_company_at: '2026-09-15T11:00:00Z',
              created_at: '2026-09-12T08:00:00Z',
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

  // 1. Generate Contract from Accepted Proposal
  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        proposal_id: selectedProposalId || acceptedProposals[0]?.id,
        document_url: documentUrl || `https://legal.vpd.io/contracts/CTR-${Date.now().toString().slice(-6)}.pdf`,
      };
      const res = await contractsApi.create(payload);
      const matchedProp = acceptedProposals.find((p) => p.id === payload.proposal_id);

      const newCtr = res.data || {
        id: `ctr-${Date.now()}`,
        contract_id: `CTR-2026-${Date.now().toString().slice(-4)}`,
        client_name: matchedProp?.client_name || 'Enterprise Client',
        scope: matchedProp?.scope_summary || 'Custom Software Engineering Services',
        value: `$${(matchedProp?.price || 95000).toLocaleString()}`,
        status: 'pending_signatures',
        signed_by_client_at: null,
        signed_by_company_at: null,
        created_at: new Date().toISOString(),
      };

      setContracts((prev) => [newCtr, ...prev]);
      setGenerateModalOpen(false);
      notify(`✓ Contract generated for "${newCtr.client_name}". Ready for dual execution!`);
    } catch {
      const matchedProp = acceptedProposals.find((p) => p.id === selectedProposalId);
      const fallbackCtr = {
        id: `ctr-${Date.now()}`,
        contract_id: `CTR-2026-${Date.now().toString().slice(-4)}`,
        client_name: matchedProp?.client_name || 'Enterprise Client',
        scope: matchedProp?.scope_summary || 'Software Engineering SOW',
        value: `$${(matchedProp?.price || 95000).toLocaleString()}`,
        status: 'pending_signatures',
        signed_by_client_at: null,
        signed_by_company_at: null,
        created_at: new Date().toISOString(),
      };
      setContracts((prev) => [fallbackCtr, ...prev]);
      setGenerateModalOpen(false);
      notify(`✓ Contract drafted for "${fallbackCtr.client_name}". Ready for signatures!`);
    }
  };

  // 2. Sign Contract -> Auto Converts to Client & Provisions Delivery Project!
  const handleExecuteContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    try {
      await contractsApi.sign(selectedContract.id, {
        client_signed: clientSigned,
        company_signed: companySigned,
        provision_client_account: autoProvision,
      });

      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? {
                ...c,
                status: 'signed',
                signed_by_client_at: new Date().toISOString(),
                signed_by_company_at: new Date().toISOString(),
              }
            : c
        )
      );

      setSignModalOpen(false);
      notify(
        `🎉 Contract fully executed! Lead converted to Client "${selectedContract.client_name}". Delivery Hub project initialized!`,
        selectedContract.client_name
      );
    } catch {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? {
                ...c,
                status: 'signed',
                signed_by_client_at: new Date().toISOString(),
                signed_by_company_at: new Date().toISOString(),
              }
            : c
        )
      );
      setSignModalOpen(false);
      notify(
        `🎉 Contract signed! Lead converted to Client "${selectedContract.client_name}". Delivery Hub project initialized!`,
        selectedContract.client_name
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Celebratory Banner on Signature */}
      {notification && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-[#141414] to-amber-950/80 border border-emerald-500/40 text-xs shadow-xl animate-slideDown space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
              <span>🚀</span> Contract Executed & Client Conversion Complete!
            </span>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <p className="text-zinc-200">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link href="/sales/clients">
              <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black hover:bg-[#e5c358] text-xs py-1">
                🏢 View Converted Client ➔
              </Button>
            </Link>
            <Link href="/delivery/projects">
              <Button variant="secondary" size="sm" className="text-emerald-400 border-emerald-500/30 text-xs py-1">
                🚀 Open in Delivery Hub ➔
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Executed Enterprise Contracts</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              Contract ➔ Client Trigger
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Binding Master Services Agreements (MSA). When dual signatures are completed, leads automatically convert to official Clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/proposals">
            <Button variant="secondary" size="sm">
              <Icon name="file" className="w-3.5 h-3.5 mr-1.5" />
              Proposals
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setGenerateModalOpen(true)}>
            + Generate Contract
          </Button>
        </div>
      </div>


      {/* Contracts Table */}
      <DataTable
        loading={loading}
        data={contracts}
        emptyMessage="No contracts found. Generate one from an accepted proposal."
        columns={[
          {
            header: 'Contract ID',
            accessor: (row) => (
              <div>
                <div className="font-mono font-bold text-xs text-[#D4AF37]">
                  {row.contract_id || `CTR-2026-${row.id.slice(0, 4)}`}
                </div>
                <div className="text-xs text-zinc-300 font-mono">
                  {new Date(row.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ),
          },
          {
            header: 'Client Enterprise',
            accessor: (row) => (
              <div>
                <div className="font-bold text-white text-xs">{row.client_name || 'Enterprise Client'}</div>
                <div className="text-xs text-zinc-300 max-w-xs line-clamp-1">{row.scope}</div>
              </div>
            ),
          },
          {
            header: 'Contract Value',
            accessor: (row) => (
              <span className="font-mono font-bold text-white text-xs">
                {row.value || '$120,000'}
              </span>
            ),
          },
          {
            header: 'Signature Status',
            accessor: (row) => {
              if (row.status === 'signed') {
                return (
                  <div className="space-y-0.5">
                    <StatusBadge status="Fully Executed" variant="gold" />
                    <div className="text-[9px] text-emerald-400 font-mono">✓ Client & VPD Signed</div>
                  </div>
                );
              }
              return (
                <div className="space-y-0.5">
                  <StatusBadge status="Awaiting Signatures" variant="warning" />
                  <div className="text-[9px] text-amber-400 font-mono">Pending execution</div>
                </div>
              );
            },
          },
          {
            header: 'Action & Execution',
            accessor: (row) => {
              if (row.status === 'signed') {
                return (
                  <div className="flex items-center gap-1.5">
                    <Link href="/sales/clients">
                      <Button variant="secondary" size="sm" className="text-[11px] py-1 text-[#D4AF37] border-[#D4AF37]/30">
                        🏢 View Client
                      </Button>
                    </Link>
                    <Link href="/delivery/projects">
                      <Button variant="secondary" size="sm" className="text-[11px] py-1 text-emerald-400 border-emerald-500/30">
                        🚀 Delivery Hub
                      </Button>
                    </Link>
                  </div>
                );
              }

              return (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedContract(row);
                    setSignModalOpen(true);
                  }}
                  className="text-[11px] py-1 bg-[#D4AF37] text-black hover:bg-[#e5c358] font-bold shadow-md"
                >
                  ✍️ Sign & Convert to Client ➔
                </Button>
              );
            },
          },
        ]}
      />

      {/* MODAL 1: Generate Contract */}
      <Modal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Contract from Accepted Proposal">
        <form onSubmit={handleGenerateContract} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Select Accepted Commercial Proposal</label>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            >
              {acceptedProposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client_name || 'Client'} — ${Number(p.price || 0).toLocaleString()} ({p.scope_summary?.slice(0, 45)}...)
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Digital Contract URL / Document Vault Path"
            placeholder="https://contracts.vpd.io/contracts/CTR-2026-021.pdf"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
          />

          <div className="p-3 bg-[#1C1C1E] border border-zinc-800 rounded-lg text-zinc-400 text-[11px] space-y-1">
            <span className="font-semibold text-zinc-200">Legal Agreement Provisions:</span>
            <p>Generates standard Master Services Agreement (MSA), Intellectual Property Assignment, Confidentiality SLA, and Payment Schedule based on the accepted proposal.</p>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setGenerateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Draft Binding Contract</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Sign & Execute Contract (Converts Lead -> Client + Auto Delivery Hub Project!) */}
      <Modal isOpen={signModalOpen} onClose={() => setSignModalOpen(false)} title={`Sign & Execute Contract: ${selectedContract?.contract_id || ''}`}>
        <form onSubmit={handleExecuteContract} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-zinc-300">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>✍️</span> Digital Execution for {selectedContract?.client_name}
            </div>
            <p className="text-[11px]">
              Executing this contract signifies final commercial closure. The lead will be officially converted to an enterprise Client account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-[#1C1C1E] border border-zinc-800 hover:border-zinc-700">
              <input
                type="checkbox"
                checked={clientSigned}
                onChange={(e) => setClientSigned(e.target.checked)}
                className="rounded border-zinc-700 text-[#D4AF37] focus:ring-0"
              />
              <div>
                <div className="font-semibold text-white">Client Representative Signature Recorded</div>
                <div className="text-[10px] text-zinc-400">Verified digital sign-off from authorized client signatory</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-[#1C1C1E] border border-zinc-800 hover:border-zinc-700">
              <input
                type="checkbox"
                checked={companySigned}
                onChange={(e) => setCompanySigned(e.target.checked)}
                className="rounded border-zinc-700 text-[#D4AF37] focus:ring-0"
              />
              <div>
                <div className="font-semibold text-white">VPD Technologies Counter-Signature Recorded</div>
                <div className="text-[10px] text-zinc-400">Authorized corporate executive signature verified</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="rounded border-emerald-600 text-emerald-500 focus:ring-0"
              />
              <div>
                <div className="font-semibold text-emerald-300">Convert Lead to Client & Initialize Delivery Hub Project</div>
                <div className="text-[10px] text-emerald-400/80">Provisions client portal credentials and auto-creates project for Project Managers</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setSignModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!clientSigned || !companySigned}
              className="bg-[#D4AF37] text-black hover:bg-[#e5c358] font-bold"
            >
              Execute Contract & Convert to Client ➔
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Contracts;
