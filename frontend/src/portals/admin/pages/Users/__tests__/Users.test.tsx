import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Users from '../Users';
import type { ApiResponse } from '../../../../../types/common.types';
import type { UserListItem } from '../../../../../types/user.types';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showNotification: vi.fn(),
  me: { id: 'u-me', name: 'Mia Admin', email: 'mia@vpd.test', role: 'super_admin' },
  getAll: vi.fn(),
  create: vi.fn(),
  deactivate: vi.fn(),
  activate: vi.fn(),
  suspend: vi.fn(),
  restore: vi.fn(),
  unlock: vi.fn(),
  bulkAction: vi.fn(),
  exportCsv: vi.fn(),
  departmentsGetAll: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/users',
}));

vi.mock('../../../../../auth/auth.context', () => ({
  useAuth: () => ({ user: mocks.me, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('../../../../../app/providers/NotificationProvider', () => ({
  useNotifications: () => ({ notifications: [], showNotification: mocks.showNotification, removeNotification: vi.fn() }),
}));

vi.mock('../../../../../api', () => ({
  usersApi: {
    getAll: mocks.getAll,
    create: mocks.create,
    deactivate: mocks.deactivate,
    activate: mocks.activate,
    suspend: mocks.suspend,
    restore: mocks.restore,
    unlock: mocks.unlock,
    bulkAction: mocks.bulkAction,
    exportCsv: mocks.exportCsv,
  },
  departmentsApi: { getAll: mocks.departmentsGetAll },
}));

const grace: UserListItem = {
  id: 'u-grace',
  created_at: '2026-01-05T09:00:00Z',
  updated_at: '2026-02-01T09:00:00Z',
  name: 'Grace Hopper',
  email: 'grace@vpd.test',
  phone: null,
  avatar: null,
  role: 'developer',
  is_active: true,
  is_email_verified: true,
  last_login_at: '2026-02-09T08:00:00Z',
  status: 'active',
  employee_code: 'EMP-AAAA1111',
  department_name: 'Engineering',
  designation: 'Senior Engineer',
};

const kai: UserListItem = {
  id: 'u-kai',
  created_at: '2026-01-08T09:00:00Z',
  updated_at: '2026-01-20T09:00:00Z',
  name: 'Kai Tanaka',
  email: 'kai@vpd.test',
  phone: '+1 555 0111',
  avatar: null,
  role: 'qa',
  is_active: false,
  is_email_verified: true,
  last_login_at: null,
  status: 'inactive',
  employee_code: null,
  department_name: null,
  designation: null,
};

const rootPersona: UserListItem = {
  id: 'u-root',
  created_at: '2025-12-01T09:00:00Z',
  updated_at: '2026-01-01T09:00:00Z',
  name: 'Root Persona',
  email: 'root@vpd.test',
  phone: null,
  avatar: null,
  role: 'admin',
  is_active: true,
  is_email_verified: true,
  last_login_at: null,
  status: 'active',
  employee_code: null,
  department_name: null,
  designation: null,
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

/** Pagination renders counts inside <strong> children, so match on the full span text. */
const spanWithText = (expected: string) => (_content: string, el: Element | null) =>
  el?.tagName === 'SPAN' && (el.textContent || '').replace(/\s+/g, ' ').trim() === expected;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.me.id = 'u-me';
  mocks.me.role = 'super_admin';
  mocks.getAll.mockResolvedValue(apiOk([grace, kai], metaOf(2)));
  mocks.departmentsGetAll.mockResolvedValue(apiOk([{ id: 'd-1', name: 'Engineering' }]));
  mocks.create.mockResolvedValue(apiOk({ ...grace, invite_sent: true }));
  mocks.deactivate.mockResolvedValue(apiOk({ ...grace, status: 'inactive' }));
  mocks.activate.mockResolvedValue(apiOk({ ...kai, status: 'active' }));
  mocks.suspend.mockResolvedValue(apiOk({ ...grace, status: 'suspended' }));
  mocks.restore.mockResolvedValue(apiOk({ ...kai, status: 'active' }));
  mocks.unlock.mockResolvedValue(apiOk({ ...grace, status: 'active' }));
  mocks.bulkAction.mockResolvedValue(apiOk({ action: 'deactivate', total: 1, succeeded: ['u-grace'], failed: [] }));
});

afterEach(() => {
  delete (URL as any).createObjectURL;
  delete (URL as any).revokeObjectURL;
  vi.restoreAllMocks();
});

describe('Users list page', () => {
  it('renders the user list with rows, count badge, and working row navigation', async () => {
    render(<Users />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Workforce Users' })).toBeInTheDocument();
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('grace@vpd.test')).toBeInTheDocument();
    expect(screen.getByText('Kai Tanaka')).toBeInTheDocument();
    expect(screen.getByText('2 accounts')).toBeInTheDocument();
    expect(mocks.getAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10, sort: '-created_at' }));

    const graceRow = screen.getByText('Grace Hopper').closest('tr') as HTMLElement;
    fireEvent.click(within(graceRow).getByRole('button', { name: 'View' }));
    expect(mocks.push).toHaveBeenCalledWith('/admin/users/u-grace');
  });

  it('shows the loading state while the list is being fetched', () => {
    mocks.getAll.mockReturnValue(new Promise(() => {}));
    mocks.departmentsGetAll.mockReturnValue(new Promise(() => {}));
    render(<Users />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('shows a 403 error state and recovers on retry', async () => {
    mocks.getAll.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }));
    render(<Users />);

    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to manage users. This module is restricted to Admin and HR roles.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
  });

  it('debounces search and resets to page 1', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');
    expect(mocks.getAll).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'grace' } });
    expect(mocks.getAll).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'grace', page: 1 }));
  });

  it('applies role and status filters and resets them', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');

    fireEvent.change(screen.getByLabelText('Filter by role'), { target: { value: 'qa' } });
    await waitFor(() => expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'qa', page: 1 })));

    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'inactive' } });
    await waitFor(() =>
      expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'qa', status: 'inactive', page: 1 }))
    );

    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));
    await waitFor(() =>
      expect(mocks.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: undefined, status: undefined, page: 1 })
      )
    );
    expect(screen.queryByRole('button', { name: /reset filters/i })).not.toBeInTheDocument();
  });

  it('paginates server-side and changes the page size', async () => {
    mocks.getAll.mockImplementation(async (params: any) => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      return apiOk([grace, kai], metaOf(25, page, limit));
    });
    render(<Users />);
    await screen.findByText('Grace Hopper');

    expect(screen.getByText(spanWithText('Showing 1–10 of 25 · Page 1 of 3'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 10 })));
    expect(await screen.findByText(spanWithText('Showing 11–20 of 25 · Page 2 of 3'))).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/rows per page/i), { target: { value: '20' } });
    await waitFor(() => expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, limit: 20 })));
    expect(await screen.findByText(spanWithText('Showing 1–20 of 25 · Page 1 of 2'))).toBeInTheDocument();
  });

  it('sorts by a column header', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');

    fireEvent.click(screen.getByText(/^Name/));
    await waitFor(() => expect(mocks.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'name', page: 1 })));
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('shows the empty state when no users exist', async () => {
    mocks.getAll.mockResolvedValue(apiOk([], metaOf(0)));
    render(<Users />);

    expect(await screen.findByText('No Users Yet')).toBeInTheDocument();
    expect(screen.getByText('0 accounts')).toBeInTheDocument();
  });

  it('validates the create form and password rules without calling the API', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    expect(await screen.findByText('Add Workforce Account')).toBeInTheDocument();
    const form = screen.getByRole('button', { name: /create account/i }).closest('form') as HTMLFormElement;

    fireEvent.submit(form);
    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Person' } });
    fireEvent.submit(form);
    expect(await screen.findByText('A valid email address is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.submit(form);
    expect(await screen.findByText('A valid email address is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new.person@vpd.test' } });
    fireEvent.click(screen.getByLabelText(/set an initial password/i));
    const passwordInput = await screen.findByLabelText('Initial Password');
    fireEvent.change(passwordInput, { target: { value: 'abc' } });
    fireEvent.submit(form);
    expect(await screen.findByText('Password must be between 6 and 128 characters.')).toBeInTheDocument();

    fireEvent.change(passwordInput, { target: { value: 'alllower1!' } });
    fireEvent.submit(form);
    expect(await screen.findByText('Password must contain at least one uppercase letter.')).toBeInTheDocument();

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a user in invite mode and closes the modal on success', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    fireEvent.change(await screen.findByLabelText('Full Name'), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new.person@vpd.test' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Person', email: 'new.person@vpd.test', role: 'employee' })
    );
    expect(mocks.create.mock.calls[0][0].password).toBeUndefined();

    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        'User created — an invite email with a password setup link was sent to new.person@vpd.test.'
      )
    );
    await waitFor(() => expect(screen.queryByText('Add Workforce Account')).not.toBeInTheDocument());
  });

  it('warns when the invite email could not be sent', async () => {
    mocks.create.mockResolvedValue(apiOk({ ...grace, invite_sent: false }));
    render(<Users />);
    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    fireEvent.change(await screen.findByLabelText('Full Name'), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new.person@vpd.test' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form') as HTMLFormElement);

    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('warning', expect.stringContaining('email service not configured'))
    );
  });

  it('hides privileged roles and unmanageable row actions for an HR admin', async () => {
    mocks.me.role = 'hr';
    mocks.getAll.mockResolvedValue(apiOk([grace, rootPersona], metaOf(2)));
    render(<Users />);
    await screen.findByText('Root Persona');

    const adminRow = screen.getByText('Root Persona').closest('tr') as HTMLElement;
    expect(within(adminRow).queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(within(adminRow).queryByRole('button', { name: 'Suspend' })).not.toBeInTheDocument();

    const graceRow = screen.getByText('Grace Hopper').closest('tr') as HTMLElement;
    expect(within(graceRow).getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    const roleSelect = await screen.findByLabelText('Role');
    expect(within(roleSelect).queryByRole('option', { name: 'Super Admin' })).not.toBeInTheDocument();
    expect(within(roleSelect).queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
    expect(within(roleSelect).getByRole('option', { name: 'Employee' })).toBeInTheDocument();
  });

  it('deactivates a user after an explicit confirmation', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');

    const graceRow = screen.getByText('Grace Hopper').closest('tr') as HTMLElement;
    fireEvent.click(within(graceRow).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('Deactivate Grace Hopper?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate User' }));
    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith('u-grace'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Grace Hopper has been deactivated.')
    );
  });

  it('activates an inactive user after an explicit confirmation', async () => {
    render(<Users />);
    await screen.findByText('Kai Tanaka');

    const kaiRow = screen.getByText('Kai Tanaka').closest('tr') as HTMLElement;
    fireEvent.click(within(kaiRow).getByRole('button', { name: 'Activate' }));
    expect(await screen.findByText('Activate Kai Tanaka?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Activate User' }));
    await waitFor(() => expect(mocks.activate).toHaveBeenCalledWith('u-kai'));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Kai Tanaka has been activated.'));
  });

  it('runs a bulk action from the selection toolbar with confirmation', async () => {
    render(<Users />);
    await screen.findByText('Grace Hopper');

    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]);
    const toolbar = screen.getByText('1 user selected').closest('div') as HTMLElement;
    fireEvent.click(within(toolbar).getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByText('Deactivate 1 selected user?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate 1 User' }));

    await waitFor(() => expect(mocks.bulkAction).toHaveBeenCalledWith('deactivate', ['u-grace']));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', '1 user deactivated.'));
    await waitFor(() => expect(screen.queryByText('1 user selected')).not.toBeInTheDocument());
  });

  it('exports the CSV matching the current filters', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-users');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const csvBlob = new Blob(['id,name\n1,Grace'], { type: 'text/csv' });
    mocks.exportCsv.mockResolvedValue({
      ok: true,
      blob: async () => csvBlob,
      headers: { get: () => 'attachment; filename="vpd-users.csv"' },
    });

    render(<Users />);
    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => expect(mocks.exportCsv).toHaveBeenCalledWith(expect.objectContaining({ sort: '-created_at' })));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(csvBlob));
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-users');
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        'CSV export downloaded — it matches the current filters.'
      )
    );
  });

  it('keeps the responsive layout classes for narrow viewports', async () => {
    const { container } = render(<Users />);
    await screen.findByText('Grace Hopper');

    expect(container.querySelector('.lg\\:flex-row')).not.toBeNull();
    expect(container.querySelectorAll('.overflow-x-auto').length).toBeGreaterThan(0);
  });
});
