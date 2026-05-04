from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import os

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise ValueError("DATABASE_URL is not set")

# Create database if it doesn't exist (for PostgreSQL)
try:
    engine = create_engine(db_url)
    engine.connect()
except OperationalError:
    # Database doesn't exist, create it
    db_name = db_url.split('/')[-1]
    server_url = db_url.rsplit('/', 1)[0] + '/postgres'
    
    # Use isolation_level='AUTOCOMMIT' to allow CREATE DATABASE
    server_engine = create_engine(server_url, isolation_level='AUTOCOMMIT')
    with server_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE {db_name}"))
    
    server_engine.dispose()
    
    # Now create the actual engine
    engine = create_engine(db_url)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()