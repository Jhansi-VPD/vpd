from pydantic import BaseModel
from app.models.enums import PartnerType
from app.schemas.common import TimestampedRead


class PartnerCreate(BaseModel):
    name: str
    partner_type: PartnerType
    logo: str | None = None
    website: str | None = None
    is_active: bool = True


class PartnerUpdate(BaseModel):
    name: str | None = None
    partner_type: PartnerType | None = None
    logo: str | None = None
    website: str | None = None
    is_active: bool | None = None


class PartnerOut(TimestampedRead):
    name: str
    partner_type: PartnerType
    logo: str | None = None
    website: str | None = None
    is_active: bool
