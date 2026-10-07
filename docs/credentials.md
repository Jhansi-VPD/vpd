# VPD Technologies — Demo Credentials

> **These are the only six accounts that can log in.** Every other account in the
> database is deactivated and the backend rejects any login outside this list.
> **All six use the password:** `Password123!`

---

## Portal Access Map

| Portal | URL Route |
|--------|-----------|
| Admin | `/admin` |
| Project Manager (Manager) | `/delivery` |
| HR | `/hr` |
| Sales | `/sales` |
| Client | `/client` |
| Employee | `/employee` |

---

## Credentials

| Role | Portal | Email | Password |
|------|--------|-------|----------|
| admin | Admin | admin@vpdtechnologies.com | `Password123!` |
| project_manager | Manager (Project Delivery) | pm@vpdtechnologies.com | `Password123!` |
| hr | HR | hr@vpdtechnologies.com | `Password123!` |
| sales | Sales | sales@vpdtechnologies.com | `Password123!` |
| client | Client | client@vpdtechnologies.com | `Password123!` |
| employee | Employee | employee@vpdtechnologies.com | `Password123!` |

---

## Access enforcement

1. **Backend login allowlist** — `POST /api/v1/auth/login` only accepts the six
   emails above (see `LOGIN_ALLOWLIST` in `backend/app/routers/auth.py`).
   Any other email is rejected with `401 Invalid email or password`, even if
   its password is correct.
2. **Deactivated accounts** — every user not in this list has `is_active=false`
   in the database; existing sessions for those accounts are revoked.
3. **Seeders** — `backend/seeds.py` / `backend/scripts/migrations/creds.json`
   only contain these six accounts, so re-seeding cannot resurrect others.
4. **Frontend** — the login page quick-select list and prefills contain only
   these six accounts, and login goes through the FastAPI backend only
   (no direct-database fallback).

> **Note:** Passwords are hashed using **Argon2id** in the database. The plain-text value shown above is for demo/testing purposes only. Do not use these credentials in production.
