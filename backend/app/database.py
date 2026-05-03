from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
db_url= "postresql://postgres:1234@localhost:5432/IntelliSight_db"
engine= create_engine(db_url)
SessionLocal= sessionmaker()
