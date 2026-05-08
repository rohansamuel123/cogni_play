from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base          # imports all models → auto-creates tables
from app.routes import user
from app.routes import game
from app.routes import score
from app.routes import session
from app.routes import report
from app.routes import child

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IntelliSight API",
    description="AI-powered cognitive development platform for early learners.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(game.router)
app.include_router(score.router)
app.include_router(session.router)
app.include_router(report.router)
app.include_router(report.singular_router)
app.include_router(child.router)

@app.get("/", tags=["Health"])
def home():
    return {"message": "IntelliSight Backend running 🚀"}
