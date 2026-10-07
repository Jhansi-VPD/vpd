import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.utils.responses import success_response

router = APIRouter(prefix="/partners", tags=["Partners"])

@router.get("", response_model=dict)
async def list_partners(db: AsyncSession = Depends(get_db)):
    return success_response(data=[])

@router.get("/{id}", response_model=dict)
async def get_partner(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return success_response(data={})

@router.post("", response_model=dict, dependencies=[Depends(require_roles("admin"))])
async def create_partner(db: AsyncSession = Depends(get_db)):
    return success_response(data={})

@router.put("/{id}", response_model=dict, dependencies=[Depends(require_roles("admin"))])
async def update_partner(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return success_response(data={})

@router.delete("/{id}", response_model=dict, dependencies=[Depends(require_roles("admin"))])
async def delete_partner(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return success_response(data={})
