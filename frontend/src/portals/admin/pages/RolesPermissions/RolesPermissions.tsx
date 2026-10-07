import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import React from 'react';
import { ROLE_PERMISSIONS } from '../../../../shared/hooks/usePermissions';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';

export const RolesPermissions: React.FC = () => {
  const rolesData = Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => ({
    id: role,
    role,
    permissions: perms,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Roles & Permissions Matrix"
        description="Enterprise role access boundaries and privilege assignment"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions Matrix' }]}
        
      />

      <DataTable
        data={rolesData}
        columns={[
          { header: 'Role Key', accessor: (row) => <StatusBadge status={row.role} /> },
          {
            header: 'Granted Permissions',
            accessor: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.permissions.map((p) => (
                  <span key={p} className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {p}
                  </span>
                ))}
              </div>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}