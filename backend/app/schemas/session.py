from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class SessionCreate(BaseModel):
    user_id: int
    game_id: int
    score: int
    accuracy: float
    actions: Optional[Any] = None
    start_time: datetime
    end_time: datetime
    time_taken: Optional[float] = None

class SessionResponse(BaseModel):
    session_id: int
    user_id: int
    game_id: int
    score: int
    accuracy: float
    actions: Optional[Any] = None
    played_at: datetime
    start_time: datetime
    end_time: Optional[datetime] = None
    time_taken: Optional[float] = None

    class Config:
        from_attributes = True