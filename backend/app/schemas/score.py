from pydantic import BaseModel
from datetime import datetime

class CognitiveScoreCreate(BaseModel):
    child_id: int
    memory_score: float
    attention_score: float
    logic_score: float
    comprehension_score: float
    processing_speed_score: float
    overall_score: float

class CognitiveScoreResponse(BaseModel):
    score_id: int
    child_id: int
    memory_score: float
    attention_score: float
    logic_score: float
    comprehension_score: float
    processing_speed_score: float
    overall_score: float
    updated_at: datetime

    class Config:
        from_attributes = True