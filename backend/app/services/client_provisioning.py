import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.enums import UserRole
from app.models.lead import Lead
from app.models.user import User


async def get_or_create_client_user(db: AsyncSession, email: str, name: str, phone: str | None = None) -> tuple[User, str]:
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    temp_pass = "Welcome123!"
    if not user:
        user = User(name=name, email=email, phone=phone, role=UserRole.client, password_hash="hashed_welcome_pass")
        db.add(user)
        await db.flush()
    return user, temp_pass


async def get_or_create_client_record(db: AsyncSession, user_id: uuid.UUID, company_name: str | None = None, account_manager_id: uuid.UUID | None = None) -> Client:
    client = (await db.execute(select(Client).where(Client.user_id == user_id))).scalar_one_or_none()
    if not client:
        client = Client(user_id=user_id, company_name=company_name, account_manager_id=account_manager_id)
        db.add(client)
        await db.flush()
    return client


async def send_client_welcome(user: User, temp_pass: str):
    pass


async def provision_client_account(db: AsyncSession, lead_id: uuid.UUID) -> Client:
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise ValueError("Lead not found")
    user, temp_pass = await get_or_create_client_user(db, email=lead.email, name=lead.contact_name, phone=lead.phone)
    client = await get_or_create_client_record(db, user_id=user.id, company_name=lead.company, account_manager_id=lead.owner_id)
    lead.converted_client_id = client.id
    lead.status = "won"
    await db.commit()
    await db.refresh(client)
    return client
