import os

# --- Database Configuration ---
# The paper mentions 'postgresql://user:pass@localhost:5432/dtstudent' [cite: 206-207]
# We use that as our template.
#
# IMPORTANT: Before this works, you must:
# 1. Install PostgreSQL on your computer.
# 2. Create a new database named "dtstudent".
# 3. Update 'your_username' and 'your_password' below.
# This uses your Mac username 'sarthaksingh' and no password, which is the default for Postgres.app
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sarthaksingh@localhost:5432/dtstudent")

# --- Security Configuration ---
# We will use these in Phase 4 for authentication
APP_ENV = os.getenv("APP_ENV", "development").lower()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if APP_ENV == "production":
        raise RuntimeError("SECRET_KEY environment variable is required in production.")
    SECRET_KEY = "dev-insecure-secret-key"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
