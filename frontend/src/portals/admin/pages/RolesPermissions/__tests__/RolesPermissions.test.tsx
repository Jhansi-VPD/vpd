import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RolesPermissions from '../RolesPermissions';
import type { ApiResponse } from '../../../../../types/common.types';
import type {
  PermissionListItem,
  RoleActivityEntry,
  RoleListItem,
  RoleUserEntry,
} from '../../../../../types/role.types';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showNotification: vi.fn(),
  me: { id: 'u-me', name: 'Mia Admin', email: 'mia@vpd.test', role: 'super_admin' },
  rolesGetAll: vi.fn(),
  rolesGetById: vi.fn(),
  rolesCreate: vi.fn(),
  rolesUpdate: vi.fn(),
  rolesSetStatus: vi.fn(),
  rolesDelete: vi.fn(),
  rolesGetPermissions: vi.fn(),
  rolesSetPermissions: vi.fn(),
  rolesGetUsers: vi.fn(),
  rolesGetActivity: vi.fn(),
  permsGetAll: vi.fn(),
  permsGetModules: vi.fn(),
  permsCreate: vi.fn(),
  permsUpdate: vi.fn(),
  permsSetStatus: vi.fn(),
  permsDelete: vi.fn(),
  permsGetRoles: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/roles-permissions',
}));

vi.mock('../../../../../auth/auth.context', () => ({
  useAuth: () => ({ user: mocks.me, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('../../../../../app/providers/NotificationProvider', () => ({
  useNotifications: () => ({ notifications: [], showNotification: mocks.showNotification, removeNotification: vi.fn() }),
}));

vi.mock('../../../../../api', () => ({
  rolesApi: {
    getAll: mocks.rolesGetAll,
    getById: mocks.rolesGetById,
    create: mocks.rolesCreate,
    update: mocks.rolesUpdate,
    setStatus: mocks.rolesSetStatus,
    delete: mocks.rolesDelete,
    getPermissions: mocks.rolesGetPermissions,
    setPermissions: mocks.rolesSetPermissions,
    getUsers: mocks.rolesGetUsers,
    getActivity: mocks.rolesGetActivity,
  },
  permissionsApi: {
    getAll: mocks.permsGetAll,
    getModules: mocks.permsGetModules,
    create: mocks.permsCreate,
    update: mocks.permsUpdate,
    setStatus: mocks.permsSetStatus,
    delete: mocks.permsDelete,
    getRoles: mocks.permsGetRoles,
  },
}));

const salesReps: RoleListItem = {
  id: 'r-sales',
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  name: 'Sales Reps',
  slug: 'sales_reps',
  description: null,
  is_system: false,
  is_active: true,
  portal: 'sales',
  user_count: 4,
  permission_count: 2,
};

const adminRole: RoleListItem = {
  id: 'r-admin',
  created_at: '2025-11-01T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  name: 'Admin',
  slug: 'admin',
  description: 'Platform administration',
  is_system: true,
  is_active: true,
  portal: 'admin',
  user_count: 1,
  permission_count: 5,
};

const superAdminRole: RoleListItem = {
  id: 'r-super',
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  name: 'Super Admin',
  slug: 'super_admin',
  description: null,
  is_system: true,
  is_active: true,
  portal: 'admin',
  user_count: 1,
  permission_count: 0,
};

const leadsView: PermissionListItem = {
  id: 'p-leads-view',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  name: 'leads:view',
  module: 'leads',
  action: 'view',
  description: 'View leads',
  is_system: true,
  is_active: true,
  role_count: 3,
};

const leadsCreate: PermissionListItem = {
  id: 'p-leads-create',
  created_at: '2026-01-02T10:00:00Z',
  updated_at: '2026-01-02T10:00:00Z',
  name: 'leads:create',
  module: 'leads',
  action: 'create',
  description: null,
  is_system: false,
  is_active: true,
  role_count: 0,
};

const reportsExport: PermissionListItem = {
  id: 'p-export',
  created_at: '2026-01-03T10:00:00Z',
  updated_at: '2026-01-03T10:00:00Z',
  name: 'reports:export',
  module: 'reports',
  action: 'export',
  description: 'Export reports',
  is_system: false,
  is_active: true,
  role_count: 1,
};

const ada: RoleUserEntry = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@vpd.test',
  is_active: true,
  status: 'active',
};

const activityEntry: RoleActivityEntry = {
  id: 'ev-1',
  action: 'ROLE_UPDATED',
  timestamp: '2026-02-02T12:00:00Z',
  actor_id: 'u-me',
  actor_name: 'Mia Admin',
  ip_address: '10.0.0.7',
  metadata: { added: 2, removed: 1 },
};

function apiOk<T>(data: T, meta?: unknown): ApiResponse<T> {
  return { success: true, status_code: 200, data, meta };
}

const metaOf = (total: number, page = 1, limit = 10) => ({
  total,
  page,
  limit,
  total_pages: Math.max(1, Math.ceil(total / limit)),
});

const error = (status: number, message: string) => Object.assign(new Error(message), { status });

/** Counts inside the matrix save bar are wrapped in <strong>, so match the full span text. */
const spanWithText = (expected: string) => (_content: string, el: Element | null) =>
  el?.tagName === 'SPAN' && (el.textContent || '').replace(/\s+/g, ' ').trim() === expected;

const roleRow = (slug: string) => {
  const cell = screen.getByText(slug);
  return cell.closest('tr') as HTMLTableRowElement;
};

const permissionRow = (name: string) => {
  const cell = screen.getByText(name);
  return cell.closest('tr') as HTMLTableRowElement;
};

const openRoleWorkspace = async (slug: string) => {
  fireEvent.click(within(roleRow(slug)).getByRole('button', { name: 'View' }));
  await screen.findByLabelText('Toggle leads:view');
};

const openPermissionsTab = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Permissions' }));
  await screen.findByText('leads:view');
};

const submitButtonForm = (name: string) => {
  const form = screen.getByRole('button', { name }).closest('form');
  if (!form) throw new Error(`No form for submit button "${name}"`);
  return form;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.me.role = 'super_admin';
  mocks.rolesGetAll.mockResolvedValue(apiOk([superAdminRole, adminRole, salesReps], metaOf(3)));
  mocks.rolesGetById.mockResolvedValue(apiOk({ ...salesReps, implicit_all_permissions: false }));
  mocks.rolesCreate.mockResolvedValue(apiOk({ ...salesReps, implicit_all_permissions: false }));
  mocks.rolesUpdate.mockResolvedValue(apiOk({ ...adminRole, name: 'Platform Admin', implicit_all_permissions: false }));
  mocks.rolesSetStatus.mockResolvedValue(apiOk({ ...salesReps, is_active: false, implicit_all_permissions: false }));
  mocks.rolesDelete.mockResolvedValue(apiOk(null));
  mocks.rolesGetPermissions.mockResolvedValue(
    apiOk({ role_id: 'r-sales', role_slug: 'sales_reps', implicit_all_permissions: false, permissions: [leadsView] })
  );
  mocks.rolesSetPermissions.mockResolvedValue(
    apiOk({
      role_id: 'r-sales',
      role_slug: 'sales_reps',
      implicit_all_permissions: false,
      permissions: [leadsView, leadsCreate],
    })
  );
  mocks.rolesGetUsers.mockResolvedValue(apiOk([ada], metaOf(1)));
  mocks.rolesGetActivity.mockResolvedValue(apiOk([activityEntry], metaOf(1)));
  mocks.permsGetAll.mockResolvedValue(apiOk([leadsView, leadsCreate, reportsExport], metaOf(3, 1, 100)));
  mocks.permsGetModules.mockResolvedValue(
    apiOk([
      { module: 'leads', permission_count: 2 },
      { module: 'reports', permission_count: 1 },
    ])
  );
  mocks.permsCreate.mockResolvedValue(apiOk({ ...reportsExport }));
  mocks.permsUpdate.mockResolvedValue(apiOk({ ...reportsExport, description: '' }));
  mocks.permsSetStatus.mockResolvedValue(apiOk({ ...reportsExport, is_active: false }));
  mocks.permsDelete.mockResolvedValue(apiOk(null));
  mocks.permsGetRoles.mockResolvedValue(apiOk([{ id: 'r-admin', name: 'Admin', slug: 'admin', is_system: true }]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('roles list', () => {
  it('renders roles with count badge, default sort, and the implicit super-admin count', async () => {
    render(<RolesPermissions />);

    expect(await screen.findByText('Sales Reps')).toBeInTheDocument();
    expect(screen.getByText('sales_reps')).toBeInTheDocument();
    expect(screen.getByText('3 roles')).toBeInTheDocument();
    expect(screen.getByText('All (implicit)')).toBeInTheDocument();
    expect(screen.getByText('Created').closest('th')!.getAttribute('aria-sort')).toBe('descending');
    expect(mocks.rolesGetAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, sort: '-created_at' })
    );
  });

  it('shows an access-denied state on 403 and recovers on retry', async () => {
    mocks.rolesGetAll.mockRejectedValueOnce(error(403, 'Missing permission: roles:read'));
    render(<RolesPermissions />);

    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to view roles. Ask a Super Admin to grant you the roles:read permission.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByText('Sales Reps')).toBeInTheDocument();
  });

  it('applies the portal filter and resets all filters', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.change(screen.getByLabelText('Filter by portal'), { target: { value: 'sales' } });
    await waitFor(() =>
      expect(mocks.rolesGetAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ portal: 'sales', page: 1 })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => {
      const lastCall = mocks.rolesGetAll.mock.calls[mocks.rolesGetAll.mock.calls.length - 1][0];
      expect(lastCall.portal).toBeUndefined();
      expect(lastCall.page).toBe(1);
    });
  });

  it('sorts by user count when the Users header is clicked', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    const usersTh = screen.getByText('Users').closest('th')!;
    expect(usersTh.getAttribute('aria-sort')).toBeNull();

    fireEvent.click(usersTh);
    await waitFor(() =>
      expect(mocks.rolesGetAll).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'user_count' }))
    );
    expect(screen.getByText('Users').closest('th')!.getAttribute('aria-sort')).toBe('ascending');
  });

  it('debounces the role search into a single settled query', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.change(screen.getByLabelText('Search roles'), { target: { value: 'sales' } });
    await waitFor(
      () =>
        expect(mocks.rolesGetAll).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'sales', page: 1 })
        ),
      { timeout: 3000 }
    );
  });
});

describe('role lifecycle', () => {
  it('validates the create-role form and submits a cleaned payload', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(screen.getByRole('button', { name: '+ Add Role' }));
    expect(screen.getByRole('heading', { name: 'Create Role' })).toBeInTheDocument();

    fireEvent.submit(submitButtonForm('Create Role'));
    expect(screen.getByRole('alert')).toHaveTextContent('Role name is required.');

    fireEvent.change(screen.getByLabelText('Role Name'), { target: { value: 'Sales Reps' } });
    fireEvent.change(screen.getByLabelText('Slug (optional)'), { target: { value: 'Bad Slug' } });
    fireEvent.submit(submitButtonForm('Create Role'));
    expect(screen.getByRole('alert')).toHaveTextContent('Slug must start with a lowercase letter');

    fireEvent.change(screen.getByLabelText('Slug (optional)'), { target: { value: 'sales_reps' } });
    fireEvent.submit(submitButtonForm('Create Role'));
    expect(screen.getByRole('alert')).toHaveTextContent('Select the portal this role should land in.');

    fireEvent.change(screen.getByLabelText('Portal'), { target: { value: 'sales' } });
    fireEvent.submit(submitButtonForm('Create Role'));
    await waitFor(() =>
      expect(mocks.rolesCreate).toHaveBeenCalledWith({
        name: 'Sales Reps',
        slug: 'sales_reps',
        description: undefined,
        portal: 'sales',
      })
    );
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Role created successfully.')
    );
    expect(screen.queryByRole('heading', { name: 'Create Role' })).toBeNull();
  });

  it('disables the portal select and sends only changed fields when editing a system role', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('admin')).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('heading', { name: 'Edit Role' })).toBeInTheDocument();
    expect(screen.getByText('For system roles the portal mapping is fixed.')).toBeInTheDocument();
    expect(screen.getByLabelText('Portal')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Role Name'), { target: { value: 'Platform Admin' } });
    fireEvent.submit(submitButtonForm('Save Changes'));
    await waitFor(() =>
      expect(mocks.rolesUpdate).toHaveBeenCalledWith('r-admin', { name: 'Platform Admin' })
    );
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Role updated successfully.')
    );
  });

  it('deactivates a custom role after confirmation', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('Deactivate "Sales Reps"?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Role' }));
    await waitFor(() => expect(mocks.rolesSetStatus).toHaveBeenCalledWith('r-sales', false));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Role deactivated.')
    );
    await waitFor(() => expect(screen.queryByText('Deactivate "Sales Reps"?')).toBeNull());
  });

  it('surfaces the backend conflict when a role with users cannot be deactivated', async () => {
    mocks.rolesSetStatus.mockRejectedValue(
      error(409, 'Cannot deactivate this role: 4 user(s) still have it assigned. Reassign them first.')
    );
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'Deactivate' }));
    await screen.findByText('Deactivate "Sales Reps"?');
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Role' }));

    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'error',
        'Cannot deactivate this role: 4 user(s) still have it assigned. Reassign them first.'
      )
    );
  });

  it('deletes a custom role after confirmation and protects system roles from row actions', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    const adminRow = roleRow('admin');
    expect(within(adminRow).queryByRole('button', { name: 'Deactivate' })).toBeNull();
    expect(within(adminRow).queryByRole('button', { name: 'Delete' })).toBeNull();

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete "Sales Reps"?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Role' }));
    await waitFor(() => expect(mocks.rolesDelete).toHaveBeenCalledWith('r-sales'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Role "Sales Reps" deleted.')
    );
  });
});

describe('permission matrix', () => {
  it('opens the matrix, reflects assignment state, and saves a toggle', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'View' }));
    expect(await screen.findByLabelText('Toggle leads:view')).toBeChecked();
    expect(screen.getByLabelText('Toggle leads:create')).not.toBeChecked();
    expect(screen.getByText('1 of 3 permissions selected')).toBeInTheDocument();
    expect(mocks.rolesGetById).toHaveBeenCalledWith('r-sales');
    expect(mocks.rolesGetPermissions).toHaveBeenCalledWith('r-sales');
    expect(mocks.permsGetAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 100, status: 'active', sort: 'module,action' })
    );

    fireEvent.click(screen.getByLabelText('Toggle leads:create'));
    expect(screen.getByText('2 of 3 permissions selected')).toBeInTheDocument();
    expect(screen.getByText(spanWithText('1 to add, 0 to remove'))).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Save Permissions' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(mocks.rolesSetPermissions).toHaveBeenCalledWith(
        'r-sales',
        expect.arrayContaining(['p-leads-view', 'p-leads-create'])
      )
    );
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Role permissions updated.')
    );
    await waitFor(() => expect(mocks.rolesGetById.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('discards unsaved matrix changes', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openRoleWorkspace('sales_reps');

    fireEvent.click(screen.getByLabelText('Toggle leads:create'));
    expect(screen.getByText(spanWithText('1 to add, 0 to remove'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Permissions' })).toBeDisabled();
    expect(screen.getByLabelText('Toggle leads:create')).not.toBeChecked();
  });

  it('renders the super-admin matrix as read-only implicit access', async () => {
    mocks.rolesGetById.mockResolvedValue(apiOk({ ...superAdminRole, implicit_all_permissions: true }));
    mocks.rolesGetPermissions.mockResolvedValue(
      apiOk({ role_id: 'r-super', role_slug: 'super_admin', implicit_all_permissions: true, permissions: [] })
    );
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openRoleWorkspace('super_admin');

    expect(screen.getByText(/implicitly has every permission/)).toBeInTheDocument();
    expect(screen.getByText('3 of 3 permissions granted implicitly')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle leads:view')).toBeChecked();
    expect(screen.getByLabelText('Toggle leads:view')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Permissions' })).toBeNull();
  });

  it('tells non-super-admins that system-role permissions need a super admin', async () => {
    mocks.me.role = 'admin';
    mocks.rolesGetById.mockResolvedValue(apiOk({ ...adminRole, implicit_all_permissions: false }));
    mocks.rolesGetPermissions.mockResolvedValue(
      apiOk({ role_id: 'r-admin', role_slug: 'admin', implicit_all_permissions: false, permissions: [leadsView] })
    );
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openRoleWorkspace('admin');

    expect(screen.getByText(/Only a Super Admin can modify its permission set/)).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle leads:view')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Permissions' })).toBeNull();
  });

  it('reloads the workspace when a matrix save is rejected with a 409', async () => {
    mocks.rolesSetPermissions.mockRejectedValue(
      error(409, 'Unknown, inactive, or deleted permission ids: p-ghost')
    );
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openRoleWorkspace('sales_reps');

    fireEvent.click(screen.getByLabelText('Toggle leads:create'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Permissions' }));

    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'error',
        'Unknown, inactive, or deleted permission ids: p-ghost'
      )
    );
    await waitFor(() => expect(mocks.rolesGetById).toHaveBeenCalledTimes(2));
  });
});

describe('permissions tab', () => {
  it('lists permissions with module filter options', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(screen.getByRole('button', { name: 'Permissions' }));
    expect(await screen.findByText('leads:view')).toBeInTheDocument();
    expect(screen.getByText('reports:export')).toBeInTheDocument();
    expect(screen.getByText('3 permissions')).toBeInTheDocument();
    expect(mocks.permsGetAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));

    await waitFor(() => expect(screen.getByRole('option', { name: 'leads (2)' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'reports (1)' })).toBeInTheDocument();
  });

  it('validates and creates a permission with lowercased codes', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openPermissionsTab();

    fireEvent.click(screen.getByRole('button', { name: '+ Add Permission' }));
    expect(screen.getByRole('heading', { name: 'Define New Permission' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Module'), { target: { value: 'bad module' } });
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'export' } });
    fireEvent.submit(submitButtonForm('Create Permission'));
    expect(screen.getByRole('alert')).toHaveTextContent('Module must start with a lowercase letter');

    fireEvent.change(screen.getByLabelText('Module'), { target: { value: 'audits' } });
    expect(screen.getByText('audits:export')).toBeInTheDocument();

    fireEvent.submit(submitButtonForm('Create Permission'));
    await waitFor(() =>
      expect(mocks.permsCreate).toHaveBeenCalledWith({
        module: 'audits',
        action: 'export',
        description: undefined,
      })
    );
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Permission created successfully.')
    );
  });

  it('edits a permission description and clears it when emptied', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openPermissionsTab();

    fireEvent.click(within(permissionRow('reports:export')).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('heading', { name: 'Edit Permission' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('Export reports');

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '' } });
    fireEvent.submit(submitButtonForm('Save Changes'));
    await waitFor(() => expect(mocks.permsUpdate).toHaveBeenCalledWith('p-export', { description: '' }));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Permission updated successfully.')
    );
  });

  it('shows the roles using a permission and hides destructive actions on system permissions', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openPermissionsTab();

    const systemRow = permissionRow('leads:view');
    expect(within(systemRow).queryByRole('button', { name: 'Deactivate' })).toBeNull();
    expect(within(systemRow).queryByRole('button', { name: 'Delete' })).toBeNull();

    fireEvent.click(within(systemRow).getByRole('button', { name: 'Roles' }));
    await waitFor(() => expect(mocks.permsGetRoles).toHaveBeenCalledWith('p-leads-view'));
    expect(await screen.findByRole('heading', { name: 'Roles Using This Permission' })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('deactivates and deletes a custom permission after confirmation', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');
    await openPermissionsTab();

    const customRow = permissionRow('reports:export');
    fireEvent.click(within(customRow).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('Deactivate "reports:export"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Permission' }));
    await waitFor(() => expect(mocks.permsSetStatus).toHaveBeenCalledWith('p-export', false));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Permission deactivated.')
    );

    fireEvent.click(within(permissionRow('reports:export')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete "reports:export"?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permission' }));
    await waitFor(() => expect(mocks.permsDelete).toHaveBeenCalledWith('p-export'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Permission "reports:export" deleted.')
    );
  });
});

describe('role detail sub-tabs', () => {
  it('lists users with the role and navigates to the user detail', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'View' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Users (4)' }));

    await waitFor(() =>
      expect(mocks.rolesGetUsers).toHaveBeenCalledWith('r-sales', expect.objectContaining({ page: 1, limit: 10 }))
    );
    const userRow = (await screen.findByText('Ada Lovelace')).closest('tr')!;
    fireEvent.click(within(userRow).getByRole('button', { name: 'View' }));
    expect(mocks.push).toHaveBeenCalledWith('/admin/users/u-ada');
  });

  it('shows the audit activity feed for a role', async () => {
    render(<RolesPermissions />);
    await screen.findByText('Sales Reps');

    fireEvent.click(within(roleRow('sales_reps')).getByRole('button', { name: 'View' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Activity' }));

    await waitFor(() =>
      expect(mocks.rolesGetActivity).toHaveBeenCalledWith('r-sales', { page: 1, limit: 10 })
    );
    expect(await screen.findByText('ROLE_UPDATED')).toBeInTheDocument();
    expect(screen.getByText('Mia Admin')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.7')).toBeInTheDocument();
    expect(screen.getByText('added, removed')).toBeInTheDocument();
  });
});
