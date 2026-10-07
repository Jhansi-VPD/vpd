import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SalesCrmPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [loading, setLoading] = useState(true);

  // Live state
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [meetings, setMeetings] = useState([]);

  // Modals & Form
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [newLead, setNewLead] = useState({
    title: '',
    contact_name: '',
    contact_email: '',
    company_name: '',
    value: 25000,
    status: 'new',
    source: 'website',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadRes, propRes, contRes, meetRes] = await Promise.all([
        supabaseRest('leads', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('proposals', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('contracts', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('meetings', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
      ]);

      setLeads(leadRes || []);
      setProposals(propRes || []);
      setContracts(contRes || []);
      setMeetings(meetRes || []);
    } catch (err) {
      console.error('Failed to load Sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('leads', {
        method: 'POST',
        body: newLead,
      });
      setModalOpen(false);
      setNewLead({
        title: '',
        contact_name: '',
        contact_email: '',
        company_name: '',
        value: 25000,
        status: 'new',
        source: 'website',
      });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    try {
      await supabaseRest('leads', {
        method: 'PATCH',
        query: `?id=eq.${leadId}`,
        body: { status: nextStatus },
      });
      await loadData();
    } catch (err) {
      alert(`Error updating lead: ${err.message}`);
    }
  };

  const totalPipelineValue = leads.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  const wonDeals = leads.filter(l => l.status === 'won').length;

  const navSections = [
    {
      title: 'Sales Management',
      items: [
        { label: 'Sales Pipeline', path: '/sales', icon: '📈' },
        { label: 'Leads & Opportunities', path: '#leads', icon: '🎯', badge: leads.length },
        { label: 'Proposals', path: '#proposals', icon: '📝', badge: proposals.length },
        { label: 'Contracts', path: '#contracts', icon: '🤝', badge: contracts.length },
        { label: 'Meetings', path: '#meetings', icon: '📅', badge: meetings.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Sales & CRM Portal" portalBadge="Revenue & Commercials" navSections={navSections}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sales & Commercial Operations</h1>
          <p className="text-xs text-zinc-400 mt-1">Lead acquisition, pipeline management, client proposals, and contractual closures.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} icon={<span>🔄</span>}>
            Refresh
          </Button>
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)} icon={<span>+</span>}>
            New Lead
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto gap-2">
        {['pipeline', 'leads', 'proposals', 'contracts', 'meetings'].map((tab) => (
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Leads"
          value={leads.length}
          trend="up"
          change="In qualification"
          icon={<span>🎯</span>}
        />
        <MetricCard
          label="Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          trend="up"
          change="Opportunity volume"
          icon={<span>💵</span>}
        />
        <MetricCard
          label="Won Contracts"
          value={contracts.length || wonDeals}
          trend="up"
          change="Deals finalized"
          icon={<span>🏆</span>}
        />
        <MetricCard
          label="Client Meetings"
          value={meetings.length}
          trend="neutral"
          change="Scheduled & held"
          icon={<span>🤝</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: PIPELINE KANBAN */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-zinc-200">Interactive Commercial Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['new', 'contacted', 'qualified', 'won'].map((statusKey) => {
                  const stageLeads = leads.filter(l => (l.status || 'new').toLowerCase() === statusKey);
                  return (
                    <div key={statusKey} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 flex flex-col">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2a2a2a]">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 capitalize">{statusKey}</span>
                        <span className="text-[10px] bg-[#222] text-[#d4af37] px-2 py-0.5 rounded-full font-bold">{stageLeads.length}</span>
                      </div>
                      <div className="space-y-2.5 flex-1">
                        {stageLeads.map((lead) => (
                          <div key={lead.id} className="p-3 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-[#d4af37]/40 transition-colors">
                            <h4 className="text-xs font-semibold text-white truncate">{lead.title || lead.company_name}</h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{lead.contact_name} • {lead.company_name}</p>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2a2a2a]/60">
                              <span className="text-xs font-mono font-bold text-[#d4af37]">${Number(lead.value || 0).toLocaleString()}</span>
                              <div className="flex gap-1">
                                {statusKey !== 'won' && (
                                  <button
                                    onClick={() => handleUpdateLeadStatus(lead.id, statusKey === 'new' ? 'contacted' : statusKey === 'contacted' ? 'qualified' : 'won')}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/25"
                                  >
                                    Advance →
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-6 text-[11px] text-zinc-600">No deals in this stage</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LEADS LIST */}
          {activeTab === 'leads' && (
            <Card
              title="Leads & Accounts Database"
              subtitle={`Total of ${leads.length} accounts recorded`}
              action={
                <Button size="sm" variant="gold" onClick={() => setModalOpen(true)}>
                  + Add Lead
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Opportunity</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Estimated Value</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {leads.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{l.title || 'Inquiry Opportunity'}</td>
                        <td className="py-3 px-4 text-zinc-300">{l.company_name || 'N/A'}</td>
                        <td className="py-3 px-4 text-zinc-400">{l.contact_name} ({l.contact_email || 'N/A'})</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">${Number(l.value || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={l.status || 'new'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: PROPOSALS */}
          {activeTab === 'proposals' && (
            <Card title="Commercial Proposals" subtitle="Issued proposals and contract drafts">
              {proposals.length === 0 ? (
                <EmptyState title="No Proposals Issued" message="Submit proposals directly from qualified lead records." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {proposals.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{p.title}</td>
                          <td className="py-3 px-4 font-mono text-[#d4af37]">${Number(p.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={p.status || 'draft'} /></td>
                          <td className="py-3 px-4 text-zinc-400">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: CONTRACTS */}
          {activeTab === 'contracts' && (
            <Card title="Client Contracts & Agreements" subtitle="Legally binding agreements signed with clients">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Contract Title</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{c.title || 'Client Service Agreement'}</td>
                        <td className="py-3 px-4 font-mono text-[#d4af37]">${Number(c.value || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={c.status || 'active'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: MEETINGS */}
          {activeTab === 'meetings' && (
            <Card title="Client Engagement Meetings" subtitle="Scheduled sales consultations and presentations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <h4 className="font-semibold text-white text-sm">{m.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{m.description || 'Sales consultation session'}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a2a] text-xs">
                      <span className="text-zinc-500">{new Date(m.scheduled_at || m.created_at).toLocaleString()}</span>
                      <StatusBadge status={m.status || 'scheduled'} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* CREATE LEAD MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Sales Lead / Opportunity">
        {formError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Deal / Opportunity Title</label>
            <input
              required
              type="text"
              value={newLead.title}
              onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Cloud Migration & DevOps Retainer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Company / Organization</label>
            <input
              required
              type="text"
              value={newLead.company_name}
              onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Acme Global Inc"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Contact Name</label>
              <input
                required
                type="text"
                value={newLead.contact_name}
                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Estimated Value ($)</label>
              <input
                required
                type="number"
                value={newLead.value}
                onChange={(e) => setNewLead({ ...newLead, value: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Contact Email</label>
            <input
              type="email"
              value={newLead.contact_email}
              onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="client@acme.com"
            />
          </div>
          <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
            Add to Pipeline
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}

