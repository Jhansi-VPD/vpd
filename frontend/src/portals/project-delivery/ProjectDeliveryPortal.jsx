import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/portal-shared/PortalLayout.jsx';
import { Card, MetricCard, StatusBadge, Button, LoadingSkeleton, EmptyState, Modal } from '../../components/portal-shared/SharedComponents.jsx';
import { supabaseRest } from '../../api/supabaseClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProjectDeliveryPortal() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Live records
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [reports, setReports] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);

  // Attendance Tap In / Tap Out state
  const [tappedIn, setTappedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [tapLoading, setTapLoading] = useState(false);
  const [hasTappedInToday, setHasTappedInToday] = useState(false);
  const [hasTappedOutToday, setHasTappedOutToday] = useState(false);

  // Payslip Generator Modal State
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [newPayslip, setNewPayslip] = useState({
    employee_name: user?.name || 'Engineering Team Member',
    pay_period: 'October 2026',
    basic_salary: 6000,
    allowances: 1200,
    deductions: 600,
    status: 'paid',
  });

  // Assign Team Modal State & Project Members List
  const [projectMembers, setProjectMembers] = useState([
    { id: '1', project_id: '1', member_name: 'Rahul Sharma', role: 'Lead Architect', allocation: '100%' },
    { id: '2', project_id: '1', member_name: 'Priya Patel', role: 'Frontend Lead', allocation: '100%' },
    { id: '3', project_id: '1', member_name: 'Amit Kumar', role: 'DevOps Specialist', allocation: '50%' },
  ]);
  const [assignTeamModalOpen, setAssignTeamModalOpen] = useState(false);
  const [assignTeamLoading, setAssignTeamLoading] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    project_id: '',
    selected_members: ['Rahul Sharma (Lead Architect)', 'Priya Patel (Frontend Lead)'],
    custom_member_name: '',
    role: 'Senior Software Engineer',
    allocation: '100% Full-time',
  });

  // Task Modal & Form
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    status: 'todo',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
    const pathSeg = location.pathname.split('/').filter(Boolean)[1];
    const hash = location.hash.replace('#', '');
    const rawTab = pathSeg || hash || 'overview';
    const targetTab = rawTab === 'kanban' ? 'overview' : rawTab;
    const validTabs = [
      'overview',
      'projects',
      'tasks',
      'approvals',
      'attendance',
      'leaves',
      'timesheets',
      'payslips',
    ];
    if (validTabs.includes(targetTab)) {
      setActiveTab(targetTab);
    }
  }, [location.pathname, location.hash]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [
        projRes,
        taskRes,
        mileRes,
        tsRes,
        repRes,
        meetRes,
        attRes,
        leaveRes,
        payRes,
      ] = await Promise.all([
        supabaseRest('projects', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('tasks', { query: '?select=*,project:projects(title,name)&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('project_milestones', { query: '?select=*&limit=50' }).catch(() => []),
        supabaseRest('timesheets', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('reports', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('meetings', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('attendance', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('leaves', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
        supabaseRest('payslips', { query: '?select=*&order=created_at.desc&limit=50' }).catch(() => []),
      ]);

      setProjects(projRes || []);
      setTasks(taskRes || []);
      setMilestones(mileRes || []);
      setTimesheets(tsRes || []);
      setReports(repRes || []);
      setMeetings(meetRes || []);
      setAttendance(attRes || []);
      setLeaves(leaveRes || []);
      setPayslips(payRes || []);

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
      console.error('Delivery data fetch failed:', err);
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

  // Generate Payslip Handler
  const handleGeneratePayslip = async (e) => {
    e.preventDefault();
    setPayslipLoading(true);
    const net_pay = Number(newPayslip.basic_salary) + Number(newPayslip.allowances) - Number(newPayslip.deductions);
    try {
      await supabaseRest('payslips', {
        method: 'POST',
        body: {
          employee_name: newPayslip.employee_name,
          pay_period: newPayslip.pay_period,
          net_pay: net_pay,
          amount: net_pay,
          status: newPayslip.status,
        },
      });
    } catch {
      // local fallback
    }
    setPayslips((prev) => [
      {
        id: Date.now().toString(),
        employee_name: newPayslip.employee_name,
        pay_period: newPayslip.pay_period,
        net_pay: net_pay,
        status: newPayslip.status,
      },
      ...prev,
    ]);
    setPayslipModalOpen(false);
    setPayslipLoading(false);
  };

  // Assign Team Handler (Assigns multiple team members to a single project)
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!newAssignment.project_id) {
      alert('Please select a target project.');
      return;
    }
    setAssignTeamLoading(true);
    const membersToAssign = [...(newAssignment.selected_members || [])];
    if (newAssignment.custom_member_name && newAssignment.custom_member_name.trim()) {
      membersToAssign.push(newAssignment.custom_member_name.trim());
    }

    if (membersToAssign.length === 0) {
      alert('Please select or enter at least one team member to assign.');
      setAssignTeamLoading(false);
      return;
    }

    try {
      const newEntries = membersToAssign.map((name) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        project_id: newAssignment.project_id,
        member_name: name.split('(')[0].trim(),
        role: name.includes('(') ? name.split('(')[1].replace(')', '').trim() : newAssignment.role,
        allocation: newAssignment.allocation,
      }));

      // Persist entries
      for (const entry of newEntries) {
        await supabaseRest('project_members', {
          method: 'POST',
          body: entry,
        }).catch(() => {});
      }

      setProjectMembers((prev) => [...prev, ...newEntries]);
      setAssignTeamModalOpen(false);
      setNewAssignment({
        project_id: '',
        selected_members: [],
        custom_member_name: '',
        role: 'Senior Software Engineer',
        allocation: '100% Full-time',
      });
      alert(`Successfully assigned ${membersToAssign.length} team member(s) to the project!`);
    } catch (err) {
      alert(`Assign team failed: ${err.message}`);
    } finally {
      setAssignTeamLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await supabaseRest('tasks', {
        method: 'POST',
        body: newTask,
      });
      setModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        status: 'todo',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create delivery task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await supabaseRest('tasks', {
        method: 'PATCH',
        query: `?id=eq.${taskId}`,
        body: { status: newStatus },
      });
      await loadData();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    navigate(`/delivery/${tab}`);
  };

  const navSections = [
    {
      title: 'Project Management',
      items: [
        { label: 'Overview', path: '/delivery/overview', icon: '🎛️' },
        { label: 'Team Projects', path: '/delivery/projects', icon: '📁', badge: projects.length },
        { label: 'Task Board', path: '/delivery/tasks', icon: '📋', badge: tasks.length },
        { label: 'Approvals', path: '/delivery/approvals', icon: '☑️', badge: milestones.length },
      ],
    },
    {
      title: 'Workforce & Operations',
      items: [
        { label: 'Attendance', path: '/delivery/attendance', icon: '🌓', badge: attendance.length },
        { label: 'Leaves', path: '/delivery/leaves', icon: '🏖️', badge: leaves.length },
        { label: 'Timesheets', path: '/delivery/timesheets', icon: '⏱️', badge: timesheets.length },
        { label: 'Payslips', path: '/delivery/payslips', icon: '💵', badge: payslips.length },
      ],
    },
  ];

  const tabsList = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Team Projects' },
    { id: 'tasks', label: 'Task Board' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leaves', label: 'Leaves' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'payslips', label: 'Payslips' },
  ];

  return (
    <PortalLayout portalName="Project Manager Portal" portalBadge="Project Management & Engineering" navSections={navSections}>
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
            Create Task
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : (
        <>
          {/* TAB 1: OVERVIEW & KANBAN BOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards Overview (Dashboard Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <MetricCard
                  label="Active Projects"
                  value={projects.length}
                  trend="up"
                  change="Delivery pipelines"
                  icon={<span>📁</span>}
                  onClick={() => handleTabSelect('projects')}
                />
                <MetricCard
                  label="Total Tasks"
                  value={tasks.length}
                  trend="neutral"
                  change="Sprint backlog"
                  icon={<span>✅</span>}
                  onClick={() => handleTabSelect('tasks')}
                />
                <MetricCard
                  label="Completed"
                  value={tasks.filter((t) => t.status === 'completed' || t.status === 'done').length}
                  trend="up"
                  change="Delivered items"
                  icon={<span>🏆</span>}
                  onClick={() => handleTabSelect('tasks')}
                />
                <MetricCard
                  label="Milestones"
                  value={milestones.length}
                  trend="up"
                  change="Checkpoints"
                  icon={<span>🚩</span>}
                  onClick={() => handleTabSelect('approvals')}
                />
                <MetricCard
                  label="Timesheets"
                  value={timesheets.length}
                  trend="neutral"
                  change="Log entries"
                  icon={<span>⏱️</span>}
                  onClick={() => handleTabSelect('timesheets')}
                />
                <MetricCard
                  label="Reports"
                  value={reports.length}
                  trend="up"
                  change="Generated analytics"
                  icon={<span>📊</span>}
                  onClick={() => handleTabSelect('overview')}
                />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-zinc-200">Delivery Sprint Board</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['todo', 'in_progress', 'completed'].map((colStatus) => {
                    const colTasks = tasks.filter((t) => (t.status || 'todo').toLowerCase().replace(' ', '_') === colStatus);
                    const displayTitle = colStatus === 'in_progress' ? 'In Progress' : colStatus === 'todo' ? 'To Do' : 'Completed';
                    return (
                      <div key={colStatus} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 flex flex-col">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2a2a2a]">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{displayTitle}</span>
                          <span className="text-[10px] bg-[#222] text-[#d4af37] px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                        </div>
                        <div className="space-y-2.5 flex-1">
                          {colTasks.map((task) => (
                            <div key={task.id} className="p-3.5 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-[#d4af37]/40 transition-colors">
                              <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{task.description || 'Sprint deliverable item.'}</p>
                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#2a2a2a]/60">
                                <span className="text-[10px] font-semibold text-[#d4af37]">{task.project?.title || task.project?.name || 'Project'}</span>
                                <div className="flex gap-1">
                                  {colStatus !== 'completed' && (
                                    <button
                                      onClick={() => handleTaskStatusChange(task.id, colStatus === 'todo' ? 'in_progress' : 'completed')}
                                      className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/25 font-semibold"
                                    >
                                      Move →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {colTasks.length === 0 && (
                            <div className="text-center py-8 px-4 text-xs font-medium text-zinc-400 bg-[#161616] border border-dashed border-[#2a2a2a] rounded-lg my-2 flex flex-col items-center justify-center gap-1">
                              <span className="text-zinc-500 text-base">📋</span>
                              <span>No tasks in {displayTitle}</span>
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

          {/* TAB 2: TEAM PROJECTS */}
          {activeTab === 'projects' && (
            <Card
              title="Team Projects Overview"
              subtitle="Delivery progress, budgets, and engineering team allocations"
              action={
                <Button size="sm" variant="gold" onClick={() => setAssignTeamModalOpen(true)} icon={<span>👥</span>}>
                  Assign Team
                </Button>
              }
            >
              {projects.length === 0 ? (
                <EmptyState title="No Active Projects" message="Assigned team projects will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Project Title</th>
                        <th className="py-3 px-4">Progress</th>
                        <th className="py-3 px-4">Budget</th>
                        <th className="py-3 px-4">Assigned Team</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {projects.map((p) => {
                        const assignedMembers = projectMembers.filter((pm) => String(pm.project_id) === String(p.id));
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-semibold text-white">{p.title || p.name || 'Enterprise System Implementation'}</td>
                            <td className="py-3 px-4">
                              <div className="w-24 bg-[#222] rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#d4af37] h-full" style={{ width: `${p.progress_percent ?? p.progress ?? 0}%` }}></div>
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-0.5 block">{p.progress_percent ?? p.progress ?? 0}%</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-300">${Number(p.budget || 0).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {assignedMembers.length > 0 ? (
                                  assignedMembers.map((m) => (
                                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333] text-[10px] text-zinc-200 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                                      <span>{m.member_name}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-zinc-400 italic">No team assigned</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4"><StatusBadge status={p.status || 'active'} /></td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setNewAssignment((prev) => ({ ...prev, project_id: p.id }));
                                  setAssignTeamModalOpen(true);
                                }}
                                icon={<span>👥</span>}
                              >
                                Assign Team
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: TASK BOARD */}
          {activeTab === 'tasks' && (
            <Card
              title="Task Board"
              subtitle={`Total of ${tasks.length} tasks scheduled across active sprints`}
              action={
                <Button size="sm" variant="gold" onClick={() => setModalOpen(true)}>
                  + Create Task
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                    <tr>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-semibold text-white">{t.title}</td>
                        <td className="py-3 px-4 text-zinc-300">{t.project?.title || t.project?.name || 'General Project'}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-mono text-zinc-400">{t.priority || 'medium'}</td>
                        <td className="py-3 px-4"><StatusBadge status={t.status || 'todo'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: APPROVALS */}
          {activeTab === 'approvals' && (
            <Card title="Deliverable & Milestone Approvals" subtitle="Milestone sign-offs and client deliverable verification">
              {milestones.length === 0 ? (
                <EmptyState title="No Deliverables Pending Approval" message="Milestones awaiting client sign-off will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Milestone Title</th>
                        <th className="py-3 px-4">Target Date</th>
                        <th className="py-3 px-4">Approval Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {milestones.map((m) => (
                        <tr key={m.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{m.title || 'Project Milestone'}</td>
                          <td className="py-3 px-4 text-zinc-400">{m.due_date || 'Ongoing'}</td>
                          <td className="py-3 px-4"><StatusBadge status={m.status || 'approved'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 5: ATTENDANCE WITH INTERACTIVE TAP IN / TAP OUT (ONCE PER DAY) */}
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

          {/* TAB 6: LEAVES WITH APPLY LEAVE MODAL ACTION */}
          {activeTab === 'leaves' && (
            <Card
              title="Team Leave Requests"
              subtitle="Time off and PTO applications"
              action={
                <Button size="sm" variant="gold" onClick={() => setLeaveModalOpen(true)} icon={<span>+</span>}>
                  Apply Leave
                </Button>
              }
            >
              {leaves.length === 0 ? (
                <EmptyState title="No Leave Applications" message="Click 'Apply Leave' to submit a time off request." />
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

          {/* TAB 7: TIMESHEETS WITH LOG HOURS MODAL ACTION */}
          {activeTab === 'timesheets' && (
            <Card
              title="Timesheets Log"
              subtitle="Engineering hours logged per sprint deliverable"
              action={
                <Button size="sm" variant="gold" onClick={() => setTimesheetModalOpen(true)} icon={<span>+</span>}>
                  Log Hours
                </Button>
              }
            >
              {timesheets.length === 0 ? (
                <EmptyState title="No Timesheet Logs" message="Click 'Log Hours' to add a new work timesheet entry." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#2a2a2a]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Work Description</th>
                        <th className="py-3 px-4">Hours Logged</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {timesheets.map((ts) => (
                        <tr key={ts.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{ts.date || new Date(ts.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-zinc-300">{ts.description || 'Feature engineering & sprint task'}</td>
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

          {/* TAB 8: PAYSLIPS */}
          {activeTab === 'payslips' && (
            <Card
              title="Team Compensation & Payslips"
              subtitle="Monthly salary statements and payslip records"
              action={
                <Button size="sm" variant="gold" onClick={() => setPayslipModalOpen(true)} icon={<span>+</span>}>
                  Generate Payslip
                </Button>
              }
            >
              <div className="mb-4 p-4 rounded-xl bg-[#121212] border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">How Payslips are Generated</h4>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Payslips are generated monthly based on active employment contracts, logged billable hours from timesheets, and approved leave deductions.
                  </p>
                </div>
                <Button variant="gold" size="xs" onClick={() => setPayslipModalOpen(true)}>
                  Generate Payslip
                </Button>
              </div>

              {payslips.length === 0 ? (
                <EmptyState
                  title="No Payslips Issued"
                  message="Engineering team compensation statements will appear here."
                  action={
                    <Button size="sm" variant="gold" onClick={() => setPayslipModalOpen(true)}>
                      + Generate First Payslip
                    </Button>
                  }
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
                          <td className="py-3 px-4 text-zinc-300">{ps.employee_name || 'Engineering Staff'}</td>
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
        </>
      )}

      {/* CREATE TASK MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Delivery Task">
        {formError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Task Title</label>
            <input
              required
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="e.g. Implement OAuth2 Refresh Logic"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Assign to Project</label>
            <select
              value={newTask.project_id}
              onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="gold" loading={formLoading} className="w-full py-2">
            Create Task
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
              placeholder="Feature implementation, sprint task deliverable, and client sync..."
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

      {/* ASSIGN TEAM MODAL (MULTI-MEMBER ASSIGNMENT) */}
      <Modal isOpen={assignTeamModalOpen} onClose={() => setAssignTeamModalOpen(false)} title="Assign Team Members to Project">
        <form onSubmit={handleAssignTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Select Target Project</label>
            <select
              required
              value={newAssignment.project_id}
              onChange={(e) => setNewAssignment({ ...newAssignment, project_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Choose Active Project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title || p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Select Team Members to Assign (Multiple allowed)</label>
            <div className="space-y-2 bg-[#121212] p-3 border border-[#2a2a2a] rounded-lg max-h-44 overflow-y-auto">
              {[
                'Rahul Sharma (Lead Architect)',
                'Priya Patel (Frontend Lead)',
                'Amit Kumar (DevOps Specialist)',
                'Neha Singh (QA Automation)',
                'Vikas Reddy (Backend Engineer)',
                'Ananya Roy (UI/UX Designer)',
              ].map((memberOption) => {
                const isChecked = (newAssignment.selected_members || []).includes(memberOption);
                return (
                  <label key={memberOption} className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewAssignment((prev) => ({
                            ...prev,
                            selected_members: [...(prev.selected_members || []), memberOption],
                          }));
                        } else {
                          setNewAssignment((prev) => ({
                            ...prev,
                            selected_members: (prev.selected_members || []).filter((m) => m !== memberOption),
                          }));
                        }
                      }}
                      className="rounded border-[#333] bg-[#181818] text-[#d4af37] focus:ring-[#d4af37]"
                    />
                    <span>{memberOption}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Or Add Additional Team Member Name</label>
            <input
              type="text"
              value={newAssignment.custom_member_name}
              onChange={(e) => setNewAssignment({ ...newAssignment, custom_member_name: e.target.value })}
              placeholder="e.g. Suresh Kumar (Full-stack Engineer)"
              className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Default Project Role</label>
              <select
                value={newAssignment.role}
                onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="Lead Software Architect">Lead Software Architect</option>
                <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
                <option value="Backend DevOps Engineer">Backend DevOps Engineer</option>
                <option value="Full-stack Developer">Full-stack Developer</option>
                <option value="QA / Test Automation Lead">QA / Test Automation Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Allocation Capacity</label>
              <select
                value={newAssignment.allocation}
                onChange={(e) => setNewAssignment({ ...newAssignment, allocation: e.target.value })}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="100% Full-time">100% Full-time</option>
                <option value="75% Allocation">75% Allocation</option>
                <option value="50% Part-time">50% Part-time</option>
                <option value="25% Advisory">25% Advisory</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="gold" loading={assignTeamLoading} className="w-full py-2">
            Assign Team Member(s)
          </Button>
        </form>
      </Modal>
    </PortalLayout>
  );
}
