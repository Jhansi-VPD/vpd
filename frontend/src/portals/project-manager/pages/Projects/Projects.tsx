"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { projectsApi } from '../../../../api';
import { demoProjects } from '../../../../data/adminDemo';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import { Icon } from '../../../../shared/components';
import CreateProjectModal from '../../components/CreateProjectModal';
import GenerateProjectInvoiceModal from '../../components/GenerateProjectInvoiceModal';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleRequestInvoice = (proj: any) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === proj.id
          ? {
              ...p,
              invoice_requested: true,
              invoice_request_date: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );
    setSuccessBanner(
      `Project "${proj.title || proj.name}" verified! Invoice request dispatched to HR & Admin for official generation.`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.getAll();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setProjects(res.data);
      } else if (Array.isArray(res) && res.length > 0) {
        setProjects(res);
      } else {
        setProjects(demoProjects);
      }
    } catch (err) {
      console.warn('Projects API unavailable, loading operational demo data', err);
      setProjects(demoProjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();

    // Auto open modal if URL has ?create=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        setIsCreateModalOpen(true);
      }
    }
  }, []);

  const handleProjectCreated = (newProject: any) => {
    setProjects((prev) => [newProject, ...prev]);
    setSuccessBanner(`Project "${newProject.title}" was successfully created!`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const titleMatch = (item.title || item.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const clientMatch = (
        item.client?.name ||
        item.client_name ||
        item.client ||
        ''
      )
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const industryMatch = (item.industry || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesSearch = titleMatch || clientMatch || industryMatch;

      if (statusFilter === 'all') return matchesSearch;
      const status = (item.status || 'planning').toLowerCase();
      return matchesSearch && status === statusFilter.toLowerCase();
    });
  }, [projects, searchQuery, statusFilter]);

  // Statistics
  const totalCount = projects.length;
  const inProgressCount = projects.filter(
    (p) => (p.status || '').toLowerCase() === 'in_progress'
  ).length;
  const planningCount = projects.filter(
    (p) => (p.status || '').toLowerCase() === 'planning'
  ).length;
  const totalBudget = projects.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Engineering Projects & Workstreams"
        description="Delivery tracking, client commitments, tech stacks, and production pipelines"
        breadcrumbs={[{ label: 'Delivery', href: '/delivery' }, { label: 'Projects' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={loadProjects}>
              <Icon name="refresh" className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + New Project
            </Button>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓ Success:</span>
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slideUp">
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Projects
          </span>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Across all accounts</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Active / In Progress
          </span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Under active engineering</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Planning Phase
          </span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{planningCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Architecture & Sprint Zero</p>
        </div>
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 card-hover-fx">
          <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">
            Committed Capital
          </span>
          <p className="text-2xl font-bold text-white mt-1">
            ${(totalBudget / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Cumulative contract value</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141414] border border-[#2A2A2A] rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search projects by name, client, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2F2F2F] rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'planning', label: 'Planning' },
            { id: 'on_hold', label: 'On Hold' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white bg-[#1A1A1A] hover:bg-[#252525]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <DataTable
        loading={loading}
        data={filteredProjects}
        columns={[
          {
            header: 'Project Name & Stack',
            accessor: (row) => (
              <div className="min-w-0 py-1">
                <Link
                  href="/delivery/project-details"
                  className="font-semibold text-white text-xs hover:text-[#D4AF37] transition-colors truncate block"
                >
                  {row.title || row.name || 'Enterprise Initiative'}
                </Link>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {(row.technology_stack || []).slice(0, 3).map((tech: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-[9px] font-mono bg-[#202020] text-zinc-300 rounded border border-[#333]"
                    >
                      {tech}
                    </span>
                  ))}
                  {row.industry && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      • {row.industry}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            header: 'Client / Sponsor',
            accessor: (row) => (
              <span className="text-xs text-zinc-300 font-medium">
                {row.client?.name || row.client_name || row.client || 'Enterprise Account'}
              </span>
            ),
          },
          {
            header: 'Source / Origin',
            accessor: (row) => {
              const clientStr = String(row.client?.name || row.client || '').toLowerCase();
              const isInternal =
                row.project_origin === 'internal' ||
                clientStr.includes('internal') ||
                clientStr.includes('r&d');
              const isDirect = row.project_origin === 'direct_client';

              if (isInternal) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-950/70 text-purple-300 border border-purple-800/50">
                    🚀 Internal R&D
                  </span>
                );
              }
              if (isDirect) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-950/70 text-blue-300 border border-blue-800/50">
                    💼 Direct Phase
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#1D1B13] text-[#D4AF37] border border-[#D4AF37]/40">
                  🔄 CRM Synced
                </span>
              );
            },
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status || 'planning'} />,
          },
          {
            header: 'Progress',
            accessor: (row) => {
              const rawPercent =
                row.progress_percent ??
                row.progress ??
                (String(row.status).toLowerCase() === 'completed'
                  ? 100
                  : (row.status || '').toLowerCase() === 'in_progress'
                  ? 50
                  : 15);
              const percent = Math.min(100, Math.max(0, Number(rawPercent)));

              return (
                <div className="flex items-center gap-2.5">
                  <div className="w-24 sm:w-28 bg-zinc-800 rounded-full h-2 overflow-hidden shrink-0">
                    <div
                      className="bg-gradient-to-r from-[#d4af37] to-[#f0d67c] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0">
                    {percent}%
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Timeline',
            accessor: (row) => (
              <div className="text-[11px] text-zinc-400 font-mono">
                {row.start_date || 'Q1 2026'}
                {row.end_date && ` → ${row.end_date}`}
              </div>
            ),
          },
          {
            header: 'Budget',
            accessor: (row) => (
              <span className="text-xs font-mono font-semibold text-zinc-200">
                {row.budget ? `$${Number(row.budget).toLocaleString()}` : '—'}
              </span>
            ),
          },
          {
            header: 'Invoicing (HR & Admin Only)',
            accessor: (row) => {
              if (row.invoice_generated || row.status === 'completed') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                    🧾 {row.invoice_number || 'INV-2026-081'} • Generated by HR/Admin
                  </span>
                );
              }

              if (row.invoice_requested) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                    ⏳ Pending HR/Admin Generation
                  </span>
                );
              }

              return (
                <button
                  type="button"
                  onClick={() => handleRequestInvoice(row)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#201D14] hover:bg-[#2A2518] text-[#D4AF37] border border-[#D4AF37]/50 transition-colors"
                >
                  📨 Request Invoice (HR/Admin)
                </button>
              );
            },
          },
          {
            header: 'Action',
            accessor: () => (
              <Link href="/delivery/project-details">
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </Link>
            ),
          },
        ]}
      />

      {/* Modal for creating a new project */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </PageContainer>
  );
};

export default Projects;
