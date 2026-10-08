"use client";
import React, { useEffect, useState } from 'react';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import { projectsApi } from '../../../../api';
import { demoProjects } from '../../../../data/adminDemo';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
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
    load();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="All Operational Projects"
        description="Enterprise accounts, delivery health, and progress tracking"
        breadcrumbs={[{ label: 'Admin' }, { label: 'All Operational Projects' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
            Refresh Projects
          </Button>
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
        ]}
      />
    </PageContainer>
  );
};

export default Projects;
