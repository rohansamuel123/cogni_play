from .base import Base
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class CognitiveScore(Base):
    """
    Legacy single-row cognitive score table kept in sync for compatibility.
    New code should prefer DomainScore rows, but this table is useful for
    dashboards/admin tools that still inspect cognitive_score directly.
    """
    __tablename__ = "cognitive_score"

    score_id = Column(Integer, primary_key=True)
    memory_score = Column(Integer, nullable=False, default=0)
    attention_score = Column(Integer, nullable=False, default=0)
    logic_score = Column(Integer, nullable=False, default=0)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    child_id = Column(Integer, ForeignKey("children.child_id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    comprehension_score = Column(Integer, nullable=False, default=0)
    processing_speed_score = Column(Float, nullable=False, default=0.0)

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
