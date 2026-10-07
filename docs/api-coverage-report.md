# VPD Technologies — API Coverage & Integration Report

## Summary
- **Backend Endpoints Detected**: 340+ endpoints in FastAPI OpenAPI schema + 77 Supabase PostgreSQL tables
- **Business Endpoints Integrated**: 100% of required business operation entities (Employees, Departments, Projects, Tasks, Leads, Proposals, Contracts, Invoices, Leaves, Attendance, Careers, Applications, Tickets, Meetings, Partners, Audit Logs)
- **Public Marketing Website**: Excluded per PRD and implementation instructions.

---

## Entity-to-Screen Integration Map

| Module / Entity | Backend Table / API Route | UI Action / Trigger | Loading & Error Behavior | Portal Screen |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/auth/login`, `/auth/me`, `/users` | Sign in form, demo role buttons | Live feedback, error badge, session persist | `LoginPage.jsx` |
| **Employees** | `employees`, `users`, `/employees` | List table, create employee form | Skeletons, form validation, reload on create | `AdminPortal.jsx`, `HrPortal.jsx` |
| **Departments** | `departments`, `/department` | Department grid, add department modal | Loading state, inline error handling | `AdminPortal.jsx` |
| **Projects** | `projects`, `/projects` | Project table, delivery progress bar | Progress calculation, real metrics | `AdminPortal.jsx`, `ProjectDeliveryPortal.jsx`, `ClientPortal.jsx` |
| **Tasks** | `tasks`, `/task` | Sprint Kanban board, task advance, create task | Dynamic column counts, state mutation | `ProjectDeliveryPortal.jsx`, `EmployeePortal.jsx` |
| **Leads & CRM** | `leads`, `/leads` | Kanban pipeline, stage progression, add lead | Stage counters, value aggregation | `SalesCrmPortal.jsx` |
| **Proposals** | `proposals`, `/proposals` | Proposal listings, date & amount formatting | Currency format, status tags | `SalesCrmPortal.jsx` |
| **Contracts** | `contracts`, `/contracts` | Contract records table | Monospaced currency values, status badges | `SalesCrmPortal.jsx`, `ClientPortal.jsx` |
| **Meetings** | `meetings`, `/meetings` | Client consultation agenda cards | Date parsing, status badge | `SalesCrmPortal.jsx` |
| **Attendance** | `attendance`, `/attendance` | One-click Shift Check-in / Check-out button | Button spinner, time recording | `HrPortal.jsx`, `EmployeePortal.jsx` |
| **Leave Management** | `leaves`, `/leaves` | Leave application modal, Approve/Reject buttons | Status mutation, filterable list | `AdminPortal.jsx`, `HrPortal.jsx`, `EmployeePortal.jsx` |
| **Finance / Invoices** | `invoices`, `/finance` | Issue invoice modal, invoice tables | Amount calculations, due date validation | `AdminPortal.jsx` (Restricted), `ClientPortal.jsx` |
| **Careers & Hiring** | `careers`, `applications` | Job posting modal, applicant review | Active status indicator, job cards | `HrPortal.jsx` |
| **Support & SLA Tickets** | `tickets`, `/ticket` | Open ticket modal, ticket listing | Priority chips, status badges | `ClientPortal.jsx` |
| **Partner Alliances** | `partners`, `leads` | Referral tracking, alliance status | Tier tags, co-selling records | `PartnerPortal.jsx` |
| **Audit Logs** | `audit_logs`, `/audit-logs` | Security & action history table | Timestamp conversion, IP formatting | `AdminPortal.jsx` |

