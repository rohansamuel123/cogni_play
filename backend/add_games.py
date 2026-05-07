from dotenv import load_dotenv
load_dotenv()
from app.database import SessionLocal
from app.models.game import Game

games_to_add = [
    {
        "game_name": "Color Recall",
        "game_description": "Remember and repeat the color sequence!",
        "game_type": "color-recall",
        "game_difficulty": 1
    },
    {
        "game_name": "Speed Tap",
        "game_description": "Tap the target as fast as you can!",
        "game_type": "speed-tap",
        "game_difficulty": 1
    },
    {
        "game_name": "Balloon Pop",
        "game_description": "Pop the right balloons, skip the wrong ones!",
        "game_type": "balloon-pop",
        "game_difficulty": 1
    },
    {
        "game_name": "Card Match",
        "game_description": "Find all the matching pairs!",
        "game_type": "card-match",
        "game_difficulty": 1
    },
    {
        "game_name": "Odd One Out",
        "game_description": "Spot the one that doesn't belong!",
        "game_type": "odd-one-out",
        "game_difficulty": 1
    },
    {
        "game_name": "Pattern Puzzle",
        "game_description": "Complete the pattern!",
        "game_type": "pattern-puzzle",
        "game_difficulty": 1
    },
    {
        "game_name": "Sequence Builder",
        "game_description": "Build the correct sequence!",
        "game_type": "sequence-builder",
        "game_difficulty": 1
    },
    {
        "game_name": "Follow Steps",
        "game_description": "Listen carefully and follow instructions!",
        "game_type": "follow-steps",
        "game_difficulty": 1
    },
    {
        "game_name": "Story Builder",
        "game_description": "Build stories by putting events in order!",
        "game_type": "story-builder",
        "game_difficulty": 1
    },
    {
        "game_name": "Color Mixer Lab",
        "game_description": "Mix primary colors to discover new ones!",
        "game_type": "color-mixer",
        "game_difficulty": 1
    }
]

db = SessionLocal()

for game_data in games_to_add:
    existing_game = db.query(Game).filter(Game.game_type == game_data["game_type"]).first()
    if not existing_game:
        print(f"Adding {game_data['game_name']}...")
        new_game = Game(**game_data)
        db.add(new_game)
    else:
        print(f"{game_data['game_name']} already exists.")

db.commit()
db.close()
print("Done!")
