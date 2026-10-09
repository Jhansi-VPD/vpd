"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../auth/auth.context';
import { useNotifications } from '../../../../app/providers/NotificationProvider';
import { permissionsApi, rolesApi } from '../../../../api';
import DataTable, { Column, SortState } from '../../../../shared/components/DataTable';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import ErrorState from '../../../../shared/components/ErrorState';
import EmptyState from '../../../../shared/components/EmptyState';
import LoadingState from '../../../../shared/components/LoadingState';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog';
import Pagination from '../../../../shared/components/Pagination';
import {
  ModuleSummary,
  PermissionBase,
  PermissionListItem,
  PermissionListParams,
  PermissionRoleEntry,
  PORTAL_OPTIONS,
  PortalValue,
  RoleActivityEntry,
  RoleCreatePayload,
  RoleDetail,
  RoleListItem,
  RoleListParams,
  RoleUpdatePayload,
  RoleUserEntry,
} from '../../../../types/role.types';

type MainTab = 'roles' | 'permissions';
type DetailTab = 'permissions' | 'users' | 'activity';

interface ListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const EMPTY_META: ListMeta = { total: 0, page: 1, limit: 10, total_pages: 0 };

const SLUG_RE = /^[a-z][a-z0-9_]{1,63}$/;
const CODE_RE = /^[a-z][a-z0-9_]{1,49}$/;

const PORTAL_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales: 'Sales',
  hr: 'HR',
  delivery: 'Delivery',
  employee: 'Employee',
  client: 'Client',
  partner: 'Partner',
};

function portalLabel(portal: string | null | undefined): string {
  if (!portal) return '—';
  return PORTAL_LABELS[portal] || portal;
}

const ROLE_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
];

const PORTAL_FILTER_OPTIONS = [{ value: '', label: 'All Portals' }, ...PORTAL_OPTIONS];

const PORTAL_FORM_OPTIONS = [{ value: '', label: 'Select a portal…' }, ...PORTAL_OPTIONS];

type ConfirmState =
  | { kind: 'role-status'; role: RoleListItem; nextActive: boolean }
  | { kind: 'role-delete'; role: RoleListItem }
  | { kind: 'perm-status'; permission: PermissionListItem; nextActive: boolean }
  | { kind: 'perm-delete'; permission: PermissionListItem }
  | null;

const EMPTY_ROLE_FORM: { name: string; slug: string; description: string; portal: PortalValue | '' } = {
  name: '',
  slug: '',
  description: '',
  portal: '',
};

const EMPTY_PERM_FORM = { module: '', action: '', description: '' };

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

/** The matrix needs the full active set (grouped per module), so page through
 * the list endpoint at its max limit instead of relying on the first page. */
async function fetchAllActivePermissions(): Promise<PermissionBase[]> {
  const all: PermissionBase[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const res = await permissionsApi.getAll({ page, limit: 100, status: 'active', sort: 'module,action' });
    all.push(...(res.data || []));
    const totalPages = res.meta?.total_pages ?? 1;
    if (page >= totalPages) break;
  }
  return all;
}

export const RolesPermissions: React.FC = () => {
  const router = useRouter();
  const { user: me } = useAuth();
  const { showNotification } = useNotifications();
  const isSuperAdmin = me?.role === 'super_admin';

  // Shell
  const [activeTab, setActiveTab] = useState<MainTab>('roles');
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Roles list
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<{ status?: number; message: string } | null>(null);
  const [rolesMeta, setRolesMeta] = useState<ListMeta>(EMPTY_META);
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPageSize, setRolesPageSize] = useState(10);
  const [roleSearchInput, setRoleSearchInput] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState<PortalValue | ''>('');
  const [roleStatusFilter, setRoleStatusFilter] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('');
  const [roleSort, setRoleSort] = useState<SortState | null>({ key: 'created_at', direction: 'desc' });

  // Role create / edit modals
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState(EMPTY_ROLE_FORM);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);
  const [createRoleLoading, setCreateRoleLoading] = useState(false);
  const [editRoleTarget, setEditRoleTarget] = useState<RoleListItem | null>(null);
  const [editRoleForm, setEditRoleForm] = useState<{ name: string; description: string; portal: PortalValue | '' }>({
    name: '',
    description: '',
    portal: '',
  });
  const [editRoleError, setEditRoleError] = useState<string | null>(null);
  const [editRoleLoading, setEditRoleLoading] = useState(false);

  // Role detail
  const [activeRole, setActiveRole] = useState<RoleListItem | null>(null);
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('permissions');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<PermissionBase[]>([]);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [implicitAll, setImplicitAll] = useState(false);
  const [matrixSaving, setMatrixSaving] = useState(false);

  // Role detail — users tab
  const [roleUsers, setRoleUsers] = useState<RoleUserEntry[]>([]);
  const [roleUsersLoading, setRoleUsersLoading] = useState(false);
  const [roleUsersError, setRoleUsersError] = useState<string | null>(null);
  const [roleUsersMeta, setRoleUsersMeta] = useState<ListMeta>(EMPTY_META);
  const [roleUsersPage, setRoleUsersPage] = useState(1);
  const [roleUsersSearchInput, setRoleUsersSearchInput] = useState('');
  const [roleUsersSearch, setRoleUsersSearch] = useState('');

  // Role detail — activity tab
  const [activity, setActivity] = useState<RoleActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityMeta, setActivityMeta] = useState<ListMeta>(EMPTY_META);
  const [activityPage, setActivityPage] = useState(1);

  // Permissions tab
  const [perms, setPerms] = useState<PermissionListItem[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError, setPermsError] = useState<{ status?: number; message: string } | null>(null);
  const [permsMeta, setPermsMeta] = useState<ListMeta>(EMPTY_META);
  const [permsPage, setPermsPage] = useState(1);
  const [permsPageSize, setPermsPageSize] = useState(10);
  const [permSearchInput, setPermSearchInput] = useState('');
  const [permSearch, setPermSearch] = useState('');
  const [permModuleFilter, setPermModuleFilter] = useState('');
  const [permStatusFilter, setPermStatusFilter] = useState('');
  const [permTypeFilter, setPermTypeFilter] = useState('');
  const [permSort, setPermSort] = useState<SortState | null>(null);
  const [modules, setModules] = useState<ModuleSummary[]>([]);

  // Permission modals
  const [createPermOpen, setCreatePermOpen] = useState(false);
  const [permForm, setPermForm] = useState(EMPTY_PERM_FORM);
  const [permFormError, setPermFormError] = useState<string | null>(null);
  const [permFormLoading, setPermFormLoading] = useState(false);
  const [editPermTarget, setEditPermTarget] = useState<PermissionListItem | null>(null);
  const [editPermDescription, setEditPermDescription] = useState('');
  const [editPermError, setEditPermError] = useState<string | null>(null);
  const [editPermLoading, setEditPermLoading] = useState(false);
  const [rolesModalPerm, setRolesModalPerm] = useState<PermissionListItem | null>(null);
  const [permRoles, setPermRoles] = useState<PermissionRoleEntry[] | null>(null);

  const roleSortParam = roleSort
    ? roleSort.direction === 'desc'
      ? `-${roleSort.key}`
      : roleSort.key
    : undefined;
  const permSortParam = permSort
    ? permSort.direction === 'desc'
      ? `-${permSort.key}`
      : permSort.key
    : undefined;

  const roleFilters = useMemo(
    () => ({
      search: roleSearch || undefined,
      portal: (portalFilter || undefined) as RoleListParams['portal'],
      status: (roleStatusFilter || undefined) as RoleListParams['status'],
      type: (roleTypeFilter || undefined) as RoleListParams['type'],
    }),
    [roleSearch, portalFilter, roleStatusFilter, roleTypeFilter]
  );

  const permFilters = useMemo(
    () => ({
      search: permSearch || undefined,
      module: permModuleFilter || undefined,
      status: (permStatusFilter || undefined) as PermissionListParams['status'],
      type: (permTypeFilter || undefined) as PermissionListParams['type'],
    }),
    [permSearch, permModuleFilter, permStatusFilter, permTypeFilter]
  );

  const rolesFiltersActive =
    !!roleSearch || !!portalFilter || !!roleStatusFilter || !!roleTypeFilter;
  const permsFiltersActive = !!permSearch || !!permModuleFilter || !!permStatusFilter || !!permTypeFilter;

  // ---------------------------------------------------------------- loaders

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const res = await rolesApi.getAll({
        page: rolesPage,
        limit: rolesPageSize,
        sort: roleSortParam,
        ...roleFilters,
      });
      const rows = res.data || [];
      const m = res.meta || {};
      setRoles(rows);
      setRolesMeta({
        total: m.total ?? rows.length,
        page: m.page ?? rolesPage,
        limit: m.limit ?? rolesPageSize,
        total_pages: m.total_pages ?? 1,
      });
      if (rows.length === 0 && rolesPage > 1 && typeof m.total_pages === 'number' && m.total_pages < rolesPage) {
        setRolesPage(Math.max(m.total_pages, 1));
      }
    } catch (err: any) {
      setRolesError({
        status: err?.status,
        message:
          err?.status === 403
            ? 'You do not have permission to view roles. Ask a Super Admin to grant you the roles:read permission.'
            : err?.message || 'Failed to load roles. Please try again.',
      });
    } finally {
      setRolesLoading(false);
    }
  }, [rolesPage, rolesPageSize, roleSortParam, roleFilters]);

  const loadPermissions = useCallback(async () => {
    setPermsLoading(true);
    setPermsError(null);
    try {
      const res = await permissionsApi.getAll({
        page: permsPage,
        limit: permsPageSize,
        sort: permSortParam,
        ...permFilters,
      });
      const rows = res.data || [];
      const m = res.meta || {};
      setPerms(rows);
      setPermsMeta({
        total: m.total ?? rows.length,
        page: m.page ?? permsPage,
        limit: m.limit ?? permsPageSize,
        total_pages: m.total_pages ?? 1,
      });
      if (rows.length === 0 && permsPage > 1 && typeof m.total_pages === 'number' && m.total_pages < permsPage) {
        setPermsPage(Math.max(m.total_pages, 1));
      }
    } catch (err: any) {
      setPermsError({
        status: err?.status,
        message:
          err?.status === 403
            ? 'You do not have permission to view permissions. Ask a Super Admin to grant you the permissions:read permission.'
            : err?.message || 'Failed to load permissions. Please try again.',
      });
    } finally {
      setPermsLoading(false);
    }
  }, [permsPage, permsPageSize, permSortParam, permFilters]);

  const loadRoleWorkspace = useCallback(async (roleId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [detailRes, summaryRes, allPerms] = await Promise.all([
        rolesApi.getById(roleId),
        rolesApi.getPermissions(roleId),
        fetchAllActivePermissions(),
      ]);
      setRoleDetail(detailRes.data);
      const assigned = (summaryRes.data?.permissions || []).map((p) => p.id);
      setOriginalIds(new Set(assigned));
      setCheckedIds(new Set(assigned));
      setImplicitAll(!!summaryRes.data?.implicit_all_permissions);
      setMatrix(allPerms);
    } catch (err: any) {
      setDetailError(err?.message || 'Failed to load this role. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadRoleUsers = useCallback(async () => {
    if (!activeRole) return;
    setRoleUsersLoading(true);
    setRoleUsersError(null);
    try {
      const res = await rolesApi.getUsers(activeRole.id, {
        page: roleUsersPage,
        limit: 10,
        search: roleUsersSearch || undefined,
      });
      const rows = res.data || [];
      const m = res.meta || {};
      setRoleUsers(rows);
      setRoleUsersMeta({
        total: m.total ?? rows.length,
        page: m.page ?? roleUsersPage,
        limit: m.limit ?? 10,
        total_pages: m.total_pages ?? 1,
      });
    } catch (err: any) {
      setRoleUsersError(err?.message || 'Failed to load users for this role.');
    } finally {
      setRoleUsersLoading(false);
    }
  }, [activeRole, roleUsersPage, roleUsersSearch]);

  const loadActivity = useCallback(async () => {
    if (!activeRole) return;
    setActivityLoading(true);
    setActivityError(null);
    try {
      const res = await rolesApi.getActivity(activeRole.id, { page: activityPage, limit: 10 });
      const rows = res.data || [];
      const m = res.meta || {};
      setActivity(rows);
      setActivityMeta({
        total: m.total ?? rows.length,
        page: m.page ?? activityPage,
        limit: m.limit ?? 10,
        total_pages: m.total_pages ?? 1,
      });
    } catch (err: any) {
      setActivityError(err?.message || 'Failed to load activity for this role.');
    } finally {
      setActivityLoading(false);
    }
  }, [activeRole, activityPage]);

  // ---------------------------------------------------------------- effects

  useEffect(() => {
    if (activeTab === 'roles' && !activeRole) loadRoles();
  }, [activeTab, activeRole, loadRoles]);

  useEffect(() => {
    if (activeTab === 'permissions') loadPermissions();
  }, [activeTab, loadPermissions]);

  useEffect(() => {
    if (activeTab !== 'permissions' || modules.length > 0) return;
    let cancelled = false;
    permissionsApi
      .getModules()
      .then((res) => {
        if (!cancelled) setModules(res.data || []);
      })
      .catch(() => {
        /* module filter degrades to free search */
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, modules.length]);

  useEffect(() => {
    if (detailTab !== 'users' || !activeRole) return;
    loadRoleUsers();
  }, [detailTab, activeRole, loadRoleUsers]);

  useEffect(() => {
    if (detailTab !== 'activity' || !activeRole) return;
    loadActivity();
  }, [detailTab, activeRole, loadActivity]);

  // Debounced role search
  const roleSearchFirstRun = useRef(true);
  useEffect(() => {
    if (roleSearchFirstRun.current) {
      roleSearchFirstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      setRoleSearch(roleSearchInput.trim());
      setRolesPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [roleSearchInput]);

  // Debounced permission search
  const permSearchFirstRun = useRef(true);
  useEffect(() => {
    if (permSearchFirstRun.current) {
      permSearchFirstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      setPermSearch(permSearchInput.trim());
      setPermsPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [permSearchInput]);

  // Debounced role-users search
  const roleUsersSearchFirstRun = useRef(true);
  useEffect(() => {
    if (roleUsersSearchFirstRun.current) {
      roleUsersSearchFirstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      setRoleUsersSearch(roleUsersSearchInput.trim());
      setRoleUsersPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [roleUsersSearchInput]);

  // ------------------------------------------------------- role detail flow

  const openRole = (role: RoleListItem) => {
    setActiveRole(role);
    setRoleDetail(null);
    setDetailTab('permissions');
    setMatrix([]);
    setCheckedIds(new Set());
    setOriginalIds(new Set());
    setImplicitAll(false);
    setMatrixSearch('');
    setDetailError(null);
    setRoleUsers([]);
    setRoleUsersPage(1);
    setRoleUsersSearchInput('');
    setRoleUsersSearch('');
    setRoleUsersError(null);
    setActivity([]);
    setActivityPage(1);
    setActivityError(null);
    loadRoleWorkspace(role.id);
  };

  const backToList = () => {
    setActiveRole(null);
    setRoleDetail(null);
  };

  const detailRole = roleDetail ?? activeRole;
  const canEditMatrix = !!detailRole && !implicitAll && (!detailRole.is_system || isSuperAdmin);

  const isChecked = (id: string) => implicitAll || checkedIds.has(id);

  const toggleOne = (id: string) => {
    if (!canEditMatrix) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (perms: PermissionBase[], selectAll: boolean) => {
    if (!canEditMatrix) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => {
        if (selectAll) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const addedIds = useMemo(
    () => Array.from(checkedIds).filter((id) => !originalIds.has(id)),
    [checkedIds, originalIds]
  );
  const removedIds = useMemo(
    () => Array.from(originalIds).filter((id) => !checkedIds.has(id)),
    [checkedIds, originalIds]
  );
  const matrixDirty = addedIds.length > 0 || removedIds.length > 0;

  const filteredMatrix = useMemo(() => {
    const q = matrixSearch.trim().toLowerCase();
    if (!q) return matrix;
    return matrix.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }, [matrix, matrixSearch]);

  const groupedMatrix = useMemo(() => {
    const groups = new Map<string, PermissionBase[]>();
    for (const p of filteredMatrix) {
      const bucket = groups.get(p.module);
      if (bucket) bucket.push(p);
      else groups.set(p.module, [p]);
    }
    return Array.from(groups.entries()).map(([module, perms]) => ({ module, perms }));
  }, [filteredMatrix]);

  const saveMatrix = async () => {
    if (!activeRole) return;
    setMatrixSaving(true);
    try {
      const res = await rolesApi.setPermissions(activeRole.id, Array.from(checkedIds));
      const assigned = (res.data?.permissions || []).map((p) => p.id);
      setOriginalIds(new Set(assigned));
      setCheckedIds(new Set(assigned));
      showNotification('success', res.message || 'Role permissions updated.');
      const detailRes = await rolesApi.getById(activeRole.id);
      setRoleDetail(detailRes.data);
      setActiveRole((prev) =>
        prev && prev.id === detailRes.data.id
          ? { ...prev, permission_count: detailRes.data.permission_count }
          : prev
      );
      loadRoles();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update role permissions.');
      if (err?.status === 409) loadRoleWorkspace(activeRole.id);
    } finally {
      setMatrixSaving(false);
    }
  };

  // ---------------------------------------------------------- role actions

  const openEditRole = (role: RoleListItem) => {
    setEditRoleTarget(role);
    setEditRoleForm({
      name: role.name,
      description: role.description || '',
      portal: (role.portal as PortalValue) || '',
    });
    setEditRoleError(null);
  };

  const submitCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRoleError(null);
    const name = createRoleForm.name.trim();
    const slug = createRoleForm.slug.trim();
    if (!name) return setCreateRoleError('Role name is required.');
    if (name.length > 100) return setCreateRoleError('Role name cannot exceed 100 characters.');
    if (slug && !SLUG_RE.test(slug))
      return setCreateRoleError(
        'Slug must start with a lowercase letter and use only lowercase letters, numbers and underscores (2–64 characters).'
      );
    if (!createRoleForm.portal) return setCreateRoleError('Select the portal this role should land in.');
    const payload: RoleCreatePayload = {
      name,
      slug: slug || undefined,
      description: createRoleForm.description.trim() || undefined,
      portal: createRoleForm.portal as PortalValue,
    };
    setCreateRoleLoading(true);
    try {
      const res = await rolesApi.create(payload);
      showNotification('success', res.message || 'Role created successfully.');
      setCreateRoleOpen(false);
      setCreateRoleForm(EMPTY_ROLE_FORM);
      setRolesPage(1);
      await loadRoles();
    } catch (err: any) {
      setCreateRoleError(err?.message || 'Failed to create role.');
    } finally {
      setCreateRoleLoading(false);
    }
  };

  const submitEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleTarget) return;
    setEditRoleError(null);
    const name = editRoleForm.name.trim();
    const description = editRoleForm.description.trim();
    if (!name) return setEditRoleError('Role name is required.');
    if (name.length > 100) return setEditRoleError('Role name cannot exceed 100 characters.');
    const payload: RoleUpdatePayload = {};
    if (name !== editRoleTarget.name) payload.name = name;
    if (description !== (editRoleTarget.description || '')) payload.description = description;
    if (
      !editRoleTarget.is_system &&
      editRoleForm.portal &&
      editRoleForm.portal !== (editRoleTarget.portal || '')
    ) {
      payload.portal = editRoleForm.portal as PortalValue;
    }
    setEditRoleLoading(true);
    try {
      const res = await rolesApi.update(editRoleTarget.id, payload);
      showNotification('success', res.message || 'Role updated successfully.');
      setEditRoleTarget(null);
      if (activeRole && activeRole.id === res.data.id) {
        setRoleDetail(res.data);
        setActiveRole((prev) => (prev && prev.id === res.data.id ? res.data : prev));
      }
      await loadRoles();
    } catch (err: any) {
      setEditRoleError(err?.message || 'Failed to update role.');
    } finally {
      setEditRoleLoading(false);
    }
  };

  const runRoleStatus = async (role: RoleListItem, nextActive: boolean) => {
    setConfirmLoading(true);
    try {
      const res = await rolesApi.setStatus(role.id, nextActive);
      showNotification('success', res.message || `Role ${nextActive ? 'activated' : 'deactivated'}.`);
      setConfirmState(null);
      if (roleDetail && roleDetail.id === role.id) setRoleDetail(res.data);
      setActiveRole((prev) => (prev && prev.id === role.id ? { ...prev, is_active: res.data.is_active } : prev));
      await loadRoles();
    } catch (err: any) {
      showNotification('error', err?.message || `Failed to ${nextActive ? 'activate' : 'deactivate'} this role.`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const runRoleDelete = async (role: RoleListItem) => {
    setConfirmLoading(true);
    try {
      await rolesApi.delete(role.id);
      showNotification('success', `Role "${role.name}" deleted.`);
      setConfirmState(null);
      if (activeRole && activeRole.id === role.id) {
        setActiveRole(null);
        setRoleDetail(null);
      }
      await loadRoles();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete this role.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ---------------------------------------------------- permission actions

  const submitCreatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermFormError(null);
    const module_ = permForm.module.trim().toLowerCase();
    const action = permForm.action.trim().toLowerCase();
    if (!CODE_RE.test(module_))
      return setPermFormError(
        'Module must start with a lowercase letter and use only lowercase letters, numbers and underscores (2–50 characters).'
      );
    if (!CODE_RE.test(action))
      return setPermFormError(
        'Action must start with a lowercase letter and use only lowercase letters, numbers and underscores (2–50 characters).'
      );
    setPermFormLoading(true);
    try {
      const res = await permissionsApi.create({
        module: module_,
        action,
        description: permForm.description.trim() || undefined,
      });
      showNotification('success', res.message || 'Permission created successfully.');
      setCreatePermOpen(false);
      setPermForm(EMPTY_PERM_FORM);
      setPermsPage(1);
      await loadPermissions();
      permissionsApi
        .getModules()
        .then((modRes) => setModules(modRes.data || []))
        .catch(() => undefined);
    } catch (err: any) {
      setPermFormError(err?.message || 'Failed to create permission.');
    } finally {
      setPermFormLoading(false);
    }
  };

  const openEditPerm = (permission: PermissionListItem) => {
    setEditPermTarget(permission);
    setEditPermDescription(permission.description || '');
    setEditPermError(null);
  };

  const submitEditPerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermTarget) return;
    setEditPermError(null);
    setEditPermLoading(true);
    try {
      const res = await permissionsApi.update(editPermTarget.id, {
        description: editPermDescription.trim(),
      });
      showNotification('success', res.message || 'Permission updated successfully.');
      setEditPermTarget(null);
      await loadPermissions();
    } catch (err: any) {
      setEditPermError(err?.message || 'Failed to update permission.');
    } finally {
      setEditPermLoading(false);
    }
  };

  const openPermRoles = async (permission: PermissionListItem) => {
    setRolesModalPerm(permission);
    setPermRoles(null);
    try {
      const res = await permissionsApi.getRoles(permission.id);
      setPermRoles(res.data || []);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to load roles for this permission.');
      setRolesModalPerm(null);
    }
  };

  const runPermStatus = async (permission: PermissionListItem, nextActive: boolean) => {
    setConfirmLoading(true);
    try {
      const res = await permissionsApi.setStatus(permission.id, nextActive);
      showNotification('success', res.message || `Permission ${nextActive ? 'activated' : 'deactivated'}.`);
      setConfirmState(null);
      await loadPermissions();
    } catch (err: any) {
      showNotification('error', err?.message || `Failed to ${nextActive ? 'activate' : 'deactivate'} this permission.`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const runPermDelete = async (permission: PermissionListItem) => {
    setConfirmLoading(true);
    try {
      await permissionsApi.delete(permission.id);
      showNotification('success', `Permission "${permission.name}" deleted.`);
      setConfirmState(null);
      await loadPermissions();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete this permission.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ------------------------------------------------------------- filters UI

  const handleRoleSortChange = (key: string) => {
    setRoleSort((prev) =>
      prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
    setRolesPage(1);
  };

  const handlePermSortChange = (key: string) => {
    setPermSort((prev) =>
      prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
    setPermsPage(1);
  };

  const resetRoleFilters = () => {
    setRoleSearchInput('');
    setRoleSearch('');
    setPortalFilter('');
    setRoleStatusFilter('');
    setRoleTypeFilter('');
    setRolesPage(1);
  };

  const resetPermFilters = () => {
    setPermSearchInput('');
    setPermSearch('');
    setPermModuleFilter('');
    setPermStatusFilter('');
    setPermTypeFilter('');
    setPermsPage(1);
  };

  // ------------------------------------------------------------- columns

  const roleColumns: Column<RoleListItem>[] = [
    {
      header: 'Role',
      sortKey: 'name',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{row.name}</span>
          <span className="font-mono text-[11px] text-[#71717A]">{row.slug}</span>
        </div>
      ),
    },
    {
      header: 'Portal',
      accessor: (row) =>
        row.portal ? (
          <StatusBadge status={portalLabel(row.portal)} variant="info" />
        ) : (
          <span className="text-xs text-[#71717A]">None</span>
        ),
    },
    {
      header: 'Type',
      accessor: (row) =>
        row.is_system ? (
          <StatusBadge status="system" variant="gold" />
        ) : (
          <StatusBadge status="custom" variant="neutral" />
        ),
    },
    {
      header: 'Users',
      sortKey: 'user_count',
      accessor: (row) => <span className="text-[#D4D4D8]">{row.user_count}</span>,
    },
    {
      header: 'Permissions',
      sortKey: 'permission_count',
      accessor: (row) => (
        <span className="text-[#D4D4D8]">
          {row.slug === 'super_admin' ? 'All (implicit)' : row.permission_count}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
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
        <div className="flex items-center justify-end gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => openRole(row)}>
            View
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditRole(row)}>
            Edit
          </Button>
          {!row.is_system &&
            (row.is_active ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmState({ kind: 'role-status', role: row, nextActive: false })}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmState({ kind: 'role-status', role: row, nextActive: true })}
              >
                Activate
              </Button>
            ))}
          {!row.is_system && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmState({ kind: 'role-delete', role: row })}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const roleUserColumns: Column<RoleUserEntry>[] = [
    { header: 'Name', accessor: (row) => <span className="font-medium text-white">{row.name}</span> },
    { header: 'Email', accessor: (row) => <span className="text-[#D4D4D8]">{row.email}</span> },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const activityColumns: Column<RoleActivityEntry>[] = [
    {
      header: 'Action',
      accessor: (row) => <span className="font-mono text-xs text-[#DFC067]">{row.action}</span>,
    },
    {
      header: 'Actor',
      accessor: (row) => (
        <span className="text-[#D4D4D8]">{row.actor_name || (row.actor_id ? row.actor_id : 'System')}</span>
      ),
    },
    {
      header: 'IP Address',
      accessor: (row) => (
        <span className="font-mono text-xs text-[#A1A1AA]">{row.ip_address || '—'}</span>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (row) => <span className="text-xs text-[#A1A1AA]">{formatDateTime(row.timestamp)}</span>,
    },
    {
      header: 'Details',
      accessor: (row) => {
        const keys = Object.keys(row.metadata || {});
        if (keys.length === 0) return <span className="text-xs text-[#71717A]">—</span>;
        return (
          <span
            className="cursor-help font-mono text-[11px] text-[#71717A]"
            title={JSON.stringify(row.metadata, null, 2)}
          >
            {keys.join(', ')}
          </span>
        );
      },
    },
  ];

  const permissionColumns: Column<PermissionListItem>[] = [
    {
      header: 'Permission',
      sortKey: 'name',
      accessor: (row) => <span className="font-mono text-xs text-[#DFC067]">{row.name}</span>,
    },
    {
      header: 'Module',
      sortKey: 'module',
      accessor: (row) => <span className="text-[#D4D4D8]">{row.module}</span>,
    },
    {
      header: 'Action',
      accessor: (row) => <span className="text-[#D4D4D8]">{row.action.replace(/_/g, ' ')}</span>,
    },
    {
      header: 'Description',
      accessor: (row) =>
        row.description ? (
          <span className="block max-w-[220px] truncate text-xs text-[#A1A1AA]" title={row.description}>
            {row.description}
          </span>
        ) : (
          <span className="text-xs text-[#71717A]">—</span>
        ),
    },
    {
      header: 'Roles',
      sortKey: 'role_count',
      accessor: (row) => <span className="text-[#D4D4D8]">{row.role_count}</span>,
    },
    {
      header: 'Type',
      accessor: (row) =>
        row.is_system ? (
          <StatusBadge status="system" variant="gold" />
        ) : (
          <StatusBadge status="custom" variant="neutral" />
        ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
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
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <Button variant="ghost" size="sm" onClick={() => openPermRoles(row)}>
            Roles
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditPerm(row)}>
            Edit
          </Button>
          {!row.is_system &&
            (row.is_active ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmState({ kind: 'perm-status', permission: row, nextActive: false })}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmState({ kind: 'perm-status', permission: row, nextActive: true })}
              >
                Activate
              </Button>
            ))}
          {!row.is_system && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmState({ kind: 'perm-delete', permission: row })}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ------------------------------------------------------- confirm dialog

  const confirmCopy = useMemo(() => {
    if (!confirmState) return null;
    if (confirmState.kind === 'role-status') {
      const { role, nextActive } = confirmState;
      return {
        title: `${nextActive ? 'Activate' : 'Deactivate'} "${role.name}"?`,
        message: nextActive ? (
          <p>
            <strong className="text-white">{role.name}</strong> becomes assignable again and its users regain the
            access this role grants.
          </p>
        ) : (
          <div className="space-y-2">
            <p>
              Users with <strong className="text-white">{role.name}</strong> keep their accounts but lose the access
              this role grants.
            </p>
            <p className="text-xs text-[#A1A1AA]">
              A role with users still assigned cannot be deactivated — reassign them first.
            </p>
          </div>
        ),
        confirmText: nextActive ? 'Activate Role' : 'Deactivate Role',
        variant: (nextActive ? 'primary' : 'danger') as 'primary' | 'danger',
        onConfirm: () => runRoleStatus(role, nextActive),
      };
    }
    if (confirmState.kind === 'role-delete') {
      const { role } = confirmState;
      return {
        title: `Delete "${role.name}"?`,
        message: (
          <div className="space-y-2">
            <p>
              <strong className="text-white">{role.name}</strong> will be soft-deleted — the record and its history
              are preserved, but the role can no longer be assigned.
            </p>
            <p className="text-xs text-[#A1A1AA]">
              Roles with users still assigned cannot be deleted — reassign them first.
            </p>
          </div>
        ),
        confirmText: 'Delete Role',
        variant: 'danger' as const,
        onConfirm: () => runRoleDelete(role),
      };
    }
    if (confirmState.kind === 'perm-status') {
      const { permission, nextActive } = confirmState;
      return {
        title: `${nextActive ? 'Activate' : 'Deactivate'} "${permission.name}"?`,
        message: nextActive ? (
          <p>
            <strong className="text-white">{permission.name}</strong> becomes assignable to roles again.
          </p>
        ) : (
          <div className="space-y-2">
            <p>
              Roles holding <strong className="text-white">{permission.name}</strong> lose the access it grants.
            </p>
            <p className="text-xs text-[#A1A1AA]">
              A permission still assigned to any role cannot be deactivated — remove it from them first.
            </p>
          </div>
        ),
        confirmText: nextActive ? 'Activate Permission' : 'Deactivate Permission',
        variant: (nextActive ? 'primary' : 'danger') as 'primary' | 'danger',
        onConfirm: () => runPermStatus(permission, nextActive),
      };
    }
    const { permission } = confirmState;
    return {
      title: `Delete "${permission.name}"?`,
      message: (
        <div className="space-y-2">
          <p>
            <strong className="text-white">{permission.name}</strong> will be soft-deleted and can no longer be
            assigned.
          </p>
          <p className="text-xs text-[#A1A1AA]">
            Permissions still assigned to any role cannot be deleted — remove it from them first.
          </p>
        </div>
      ),
      confirmText: 'Delete Permission',
      variant: 'danger' as const,
      onConfirm: () => runPermDelete(permission),
    };
  }, [confirmState]);

  // ------------------------------------------------------------- rendering

  const tabsRow = (
    <div className="flex w-fit items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#171717] p-1">
      {(['roles', 'permissions'] as MainTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab ? 'bg-[#D4AF37] text-black' : 'text-[#A1A1AA] hover:bg-[#262626] hover:text-white'
          }`}
        >
          {tab === 'roles' ? 'Roles' : 'Permissions'}
        </button>
      ))}
    </div>
  );

  const renderRolesList = () => {
    if (rolesError) {
      return (
        <ErrorState
          title={rolesError.status === 403 ? 'Access Denied' : 'Something went wrong'}
          message={rolesError.message}
          onRetry={loadRoles}
        />
      );
    }
    return (
      <>
        <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#171717] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <Input
                type="search"
                placeholder="Search role name, slug, or description…"
                value={roleSearchInput}
                onChange={(e) => setRoleSearchInput(e.target.value)}
                aria-label="Search roles"
              />
            </div>
            <div className="w-full lg:w-44">
              <Select
                value={portalFilter}
                onChange={(e) => {
                  setPortalFilter(e.target.value as PortalValue | '');
                  setRolesPage(1);
                }}
                options={PORTAL_FILTER_OPTIONS}
                aria-label="Filter by portal"
              />
            </div>
            <div className="w-full lg:w-40">
              <Select
                value={roleStatusFilter}
                onChange={(e) => {
                  setRoleStatusFilter(e.target.value);
                  setRolesPage(1);
                }}
                options={ROLE_STATUS_OPTIONS}
                aria-label="Filter by status"
              />
            </div>
            <div className="w-full lg:w-40">
              <Select
                value={roleTypeFilter}
                onChange={(e) => {
                  setRoleTypeFilter(e.target.value);
                  setRolesPage(1);
                }}
                options={TYPE_FILTER_OPTIONS}
                aria-label="Filter by type"
              />
            </div>
            {rolesFiltersActive && (
              <div className="flex justify-end lg:ml-auto">
                <Button variant="ghost" size="sm" onClick={resetRoleFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <DataTable
          loading={rolesLoading}
          data={roles}
          columns={roleColumns}
          sortState={roleSort}
          onSortChange={handleRoleSortChange}
          onRowClick={openRole}
          emptyTitle={rolesFiltersActive ? 'No Matching Roles' : 'No Roles Yet'}
          emptyMessage={
            rolesFiltersActive
              ? 'No roles match the current search and filters. Adjust or reset the filters to see more.'
              : 'Create the first custom role to get started.'
          }
        />

        <Pagination
          currentPage={rolesMeta.page}
          totalPages={rolesMeta.total_pages}
          onPageChange={setRolesPage}
          totalItems={rolesMeta.total}
          pageSize={rolesPageSize}
          onPageSizeChange={(n) => {
            setRolesPageSize(n);
            setRolesPage(1);
          }}
        />
      </>
    );
  };

  const renderPermissionsList = () => {
    if (permsError) {
      return (
        <ErrorState
          title={permsError.status === 403 ? 'Access Denied' : 'Something went wrong'}
          message={permsError.message}
          onRetry={loadPermissions}
        />
      );
    }
    return (
      <>
        <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#171717] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <Input
                type="search"
                placeholder="Search permission name or description…"
                value={permSearchInput}
                onChange={(e) => setPermSearchInput(e.target.value)}
                aria-label="Search permissions"
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                value={permModuleFilter}
                onChange={(e) => {
                  setPermModuleFilter(e.target.value);
                  setPermsPage(1);
                }}
                options={[
                  { value: '', label: 'All Modules' },
                  ...modules.map((m) => ({ value: m.module, label: `${m.module} (${m.permission_count})` })),
                ]}
                aria-label="Filter by module"
              />
            </div>
            <div className="w-full lg:w-40">
              <Select
                value={permStatusFilter}
                onChange={(e) => {
                  setPermStatusFilter(e.target.value);
                  setPermsPage(1);
                }}
                options={ROLE_STATUS_OPTIONS}
                aria-label="Filter by status"
              />
            </div>
            <div className="w-full lg:w-40">
              <Select
                value={permTypeFilter}
                onChange={(e) => {
                  setPermTypeFilter(e.target.value);
                  setPermsPage(1);
                }}
                options={TYPE_FILTER_OPTIONS}
                aria-label="Filter by type"
              />
            </div>
            {permsFiltersActive && (
              <div className="flex justify-end lg:ml-auto">
                <Button variant="ghost" size="sm" onClick={resetPermFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <DataTable
          loading={permsLoading}
          data={perms}
          columns={permissionColumns}
          sortState={permSort}
          onSortChange={handlePermSortChange}
          emptyTitle={permsFiltersActive ? 'No Matching Permissions' : 'No Permissions Yet'}
          emptyMessage={
            permsFiltersActive
              ? 'No permissions match the current search and filters. Adjust or reset the filters to see more.'
              : 'Define the first permission to map it to roles.'
          }
        />

        <Pagination
          currentPage={permsMeta.page}
          totalPages={permsMeta.total_pages}
          onPageChange={setPermsPage}
          totalItems={permsMeta.total}
          pageSize={permsPageSize}
          onPageSizeChange={(n) => {
            setPermsPageSize(n);
            setPermsPage(1);
          }}
        />
      </>
    );
  };

  const renderDetail = () => {
    if (!detailRole) return null;
    return (
      <>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
          <StatusBadge status={detailRole.is_active ? 'active' : 'inactive'} />
          {detailRole.is_system ? (
            <StatusBadge status="system role" variant="gold" />
          ) : (
            <StatusBadge status="custom role" variant="neutral" />
          )}
          <span className="rounded-full border border-[#2A2A2A] bg-[#1D1D1D] px-2.5 py-0.5">
            Portal: <strong className="text-white">{portalLabel(detailRole.portal)}</strong>
          </span>
          <span className="rounded-full border border-[#2A2A2A] bg-[#1D1D1D] px-2.5 py-0.5">
            Users: <strong className="text-white">{detailRole.user_count}</strong>
          </span>
          <span className="rounded-full border border-[#2A2A2A] bg-[#1D1D1D] px-2.5 py-0.5">
            Permissions:{' '}
            <strong className="text-white">
              {implicitAll ? 'All (implicit)' : detailRole.permission_count}
            </strong>
          </span>
          <span className="rounded-full border border-[#2A2A2A] bg-[#1D1D1D] px-2.5 py-0.5 font-mono">
            {detailRole.slug}
          </span>
        </div>

        <div className="flex items-center gap-1 border-b border-[#2A2A2A]">
          {(['permissions', 'users', 'activity'] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDetailTab(tab)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                detailTab === tab
                  ? 'border-[#D4AF37] text-white'
                  : 'border-transparent text-[#A1A1AA] hover:text-white'
              }`}
            >
              {tab === 'permissions' && 'Permission Matrix'}
              {tab === 'users' && `Users (${detailRole.user_count})`}
              {tab === 'activity' && 'Activity'}
            </button>
          ))}
        </div>

        {detailTab === 'permissions' && (
          <div className="space-y-4">
            {detailLoading ? (
              <div className="rounded-xl border border-[#2A2A2A] bg-[#171717]">
                <LoadingState message="Loading permission matrix..." />
              </div>
            ) : detailError ? (
              <ErrorState message={detailError} onRetry={() => activeRole && loadRoleWorkspace(activeRole.id)} />
            ) : (
              <>
                {implicitAll && (
                  <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3 text-xs text-[#DFC067]">
                    The Super Admin role implicitly has every permission — access is enforced in code, so its
                    permission set is read-only.
                  </div>
                )}
                {!implicitAll && detailRole.is_system && !isSuperAdmin && (
                  <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-3 text-xs text-[#F59E0B]">
                    This is a system role. Only a Super Admin can modify its permission set.
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="w-full sm:w-80">
                    <Input
                      type="search"
                      placeholder="Search permissions by name or description…"
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      aria-label="Search permissions in matrix"
                    />
                  </div>
                  <span className="text-xs text-[#A1A1AA]">
                    {implicitAll ? matrix.length : checkedIds.size} of {matrix.length} permission
                    {matrix.length === 1 ? '' : 's'} {implicitAll ? 'granted implicitly' : 'selected'}
                  </span>
                </div>

                {groupedMatrix.map((group) => {
                  const selectedInModule = group.perms.filter((p) => isChecked(p.id)).length;
                  const allSelected = group.perms.length > 0 && selectedInModule === group.perms.length;
                  const someSelected = selectedInModule > 0 && !allSelected;
                  return (
                    <div key={group.module} className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#171717]">
                      <div className="flex items-center justify-between border-b border-[#2A2A2A] bg-[#141414] px-4 py-3">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            disabled={!canEditMatrix}
                            onChange={() => toggleModule(group.perms, !allSelected)}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            aria-label={`Select all ${group.module} permissions`}
                            className="h-4 w-4 cursor-pointer rounded border-[#2A2A2A] bg-[#1D1D1D] accent-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className="text-sm font-semibold text-white">{group.module}</span>
                          <span className="text-xs text-[#A1A1AA]">
                            {group.perms.length} permission{group.perms.length === 1 ? '' : 's'}
                          </span>
                        </label>
                        <span className="text-xs text-[#A1A1AA]">{selectedInModule} selected</span>
                      </div>
                      <ul className="divide-y divide-[#2A2A2A]/80">
                        {group.perms.map((permission) => (
                          <li key={permission.id} className="flex items-start gap-3 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isChecked(permission.id)}
                              disabled={!canEditMatrix}
                              onChange={() => toggleOne(permission.id)}
                              aria-label={`Toggle ${permission.name}`}
                              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#2A2A2A] bg-[#1D1D1D] accent-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-zinc-200">
                                {permission.action.replace(/_/g, ' ')}{' '}
                                <span className="font-mono text-xs text-[#A1A1AA]">{permission.name}</span>
                              </p>
                              {permission.description && (
                                <p className="text-xs text-[#71717A]">{permission.description}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {groupedMatrix.length === 0 && (
                  <div className="rounded-xl border border-[#2A2A2A] bg-[#171717] p-4">
                    <EmptyState
                      title={matrix.length === 0 ? 'No Permissions Defined' : 'No Matching Permissions'}
                      description={
                        matrix.length === 0
                          ? 'Define permissions from the Permissions tab first, then map them here.'
                          : 'No permission matches the current search.'
                      }
                    />
                  </div>
                )}

                {canEditMatrix && (
                  <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#141414]/95 px-4 py-3 backdrop-blur">
                    <span className="text-xs text-[#A1A1AA]">
                      {matrixDirty ? (
                        <>
                          <strong className="text-[#DFC067]">{addedIds.length}</strong> to add,{' '}
                          <strong className="text-[#DFC067]">{removedIds.length}</strong> to remove
                        </>
                      ) : (
                        'No unsaved changes'
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!matrixDirty || matrixSaving}
                        onClick={() => setCheckedIds(new Set(originalIds))}
                      >
                        Discard changes
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={matrixSaving}
                        disabled={!matrixDirty}
                        onClick={saveMatrix}
                      >
                        Save Permissions
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {detailTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full sm:w-80">
                <Input
                  type="search"
                  placeholder="Search users by name or email…"
                  value={roleUsersSearchInput}
                  onChange={(e) => setRoleUsersSearchInput(e.target.value)}
                  aria-label="Search users with this role"
                />
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Role assignment is managed from User Management — reassign users there before deactivating or
                deleting this role.
              </p>
            </div>
            {roleUsersError ? (
              <div className="flex items-center justify-between rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3">
                <span className="text-xs text-[#EF4444]">{roleUsersError}</span>
                <Button variant="ghost" size="sm" onClick={loadRoleUsers}>
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <DataTable
                  loading={roleUsersLoading}
                  data={roleUsers}
                  columns={roleUserColumns}
                  emptyTitle="No Users"
                  emptyMessage="No users currently have this role assigned."
                />
                <Pagination
                  currentPage={roleUsersMeta.page}
                  totalPages={roleUsersMeta.total_pages}
                  onPageChange={setRoleUsersPage}
                  totalItems={roleUsersMeta.total}
                  pageSize={roleUsersMeta.limit || 10}
                />
              </>
            )}
          </div>
        )}

        {detailTab === 'activity' && (
          <div className="space-y-4">
            {activityError ? (
              <div className="flex items-center justify-between rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 px-4 py-3">
                <span className="text-xs text-[#EF4444]">{activityError}</span>
                <Button variant="ghost" size="sm" onClick={loadActivity}>
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <DataTable
                  loading={activityLoading}
                  data={activity}
                  columns={activityColumns}
                  emptyTitle="No Activity"
                  emptyMessage="No audit entries were recorded for this role yet."
                />
                <Pagination
                  currentPage={activityMeta.page}
                  totalPages={activityMeta.total_pages}
                  onPageChange={setActivityPage}
                  totalItems={activityMeta.total}
                  pageSize={activityMeta.limit || 10}
                />
              </>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <PageContainer maxWidth="full">
      {activeRole ? (
        <>
          <PageHeader
            title={detailRole?.name || 'Role'}
            description={detailRole?.description || 'Role details, permission matrix and assigned users'}
            breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions' }, { label: detailRole?.name || 'Role' }]}
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={backToList}>
                  ← Back to Roles
                </Button>
                {detailRole && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => openEditRole(detailRole)}>
                      Edit Role
                    </Button>
                    {!detailRole.is_system &&
                      (detailRole.is_active ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmState({ kind: 'role-status', role: detailRole, nextActive: false })}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setConfirmState({ kind: 'role-status', role: detailRole, nextActive: true })}
                        >
                          Activate
                        </Button>
                      ))}
                    {!detailRole.is_system && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmState({ kind: 'role-delete', role: detailRole })}
                      >
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </>
            }
          />
          {renderDetail()}
        </>
      ) : (
        <>
          <PageHeader
            title="Roles & Permissions"
            description="Authorization foundation — define roles, map permissions and control portal access"
            breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions' }]}
            badge={
              <span className="text-xs text-[#A1A1AA]">
                {activeTab === 'roles'
                  ? `${rolesMeta.total} role${rolesMeta.total === 1 ? '' : 's'}`
                  : `${permsMeta.total} permission${permsMeta.total === 1 ? '' : 's'}`}
              </span>
            }
            actions={
              activeTab === 'roles' ? (
                <Button variant="primary" size="sm" onClick={() => setCreateRoleOpen(true)}>
                  + Add Role
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setCreatePermOpen(true)}>
                  + Add Permission
                </Button>
              )
            }
          />
          {tabsRow}
          {activeTab === 'roles' ? renderRolesList() : renderPermissionsList()}
        </>
      )}

      {/* Create Role */}
      <Modal
        isOpen={createRoleOpen}
        onClose={() => !createRoleLoading && setCreateRoleOpen(false)}
        title="Create Role"
        maxWidth="lg"
      >
        <form onSubmit={submitCreateRole} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Role Name"
              value={createRoleForm.name}
              onChange={(e) => setCreateRoleForm({ ...createRoleForm, name: e.target.value })}
              placeholder="e.g. Finance Manager"
              required
            />
            <Input
              label="Slug (optional)"
              value={createRoleForm.slug}
              onChange={(e) => setCreateRoleForm({ ...createRoleForm, slug: e.target.value })}
              placeholder="e.g. finance_manager"
              helperText="Leave blank to auto-generate from the name. Immutable afterwards."
            />
          </div>
          <Select
            label="Portal"
            value={createRoleForm.portal}
            onChange={(e) =>
              setCreateRoleForm({ ...createRoleForm, portal: e.target.value as PortalValue | '' })
            }
            options={PORTAL_FORM_OPTIONS}
          />
          <p className="text-xs text-[#71717A]">
            The portal decides where users with this role land after login and which navigation they see.
          </p>
          <div className="w-full space-y-1.5 text-left">
            <label
              htmlFor="create-role-description"
              className="block text-xs font-semibold uppercase tracking-wide text-zinc-300"
            >
              Description (optional)
            </label>
            <textarea
              id="create-role-description"
              rows={3}
              value={createRoleForm.description}
              onChange={(e) => setCreateRoleForm({ ...createRoleForm, description: e.target.value })}
              placeholder="What access does this role grant?"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#171717] px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] transition-all focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          {createRoleError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {createRoleError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setCreateRoleOpen(false)}
              disabled={createRoleLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={createRoleLoading}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role */}
      <Modal
        isOpen={!!editRoleTarget}
        onClose={() => !editRoleLoading && setEditRoleTarget(null)}
        title="Edit Role"
        maxWidth="lg"
      >
        <form onSubmit={submitEditRole} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Role Name"
              value={editRoleForm.name}
              onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
              required
            />
            <Input
              label="Slug"
              value={editRoleTarget?.slug || ''}
              disabled
              readOnly
              helperText="The slug is the authorization identity — it cannot be changed."
            />
          </div>
          <Select
            label="Portal"
            value={editRoleForm.portal}
            onChange={(e) =>
              setEditRoleForm({ ...editRoleForm, portal: e.target.value as PortalValue | '' })
            }
            options={PORTAL_FORM_OPTIONS}
            disabled={!!editRoleTarget?.is_system}
          />
          {editRoleTarget?.is_system && (
            <p className="text-xs text-[#71717A]">For system roles the portal mapping is fixed.</p>
          )}
          <div className="w-full space-y-1.5 text-left">
            <label
              htmlFor="edit-role-description"
              className="block text-xs font-semibold uppercase tracking-wide text-zinc-300"
            >
              Description (optional)
            </label>
            <textarea
              id="edit-role-description"
              rows={3}
              value={editRoleForm.description}
              onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#171717] px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] transition-all focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          {editRoleError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {editRoleError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setEditRoleTarget(null)}
              disabled={editRoleLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={editRoleLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Permission */}
      <Modal
        isOpen={createPermOpen}
        onClose={() => !permFormLoading && setCreatePermOpen(false)}
        title="Define New Permission"
        maxWidth="lg"
      >
        <form onSubmit={submitCreatePerm} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Module"
              value={permForm.module}
              onChange={(e) => setPermForm({ ...permForm, module: e.target.value })}
              placeholder="e.g. reports"
              helperText="Lowercase letters, numbers and underscores."
              required
            />
            <Input
              label="Action"
              value={permForm.action}
              onChange={(e) => setPermForm({ ...permForm, action: e.target.value })}
              placeholder="e.g. export"
              helperText="Lowercase letters, numbers and underscores."
              required
            />
          </div>
          <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs text-[#A1A1AA]">
            Permission name:{' '}
            <span className="font-mono text-[#DFC067]">
              {permForm.module.trim().toLowerCase() || 'module'}:{permForm.action.trim().toLowerCase() || 'action'}
            </span>
          </div>
          <Input
            label="Description (optional)"
            value={permForm.description}
            onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
            placeholder="What does this permission allow?"
          />
          {permFormError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {permFormError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setCreatePermOpen(false)}
              disabled={permFormLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={permFormLoading}>
              Create Permission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Permission */}
      <Modal
        isOpen={!!editPermTarget}
        onClose={() => !editPermLoading && setEditPermTarget(null)}
        title="Edit Permission"
        maxWidth="md"
      >
        <form onSubmit={submitEditPerm} className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Permission</p>
            <p className="mt-1.5 font-mono text-sm text-[#DFC067]">{editPermTarget?.name}</p>
          </div>
          <Input
            label="Description"
            value={editPermDescription}
            onChange={(e) => setEditPermDescription(e.target.value)}
            helperText="Module and action are immutable — backend enforcement references them in code."
          />
          {editPermError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {editPermError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setEditPermTarget(null)}
              disabled={editPermLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={editPermLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permission → roles */}
      <Modal
        isOpen={!!rolesModalPerm}
        onClose={() => setRolesModalPerm(null)}
        title="Roles Using This Permission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="font-mono text-xs text-[#DFC067]">{rolesModalPerm?.name}</p>
          {permRoles === null ? (
            <LoadingState message="Loading roles..." />
          ) : permRoles.length === 0 ? (
            <EmptyState title="Not Assigned" description="No role currently uses this permission." />
          ) : (
            <ul className="space-y-2">
              {permRoles.map((role) => (
                <li
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border border-[#2A2A2A] px-3 py-2"
                >
                  <span className="text-sm text-zinc-200">{role.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#A1A1AA]">{role.slug}</span>
                    {role.is_system && <StatusBadge status="system" variant="gold" />}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => setRolesModalPerm(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmState}
        title={confirmCopy?.title || 'Confirm Action'}
        message={confirmCopy?.message || ''}
        confirmText={confirmCopy?.confirmText || 'Confirm'}
        variant={confirmCopy?.variant || 'danger'}
        onConfirm={() => confirmCopy?.onConfirm()}
        onCancel={() => !confirmLoading && setConfirmState(null)}
        loading={confirmLoading}
      />
    </PageContainer>
  );
};

export default RolesPermissions;
