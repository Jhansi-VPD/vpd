"use client";
import React, { useEffect, useState } from 'react';
import { backupsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Button from '../../../../shared/components/Button';
import API_ENDPOINTS from '../../../../api/endpoints';

export const Backups: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await backupsApi.getAll();
      setBackups(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreate = async () => {
    if (!window.confirm("Are you sure you want to trigger a manual backup? This may affect performance briefly.")) return;
    try {
      await backupsApi.create();
      loadBackups();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger backup');
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete backup ${filename}? This cannot be undone.`)) return;
    try {
      await backupsApi.delete(filename);
      loadBackups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete backup');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Disaster Recovery & Backups"
        description="Manage on-disk PostgreSQL snapshots, enforce retention, and download recovery files."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Disaster Recovery' }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            + Trigger Manual Backup
          </Button>
        }
      />

      <DataTable
        loading={loading}
        data={backups}
        columns={[
          { header: 'Filename', accessor: 'filename' },
          { header: 'Size (Bytes)', accessor: 'size_bytes' },
          { header: 'Created', accessor: (row) => new Date(row.created_at).toLocaleString() },
          {
            header: 'Actions',
            accessor: (row) => (
              <div className="flex space-x-2">
                <a
                  href={`/api/v1${API_ENDPOINTS.BACKUPS.DOWNLOAD(row.filename)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#38BDF8] hover:underline"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(row.filename)}
                  className="text-xs text-[#EF4444] hover:underline"
                >
                  Delete
                </button>
              </div>
            )
          }
        ]}
      />
    </PageContainer>
  );
};

export default Backups;

