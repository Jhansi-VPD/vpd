"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UpdateUserPayload, usersApi } from '../../../../api';
import { useAuth } from '../../../../auth/auth.context';
import { useNotifications } from '../../../../app/providers/NotificationProvider';
import StatusBadge from '../../../../shared/components/StatusBadge';
import Button from '../../../../shared/components/Button';
import PageContainer from '../../../../shared/components/PageContainer';
import PageHeader from '../../../../shared/components/PageHeader';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import ErrorState from '../../../../shared/components/ErrorState';
import LoadingState from '../../../../shared/components/LoadingState';
import EmptyState from '../../../../shared/components/EmptyState';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog';
import Pagination from '../../../../shared/components/Pagination';
import {
  LoginHistoryEntry,
  UserActivityEntry,
  UserDetail as UserDetailData,
  UserPermissionsInfo,
  UserRolesInfo,
  UserSessionInfo,
} from '../../../../types/user.types';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hr: 'HR',
  finance: 'Finance',
  sales: 'Sales',
  marketing: 'Marketing',
  project_manager: 'Project Manager',
  developer: 'Developer',
  qa: 'QA',
  support: 'Support',
  employee: 'Employee',
  client: 'Client',
  guest: 'Guest',
  partner: 'Partner',
};

const PRIVILEGED_ROLES = ['admin', 'super_admin'];

const STATUS_HELP: Record<string, string> = {
  active: 'Sign-in enabled.',
  pending: 'Invited but has not set a password / verified email yet.',
  inactive: 'Deactivated by an administrator — sign-in blocked until reactivated.',
  suspended: 'Administratively suspended — sign-in blocked until restored.',
  locked: 'Locked out after failed logins or a manual lock — sign-in blocked until unlocked.',
};

type TabKey = 'profile' | 'access' | 'security' | 'activity';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'access', label: 'Access' },
  { key: 'security', label: 'Security' },
  { key: 'activity', label: 'Activity' },
];

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
    description: 'is locked out; unlocking clears the lockout so they can sign in again.',
    variant: 'primary',
  },
};

type ConfirmState =
  | { kind: 'state'; action: SingleAction }
  | { kind: 'lock' }
  | { kind: 'delete' }
  | { kind: 'force-reset' }
  | { kind: 'revoke-all' }
  | { kind: 'revoke-session'; session: UserSessionInfo }
  | { kind: 'role'; newRole: string }
  | null;

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

function uaShort(ua: string | null): string {
  if (!ua) return 'Unknown device';
  return ua.length > 64 ? `${ua.slice(0, 64)}…` : ua;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatMetadata(md: Record<string, unknown> | null): string {
  if (!md) return '';
  return Object.entries(md)
    .map(([key, value]) => `${key}=${typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}`)
    .join('  ·  ');
}

const SectionCard: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}> = ({ title, description, actions, tone = 'default', children }) => (
  <section className={`rounded-xl border bg-[#171717] ${tone === 'danger' ? 'border-[#EF4444]/30' : 'border-[#2A2A2A]'}`}>
    <header className="flex flex-col gap-3 border-b border-[#2A2A2A] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <h3 className={`text-sm font-semibold ${tone === 'danger' ? 'text-[#EF4444]' : 'text-white'}`}>{title}</h3>
        {description && <p className="mt-0.5 max-w-3xl text-xs text-[#A1A1AA]">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
    <div className="px-4 py-4 sm:px-5">{children}</div>
  </section>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="flex flex-col gap-0.5 border-b border-[#2A2A2A]/60 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
    <dt className="text-xs uppercase tracking-wide text-[#A1A1AA]">{label}</dt>
    <dd className="text-sm text-zinc-100 sm:text-right">
      {value}
      {hint && <span className="block text-[11px] text-[#A1A1AA]">{hint}</span>}
    </dd>
  </div>
);

interface UserDetailProps {
  userId: string;
}

export const UserDetail: React.FC<UserDetailProps> = ({ userId }) => {
  const router = useRouter();
  const { user: me } = useAuth();
  const { showNotification } = useNotifications();

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [tab, setTab] = useState<TabKey>('profile');

  // Edit profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Access tab
  const [rolesInfo, setRolesInfo] = useState<UserRolesInfo | null>(null);
  const [permissionsInfo, setPermissionsInfo] = useState<UserPermissionsInfo | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState('');

  // Security tab
  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Activity tab
  const [activity, setActivity] = useState<UserActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityMeta, setActivityMeta] = useState({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const [activityPage, setActivityPage] = useState(1);

  // Confirm dialog
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const accessLoadedRef = useRef(false);
  const securityLoadedRef = useRef(false);
  const activityLoadedRef = useRef(false);

  const isSelf = !!me && !!user && me.id === user.id;
  const canManage = !!user && (me?.role === 'super_admin' || !PRIVILEGED_ROLES.includes(user.role));
  const lockoutActive =
    !!user && (user.is_locked || (!!user.locked_until && new Date(user.locked_until).getTime() > Date.now()));

  const loadUser = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await usersApi.getById(userId);
        setUser(res.data);
      } catch (err: any) {
        if (silent) {
          showNotification('error', err?.message || 'Failed to refresh this user.');
        } else if (err?.status === 404) {
          setError({ status: 404, message: 'This user does not exist or may have been removed.' });
        } else if (err?.status === 403) {
          setError({
            status: 403,
            message: 'You do not have permission to view user accounts. This module is restricted to Admin and HR roles.',
          });
        } else {
          setError({ status: err?.status, message: err?.message || 'Failed to load this user. Please try again.' });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId, showNotification]
  );

  const loadAccess = useCallback(async () => {
    setAccessLoading(true);
    setAccessError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([usersApi.getRoles(userId), usersApi.getPermissions(userId)]);
      setRolesInfo(rolesRes.data);
      setPermissionsInfo(permsRes.data);
      setRoleSelection('');
      accessLoadedRef.current = true;
    } catch (err: any) {
      setAccessError(err?.message || 'Failed to load role and permission data.');
    } finally {
      setAccessLoading(false);
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await usersApi.getSessions(userId);
      setSessions(res.data || []);
    } catch (err: any) {
      setSessionsError(err?.message || 'Failed to load sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, [userId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await usersApi.getLoginHistory(userId, 50);
      setHistory(res.data || []);
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to load login history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  const loadActivity = useCallback(
    async (page: number) => {
      setActivityLoading(true);
      setActivityError(null);
      try {
        const res = await usersApi.getActivity(userId, { page, limit: 20 });
        setActivity(res.data || []);
        const m = res.meta || {};
        setActivityMeta({
          total: m.total ?? 0,
          page: m.page ?? page,
          limit: m.limit ?? 20,
          total_pages: m.total_pages ?? 1,
        });
      } catch (err: any) {
        setActivityError(err?.message || 'Failed to load the activity timeline.');
      } finally {
        setActivityLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  // Lazy-load each tab's data the first time it is opened.
  useEffect(() => {
    if (tab === 'access' && !accessLoadedRef.current && !accessLoading) void loadAccess();
  }, [tab, accessLoading, loadAccess]);

  useEffect(() => {
    if (tab === 'security' && !securityLoadedRef.current) {
      securityLoadedRef.current = true;
      void loadSessions();
      void loadHistory();
    }
  }, [tab, loadSessions, loadHistory]);

  useEffect(() => {
    if (tab === 'activity' && !activityLoadedRef.current) {
      activityLoadedRef.current = true;
      void loadActivity(1);
    }
  }, [tab, loadActivity]);

  const refreshAfterMutation = useCallback(async () => {
    await loadUser({ silent: true });
    if (accessLoadedRef.current) await loadAccess();
    if (securityLoadedRef.current) await Promise.all([loadSessions(), loadHistory()]);
    if (activityLoadedRef.current) await loadActivity(activityPage);
  }, [loadUser, loadAccess, loadSessions, loadHistory, loadActivity, activityPage]);

  const openEdit = () => {
    if (!user) return;
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setEditError(null);
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEditError(null);
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const phone = editForm.phone.trim();
    if (!name) return setEditError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setEditError('A valid email address is required.');

    const payload: UpdateUserPayload = {};
    if (name !== user.name) payload.name = name;
    const emailChanged = email.toLowerCase() !== user.email.toLowerCase();
    if (emailChanged) payload.email = email;
    if (phone !== (user.phone || '')) payload.phone = phone || null;
    if (Object.keys(payload).length === 0) {
      setEditOpen(false);
      showNotification('info', 'No changes to save.');
      return;
    }

    setEditLoading(true);
    try {
      await usersApi.update(user.id, payload);
      setEditOpen(false);
      showNotification(
        'success',
        emailChanged
          ? `Profile updated. ${email} is unverified until the address is confirmed.`
          : 'Profile updated.'
      );
      await loadUser({ silent: true });
      if (activityLoadedRef.current) void loadActivity(activityPage);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update the profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const runConfirmedAction = async () => {
    if (!pendingConfirm || !user) return;
    const confirmed = pendingConfirm;
    const name = user.name;
    setActionLoading(true);
    try {
      switch (confirmed.kind) {
        case 'state': {
          const a = confirmed.action;
          if (a === 'deactivate') await usersApi.deactivate(user.id);
          else if (a === 'activate') await usersApi.activate(user.id);
          else if (a === 'suspend') await usersApi.suspend(user.id);
          else if (a === 'restore') await usersApi.restore(user.id);
          else await usersApi.unlock(user.id);
          showNotification('success', `${name} has been ${ACTION_COPY[a].past}.`);
          break;
        }
        case 'lock':
          await usersApi.lock(user.id);
          showNotification('success', `${name} has been locked out. All sessions were revoked.`);
          break;
        case 'delete':
          await usersApi.delete(user.id);
          showNotification(
            'success',
            `${name} was deleted (soft delete) — the account is deactivated and all history is preserved.`
          );
          setPendingConfirm(null);
          router.push('/admin/users');
          return;
        case 'force-reset': {
          const res = await usersApi.forcePasswordReset(user.id);
          if (res.data?.email_sent) {
            showNotification('success', `Password reset link emailed to ${user.email}. All their sessions were revoked.`);
          } else {
            showNotification(
              'warning',
              'Reset link issued and all sessions revoked, but email delivery is not configured on this environment.'
            );
          }
          break;
        }
        case 'revoke-all':
          await usersApi.revokeSessions(user.id);
          showNotification(
            'success',
            isSelf
              ? 'You have been signed out everywhere — your other devices must sign in again.'
              : `All sessions for ${name} were revoked.`
          );
          break;
        case 'revoke-session':
          await usersApi.revokeSession(user.id, confirmed.session.id);
          showNotification(
            'success',
            isSelf && confirmed.session.is_current
              ? 'Your current session was revoked — you will be signed out.'
              : 'Session revoked. That device must sign in again.'
          );
          break;
        case 'role':
          await usersApi.updateRoles(user.id, confirmed.newRole);
          showNotification('success', `${name} is now ${ROLE_LABELS[confirmed.newRole] || confirmed.newRole}.`);
          break;
      }
      setPendingConfirm(null);
      await refreshAfterMutation();
    } catch (err: any) {
      showNotification('error', err?.message || 'The action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivityPage = (p: number) => {
    setActivityPage(p);
    void loadActivity(p);
  };

  const statusActions = useMemo<Array<{ action: SingleAction; label: string; danger?: boolean }>>(() => {
    if (!user) return [];
    switch (user.status) {
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
  }, [user]);

  const roleOptions = useMemo(() => {
    if (!rolesInfo) return [{ value: '', label: 'Select new role…' }];
    return [
      { value: '', label: 'Select new role…' },
      ...rolesInfo.available
        .filter((r) => r !== rolesInfo.current)
        .map((r) => ({ value: r as string, label: ROLE_LABELS[r] || r })),
    ];
  }, [rolesInfo]);

  const confirmCopy = useMemo(() => {
    if (!pendingConfirm || !user) return null;
    const name = user.name;
    switch (pendingConfirm.kind) {
      case 'state': {
        const copy = ACTION_COPY[pendingConfirm.action];
        return {
          title: `${copy.verb} ${name}?`,
          message: (
            <p>
              <strong className="text-white">{name}</strong> ({user.email}) {copy.description}
            </p>
          ),
          confirmText: `${copy.verb} User`,
          variant: copy.variant,
        };
      }
      case 'lock':
        return {
          title: `Lock ${name} out?`,
          message: (
            <div className="space-y-2">
              <p>
                <strong className="text-white">{name}</strong> will be locked out indefinitely and all active sessions
                will be revoked. They cannot sign in until an admin unlocks the account.
              </p>
              <p className="text-xs text-[#A1A1AA]">
                This is a manual security lock — different from suspension. Use it when you suspect the account is
                compromised.
              </p>
            </div>
          ),
          confirmText: 'Lock User',
          variant: 'danger' as const,
        };
      case 'delete':
        return {
          title: `Delete ${name}?`,
          message: (
            <div className="space-y-2">
              <p>
                <strong className="text-white">{name}</strong> ({user.email}) will be deactivated immediately, all
                active sessions revoked, and they will lose access to every VPD portal.
              </p>
              <p className="text-xs text-[#A1A1AA]">
                This is a soft delete — the account row, sessions, and full audit history are preserved. Reactivating
                the account restores access.
              </p>
              {user.role === 'super_admin' && (
                <p className="text-xs text-[#F59E0B]">If {name} is the last active Super Admin, this will be blocked.</p>
              )}
            </div>
          ),
          confirmText: 'Delete User',
          variant: 'danger' as const,
        };
      case 'force-reset':
        return {
          title: `Force password reset for ${name}?`,
          message: (
            <div className="space-y-2">
              <p>
                A single-use reset link will be emailed to <strong className="text-white">{user.email}</strong> and
                every active session will be revoked, so {name} must sign in again with a new password.
              </p>
              <p className="text-xs text-[#A1A1AA]">
                You will never see or set their password — the link does. If email delivery is not configured, the link
                is issued without an email.
              </p>
            </div>
          ),
          confirmText: 'Send Reset Link',
          variant: 'danger' as const,
        };
      case 'revoke-all':
        return isSelf
          ? {
              title: 'Sign out everywhere?',
              message: (
                <p>
                  Every active session on <strong className="text-white">your own account</strong> — including this one
                  — will be revoked. You will need to sign in again.
                </p>
              ),
              confirmText: 'Sign Out Everywhere',
              variant: 'danger' as const,
            }
          : {
              title: `Revoke all sessions for ${name}?`,
              message: (
                <p>
                  Every device <strong className="text-white">{name}</strong> is signed in on will be signed out
                  immediately. They must sign in again to continue working.
                </p>
              ),
              confirmText: 'Revoke All Sessions',
              variant: 'danger' as const,
            };
      case 'revoke-session':
        return {
          title: 'Revoke this session?',
          message: (
            <div className="space-y-2">
              <p>
                The device signed in from{' '}
                <strong className="text-white">{pendingConfirm.session.ip_address || 'an unknown IP'}</strong> (
                {uaShort(pendingConfirm.session.user_agent)}) will be signed out immediately.
              </p>
              {pendingConfirm.session.is_current && (
                <p className="text-xs text-[#F59E0B]">This is your current session — you will be signed out.</p>
              )}
            </div>
          ),
          confirmText: 'Revoke Session',
          variant: 'danger' as const,
        };
      case 'role': {
        const newRole = pendingConfirm.newRole;
        const fromLabel = ROLE_LABELS[user.role] || user.role;
        const toLabel = ROLE_LABELS[newRole] || newRole;
        return {
          title: `Change role of ${name}?`,
          message: (
            <div className="space-y-2">
              <p>
                Change <strong className="text-white">{name}</strong>&rsquo;s role from{' '}
                <strong className="text-white">{fromLabel}</strong> to{' '}
                <strong className="text-[#DFC067]">{toLabel}</strong>? Access updates immediately.
              </p>
              {PRIVILEGED_ROLES.includes(newRole) && (
                <p className="text-xs text-[#F59E0B]">This grants full administrative access to the platform.</p>
              )}
              <p className="text-xs text-[#A1A1AA]">Blocked if {name} is the last active Super Admin.</p>
            </div>
          ),
          confirmText: 'Change Role',
          variant: 'primary' as const,
        };
      }
      default:
        return null;
    }
  }, [pendingConfirm, user, isSelf]);

  if (!userId) {
    return (
      <PageContainer>
        <ErrorState title="Invalid Link" message="No user id was provided in the URL." />
      </PageContainer>
    );
  }

  if (loading && !user) {
    return (
      <PageContainer>
        <LoadingState message="Loading user profile…" />
      </PageContainer>
    );
  }

  if (error && !user) {
    return (
      <PageContainer>
        <PageHeader
          title="User"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Users' }, { label: 'Details' }]}
          actions={
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
              ← Back to Users
            </Button>
          }
        />
        <ErrorState title={error.status === 403 ? 'Access Denied' : error.status === 404 ? 'User Not Found' : 'Something went wrong'} message={error.message} onRetry={() => void loadUser()} />
      </PageContainer>
    );
  }

  if (!user) return null;

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title={user.name}
        description={user.email}
        breadcrumbs={[{ label: 'Admin' }, { label: 'Workforce Users' }, { label: user.name }]}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ROLE_LABELS[user.role] || user.role} variant={PRIVILEGED_ROLES.includes(user.role) ? 'gold' : 'neutral'} />
            <StatusBadge status={user.status} />
            {isSelf && (
              <span className="rounded-full border border-[#2A2A2A] bg-[#1D1D1D] px-2.5 py-0.5 text-xs text-[#A1A1AA]">
                This is you
              </span>
            )}
          </div>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
              ← Back to Users
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void loadUser()}>
              Refresh
            </Button>
            {canManage &&
              !isSelf &&
              statusActions.map((qa) => (
                <Button
                  key={qa.action}
                  variant={qa.danger ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => setPendingConfirm({ kind: 'state', action: qa.action })}
                >
                  {qa.label}
                </Button>
              ))}
          </>
        }
      />

      {!canManage && (
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-3 text-xs text-[#F59E0B]">
          Read-only view — only a Super Admin can manage an Admin or Super Admin account.
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="User sections" className="flex gap-1 overflow-x-auto border-b border-[#2A2A2A]">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
              tab === t.key
                ? 'border-[#D4AF37] text-[#DFC067]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div role="tabpanel" aria-label="Profile" className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Identity"
            actions={
              canManage && (
                <Button variant="secondary" size="sm" onClick={openEdit}>
                  Edit Profile
                </Button>
              )
            }
          >
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xl font-semibold text-[#DFC067]">
                {initialsOf(user.name) || '?'}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{user.name}</p>
                <p className="break-all text-xs text-[#A1A1AA]">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <StatusBadge status={ROLE_LABELS[user.role] || user.role} variant={PRIVILEGED_ROLES.includes(user.role) ? 'gold' : 'neutral'} />
                <StatusBadge status={user.status} />
              </div>
            </div>
            <dl className="mt-2">
              <InfoRow
                label="Email verified"
                value={user.is_email_verified ? 'Verified' : 'Not verified'}
                hint={
                  user.is_email_verified
                    ? user.email_verified_at
                      ? `since ${formatDateTime(user.email_verified_at)}`
                      : 'timestamp not recorded'
                    : 'verification pending'
                }
              />
              <InfoRow label="Phone" value={user.phone || '—'} />
              <InfoRow label="Employee code" value={user.employee_code || '—'} />
            </dl>
          </SectionCard>

          <SectionCard
            title="Organization"
            description={
              user.employee_profile
                ? 'Employee profile attached to this account.'
                : 'No organizational record for this account.'
            }
          >
            {user.employee_profile ? (
              <dl>
                <InfoRow label="Designation" value={user.employee_profile.designation || '—'} />
                <InfoRow label="Department" value={user.employee_profile.department_name || '—'} />
                <InfoRow label="Date of joining" value={formatDateTime(user.employee_profile.date_of_joining)} />
                <InfoRow label="Employee code" value={user.employee_profile.employee_code} />
              </dl>
            ) : (
              <p className="py-4 text-sm text-[#A1A1AA]">
                {user.role === 'employee'
                  ? 'No employee record is linked to this account yet.'
                  : 'This role does not carry an organizational record (e.g. client, guest, partner).'}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Account" description="Lifecycle timestamps for this account.">
            <dl>
              <InfoRow label="Created" value={formatDateTime(user.created_at)} />
              <InfoRow label="Last updated" value={formatDateTime(user.updated_at)} />
              <InfoRow label="Last login" value={formatDateTime(user.last_login_at)} />
            </dl>
            <p className="mt-3 text-xs text-[#A1A1AA]">
              Status explanation: {STATUS_HELP[user.status] || '—'}
            </p>
          </SectionCard>
        </div>
      )}

      {/* Access tab */}
      {tab === 'access' && (
        <div role="tabpanel" aria-label="Access" className="space-y-6">
          {accessLoading && !rolesInfo ? (
            <SectionCard title="Role & Permissions">
              <LoadingState message="Loading access data…" />
            </SectionCard>
          ) : accessError && !rolesInfo ? (
            <SectionCard title="Role & Permissions">
              <ErrorState title="Could not load access data" message={accessError} onRetry={() => void loadAccess()} />
            </SectionCard>
          ) : (
            <>
              <SectionCard
                title="Assigned Role"
                description="Single-role architecture — the assigned role is the source of truth for what this account can access."
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-[#A1A1AA]">Current role</span>
                    <StatusBadge
                      status={ROLE_LABELS[user.role] || user.role}
                      variant={PRIVILEGED_ROLES.includes(user.role) ? 'gold' : 'neutral'}
                    />
                  </div>
                  {!canManage ? (
                    <p className="text-xs text-[#A1A1AA]">
                      Only a Super Admin can change the role of an Admin or Super Admin account.
                    </p>
                  ) : isSelf ? (
                    <p className="text-xs text-[#A1A1AA]">You cannot change your own role.</p>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="w-full sm:w-64">
                        <Select
                          value={roleSelection}
                          onChange={(e) => setRoleSelection(e.target.value)}
                          options={roleOptions}
                          aria-label="Select a new role"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!roleSelection}
                        onClick={() => setPendingConfirm({ kind: 'role', newRole: roleSelection })}
                      >
                        Update Role
                      </Button>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Effective Permissions"
                description={
                  permissionsInfo
                    ? `Derived from the assigned role — ${permissionsInfo.permissions.length} permission${
                        permissionsInfo.permissions.length === 1 ? '' : 's'
                      }. This system has no per-user grants; a role change affects every user holding it.`
                    : 'Derived from the assigned role.'
                }
              >
                {permissionsInfo && permissionsInfo.permissions.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                    <table className="w-full text-left text-sm" aria-label="Permissions of the assigned role">
                      <thead className="bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
                        <tr>
                          <th scope="col" className="px-4 py-2.5 font-semibold">
                            Module
                          </th>
                          <th scope="col" className="px-4 py-2.5 font-semibold">
                            Action
                          </th>
                          <th scope="col" className="px-4 py-2.5 font-semibold">
                            Permission
                          </th>
                          <th scope="col" className="px-4 py-2.5 font-semibold">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2A]/80">
                        {permissionsInfo.permissions.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2.5 capitalize text-zinc-200">{p.module}</td>
                            <td className="px-4 py-2.5 text-zinc-300">{p.action}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-xs text-[#DFC067]">
                                {p.module}.{p.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{p.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No Permissions" description="The assigned role currently grants no permissions." />
                )}
              </SectionCard>
            </>
          )}
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div role="tabpanel" aria-label="Security" className="space-y-6">
          <SectionCard title="Account Security State" description="Live security posture for this account.">
            <dl className="grid gap-x-10 lg:grid-cols-2">
              <InfoRow
                label="Status"
                value={<StatusBadge status={user.status} />}
                hint={STATUS_HELP[user.status]}
              />
              <InfoRow
                label="Login lockout"
                value={lockoutActive ? (user.is_locked && !user.locked_until ? 'Locked (manual)' : 'Locked') : 'Not locked'}
                hint={
                  lockoutActive && user.locked_until
                    ? `until ${formatDateTime(user.locked_until)}`
                    : user.failed_login_attempts > 0
                    ? `${user.failed_login_attempts} failed attempt${user.failed_login_attempts === 1 ? '' : 's'} on record`
                    : undefined
                }
              />
              <InfoRow label="Suspended at" value={formatDateTime(user.suspended_at)} />
              <InfoRow label="Password last changed" value={formatDateTime(user.password_changed_at)} />
              <InfoRow
                label="Email verified"
                value={user.is_email_verified ? 'Verified' : 'Not verified'}
                hint={user.email_verified_at ? formatDateTime(user.email_verified_at) : undefined}
              />
              <InfoRow label="MFA" value={user.mfa_enabled ? 'Enabled' : 'Disabled'} />
            </dl>
          </SectionCard>

          <SectionCard
            title="Recovery & Sessions"
            description="Security actions apply immediately, revoke sessions where relevant, and are recorded in the audit log."
          >
            {canManage ? (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSelf}
                    onClick={() => setPendingConfirm({ kind: 'force-reset' })}
                  >
                    Force Password Reset
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPendingConfirm({ kind: 'revoke-all' })}>
                    Revoke All Sessions
                  </Button>
                  {!isSelf &&
                    (lockoutActive ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setPendingConfirm({ kind: 'state', action: 'unlock' })}
                      >
                        Unlock Account
                      </Button>
                    ) : (
                      <Button variant="danger" size="sm" onClick={() => setPendingConfirm({ kind: 'lock' })}>
                        Lock Account
                      </Button>
                    ))}
                </div>
                {isSelf && (
                  <p className="mt-3 text-xs text-[#A1A1AA]">
                    Force password reset and account locking are unavailable on your own account. You can still sign
                    yourself out everywhere.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-[#A1A1AA]">
                Read-only — only a Super Admin can perform security actions on an Admin or Super Admin account.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Active Sessions"
            description="Sessions that are not revoked and not expired (most recently created first)."
            actions={
              <Button variant="ghost" size="sm" onClick={() => void loadSessions()} loading={sessionsLoading}>
                Refresh
              </Button>
            }
          >
            {sessionsLoading && sessions.length === 0 ? (
              <LoadingState message="Loading sessions…" />
            ) : sessionsError ? (
              <ErrorState title="Could not load sessions" message={sessionsError} onRetry={() => void loadSessions()} />
            ) : sessions.length === 0 ? (
              <EmptyState title="No Active Sessions" description="This account has no active sessions right now." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                <table className="w-full text-left text-sm" aria-label="Active sessions">
                  <thead className="bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Device
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        IP address
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Signed in
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Last used
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Expires
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]/80">
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="max-w-[260px] px-4 py-2.5">
                          <span className="text-xs text-zinc-300" title={s.user_agent || undefined}>
                            {uaShort(s.user_agent)}
                          </span>
                          {s.is_current && (
                            <span className="ml-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-medium text-[#DFC067]">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{s.ip_address || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{formatDateTime(s.created_at)}</td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{formatDateTime(s.last_used_at)}</td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{formatDateTime(s.expires_at)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingConfirm({ kind: 'revoke-session', session: s })}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Login History"
            description="Successful sign-ins and failed attempts, newest first (most recent 50 events)."
            actions={
              <Button variant="ghost" size="sm" onClick={() => void loadHistory()} loading={historyLoading}>
                Refresh
              </Button>
            }
          >
            {historyLoading && history.length === 0 ? (
              <LoadingState message="Loading login history…" />
            ) : historyError ? (
              <ErrorState title="Could not load login history" message={historyError} onRetry={() => void loadHistory()} />
            ) : history.length === 0 ? (
              <EmptyState title="No Login Events" description="No sign-in activity has been recorded for this account yet." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                <table className="w-full text-left text-sm" aria-label="Login history">
                  <thead className="bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Event
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        When
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        IP address
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]/80">
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-2.5">
                          {h.event === 'login' ? (
                            <StatusBadge status="login" variant="success" />
                          ) : (
                            <StatusBadge status="failed login" variant="danger" />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={h.status} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{formatDateTime(h.timestamp)}</td>
                        <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{h.ip_address || '—'}</td>
                        <td className="max-w-[260px] px-4 py-2.5">
                          <span className="text-xs text-[#A1A1AA]" title={h.user_agent || undefined}>
                            {uaShort(h.user_agent)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard tone="danger" title="Danger Zone">
            {!canManage ? (
              <p className="text-xs text-[#A1A1AA]">
                Read-only — only a Super Admin can delete an Admin or Super Admin account.
              </p>
            ) : isSelf ? (
              <p className="text-xs text-[#A1A1AA]">You cannot delete your own account.</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Delete this account</p>
                  <p className="mt-0.5 max-w-2xl text-xs text-[#A1A1AA]">
                    Soft delete: the account is deactivated immediately, all sessions are revoked, and every record is
                    preserved. Reactivate the account to restore access.
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setPendingConfirm({ kind: 'delete' })}>
                  Delete User
                </Button>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <div role="tabpanel" aria-label="Activity">
          <SectionCard
            title="Audit Timeline"
            description="Every action recorded against this account — admin actions and security events, newest first."
            actions={
              <Button variant="ghost" size="sm" onClick={() => void loadActivity(activityPage)} loading={activityLoading}>
                Refresh
              </Button>
            }
          >
            {activityLoading && activity.length === 0 ? (
              <LoadingState message="Loading activity…" />
            ) : activityError ? (
              <ErrorState title="Could not load activity" message={activityError} onRetry={() => void loadActivity(activityPage)} />
            ) : activity.length === 0 ? (
              <EmptyState title="No Recorded Activity" description="Nothing has been logged against this account yet." />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                  <table className="w-full text-left text-sm" aria-label="User activity timeline">
                    <thead className="bg-[#141414] text-xs uppercase tracking-wider text-[#A1A1AA]">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          When
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Action
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Actor
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          IP address
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]/80">
                      {activity.map((entry) => {
                        const meta = formatMetadata(entry.metadata);
                        return (
                          <tr key={entry.id}>
                            <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[#A1A1AA]">
                              {formatDateTime(entry.timestamp)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-xs text-[#DFC067]">{entry.action}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-zinc-200">{entry.actor_name || 'System'}</td>
                            <td className="px-4 py-2.5 text-xs text-[#A1A1AA]">{entry.ip_address || '—'}</td>
                            <td className="max-w-[340px] px-4 py-2.5">
                              {meta ? (
                                <span className="font-mono text-[11px] text-[#A1A1AA]" title={meta}>
                                  {meta.length > 90 ? `${meta.slice(0, 90)}…` : meta}
                                </span>
                              ) : (
                                <span className="text-xs text-[#A1A1AA]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {activityMeta.total > 0 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={activityMeta.page}
                      totalPages={activityMeta.total_pages}
                      totalItems={activityMeta.total}
                      pageSize={activityMeta.limit}
                      onPageChange={handleActivityPage}
                    />
                  </div>
                )}
              </>
            )}
          </SectionCard>
        </div>
      )}

      {/* Edit Profile modal */}
      <Modal isOpen={editOpen} onClose={() => !editLoading && setEditOpen(false)} title="Edit Profile">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            helperText="Changing the email marks it unverified until the address is confirmed."
            required
          />
          <Input
            label="Phone (optional)"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <p className="text-xs text-[#A1A1AA]">
            Role changes are handled in the Access tab (with Super Admin protections). Designation and department live
            on the employee profile.
          </p>
          {editError && (
            <p role="alert" className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
              {editError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation */}
      <ConfirmDialog
        isOpen={!!pendingConfirm}
        title={confirmCopy?.title || 'Confirm Action'}
        message={confirmCopy?.message || ''}
        confirmText={confirmCopy?.confirmText || 'Confirm'}
        variant={confirmCopy?.variant || 'danger'}
        onConfirm={() => void runConfirmedAction()}
        onCancel={() => !actionLoading && setPendingConfirm(null)}
        loading={actionLoading}
      />
    </PageContainer>
  );
};

export default UserDetail;
