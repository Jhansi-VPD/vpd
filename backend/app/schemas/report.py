import uuid

from pydantic import BaseModel

from app.schemas.common import TimestampedRead


class ReportGenerate(BaseModel):
    title: str
    report_type: str
    period: str
    summary: str | None = None


class ReportOut(TimestampedRead):
    title: str
    report_type: str
    period: str
    generated_by: uuid.UUID | None = None
    file_url: str | None = None
    size_bytes: int | None = None
    summary: str | None = None
