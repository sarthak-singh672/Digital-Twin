from src.db.database import engine, Base
# This line is the fix!
# It's required so that Base.metadata knows about your tables.
from src.db import models

print("Connecting to database...")
try:
    print("Dropping all tables...")
    # This will now work, because Base knows about the 'users' table
    Base.metadata.drop_all(bind=engine)
    print("Successfully dropped all tables.")
except Exception as e:
    print(f"An error occurred while dropping tables: {e}")