# Admin Portal Implementation Inventory

## 1. Dashboard
- **Existing feature**: Basic metrics & charts
- **Existing frontend screen**: `Dashboard.tsx`
- **Existing backend API**: `/api/v1/dashboard/overview` (partially existing or mock), calls `usersApi`, `projectsApi`, `attendanceApi` on frontend.
- **Existing database model**: N/A (Aggregates)
- **Current role access**: `super_admin`, `admin`, `finance`
- **Missing functionality**: Missing dedicated comprehensive dashboard API endpoint combining all stats (currently frontend aggregates by calling `getAll()`), RBAC specific metrics filtering.
- **Required change**: Implement `/api/v1/dashboard/admin` returning comprehensive pre-calculated telemetry (system health, user counts, alerts) honoring role scope.
- **Risk or dependency**: Fetching `getAll()` on users/projects to calculate length is extremely inefficient for production; must be moved to backend `COUNT` queries.

## 2. Organization Management
- **Existing feature**: Settings page skeleton
- **Existing frontend screen**: `Settings.tsx`
- **Existing backend API**: `/api/v1/settings`
- **Existing database model**: `Setting`
- **Current role access**: `super_admin`
- **Missing functionality**: Dedicated UI for addresses, policies, business units, timezone, module toggles.
- **Required change**: Expand `Settings.tsx` into multiple tabs (General, Locale, Modules, Policies) connected to `settingsApi`.
- **Risk or dependency**: High risk if module toggles disable active portals incorrectly.

## 3. User Management
- **Existing feature**: Basic CRUD
- **Existing frontend screen**: `Users.tsx`
- **Existing backend API**: `/api/v1/users`
- **Existing database model**: `User`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Deactivate, Lock, Force Password Reset, Revoke Active Sessions, proper department/manager mapping inside user context, confirmation dialogs, audit tracking integration.
- **Required change**: Update `Users.tsx` with actions dropdown (Deactivate, Revoke Sessions), add explicit backend endpoints for locking/revoking.
- **Risk or dependency**: Revoking sessions drops the user immediately; backend `revoke_all_sessions` must be explicitly exposed.

## 4. Employee Management
- **Existing feature**: Basic skeleton
- **Existing frontend screen**: `Employees.tsx`
- **Existing backend API**: `/api/v1/employees`
- **Existing database model**: `Employee`
- **Current role access**: `super_admin`, `admin`, `hr`
- **Missing functionality**: Comprehensive profile views, document management (sensitive), skills, leave/attendance history in profile.
- **Required change**: Build `EmployeeProfile.tsx` detail view, connect to `employeeDocument` endpoints with strict RBAC.
- **Risk or dependency**: Sensitive PII/Payroll data visibility; must ensure `admin` can't view HR docs without permission.

## 5. Department Management
- **Existing feature**: Basic list
- **Existing frontend screen**: `Departments.tsx`
- **Existing backend API**: `/api/v1/departments`
- **Existing database model**: `Department`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Assign department head, view statistics, archive (with employee reassignment check).
- **Required change**: Add relationships to Department view, prevent deletion if `employees.count > 0`.
- **Risk or dependency**: Archiving a department with active users breaks portal rendering.

## 6. Roles & Permissions
- **Existing feature**: Hardcoded roles
- **Existing frontend screen**: `RolesPermissions.tsx`
- **Existing backend API**: `/api/v1/roles` (partial/basic)
- **Existing database model**: `Role`, `Permission`, `role_permissions`
- **Current role access**: `super_admin`
- **Missing functionality**: Dynamic permission assignment, scope restriction (org vs dept), viewing permission history.
- **Required change**: Expand UI to display a matrix of modules vs actions (view, create, edit, delete). Restrict `admin` from editing `super_admin`.
- **Risk or dependency**: Security risk; misconfiguration could lock out `super_admin`.

## 7. Attendance Management
- **Existing feature**: Frontend routing/API stubs
- **Existing frontend screen**: `Attendance.tsx`
- **Existing backend API**: **MISSING** (Frontend calls `/api/v1/attendance` but router does not exist in backend).
- **Existing database model**: `Attendance`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Entire backend implementation, correction requests workflow, exporting.
- **Required change**: Create `app/routers/attendance.py`, hook up to `Attendance` model. Implement UI for correction requests.
- **Risk or dependency**: Need to align timestamps with Organization timezone settings.

## 8. Leave Management
- **Existing feature**: Frontend routing/API stubs
- **Existing frontend screen**: `LeaveManagement.tsx`
- **Existing backend API**: **MISSING** (Frontend calls `/api/v1/leave-requests` but router does not exist in backend).
- **Existing database model**: `Leave`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Entire backend implementation, approval/rejection workflows, balance tracking.
- **Required change**: Create `app/routers/leave.py`, add balance calculation logic.
- **Risk or dependency**: Leave balance deductions must be transactional.

## 9. Project Management
- **Existing feature**: Basic CRUD
- **Existing frontend screen**: `Projects.tsx`
- **Existing backend API**: `/api/v1/projects`
- **Existing database model**: `Project`, `ProjectMilestone`, `ProjectDeliverable`
- **Current role access**: `super_admin`, `admin`, `project_manager`
- **Missing functionality**: Status workflows, Team assignments, risks/blockers, timesheet rollups.
- **Required change**: Add relationship endpoints (e.g. `/projects/{id}/team`), strict status transition validations.
- **Risk or dependency**: Financial budget visibility must be restricted.

## 10. Task Management
- **Existing feature**: Basic CRUD
- **Existing frontend screen**: `Tasks.tsx`
- **Existing backend API**: `/api/v1/tasks`
- **Existing database model**: `Task`, `TaskActivity`
- **Current role access**: `super_admin`, `admin`, `project_manager`
- **Missing functionality**: Dependencies, comments, priority, overdue tracking.
- **Required change**: Implement Kanban/List views, connect activity history.
- **Risk or dependency**: None significant.

## 11. Timesheet Management
- **Existing feature**: Frontend routing/API stubs
- **Existing frontend screen**: `Timesheets.tsx`
- **Existing backend API**: **MISSING** (Frontend calls `/api/v1/timesheets` but router does not exist).
- **Existing database model**: `Timesheet`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Entire backend implementation, approval workflows, billable vs non-billable aggregation.
- **Required change**: Create `app/routers/timesheets.py`.
- **Risk or dependency**: Must link tightly to Tasks and Projects for validation.

## 12. Finance Module
- **Existing feature**: UI skeleton
- **Existing frontend screen**: `Finance.tsx`
- **Existing backend API**: `/api/v1/finance`
- **Existing database model**: `Invoice`, `Payment`, `Payslip`
- **Current role access**: `super_admin`, `finance`
- **Missing functionality**: Revenue reports, outstanding balances, payroll hooks.
- **Required change**: Restrict access heavily. Mask sensitive data.
- **Risk or dependency**: High security risk.

## 13. CMS & Content Management
- **Existing feature**: API exists
- **Existing frontend screen**: `Announcements.tsx` (Partial), missing full CMS screens
- **Existing backend API**: `/api/v1/page_content`, `/api/v1/blog`, etc.
- **Existing database model**: `PageContent`, `Blog`, etc.
- **Current role access**: `super_admin`, `marketing`
- **Missing functionality**: Draft/publish workflows, frontend UI for most CMS entities in Admin portal.
- **Required change**: Build CMS editor interface.
- **Risk or dependency**: Public site rendering depends on these records.

## 14. Reports & Analytics
- **Existing feature**: UI skeleton
- **Existing frontend screen**: `Reports.tsx`
- **Existing backend API**: `/api/v1/reports`
- **Existing database model**: `Report`, `PageView`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Data export (CSV/Excel), dynamic filtering.
- **Required change**: Implement export formats in backend, role-based column masking.
- **Risk or dependency**: Heavy queries could degrade performance.

## 15. Notifications & Announcements
- **Existing feature**: Basic notifications
- **Existing frontend screen**: `Notifications.tsx`, `Announcements.tsx`
- **Existing backend API**: `/api/v1/notifications`, `/api/v1/announcements`
- **Existing database model**: `Notification`, `Announcement`
- **Current role access**: `super_admin`, `admin`
- **Missing functionality**: Mass broadcast targeting (by dept/role).
- **Required change**: Add target audience selection in UI and backend distribution logic.
- **Risk or dependency**: Spamming users.

## 16. Audit Logs
- **Existing feature**: Middleware records logs
- **Existing frontend screen**: `AuditLogs.tsx`
- **Existing backend API**: `/api/v1/audit_logs`
- **Existing database model**: `AuditLog`
- **Current role access**: `super_admin`
- **Missing functionality**: Advanced filtering, immutability guarantees.
- **Required change**: Ensure UI is strictly read-only.
- **Risk or dependency**: Log volume can be huge; must paginate efficiently.

## 17. Security Administration
- **Existing feature**: Partial (Settings)
- **Existing frontend screen**: Inside `Settings.tsx`
- **Existing backend API**: `/api/v1/settings`
- **Existing database model**: `Setting`
- **Current role access**: `super_admin`
- **Missing functionality**: MFA enforcement toggles, session timeouts, active session revocation list.
- **Required change**: Create Security tab in Settings, hook into `auth_service`.
- **Risk or dependency**: Critical system lockouts.

## 18. Backup & Recovery
- **Existing feature**: API exists
- **Existing frontend screen**: None
- **Existing backend API**: `/api/v1/backups`
- **Existing database model**: N/A (Infrastructure)
- **Current role access**: `super_admin`
- **Missing functionality**: UI for triggering and restoring backups.
- **Required change**: Add Backups section in Settings.
- **Risk or dependency**: Restores are destructive. Must have heavy confirmation.

## Summary of Missing APIs
- `/api/v1/attendance`
- `/api/v1/leave-requests`
- `/api/v1/timesheets`
- Advanced aggregation for `/api/v1/dashboard/admin`
