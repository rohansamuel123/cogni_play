from .base import Base
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class CognitiveScore(Base):
    __tablename__ = "cognitive_score"

    score_id=Column(Integer,primary_key=True)
    memory_score=Column(Integer,nullable=False)
    attention_score=Column(Integer,nullable=False)
    logic_score=Column(Integer,nullable=False)    
    user_id = Column(Integer, ForeignKey("users.user_id"))
    updated_at=Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())
    comprehension_score=Column(Integer,nullable=False)
    processing_speed_score=Column(Float, nullable=False)

    users = relationship("User", back_populates="cognitive_score")

