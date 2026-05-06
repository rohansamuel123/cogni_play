from pydantic import BaseModel
from datetime import datetime

class CognitiveScoreCreate(BaseModel):
    user_id: int
    memory_score: int
    attention_score: int
    logic_score: int
    comprehension_score: int
    processing_speed_score: float

class CognitiveScoreResponse(BaseModel):
    score_id: int
    user_id: int
    memory_score: int
    attention_score: int
    logic_score: int
    comprehension_score: int
    processing_speed_score: float
    updated_at: datetime

    class Config:
        from_attributes = True