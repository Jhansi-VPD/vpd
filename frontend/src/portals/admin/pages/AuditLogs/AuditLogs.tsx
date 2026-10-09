"use client";
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React, { useEffect, useState } from 'react';
import DataTable from '../../../../shared/components/DataTable';
import { auditLogsApi } from '../../../../api';

interface AuditLogRow {
  id: string;
  created_at: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  ip_address?: string | null;
  user_id?: string | null;
}

const shortId = (value?: string | null) => (value ? `${value.slice(0, 8)}…` : '—');

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await auditLogsApi.getAll({ page: 1, limit: 50 });
        if (!cancelled) setLogs(res?.data ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load audit logs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Immutable Security Audit Logs"
        description="SOC 2 compliant request records, IP origins, and user access trails"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Immutable Security Audit Logs' }]}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <DataTable
        data={logs}
        loading={loading}
        emptyTitle="No Audit Logs"
        emptyMessage="No audit records have been captured yet."
        columns={[
          {
            header: 'Timestamp',
            accessor: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
          },
          {
            header: 'Action Event',
            accessor: (row) => <code className="text-xs text-[#d4af37]">{row.action}</code>,
          },
          {
            header: 'Entity',
            accessor: (row) => (row.entity_type ? `${row.entity_type} ${shortId(row.entity_id)}` : '—'),
          },
          {
            header: 'IP Origin',
            accessor: (row) => row.ip_address ?? '—',
          },
          {
            header: 'Actor',
            accessor: (row) => shortId(row.user_id),
          },
        ]}
      />
    </PageContainer>
  );
};
export default AuditLogs;
