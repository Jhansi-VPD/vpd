import React, { useEffect, useState } from 'react';
import { usersApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import EmptyState from '../../../../shared/components/EmptyState';
import ErrorState from '../../../../shared/components/ErrorState';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' });

  // Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: string, user: any}>({isOpen: false, action: '', user: null});

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.is_active = statusFilter;
      
      const res = await usersApi.getAll(params);
      setUsers(res.data || []);
      setTotal(res.meta?.total || res.data?.length || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, limit, roleFilter, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create(form as any);
      setModalOpen(false);
      setForm({ name: '', email: '', role: 'employee' });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const executeAction = async () => {
    const { action, user } = confirmModal;
    if (!user) return;
    
    try {
      if (action === 'lock') {
        await usersApi.lock(user.id);
      } else if (action === 'unlock') {
        await usersApi.unlock(user.id);
      } else if (action === 'revoke') {
        await usersApi.revokeSessions(user.id);
      } else if (action === 'reset') {
        const res = await usersApi.forcePasswordReset(user.id);
        alert(res.message || 'Password reset triggered');
      }
      setConfirmModal({isOpen: false, action: '', user: null});
      loadUsers();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`);
    }
  };

  const columns = [
    { header: 'Full Name', accessor: 'name' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Assigned Role', accessor: (row: any) => <StatusBadge status={row.role || 'employee'} /> },
    { header: 'Status', accessor: (row: any) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    { 
      header: 'Actions', 
      accessor: (row: any) => (
        <div className="flex space-x-2">
          {row.is_active ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmModal({isOpen: true, action: 'lock', user: row})}>Lock</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setConfirmModal({isOpen: true, action: 'unlock', user: row})}>Unlock</Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setConfirmModal({isOpen: true, action: 'revoke', user: row})}>Revoke Sessions</Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmModal({isOpen: true, action: 'reset', user: row})}>Reset Password</Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <PageContainer>
        <ErrorState message={error} onRetry={loadUsers} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Workforce Users Directory"
        description="Manage all registered accounts across VPD portals"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Users Directory' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
        <div className="flex-1">
          <Select
            label=""
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'hr', label: 'HR' },
              { value: 'sales', label: 'Sales' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'project_manager', label: 'Project Manager' },
              { value: 'developer', label: 'Developer' },
              { value: 'employee', label: 'Employee' },
              { value: 'client', label: 'Client' },
            ]}
          />
        </div>
        <div className="flex-1">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive / Locked' },
            ]}
          />
        </div>
      </div>

      {!loading && users.length === 0 ? (
        <EmptyState title="No users found" description="Adjust filters or add a new user." />
      ) : (
        <>
          <DataTable
            loading={loading}
            data={users}
            columns={columns}
          />
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </span>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Workforce Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'hr', label: 'HR' },
              { value: 'sales', label: 'Sales' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'project_manager', label: 'Project Manager' },
              { value: 'developer', label: 'Developer' },
              { value: 'employee', label: 'Employee' },
              { value: 'client', label: 'Client' },
            ]}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({isOpen: false, action: '', user: null})} 
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to <strong>{confirmModal.action}</strong> the user <strong className="text-white">{confirmModal.user?.email}</strong>?
          </p>
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setConfirmModal({isOpen: false, action: '', user: null})}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={executeAction}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default Users;