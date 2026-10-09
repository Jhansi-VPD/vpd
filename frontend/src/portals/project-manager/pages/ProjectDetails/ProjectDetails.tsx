"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import { Icon } from '../../../../shared/components';
import { projectsApi } from '../../../../api';
import { demoProjects } from '../../../../data/adminDemo';

interface ProjectDetailData {
  id: string;
  title: string;
  slug: string;
  client: string;
  industry: string;
  status: string;
  progress_percent: number;
  budget: number;
  spent?: number;
  start_date: string;
  end_date: string;
  technology_stack: string[];
  is_crm_provisioned?: boolean;
  contract_ref?: string;
  invoice_status?: 'not_requested' | 'requested' | 'generated';
  invoice_num?: string;
  lead_engineer?: string;
  qa_lead?: string;
  sprint_cycle?: string;
}

interface TeamRosterMember {
  id: string;
  name: string;
  code: string;
  role: 'Developer' | 'QA Tester' | 'DevOps' | 'Architect';
  specialty: string;
  allocation: string;
  tasksCount: number;
  avatarBg: string;
  status: 'active' | 'in_testing' | 'on_review';
}

interface SprintTaskSummary {
  id: string;
  title: string;
  stage: 'todo' | 'in_dev' | 'in_qa' | 'bug_fix' | 'verified';
  assignedTo: string;
  role: 'Developer' | 'QA Tester';
  points: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  bugNote?: string;
}

interface MilestoneItem {
  id: string;
  name: string;
  targetDate: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  completionPercent: number;
  deliverables: string[];
}

export const ProjectDetails: React.FC = () => {
  const [projectsList, setProjectsList] = useState<ProjectDetailData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1');
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'milestones' | 'invoicing'>('overview');
  const [invoiceRequested, setInvoiceRequested] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Initialize projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.getAll();
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ProjectDetailData[] = data.map((p: any, idx: number) => ({
            id: p.id || `p${idx + 1}`,
            title: p.title || p.name || `Project ${idx + 1}`,
            slug: p.slug || `project-${idx + 1}`,
            client: p.client || 'Enterprise Client',
            industry: p.industry || 'Technology & Digital',
            status: p.status || 'in_progress',
            progress_percent: p.progress_percent ?? 65,
            budget: p.budget || 500000,
            spent: p.spent || Math.round((p.budget || 500000) * 0.62),
            start_date: p.start_date || '2026-01-15',
            end_date: p.end_date || '2026-11-30',
            technology_stack: p.technology_stack || ['React', 'FastAPI', 'PostgreSQL'],
            is_crm_provisioned: true,
            contract_ref: `CTR-2026-00${idx + 1}`,
            invoice_status: idx === 1 ? 'generated' : 'not_requested',
            invoice_num: idx === 1 ? 'INV-2026-0091' : undefined,
            lead_engineer: 'Alex Mercer',
            qa_lead: 'Priya Patel',
            sprint_cycle: 'Sprint 14',
          }));
          setProjectsList(mapped);
          setSelectedProjectId(mapped[0].id);
        } else {
          loadFallbackProjects();
        }
      } catch (err) {
        console.warn('API fallback loading', err);
        loadFallbackProjects();
      }
    };

    const loadFallbackProjects = () => {
      const fallback: ProjectDetailData[] = (demoProjects as any[]).map((p, idx) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        client: p.client,
        industry: p.industry,
        status: p.status,
        progress_percent: p.progress_percent || 65,
        budget: p.budget || 600000,
        spent: Math.round((p.budget || 600000) * ((p.progress_percent || 65) / 100)),
        start_date: p.start_date,
        end_date: p.end_date,
        technology_stack: p.technology_stack || ['TypeScript', 'FastAPI', 'PostgreSQL'],
        is_crm_provisioned: true,
        contract_ref: `CTR-2026-00${idx + 1}`,
        invoice_status: p.status === 'completed' ? 'generated' : 'not_requested',
        invoice_num: p.status === 'completed' ? 'INV-2026-0042' : undefined,
        lead_engineer: idx % 2 === 0 ? 'Alex Mercer' : 'Marcus Vance',
        qa_lead: 'Priya Patel',
        sprint_cycle: 'Sprint 14',
      }));
      setProjectsList(fallback);
      setSelectedProjectId(fallback[0]?.id || 'p1');
    };

    fetchProjects();
  }, []);

  // Currently viewed project
  const currentProject = useMemo(() => {
    return projectsList.find((p) => p.id === selectedProjectId) || projectsList[0] || {
      id: 'p1',
      title: 'Core Banking Modernization',
      slug: 'core-banking-modernization',
      client: 'Acme Corp',
      industry: 'Financial Services',
      status: 'in_progress',
      progress_percent: 65,
      budget: 1200000,
      spent: 780000,
      start_date: '2026-01-10',
      end_date: '2026-12-31',
      technology_stack: ['React', 'FastAPI', 'PostgreSQL', 'AWS'],
      is_crm_provisioned: true,
      contract_ref: 'CTR-2026-001',
      invoice_status: 'not_requested',
      lead_engineer: 'Alex Mercer',
      qa_lead: 'Priya Patel',
      sprint_cycle: 'Sprint 14',
    };
  }, [projectsList, selectedProjectId]);

  // Team members allocated to this project
  const teamRoster: TeamRosterMember[] = [
    {
      id: 'MEM-1',
      name: currentProject.lead_engineer || 'Alex Mercer',
      code: 'EMP-011',
      role: 'Developer',
      specialty: 'Fullstack Tech Lead & Architecture',
      allocation: '100% Dedicated',
      tasksCount: 4,
      avatarBg: 'bg-blue-600',
      status: 'active',
    },
    {
      id: 'MEM-2',
      name: 'Rahul Sharma',
      code: 'EMP-012',
      role: 'Developer',
      specialty: 'Senior Backend Engineer (FastAPI / DB)',
      allocation: '100% Dedicated',
      tasksCount: 3,
      avatarBg: 'bg-indigo-600',
      status: 'active',
    },
    {
      id: 'MEM-3',
      name: currentProject.qa_lead || 'Priya Patel',
      code: 'EMP-015',
      role: 'QA Tester',
      specialty: 'Lead QA Specialist (Automated & Regression)',
      allocation: '100% Dedicated',
      tasksCount: 5,
      avatarBg: 'bg-emerald-600',
      status: 'in_testing',
    },
    {
      id: 'MEM-4',
      name: 'Sneha Rao',
      code: 'EMP-018',
      role: 'QA Tester',
      specialty: 'API Security & Integration QA',
      allocation: '50% Shared',
      tasksCount: 2,
      avatarBg: 'bg-teal-600',
      status: 'in_testing',
    },
    {
      id: 'MEM-5',
      name: 'David K.',
      code: 'EMP-019',
      role: 'DevOps',
      specialty: 'CI/CD Pipelines & Kubernetes Staging',
      allocation: '50% Shared',
      tasksCount: 2,
      avatarBg: 'bg-purple-600',
      status: 'active',
    },
  ];

  // Sprint & QA tasks for this project
  const tasksSummary: SprintTaskSummary[] = [
    {
      id: 'TSK-101',
      title: 'JWT Refresh Rotation & Token Revocation with Redis',
      stage: 'in_dev',
      assignedTo: 'Rahul Sharma',
      role: 'Developer',
      points: '5 SP',
      priority: 'high',
    },
    {
      id: 'TSK-102',
      title: 'Webhook Signature Verification & Idempotency Header',
      stage: 'in_qa',
      assignedTo: 'Priya Patel',
      role: 'QA Tester',
      points: '5 SP',
      priority: 'urgent',
    },
    {
      id: 'TSK-103',
      title: 'Fix: Currency Exchange Rounding Variance on 3-decimal currencies',
      stage: 'bug_fix',
      assignedTo: 'Alex Mercer',
      role: 'Developer',
      points: '8 SP',
      priority: 'urgent',
      bugNote: 'QA Defect #42: Amounts over $1000 exhibit a 1-cent variance due to float conversion.',
    },
    {
      id: 'TSK-104',
      title: 'Database indexing optimization for audit log queries',
      stage: 'verified',
      assignedTo: 'Priya Patel',
      role: 'QA Tester',
      points: '3 SP',
      priority: 'medium',
    },
    {
      id: 'TSK-105',
      title: 'Automated Playwright regression suite for checkout flow',
      stage: 'in_qa',
      assignedTo: 'Sneha Rao',
      role: 'QA Tester',
      points: '5 SP',
      priority: 'high',
    },
  ];

  // Milestones roadmap
  const milestones: MilestoneItem[] = [
    {
      id: 'M-1',
      name: 'Phase 1: Architecture Signoff & CRM Contract Scoping',
      targetDate: '2026-02-15',
      status: 'completed',
      completionPercent: 100,
      deliverables: ['System Architecture Document', 'Database Schema v1.0', 'Contract Scope Alignment'],
    },
    {
      id: 'M-2',
      name: 'Phase 2: Core Microservices & API Integration',
      targetDate: '2026-05-30',
      status: 'completed',
      completionPercent: 100,
      deliverables: ['FastAPI REST Endpoints', 'Payment Gateway Integration', 'Auth & RBAC Matrix'],
    },
    {
      id: 'M-3',
      name: 'Phase 3: QA Verification, Bug Hardening & Performance Test',
      targetDate: '2026-09-15',
      status: 'in_progress',
      completionPercent: 70,
      deliverables: ['Security Penetration Audit', 'Load Testing (5000 req/sec)', 'QA Regression Signoff'],
    },
    {
      id: 'M-4',
      name: 'Phase 4: Client Production Deployment & Signoff',
      targetDate: currentProject.end_date || '2026-12-31',
      status: 'upcoming',
      completionPercent: 0,
      deliverables: ['Production Cluster Cutover', 'Client Acceptance Signoff', 'Final Invoicing'],
    },
  ];

  const handleRequestInvoice = () => {
    setInvoiceRequested(true);
    setNotificationMsg(
      `Milestone sign-off verified! Invoice request dispatched to HR & Admin. Invoices are strictly generated by HR and Admin.`
    );
    setTimeout(() => setNotificationMsg(null), 7000);
  };

  const isCurrentProjectGenerated = currentProject.invoice_status === 'generated' || currentProject.status === 'completed';
  const isRequested = invoiceRequested || currentProject.invoice_status === 'requested';

  return (
    <PageContainer>
      {/* Page Title & Project Selection Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/delivery/projects"
              className="text-xs text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>← Back to All Projects</span>
            </Link>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-amber-400/90 font-medium">Project Command Center</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1.5 flex items-center gap-3">
            <span>{currentProject.title}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-300 font-normal">
              {currentProject.client}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Contract: <span className="text-amber-400 font-mono">{currentProject.contract_ref}</span> • Industry:{' '}
            <span className="text-zinc-300">{currentProject.industry}</span> • Active Sprint:{' '}
            <span className="text-zinc-300">{currentProject.sprint_cycle}</span>
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <label className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider font-semibold">Switch Project</label>
            <select
              value={currentProject.id}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setInvoiceRequested(false);
              }}
              className="bg-zinc-900/90 border border-zinc-700 hover:border-amber-500/50 text-white text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none cursor-pointer"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.title} ({p.client})
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 bottom-2.5 pointer-events-none text-zinc-400 text-xs">▼</div>
          </div>

          <div className="flex items-end gap-2">
            <Link href="/delivery/tasks">
              <Button variant="secondary" size="sm">
                <span>+ Daily Tasks (Kanban)</span>
              </Button>
            </Link>
            <Link href="/delivery/team">
              <Button variant="secondary" size="sm">
                <span>Team Roster</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex items-start gap-3">
          <span className="text-lg">📢</span>
          <div className="flex-1">
            <p className="font-semibold text-white">Action Dispatched Successfully</p>
            <p className="text-xs text-amber-200/90 mt-0.5">{notificationMsg}</p>
          </div>
        </div>
      )}

      {/* 5-STAGE DELIVERY LIFECYCLE PROGRESS BAR */}
      <div className="mb-6 p-5 bg-[#141414] border border-zinc-800 rounded-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-zinc-800/80 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Project Delivery Lifecycle Pipeline</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict end-to-end operational flow from CRM Contract to QA Verification & HR/Admin Invoicing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Current Phase:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Stage 4: QA Testing & Bug Verification
            </span>
          </div>
        </div>

        {/* The 5 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 card-hover-fx">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] border border-emerald-500/40">✓</span>
              <span>1. Contract Signed</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              Auto-provisioned when client signed CRM proposal ({currentProject.contract_ref}).
            </p>
            <span className="mt-2 inline-block text-[10px] font-mono text-emerald-400">Synced from CRM</span>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 card-hover-fx">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] border border-emerald-500/40">✓</span>
              <span>2. Team Allocated</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              PM assigned {teamRoster.filter(m => m.role === 'Developer').length} Developers & {teamRoster.filter(m => m.role === 'QA Tester').length} QA Testers.
            </p>
            <span className="mt-2 inline-block text-[10px] font-mono text-emerald-400">5 Members Active</span>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 card-hover-fx">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] border border-blue-500/40">⚡</span>
              <span>3. Dev Tasks Daily</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              PM assigns daily tasks based on role. Developers implement and hand over to QA.
            </p>
            <span className="mt-2 inline-block text-[10px] font-mono text-blue-400">Sprint 14 in dev</span>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/60 shadow-sm shadow-amber-950/40 card-hover-fx relative overflow-hidden shimmer-bg">
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center text-[10px] border border-amber-500/50">🐞</span>
                <span>4. QA & Bug Retest</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1.5 leading-snug">
              Testers verify build. Bugs sent back to Devs; once resolved, QA retests & marks Done.
            </p>
            <span className="mt-2 inline-block text-[10px] font-mono text-amber-300 font-semibold">In Progress</span>
          </div>

          {/* Step 5 */}
          <div className={`p-3 rounded-lg border card-hover-fx ${
            isCurrentProjectGenerated
              ? 'bg-emerald-950/20 border-emerald-800/40'
              : isRequested
              ? 'bg-amber-950/20 border-amber-800/40'
              : 'bg-zinc-900/50 border-zinc-800/60'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-semibold ${
              isCurrentProjectGenerated ? 'text-emerald-400' : isRequested ? 'text-amber-400' : 'text-zinc-400'
            }`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] border border-zinc-700">
                {isCurrentProjectGenerated ? '✓' : isRequested ? '⏳' : '5'}
              </span>
              <span>5. Invoiced (HR/Admin)</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              {isCurrentProjectGenerated
                ? `Official invoice ${currentProject.invoice_num || 'INV-2026-0042'} created by HR/Admin.`
                : isRequested
                ? 'Request sent to HR/Admin. Awaiting official issuance.'
                : 'Pending QA verification signoff. Dispatched to HR/Admin.'}
            </p>
            <span className="mt-2 inline-block text-[10px] font-mono text-zinc-400">
              HR & Admin Only
            </span>
          </div>
        </div>
      </div>

      {/* 4 HIGH-LEVEL METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp">
        {/* Card 1: Progress */}
        <div className="p-4 rounded-xl bg-[#141414] border border-zinc-800 card-hover-fx">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Overall Completion</span>
            <span className="font-semibold text-amber-400">{currentProject.progress_percent}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${currentProject.progress_percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-500">
            <span>Target: {currentProject.end_date}</span>
            <StatusBadge status={currentProject.status} />
          </div>
        </div>

        {/* Card 2: Team Composition */}
        <div className="p-4 rounded-xl bg-[#141414] border border-zinc-800 card-hover-fx">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Assigned Team</span>
            <span className="font-semibold text-white">{teamRoster.length} Engineers</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/40 font-mono">
              {teamRoster.filter(m => m.role === 'Developer').length} Devs
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 font-mono">
              {teamRoster.filter(m => m.role === 'QA Tester').length} QA Testers
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40 font-mono">
              1 DevOps
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-zinc-500">
            Tech Lead: <span className="text-zinc-300">{currentProject.lead_engineer}</span>
          </div>
        </div>

        {/* Card 3: Sprint & Bug Health */}
        <div className="p-4 rounded-xl bg-[#141414] border border-zinc-800 card-hover-fx">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Sprint Tasks</span>
            <span className="font-semibold text-white">{tasksSummary.length} Tasks</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/40 font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              1 QA Bug in Fix
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              2 In Testing
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-zinc-500">
            Code Health: <span className="text-emerald-400 font-semibold">99.2% Unit Passed</span>
          </div>
        </div>

        {/* Card 4: Invoicing Governance */}
        <div className="p-4 rounded-xl bg-[#141414] border border-zinc-800 card-hover-fx">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Client Billing & Invoice</span>
            <span className="font-mono text-zinc-300 font-semibold">
              ${((currentProject.budget || 500000) / 1000).toFixed(0)}k Budget
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Invoice Status:</span>
            {isCurrentProjectGenerated ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Official Invoiced
              </span>
            ) : isRequested ? (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Requested to HR/Admin
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Awaiting QA Signoff
              </span>
            )}
          </div>
          <div className="mt-2.5 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Authorized:</span>
            <span className="text-amber-400/90 font-medium">HR & Admin Only</span>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center border-b border-zinc-800 mb-6 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>📊 360° Overview & Tech Stack</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'team'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>👥 Allocated Team ({teamRoster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🐞 Sprint Tasks & QA Defects ({tasksSummary.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🎯 Milestones & Deliverables ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoicing')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'invoicing'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🧾 Client Invoicing (HR & Admin)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Tech Stack */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-[#141414] border border-zinc-800 rounded-xl">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
                  <span>Engagement Scope & Commercial Specs</span>
                  <span className="text-xs font-mono text-amber-400">ID: {currentProject.id}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block">Client Organization</span>
                    <span className="font-semibold text-white mt-1 block text-sm">{currentProject.client}</span>
                    <span className="text-[11px] text-zinc-400">Industry: {currentProject.industry}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block">Commercial Contract Ref</span>
                    <span className="font-semibold text-amber-400 mt-1 block text-sm font-mono">{currentProject.contract_ref}</span>
                    <span className="text-[11px] text-emerald-400">✓ Legally signed & CRM synced</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block">Contract Duration</span>
                    <span className="font-semibold text-white mt-1 block">
                      {currentProject.start_date} → {currentProject.end_date}
                    </span>
                    <span className="text-[11px] text-zinc-400">Quarterly milestone deliverables</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block">Commercial Budget</span>
                    <span className="font-semibold text-white mt-1 block font-mono text-sm">
                      ${(currentProject.budget || 0).toLocaleString()} USD
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Spent: ${(currentProject.spent || 0).toLocaleString()} USD (
                      {Math.round(((currentProject.spent || 0) / (currentProject.budget || 1)) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* Technology Stack Tags */}
                <div className="mt-6 pt-5 border-t border-zinc-800">
                  <span className="text-xs text-zinc-400 font-semibold block mb-2.5">
                    Architecture & Technology Stack
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.technology_stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-zinc-800/90 text-amber-300 border border-zinc-700/80"
                      >
                        {tech}
                      </span>
                    ))}
                    <span className="px-3 py-1 rounded-md text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-800">
                      + Docker / K8s Staging
                    </span>
                    <span className="px-3 py-1 rounded-md text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-800">
                      + GitHub Actions CI/CD
                    </span>
                  </div>
                </div>
              </div>

              {/* Active QA Defect Alert Box */}
              <div className="p-5 rounded-xl border border-red-500/30 bg-red-950/15">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🐞</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          DEFECT #42
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          Checkout Currency Exchange Rounding Variance
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1.5">
                        Logged by <span className="text-emerald-400 font-semibold">Priya Patel (QA Lead)</span> • Assigned to{' '}
                        <span className="text-blue-400 font-semibold">Alex Mercer (Lead Dev)</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 italic">
                        "Amounts over $1,000 exhibit a 1-cent variance due to premature float truncation in the payment calculation module."
                      </p>
                    </div>
                  </div>
                  <Link href="/delivery/tasks">
                    <Button variant="danger" size="sm">
                      <span>View in QA Kanban →</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Team & Action Shortcuts */}
            <div className="space-y-6">
              <div className="p-5 bg-[#141414] border border-zinc-800 rounded-xl">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                  Lead Roles on Project
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                        AM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{currentProject.lead_engineer}</p>
                        <p className="text-[10px] text-zinc-400">Tech Lead & Dev</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/40">
                      Developer
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        PP
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{currentProject.qa_lead}</p>
                        <p className="text-[10px] text-zinc-400">Lead QA Specialist</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">
                      QA Tester
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setActiveTab('team')}
                    className="w-full text-center text-xs text-amber-400 hover:text-amber-300 font-medium py-1.5 transition-colors"
                  >
                    View All {teamRoster.length} Team Members →
                  </button>
                </div>
              </div>

              {/* Invoicing Dispatch Action Card */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 to-[#18181b] border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                  <span>🧾</span>
                  <span>HR & Admin Invoicing Hub</span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Once QA testing verifies all deliverables for this milestone, submit an invoice request.
                </p>
                <div className="mt-3 p-2.5 bg-black/40 rounded border border-zinc-800 text-[11px] text-zinc-400">
                  <span className="font-semibold text-white">Rule:</span> Only HR & Admin have permission to officially generate and send client invoices.
                </div>
                <div className="mt-4">
                  {isCurrentProjectGenerated ? (
                    <div className="text-center p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                      ✓ Official Invoice Generated ({currentProject.invoice_num})
                    </div>
                  ) : isRequested ? (
                    <div className="text-center p-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                      ⏳ Invoice Request Dispatched to HR & Admin
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={handleRequestInvoice}
                    >
                      <span>📨 Request Invoice (HR & Admin)</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ALLOCATED TEAM */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#141414] border border-zinc-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Dedicated Project Delivery Team</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Developers, QA Testers, and DevOps allocated to {currentProject.title}
              </p>
            </div>
            <Link href="/delivery/team">
              <Button variant="primary" size="sm">
                <span>+ Allocate New Team Member</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamRoster.map((member) => (
              <div key={member.id} className="p-4 bg-[#141414] border border-zinc-800 rounded-xl relative hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${member.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{member.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">{member.code}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                    member.role === 'Developer'
                      ? 'bg-blue-900/30 text-blue-300 border-blue-800/40'
                      : member.role === 'QA Tester'
                      ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/40'
                      : 'bg-purple-900/30 text-purple-300 border-purple-800/40'
                  }`}>
                    {member.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Specialty:</span>
                    <span className="text-zinc-200 text-right truncate max-w-[160px]">{member.specialty}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Allocation:</span>
                    <span className="text-amber-400 font-semibold">{member.allocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Active Tasks:</span>
                    <span className="text-white font-mono">{member.tasksCount} tickets assigned</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-end">
                  <Link href="/delivery/tasks" className="text-[11px] text-zinc-400 hover:text-amber-400 transition-colors">
                    View assigned tasks →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SPRINT TASKS & QA DEFECTS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#141414] border border-zinc-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Sprint & QA Task Breakdown</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Daily task assignments, developer builds, QA defect tracking, and retests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/delivery/tasks">
                <Button variant="primary" size="sm">
                  <span>Open Full Kanban Board →</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Ticket ID</th>
                  <th className="pb-3 font-semibold">Title & QA Notes</th>
                  <th className="pb-3 font-semibold">Stage in Lifecycle</th>
                  <th className="pb-3 font-semibold">Assignee & Role</th>
                  <th className="pb-3 font-semibold">Points</th>
                  <th className="pb-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {tasksSummary.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-900/40">
                    <td className="py-3 font-mono font-bold text-amber-400">{task.id}</td>
                    <td className="py-3 pr-4 max-w-sm">
                      <p className="font-semibold text-white">{task.title}</p>
                      {task.bugNote && (
                        <p className="text-[11px] text-red-400 mt-1 bg-red-950/30 p-1.5 rounded border border-red-900/40">
                          {task.bugNote}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      {task.stage === 'in_dev' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/30 text-blue-300 border border-blue-800/40">
                          In Development
                        </span>
                      )}
                      {task.stage === 'in_qa' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">
                          QA Testing Build
                        </span>
                      )}
                      {task.stage === 'bug_fix' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-900/30 text-red-300 border border-red-800/40 animate-pulse">
                          Bug Found • In Fix
                        </span>
                      )}
                      {task.stage === 'verified' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ✓ Verified & Done
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="text-zinc-200 font-medium">{task.assignedTo}</p>
                      <span className="text-[10px] text-zinc-500">{task.role}</span>
                    </td>
                    <td className="py-3 font-mono text-zinc-400">{task.points}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-red-900/40 text-red-300 border border-red-800/40'
                          : task.priority === 'high'
                          ? 'bg-amber-900/40 text-amber-300 border border-amber-800/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MILESTONES & ROADMAP */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#141414] border border-zinc-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white">Commercial Delivery Milestones</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Key phase signoffs agreed in contract {currentProject.contract_ref}
            </p>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div key={m.id} className="p-4 bg-[#141414] border border-zinc-800 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-zinc-700">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{m.name}</h4>
                      <p className="text-[11px] text-zinc-400">Target Signoff Date: {m.targetDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-semibold border ${
                      m.status === 'completed'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        : m.status === 'in_progress'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {m.status === 'completed' ? '✓ Completed' : m.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                    </span>
                    <span className="text-xs font-mono text-zinc-300 font-semibold">{m.completionPercent}%</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${m.completionPercent}%` }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap gap-2">
                  <span className="text-[11px] text-zinc-500">Key Deliverables:</span>
                  {m.deliverables.map((del, dIdx) => (
                    <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      • {del}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: INVOICING GOVERNANCE */}
      {activeTab === 'invoicing' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#141414] border border-zinc-800 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>🧾</span>
                  <span>Client Invoicing & Billing Authorization Matrix</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Compliance and role-based permissions governing financial invoice generation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Permission:</span>
                <span className="text-xs px-2.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HR & Admin Only
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs">
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Total Agreed Contract</span>
                <span className="text-lg font-bold text-white mt-1 block font-mono">
                  ${(currentProject.budget || 500000).toLocaleString()} USD
                </span>
                <span className="text-[11px] text-emerald-400 mt-1 block">Contract {currentProject.contract_ref}</span>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Milestone 2 Verified Value</span>
                <span className="text-lg font-bold text-amber-400 mt-1 block font-mono">
                  ${Math.round((currentProject.budget || 500000) * 0.4).toLocaleString()} USD
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Due upon QA Phase completion</span>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Current Invoicing State</span>
                <div className="mt-2">
                  {isCurrentProjectGenerated ? (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                      Official Invoice Issued ({currentProject.invoice_num})
                    </span>
                  ) : isRequested ? (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block">
                      Request Dispatched to HR & Admin
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700 inline-block">
                      Awaiting QA Retest Signoff
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PM Workflow Notice */}
            <div className="mt-6 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <p className="font-semibold text-white">How the Project Invoicing Pipeline Works:</p>
                <ol className="list-decimal ml-4 mt-1.5 space-y-1">
                  <li>Project Manager assigns daily tasks $\rightarrow$ Developers build and deliver code.</li>
                  <li>QA Testers verify builds and report defects back to Developers until all tests pass.</li>
                  <li>Once QA tests pass and the milestone is verified, the Project Manager clicks <strong>"Dispatch Invoice Request"</strong>.</li>
                  <li><strong>HR and Admin</strong> receive the request in the HR Portal (`/hr/payroll`) and Admin Portal (`/admin/projects`) where they officially generate the invoice document.</li>
                </ol>
              </div>
            </div>

            {/* Dispatch Action */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              {isCurrentProjectGenerated ? (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <span>✓ Official Invoice {currentProject.invoice_num} was created by HR/Admin.</span>
                </div>
              ) : isRequested ? (
                <div className="text-xs text-amber-300 font-semibold flex items-center gap-2">
                  <span>⏳ Invoice request dispatched to HR & Admin queue.</span>
                </div>
              ) : (
                <Button variant="primary" onClick={handleRequestInvoice}>
                  <span>📨 Dispatch Invoice Request to HR & Admin</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ProjectDetails;
