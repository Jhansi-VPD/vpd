import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PartnerType


class PartnerAccount(Base):
    """Partner organisation profile attached to a `partner`-role user (the
    Partner Portal login). Columns mirror the existing `partner_accounts`
    table — `User.partner_account` and `Ticket.partner_account` reference this
    model, so it must exist for SQLAlchemy mapper configuration (and therefore
    every ORM query, including login) to work."""

    __tablename__ = "partner_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    company_name: Mapped[str | None] = mapped_column(String(200))
    partnership_type: Mapped[PartnerType] = mapped_column(
        Enum(PartnerType, name="partner_type"), default=PartnerType.reseller
    )
    industry: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    website: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)
    account_manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id"), index=True
    )

    user = relationship("User", back_populates="partner_account")
