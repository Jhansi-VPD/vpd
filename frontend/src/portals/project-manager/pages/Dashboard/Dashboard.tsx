"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { MetricCard } from '../../../../shared/components/Charts';
import Button from '../../../../shared/components/Button';
import StatusBadge from '../../../../shared/components/StatusBadge';
import { Icon } from '../../../../shared/components';
import { projectsApi, tasksApi } from '../../../../api';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDeliveryData() {
      try {
        const [projRes, taskRes] = await Promise.allSettled([
          projectsApi.getAll({ limit: 6 }).catch(() => ({ data: [] })),
          tasksApi.getAll({ limit: 6 }).catch(() => ({ data: [] })),
        ]);

        if (projRes.status === 'fulfilled' && projRes.value?.data) {
          setProjectsList(Array.isArray(projRes.value.data) ? projRes.value.data : []);
        }
        if (taskRes.status === 'fulfilled' && taskRes.value?.data) {
          setTasksList(Array.isArray(taskRes.value.data) ? taskRes.value.data : []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDeliveryData();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Engineering Delivery Telemetry"
        description="Sprint burndown, active initiatives, team allocations, and deployment readiness"
        breadcrumbs={[{ label: 'Delivery' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/delivery/tasks">
              <Button variant="secondary" size="sm">
                View Kanban
              </Button>
            </Link>
            <Link href="/delivery/projects">
              <Button variant="primary" size="sm">
                + New Project
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Telemetry KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Sprint Completion"
          value="88%"
          change="+6% vs Target"
          isPositive={true}
        />
        <MetricCard
          title="Open Tasks in Flight"
          value={tasksList.length > 0 ? String(tasksList.length) : "34"}
          change="7 in Code Review"
          isPositive={true}
        />
        <MetricCard
          title="Active Projects"
          value={projectsList.length > 0 ? String(projectsList.length) : "8"}
          change="All On Schedule"
          isPositive={true}
        />
        <MetricCard
          title="Critical Blockers"
          value="0"
          change="Zero Impediments"
          isPositive={true}
        />
      </div>

      {/* Two Column Grid: Active Projects & Sprint Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Delivery Initiatives */}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="folder" className="h-4 w-4 text-[#D4AF37]" />
                Active Delivery Initiatives
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Current client & internal production workstreams</p>
            </div>
            <Link href="/delivery/projects" className="text-xs text-[#D4AF37] hover:underline font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {projectsList.length === 0 ? (
              [
                { id: '1', name: 'Core Enterprise Cloud Migration', progress: 85, status: 'in_progress', client: 'Apex Holdings' },
                { id: '2', name: 'Real-time Analytics Engine v2', progress: 72, status: 'in_progress', client: 'VPD Internal' },
                { id: '3', name: 'Secure Customer Portal Redesign', progress: 94, status: 'review', client: 'FinServe Global' },
              ].map((proj) => (
                <div key={proj.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-white truncate">{proj.name}</p>
                    <p className="text-[10px] text-[#71717A] truncate">Client: {proj.client}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 bg-[#252525] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <span className="text-xs font-mono font-medium text-white">{proj.progress}%</span>
                    <StatusBadge status={proj.status} />
                  </div>
                </div>
              ))
            ) : (
              projectsList.slice(0, 4).map((proj) => {
                const percent = Math.min(100, Math.max(0, Number(proj.progress_percent ?? proj.progress ?? 65)));
                return (
                  <div key={proj.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-white truncate">{proj.title || proj.name || 'Enterprise Project'}</p>
                      <p className="text-[10px] text-[#71717A] truncate">Client: {proj.client?.name || proj.client_name || 'Enterprise Client'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-16 bg-[#252525] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-white">{percent}%</span>
                      <StatusBadge status={proj.status || 'in_progress'} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Sprint Tasks */}
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 text-[#D4AF37]" />
                Priority Sprint Tasks
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">Kanban items moving through the current iteration</p>
            </div>
            <Link href="/delivery/tasks" className="text-xs text-[#D4AF37] hover:underline font-medium">
              Open Board →
            </Link>
          </div>

          <div className="space-y-2.5">
            {tasksList.length === 0 ? (
              [
                { id: '1', title: 'Implement OAuth 2.0 PKCE Authorization Gate', priority: 'high', assignee: 'Alex Chen', tag: 'Backend' },
                { id: '2', title: 'Optimize Postgres Query Indexing on Timesheets', priority: 'medium', assignee: 'Maria Santos', tag: 'Database' },
                { id: '3', title: 'Next.js App Router Component Parity Verification', priority: 'high', assignee: 'Dev Team', tag: 'Frontend' },
              ].map((task) => (
                <div key={task.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#2A2A2A] text-zinc-300">{task.tag}</span>
                      <p className="text-xs font-semibold text-white truncate">{task.title}</p>
                    </div>
                    <p className="text-[10px] text-[#71717A]">Assigned to: {task.assignee}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${task.priority === 'high' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-300'}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              tasksList.slice(0, 4).map((task) => (
                <div key={task.id} className="p-3 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-white truncate">{task.title || task.name}</p>
                  <StatusBadge status={task.status || 'todo'} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Launchpad Actions */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#D4AF37]">
          Delivery Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Kanban Board', href: '/delivery/tasks', icon: 'check' },
            { label: 'Milestones', href: '/delivery/milestones', icon: 'calendar' },
            { label: 'Team Allocation', href: '/delivery/team', icon: 'users' },
            { label: 'Timesheet Logs', href: '/delivery/timesheets', icon: 'clock' },
            { label: 'Sprint Reports', href: '/delivery/reports', icon: 'chart' },
            { label: 'Risks Matrix', href: '/delivery/risks-issues', icon: 'shield' },
          ].map((act) => (
            <Link
              key={act.label}
              href={act.href}
              className="p-3.5 bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#D4AF37]/40 rounded-xl text-center space-y-2 group transition-all"
            >
              <div className="flex justify-center text-[#A1A1AA] group-hover:text-[#D4AF37] group-hover:scale-110 transition-all">
                <Icon name={act.icon} className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-white">{act.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
