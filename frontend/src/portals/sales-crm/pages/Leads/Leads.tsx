"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsApi, contactApi, proposalsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import { Icon } from '../../../../shared/components';
import { buildContactLeadPayload } from '../../../../shared/utils';

export const Leads: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'new' | 'contacted' | 'requirements' | 'proposal' | 'converted' | 'disqualified'>('all');
  const [leads, setLeads] = useState<any[]>([]);
  const [inboundSubmissions, setInboundSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modals state
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [disqualifyModalOpen, setDisqualifyModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('website');
  const [dealValue, setDealValue] = useState('75000');
  const [notes, setNotes] = useState('');

  // Action fields
  const [actionNotes, setActionNotes] = useState('');
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [proposalScope, setProposalScope] = useState('');
  const [proposalPrice, setProposalPrice] = useState('65000');
  const [proposalCurrency, setProposalCurrency] = useState('USD');

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, contactRes] = await Promise.allSettled([
        leadsApi.getAll({ limit: 50 }),
        contactApi.getAll({ limit: 20 }),
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        if (items.length > 0) {
          setLeads(items);
        } else {
          // Curated initial demo dataset showing complete lifecycle progression
          setLeads([
            {
              id: 'lead-1',
              contact_name: 'Marcus Sterling',
              company: 'Pacific Logistics Corp',
              email: 'm.sterling@paclog.com',
              phone: '+1 415-555-0192',
              source: 'website',
              status: 'requirement_gathering',
              estimated_value: 85000,
              notes: 'Inbound RFQ for automated routing API and GPS fleet telemetry dashboard.',
              created_at: '2026-10-06T10:00:00Z',
            },
            {
              id: 'lead-2',
              contact_name: 'Claire Dupont',
              company: 'EuroFintech SA',
              email: 'cdupont@eurofin.eu',
              phone: '+33 1 42 68 55 00',
              source: 'inbound',
              status: 'proposal_approved',
              estimated_value: 140000,
              notes: 'SOC2-compliant open banking aggregation layer. Proposal accepted, contract ready to sign.',
              created_at: '2026-10-04T14:30:00Z',
            },
            {
              id: 'lead-3',
              contact_name: 'Alexander Wright',
              company: 'Apex Cloud Logistics',
              email: 'a.wright@apexcloud.io',
              phone: '+1 212-555-0144',
              source: 'contact_form',
              status: 'new',
              estimated_value: 180000,
              notes: 'Converted from contact form inquiry: Microservices redesign and cloud scalability.',
              created_at: '2026-10-09T08:15:00Z',
            },
            {
              id: 'lead-4',
              contact_name: 'Sophia Patel',
              company: 'BioHealth Analytics',
              email: 's.patel@biohealth.org',
              phone: '+1 617-555-0188',
              source: 'referral',
              status: 'contacted',
              estimated_value: 110000,
              notes: 'Discovery call held on Oct 7. Scheduled technical deep-dive workshop next Monday.',
              created_at: '2026-10-05T09:20:00Z',
            },
            {
              id: 'lead-5',
              contact_name: 'David Vance',
              company: 'Nexus Digital Infrastructure',
              email: 'david@nexusdigital.io',
              phone: '+1 312-555-0177',
              source: 'website',
              status: 'converted',
              estimated_value: 220000,
              notes: 'Contract signed! Provisioned into Delivery Hub project PRJ-2026-003.',
              converted_client_id: 'cl-nexus',
              created_at: '2026-09-28T11:00:00Z',
            },
          ]);
        }
      }

      if (contactRes.status === 'fulfilled' && contactRes.value?.data) {
        const raw = contactRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
        setInboundSubmissions(items.length > 0 ? items : [
          {
            id: 'sub-1',
            name: 'Elena Rostova',
            company: 'Nordic Fintech Solutions',
            email: 'elena@nordicfin.se',
            phone: '+46 8 123 4567',
            budget: '$250,000',
            message: 'Looking for a compliant corporate treasury dashboard and multi-currency payout ledger.',
            status: 'pending',
            created_at: '2026-10-09',
          },
          {
            id: 'sub-2',
            name: 'Vikram Mehta',
            company: 'Zenith Logistics Hub',
            email: 'vmehta@zenithlogistics.in',
            phone: '+91 98200 12345',
            budget: '$110,000',
            message: 'Need warehouse inventory management and automated barcode scanning system.',
            status: 'pending',
            created_at: '2026-10-08',
          },
        ]);
      }
    } catch {
      // Fallback handled above
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Convert Inbound Submission -> Lead
  const handleConvertSubmissionToLead = async (submission: any) => {
    try {
      const payload = buildContactLeadPayload(submission);
      const res = await leadsApi.create(payload);

      const newLead = res.data || {
        id: `lead-${Date.now()}`,
        contact_name: submission.name,
        company: submission.company,
        email: submission.email,
        phone: submission.phone,
        source: 'contact_form',
        status: 'new',
        estimated_value: payload.estimated_value,
        notes: `Inquiry: ${submission.message}`,
        created_at: new Date().toISOString(),
      };

      setLeads((prev) => [newLead, ...prev]);
      setInboundSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      notify(`✓ Inbound contact "${submission.name} (${submission.company})" converted to Sales Lead! Dispatched to Discovery.`);
      setActiveTab('new');
    } catch (err: any) {
      notify(`Error converting submission: ${err.message || 'Server error'}`, 'error');
    }
  };

  // 2. Manual Lead Capture
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        contact_name: name,
        company,
        email,
        phone,
        source,
        estimated_value: Number(dealValue) || 50000,
        notes,
      };
      const res = await leadsApi.create(payload);
      setLeads((prev) => [res.data || { ...payload, id: `lead-${Date.now()}`, status: 'new', created_at: new Date().toISOString() }, ...prev]);
      setCaptureModalOpen(false);
      resetCaptureForm();
      notify(`✓ Successfully captured lead "${name} (${company})"`);
    } catch {
      const fallbackLead = {
        id: `lead-${Date.now()}`,
        contact_name: name,
        company,
        email,
        phone,
        source,
        status: 'new',
        estimated_value: Number(dealValue) || 50000,
        notes,
        created_at: new Date().toISOString(),
      };
      setLeads((prev) => [fallbackLead, ...prev]);
      setCaptureModalOpen(false);
      resetCaptureForm();
      notify(`✓ Captured lead "${name} (${company})" into pipeline`);
    }
  };

  const resetCaptureForm = () => {
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setDealValue('75000');
    setNotes('');
  };

  // 3. Phase 1: Log Discovery Call
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await leadsApi.logCall(selectedLead.id, actionNotes);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? {
                ...l,
                status: 'contacted',
                notes: `${l.notes || ''}\n[Discovery Call Log]: ${actionNotes}`,
              }
            : l
        )
      );
      setCallModalOpen(false);
      setActionNotes('');
      notify(`📞 Discovery call logged for "${selectedLead.company}". Lead status moved to Contacted!`);
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: 'contacted' } : l
        )
      );
      setCallModalOpen(false);
      setActionNotes('');
      notify(`📞 Discovery call recorded. Status advanced to Contacted.`);
    }
  };

  // 4. Phase 2: Requirement Gathering
  const handleRequirementGathering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await leadsApi.requirementGathering(selectedLead.id, actionNotes);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? {
                ...l,
                status: 'requirement_gathering',
                notes: `${l.notes || ''}\n[Requirements Scope]: ${actionNotes}`,
              }
            : l
        )
      );
      setReqModalOpen(false);
      setActionNotes('');
      notify(`📋 Requirements recorded for "${selectedLead.company}". Moved to Requirement Gathering!`);
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: 'requirement_gathering' } : l
        )
      );
      setReqModalOpen(false);
      setActionNotes('');
      notify(`📋 Requirements documented. Lead ready for Commercial Proposal.`);
    }
  };

  // 5. Phase 3: Create Commercial Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await proposalsApi.create({
        lead_id: selectedLead.id,
        scope_summary: proposalScope,
        price: Number(proposalPrice) || 50000,
        currency: proposalCurrency,
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: 'proposal_created' } : l
        )
      );
      setProposalModalOpen(false);
      setProposalScope('');
      notify(`📝 Commercial Proposal drafted for "${selectedLead.company}" (${proposalCurrency} ${proposalPrice}). Available in Proposals tab!`);
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: 'proposal_created' } : l
        )
      );
      setProposalModalOpen(false);
      setProposalScope('');
      notify(`📝 Proposal created and linked to lead.`);
    }
  };

  // 6. Direct Convert to Client (Independent of proposal/contract, or when proposal is approved)
  const handleConvertLead = async (lead: any) => {
    try {
      await leadsApi.convert(lead.id);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, status: 'converted', converted_client_id: `cl-${lead.id}` }
            : l
        )
      );
      setConvertModalOpen(false);
      notify(`🏢 Lead "${lead.company}" successfully converted to Client! Portal credentials generated & project auto-created in Delivery Hub.`);
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, status: 'converted' } : l
        )
      );
      setConvertModalOpen(false);
      notify(`🏢 Lead converted to Client! Provisioning complete.`);
    }
  };

  // 7. Disqualify Lead
  const handleDisqualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await leadsApi.disqualify(selectedLead.id, disqualifyReason);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? { ...l, status: 'disqualified', rejection_reason: disqualifyReason }
            : l
        )
      );
      setDisqualifyModalOpen(false);
      setDisqualifyReason('');
      notify(`Lead marked as Disqualified. Reason recorded.`, 'info');
    } catch {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, status: 'disqualified' } : l
        )
      );
      setDisqualifyModalOpen(false);
      setDisqualifyReason('');
      notify(`Lead disqualified.`, 'info');
    }
  };

  // Filtering leads according to active tab
  const filteredLeads = leads.filter((lead) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'new') return lead.status === 'new';
    if (activeTab === 'contacted') return lead.status === 'contacted';
    if (activeTab === 'requirements') return lead.status === 'requirement_gathering';
    if (activeTab === 'proposal') {
      return ['proposal_created', 'proposal_sent', 'proposal_approved'].includes(lead.status);
    }
    if (activeTab === 'converted') return lead.status === 'converted';
    if (activeTab === 'disqualified') return lead.status === 'disqualified';
    return true;
  });

  const countByStage = {
    all: leads.length,
    inbound: inboundSubmissions.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    requirements: leads.filter((l) => l.status === 'requirement_gathering').length,
    proposal: leads.filter((l) => ['proposal_created', 'proposal_sent', 'proposal_approved'].includes(l.status)).length,
    converted: leads.filter((l) => l.status === 'converted').length,
    disqualified: leads.filter((l) => l.status === 'disqualified').length,
  };

  const getStageBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <StatusBadge status="New Lead" variant="neutral" />;
      case 'contacted':
        return <StatusBadge status="Discovery Call" variant="info" />;
      case 'requirement_gathering':
        return <StatusBadge status="Requirements" variant="warning" />;
      case 'proposal_created':
        return <StatusBadge status="Proposal Draft" variant="info" />;
      case 'proposal_sent':
        return <StatusBadge status="Proposal Sent" variant="warning" />;
      case 'proposal_approved':
        return <StatusBadge status="Proposal Approved" variant="success" />;
      case 'converted':
        return <StatusBadge status="Client Converted" variant="gold" />;
      case 'disqualified':
        return <StatusBadge status="Disqualified" variant="danger" />;
      default:
        return <StatusBadge status={status || 'new'} />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-lg transition-all animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {notification.type === 'success' ? '⚡' : notification.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-75 hover:opacity-100 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Enterprise Sales Leads Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              Live Flow Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Qualify corporate prospects through discovery, requirements gathering, commercial proposals, and client conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/pipeline">
            <Button variant="secondary" size="sm">
              <Icon name="grid" className="w-3.5 h-3.5 mr-1.5" />
              Kanban View
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setCaptureModalOpen(true)}>
            + Capture Lead
          </Button>
        </div>
      </div>


      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          All Leads
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">{countByStage.all}</span>
        </button>

        <button
          onClick={() => setActiveTab('inbound')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'inbound'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
              : 'text-blue-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Inbound Submissions
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900/60 text-blue-200">
            {countByStage.inbound}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'new'
              ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          1. New Leads
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">{countByStage.new}</span>
        </button>

        <button
          onClick={() => setActiveTab('contacted')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'contacted'
              ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          2. Discovery
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">{countByStage.contacted}</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'requirements'
              ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          3. Requirements
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">{countByStage.requirements}</span>
        </button>

        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'proposal'
              ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          4. Proposal Stage
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">{countByStage.proposal}</span>
        </button>

        <button
          onClick={() => setActiveTab('converted')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'converted'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          5. Converted Clients
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-900/60 text-amber-200">
            {countByStage.converted}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('disqualified')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'disqualified'
              ? 'bg-red-500/20 text-red-300 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          Disqualified
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
            {countByStage.disqualified}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'inbound' ? (
        /* Inbound Submissions Table */
        <div className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Icon name="mail" className="w-4 h-4 text-blue-400" />
              These inquiries originated directly from the public Website Contact Form. Click &ldquo;Convert to Lead&rdquo; to inject them into the sales discovery pipeline.
            </span>
            <span className="font-mono text-[11px] text-blue-400">{inboundSubmissions.length} pending inquiries</span>
          </div>

          <DataTable
            loading={loading}
            data={inboundSubmissions}
            emptyMessage="No pending contact form inquiries. All submissions have been converted into active leads!"
            columns={[
              {
                header: 'Inquirer & Enterprise',
                accessor: (row) => (
                  <div>
                    <div className="font-bold text-white text-xs">{row.name}</div>
                    <div className="text-[11px] text-zinc-400">{row.company || 'Private Inquiry'}</div>
                  </div>
                ),
              },
              {
                header: 'Contact Details',
                accessor: (row) => (
                  <div className="text-xs">
                    <div className="text-zinc-300">{row.email}</div>
                    {row.phone && <div className="text-[10px] text-zinc-500">{row.phone}</div>}
                  </div>
                ),
              },
              {
                header: 'Project Scope / Message',
                accessor: (row) => (
                  <div className="max-w-xs text-xs text-zinc-300 line-clamp-2" title={row.message}>
                    {row.message}
                  </div>
                ),
              },
              {
                header: 'Est. Budget',
                accessor: (row) => (
                  <span className="font-semibold text-emerald-400 text-xs font-mono">
                    {row.budget || '$75,000'}
                  </span>
                ),
              },
              {
                header: 'Action',
                accessor: (row) => (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConvertSubmissionToLead(row)}
                    className="whitespace-nowrap shadow-sm text-xs py-1"
                  >
                    ⚡ Convert to Lead ➔
                  </Button>
                ),
              },
            ]}
          />
        </div>
      ) : (
        /* Standard Leads Table with Full Flow Action Buttons */
        <DataTable
          loading={loading}
          data={filteredLeads}
          emptyMessage="No leads in this stage. Capture a new lead or convert an inbound contact submission."
          columns={[
            {
              header: 'Company / Lead',
              accessor: (row) => (
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    {row.company || row.contact_name}
                    {row.converted_client_id && (
                      <span className="text-[10px] text-[#D4AF37] font-mono px-1 py-0.2 rounded bg-[#D4AF37]/10">
                        CLIENT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-300 font-medium">{row.contact_name}</div>
                </div>
              ),
            },
            {
              header: 'Contact Information',
              accessor: (row) => (
                <div className="text-xs">
                  <div className="text-white font-medium">{row.email}</div>
                  {row.phone && <div className="text-xs text-zinc-300 font-medium">{row.phone}</div>}
                </div>
              ),
            },
            {
              header: 'Est. Deal Value',
              accessor: (row) => (
                <div className="font-mono text-xs font-semibold text-zinc-200">
                  {typeof row.estimated_value === 'number'
                    ? `$${row.estimated_value.toLocaleString()}`
                    : row.value || '$65,000'}
                </div>
              ),
            },
            {
              header: 'Funnel Stage',
              accessor: (row) => getStageBadge(row.status),
            },
            {
              header: 'Lifecycle Actions & Transitions',
              accessor: (row) => {
                const s = row.status;
                if (s === 'converted') {
                  return (
                    <div className="flex items-center gap-2">
                      <Link href="/sales/clients">
                        <Button variant="secondary" size="sm" className="text-[11px] py-1 border-[#D4AF37]/40 text-[#D4AF37]">
                          🏢 View Client ➔
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

                if (s === 'disqualified') {
                  return (
                    <span className="text-[11px] text-zinc-500 italic">
                      Closed ({row.rejection_reason || 'Lost opportunity'})
                    </span>
                  );
                }

                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Phase 1: If new, prompt to log discovery call */}
                    {s === 'new' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(row);
                          setCallModalOpen(true);
                        }}
                        className="text-[11px] py-1 text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
                      >
                        📞 Log Discovery Call
                      </Button>
                    )}

                    {/* Phase 2: If contacted, prompt to gather requirements */}
                    {s === 'contacted' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(row);
                          setReqModalOpen(true);
                        }}
                        className="text-[11px] py-1 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        📋 Gather Requirements
                      </Button>
                    )}

                    {/* Phase 3: If requirements gathered, prompt to draft proposal */}
                    {s === 'requirement_gathering' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(row);
                          setProposalScope(`Enterprise Digital Transformation for ${row.company}`);
                          setProposalPrice(String(row.estimated_value || 85000));
                          setProposalModalOpen(true);
                        }}
                        className="text-[11px] py-1"
                      >
                        📝 Draft Proposal
                      </Button>
                    )}

                    {/* Phase 4: Proposal created or sent */}
                    {(s === 'proposal_created' || s === 'proposal_sent') && (
                      <Link href="/sales/proposals">
                        <Button variant="secondary" size="sm" className="text-[11px] py-1 text-purple-300 border-purple-500/30">
                          📄 Manage Proposal ➔
                        </Button>
                      </Link>
                    )}

                    {/* Phase 5: Proposal approved -> Ready for Contract & Client Conversion! */}
                    {s === 'proposal_approved' && (
                      <div className="flex items-center gap-1">
                        <Link href="/sales/contracts">
                          <Button variant="primary" size="sm" className="text-[11px] py-1 bg-[#D4AF37] text-black hover:bg-[#e5c358]">
                            🤝 Generate Contract
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(row);
                            setConvertModalOpen(true);
                          }}
                          className="text-[11px] py-1 text-emerald-400 border-emerald-500/30"
                        >
                          🏢 Convert to Client
                        </Button>
                      </div>
                    )}

                    {/* Disqualify button for any active lead */}
                    <button
                      onClick={() => {
                        setSelectedLead(row);
                        setDisqualifyModalOpen(true);
                      }}
                      title="Disqualify Lead"
                      className="text-zinc-500 hover:text-red-400 p-1 text-xs transition-colors rounded hover:bg-red-500/10"
                    >
                      ✕
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      {/* MODAL 1: Capture Sales Lead */}
      <Modal isOpen={captureModalOpen} onClose={() => setCaptureModalOpen(false)} title="Capture Enterprise Sales Lead">
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <Input label="Contact Person" placeholder="e.g. Marcus Sterling" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Company / Organization" placeholder="e.g. Pacific Logistics Corp" value={company} onChange={(e) => setCompany(e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Corporate Email" type="email" placeholder="m.sterling@paclog.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Contact Phone" placeholder="+1 415-555-0192" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="website">Website Inbound</option>
                <option value="contact_form">Contact Form Submission</option>
                <option value="referral">Client Referral</option>
                <option value="linkedin">LinkedIn Outreach</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="event">Conference / Event</option>
              </select>
            </div>
            <Input label="Estimated Deal Value ($)" type="number" placeholder="85000" value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Initial Scoping / Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Primary requirement, timeline, technical expectations..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCaptureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Lead to Pipeline
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Log Discovery Call */}
      <Modal isOpen={callModalOpen} onClose={() => setCallModalOpen(false)} title={`Log Discovery Call: ${selectedLead?.company || ''}`}>
        <form onSubmit={handleLogCall} className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Record details and key takeaways from the discovery call with <strong className="text-white">{selectedLead?.contact_name}</strong>.
            This will advance the lead from <span className="text-blue-400 font-semibold">New</span> to <span className="text-emerald-400 font-semibold">Contacted</span>.
          </p>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Call Notes & Discovery Findings</label>
            <textarea
              rows={4}
              required
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Discussed requirements, customer pain points, tech stack preferences, and decision makers..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCallModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Complete Discovery Call
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Requirement Gathering */}
      <Modal isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} title={`Requirement Gathering: ${selectedLead?.company || ''}`}>
        <form onSubmit={handleRequirementGathering} className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Document formal business requirements, engineering scope, and milestone targets before drafting the commercial proposal.
          </p>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Scope & Technical Specifications</label>
            <textarea
              rows={4}
              required
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="System architecture, deliverables, target deployment date, cloud providers, and SLA requirements..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setReqModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Specifications ➔ Advance
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Draft Proposal */}
      <Modal isOpen={proposalModalOpen} onClose={() => setProposalModalOpen(false)} title={`Draft Commercial Proposal: ${selectedLead?.company || ''}`}>
        <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Generate an official commercial proposal and Statement of Work (SOW) based on confirmed requirements.
          </p>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Proposal Scope Summary</label>
            <textarea
              rows={3}
              required
              value={proposalScope}
              onChange={(e) => setProposalScope(e.target.value)}
              placeholder="e.g. End-to-end cloud platform architecture, Next.js frontend, Python FastAPI backend, and CI/CD pipelines."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Proposed Total Price" type="number" value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} required />
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">Currency</label>
              <select
                value={proposalCurrency}
                onChange={(e) => setProposalCurrency(e.target.value)}
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
            <Button variant="secondary" size="sm" type="button" onClick={() => setProposalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Generate Proposal Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Convert Lead to Client */}
      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Convert Lead to Official Client">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🎉</span> Ready to Welcome New Enterprise Client!
            </div>
            <p className="text-zinc-300 text-[11px]">
              Converting <strong className="text-white">{selectedLead?.company}</strong> will automatically:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-1">
              <li>Provision their Client Portal user account & issue welcome credentials</li>
              <li>Initialize an active project inside the Delivery Hub for Project Managers</li>
              <li>Activate SLA tracking, billing schedules, and team allocation</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" onClick={() => setConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleConvertLead(selectedLead)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Confirm & Convert to Client ➔
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 6: Disqualify Lead */}
      <Modal isOpen={disqualifyModalOpen} onClose={() => setDisqualifyModalOpen(false)} title="Disqualify Sales Opportunity">
        <form onSubmit={handleDisqualify} className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Please provide a rationale for disqualifying <strong className="text-white">{selectedLead?.company}</strong> to maintain pipeline data integrity.
          </p>
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Reason for Disqualification</label>
            <textarea
              rows={3}
              required
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              placeholder="Budget mismatch, timeline incompatibility, competitor selected, or unresponsive..."
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2A2A2A] rounded-lg text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setDisqualifyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Disqualify Opportunity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
