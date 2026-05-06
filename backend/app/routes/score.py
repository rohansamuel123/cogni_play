from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.score import CognitiveScore
from app.schemas.score import CognitiveScoreCreate, CognitiveScoreResponse

router = APIRouter(prefix="/scores", tags=["Cognitive Scores"])

@router.post("/", response_model=CognitiveScoreResponse)
def create_score(score: CognitiveScoreCreate, db: Session = Depends(get_db)):
    existing = db.query(CognitiveScore).filter(CognitiveScore.user_id == score.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Score already exists for this user")
    new_score = CognitiveScore(**score.dict())
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score

@router.get("/{user_id}", response_model=CognitiveScoreResponse)
def get_score(user_id: int, db: Session = Depends(get_db)):
    score = db.query(CognitiveScore).filter(CognitiveScore.user_id == user_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Score not found for this user")
    return score

@router.put("/{user_id}", response_model=CognitiveScoreResponse)
def update_score(user_id: int, score: CognitiveScoreCreate, db: Session = Depends(get_db)):
    existing = db.query(CognitiveScore).filter(CognitiveScore.user_id == user_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Score not found for this user")
    for key, value in score.dict().items():
        setattr(existing, key, value)
    db.commit()
    db.refresh(existing)
    return existing