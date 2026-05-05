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
DATABASE_URL = "postgresql://sarthaksingh@localhost:5432/dtstudent"

# --- Security Configuration ---
# We will use these in Phase 4 for authentication
SECRET_KEY = "your-super-secret-key-for-jwt"  # Change this to a random string
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Email Verification/OTP Configuration ---
OTP_SECRET = os.getenv("OTP_SECRET", SECRET_KEY)
OTP_TTL_MINUTES = int(os.getenv("OTP_TTL_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
OTP_MAX_RESENDS = int(os.getenv("OTP_MAX_RESENDS", "5"))

# --- SMTP Configuration ---
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "")
