from .base import Base
from sqlalchemy import Column, Integer, Float, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

class Session(Base):
    __tablename__ = "game_sessions"

    session_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    game_id = Column(Integer, ForeignKey("games.game_id"))
    score = Column(Integer)
    accuracy = Column(Float)
    played_at = Column(DateTime(timezone=True), server_default=func.now())
    actions = Column(JSON)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), server_default=func.now())
    time_taken = Column(DateTime, default=(start_time - end_time))
    
    users = relationship("User", back_populates="game_sessions")
    games = relationship("Game", back_populates="game_sessions")



    