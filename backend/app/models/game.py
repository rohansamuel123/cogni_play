from .base import Base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Game(Base):
    __tablename__ = 'games'

    game_id = Column(Integer, primary_key=True)
    game_name = Column(String(100), nullable=False)
    game_description = Column(String(1000), nullable=False)
    game_type = Column(String(100), nullable=False)
    game_difficulty = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="games")
