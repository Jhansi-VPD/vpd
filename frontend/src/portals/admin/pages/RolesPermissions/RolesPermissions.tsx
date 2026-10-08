"use client";
import React, { useEffect, useState } from 'react';
import { rolesApi, permissionsApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import EmptyState from '../../../../shared/components/EmptyState';
import ErrorState from '../../../../shared/components/ErrorState';

export const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getAll(),
        permissionsApi.getAll()
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rolesApi.create(form);
      setModalOpen(false);
      setForm({ name: '', description: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    }
  };

  if (error) {
    return (
      <PageContainer>
        <ErrorState message={error} onRetry={loadData} />
      </PageContainer>
    );
  }

  const columns = [
    { header: 'Role Key', accessor: (row: any) => <StatusBadge status={row.name || row.slug || 'unknown'} /> },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Granted Permissions',
      accessor: (row: any) => {
        const perms = row.permissions || [];
        return (
          <div className="flex flex-wrap gap-1">
            {perms.length > 0 ? perms.map((p: any) => (
              <span key={p.id} className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {p.name}
              </span>
            )) : <span className="text-gray-500 text-sm">No permissions</span>}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => alert('Feature coming soon: Assign Permissions')}>Edit Permissions</Button>
        </div>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Roles & Permissions Matrix"
        description="Enterprise role access boundaries and privilege assignment"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions Matrix' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add Role
          </Button>
        }
      />

      {roles.length === 0 && !loading ? (
        <EmptyState title="No roles found" description="Create a new role to get started." />
      ) : (
        <DataTable
          loading={loading}
          data={roles}
          columns={columns}
        />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Role">
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input 
            label="Role Name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            required 
            placeholder="e.g. Finance Manager"
          />
          <Input 
            label="Description" 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Brief description of the role's responsibilities"
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Role</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default RolesPermissions;