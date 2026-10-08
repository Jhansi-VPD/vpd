"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { departmentsApi, usersApi } from '../../../../api';
import { useAuth } from '../../../../auth/auth.context';
import { useNotifications } from '../../../../app/providers/NotificationProvider';
import DataTable, { Column, SortState } from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import ErrorState from '../../../../shared/components/ErrorState';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog';
import Pagination from '../../../../shared/components/Pagination';
import { BulkUserAction, BulkActionResult, UserListItem } from '../../../../types/user.types';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Finance' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'qa', label: 'QA' },
  { value: 'support', label: 'Support' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
  { value: 'guest', label: 'Guest' },
  { value: 'partner', label: 'Partner' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'locked', label: 'Locked' },
  { value: 'pending', label: 'Pending' },
];

const PRIVILEGED_ROLES = ['admin', 'super_admin'];

/** Mirrors backend EMPLOYEE_ROLES — only these get an Employee profile,
 * so designation/department inputs are only shown for them. */
const EMPLOYEE_ROLES = new Set([
  'employee',
  'developer',
  'sales',
  'marketing',
  'project_manager',
  'qa',
  'support',
  'finance',
  'hr',
  'admin',
  'super_admin',
]);

type SingleAction = 'deactivate' | 'activate' | 'suspend' | 'restore' | 'unlock';

const ACTION_COPY: Record<
  SingleAction,
  { verb: string; past: string; description: string; variant: 'danger' | 'primary' }
> = {
  deactivate: {
    verb: 'Deactivate',
    past: 'deactivated',
    description:
      'will lose access immediately and all active sessions will be revoked. The account keeps its data and can be reactivated at any time.',
    variant: 'danger',
  },
  activate: {
    verb: 'Activate',
    past: 'activated',
    description: 'will regain access, and any login lockout will be cleared.',
    variant: 'primary',
  },
  suspend: {
    verb: 'Suspend',
    past: 'suspended',
    description:
      'will be suspended immediately — access blocked and all active sessions revoked — until the account is restored.',
    variant: 'danger',
  },
  restore: {
    verb: 'Restore',
    past: 'restored',
    description: 'will be restored to active and can sign in again.',
    variant: 'primary',
  },
  unlock: {
    verb: 'Unlock',
    past: 'unlocked',
    description: 'is locked out after failed login attempts; unlocking clears the lockout so they can sign in again.',
    variant: 'primary',
  },
};

type PendingAction =
  | { kind: 'single'; action: SingleAction; user: UserListItem }
  | { kind: 'bulk'; action: BulkUserAction; count: number }
  | null;

interface CreateFormState {
  name: string;
  email: string;
  phone: string;
  role: string;
  designation: string;
  department_id: string;
  passwordMode: 'invite' | 'password';
  password: string;
}

const EMPTY_CREATE_FORM: CreateFormState = {
  name: '',
  email: '',
  phone: '',
  role: 'employee',
  designation: '',
  department_id: '',
  passwordMode: 'invite',
  password: '',
};

function passwordIssue(pw: string): string | null {
  if (pw.length < 6 || pw.length > 128) return 'Password must be between 6 and 128 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(pw)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.';
  return null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const Users: React.FC = () => {
  const router = useRouter();
  const { user: me } = useAuth();
  const { showNotification } = useNotifications();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; total_pages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  });

  // Server query state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortState, setSortState] = useState<SortState | null>({ key: 'created_at', direction: 'desc' });

  // Selection & dialogs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkFailures, setBulkFailures] = useState<BulkActionResult['failed'] | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  const [exporting, setExporting] = useState(false);

  const sortParam = sortState ? (sortState.direction === 'desc' ? `-${sortState.key}` : sortState.key) : undefined;

  const filterParams = useMemo(
    () => ({
      search: search || undefined,
      role: (roleFilter || undefined) as UserListItem['role'] | undefined,
      status: (statusFilter || undefined) as UserListItem['status'] | undefined,
    }),
    [search, roleFilter, statusFilter]
  );

  const filtersActive = !!search || !!roleFilter || !!statusFilter;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll({ page, limit: pageSize, sort: sortParam, ...filterParams });
      const rows = res.data || [];
      const m = res.meta || {};
      setUsers(rows);
      setMeta({
        total: m.total ?? rows.length,
        page: m.page ?? page,
        limit: m.limit ?? pageSize,
        total_pages: m.total_pages ?? 1,
      });
      if (rows.length === 0 && page > 1 && typeof m.total_pages === 'number' && m.total_pages < page) {
        setPage(Math.max(m.total_pages, 1));
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setError({ status: 403, message: 'You do not have permission to manage users. This module is restricted to Admin and HR roles.' });
      } else {
        setError({ status: err?.status, message: err?.message || 'Failed to load users. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortParam, filterParams]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Selection is page/filter scoped — clearing avoids surprise cross-page bulk edits.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, pageSize, search, roleFilter, statusFilter, sortState]);

  // Debounced search
  const firstSearchRun = useRef(true);
  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load departments lazily the first time the create modal opens.
  useEffect(() => {
    if (!createOpen) return;
    departmentsApi
      .getAll()
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, [createOpen]);

  const canManage = (row: UserListItem): boolean =>
    me?.role === 'super_admin' || !PRIVILEGED_ROLES.includes(row.role);

  const isSelf = (row: UserListItem): boolean => !!me && me.id === row.id;

  const quickActionsFor = (row: UserListItem): Array<{ action: SingleAction; label: string; danger?: boolean }> => {
    switch (row.status) {
      case 'active':
      case 'pending':
        return [
          { action: 'deactivate', label: 'Deactivate', danger: true },
          { action: 'suspend', label: 'Suspend', danger: true },
        ];
      case 'inactive':
        return [{ action: 'activate', label: 'Activate' }];
      case 'suspended':
        return [{ action: 'restore', label: 'Restore' }];
      case 'locked':
        return [{ action: 'unlock', label: 'Unlock' }];
      default:
        return [];
    }
  };

  const handleSortChange = (key: string) => {
    setSortState((prev) =>
      prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const runSingleAction = async (action: SingleAction, target: UserListItem) => {
    setActionLoading(true);
    try {
      if (action === 'deactivate') await usersApi.deactivate(target.id);
      else if (action === 'activate') await usersApi.activate(target.id);
      else if (action === 'suspend') await usersApi.suspend(target.id);
      else if (action === 'restore') await usersApi.restore(target.id);
      else if (action === 'unlock') await usersApi.unlock(target.id);
      showNotification('success', `${target.name} has been ${ACTION_COPY[action].past}.`);
      setPendingAction(null);
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err?.message || `Failed to ${ACTION_COPY[action].verb.toLowerCase()} this user.`);
    } finally {
      setActionLoading(false);
    }
  };

  const runBulkAction = async (action: BulkUserAction) => {
    setActionLoading(true);
    try {
      const res = await usersApi.bulkAction(action, Array.from(selectedIds));
      const { succeeded, failed } = res.data;
      const total = succeeded.length + failed.length;
      if (failed.length === 0) {
        showNotification('success', `${succeeded.length} user${succeeded.length === 1 ? '' : 's'} ${ACTION_COPY[action].past}.`);
      } else {
        showNotification(
          'warning',
          `${succeeded.length} of ${total} users ${ACTION_COPY[action].past}. ${failed.length} failed — see details.`
        );
        setBulkFailures(failed);
      }
      setSelectedIds(new Set());
      setPendingAction(null);
      await loadUsers();
    } catch (err: any) {
      showNotification('error', err?.message || `Bulk ${action} failed.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await usersApi.exportCsv({ sort: sortParam, ...filterParams });
      if (!res.ok) {
        let message = 'Export failed. Please try again.';
        try {
          const body = await res.json();
          message = body?.message || message;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = /filename="?([^";]+)"?/.exec(disposition);
      const filename = match?.[1] || `vpd-users-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotification('success', 'CSV export downloaded — it matches the current filters.');
    } catch (err: any) {
      showNotification('error', err?.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const createRoleOptions = useMemo(
    () => (me?.role === 'super_admin' ? ROLE_OPTIONS : ROLE_OPTIONS.filter((o) => !PRIVILEGED_ROLES.includes(o.value))),
    [me?.role]
  );

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.name.trim()) return setCreateError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) return setCreateError('A valid email address is required.');
    if (createForm.passwordMode === 'password') {
      const issue = passwordIssue(createForm.password);
      if (issue) return setCreateError(issue);
    }
    const isEmployeeRole = EMPLOYEE_ROLES.has(createForm.role);
    setCreateLoading(true);
    try {
      const res = await usersApi.create({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || undefined,
        role: createForm.role,
        designation: isEmployeeRole && createForm.designation.trim() ? createForm.designation.trim() : undefined,
        department_id: isEmployeeRole && createForm.department_id ? createForm.department_id : undefined,
        password: createForm.passwordMode === 'password' ? createForm.password : undefined,
      });
      const inviteSent = res.data?.invite_sent;
      if (createForm.passwordMode === 'invite' && !inviteSent) {
        showNotification(
          'warning',
          `User created, but the invite email could not be sent (email service not configured). Use "Force password reset" to resend the setup link.`
        );
      } else if (createForm.passwordMode === 'invite') {
        showNotification('success', `User created — an invite email with a password setup link was sent to ${createForm.email.trim()}.`);
      } else {
        showNotification('success', `User created. Share the initial password with ${createForm.name.trim()} through a secure channel.`);
      }
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setPage(1);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectedUsers = useMemo(() => users.filter((u) => selectedIds.has(u.id)), [users, selectedIds]);

  const confirmCopy = useMemo(() => {
    if (!pendingAction) return null;
    if (pendingAction.kind === 'single') {
      const { action, user } = pendingAction;
      const copy = ACTION_COPY[action];
      return {
        title: `${copy.verb} ${user.name}?`,
        message: (
          <p>
            <strong className="text-white">{user.name}</strong> ({user.email}) {copy.description}
          </p>
        ),
        confirmText: `${copy.verb} User`,
        variant: copy.variant,
        onConfirm: () => runSingleAction(action, user),
      };
    }
    const { action, count } = pendingAction;
    const copy = ACTION_COPY[action];
    return {
      title: `${copy.verb} ${count} selected user${count === 1 ? '' : 's'}?`,
      message: (
        <div className="space-y-2">
          <p>
            All <strong className="text-white">{count}</strong> selected account{count === 1 ? '' : 's'} {copy.description}
          </p>
          <p className="text-xs text-[#A1A1AA]">
            Accounts you cannot manage (Admin/Super Admin, unless you are a Super Admin) or your own account will be
            skipped and reported individually.
          </p>
        </div>
      ),
      confirmText: `${copy.verb} ${count} User${count === 1 ? '' : 's'}`,
      variant: copy.variant,
      onConfirm: () => runBulkAction(action),
    };
  }, [pendingAction, selectedIds, users]);

  const columns: Column<UserListItem>[] = [
    {
      header: 'Name',
      sortKey: 'name',
      accessor: (row) => (
        <div>
          <div className="font-medium text-white">{row.name}</div>
          {row.employee_code && <div className="text-[11px] text-[#A1A1AA]">{row.employee_code}</div>}
        </div>
      ),
    },
    {
      header: 'Email',
      sortKey: 'email',
      accessor: (row) => <span className="text-[#D4D4D8]">{row.email}</span>,
    },
    {
      header: 'Role',
      sortKey: 'role',
      accessor: (row) => (
        <StatusBadge status={row.role} variant={PRIVILEGED_ROLES.includes(row.role) ? 'gold' : 'neutral'} />
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.status} />
          {row.status === 'pending' && <span className="text-[10px] text-[#A1A1AA]">invite not accepted</span>}
        </div>
      ),
    },
    {
      header: 'Last Login',
      sortKey: 'last_login_at',
      accessor: (row) => <span className="text-xs text-[#A1A1AA]">{formatDateTime(row.last_login_at)}</span>,
    },
    {
      header: 'Created',
      sortKey: 'created_at',
      accessor: (row) => <span className="text-xs text-[#A1A1AA]">{formatDateTime(row.created_at)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div
          className="flex items-center justify-end gap-2 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${row.id}`)}>
            View
          </Button>
          {isSelf(row) ? (
            <span className="text-[10px] uppercase tracking-wide text-[#A1A1AA]">You</span>
          ) : (
            canManage(row) &&
            quickActionsFor(row).map((qa) => (
              <Button
                key={qa.action}
                variant={qa.danger ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setPendingAction({ kind: 'single', action: qa.action, user: row })}
              >
                {qa.label}
              </Button>
            ))
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Workforce Users"
          description="Create, secure and manage every account across VPD portals"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Users' }]}
        />
        <ErrorState title={error.status === 403 ? 'Access Denied' : 'Something went wrong'} message={error.message} onRetry={loadUsers} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title="Workforce Users"
        description="Create, secure and manage every account across VPD portals"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Users' }]}
        badge={<span className="text-xs text-[#A1A1AA]">{meta.total} account{meta.total === 1 ? '' : 's'}</span>}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              + Add User
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#171717] p-4 md:flex-row md:items-center">
        <div className="flex-1 min-w-0">
          <Input
            type="search"
            placeholder="Search name, email, phone, or employee code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search users"
          />
        </div>
        <div className="w-full md:w-52">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={[{ value: '', label: 'All Roles' }, ...ROLE_OPTIONS]}
            aria-label="Filter by role"
          />
        </div>
        <div className="w-full md:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        )}
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3">
          <span className="text-xs font-semibold text-[#DFC067]">
            {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          {selectedUsers.length > 0 && (
            <span className="hidden text-[11px] text-[#A1A1AA] lg:inline">
              {selectedUsers
                .slice(0, 3)
                .map((u) => u.name)
                .join(', ')}
              {selectedUsers.length > 3 ? ` +${selectedUsers.length - 3} more` : ''}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {(['activate', 'deactivate', 'suspend', 'restore'] as BulkUserAction[]).map((action) => (
              <Button
                key={action}
                variant={action === 'suspend' || action === 'deactivate' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setPendingAction({ kind: 'bulk', action, count: selectedIds.size })}
              >
                {ACTION_COPY[action].verb}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <DataTable
        loading={loading}
        data={users}
        columns={columns}
        sortState={sortState}
        onSortChange={handleSortChange}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        emptyTitle={filtersActive ? 'No Matching Users' : 'No Users Yet'}
        emptyMessage={
          filtersActive
            ? 'No accounts match the current search and filters. Adjust or reset the filters to see more.'
            : 'Create the first workforce account to get started.'
        }
      />

      <Pagination
        currentPage={meta.page}
        totalPages={meta.total_pages}
        onPageChange={setPage}
        totalItems={meta.total}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      {/* Create User Modal */}
      <Modal isOpen={createOpen} onClose={() => !createLoading && setCreateOpen(false)} title="Add Workforce Account" maxWidth="lg">
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <Input
              label="Phone (optional)"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
            <Select
              label="Role"
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              options={createRoleOptions}
            />
            {EMPLOYEE_ROLES.has(createForm.role) && (
              <>
                <Input
                  label="Designation (optional)"
                  value={createForm.designation}
                  onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                />
                <Select
                  label="Department (optional)"
                  value={createForm.department_id}
                  onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value })}
                  options={[{ value: '', label: 'No department' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
                />
              </>
            )}
          </div>

          <fieldset className="space-y-3 rounded-xl border border-[#2A2A2A] p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">Provisioning</legend>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="passwordMode"
                checked={createForm.passwordMode === 'invite'}
                onChange={() => setCreateForm({ ...createForm, passwordMode: 'invite' })}
                className="mt-0.5 accent-[#D4AF37]"
              />
              <span className="text-sm text-zinc-300">
                Send invite email
                <span className="block text-xs text-[#A1A1AA]">
                  The user receives a secure link to set their own password. Recommended.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="passwordMode"
                checked={createForm.passwordMode === 'password'}
                onChange={() => setCreateForm({ ...createForm, passwordMode: 'password' })}
                className="mt-0.5 accent-[#D4AF37]"
              />
              <span className="text-sm text-zinc-300">
                Set an initial password
                <span className="block text-xs text-[#A1A1AA]">
                  Share it with the user through a secure channel. They should change it after first login.
                </span>
              </span>
            </label>
            {createForm.passwordMode === 'password' && (
              <Input
                label="Initial Password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                helperText="Min 6 characters with uppercase, lowercase, a number and a special character."
                autoComplete="new-password"
              />
            )}
          </fieldset>

          {createError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={createLoading}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation */}
      <ConfirmDialog
        isOpen={!!pendingAction}
        title={confirmCopy?.title || 'Confirm Action'}
        message={confirmCopy?.message || ''}
        confirmText={confirmCopy?.confirmText || 'Confirm'}
        variant={confirmCopy?.variant || 'danger'}
        onConfirm={() => confirmCopy?.onConfirm()}
        onCancel={() => !actionLoading && setPendingAction(null)}
        loading={actionLoading}
      />

      {/* Bulk failures detail */}
      <Modal isOpen={!!bulkFailures} onClose={() => setBulkFailures(null)} title="Bulk Action — Per-User Results" maxWidth="lg">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            {bulkFailures?.length} account{bulkFailures?.length === 1 ? '' : 's'} could not be updated. Everything else
            completed successfully.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-[#2A2A2A]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">User</th>
                  <th className="px-4 py-2.5 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]/80">
                {(bulkFailures || []).map((f) => (
                  <tr key={f.user_id}>
                    <td className="px-4 py-3 text-zinc-200">
                      {users.find((u) => u.id === f.user_id)?.name || f.user_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#EF4444]">{f.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => setBulkFailures(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default Users;
