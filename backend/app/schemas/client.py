import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.common import TimestampedRead


class ClientCreate(BaseModel):
    user_id: uuid.UUID
    company_name: str | None = None
    industry: str | None = None
    country: str | None = None
    website: str | None = None
    billing_address: str | None = None
    account_manager_id: uuid.UUID | None = None


class ClientUpdate(BaseModel):
    company_name: str | None = None
    industry: str | None = None
    country: str | None = None
    website: str | None = None
    billing_address: str | None = None
    account_manager_id: uuid.UUID | None = None


class ClientOut(TimestampedRead):
    user_id: uuid.UUID
    company_name: str | None = None
    industry: str | None = None
    country: str | None = None
    website: str | None = None
    billing_address: str | None = None
    account_manager_id: uuid.UUID | None = None


class ClientProfileOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    company_name: str | None = None
    industry: str | None = None
    country: str | None = None
    website: str | None = None
    billing_address: str | None = None


class ClientProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    industry: str | None = None
    country: str | None = None
    website: str | None = None
    billing_address: str | None = None


class ClientProjectOut(TimestampedRead):
    name: str
    status: str
    description: str | None = None


class ClientProjectUpdateOut(TimestampedRead):
    title: str
    content: str


class ClientInvoiceOut(TimestampedRead):
    invoice_number: str
    amount: float
    status: str


class ClientTicketOut(TimestampedRead):
    subject: str
    status: str
    category: str = "general"


class ClientTicketCreate(BaseModel):
    subject: str
    category: str = "general"
    description: str


class ClientMeetingOut(TimestampedRead):
    title: str
    scheduled_at: datetime
    status: str


class ClientFileOut(TimestampedRead):
    name: str
    category: str
    file_url: str


class ClientReportOut(TimestampedRead):
    title: str
    period: str
    report_url: str
    summary: str | None = None


class ClientApprovalRequest(BaseModel):
    comment: str | None = None
