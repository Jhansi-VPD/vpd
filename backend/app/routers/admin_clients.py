import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.utils.responses import success_response
from app.utils.pagination import PageParams, page_params

router = APIRouter(prefix="/clients", tags=["Admin Clients"])

@router.get("", response_model=dict, dependencies=[Depends(require_roles("admin", "sales"))])
async def list_clients(db: AsyncSession = Depends(get_db)):
    return success_response(data=[])

@router.post("", response_model=dict, dependencies=[Depends(require_roles("admin", "sales"))])
async def create_client(db: AsyncSession = Depends(get_db)):
    return success_response(data={})
