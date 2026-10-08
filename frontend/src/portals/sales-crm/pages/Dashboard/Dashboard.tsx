"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { MetricCard } from '../../../../shared/components/Charts';
import Button from '../../../../shared/components/Button';
import StatusBadge from '../../../../shared/components/StatusBadge';
import { Icon } from '../../../../shared/components';
import { leadsApi } from '../../../../api';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leadsList, setLeadsList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const res = await leadsApi.getAll({ limit: 6 }).catch(() => ({ data: [] }));
        if (res?.data) {
          setLeadsList(Array.isArray(res.data) ? res.data : []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSalesData();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Sales & Pipeline Performance"
        description="Quarterly bookings, weighted opportunity values, active deal velocity, and conversion ratios"
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

      {/* Top Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Pipeline Value"
          value="$1,420,000"
          change="+24.5% vs Q3"
          isPositive={true}
        />
        <MetricCard
          title="Closed Won (Q4)"
          value="$380,000"
          change="84% of Quota"
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

      {/* Two Column Grid: Pipeline Deals & Recent Qualified Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Pipeline Highlights */}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="grid" className="h-4 w-4 text-[#D4AF37]" />
                High-Value Opportunities
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Deals currently negotiating or closing this month</p>
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
              <div key={deal.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-white truncate">{deal.title}</p>
                  <p className="text-[10px] text-[#71717A] truncate">Account: {deal.client}</p>
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
                Recent Inbound Leads
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Inbound inquiries awaiting initial SDR discovery call</p>
            </div>
            <Link href="/sales/leads" className="text-xs text-[#D4AF37] hover:underline font-medium">
              All Leads →
            </Link>
          </div>

          <div className="space-y-2.5">
            {leadsList.length === 0 ? (
              [
                { id: '1', name: 'Jonathan Hayes', company: 'Pinnacle Logistics', email: 'j.hayes@pinnacle.com', source: 'Website Demo' },
                { id: '2', name: 'Samantha Wu', company: 'Nova Payments', email: 'samantha@novapay.io', source: 'LinkedIn Inbound' },
                { id: '3', name: 'David Mercer', company: 'Aegis Security Solutions', email: 'david.m@aegis-sec.com', source: 'Partner Referral' },
              ].map((lead) => (
                <div key={lead.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                    <p className="text-[10px] text-[#71717A] truncate">{lead.company} • {lead.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2A2A2A] text-zinc-300 shrink-0">
                    {lead.source}
                  </span>
                </div>
              ))
            ) : (
              leadsList.slice(0, 4).map((lead) => (
                <div key={lead.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-white truncate">{lead.name || lead.contact_name}</p>
                    <p className="text-[10px] text-[#71717A] truncate">{lead.company_name || lead.email}</p>
                  </div>
                  <StatusBadge status={lead.status || 'new'} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Launchpad Actions */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#D4AF37]">
          Sales Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Deal Pipeline', href: '/sales/pipeline', icon: 'grid' },
            { label: 'Leads Directory', href: '/sales/leads', icon: 'users' },
            { label: 'Proposals', href: '/sales/proposals', icon: 'file' },
            { label: 'Contracts', href: '/sales/contracts', icon: 'clipboard' },
            { label: 'Accounts', href: '/sales/clients', icon: 'building' },
            { label: 'Sales Reports', href: '/sales/reports', icon: 'chart' },
          ].map((act) => (
            <Link
              key={act.label}
              href={act.href}
              className="p-3.5 bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#D4AF37]/40 rounded-xl text-center space-y-2 group transition-all"
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
