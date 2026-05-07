from .base import Base
from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

class Session(Base):
    __tablename__ = "game_sessions"

    session_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    child_id = Column(Integer, ForeignKey("children.child_id"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.game_id"), nullable=True)  # optional legacy FK
    game_key = Column(String(50), nullable=False)       # frontend game ID e.g. "color-recall"
    domain = Column(String(30), nullable=False)          # "memory", "attention", etc.
    score = Column(Integer)
    max_score = Column(Integer)
    accuracy = Column(Float)
    time_taken = Column(Float, nullable=True)
    level = Column(Integer, nullable=True)
    stars = Column(Integer, nullable=True)
    played_at = Column(DateTime(timezone=True), server_default=func.now())
    actions = Column(JSON)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="game_sessions")
    child = relationship("Child", back_populates="game_sessions")
    game = relationship("Game", back_populates="game_sessions")
    reports = relationship("Report", back_populates="session", cascade="all, delete")