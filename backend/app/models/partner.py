import uuid
from sqlalchemy import Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import PartnerType


class Partner(Base):
    __tablename__ = "partners"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    partner_type: Mapped[PartnerType] = mapped_column(Enum(PartnerType, name="partner_type"), nullable=False)
    logo: Mapped[str | None] = mapped_column(String(500))
    website: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
