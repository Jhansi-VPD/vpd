import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ClientPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);

  // Client records
  const [myProjects, setMyProjects] = useState([]);
  const [myInvoices, setMyInvoices] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [myContracts, setMyContracts] = useState([]);

  // Support Ticket Modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, invRes, tickRes, contRes] = await Promise.all([
        supabaseRest('projects', { query: '?select=*&limit=20' }).catch(() => []),
        supabaseRest('invoices', { query: '?select=*&limit=20' }).catch(() => []),
        supabaseRest('tickets', { query: '?select=*&order=created_at.desc&limit=20' }).catch(() => []),
        supabaseRest('contracts', { query: '?select=*&limit=20' }).catch(() => []),
      ]);

      setMyProjects(projRes || []);
      setMyInvoices(invRes || []);
      setMyTickets(tickRes || []);
      setMyContracts(contRes || []);
    } catch (err) {
      console.error('Failed to load client records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketLoading(true);
    try {
      await supabaseRest('tickets', {
        method: 'POST',
        body: {
          subject: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority,
          status: 'open',
        },
      });
      setTicketModalOpen(false);
      setNewTicket({ subject: '', description: '', priority: 'medium' });
      await loadData();
    } catch (err) {
      alert(`Failed to create ticket: ${err.message}`);
    } finally {
      setTicketLoading(false);
    }
  };

  const navSections = [
    {
      title: 'Client Workspace',
      items: [
        { label: 'Active Engagements', path: '/client', icon: '📁', badge: myProjects.length },
        { label: 'Billing & Invoices', path: '#invoices', icon: '💳', badge: myInvoices.length },
        { label: 'Support Tickets', path: '#tickets', icon: '🎫', badge: myTickets.filter(t => t.status === 'open').length },
        { label: 'Contracts & Agreements', path: '#contracts', icon: '📜', badge: myContracts.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Client Portal" portalBadge="Customer Workspace" navSections={navSections}>
      {/* Navigation Bar Header (No extra top heading above navbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#2a2a2a] mb-6 pb-2 gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['projects', 'invoices', 'tickets', 'contracts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-xs font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} icon={<span>🔄</span>}>
            Refresh
          </Button>
          <Button variant="gold" size="sm" onClick={() => setTicketModalOpen(true)} icon={<span>+</span>}>
            Open Support Ticket
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Projects"
          value={myProjects.length}
          trend="up"
          change="In progress"
          icon={<span>📁</span>}
        />
        <MetricCard
          label="Invoices"
          value={`$${myInvoices.reduce((a, b) => a + Number(b.amount || 0), 0).toLocaleString()}`}
          trend="neutral"
          change={`${myInvoices.length} invoices`}
          icon={<span>💳</span>}
        />
        <MetricCard
          label="Support Tickets"
          value={myTickets.length}
          trend={myTickets.filter(t => t.status === 'open').length > 0 ? 'down' : 'up'}
          change={`${myTickets.filter(t => t.status === 'open').length} open`}
          icon={<span>🎫</span>}
        />
        <MetricCard
          label="Contracts"
          value={myContracts.length}
          trend="up"
          change="Master agreements"
          icon={<span>📜</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <Card title="Projects & Milestones" subtitle="Live progress and deliverables">
              {myProjects.length === 0 ? (
                <EmptyState title="No Active Projects" message="Your active engineering projects will appear here." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#d4af37]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white text-sm">{p.name}</h4>
                        <StatusBadge status={p.status || 'in progress'} />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{p.description || 'Enterprise delivery project.'}</p>
                      <div className="mt-4 pt-3 border-t border-[#2a2a2a]">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>Delivery Progress</span>
                          <span className="font-bold text-[#d4af37]">{p.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#d4af37] h-full" style={{ width: `${p.progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: INVOICES */}
          {activeTab === 'invoices' && (
            <Card title="Commercial Invoices" subtitle="Billing statements and payment status">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {myInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono font-semibold text-white">{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">${Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-zinc-400">{inv.due_date || 'N/A'}</td>
                        <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: TICKETS */}
          {activeTab === 'tickets' && (
            <Card
              title="Support & SLA Tickets"
              subtitle="Direct engineering escalation and customer inquiries"
              action={
                <Button size="sm" variant="gold" onClick={() => setTicketModalOpen(true)}>
                  + Open Ticket
                </Button>
              }
            >
              {myTickets.length === 0 ? (
                <EmptyState title="No Support Tickets" message="Need technical help? Submit a ticket anytime." />
              ) : (
                <div className="space-y-3">
                  {myTickets.map((t) => (
                    <div key={t.id} className="p-3.5 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{t.subject}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{t.description || 'Support request'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#222] text-zinc-400">{t.priority}</span>
                        <StatusBadge status={t.status || 'open'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: CONTRACTS */}
          {activeTab === 'contracts' && (
            <Card title="Agreements & Commercial Terms" subtitle="Master service agreements and NDA records">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Agreement</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {myContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{c.title || 'Master Service Agreement'}</td>
                        <td className="py-3 px-4 font-mono text-[#d4af37]">${Number(c.value || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={c.status || 'active'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* CREATE TICKET MODAL */}
      <Modal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title="Open Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Subject</label>
            <input
              required
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="e.g. Inquire about milestone 3 deliverable"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Priority</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Provide details on your request or issue..."
            />
          </div>
          <Button type="submit" variant="gold" loading={ticketLoading} className="w-full py-2">
            Submit Ticket
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}

