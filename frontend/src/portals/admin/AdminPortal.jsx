import React, { useState, useEffect } from 'react';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Live state from Supabase / Backend
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals & form state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // New Employee Form
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'developer',
    department_id: '',
    designation: 'Software Engineer',
  });

  // New Department Form
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  // New Invoice Form (Finance)
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-5)}`,
    amount: 15000,
    status: 'draft',
    due_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, projRes, taskRes, invRes, leaveRes, logRes] = await Promise.all([
        supabaseRest('employees', { query: '?select=*,user:users(*)&limit=50' }).catch(() => []),
        supabaseRest('departments', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('projects', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('tasks', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('invoices', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('leaves', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('audit_logs', { query: '?select=*&order=created_at.desc&limit=20' }).catch(() => []),
      ]);

      setEmployees(empRes || []);
      setDepartments(deptRes || []);
      setProjects(projRes || []);
      setTasks(taskRes || []);
      setInvoices(invRes || []);
      setLeaves(leaveRes || []);
      setAuditLogs(logRes || []);
    } catch (err) {
      console.error('Failed to load admin portal records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      // 1. Create user
      const userRes = await supabaseRest('users', {
        method: 'POST',
        body: {
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          is_active: true,
          is_email_verified: true,
        },
      });

      const createdUser = userRes?.[0];
      if (createdUser?.id) {
        // 2. Create employee row
        await supabaseRest('employees', {
          method: 'POST',
          body: {
            user_id: createdUser.id,
            employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
            designation: newEmployee.designation,
            department_id: newEmployee.department_id || null,
          },
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create employee');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('departments', {
        method: 'POST',
        body: newDept,
      });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create department');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('invoices', {
        method: 'POST',
        body: newInvoice,
      });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create invoice');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLeaveDecision = async (leaveId, decision) => {
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
      title: 'Governance',
      items: [
        { label: 'Admin Dashboard', path: '/admin', icon: '📊' },
        { label: 'Employees', path: '#employees', icon: '👥', badge: employees.length },
        { label: 'Departments', path: '#departments', icon: '🏢', badge: departments.length },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Projects & Tasks', path: '#projects', icon: '📁', badge: projects.length },
        { label: 'Leave Requests', path: '#leaves', icon: '🏖️', badge: leaves.filter(l => l.status === 'pending').length },
      ],
    },
    {
      title: 'Finance & System',
      items: [
        { label: 'Finance (Restricted)', path: '#finance', icon: '💳', badge: `$${invoices.reduce((a, b) => a + Number(b.amount || 0), 0).toLocaleString()}` },
        { label: 'Audit Logs', path: '#audit', icon: '🛡️', badge: auditLogs.length },
      ],
    },
  ];

  return (
    <PortalLayout portalName="Admin Portal" portalBadge="Super Admin / Executive" navSections={navSections}>
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Administration Workspace</h1>
          <p className="text-xs text-zinc-400 mt-1">Unified governance, workforce management, auditability, and finance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<span>🔄</span>}
          >
            Refresh
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => { setModalType('employee'); setModalOpen(true); }}
            icon={<span>+</span>}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a] mb-6 overflow-x-auto gap-2">
        {['dashboard', 'employees', 'departments', 'projects', 'leaves', 'finance', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'finance' ? 'Finance (Restricted)' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: DASHBOARD / OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metrics Row (Dashboard Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Employees"
                  value={employees.length}
                  trend="up"
                  change="+100% active"
                  icon={<span>👥</span>}
                />
                <MetricCard
                  label="Active Projects"
                  value={projects.length}
                  trend="neutral"
                  change={`${tasks.length} tasks`}
                  icon={<span>📁</span>}
                />
                <MetricCard
                  label="Pending Leaves"
                  value={leaves.filter(l => l.status === 'pending').length}
                  trend={leaves.filter(l => l.status === 'pending').length > 0 ? 'down' : 'up'}
                  change="Awaiting action"
                  icon={<span>⏳</span>}
                />
                <MetricCard
                  label="Total Invoiced"
                  value={`$${invoices.reduce((a, b) => a + Number(b.amount || 0), 0).toLocaleString()}`}
                  trend="up"
                  change={`${invoices.length} billing items`}
                  icon={<span>💰</span>}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Workforce Additions" subtitle="Latest employee profiles registered in VPD">
                  <div className="space-y-3">
                    {employees.slice(0, 5).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#2a2a2a]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-xs text-[#d4af37]">
                            {(emp.user?.name || emp.employee_code || 'E').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{emp.user?.name || emp.employee_code}</p>
                            <p className="text-[11px] text-zinc-400">{emp.designation || 'Staff'} • {emp.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                        <StatusBadge status={emp.status || 'active'} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Active Operational Projects" subtitle="Live delivery and client projects">
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((proj) => (
                      <div key={proj.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#2a2a2a]">
                        <div>
                          <p className="text-xs font-semibold text-white">{proj.name}</p>
                          <p className="text-[11px] text-zinc-400">Budget: ${Number(proj.budget || 0).toLocaleString()} • Progress: {proj.progress || 0}%</p>
                        </div>
                        <StatusBadge status={proj.status || 'in progress'} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEES */}
          {activeTab === 'employees' && (
            <Card
              title="Employee Management Directory"
              subtitle={`Total of ${employees.length} personnel profiles recorded`}
              action={
                <Button size="sm" variant="gold" onClick={() => { setModalType('employee'); setModalOpen(true); }}>
                  + Add Employee
                </Button>
              }
            >
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
                          <div className="font-semibold text-white">{emp.user?.name || 'Personnel'}</div>
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

          {/* TAB 3: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <Card
              title="Departments"
              subtitle="Organizational business units"
              action={
                <Button size="sm" variant="gold" onClick={() => { setModalType('department'); setModalOpen(true); }}>
                  + Add Department
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{dept.name}</h4>
                      <span className="text-[10px] text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full border border-[#d4af37]/20">Active</span>
                    </div>
                    <p className="text-xs text-zinc-400">{dept.description || 'Enterprise department unit.'}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 4: PROJECTS */}
          {activeTab === 'projects' && (
            <Card title="Projects & Tasks" subtitle="Global project tracking">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Budget</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-3 px-4">
                          <div className="w-24 bg-[#222] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#d4af37] h-full" style={{ width: `${p.progress || 0}%` }}></div>
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-0.5 block">{p.progress || 0}%</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">${Number(p.budget || 0).toLocaleString()}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status || 'in progress'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: LEAVES */}
          {activeTab === 'leaves' && (
            <Card title="Employee Leave Approvals" subtitle="Review leave requests submitted by workforce members">
              {leaves.length === 0 ? (
                <EmptyState title="No Leave Requests" message="There are currently no leave requests awaiting action." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Dates</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 capitalize font-semibold text-white">{l.leave_type || 'Casual'}</td>
                          <td className="py-3 px-4 text-zinc-300">{l.start_date} to {l.end_date}</td>
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{l.reason || 'Personal leave'}</td>
                          <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {l.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleLeaveDecision(l.id, 'approved')}
                                  className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveDecision(l.id, 'rejected')}
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

          {/* TAB 6: FINANCE (RESTRICTED) */}
          {activeTab === 'finance' && (
            <Card
              title="Finance Module (Restricted)"
              subtitle="Protected enterprise billing, invoices, and revenue records"
              action={
                <Button size="sm" variant="gold" onClick={() => { setModalType('invoice'); setModalOpen(true); }}>
                  + Issue Invoice
                </Button>
              }
            >
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
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono font-semibold text-white">{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-mono text-[#d4af37] font-bold">${Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-zinc-400">{inv.due_date || 'N/A'}</td>
                        <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <Card title="Security & Activity Audit Trail" subtitle="System records and user action tracking">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-zinc-200">{log.action}</td>
                        <td className="py-3 px-4 text-zinc-400">{log.entity_type || 'System'}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{log.ip_address || '127.0.0.1'}</td>
                        <td className="py-3 px-4 text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'employee' ? 'Add New Employee' :
          modalType === 'department' ? 'Create Department' : 'Issue New Invoice'
        }
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {formError}
          </div>
        )}

        {modalType === 'employee' && (
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Corporate Email</label>
              <input
                required
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="jane.doe@vpdtechnologies.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Designation</label>
              <input
                type="text"
                value={newEmployee.designation}
                onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Department</label>
              <select
                value={newEmployee.department_id}
                onChange={(e) => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
              Create Employee Profile
            </Button>
          </form>
        )}

        {modalType === 'department' && (
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Department Name</label>
              <input
                required
                type="text"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="e.g. Artificial Intelligence"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
              <textarea
                value={newDept.description}
                onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
                rows={3}
              />
            </div>
            <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
              Save Department
            </Button>
          </form>
        )}

        {modalType === 'invoice' && (
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Invoice Number</label>
              <input
                required
                type="text"
                value={newInvoice.invoice_number}
                onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Amount (USD)</label>
              <input
                required
                type="number"
                value={newInvoice.amount}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Due Date</label>
              <input
                required
                type="date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
              Issue Invoice
            </Button>
          </form>
        )}
      </Modal>
    </PortalLayout>
  );
}

