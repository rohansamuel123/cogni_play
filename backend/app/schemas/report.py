from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Any

class ReportCreate(BaseModel):
    child_id: int
    session_id: Optional[int] = None
    strengths: Optional[Any] = None
    weaknesses: Optional[Any] = None
    recommendations: Optional[Any] = None
    readiness_level: Optional[int] = None
    readiness_label: Optional[str] = None
    next_game: Optional[str] = None
    difficulty_adjustment: Optional[str] = None
    behavioral_summary: Optional[Any] = None
    providers: Optional[Any] = None
    summary: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: int
    child_id: int
    session_id: Optional[int] = None
    strengths: Optional[Any] = None
    weaknesses: Optional[Any] = None
    recommendations: Optional[Any] = None
    readiness_level: Optional[int] = None
    readiness_label: Optional[str] = None
    next_game: Optional[str] = None
    difficulty_adjustment: Optional[str] = None
    behavioral_summary: Optional[Any] = None
    providers: Optional[Any] = None
    summary: Optional[str] = None
    created_at: datetime

    @field_validator("strengths", "weaknesses", "recommendations", mode="before")
    @classmethod
    def normalize_list_fields(cls, value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        return [str(value)]

    class Config:
        from_attributes = True

class ReportGenerateRequest(BaseModel):
    child_id: int
    cognitive_profile: Optional[Any] = None
