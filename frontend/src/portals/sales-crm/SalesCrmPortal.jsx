"use client";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from 'react';

import PortalLayout from '../../components/portal-shared/PortalLayout';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents';
import { supabaseRest } from '../../api/supabaseClient.js';

export default function SalesCrmPortal() {
  const pathname = usePathname();
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Live state
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Attendance Tap In / Tap Out state
  const [tappedIn, setTappedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [tapLoading, setTapLoading] = useState(false);
  const [hasTappedInToday, setHasTappedInToday] = useState(false);
  const [hasTappedOutToday, setHasTappedOutToday] = useState(false);

  // Lead Modal & Form
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

  // Timesheet Log Modal & Form
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [newTimesheet, setNewTimesheet] = useState({
    hours: 8,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Leave Application Modal & Form
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
  });

  // Sync activeTab with URL path or hash
  useEffect(() => {
    const pathSeg = pathname.split('/').filter(Boolean)[1];
    const hash = window.location.hash.replace('#', '');
    const rawTab = pathSeg || hash || 'dashboard';
    const targetTab = rawTab === 'pipeline' ? 'dashboard' : rawTab;
    const validTabs = [
      'dashboard',
      'contact-submissions',
      'leads',
      'clients',
      'proposals',
      'contracts',
      'meetings',
      'reports',
      'attendance',
      'leaves',
      'timesheets',
      'payslips',
      'tasks',
    ];
    if (validTabs.includes(targetTab)) {
      setActiveTab(targetTab);
    }
  }, [pathname]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [
        leadRes,
        propRes,
        contRes,
        meetRes,
        clientRes,
        csRes,
        repRes,
        attRes,
        leaveRes,
        tsRes,
        payRes,
        taskRes,
      ] = await Promise.all([
        supabaseRest('leads', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('proposals', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('contracts', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('meetings', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('clients', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('contact_submissions', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('reports', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('attendance', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('leaves', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('timesheets', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('payslips', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('tasks', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
      ]);

      setLeads(leadRes || []);
      setProposals(propRes || []);
      setContracts(contRes || []);
      setMeetings(meetRes || []);
      setClients(clientRes || []);
      setContactSubmissions(csRes || []);
      setReports(repRes || []);
      setAttendance(attRes || []);
      setLeaves(leaveRes || []);
      setTimesheets(tsRes || []);
      setPayslips(payRes || []);
      setTasks(taskRes || []);

      // Check today's tap status (enforce once in a day)
      const todayLog = (attRes || []).find((a) => a.date === today && a.check_in);
      if (todayLog) {
        const isIn = !!todayLog.check_in;
        const isOut = !!todayLog.check_out;
        setHasTappedInToday(isIn);
        setHasTappedOutToday(isOut);
        setTappedIn(isIn && !isOut);
        setCheckInTime(todayLog.check_in || '');
        setCheckOutTime(todayLog.check_out || '');
      } else {
        setHasTappedInToday(false);
        setHasTappedOutToday(false);
        setTappedIn(false);
        setCheckInTime('');
        setCheckOutTime('');
      }
    } catch (err) {
      console.error('Failed to load Sales Portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Attendance Tap In Handler (Once per day)
  const handleTapIn = async () => {
    if (hasTappedInToday) {
      alert('You have already tapped in for today.');
      return;
    }
    setTapLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await supabaseRest('attendance', {
        method: 'POST',
        body: {
          date: today,
          check_in: nowTime,
          status: 'present',
        },
      }).catch(() => {});
      setHasTappedInToday(true);
      setTappedIn(true);
      setCheckInTime(nowTime);
      setCheckOutTime('');
      await loadData();
    } catch (err) {
      alert(`Tap In failed: ${err.message}`);
    } finally {
      setTapLoading(false);
    }
  };

  // Attendance Tap Out Handler (Once per day)
  const handleTapOut = async () => {
    if (hasTappedOutToday) {
      alert('You have already tapped out for today.');
      return;
    }
    setTapLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await supabaseRest('attendance', {
        method: 'PATCH',
        query: `?date=eq.${today}`,
        body: {
          check_out: nowTime,
        },
      }).catch(() => {});
      setHasTappedOutToday(true);
      setTappedIn(false);
      setCheckOutTime(nowTime);
      await loadData();
    } catch (err) {
      alert(`Tap Out failed: ${err.message}`);
    } finally {
      setTapLoading(false);
    }
  };

  // Timesheet Log Hours Handler
  const handleLogTimesheet = async (e) => {
    e.preventDefault();
    setTimesheetLoading(true);
    try {
      await supabaseRest('timesheets', {
        method: 'POST',
        body: {
          date: newTimesheet.date,
          hours: Number(newTimesheet.hours),
          description: newTimesheet.description,
          status: 'draft',
        },
      });
      setTimesheetModalOpen(false);
      setNewTimesheet({
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        description: '',
      });
      await loadData();
    } catch (err) {
      alert(`Log hours failed: ${err.message}`);
    } finally {
      setTimesheetLoading(false);
    }
  };

  // Apply Leave Handler
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveLoading(true);
    try {
      await supabaseRest('leaves', {
        method: 'POST',
        body: {
          leave_type: newLeave.leave_type,
          type: newLeave.leave_type,
          start_date: newLeave.start_date,
          end_date: newLeave.end_date,
          reason: newLeave.reason,
          status: 'pending',
        },
      });
      setLeaveModalOpen(false);
      setNewLeave({
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        reason: '',
      });
      await loadData();
    } catch (err) {
      alert(`Apply leave failed: ${err.message}`);
    } finally {
      setLeaveLoading(false);
    }
  };

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
  const wonDeals = leads.filter((l) => l.status === 'won').length;

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    navigate.push(`/sales/${tab}`);
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/sales/dashboard', icon: '📊' },
        { label: 'Contact Submissions', path: '/sales/contact-submissions', icon: '✉️', badge: contactSubmissions.length },
        { label: 'Leads', path: '/sales/leads', icon: '🎯', badge: leads.length },
        { label: 'Clients', path: '/sales/clients', icon: '🏢', badge: clients.length },
      ],
    },
    {
      title: 'Commercials',
      items: [
        { label: 'Proposals', path: '/sales/proposals', icon: '📝', badge: proposals.length },
        { label: 'Contracts', path: '/sales/contracts', icon: '🤝', badge: contracts.length },
        { label: 'Meetings', path: '/sales/meetings', icon: '📅', badge: meetings.length },
        { label: 'Reports', path: '/sales/reports', icon: '📈', badge: reports.length },
      ],
    },
    {
      title: 'Workforce & Operations',
      items: [
        { label: 'Attendance', path: '/sales/attendance', icon: '🌓', badge: attendance.length },
        { label: 'Leaves', path: '/sales/leaves', icon: '🏖️', badge: leaves.length },
        { label: 'Timesheets', path: '/sales/timesheets', icon: '⏱️', badge: timesheets.length },
        { label: 'Payslips', path: '/sales/payslips', icon: '💵', badge: payslips.length },
        { label: 'Tasks', path: '/sales/tasks', icon: '✅', badge: tasks.length },
      ],
    },
  ];

  const tabsList = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'contact-submissions', label: 'Contact Submissions' },
    { id: 'leads', label: 'Leads' },
    { id: 'clients', label: 'Clients' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'reports', label: 'Reports' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leaves', label: 'Leaves' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'payslips', label: 'Payslips' },
    { id: 'tasks', label: 'Tasks' },
  ];

  return (
    <PortalLayout portalName="Sales & CRM Portal" portalBadge="Revenue & Commercials" navSections={navSections}>
      {/* Navigation Bar Header (No extra top heading above navbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#2a2a2a] mb-6 pb-2 gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabsList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#d4af37] text-[#d4af37]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} icon={<span>🔄</span>}>
            Refresh
          </Button>
          <Button variant="gold" size="sm" onClick={() => setModalOpen(true)} icon={<span>+</span>}>
            New Lead
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: DASHBOARD & PIPELINE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards Overview (Dashboard Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  label="Total Leads"
                  value={leads.length}
                  trend="up"
                  change="In qualification"
                  icon={<span>🎯</span>}
                  onClick={() => handleTabSelect('leads')}
                />
                <MetricCard
                  label="Pipeline Value"
                  value={`$${totalPipelineValue.toLocaleString()}`}
                  trend="up"
                  change="Opportunity volume"
                  icon={<span>💵</span>}
                  onClick={() => handleTabSelect('leads')}
                />
                <MetricCard
                  label="Won Contracts"
                  value={contracts.length || wonDeals}
                  trend="up"
                  change="Deals finalized"
                  icon={<span>🏆</span>}
                  onClick={() => handleTabSelect('contracts')}
                />
                <MetricCard
                  label="Meetings"
                  value={meetings.length}
                  trend="neutral"
                  change="Scheduled & held"
                  icon={<span>🤝</span>}
                  onClick={() => handleTabSelect('meetings')}
                />
                <MetricCard
                  label="Client Accounts"
                  value={clients.length}
                  trend="up"
                  change="Active accounts"
                  icon={<span>🏢</span>}
                  onClick={() => handleTabSelect('clients')}
                />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-zinc-200">Interactive Commercial Pipeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['new', 'contacted', 'qualified', 'won'].map((statusKey) => {
                    const stageLeads = leads.filter((l) => (l.status || 'new').toLowerCase() === statusKey);
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
                            <div className="text-center py-6 px-3 text-xs font-medium text-zinc-400 bg-[#161616] border border-dashed border-[#2a2a2a] rounded-lg my-2 flex flex-col items-center justify-center gap-1">
                              <span className="text-zinc-500 text-base">🎯</span>
                              <span>No deals in this stage</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT SUBMISSIONS */}
          {activeTab === 'contact-submissions' && (
            <Card title="Website Contact Submissions" subtitle="Inquiries submitted via public contact forms">
              {contactSubmissions.length === 0 ? (
                <EmptyState title="No Submissions Received" message="Web contact form inquiries will automatically appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Contact Name</th>
                        <th className="py-3 px-4">Email / Phone</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {contactSubmissions.map((cs) => (
                        <tr key={cs.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{cs.name || cs.contact_name || 'Inquirer'}</td>
                          <td className="py-3 px-4 text-zinc-300">{cs.email} {cs.phone ? `(${cs.phone})` : ''}</td>
                          <td className="py-3 px-4 text-zinc-400">{cs.company_name || cs.company || 'N/A'}</td>
                          <td className="py-3 px-4 text-zinc-200">{cs.subject || cs.message?.slice(0, 40) || 'General Inquiry'}</td>
                          <td className="py-3 px-4"><StatusBadge status={cs.status || 'new'} /></td>
                          <td className="py-3 px-4 text-zinc-500">{new Date(cs.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: LEADS */}
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

          {/* TAB 4: CLIENTS */}
          {activeTab === 'clients' && (
            <Card title="Client Directory & Accounts" subtitle="Registered enterprise clients and commercial profiles">
              {clients.length === 0 ? (
                <EmptyState title="No Client Accounts" message="Converted leads will automatically populate client accounts directory." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Company Name</th>
                        <th className="py-3 px-4">Industry</th>
                        <th className="py-3 px-4">Country</th>
                        <th className="py-3 px-4">Website</th>
                        <th className="py-3 px-4">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {clients.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{c.company_name || 'Client Account'}</td>
                          <td className="py-3 px-4 text-zinc-300">{c.industry || 'Technology'}</td>
                          <td className="py-3 px-4 text-zinc-400">{c.country || 'Global'}</td>
                          <td className="py-3 px-4 text-[#d4af37] font-mono">{c.website || 'N/A'}</td>
                          <td className="py-3 px-4 text-zinc-500">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 5: PROPOSALS */}
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
                          <td className="py-3 px-4 font-semibold text-white">{p.title || p.scope_summary}</td>
                          <td className="py-3 px-4 font-mono text-[#d4af37]">${Number(p.amount || p.price || 0).toLocaleString()}</td>
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

          {/* TAB 6: CONTRACTS */}
          {activeTab === 'contracts' && (
            <Card title="Client Contracts & Agreements" subtitle="Legally binding agreements signed with clients">
              {contracts.length === 0 ? (
                <EmptyState title="No Contracts Found" message="Accepted proposals automatically generate contract drafts." />
              ) : (
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
              )}
            </Card>
          )}

          {/* TAB 7: MEETINGS */}
          {activeTab === 'meetings' && (
            <Card title="Client Engagement Meetings" subtitle="Scheduled sales consultations and presentations">
              {meetings.length === 0 ? (
                <EmptyState title="No Meetings Scheduled" message="Upcoming sales calls and demos will appear here." />
              ) : (
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
              )}
            </Card>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === 'reports' && (
            <Card title="Sales Analytics & Revenue Reports" subtitle="Generated commercial performance and conversion reports">
              {reports.length === 0 ? (
                <EmptyState title="No Sales Reports" message="Commercial reports and revenue projections will be listed here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Report Title</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {reports.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{r.title || 'Sales Performance Summary'}</td>
                          <td className="py-3 px-4 uppercase text-[10px] font-mono text-zinc-400">{r.report_type || 'Commercial'}</td>
                          <td className="py-3 px-4 text-zinc-300">{r.period || 'Q3'}</td>
                          <td className="py-3 px-4 text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 9: ATTENDANCE WITH INTERACTIVE TAP IN / TAP OUT (ONCE PER DAY) */}
          {activeTab === 'attendance' && (
            <Card
              title="Attendance & Time Clock"
              subtitle="Tap in / tap out daily check-in records (Once per day)"
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant={hasTappedInToday ? 'secondary' : 'gold'}
                    size="sm"
                    loading={tapLoading}
                    onClick={handleTapIn}
                    disabled={hasTappedInToday || tapLoading}
                    icon={<span>👉</span>}
                  >
                    {hasTappedInToday ? 'Tapped In Today' : 'Tap In (Check In)'}
                  </Button>
                  <Button
                    variant={hasTappedOutToday ? 'secondary' : !tappedIn ? 'secondary' : 'danger'}
                    size="sm"
                    loading={tapLoading}
                    onClick={handleTapOut}
                    disabled={!tappedIn || hasTappedOutToday || tapLoading}
                    icon={<span>👈</span>}
                  >
                    {hasTappedOutToday ? 'Tapped Out Today' : 'Tap Out (Check Out)'}
                  </Button>
                </div>
              }
            >
              <div className="mb-4 p-4 rounded-xl bg-[#121212] border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${hasTappedOutToday ? 'bg-zinc-500' : tappedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                  <div>
                    <span className="text-xs font-semibold text-white">
                      {hasTappedOutToday
                        ? '✅ Tap In & Tap Out Completed for Today'
                        : tappedIn
                        ? 'Currently Tapped In (Working)'
                        : 'Not Tapped In Today'}
                    </span>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      {checkInTime ? `Checked in at ${checkInTime}` : 'Tap in once per day to record your presence.'}
                      {checkOutTime ? ` • Checked out at ${checkOutTime}` : ''}
                      {hasTappedOutToday ? ' (Daily attendance completed)' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant={hasTappedInToday ? 'secondary' : 'gold'}
                    onClick={handleTapIn}
                    disabled={hasTappedInToday || tapLoading}
                  >
                    {hasTappedInToday ? 'Tapped In' : 'Tap In'}
                  </Button>
                  <Button
                    size="xs"
                    variant={hasTappedOutToday ? 'secondary' : !tappedIn ? 'secondary' : 'danger'}
                    onClick={handleTapOut}
                    disabled={!tappedIn || hasTappedOutToday || tapLoading}
                  >
                    {hasTappedOutToday ? 'Tapped Out' : 'Tap Out'}
                  </Button>
                </div>
              </div>

              {attendance.length === 0 ? (
                <EmptyState title="No Attendance Logs" message="Click 'Tap In' above to record your check-in for today." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Check In</th>
                        <th className="py-3 px-4">Check Out</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{a.date || new Date(a.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-medium">{a.check_in || '09:00 AM'}</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{a.check_out || '—'}</td>
                          <td className="py-3 px-4"><StatusBadge status={a.status || 'present'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 10: LEAVES WITH APPLY LEAVE MODAL ACTION */}
          {activeTab === 'leaves' && (
            <Card
              title="Leave Requests"
              subtitle="Time off and leave applications"
              action={
                <Button size="sm" variant="gold" onClick={() => setLeaveModalOpen(true)} icon={<span>+</span>}>
                  Apply Leave
                </Button>
              }
            >
              {leaves.length === 0 ? (
                <EmptyState title="No Leave Requests" message="Click 'Apply Leave' to submit a time off request." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Start Date</th>
                        <th className="py-3 px-4">End Date</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white capitalize">{l.leave_type || l.type || 'Annual'}</td>
                          <td className="py-3 px-4 text-zinc-300">{l.start_date}</td>
                          <td className="py-3 px-4 text-zinc-300">{l.end_date}</td>
                          <td className="py-3 px-4 text-zinc-400">{l.reason || 'N/A'}</td>
                          <td className="py-3 px-4"><StatusBadge status={l.status || 'pending'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 11: TIMESHEETS WITH LOG HOURS MODAL ACTION */}
          {activeTab === 'timesheets' && (
            <Card
              title="Sales Timesheets & Work Logs"
              subtitle="Hours logged for client consultations and commercial work"
              action={
                <Button size="sm" variant="gold" onClick={() => setTimesheetModalOpen(true)} icon={<span>+</span>}>
                  Log Hours
                </Button>
              }
            >
              {timesheets.length === 0 ? (
                <EmptyState title="No Timesheet Logs" message="Click 'Log Hours' to add a new work timesheet log." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Work Description</th>
                        <th className="py-3 px-4">Hours</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {timesheets.map((ts) => (
                        <tr key={ts.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{ts.date || new Date(ts.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-zinc-300">{ts.description || 'Client account meeting & proposal drafting'}</td>
                          <td className="py-3 px-4 font-mono text-[#d4af37] font-bold">{ts.hours || ts.hours_logged || 8} hrs</td>
                          <td className="py-3 px-4"><StatusBadge status={ts.status || 'approved'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 12: PAYSLIPS */}
          {activeTab === 'payslips' && (
            <Card
              title="Compensation & Payslips"
              subtitle="Monthly salary and commission statements"
            >
              <div className="mb-4 p-4 rounded-xl bg-[#121212] border border-[#2a2a2a]">
                <h4 className="text-xs font-semibold text-white">Monthly Payslip Statements</h4>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Payslips are issued monthly by HR & Finance administrators based on active contracts, logged billable hours, and approved leaves.
                </p>
              </div>

              {payslips.length === 0 ? (
                <EmptyState
                  title="No Payslips Issued"
                  message="Commercial team compensation statements issued by HR & Finance will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Pay Period</th>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Net Compensation</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {payslips.map((ps) => (
                        <tr key={ps.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{ps.pay_period || 'Current Period'}</td>
                          <td className="py-3 px-4 text-zinc-300">{ps.employee_name || 'Commercial Staff'}</td>
                          <td className="py-3 px-4 font-mono text-[#d4af37] font-bold">${Number(ps.net_pay || ps.amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={ps.status || 'paid'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 13: TASKS */}
          {activeTab === 'tasks' && (
            <Card title="Sales Follow-up & Commercial Tasks" subtitle="Action items and client follow-ups">
              {tasks.length === 0 ? (
                <EmptyState title="No Scheduled Tasks" message="Commercial tasks and lead follow-up action items will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Task</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {tasks.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{t.title}</td>
                          <td className="py-3 px-4 uppercase text-[10px] font-mono text-zinc-400">{t.priority || 'medium'}</td>
                          <td className="py-3 px-4"><StatusBadge status={t.status || 'todo'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* LOG TIMESHEET HOURS MODAL */}
      <Modal isOpen={timesheetModalOpen} onClose={() => setTimesheetModalOpen(false)} title="Log Timesheet Hours">
        <form onSubmit={handleLogTimesheet} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Date</label>
            <input
              required
              type="date"
              value={newTimesheet.date}
              onChange={(e) => setNewTimesheet({ ...newTimesheet, date: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Hours Worked</label>
            <input
              required
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={newTimesheet.hours}
              onChange={(e) => setNewTimesheet({ ...newTimesheet, hours: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Work Summary / Description</label>
            <textarea
              required
              rows={3}
              value={newTimesheet.description}
              onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })}
              placeholder="Client proposal review, contract negotiations, and project kick-off sync..."
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <Button type="submit" variant="gold" loading={timesheetLoading} className="w-full py-2">
            Save Timesheet Entry
          </Button>
        </form>
      </Modal>

      {/* APPLY LEAVE MODAL */}
      <Modal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Time Off / Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Leave Type</label>
            <select
              value={newLeave.leave_type}
              onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="annual">Annual Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="maternity">Maternity / Paternity</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Start Date</label>
              <input
                required
                type="date"
                value={newLeave.start_date}
                onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">End Date</label>
              <input
                required
                type="date"
                value={newLeave.end_date}
                onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              placeholder="Reason for time off application..."
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <Button type="submit" variant="gold" loading={leaveLoading} className="w-full py-2">
            Submit Leave Application
          </Button>
        </form>
      </Modal>

    </PortalLayout>
  );
}
