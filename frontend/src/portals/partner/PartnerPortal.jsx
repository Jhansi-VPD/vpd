import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PartnerPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('partnerships');
  const [loading, setLoading] = useState(true);

  const [partners, setPartners] = useState([]);
  const [referrals, setReferrals] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [partRes, refRes] = await Promise.all([
        supabaseRest('partners', { query: '?select=*&limit=20' }).catch(() => []),
        supabaseRest('leads', { query: '?select=*&limit=10' }).catch(() => []),
      ]);

      setPartners(partRes || []);
      setReferrals(refRes || []);
    } catch (err) {
      console.error('Failed to load partner records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const navSections = [
    {
      title: 'Partner Alliance',
      items: [
        { label: 'Alliances & Status', path: '/partner', icon: '🤝', badge: partners.length },
        { label: 'Commercial Referrals', path: '#referrals', icon: '💼', badge: referrals.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Partner Portal" portalBadge="Alliance & Channel Ecosystem" navSections={navSections}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Partner & Alliance Portal</h1>
          <p className="text-xs text-zinc-400 mt-1">Ecosystem collaboration, client referral commissions, and co-selling initiatives.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} icon={<span>🔄</span>}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto gap-2">
        {['partnerships', 'referrals'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Partner Alliances"
          value={partners.length || 1}
          trend="up"
          change="Verified tier"
          icon={<span>🤝</span>}
        />
        <MetricCard
          label="Referred Opportunities"
          value={referrals.length}
          trend="up"
          change="Co-selling deals"
          icon={<span>💼</span>}
        />
        <MetricCard
          label="Commission Status"
          value="Active (15%)"
          trend="up"
          change="Tier 1 Global"
          icon={<span>💰</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-28" />
      ) : (
        <>
          {activeTab === 'partnerships' && (
            <Card title="Alliance Details" subtitle="Your organizational accreditation with VPD Technologies">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">{p.name || 'Global Alliance Partner'}</h4>
                      <StatusBadge status="active" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{p.description || 'Enterprise Technology Integration Partner'}</p>
                    <div className="mt-3 text-[11px] text-[#d4af37]">Tier: Strategic Global Alliance</div>
                  </div>
                ))}
                {partners.length === 0 && (
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">TechPartner Global</h4>
                      <StatusBadge status="active" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Enterprise Strategic Integration Partner</p>
                    <div className="mt-3 text-[11px] text-[#d4af37]">Tier: Certified Gold Partner</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'referrals' && (
            <Card title="Referrals & Co-Selling Opportunities" subtitle="Clients and projects initiated through partner referrals">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Opportunity</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {referrals.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{r.title || r.company_name}</td>
                        <td className="py-3 px-4 font-mono text-[#d4af37]">${Number(r.value || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={r.status || 'qualified'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </PortalLayout>
  );
}

