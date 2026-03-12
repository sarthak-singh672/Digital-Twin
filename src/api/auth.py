from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from src.db import database, models
from src.api import schemas
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# --- Password Hashing Setup ---
# We use bcrypt, a strong hashing algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2/Token Setup ---
# This tells FastAPI "where" to get the token from the request.
# It will look for an 'Authorization: Bearer <token>' header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")


def verify_password(plain_password, hashed_password):
    """Checks if a plain-text password matches a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Generates a hash from a plain-text password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Creates a new JWT (JSON Web Token) for authentication.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user(db: Session, email: str):
    """Utility function to get a user from the database by email."""
    return db.query(models.User).filter(models.User.email == email).first()


def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(database.get_db)
):
    """
    This is our main authentication dependency.
    It decodes the token, validates it, and fetches the user from the DB.

    Any endpoint that uses `Depends(get_current_user)` will be protected.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 'sub' is the "subject" of the token, which we set as the user's ID
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception

        token_data = schemas.TokenData(user_id=int(user_id_str))

    except JWTError:
        raise credentials_exception
    except ValueError:
        raise credentials_exception

    # Fetch the user from the database
    user = db.query(models.User).filter(models.User.user_id == token_data.user_id).first()

    if user is None:
        raise credentials_exception

    return user