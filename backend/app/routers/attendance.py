import uuid
from datetime import date, time
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.crud.base import CRUDBase
from app.models.attendance import Attendance
from app.schemas.employee import AttendanceOut
from app.utils.pagination import PageParams, page_params
from app.utils.responses import success_response
from pydantic import BaseModel
from app.models.enums import AttendanceStatus

class AttendanceCreate(BaseModel):
    employee_id: uuid.UUID
    date: date
    check_in: time | None = None
    check_out: time | None = None
    status: AttendanceStatus = AttendanceStatus.present
    notes: str | None = None

class AttendanceUpdate(BaseModel):
    check_in: time | None = None
    check_out: time | None = None
    status: AttendanceStatus | None = None
    notes: str | None = None

router = APIRouter(prefix="/attendance", tags=["Attendance"], dependencies=[Depends(require_roles("admin", "hr", "super_admin"))])

crud = CRUDBase(Attendance, searchable_fields=["notes"])

@router.get("", response_model=dict)
async def list_attendance(request: Request, db: AsyncSession = Depends(get_db), page: PageParams = Depends(page_params)):
    filters = {}
    if employee_id := request.query_params.get("employee_id"):
        filters["employee_id"] = employee_id
    if target_date := request.query_params.get("date"):
        filters["date"] = target_date

    return await crud.get_paginated(db, page, filters=filters)

@router.post("", response_model=dict)
async def create_attendance(data: AttendanceCreate, db: AsyncSession = Depends(get_db)):
    record = await crud.create(db, obj_in=data.model_dump())
    return success_response(data=AttendanceOut.model_validate(record).model_dump(mode="json"), message="Attendance recorded.")

@router.put("/{id}", response_model=dict)
async def update_attendance(id: uuid.UUID, data: AttendanceUpdate, db: AsyncSession = Depends(get_db)):
    record = await crud.update(db, id, obj_in=data.model_dump(exclude_unset=True))
    return success_response(data=AttendanceOut.model_validate(record).model_dump(mode="json"), message="Attendance updated.")
