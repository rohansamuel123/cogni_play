from .base import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship


class Child(Base):
    __tablename__ = "children"

    child_id    = Column(Integer, primary_key=True, index=True)
    parent_id   = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    name        = Column(String(50), nullable=False)
    age         = Column(Integer, nullable=False)
    gender      = Column(Enum("Male", "Female", "Other", name="child_gender_enum"), nullable=False)
    avatar      = Column(String(10), nullable=True)   # emoji or initials stored as a string
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    parent = relationship("User", back_populates="children")
    game_sessions = relationship("Session", back_populates="child", cascade="all, delete")
