import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UserDetailPage from '../UserDetail';
import type { ApiResponse } from '../../../../../types/common.types';
import type {
  LoginHistoryEntry,
  PermissionInfo,
  UserActivityEntry,
  UserDetail as UserDetailData,
  UserRolesInfo,
  UserSessionInfo,
} from '../../../../../types/user.types';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showNotification: vi.fn(),
  me: { id: 'u-me', name: 'Mia Admin', email: 'mia@vpd.test', role: 'super_admin' },
  getById: vi.fn(),
  update: vi.fn(),
  deleteUser: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
  suspend: vi.fn(),
  restore: vi.fn(),
  lock: vi.fn(),
  unlock: vi.fn(),
  forcePasswordReset: vi.fn(),
  revokeSessions: vi.fn(),
  revokeSession: vi.fn(),
  updateRoles: vi.fn(),
  getRoles: vi.fn(),
  getPermissions: vi.fn(),
  getSessions: vi.fn(),
  getLoginHistory: vi.fn(),
  getActivity: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/users/u-ada',
}));

vi.mock('../../../../../auth/auth.context', () => ({
  useAuth: () => ({ user: mocks.me, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('../../../../../app/providers/NotificationProvider', () => ({
  useNotifications: () => ({ notifications: [], showNotification: mocks.showNotification, removeNotification: vi.fn() }),
}));

vi.mock('../../../../../api', () => ({
  usersApi: {
    getById: mocks.getById,
    update: mocks.update,
    delete: mocks.deleteUser,
    activate: mocks.activate,
    deactivate: mocks.deactivate,
    suspend: mocks.suspend,
    restore: mocks.restore,
    lock: mocks.lock,
    unlock: mocks.unlock,
    forcePasswordReset: mocks.forcePasswordReset,
    revokeSessions: mocks.revokeSessions,
    revokeSession: mocks.revokeSession,
    updateRoles: mocks.updateRoles,
    getRoles: mocks.getRoles,
    getPermissions: mocks.getPermissions,
    getSessions: mocks.getSessions,
    getLoginHistory: mocks.getLoginHistory,
    getActivity: mocks.getActivity,
  },
}));

function apiOk<T>(data: T, meta?: unknown): ApiResponse<T> {
  return { success: true, status_code: 200, data, meta };
}

const metaOf = (total: number, page = 1, limit = 20) => ({
  total,
  page,
  limit,
  total_pages: Math.max(1, Math.ceil(total / limit)),
});

const adaDetail: UserDetailData = {
  id: 'u-ada',
  created_at: '2026-01-02T10:00:00Z',
  updated_at: '2026-02-10T10:00:00Z',
  name: 'Ada Lovelace',
  email: 'ada@vpd.test',
  phone: '+1 555 0100',
  avatar: null,
  role: 'employee',
  is_active: true,
  is_email_verified: true,
  last_login_at: '2026-02-10T07:30:00Z',
  status: 'active',
  employee_code: 'EMP-AAAA1111',
  department_name: 'Engineering',
  designation: 'Senior Engineer',
  is_locked: false,
  locked_until: null,
  failed_login_attempts: 0,
  suspended_at: null,
  email_verified_at: '2026-01-03T10:00:00Z',
  password_changed_at: '2026-01-02T10:00:00Z',
  mfa_enabled: false,
  employee_profile: {
    employee_code: 'EMP-AAAA1111',
    designation: 'Senior Engineer',
    date_of_joining: '2026-01-02T00:00:00Z',
    department_id: 'd-1',
    department_name: 'Engineering',
  },
};

const adminPersona: UserDetailData = {
  ...adaDetail,
  id: 'u-priya',
  name: 'Priya Admin',
  email: 'priya@vpd.test',
  role: 'admin',
  employee_code: null,
  department_name: null,
  designation: null,
  employee_profile: null,
};

const inactiveAda: UserDetailData = { ...adaDetail, status: 'inactive', is_active: false };
const lockedAda: UserDetailData = { ...adaDetail, status: 'locked', is_locked: true };

const sessionEntry: UserSessionInfo = {
  id: 's-1',
  created_at: '2026-02-10T07:30:00Z',
  last_used_at: '2026-02-11T06:00:00Z',
  expires_at: '2026-03-12T07:30:00Z',
  revoked_at: null,
  ip_address: '203.0.113.7',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
  is_current: false,
};

const historyEntry: LoginHistoryEntry = {
  id: 'lh-1',
  event: 'login',
  timestamp: '2026-02-10T07:30:00Z',
  status: 'active',
  success: true,
  ip_address: '198.51.100.9',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
};

const activityEntry: UserActivityEntry = {
  id: 'a-1',
  action: 'USER_UPDATED',
  timestamp: '2026-02-10T09:00:00Z',
  actor_id: 'u-me',
  actor_name: 'Mia Admin',
  ip_address: '203.0.113.7',
  metadata: { fields: 'name' },
};

const permissionEntry: PermissionInfo = {
  id: 'p-1',
  created_at: '2025-12-01T00:00:00Z',
  updated_at: '2025-12-01T00:00:00Z',
  name: 'users.read',
  module: 'users',
  action: 'read',
  description: 'View user accounts',
};

const rolesInfo: UserRolesInfo = {
  current: 'employee',
  available: ['employee', 'hr', 'developer'],
};

function error(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

const openTab = async (name: string) => {
  fireEvent.click(screen.getByRole('tab', { name }));
  await screen.findByRole('tabpanel', { name });
};

const clickLast = (name: string) => {
  const buttons = screen.getAllByRole('button', { name });
  fireEvent.click(buttons[buttons.length - 1]);
};

const openEditModal = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
  await screen.findByRole('button', { name: 'Save Changes' });
};

const submitEditForm = () => {
  fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form') as HTMLFormElement);
};

/** Pagination renders counts inside <strong> children, so match on the full span text. */
const spanWithText = (expected: string) => (_content: string, el: Element | null) =>
  el?.tagName === 'SPAN' && (el.textContent || '').replace(/\s+/g, ' ').trim() === expected;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.me.id = 'u-me';
  mocks.me.role = 'super_admin';
  mocks.getById.mockResolvedValue(apiOk(adaDetail));
  mocks.update.mockResolvedValue(apiOk(adaDetail));
  mocks.deleteUser.mockResolvedValue(apiOk(null));
  mocks.activate.mockResolvedValue(apiOk({ ...adaDetail, status: 'active' }));
  mocks.deactivate.mockResolvedValue(apiOk(inactiveAda));
  mocks.suspend.mockResolvedValue(apiOk({ ...adaDetail, status: 'suspended' }));
  mocks.restore.mockResolvedValue(apiOk(adaDetail));
  mocks.lock.mockResolvedValue(apiOk(lockedAda));
  mocks.unlock.mockResolvedValue(apiOk(adaDetail));
  mocks.forcePasswordReset.mockResolvedValue(apiOk({ email_sent: true }));
  mocks.revokeSessions.mockResolvedValue(apiOk({ revoked: 1 }));
  mocks.revokeSession.mockResolvedValue(apiOk({ revoked: true }));
  mocks.updateRoles.mockResolvedValue(apiOk({ ...adaDetail, role: 'hr' }));
  mocks.getRoles.mockResolvedValue(apiOk(rolesInfo));
  mocks.getPermissions.mockResolvedValue(apiOk({ role: 'employee', source: 'role', permissions: [permissionEntry] }));
  mocks.getSessions.mockResolvedValue(apiOk([sessionEntry]));
  mocks.getLoginHistory.mockResolvedValue(apiOk([historyEntry]));
  mocks.getActivity.mockResolvedValue(apiOk([activityEntry], metaOf(1, 1, 20)));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('User detail page', () => {
  it('renders the profile with identity, organization, and account data', async () => {
    render(<UserDetailPage userId="u-ada" />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(mocks.getById).toHaveBeenCalledWith('u-ada');
    expect(screen.getAllByText('ada@vpd.test')).toHaveLength(2);
    expect(screen.getAllByText('EMP-AAAA1111')).toHaveLength(2);
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument();
    expect(screen.getByText('Status explanation: Sign-in enabled.')).toBeInTheDocument();
    expect(screen.queryByText('This is you')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Read-only view/)).not.toBeInTheDocument();
  });

  it('shows the loading state while the profile is being fetched', () => {
    mocks.getById.mockReturnValue(new Promise(() => {}));
    render(<UserDetailPage userId="u-ada" />);
    expect(screen.getByText('Loading user profile…')).toBeInTheDocument();
  });

  it('handles a 404 and recovers on retry', async () => {
    mocks.getById.mockRejectedValueOnce(error(404, 'Not Found'));
    render(<UserDetailPage userId="u-ada" />);
    expect(await screen.findByText('User Not Found')).toBeInTheDocument();
    expect(screen.getByText('This user does not exist or may have been removed.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('shows a 403 access denied state', async () => {
    mocks.getById.mockRejectedValueOnce(error(403, 'Forbidden'));
    render(<UserDetailPage userId="u-ada" />);
    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have permission to view user accounts. This module is restricted to Admin and HR roles.')
    ).toBeInTheDocument();
  });

  it('validates the edit form and reports when there are no changes', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openEditModal();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: '' } });
    submitEditForm();
    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    submitEditForm();
    expect(await screen.findByText('A valid email address is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@vpd.test' } });
    submitEditForm();
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('info', 'No changes to save.'));
    expect(mocks.update).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument());
  });

  it('saves a profile name change with only the changed fields', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openEditModal();
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Ada L.' } });
    submitEditForm();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('u-ada', { name: 'Ada L.' }));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Profile updated.'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument());
  });

  it('warns that a changed email is unverified until confirmed', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openEditModal();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada.new@vpd.test' } });
    submitEditForm();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('u-ada', { email: 'ada.new@vpd.test' }));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        'Profile updated. ada.new@vpd.test is unverified until the address is confirmed.'
      )
    );
  });

  it('changes the role from the Access tab after confirmation', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Access');
    expect(await screen.findByText('users.read')).toBeInTheDocument();
    expect(screen.getByText('View user accounts')).toBeInTheDocument();

    const select = screen.getByLabelText('Select a new role');
    const updateBtn = screen.getByRole('button', { name: 'Update Role' });
    expect(updateBtn).toBeDisabled();
    fireEvent.change(select, { target: { value: 'hr' } });
    expect(updateBtn).not.toBeDisabled();

    fireEvent.click(updateBtn);
    expect(await screen.findByText('Change role of Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change Role' }));
    await waitFor(() => expect(mocks.updateRoles).toHaveBeenCalledWith('u-ada', 'hr'));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Ada Lovelace is now HR.'));
  });

  it('restricts an HR admin to a read-only view of an admin account', async () => {
    mocks.me.role = 'hr';
    mocks.getById.mockResolvedValue(apiOk(adminPersona));
    render(<UserDetailPage userId="u-priya" />);
    await screen.findByRole('heading', { level: 1, name: 'Priya Admin' });
    expect(
      screen.getByText('Read-only view — only a Super Admin can manage an Admin or Super Admin account.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Profile' })).not.toBeInTheDocument();

    await openTab('Access');
    expect(
      await screen.findByText('Only a Super Admin can change the role of an Admin or Super Admin account.')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Select a new role')).not.toBeInTheDocument();

    await openTab('Security');
    expect(
      screen.getByText('Read-only — only a Super Admin can perform security actions on an Admin or Super Admin account.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Read-only — only a Super Admin can delete an Admin or Super Admin account.')
    ).toBeInTheDocument();
  });

  it('deactivates the account after an explicit confirmation', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('Deactivate Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate User' }));
    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith('u-ada'));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Ada Lovelace has been deactivated.'));
  });

  it('activates an inactive account after an explicit confirmation', async () => {
    mocks.getById.mockResolvedValue(apiOk(inactiveAda));
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    expect(await screen.findByText('Activate Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activate User' }));
    await waitFor(() => expect(mocks.activate).toHaveBeenCalledWith('u-ada'));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Ada Lovelace has been activated.'));
  });

  it('forces a password reset and reports the email-delivery caveat', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');

    fireEvent.click(screen.getByRole('button', { name: 'Force Password Reset' }));
    expect(await screen.findByText('Force password reset for Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => expect(mocks.forcePasswordReset).toHaveBeenCalledWith('u-ada'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        'Password reset link emailed to ada@vpd.test. All their sessions were revoked.'
      )
    );

    mocks.forcePasswordReset.mockResolvedValue(apiOk({ email_sent: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Force Password Reset' }));
    expect(await screen.findByText('Force password reset for Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'warning',
        'Reset link issued and all sessions revoked, but email delivery is not configured on this environment.'
      )
    );
  });

  it('locks an account after an explicit confirmation', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');
    fireEvent.click(screen.getByRole('button', { name: 'Lock Account' }));
    expect(await screen.findByText('Lock Ada Lovelace out?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lock User' }));
    await waitFor(() => expect(mocks.lock).toHaveBeenCalledWith('u-ada'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Ada Lovelace has been locked out. All sessions were revoked.')
    );
  });

  it('unlocks a locked account after an explicit confirmation', async () => {
    mocks.getById.mockResolvedValue(apiOk(lockedAda));
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Account' }));
    expect(await screen.findByText('Unlock Ada Lovelace?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unlock User' }));
    await waitFor(() => expect(mocks.unlock).toHaveBeenCalledWith('u-ada'));
    await waitFor(() => expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Ada Lovelace has been unlocked.'));
  });

  it('shows sessions and login history and revokes a single session', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');
    expect(await screen.findByText('203.0.113.7')).toBeInTheDocument();
    expect(await screen.findByText('198.51.100.9')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(await screen.findByText('Revoke this session?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revoke Session' }));
    await waitFor(() => expect(mocks.revokeSession).toHaveBeenCalledWith('u-ada', 's-1'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'Session revoked. That device must sign in again.')
    );
  });

  it('revokes all sessions for the user', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');
    fireEvent.click(screen.getByRole('button', { name: 'Revoke All Sessions' }));
    expect(await screen.findByText('Revoke all sessions for Ada Lovelace?')).toBeInTheDocument();
    clickLast('Revoke All Sessions');
    await waitFor(() => expect(mocks.revokeSessions).toHaveBeenCalledWith('u-ada'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith('success', 'All sessions for Ada Lovelace were revoked.')
    );
  });

  it('soft deletes the account and returns to the list', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Security');
    fireEvent.click(screen.getByRole('button', { name: 'Delete User' }));
    expect(await screen.findByText('Delete Ada Lovelace?')).toBeInTheDocument();
    clickLast('Delete User');
    await waitFor(() => expect(mocks.deleteUser).toHaveBeenCalledWith('u-ada'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('was deleted (soft delete)')
      )
    );
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/users'));
  });

  it('renders the activity timeline with pagination', async () => {
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    await openTab('Activity');
    expect(await screen.findByText('USER_UPDATED')).toBeInTheDocument();
    expect(screen.getByText('Mia Admin')).toBeInTheDocument();
    expect(screen.getByText('fields=name')).toBeInTheDocument();
    expect(mocks.getActivity).toHaveBeenCalledWith('u-ada', { page: 1, limit: 20 });
    expect(screen.getByText(spanWithText('Showing 1–1 of 1 · Page 1 of 1'))).toBeInTheDocument();
  });

  it('guards a Super Admin from destructive actions on their own account', async () => {
    mocks.me.id = 'u-ada';
    render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    expect(screen.getByText('This is you')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();

    await openTab('Security');
    expect(screen.getByRole('button', { name: 'Force Password Reset' })).toBeDisabled();
    expect(
      screen.getByText('Force password reset and account locking are unavailable on your own account. You can still sign yourself out everywhere.')
    ).toBeInTheDocument();
    expect(screen.getByText('You cannot delete your own account.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete User' })).not.toBeInTheDocument();

    await openTab('Access');
    expect(await screen.findByText('You cannot change your own role.')).toBeInTheDocument();

    await openTab('Security');
    fireEvent.click(screen.getByRole('button', { name: 'Revoke All Sessions' }));
    expect(await screen.findByText('Sign out everywhere?')).toBeInTheDocument();
    clickLast('Sign Out Everywhere');
    await waitFor(() => expect(mocks.revokeSessions).toHaveBeenCalledWith('u-ada'));
    await waitFor(() =>
      expect(mocks.showNotification).toHaveBeenCalledWith(
        'success',
        'You have been signed out everywhere — your other devices must sign in again.'
      )
    );
  });

  it('keeps the responsive layout classes for narrow viewports', async () => {
    const { container } = render(<UserDetailPage userId="u-ada" />);
    await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' });
    expect(container.querySelector('.lg\\:grid-cols-3')).not.toBeNull();
    expect(screen.getByRole('tablist').className).toContain('overflow-x-auto');
  });
});
