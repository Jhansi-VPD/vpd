# VPD Technologies — Portal Architecture & Route Map

## Overview
The VPD Technologies Integrated Operations Platform consists of role-based enterprise workspaces sharing unified authentication, theme design tokens, and live PostgreSQL backend storage.

| Role | Primary Portal | Base Route | Key Functional Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin / Admin** | Admin Portal | `/admin` | Workforce management, Departments, Projects, Finance (restricted), Audit Logs |
| **Finance** | Admin Portal | `/admin` (Finance) | Commercial Billing, Invoice generation, Revenue records |
| **Sales / Marketing** | Sales CRM Portal | `/sales` | Commercial Pipeline, Lead qualification, Proposals, Contracts, Meetings |
| **HR Manager / Exec** | HR Portal | `/hr` | Personnel Directory, Attendance tracking, Leave approvals, Careers & Hiring |
| **Project Manager** | Project Manager Portal | `/delivery` | Sprint Kanban Board, Milestones, Task tracking, Project budgets |
| **Employee / Dev / QA** | Employee Portal | `/employee` | Daily Tasks, Shift Check-in/Check-out, Leave applications, Timesheets, Notices |
| **Client** | Client Portal | `/client` | Active Deliverables, Milestone progress, Invoices, Support & SLA Tickets |
| **Partner** | Partner Portal | `/partner` | Alliance Accreditation, Co-selling initiatives, Commercial referrals |

---

## Route & Role Security Matrix

| Route | Minimum Allowed Roles | Backend Protection | Redirect on Unauthorized |
| :--- | :--- | :--- | :--- |
| `/login` | Public | None | N/A (Redirects to Role Portal if authenticated) |
| `/admin/*` | `super_admin`, `admin`, `finance` | Role-gated / RBAC | Role designated portal |
| `/sales/*` | `super_admin`, `sales`, `marketing` | Role-gated / RBAC | Role designated portal |
| `/hr/*` | `super_admin`, `hr`, `admin` | Role-gated / RBAC | Role designated portal |
| `/delivery/*` | `super_admin`, `project_manager`, `developer`, `qa` | Role-gated / RBAC | Role designated portal |
| `/employee/*` | `super_admin`, `employee`, `developer`, `qa`, `support`, `finance`, `hr`, `sales` | Role-gated / RBAC | Role designated portal |
| `/client/*` | `super_admin`, `client` | Role-gated / RBAC | Role designated portal |
| `/partner/*` | `super_admin`, `partner` | Role-gated / RBAC | Role designated portal |

