"use client";
import React, { useState } from 'react';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { Icon } from '../../../../shared/components';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  project: string;
  points: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedRole: 'developer' | 'qa_tester' | 'devops' | 'architect';
  assigneeName: string;
  status: 'todo' | 'in_progress' | 'ready_for_qa' | 'bug_found' | 'done';
  bugDetails?: {
    title: string;
    severity: 'critical' | 'high' | 'medium';
    notes: string;
    reportedBy: string;
  };
}

export interface AssignableEmployee {
  id: string;
  name: string;
  code: string;
  email: string;
  password: string;
  role: 'developer' | 'qa_tester' | 'devops';
  designation: string;
  portal: string;
  portalName: string;
}

export const SYSTEM_EMPLOYEES: AssignableEmployee[] = [
  {
    id: 'EMP-011',
    name: 'Alex Mercer',
    code: 'EMP-011',
    email: 'developer@vpdtechnologies.com',
    password: 'Password123!',
    role: 'developer',
    designation: 'Lead Fullstack Engineer',
    portal: '/employee',
    portalName: 'Developer / Employee Portal',
  },
  {
    id: 'EMP-012',
    name: 'Rahul Sharma',
    code: 'EMP-012',
    email: 'developer@vpdtechnologies.com',
    password: 'Password123!',
    role: 'developer',
    designation: 'Senior Backend Engineer (FastAPI)',
    portal: '/employee',
    portalName: 'Developer / Employee Portal',
  },
  {
    id: 'EMP-014',
    name: 'John Staff',
    code: 'EMP-014',
    email: 'employee@vpdtechnologies.com',
    password: 'Password123!',
    role: 'developer',
    designation: 'Full Stack Engineer',
    portal: '/employee',
    portalName: 'Employee Portal',
  },
  {
    id: 'EMP-015',
    name: 'Priya Patel',
    code: 'EMP-015',
    email: 'qa@vpdtechnologies.com',
    password: 'Password123!',
    role: 'qa_tester',
    designation: 'Lead QA Specialist & Automation',
    portal: '/employee',
    portalName: 'QA / Employee Portal',
  },
  {
    id: 'EMP-016',
    name: 'Sneha Rao',
    code: 'EMP-016',
    email: 'qa@vpdtechnologies.com',
    password: 'Password123!',
    role: 'qa_tester',
    designation: 'QA Integration & Security Tester',
    portal: '/employee',
    portalName: 'QA / Employee Portal',
  },
  {
    id: 'EMP-019',
    name: 'Jonathan Reed',
    code: 'EMP-019',
    email: 'employee@vpdtechnologies.com',
    password: 'Password123!',
    role: 'devops',
    designation: 'Cloud Infrastructure & DevOps Engineer',
    portal: '/employee',
    portalName: 'Employee Portal',
  },
];

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: 'TSK-101',
    title: 'Implement JWT refresh rotation in FastAPI',
    description: 'Ensure token expiration triggers seamless token refresh with Redis blocklist validation.',
    project: 'Core Banking Modernization',
    points: '5 SP',
    priority: 'high',
    assignedRole: 'developer',
    assigneeName: 'Alex Mercer (Lead Dev)',
    status: 'todo',
  },
  {
    id: 'TSK-102',
    title: 'Audit Supabase transaction pooler connection timeouts',
    description: 'Investigate connection pooling spikes during high concurrent transaction volume.',
    project: 'Core Banking Modernization',
    points: '3 SP',
    priority: 'urgent',
    assignedRole: 'developer',
    assigneeName: 'Rahul Sharma (Senior Backend)',
    status: 'in_progress',
  },
  {
    id: 'TSK-103',
    title: 'Validate Payment Gateway webhook signature verification',
    description: 'Development finished. Ready for QA test suite execution and negative scenario testing.',
    project: 'Payment Gateway Integration',
    points: '5 SP',
    priority: 'high',
    assignedRole: 'qa_tester',
    assigneeName: 'Priya Patel (Senior QA)',
    status: 'ready_for_qa',
  },
  {
    id: 'TSK-104',
    title: 'Fix edge case: Checkout cart totals mismatch with multi-currency',
    description: 'Discovered rounding discrepancy in CAD/USD currency exchange rates during checkout.',
    project: 'Payment Gateway Integration',
    points: '8 SP',
    priority: 'urgent',
    assignedRole: 'developer',
    assigneeName: 'Alex Mercer (Lead Dev)',
    status: 'bug_found',
    bugDetails: {
      title: 'Rounding error on 3-decimal currencies',
      severity: 'high',
      notes: 'Amounts over $1,000 exhibit a 1-cent variance due to premature float truncation.',
      reportedBy: 'Priya Patel (QA)',
    },
  },
  {
    id: 'TSK-105',
    title: 'Setup Argon2id user credential encryption & password hashing',
    description: 'Verified by QA test suite. Passwords securely hashed with constant-time verification.',
    project: 'Core Banking Modernization',
    points: '3 SP',
    priority: 'medium',
    assignedRole: 'qa_tester',
    assigneeName: 'Priya Patel (Senior QA)',
    status: 'done',
  },
];

const COLUMNS = [
  {
    key: 'todo',
    title: '1. To Do (Assigned to Dev)',
    desc: 'Backlog assigned by PM to Developers',
    badgeColor: 'bg-zinc-800 text-zinc-300',
  },
  {
    key: 'in_progress',
    title: '2. In Development',
    desc: 'Developers actively coding & building',
    badgeColor: 'bg-blue-950/80 text-blue-300 border border-blue-800/60',
  },
  {
    key: 'ready_for_qa',
    title: '3. Ready for QA / Testing',
    desc: 'Dev complete, handed over to Testers',
    badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
  },
  {
    key: 'bug_found',
    title: '4. Bug Found / In Fix',
    desc: 'QA found defects → Returned to Dev',
    badgeColor: 'bg-red-950/80 text-red-300 border border-red-800/60',
  },
  {
    key: 'done',
    title: '5. Verified & Done',
    desc: 'QA tested & verified → Sprint Complete',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
  },
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [filterProject, setFilterProject] = useState('all');

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [selectedTaskForBug, setSelectedTaskForBug] = useState<KanbanTask | null>(null);

  // New Task Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProject, setNewProject] = useState('Core Banking Modernization');
  const [newRole, setNewRole] = useState<'developer' | 'qa_tester' | 'devops'>('developer');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('EMP-011');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newPoints, setNewPoints] = useState('5 SP');
  const [copiedCredential, setCopiedCredential] = useState<boolean>(false);

  // Active selected employee
  const selectedEmp = SYSTEM_EMPLOYEES.find((e) => e.id === selectedEmployeeId) || SYSTEM_EMPLOYEES[0];

  // Auto-select employee when role changes
  const handleRoleChange = (role: 'developer' | 'qa_tester' | 'devops') => {
    setNewRole(role);
    const matching = SYSTEM_EMPLOYEES.filter((e) => e.role === role);
    if (matching.length > 0) {
      setSelectedEmployeeId(matching[0].id);
    }
  };

  // Auto-sync role when employee changes
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const emp = SYSTEM_EMPLOYEES.find((e) => e.id === employeeId);
    if (emp && emp.role !== newRole) {
      setNewRole(emp.role);
    }
  };

  // Filter employees matching role or all
  const filteredEmployees = SYSTEM_EMPLOYEES.filter((e) => e.role === newRole);
  const employeeOptions = (filteredEmployees.length > 0 ? filteredEmployees : SYSTEM_EMPLOYEES).map((e) => ({
    value: e.id,
    label: `${e.name} — ${e.designation} (${e.code})`,
  }));

  // Bug Report Form
  const [bugTitle, setBugTitle] = useState('');
  const [bugSeverity, setBugSeverity] = useState<'critical' | 'high' | 'medium'>('high');
  const [bugNotes, setBugNotes] = useState('');

  // Handle Create / Assign Daily Task by PM
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      project: newProject,
      priority: newPriority,
      points: newPoints,
      assignedRole: newRole,
      assigneeName: `${selectedEmp.name} (${selectedEmp.designation})`,
      status: 'todo',
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setAssignModalOpen(false);
  };

  // Developer starts working
  const handleStartDev = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' } : t))
    );
  };

  // Developer completes dev -> Handover to QA
  const handleDevComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'ready_for_qa',
              assignedRole: 'qa_tester',
              assigneeName: 'Priya Patel (Senior QA)',
            }
          : t
      )
    );
  };

  // QA passes test -> Done
  const handlePassQA = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'done' } : t))
    );
  };

  // Open bug modal
  const handleOpenBugModal = (task: KanbanTask) => {
    setSelectedTaskForBug(task);
    setBugTitle(`Defect found in ${task.title.slice(0, 30)}...`);
    setBugNotes('');
    setBugSeverity('high');
    setBugModalOpen(true);
  };

  // Submit bug report -> Moves to bug_found and returns to Developer
  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForBug) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskForBug.id
          ? {
              ...t,
              status: 'bug_found',
              assignedRole: 'developer',
              assigneeName: 'Alex Mercer (Lead Dev)',
              bugDetails: {
                title: bugTitle.trim() || 'Functional defect identified',
                severity: bugSeverity,
                notes: bugNotes.trim() || 'Fails QA criteria. Please review and patch.',
                reportedBy: 'Priya Patel (QA Tester)',
              },
            }
          : t
      )
    );

    setBugModalOpen(false);
    setSelectedTaskForBug(null);
  };

  // Developer patches bug -> Request Retest
  const handleBugResolved = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'ready_for_qa',
              assignedRole: 'qa_tester',
              assigneeName: 'Priya Patel (Senior QA)',
            }
          : t
      )
    );
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterProject === 'all') return true;
    return t.project.toLowerCase().includes(filterProject.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#D4AF37]">⚡</span> Sprint & QA Delivery Kanban Board
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full lifecycle: Task Assigned ➔ Dev Complete ➔ QA Testing ➔ Bug Fix & Retest ➔ Verified
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#181818] border border-[#2F2F2F] text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Projects</option>
            <option value="Core Banking">Core Banking Modernization</option>
            <option value="Payment Gateway">Payment Gateway Integration</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAssignModalOpen(true)}
          >
            + Assign Daily Task
          </Button>
        </div>
      </div>

      {/* Interactive Workflow Guide Ribbon */}
      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-medium">
          <span className="text-[#D4AF37] font-bold">Lifecycle:</span>
          <span>1. PM Assigns Dev</span>
          <span className="text-zinc-600">➔</span>
          <span>2. Dev Codes</span>
          <span className="text-zinc-600">➔</span>
          <span className="text-amber-400">3. Handover to QA</span>
          <span className="text-zinc-600">➔</span>
          <span className="text-red-400">4. Bug Fix (If Found)</span>
          <span className="text-zinc-600">➔</span>
          <span className="text-emerald-400">5. QA Passed & Done</span>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Active Sprint: {tasks.filter((t) => t.status !== 'done').length} in flight •{' '}
          {tasks.filter((t) => t.status === 'done').length} completed
        </div>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex flex-col min-h-[500px] shadow-sm hover:border-[#383838] transition-colors"
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-[#262626]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                    {colTasks.length > 0 && col.key !== 'done' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                    {col.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-all ${col.badgeColor} ${colTasks.length > 0 ? 'scale-105' : 'opacity-70'}`}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">{col.desc}</p>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-28 border border-dashed border-[#262626] rounded-lg flex items-center justify-center text-[11px] text-zinc-600 italic">
                    No tickets in this stage
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border kanban-card-fx space-y-2.5 cursor-grab active:cursor-grabbing ${
                        task.status === 'bug_found'
                          ? 'bg-[#1C1212]/90 border-red-900/60 hover:border-red-500 shadow-red-950/20'
                          : task.status === 'ready_for_qa'
                          ? 'bg-[#1A1810]/90 border-amber-900/60 hover:border-amber-500 shadow-amber-950/20'
                          : task.status === 'done'
                          ? 'bg-[#111A13]/90 border-emerald-900/60 hover:border-emerald-500 shadow-emerald-950/20'
                          : 'bg-[#191919]/90 border-[#2A2A2A] hover:border-[#D4AF37]/60'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-zinc-400 font-bold">{task.id}</span>
                        <StatusBadge status={task.priority} />
                      </div>

                      {/* Project Tag */}
                      <p className="text-[10px] text-[#D4AF37] font-semibold truncate flex items-center gap-1">
                        <span>📁</span> {task.project}
                      </p>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-white leading-snug hover:text-[#D4AF37] transition-colors">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Bug Details Callout (If active bug) */}
                      {task.status === 'bug_found' && task.bugDetails && (
                        <div className="p-2 bg-red-950/70 border border-red-800/80 rounded-lg space-y-1 text-[11px] animate-fadeIn">
                          <div className="flex items-center justify-between text-red-300 font-bold">
                            <span>🐞 {task.bugDetails.title}</span>
                            <span className="uppercase text-[9px] px-1 py-0.5 rounded bg-red-900 text-white font-mono">
                              {task.bugDetails.severity}
                            </span>
                          </div>
                          <p className="text-red-200/90 text-[10px]">
                            {task.bugDetails.notes}
                          </p>
                          <p className="text-red-400/80 text-[9px] italic">
                            Reported by: {task.bugDetails.reportedBy}
                          </p>
                        </div>
                      )}

                      {/* Assignee Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#262626] text-[10px] text-zinc-400">
                        <span className="truncate max-w-[120px] flex items-center gap-1 font-medium">
                          <span>👤</span> {task.assigneeName}
                        </span>
                        <span className="font-mono text-amber-400/80 bg-zinc-800/70 px-1.5 py-0.5 rounded text-[9px]">{task.points}</span>
                      </div>

                      {/* Workflow Transitions Actions */}
                      <div className="pt-2 border-t border-[#262626]">
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleStartDev(task.id)}
                            className="w-full py-1 text-[11px] font-semibold rounded bg-[#252525] hover:bg-[#303030] text-blue-300 transition-all active:scale-95 shadow-sm"
                          >
                            ▶ Start Development
                          </button>
                        )}

                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleDevComplete(task.id)}
                            className="w-full py-1 text-[11px] font-semibold rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-800/60 text-amber-200 transition-all active:scale-95 shadow-sm"
                          >
                            ✓ Dev Complete ➔ Handover to QA
                          </button>
                        )}

                        {task.status === 'ready_for_qa' && (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handlePassQA(task.id)}
                              className="py-1 text-[10px] font-bold rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 transition-all active:scale-95 shadow-sm"
                            >
                              ✓ Pass QA
                            </button>
                            <button
                              onClick={() => handleOpenBugModal(task)}
                              className="py-1 text-[10px] font-bold rounded bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 transition-all active:scale-95 shadow-sm"
                            >
                              🐞 Report Bug
                            </button>
                          </div>
                        )}

                        {task.status === 'bug_found' && (
                          <button
                            onClick={() => handleBugResolved(task.id)}
                            className="w-full py-1 text-[11px] font-bold rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-200 transition-all active:scale-95 shadow-sm"
                          >
                            🔧 Bug Fixed ➔ Request Retest
                          </button>
                        )}

                        {task.status === 'done' && (
                          <span className="block text-center text-[10px] text-emerald-400 font-semibold py-0.5">
                            ✓ Verified & Ready for Invoicing
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Project Manager Assign Daily Task */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Daily Task to Employee"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Summary / Title *"
            placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
              Task Specifications & Acceptance Criteria
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#171717] border border-[#2A2A2A] focus:border-[#D4AF37] rounded-xl text-white placeholder-[#71717A] text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none"
              placeholder="Detailed instructions for the assigned engineer..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Project"
              options={[
                { value: 'Core Banking Modernization', label: 'Core Banking Modernization' },
                { value: 'Payment Gateway Integration', label: 'Payment Gateway Integration' },
                { value: 'Healthcare Data Warehouse', label: 'Healthcare Data Warehouse' },
              ]}
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
                Engineering Role *
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('developer')}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${
                    newRole === 'developer'
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>💻</span>
                  <span>Developer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('qa_tester')}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${
                    newRole === 'qa_tester'
                      ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🧪</span>
                  <span>QA Tester</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('devops')}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${
                    newRole === 'devops'
                      ? 'bg-purple-600/20 border-purple-500/60 text-purple-300 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🚀</span>
                  <span>DevOps</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Assign Employee *
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  ⚡ Auto-Selected
                </span>
              </div>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#171717] border border-[#2A2A2A] focus:border-[#D4AF37] rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
              >
                {employeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#171717] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
            />
            <Select
              label="Story Points"
              options={[
                { value: '1 SP', label: '1 SP (Quick)' },
                { value: '2 SP', label: '2 SP (Small)' },
                { value: '3 SP', label: '3 SP (Medium)' },
                { value: '5 SP', label: '5 SP (Complex)' },
                { value: '8 SP', label: '8 SP (Major)' },
              ]}
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
            />
          </div>

          {/* Real Employee Login Credentials & Action Capabilities Card */}
          <div className="p-3.5 bg-gradient-to-br from-zinc-900 to-[#18181b] border border-amber-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Employee Login & Action Credentials</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                🟢 Active & Verified Account
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-black/40 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Login Email</span>
                <span className="font-mono text-amber-300 font-semibold mt-0.5 block truncate">
                  {selectedEmp.email}
                </span>
              </div>
              <div className="p-2 bg-black/40 rounded border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Password</span>
                  <span className="font-mono text-zinc-200 font-semibold mt-0.5 block">
                    {selectedEmp.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(`${selectedEmp.email} | ${selectedEmp.password}`);
                    }
                    setCopiedCredential(true);
                    setTimeout(() => setCopiedCredential(false), 2500);
                  }}
                  className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded border border-zinc-700 transition-colors"
                >
                  {copiedCredential ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-black/40 rounded border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Assigned Portal Route:</span>
                <span className="text-amber-400 font-medium">
                  {selectedEmp.portalName} ({selectedEmp.portal})
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">
                💡 <strong>Action Flow:</strong> <span className="text-white font-medium">{selectedEmp.name}</span> has full credentials to sign in. Once logged in, they can view this task on their board, initiate coding, and handover completed builds to QA.
              </p>
              <div className="pt-1 flex items-center justify-end gap-3 text-[10px]">
                <a
                  href="/employee"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
                >
                  <span>Test Login in Employee Portal ↗</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#262626]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              ✓ Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: QA Tester Reports Bug */}
      <Modal
        isOpen={bugModalOpen}
        onClose={() => setBugModalOpen(false)}
        title="Report Bug / Return to Developer"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitBug} className="space-y-4">
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-200">
            Reporting a defect will automatically move ticket{' '}
            <strong className="text-white font-mono">{selectedTaskForBug?.id}</strong> back to
            the Developer to patch and prepare for re-testing.
          </div>

          <Input
            label="Bug / Defect Summary *"
            value={bugTitle}
            onChange={(e) => setBugTitle(e.target.value)}
            required
          />

          <Select
            label="Defect Severity"
            options={[
              { value: 'critical', label: 'Critical Blocker (Must Fix Immediately)' },
              { value: 'high', label: 'High Priority (Regression / Failure)' },
              { value: 'medium', label: 'Medium (Cosmetic / Edge Case)' },
            ]}
            value={bugSeverity}
            onChange={(e) => setBugSeverity(e.target.value as any)}
          />

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
              Steps to Reproduce / Defect Notes *
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#171717] border border-red-900/60 focus:border-red-500 rounded-xl text-white placeholder-[#71717A] text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
              placeholder="1. Navigate to endpoint... 2. Expected output vs Actual output..."
              value={bugNotes}
              onChange={(e) => setBugNotes(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#262626]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setBugModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit">
              🐞 Log Bug & Return to Dev
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
