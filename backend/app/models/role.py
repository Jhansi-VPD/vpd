from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.associations import role_permissions


class Role(Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Portal this role lands in after login. Mirrors the frontend ROLE_HOME
    # map (src/auth/role-route.tsx); NULL means "no portal" (guest).
    portal: Mapped[str | None] = mapped_column(String(50))

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
