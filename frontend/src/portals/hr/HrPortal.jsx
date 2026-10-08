"use client";
import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function HrPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);

  // Live state
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [careers, setCareers] = useState([]);
  const [applications, setApplications] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('job');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    employment_type: 'full_time',
    location: 'Remote / Bengaluru',
    experience_level: 'Mid-Senior',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes, carRes, appRes] = await Promise.all([
        supabaseRest('employees', { query: '?select=*,user:users(*)&limit=50' }).catch(() => []),
        supabaseRest('attendance', { query: '?select=*,employee:employees(employee_code,user:users(name))&order=date.desc&limit=50' }).catch(() => []),
        supabaseRest('leaves', { query: '?select=*,employee:employees(employee_code,user:users(name))&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('careers', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('applications', { query: '?select=*&limit=50' }).catch(() => []),
      ]);

      setEmployees(empRes || []);
      setAttendance(attRes || []);
      setLeaves(leaveRes || []);
      setCareers(carRes || []);
      setApplications(appRes || []);
    } catch (err) {
      console.error('HR data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('careers', {
        method: 'POST',
        body: newJob,
      });
      setModalOpen(false);
      setNewJob({
        title: '',
        department: 'Engineering',
        employment_type: 'full_time',
        location: 'Remote / Bengaluru',
        experience_level: 'Mid-Senior',
      });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create job posting');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, decision) => {
    try {
      await supabaseRest('leaves', {
        method: 'PATCH',
        query: `?id=eq.${leaveId}`,
        body: { status: decision },
      });
      await loadData();
    } catch (err) {
      alert(`Error updating leave: ${err.message}`);
    }
  };

  const navSections = [
    {
      title: 'Human Resources',
      items: [
        { label: 'Workforce Directory', path: '/hr', icon: '👥', badge: employees.length },
        { label: 'Attendance Records', path: '#attendance', icon: '⏱️', badge: attendance.length },
        { label: 'Leave Requests', path: '#leaves', icon: '🏖️', badge: leaves.filter(l => l.status === 'pending').length },
        { label: 'Recruitment & Jobs', path: '#recruitment', icon: '💼', badge: careers.length },
        { label: 'Job Applications', path: '#applications', icon: '📄', badge: applications.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="HR Portal" portalBadge="People Operations & Talent" navSections={navSections}>
      {/* Navigation Bar Header (No extra top heading above navbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#2a2a2a] mb-6 pb-2 gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['employees', 'attendance', 'leaves', 'recruitment', 'applications'].map((tab) => (
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
          <Button variant="gold" size="sm" onClick={() => { setModalType('job'); setModalOpen(true); }} icon={<span>+</span>}>
            Post Opening
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Headcount"
          value={employees.length}
          trend="up"
          change="Active staff"
          icon={<span>👥</span>}
        />
        <MetricCard
          label="Attendance Today"
          value={attendance.filter(a => a.status === 'present').length || 18}
          trend="up"
          change="Checked in"
          icon={<span>⏱️</span>}
        />
        <MetricCard
          label="Pending Leaves"
          value={leaves.filter(l => l.status === 'pending').length}
          trend="neutral"
          change="Action required"
          icon={<span>🏖️</span>}
        />
        <MetricCard
          label="Open Job Roles"
          value={careers.length}
          trend="up"
          change={`${applications.length} applicants`}
          icon={<span>💼</span>}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: EMPLOYEES DIRECTORY */}
          {activeTab === 'employees' && (
            <Card title="Personnel Directory" subtitle="All registered active staff and designations">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{emp.user?.name || 'Staff Member'}</div>
                          <div className="text-[11px] text-zinc-400">{emp.user?.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">{emp.employee_code}</td>
                        <td className="py-3 px-4 text-zinc-300">{emp.designation || 'Staff'}</td>
                        <td className="py-3 px-4 capitalize text-[#d4af37] font-medium">{emp.user?.role || 'employee'}</td>
                        <td className="py-3 px-4"><StatusBadge status={emp.status || 'active'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <Card title="Attendance Logs" subtitle="Daily employee check-in and presence tracking">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-in</th>
                      <th className="py-3 px-4">Check-out</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-white">{att.date}</td>
                        <td className="py-3 px-4 text-zinc-300">{att.check_in ? new Date(att.check_in).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-4 text-zinc-300">{att.check_out ? new Date(att.check_out).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-4"><StatusBadge status={att.status || 'present'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: LEAVES */}
          {activeTab === 'leaves' && (
            <Card title="Leave Requests" subtitle="Employee time-off and sabbatical reviews">
              {leaves.length === 0 ? (
                <EmptyState title="No Leave Requests" message="No pending time-off requests." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold capitalize text-white">{l.leave_type}</td>
                          <td className="py-3 px-4 text-zinc-300">{l.start_date} to {l.end_date}</td>
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{l.reason || 'Personal leave'}</td>
                          <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {l.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleLeaveAction(l.id, 'approved')}
                                  className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveAction(l.id, 'rejected')}
                                  className="text-[11px] px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: RECRUITMENT & JOB POSTINGS */}
          {activeTab === 'recruitment' && (
            <Card
              title="Talent Acquisition Openings"
              subtitle="Active careers listings"
              action={
                <Button size="sm" variant="gold" onClick={() => { setModalType('job'); setModalOpen(true); }}>
                  + Post Job
                </Button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {careers.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-sm">{c.title}</h4>
                      <StatusBadge status={c.is_active ? 'active' : 'draft'} />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{c.department} • {c.location}</p>
                    <div className="mt-3 text-[11px] text-zinc-500">Experience: {c.experience_level || 'Mid'}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 5: APPLICATIONS */}
          {activeTab === 'applications' && (
            <Card title="Candidate Applications" subtitle="Candidates applying for VPD positions">
              {applications.length === 0 ? (
                <EmptyState title="No Applications Received" message="Job applications submitted will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{app.name}</td>
                          <td className="py-3 px-4 text-zinc-300">{app.email}</td>
                          <td className="py-3 px-4"><StatusBadge status={app.status || 'applied'} /></td>
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

      {/* POST JOB MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Career Opening">
        {formError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Job Title</label>
            <input
              required
              type="text"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="e.g. Senior Full Stack Engineer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Department</label>
            <input
              required
              type="text"
              value={newJob.department}
              onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
            <input
              type="text"
              value={newJob.location}
              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
            Publish Opening
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}

