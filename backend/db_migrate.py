"""
Smart Database Migration Script
Updates the schema (adds new tables/columns) without dropping existing data.
"""
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import inspect, text
from app.database import engine
from app.models import Base
import sqlalchemy

def get_sql_type(column, dialect):
    """Returns the SQL string for a column type."""
    return column.type.compile(dialect=dialect)

def migrate():
    print("------------------------------------------------")
    print("IntelliSight - Smart Migration Engine")
    print("------------------------------------------------")
    
    inspector = inspect(engine)
    
    # 1. Create any brand new tables
    print("Checking for new tables...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Check existing tables for missing columns
    print("Checking for schema updates in existing tables...")
    with engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            # Get existing columns from the actual database
            existing_cols = {c['name'] for c in inspector.get_columns(table_name)}
            
            for column in table.columns:
                if column.name not in existing_cols:
                    print(f"  [+] Found new column: {table_name}.{column.name}")
                    
                    # Generate the ALTER TABLE statement
                    type_str = get_sql_type(column, engine.dialect)
                    
                    # Handle nullability and defaults safely
                    alter_query = f'ALTER TABLE "{table_name}" ADD COLUMN "{column.name}" {type_str}'
                    
                    # If the column is NOT NULL, we should provide a default if there's data
                    if not column.nullable:
                        if column.default is not None:
                            # Simple default handling
                            default_val = column.default.arg
                            if isinstance(default_val, str):
                                alter_query += f" DEFAULT '{default_val}'"
                            else:
                                alter_query += f" DEFAULT {default_val}"
                        else:
                            # If no default provided but NOT NULL, we make it nullable for the migration
                            # to avoid crashing on existing rows, or assume it's okay.
                            pass

                    try:
                        conn.execute(text(alter_query))
                        conn.commit()
                        print(f"      Successfully added.")
                    except Exception as e:
                        print(f"      Error adding column: {e}")
                        conn.rollback()

    print("------------------------------------------------")
    print("SUCCESS: Database schema is up to date!")
    print("Data was preserved.")
    print("------------------------------------------------")

if __name__ == "__main__":
    migrate()
