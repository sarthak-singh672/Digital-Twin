import os  # 🚀 Added this
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# Import your local URL as a backup
from config import DATABASE_URL as LOCAL_DATABASE_URL

# 🚀 THE "SMART SWITCH"
# It tries to find a cloud variable first. If none exists, it uses your local one.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", LOCAL_DATABASE_URL)

# Create the SQLAlchemy engine using the resolved URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
# Create a 'SessionLocal' class. Each instance of this class
# will be a new database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a 'Base' class. Our database model classes (in models.py)
# will inherit from this class.
Base = declarative_base()

# Utility function to get a DB session.
# We will use this in Phase 4 (API) for dependency injection.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()