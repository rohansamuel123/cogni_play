"""
Drop and recreate all tables with the updated schema.
Run this ONCE after updating models.

Usage: python db_migrate.py
"""
from dotenv import load_dotenv
load_dotenv()

from app.database import engine
from app.models import Base

print("WARNING: Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("All tables dropped.")

print("Recreating all tables with new schema...")
Base.metadata.create_all(bind=engine)
print("All tables created successfully!")
print()
print("Tables created:")
for table_name in Base.metadata.tables:
    print(f"  - {table_name}")
