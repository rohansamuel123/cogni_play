from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import traceback

from app.database import get_db
from app.models.session import Session as GameSession
from app.models.child import Child
from app.models.user import User
from app.schemas.session import (
    SessionCreate, SessionResponse,
    GameSessionCreate, GameSessionResponse,
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


# ── New child-scoped endpoints ────────────────────────────────────────────────

@router.post("/child/{child_id}", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
def create_child_session(
    child_id: int,
    session_data: GameSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a game session for a specific child. Parent must own the child."""
    child = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")
    if child.parent_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    new_session = GameSession(
        user_id=current_user.user_id,
        child_id=child_id,
        game_key=session_data.game_key,
        domain=session_data.domain,
        score=session_data.score,
        max_score=session_data.max_score,
        accuracy=session_data.accuracy,
        time_taken=session_data.time_taken,
        level=session_data.level,
        stars=session_data.stars,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/child/{child_id}", response_model=List[GameSessionResponse])
def get_child_sessions(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all game sessions for a specific child."""
    child = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")
    if child.parent_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return (
        db.query(GameSession)
        .filter(GameSession.child_id == child_id)
        .order_by(GameSession.played_at.asc())
        .all()
    )


@router.delete("/child/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child_sessions(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all game sessions for a specific child."""
    child = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")
    if child.parent_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    db.query(GameSession).filter(GameSession.child_id == child_id).delete()
    db.commit()


# ── Legacy endpoints (kept for backwards compat) ─────────────────────────────

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