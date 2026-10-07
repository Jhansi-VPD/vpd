import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.errors import ApiError
from app.models.client import Client
from app.models.client_file import ClientFile
from app.models.client_report import ClientReport
from app.models.invoice import Invoice
from app.models.meeting import Meeting
from app.models.project import Project
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.client import (
    ClientApprovalRequest,
    ClientFileOut,
    ClientInvoiceOut,
    ClientMeetingOut,
    ClientProfileOut,
    ClientProfileUpdate,
    ClientProjectOut,
    ClientReportOut,
    ClientTicketCreate,
    ClientTicketOut,
)
from app.utils.responses import success_response

router = APIRouter(
    prefix="/clients/me",
    tags=["Client Dashboard"],
    dependencies=[Depends(require_roles("client"))],
)


async def _get_client(db: AsyncSession, user: User) -> Client:
    client = (await db.execute(select(Client).where(Client.user_id == user.id))).scalar_one_or_none()
    if client is None:
        raise ApiError.not_found("Client profile not found")
    return client


@router.get("/profile", response_model=dict)
async def get_my_profile(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    return success_response(data=ClientProfileOut(
        id=client.id,
        name=current_user.name,
        email=current_user.email,
        company_name=client.company_name,
        industry=client.industry,
        country=client.country,
        website=client.website,
        billing_address=client.billing_address,
    ))


@router.put("/profile", response_model=dict)
async def update_my_profile(payload: ClientProfileUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    if payload.name:
        current_user.name = payload.name
    if payload.phone:
        current_user.phone = payload.phone
    if payload.company_name is not None:
        client.company_name = payload.company_name
    if payload.industry is not None:
        client.industry = payload.industry
    if payload.country is not None:
        client.country = payload.country
    if payload.website is not None:
        client.website = payload.website
    if payload.billing_address is not None:
        client.billing_address = payload.billing_address

    await db.commit()
    return success_response(message="Profile updated")


@router.get("/projects", response_model=dict)
async def get_my_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    result = await db.execute(select(Project).where(Project.client_id == client.id))
    return success_response(data=[ClientProjectOut.model_validate(p) for p in result.scalars().all()])


@router.get("/invoices", response_model=dict)
async def get_my_invoices(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    result = await db.execute(select(Invoice).where(Invoice.client_id == client.id))
    return success_response(data=[ClientInvoiceOut.model_validate(i) for i in result.scalars().all()])


@router.get("/tickets", response_model=dict)
async def get_my_tickets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Ticket).where(Ticket.created_by == current_user.id))
    return success_response(data=[ClientTicketOut.model_validate(t) for t in result.scalars().all()])


@router.post("/tickets", response_model=dict, status_code=201)
async def create_my_ticket(payload: ClientTicketCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = Ticket(
        subject=payload.subject,
        category=payload.category,
        description=payload.description,
        created_by=current_user.id,
        status="open",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return success_response(data=ClientTicketOut.model_validate(ticket), message="Ticket created", status_code=201)


@router.get("/meetings", response_model=dict)
async def get_my_meetings(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    result = await db.execute(select(Meeting).where(Meeting.client_id == client.id))
    return success_response(data=[ClientMeetingOut.model_validate(m) for m in result.scalars().all()])


@router.get("/files", response_model=dict)
async def get_my_files(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    result = await db.execute(select(ClientFile).where(ClientFile.client_id == client.id))
    return success_response(data=[ClientFileOut.model_validate(f) for f in result.scalars().all()])


@router.get("/reports", response_model=dict)
async def get_my_reports(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client(db, current_user)
    result = await db.execute(select(ClientReport).where(ClientReport.client_id == client.id))
    return success_response(data=[ClientReportOut.model_validate(r) for r in result.scalars().all()])


async def staff_upload_client_file(client_id: uuid.UUID, name: str, category: str, file_url: str, db: AsyncSession, current_user: User):
    client = (await db.execute(select(Client).where(Client.id == client_id))).scalar_one_or_none()
    if not client:
        raise ApiError.not_found("Client not found")
    if current_user.role not in {"admin", "super_admin"} and client.account_manager_id != current_user.id:
        raise ApiError.forbidden("Not assigned account manager")
    f = ClientFile(client_id=client_id, name=name, category=category, file_url=file_url, uploaded_by=current_user.id)
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return success_response(data=ClientFileOut.model_validate(f), message="File uploaded", status_code=201)


async def create_client_report(client_id: uuid.UUID, title: str, period: str, report_url: str, db: AsyncSession, current_user: User, summary: str | None = None):
    client = (await db.execute(select(Client).where(Client.id == client_id))).scalar_one_or_none()
    if not client:
        raise ApiError.not_found("Client not found")
    if current_user.role not in {"admin", "super_admin"} and client.account_manager_id != current_user.id:
        raise ApiError.forbidden("Not assigned account manager")
    r = ClientReport(client_id=client_id, title=title, period=period, report_url=report_url, summary=summary, created_by=current_user.id)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return success_response(data=ClientReportOut.model_validate(r), message="Report created", status_code=201)
