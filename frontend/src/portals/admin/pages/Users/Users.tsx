import React, { useEffect, useState } from 'react';
import { usersApi } from '../../../../api';
import DataTable from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getAll();
      setUsers(res.data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create(form);
      setModalOpen(false);
      setForm({ name: '', email: '', role: 'employee' });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Workforce Users Directory</h2>
          <p className="text-xs text-zinc-400">Manage all registered accounts across VPD portals</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          + Add User
        </Button>
      </div>

      <DataTable
        loading={loading}
        data={users}
        columns={[
          { header: 'Full Name', accessor: 'name' },
          { header: 'Email Address', accessor: 'email' },
          { header: 'Assigned Role', accessor: (row) => <StatusBadge status={row.role || 'employee'} /> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
        ]}
      />

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
    </div>
  );
};

export default Users;
