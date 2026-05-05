from .base import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum, func
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    user_id= Column(Integer, primary_key=True)
    name= Column(String(50), nullable=False)
    age= Column(Integer)
    gender= Column(Enum("Male", "Female", "Other", name="gender_enum"), nullable=False)
    email= Column(String(100))
    created_at= Column(DateTime(timezone=True), server_default=func.now())

    reports = relationship("Report", back_populates="user", cascade="all, delete")
    cognitive_score = relationship("CognitiveScore", back_populates="user", uselist=False )
    game_sessions = relationship("Session", back_populates="user",cascade="all, delete")
    

