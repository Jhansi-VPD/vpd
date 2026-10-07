from app.crud.base import CRUDBase
from app.models.partner import Partner
from app.schemas.partner import PartnerCreate, PartnerOut, PartnerUpdate
from app.utils.router_factory import build_crud_router

crud = CRUDBase(Partner, searchable_fields=["name"])

router = build_crud_router(
    crud, PartnerCreate, PartnerUpdate, PartnerOut,
    prefix="/partners", tags=["CMS — Partners"],
    public_read=True, write_roles=["admin"],
)
