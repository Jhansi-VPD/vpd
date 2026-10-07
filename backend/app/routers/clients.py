from app.services.notification_service import notify_roles
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


@router.post("/{client_id}/files", response_model=dict, dependencies=[Depends(require_roles("admin", "project_manager", "sales", "account_manager"))])
async def staff_upload_client_file(client_id: uuid.UUID, name: str, category: str, file_url: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
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


@router.post("/{client_id}/reports", response_model=dict, dependencies=[Depends(require_roles("admin", "project_manager", "sales", "account_manager"))])
async def create_client_report(client_id: uuid.UUID, title: str, period: str, report_url: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), summary: str | None = None):
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

# Aliases for tests
_get_client_for_user = _get_client

from app.models.proposal import Proposal
from app.models.enums import ProposalStatus, LeadStatus
from app.models.lead import Lead
from app.services.project_provisioning import provision_project_for_accepted_proposal

@router.post("/me/proposals/{proposal_id}/accept", response_model=dict)
async def accept_my_proposal(proposal_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client_for_user(db, current_user)
    
    stmt = select(Proposal).where(Proposal.id == proposal_id)
    result = await db.execute(stmt)
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise ApiError(404, "Proposal not found")
        
    stmt2 = select(Lead).where(Lead.id == proposal.lead_id)
    result2 = await db.execute(stmt2)
    lead = result2.scalar_one_or_none()
    
    if proposal.status != ProposalStatus.sent:
        raise ApiError(400, "Only sent proposals can be accepted")
        
    proposal.status = ProposalStatus.accepted
    if lead:
        lead.status = LeadStatus.proposal_approved
        
    await provision_project_for_accepted_proposal(db, proposal)
    
    await notify_roles(["admin", "sales"], "Proposal Accepted", f"Proposal accepted", db)
    await db.commit()
    await db.refresh(proposal)
    return success_response(data={"id": str(proposal.id)}, message="Proposal accepted")

from app.models.project import Project

@router.post("/me/projects/{project_id}/approve", response_model=dict)
async def approve_project_manager(project_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client_for_user(db, current_user)
    
    stmt = select(Project).where(Project.id == project_id, Project.client_id == client.id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise ApiError(404, "Project not found")
        
    if project.client_review_status != "pending":
        raise ApiError(400, "Delivery not pending review")
        
    project.client_review_status = "approved"
    project.final_delivery_version = (project.final_delivery_version or 0) + 1
    from datetime import datetime, UTC
    project.client_approved_at = datetime.now(UTC)
    await db.commit()
    return success_response(message="Project delivery approved")

from app.models.project_deliverable import ProjectDeliverable

@router.get("/me/projects/{project_id}/deliverables", response_model=dict)
async def my_project_deliverables(project_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = await _get_client_for_user(db, current_user)
    
    stmt = select(Project).where(Project.id == project_id, Project.client_id == client.id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise ApiError(404, "Project not found")
        
    stmt = select(ProjectDeliverable).where(
        ProjectDeliverable.project_id == project.id,
        ProjectDeliverable.status == "submitted"
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return success_response(data=items, message="Deliverables fetched")

from app.utils.pagination import PageParams, page_params





@router.get("/me/payments", response_model=dict, dependencies=[Depends(get_current_user)])
async def client_me_payments(db: AsyncSession = Depends(get_db)):
    return success_response(data=[])
