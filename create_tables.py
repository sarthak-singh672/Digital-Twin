from src.db.database import engine, Base
# Import all models so Base knows about them
from src.db import models

print("Connecting to database...")
try:
    # This line tells SQLAlchemy to find all classes that inherit from Base
    # and create the corresponding tables in the database.
    Base.metadata.create_all(bind=engine)
    print("Successfully created all tables in the 'dtstudent' database.")
except Exception as e:
    print(f"An error occurred while creating tables: {e}")