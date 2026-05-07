from .base import Base
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey("children.child_id"), nullable=False)
    session_id = Column(Integer, ForeignKey("game_sessions.session_id"), nullable=True) # AI can report on specific sessions or overall
    
    summary = Column(String)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    recommendations = Column(JSON)
    readiness_level = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="reports")
    session = relationship("Session", back_populates="reports")


