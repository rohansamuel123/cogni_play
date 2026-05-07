from .base import Base
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class DomainScore(Base):
    """
    Stores the current 'best' score for a specific child in a specific domain.
    Eliminates empty columns by only having rows for domains actually played.
    """
    __tablename__ = "domain_scores"

    id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey("children.child_id"), nullable=False)
    domain = Column(String(30), nullable=False)  # 'memory', 'attention', etc.
    score = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Ensure a child only has one row per domain
    __table_args__ = (UniqueConstraint('child_id', 'domain', name='_child_domain_uc'),)

    child = relationship("Child", back_populates="domain_scores")


class CognitiveHistory(Base):
    """
    Stores a chronological log of every score update.
    Used for progress charts and growth analysis.
    """
    __tablename__ = "cognitive_history"

    history_id = Column(Integer, primary_key=True)
    child_id = Column(Integer, ForeignKey("children.child_id"), nullable=False)
    domain = Column(String(30), nullable=False)
    score = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="cognitive_history")
