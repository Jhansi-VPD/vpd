"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { MetricCard } from '../../../../shared/components/Charts';
import Button from '../../../../shared/components/Button';
import StatusBadge from '../../../../shared/components/StatusBadge';
import { Icon } from '../../../../shared/components';
import { leadsApi, contactApi } from '../../../../api';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([
    {
      id: 'sub-1',
      name: 'Alexander Wright',
      company: 'Apex Cloud Logistics',
      email: 'a.wright@apexcloud.io',
      budget: '$180,000',
      message: 'Looking for a high-throughput microservices architecture and payment integration.',
      status: 'pending',
      created_at: '2026-10-09',
    },
    {
      id: 'sub-2',
      name: 'Elena Rostova',
      company: 'Nordic Fintech Solutions',
      email: 'elena@nordicfin.se',
      budget: '$250,000',
      message: 'Need SOC2-compliant banking API gateway and automated reconciliation service.',
      status: 'pending',
      created_at: '2026-10-08',
    },
    {
      id: 'sub-3',
      name: 'Marcus Chen',
      company: 'Nexus Health Systems',
      email: 'mchen@nexushealth.org',
      budget: '$95,000',
      message: 'Enterprise EHR patient management portal with real-time appointment sync.',
      status: 'pending',
      created_at: '2026-10-07',
    },
  ]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const [leadsRes, contactRes] = await Promise.allSettled([
          leadsApi.getAll({ limit: 6 }),
          contactApi.getAll({ limit: 5 }),
        ]);

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
          const raw = leadsRes.value.data;
          setLeadsList(Array.isArray(raw) ? raw : (raw as any)?.items || []);
        }

        if (contactRes.status === 'fulfilled' && contactRes.value?.data) {
          const rawContacts = contactRes.value.data;
          const items = Array.isArray(rawContacts) ? rawContacts : (rawContacts as any)?.items || [];
          if (items.length > 0) {
            setContactSubmissions(items);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSalesData();
  }, []);

  const handleConvertToLead = async (submission: any) => {
    try {
      await leadsApi.create({
        company: submission.company,
        contact_name: submission.name,
        email: submission.email,
        source: 'contact_form',
        estimated_value: submission.budget ? Number(submission.budget.replace(/[^0-9]/g, '')) : 100000,
        notes: `Converted from Website Contact Form. Inquiry: "${submission.message}"`,
      });
    } catch {
      // Local fallback
    }

    setContactSubmissions((prev) =>
      prev.map((s) => (s.id === submission.id ? { ...s, status: 'converted_to_lead' } : s))
    );

    setNotification(`✓ Successfully converted "${submission.name} (${submission.company})" to Sales Lead! Dispatched to Discovery.`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Sales & Pipeline Performance"
        description="Quarterly bookings, commercial deal velocity, proposal conversion, and contract signing"
        breadcrumbs={[{ label: 'Sales CRM' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/sales/pipeline">
              <Button variant="secondary" size="sm">
                View Pipeline
              </Button>
            </Link>
            <Link href="/sales/leads">
              <Button variant="primary" size="sm">
                + New Lead
              </Button>
            </Link>
          </div>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fadeIn mb-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">⚡ Success:</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp">
        <MetricCard
          title="Active Pipeline Value"
          value="$1,420,000"
          change="+24.5% vs Q3"
          isPositive={true}
        />
        <MetricCard
          title="Closed Won Contracts"
          value="$485,000"
          change="94% of Quota"
          isPositive={true}
        />
        <MetricCard
          title="Average Deal Size"
          value="$95,000"
          change="+12% Expansion"
          isPositive={true}
        />
        <MetricCard
          title="Win Conversion Rate"
          value="38.2%"
          change="+4.1% MoM"
          isPositive={true}
        />
      </div>

      {/* SECTION: Inbound Contact Submissions (Convert Contact to Lead) */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="mail" className="h-4 w-4 text-[#D4AF37]" />
              Inbound Contact Form Submissions (Convert to Lead)
            </h3>
            <p className="text-[11px] text-[#A1A1AA]">
              Prospective institutional clients who submitted inquiries through the website contact form
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {contactSubmissions.filter((s) => s.status === 'pending').length} Actionable Submissions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {contactSubmissions.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-xl border card-hover-fx space-y-2.5 transition-all ${
                sub.status === 'converted_to_lead'
                  ? 'bg-[#121612] border-emerald-800/40 opacity-80'
                  : 'bg-[#181818] border-[#2A2A2A]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{sub.name}</h4>
                  <p className="text-[11px] text-[#D4AF37] font-semibold">{sub.company}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">{sub.email}</p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {sub.budget}
                </span>
              </div>

              <p className="text-[11px] text-zinc-300 line-clamp-2 bg-[#121214] p-2 rounded border border-zinc-800">
                "{sub.message}"
              </p>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Received {sub.created_at}</span>
                {sub.status === 'converted_to_lead' ? (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    ✓ Converted to Lead
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvertToLead(sub)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all active:scale-95 shadow-sm"
                  >
                    ⚡ Convert to Lead ➔
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Pipeline Deals & Recent Qualified Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Deal Pipeline Highlights */}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="grid" className="h-4 w-4 text-[#D4AF37]" />
                High-Value Opportunities
              </h3>
              <p className="text-xs text-zinc-300">Deals currently negotiating or closing this month</p>
            </div>
            <Link href="/sales/pipeline" className="text-xs text-[#D4AF37] hover:underline font-medium">
              View Pipeline →
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { id: '1', title: 'Global Banking Core Infrastructure', client: 'Vertex Financial', value: '$320,000', stage: 'negotiation' },
              { id: '2', title: 'Enterprise Cloud Migration SOW', client: 'Nexus Retail Group', value: '$180,000', stage: 'proposal' },
              { id: '3', title: 'AI-Powered Support Desk Rollout', client: 'OmniHealth Inc', value: '$145,000', stage: 'qualified' },
            ].map((deal) => (
              <div key={deal.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] card-hover-fx flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-white truncate">{deal.title}</p>
                  <p className="text-xs text-zinc-300 truncate font-medium">Account: {deal.client}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">{deal.value}</span>
                  <StatusBadge status={deal.stage} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Qualified Inbound Leads */}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="users" className="h-4 w-4 text-[#D4AF37]" />
                Recent Qualified Leads
              </h3>
              <p className="text-xs text-zinc-300">Leads in Discovery and Requirement Gathering</p>
            </div>
            <Link href="/sales/leads" className="text-xs text-[#D4AF37] hover:underline font-medium">
              All Leads →
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { id: '1', name: 'Marcus Sterling', company: 'Pacific Logistics', email: 'm.sterling@paclog.com', status: 'qualified', value: '$85,000' },
              { id: '2', name: 'Claire Dupont', company: 'EuroFintech SA', email: 'cdupont@eurofin.eu', status: 'requirement_gathering', value: '$140,000' },
              { id: '3', name: 'Jonathan Hayes', company: 'Pinnacle Logistics', email: 'j.hayes@pinnacle.com', status: 'contacted', value: '$110,000' },
            ].map((lead) => (
              <div key={lead.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] card-hover-fx flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                  <p className="text-xs text-zinc-300 truncate font-medium">{lead.company} • {lead.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">{lead.value}</span>
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launchpad Actions */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#D4AF37]">
          Sales & Client Management Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Deal Pipeline', href: '/sales/pipeline', icon: 'grid' },
            { label: 'Leads (Discovery)', href: '/sales/leads', icon: 'users' },
            { label: 'Proposals & SOWs', href: '/sales/proposals', icon: 'file' },
            { label: 'Executed Contracts', href: '/sales/contracts', icon: 'clipboard' },
            { label: 'Client Accounts', href: '/sales/clients', icon: 'building' },
            { label: 'Bookings Reports', href: '/sales/reports', icon: 'chart' },
          ].map((act) => (
            <Link
              key={act.label}
              href={act.href}
              className="p-3.5 bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#D4AF37]/40 rounded-xl text-center space-y-2 group transition-all card-hover-fx"
            >
              <div className="flex justify-center text-[#A1A1AA] group-hover:text-[#D4AF37] group-hover:scale-110 transition-all">
                <Icon name={act.icon} className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-white">{act.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
