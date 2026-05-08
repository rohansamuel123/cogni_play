from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.ai.openClaw import run_openclaw_pipeline
from app.models.child import Child
from app.models.report import Report
from app.models.score import DomainScore
from app.models.session import Session as GameSession
from app.models.user import User


def _readiness_to_int(label: str) -> int:
    normalized = (label or "").strip().lower()
    if any(word in normalized for word in ("advanced", "high", "ready", "strong")):
        return 3
    if any(word in normalized for word in ("developing", "emerging", "medium", "moderate")):
        return 2
    return 1


def _session_payload(sessions: List[GameSession]) -> List[Dict[str, Any]]:
    return [
        {
            "session_id": session.session_id,
            "game_key": session.game_key,
            "domain": session.domain,
            "score": session.score,
            "max_score": session.max_score,
            "accuracy": session.accuracy,
            "time_taken": session.time_taken,
            "level": session.level,
            "stars": session.stars,
            "played_at": session.played_at,
        }
        for session in sessions
    ]


def build_child_cognitive_profile(db: Session, child_id: int, current_user: User) -> Dict[str, Any]:
    child = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        raise ValueError("Child not found.")
    if child.parent_id != current_user.user_id:
        raise PermissionError("Access denied.")

    scores = db.query(DomainScore).filter(DomainScore.child_id == child_id).all()
    sessions = (
        db.query(GameSession)
        .filter(GameSession.child_id == child_id)
        .order_by(GameSession.played_at.asc())
        .all()
    )

    domain_scores = [
        {
            "domain": score.domain,
            "score": score.score,
            "updated_at": score.updated_at,
        }
        for score in scores
    ]

    active_scores = [score.score for score in scores]
    overall_score = sum(active_scores) / len(active_scores) if active_scores else 0

    return {
        "child": {
            "child_id": child.child_id,
            "name": child.name,
            "age": child.age,
            "gender": child.gender,
        },
        "overall_score": overall_score,
        "domain_scores": domain_scores,
        "sessions": _session_payload(sessions),
        "total_sessions": len(sessions),
    }


def generate_child_report(db: Session, child_id: int, current_user: User) -> Report:
    profile = build_child_cognitive_profile(db, child_id, current_user)
    ai_report = run_openclaw_pipeline(profile)

    latest_session_id = None
    if profile["sessions"]:
        latest_session_id = profile["sessions"][-1]["session_id"]

    readiness_label = ai_report.get("readiness_level") or "Emerging"

    report = Report(
        child_id=child_id,
        session_id=latest_session_id,
        summary=ai_report.get("summary"),
        strengths=ai_report.get("strengths", []),
        weaknesses=ai_report.get("weaknesses", []),
        recommendations=ai_report.get("recommendations", []),
        readiness_level=_readiness_to_int(readiness_label),
        readiness_label=readiness_label,
        next_game=ai_report.get("next_game"),
        difficulty_adjustment=ai_report.get("difficulty_adjustment"),
        behavioral_summary=ai_report.get("behavioral_summary", {}),
        providers=ai_report.get("providers", {}),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
