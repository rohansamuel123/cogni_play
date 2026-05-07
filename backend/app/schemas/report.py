from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class ReportCreate(BaseModel):
    child_id: int
    session_id: Optional[int] = None
    strengths: Optional[Any] = None
    weaknesses: Optional[Any] = None
    recommendations: Optional[Any] = None
    readiness_level: Optional[int] = None
    summary: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: int
    child_id: int
    session_id: Optional[int] = None
    strengths: Optional[Any] = None
    weaknesses: Optional[Any] = None
    recommendations: Optional[Any] = None
    readiness_level: Optional[int] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
