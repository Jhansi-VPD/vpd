"use client";
import React, { useState } from 'react';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';

export interface ProjectTeamMember {
  id: string;
  name: string;
  code: string;
  email: string;
  project: string;
  roleCategory: 'developer' | 'qa_tester' | 'devops' | 'architect';
  projectRole: string;
  allocation: string;
  tasksCount: number;
  status: 'active' | 'on_leave';
}

const INITIAL_MEMBERS: ProjectTeamMember[] = [
  {
    id: 'MEM-1',
    name: 'Alex Mercer',
    code: 'EMP-011',
    email: 'alex.m@vpdtechnologies.com',
    project: 'Core Banking Modernization',
    roleCategory: 'developer',
    projectRole: 'Fullstack Lead Engineer',
    allocation: '100% Full-Time',
    tasksCount: 4,
    status: 'active',
  },
  {
    id: 'MEM-2',
    name: 'Rahul Sharma',
    code: 'EMP-012',
    email: 'rahul.s@vpdtechnologies.com',
    project: 'Core Banking Modernization',
    roleCategory: 'developer',
    projectRole: 'Senior Backend Engineer (FastAPI)',
    allocation: '100% Full-Time',
    tasksCount: 3,
    status: 'active',
  },
  {
    id: 'MEM-3',
    name: 'Priya Patel',
    code: 'EMP-015',
    email: 'priya.p@vpdtechnologies.com',
    project: 'Core Banking Modernization',
    roleCategory: 'qa_tester',
    projectRole: 'Lead QA / Test Specialist',
    allocation: '100% Full-Time',
    tasksCount: 5,
    status: 'active',
  },
  {
    id: 'MEM-4',
    name: 'Jonathan Reed',
    code: 'EMP-018',
    email: 'jonathan.r@vpdtechnologies.com',
    project: 'Core Banking Modernization',
    roleCategory: 'devops',
    projectRole: 'Cloud & Kubernetes SRE',
    allocation: '50% Shared',
    tasksCount: 2,
    status: 'active',
  },
  {
    id: 'MEM-5',
    name: 'Sneha Rao',
    code: 'EMP-021',
    email: 'sneha.r@vpdtechnologies.com',
    project: 'Payment Gateway Integration',
    roleCategory: 'qa_tester',
    projectRole: 'Automation QA Engineer',
    allocation: '100% Full-Time',
    tasksCount: 3,
    status: 'active',
  },
  {
    id: 'MEM-6',
    name: 'Vikram Singh',
    code: 'EMP-024',
    email: 'vikram.s@vpdtechnologies.com',
    project: 'Payment Gateway Integration',
    roleCategory: 'developer',
    projectRole: 'Senior Node.js / Stripe Developer',
    allocation: '100% Full-Time',
    tasksCount: 4,
    status: 'active',
  },
];

export const Team: React.FC = () => {
  const [members, setMembers] = useState<ProjectTeamMember[]>(INITIAL_MEMBERS);
  const [filterProject, setFilterProject] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // New allocation form
  const [selectedProject, setSelectedProject] = useState('Core Banking Modernization');
  const [employeeName, setEmployeeName] = useState('Alex Mercer');
  const [employeeCode, setEmployeeCode] = useState('EMP-011');
  const [roleCategory, setRoleCategory] = useState<'developer' | 'qa_tester' | 'devops' | 'architect'>('developer');
  const [projectRole, setProjectRole] = useState('Senior Fullstack Developer');
  const [allocation, setAllocation] = useState('100% Full-Time');

  const handleAllocateMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: ProjectTeamMember = {
      id: `MEM-${Date.now()}`,
      name: employeeName,
      code: employeeCode,
      email: `${employeeName.toLowerCase().replace(/\s+/g, '.')}@vpdtechnologies.com`,
      project: selectedProject,
      roleCategory,
      projectRole,
      allocation,
      tasksCount: 0,
      status: 'active',
    };

    setMembers((prev) => [newMember, ...prev]);
    setModalOpen(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredMembers = members.filter((m) => {
    const matchProj = filterProject === 'all' || m.project === filterProject;
    const matchRole = filterRole === 'all' || m.roleCategory === filterRole;
    return matchProj && matchRole;
  });

  const devCount = members.filter((m) => m.roleCategory === 'developer').length;
  const qaCount = members.filter((m) => m.roleCategory === 'qa_tester').length;
  const devopsCount = members.filter((m) => m.roleCategory === 'devops').length;

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#D4AF37]">👥</span> Project Team Allocation & Roster
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Assign Developers, QA Testers, and DevOps specialists to active projects
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          + Allocate Team Member
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-slideUp">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Allocated Staff
          </span>
          <p className="text-2xl font-bold text-white mt-1">{members.length}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Engineers on active projects</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            💻 Developers
          </span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{devCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Fullstack, Backend & Frontend</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            🧪 QA / Test Engineers
          </span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{qaCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Manual & Automation Testers</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            ☁️ DevOps / Cloud
          </span>
          <p className="text-2xl font-bold text-purple-400 mt-1">{devopsCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Infrastructure & CI/CD</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] border border-[#2A2A2A] rounded-xl p-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-400 font-semibold">Filter by Project:</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2F2F2F] text-xs text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All Projects</option>
            <option value="Core Banking Modernization">Core Banking Modernization</option>
            <option value="Payment Gateway Integration">Payment Gateway Integration</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'developer', label: '💻 Developers' },
            { id: 'qa_tester', label: '🧪 QA Testers' },
            { id: 'devops', label: '☁️ DevOps' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterRole(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === tab.id
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white bg-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Roster Table */}
      <DataTable
        data={filteredMembers}
        columns={[
          {
            header: 'Engineer & Code',
            accessor: (row) => (
              <div className="py-1">
                <p className="font-semibold text-white text-xs">{row.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {row.code} • {row.email}
                </p>
              </div>
            ),
          },
          {
            header: 'Assigned Project',
            accessor: (row) => (
              <span className="text-xs font-semibold text-[#D4AF37]">
                📁 {row.project}
              </span>
            ),
          },
          {
            header: 'Project Role',
            accessor: (row) => {
              const roleBadge =
                row.roleCategory === 'developer'
                  ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                  : row.roleCategory === 'qa_tester'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  : 'bg-purple-950/80 text-purple-300 border-purple-800/60';

              return (
                <div className="space-y-1">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded border font-mono uppercase font-bold ${roleBadge}`}
                  >
                    {row.roleCategory === 'qa_tester' ? 'QA / Tester' : row.roleCategory}
                  </span>
                  <p className="text-[11px] text-zinc-300 font-medium">{row.projectRole}</p>
                </div>
              );
            },
          },
          {
            header: 'Sprint Allocation',
            accessor: (row) => (
              <span className="px-2.5 py-1 text-xs rounded-full bg-[#1C1A14] text-[#D4AF37] border border-[#D4AF37]/30 font-semibold font-mono">
                {row.allocation}
              </span>
            ),
          },
          {
            header: 'Active Tasks',
            accessor: (row) => (
              <span className="text-xs font-mono text-zinc-200">
                {row.tasksCount} tickets
              </span>
            ),
          },
          {
            header: 'Action',
            accessor: (row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMember(row.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
              >
                Release
              </Button>
            ),
          },
        ]}
      />

      {/* Modal: Allocate Team Member */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Allocate Employee to Project Team"
        maxWidth="md"
      >
        <form onSubmit={handleAllocateMember} className="space-y-4">
          <Select
            label="Target Project *"
            options={[
              { value: 'Core Banking Modernization', label: 'Core Banking Modernization' },
              { value: 'Payment Gateway Integration', label: 'Payment Gateway Integration' },
              { value: 'Healthcare Data Warehouse', label: 'Healthcare Data Warehouse' },
              { value: 'E-Commerce Platform Rebuild', label: 'E-Commerce Platform Rebuild' },
            ]}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Select Employee *"
              options={[
                { value: 'Alex Mercer', label: 'Alex Mercer (EMP-011)' },
                { value: 'Rahul Sharma', label: 'Rahul Sharma (EMP-012)' },
                { value: 'Priya Patel', label: 'Priya Patel (EMP-015)' },
                { value: 'Jonathan Reed', label: 'Jonathan Reed (EMP-018)' },
                { value: 'Sneha Rao', label: 'Sneha Rao (EMP-021)' },
                { value: 'Vikram Singh', label: 'Vikram Singh (EMP-024)' },
              ]}
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value);
                const codeMap: any = {
                  'Alex Mercer': 'EMP-011',
                  'Rahul Sharma': 'EMP-012',
                  'Priya Patel': 'EMP-015',
                  'Jonathan Reed': 'EMP-018',
                  'Sneha Rao': 'EMP-021',
                  'Vikram Singh': 'EMP-024',
                };
                setEmployeeCode(codeMap[e.target.value] || 'EMP-099');
              }}
            />

            <Select
              label="Role Discipline *"
              options={[
                { value: 'developer', label: '💻 Developer' },
                { value: 'qa_tester', label: '🧪 QA / Tester' },
                { value: 'devops', label: '☁️ DevOps Engineer' },
                { value: 'architect', label: '🏛️ Solutions Architect' },
              ]}
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value as any)}
            />
          </div>

          <Input
            label="Specific Project Designation / Role"
            placeholder="e.g. Lead QA Specialist or Senior Backend Developer"
            value={projectRole}
            onChange={(e) => setProjectRole(e.target.value)}
          />

          <Select
            label="Sprint Allocation %"
            options={[
              { value: '100% Full-Time', label: '100% Dedicated (Full-Time)' },
              { value: '75% High Allocation', label: '75% Allocation' },
              { value: '50% Shared Allocation', label: '50% Shared (Split between 2 projects)' },
              { value: '25% Advisory Allocation', label: '25% Advisory / Code Reviewer' },
            ]}
            value={allocation}
            onChange={(e) => setAllocation(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#262626]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              ✓ Allocate to Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;
