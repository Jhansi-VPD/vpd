import uuid
from datetime import date
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.crud.base import CRUDBase
from app.models.timesheet import Timesheet
from app.models.user import User
from app.schemas.employee import TimesheetOut, TimesheetCreate, TimesheetStatusUpdate
from app.utils.pagination import PageParams, page_params
from app.utils.responses import build_pagination_meta, success_response
from app.models.enums import TimesheetStatus

router = APIRouter(prefix="/timesheets", tags=["Timesheets"], dependencies=[Depends(require_roles("admin", "hr", "super_admin", "employee", "project_manager"))])

crud = CRUDBase(Timesheet, searchable_fields=["description"])

@router.get("", response_model=dict)
async def list_timesheets(request: Request, db: AsyncSession = Depends(get_db), page: PageParams = Depends(page_params)):
    filters = {}
    if employee_id := request.query_params.get("employee_id"):
        filters["employee_id"] = employee_id
    if project_id := request.query_params.get("project_id"):
        filters["project_id"] = project_id
    if status := request.query_params.get("status"):
        filters["status"] = status

    items, total = await crud.list(db, page, filters=filters)
    meta = build_pagination_meta(total, page.page, page.limit)
    return success_response(
        data=[TimesheetOut.model_validate(m).model_dump(mode="json") for m in items],
        message="Timesheets fetched",
        meta=meta,
    )

@router.post("", response_model=dict)
async def create_timesheet(data: TimesheetCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj_data = data.model_dump()
    if getattr(current_user, "employee", None):
        obj_data["employee_id"] = current_user.employee.id
    
    record = await crud.create(db, obj_in=obj_data)
    return success_response(data=TimesheetOut.model_validate(record).model_dump(mode="json"), message="Timesheet logged.")

@router.put("/{id}", response_model=dict)
async def update_timesheet(id: uuid.UUID, data: TimesheetCreate, db: AsyncSession = Depends(get_db)):
    record = await crud.update(db, id, obj_in=data.model_dump(exclude_unset=True))
    return success_response(data=TimesheetOut.model_validate(record).model_dump(mode="json"), message="Timesheet updated.")

@router.patch("/{id}/status", response_model=dict)
async def update_timesheet_status(id: uuid.UUID, data: TimesheetStatusUpdate, db: AsyncSession = Depends(get_db)):
    record = await crud.update(db, id, obj_in={"status": data.status})
    return success_response(data=TimesheetOut.model_validate(record).model_dump(mode="json"), message=f"Timesheet {data.status}.")

