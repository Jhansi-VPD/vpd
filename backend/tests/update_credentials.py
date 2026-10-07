"""
Enforce the six canonical VPD demo logins (vpd/docs/credentials.md).

What it does:
1. Resets every account listed in scripts/migrations/creds.json to its fixed
   password (`Password123!`), the role matching its creds.json key, and an
   active/unlocked/no-MFA state so password login always works.
2. Deactivates every OTHER account in the database and revokes all of its
   sessions, so nothing outside LOGIN_ALLOWLIST (app/routers/auth.py) can
   establish a session even if its password is correct.

Standalone maintenance script — not part of the automated pytest suite (no
test_ functions). Run from the backend/ directory with the venv active:

    python tests/update_credentials.py

Idempotent: safe to re-run any time (e.g. after a re-seed).
"""
import asyncio
import os
import sys
import getpass

from sqlalchemy import delete, select, update

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.core.password import hash_password
from app.models.user import User
from app.models.user_session import UserSession
from app.routers.auth import LOGIN_ALLOWLIST
from app.seeders import seed

SUPER_ADMIN_EMAIL = "superadmin@vpdtechnologies.com"
ADMIN_EMAIL = "admin@vpdtechnologies.com"

SUPER_ADMIN_PASSWORD = os.environ.get("SUPER_ADMIN_PASSWORD") or getpass.getpass(f"Password for {SUPER_ADMIN_EMAIL}: ")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD") or getpass.getpass(f"Password for {ADMIN_EMAIL}: ")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        allowed = {email.strip().lower() for email in LOGIN_ALLOWLIST}
        cred_emails = {account["email"].strip().lower() for account in seed.CREDS.values()}
        if cred_emails != allowed:
            raise SystemExit(
                "creds.json and LOGIN_ALLOWLIST disagree — align them first.\n"
                f"  creds.json only: {sorted(cred_emails - allowed)}\n"
                f"  allowlist only:  {sorted(allowed - cred_emails)}"
            )

        # 1. The six allowed accounts: fixed password, canonical role, usable state.
        for role_key, account in seed.CREDS.items():
            result = await db.execute(
                update(User)
                .where(User.email == account["email"])
                .values(
                    role=role_key,
                    password_hash=hash_password(account["password"]),
                    is_active=True,
                    failed_login_attempts=0,
                    is_locked=False,
                    locked_until=None,
                    mfa_enabled=False,
                    is_email_verified=True,
                )
            )
            if result.rowcount:
                print(f"[OK]      {account['email']}  role={role_key}  password reset")

        # 2. Verify final state
        print("\n=== Final user state ===")
        for email in ADMIN_EMAIL:
            user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
            if user:
                print(f"  {user.email}  role={user.role}  name={user.name}")
            else:
                print(f"[MISSING] {email} not in DB — run scripts/migrations/002_seed_users.py")

        # 2. Everyone else: deactivated, sessions revoked.
        blocked = await db.execute(
            update(User)
            .where(User.email.notin_(list(LOGIN_ALLOWLIST)))
            .values(is_active=False, is_locked=False, locked_until=None)
        )
        revoked = await db.execute(
            delete(UserSession).where(
                UserSession.user_id.in_(
                    select(User.id).where(User.email.notin_(list(LOGIN_ALLOWLIST)))
                )
            )
        )
        await db.commit()

        print(f"[BLOCKED] {blocked.rowcount} non-allowlisted account(s) deactivated; "
              f"{revoked.rowcount} session(s) revoked.")

        roster = (await db.execute(
            select(User.email, User.role, User.is_active).order_by(User.email)
        )).all()
        active = [r for r in roster if r[2]]
        print(f"\n=== {len(active)} active login(s) / {len(roster)} total account(s) ===")
        for email, role, is_active in roster:
            marker = "LOGIN " if is_active else "blocked"
            print(f"  [{marker}] {email}  role={role}")


if __name__ == "__main__":
    asyncio.run(main())