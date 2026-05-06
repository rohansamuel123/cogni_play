from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import Session as GameSession
from app.schemas.session import SessionCreate, SessionResponse
from typing import List
import traceback

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/", response_model=SessionResponse)
def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    try:
        data = session.dict()
        if data.get("start_time") and data.get("end_time"):
            delta = data["end_time"] - data["start_time"]
            data["time_taken"] = delta.total_seconds()
        new_session = GameSession(**data)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[SessionResponse])
def get_all_sessions(db: Session = Depends(get_db)):
    return db.query(GameSession).all()

@router.get("/user/{user_id}", response_model=List[SessionResponse])
def get_sessions_by_user(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(GameSession).filter(GameSession.user_id == user_id).all()
    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found for this user")
    return sessions

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session