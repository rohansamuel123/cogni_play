from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


# ── New child-scoped session (used by the frontend) ─────────────────────────

class GameSessionCreate(BaseModel):
    """Schema matching the frontend GameSession interface."""
    game_key: str           # e.g. "color-recall"
    domain: str             # e.g. "memory"
    score: int              # raw score
    max_score: int          # max possible raw score
    accuracy: float         # 0-100
    time_taken: float       # seconds
    level: int              # highest level reached
    stars: int              # 1-3


class GameSessionResponse(BaseModel):
    session_id: int
    child_id: int
    game_key: str
    domain: str
    score: int
    max_score: int
    accuracy: float
    time_taken: float
    level: int
    stars: int
    played_at: datetime

    class Config:
        from_attributes = True


# ── Legacy schemas (kept for backwards compatibility) ──────────────────────

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