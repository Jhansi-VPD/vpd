"use client";
import React, { useEffect, useState } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { projectsApi } from '../../../../api';
import { demoProjects } from '../../../../data/adminDemo';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import CreateProjectModal from '../../../project-manager/components/CreateProjectModal';
import GenerateProjectInvoiceModal from '../../../project-manager/components/GenerateProjectInvoiceModal';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<any | null>(null);

  const handleOpenInvoice = (proj: any) => {
    setSelectedProjectForInvoice(proj);
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceGenerated = (invoiceData: any) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === invoiceData.project_id
          ? {
              ...p,
              status: 'completed',
              progress_percent: 100,
              invoice_generated: true,
              invoice_number: invoiceData.invoice_number,
              invoice_amount: invoiceData.total_amount,
            }
          : p
      )
    );
  };

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, []);

  const handleProjectCreated = (newProject: any) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <PageContainer>
      <PageHeader
        title="All Operational Projects"
        description="Enterprise accounts, delivery health, and progress tracking"
        breadcrumbs={[{ label: 'Admin' }, { label: 'All Operational Projects' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={load}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              + New Project
            </Button>
          </div>
        }
      />

      <DataTable
        loading={loading}
        data={projects}
        columns={[
          {
            header: 'Project Name',
            accessor: (row) => (
              <div className="min-w-0">
                <p className="font-semibold text-white text-xs truncate">
                  {row.title || row.name || row.project_name || 'Enterprise Project'}
                </p>
                {(row.slug || row.industry) && (
                  <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                    {row.industry ? `${row.industry} • ` : ''}
                    {row.slug ? `/${row.slug}` : ''}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: 'Client',
            accessor: (row) => row.client?.name || row.client_name || row.client?.company_name || 'Enterprise Client',
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status || 'in_progress'} />,
          },
          {
            header: 'Progress',
            accessor: (row) => {
              const rawPercent =
                row.progress_percent ??
                row.progress ??
                row.completion_percentage ??
                (String(row.status).toLowerCase() === 'completed' ? 100 : 65);
              const percent = Math.min(100, Math.max(0, Number(rawPercent)));

              return (
                <div className="flex items-center gap-3">
                  <div className="w-28 sm:w-36 bg-zinc-800 rounded-full h-2.5 overflow-hidden shrink-0">
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
            header: 'Invoice (HR/Admin)',
            accessor: (row) => {
              if (row.invoice_generated || row.status === 'completed') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                    🧾 {row.invoice_number || 'INV-2026-081'} • Billed
                  </span>
                );
              }

              return (
                <button
                  type="button"
                  onClick={() => handleOpenInvoice(row)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#201D14] hover:bg-[#2A2518] text-[#D4AF37] border border-[#D4AF37]/50 transition-colors"
                >
                  ⚡ Generate Invoice
                </button>
              );
            },
          },
        ]}
      />

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <GenerateProjectInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        project={selectedProjectForInvoice}
        onInvoiceGenerated={handleInvoiceGenerated}
      />
    </PageContainer>
  );
};

export default Projects;
