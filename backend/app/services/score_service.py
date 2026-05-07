from sqlalchemy.orm import Session
from app.models.session import Session as GameSession
from app.models.score import DomainScore, CognitiveHistory
from typing import Dict, List

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
        if s.game_key not in best_per_game or s.score > best_per_game[s.game_key]["score"]:
            best_per_game[s.game_key] = {"score": s.score, "domain": s.domain}

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
    return updated_domains

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
