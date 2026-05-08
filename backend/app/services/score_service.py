from sqlalchemy.orm import Session
from app.models.session import Session as GameSession
from app.models.score import CognitiveScore, DomainScore, CognitiveHistory
from typing import Dict, List

def normalize_session_score(session: GameSession) -> int:
    """Normalize raw gameplay metrics into a deterministic 0-100 score."""
    accuracy = min(100.0, float(session.accuracy or 0))
    level = float(session.level or 1)
    max_level = 3.0
    time_taken = float(session.time_taken or 60)

    level_score = min(100.0, (level / max_level) * 100)
    speed_score = max(0.0, 100 - (time_taken / 60) * 100)

    return round((accuracy * 0.5) + (level_score * 0.3) + (speed_score * 0.2))

def recalculate_child_scores(db: Session, child_id: int):
    """
    Recalculates the aggregated cognitive profile for a child and logs history.
    Logic:
    1. Find best score per game within each domain.
    2. Update normalized DomainScore rows (no empty columns).
    3. Log current state to CognitiveHistory for progress tracking.
    """
    
    # 1. Get all sessions for this child
    sessions = db.query(GameSession).filter(GameSession.child_id == child_id).all()
    
    if not sessions:
        return None

    # 2. Find best score per game_key to aggregate domains
    best_per_game: Dict[str, Dict] = {}
    for s in sessions:
        normalized_score = normalize_session_score(s)
        if s.game_key not in best_per_game or normalized_score > best_per_game[s.game_key]["score"]:
            best_per_game[s.game_key] = {"score": normalized_score, "domain": s.domain}

    # 3. Group by domain
    domain_data: Dict[str, List[float]] = {}
    for data in best_per_game.values():
        domain = data["domain"]
        if domain not in domain_data:
            domain_data[domain] = []
        domain_data[domain].append(float(data["score"]))

    # 4. Upsert DomainScore rows and log History
    updated_domains = []
    for domain, scores in domain_data.items():
        avg_score = sum(scores) / len(scores)
        
        # Update/Create the 'current best' record
        record = db.query(DomainScore).filter(
            DomainScore.child_id == child_id, 
            DomainScore.domain == domain
        ).first()
        
        if not record:
            record = DomainScore(child_id=child_id, domain=domain)
            db.add(record)
        
        record.score = avg_score
        updated_domains.append(record)

        # Log to History for charts
        history_entry = CognitiveHistory(
            child_id=child_id,
            domain=domain,
            score=avg_score
        )
        db.add(history_entry)

    db.commit()
    sync_legacy_cognitive_score(db, child_id)
    return updated_domains

def sync_legacy_cognitive_score(db: Session, child_id: int):
    """
    Keep the legacy cognitive_score table populated from deterministic scores.
    The legacy table originally only had user_id, so we store parent_id there
    and add child_id for child-scoped score rows.
    """
    from app.models.child import Child

    child = db.query(Child).filter(Child.child_id == child_id).first()
    if not child:
        return None

    scores = get_aggregated_scores(db, child_id)
    record = db.query(CognitiveScore).filter(CognitiveScore.child_id == child_id).first()

    if not record:
        record = CognitiveScore(user_id=child.parent_id, child_id=child_id)
        db.add(record)
    else:
        record.user_id = child.parent_id

    record.memory_score = round(scores["memory_score"])
    record.attention_score = round(scores["attention_score"])
    record.logic_score = round(scores["logic_score"])
    record.comprehension_score = round(scores["comprehension_score"])
    record.processing_speed_score = scores["processing_speed_score"]

    db.commit()
    db.refresh(record)
    return record

def get_aggregated_scores(db: Session, child_id: int) -> Dict[str, float]:
    """
    Helper to aggregate normalized rows back into a single object for the frontend.
    Returns: { "memory_score": 85, "logic_score": 40, "overall_score": 62.5, ... }
    """
    rows = db.query(DomainScore).filter(DomainScore.child_id == child_id).all()
    
    # Map back to the frontend expected keys
    result = {
        "memory_score": 0.0,
        "attention_score": 0.0,
        "logic_score": 0.0,
        "comprehension_score": 0.0,
        "processing_speed_score": 0.0,
        "overall_score": 0.0
    }
    
    total_score = 0.0
    active_domains = 0
    
    for row in rows:
        key = f"{row.domain}_score"
        if key in result:
            result[key] = row.score
            total_score += row.score
            active_domains += 1
        elif row.domain == "processing_speed": # handle alias if needed
            result["processing_speed_score"] = row.score
            total_score += row.score
            active_domains += 1

    if active_domains > 0:
        result["overall_score"] = total_score / active_domains
        
    return result
