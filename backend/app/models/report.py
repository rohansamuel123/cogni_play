from .base import Base
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class Report(Base):
    __tablename__="reports"

    report_id=Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    strengths=Column(JSON)
    weaknesses=Column(JSON)
    recommendations=Column(JSON)
    readiness_level=Column(Integer)
    summary=Column(String)
    created_at=Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("users", back_populates="reports")

