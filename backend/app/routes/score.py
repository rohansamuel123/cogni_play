from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.score import CognitiveScoreResponse
from typing import List
from datetime import datetime

from app.services import score_service
from app.models.score import DomainScore, CognitiveHistory

router = APIRouter(prefix="/scores", tags=["Cognitive Scores"])

@router.get("/{child_id}", response_model=CognitiveScoreResponse)
def get_score(child_id: int, db: Session = Depends(get_db)):
    """
    Fetches the child's profile. Internally aggregates normalized domain rows 
    into a single object for frontend compatibility.
    """
    scores = score_service.get_aggregated_scores(db, child_id)
    
    # We return a response object that matches CognitiveScoreResponse schema
    return {
        "score_id": 0, # logical ID for schema
        "child_id": child_id,
        **scores,
        "updated_at": datetime.now() 
    }

@router.get("/{child_id}/history", response_model=List[dict])
def get_score_history(child_id: int, db: Session = Depends(get_db)):
    """
    Returns the chronological history of all score updates for progress charts.
    """
    history = db.query(CognitiveHistory).filter(
        CognitiveHistory.child_id == child_id
    ).order_by(CognitiveHistory.recorded_at.asc()).all()
    
    return [
        {
            "domain": h.domain,
            "score": h.score,
            "recorded_at": h.recorded_at
        } for h in history
    ]
