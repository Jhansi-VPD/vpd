import uuid
from datetime import date
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.crud.base import CRUDBase
from app.models.leave import Leave
from app.models.user import User
from app.schemas.employee import LeaveOut, LeaveApply, LeaveStatusUpdate
from app.utils.pagination import PageParams, page_params
from app.utils.responses import success_response
from app.models.enums import LeaveStatus

router = APIRouter(prefix="/leave-requests", tags=["Leaves"], dependencies=[Depends(require_roles("admin", "hr", "super_admin", "employee"))])

crud = CRUDBase(Leave, searchable_fields=["reason"])

@router.get("", response_model=dict)
async def list_leaves(request: Request, db: AsyncSession = Depends(get_db), page: PageParams = Depends(page_params)):
    filters = {}
    if employee_id := request.query_params.get("employee_id"):
        filters["employee_id"] = employee_id
    if status := request.query_params.get("status"):
        filters["status"] = status

    items, total = await crud.list(db, page, filters=filters)
    return {"items": items, "total": total, "page": page.page, "size": page.size}

@router.post("", response_model=dict)
async def apply_leave(data: LeaveApply, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Needs actual employee_id logic, but for simplicity we rely on data or current_user logic.
    # We will assume frontend sends what it needs or we extract from user.employee.id
    obj_data = data.model_dump()
    if getattr(current_user, "employee", None):
        obj_data["employee_id"] = current_user.employee.id
    else:
        # Fallback if employee is not loaded on user
        pass
    
    record = await crud.create(db, obj_in=obj_data)
    return success_response(data=LeaveOut.model_validate(record).model_dump(mode="json"), message="Leave request submitted.")

@router.patch("/{id}/status", response_model=dict)
async def update_leave_status(id: uuid.UUID, data: LeaveStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj_data = {"status": data.status}
    if data.status in [LeaveStatus.approved, LeaveStatus.rejected]:
        obj_data["approved_by"] = current_user.id

    record = await crud.update(db, id, obj_in=obj_data)
    return success_response(data=LeaveOut.model_validate(record).model_dump(mode="json"), message=f"Leave request {data.status}.")

