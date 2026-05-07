from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse, GoogleAuthRequest
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new parent account. Returns a JWT on success."""
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Hash before storing — never persist plain-text passwords
    hashed = hash_password(user.password)
    new_user = User(
        name=user.name,
        age=user.age,
        gender=user.gender,
        email=user.email,
        password=hashed,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.user_id)})
    return TokenResponse(access_token=token, user=new_user)


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a parent account. Returns a JWT on success."""
    user = db.query(User).filter(User.email == credentials.email).first()

    # Use a generic message so we don't reveal whether the email exists
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user.user_id)})
    return TokenResponse(access_token=token, user=user)


# ── Protected: current user ────────────────────────────────────────────────────

@router.post("/google", response_model=TokenResponse)
def google_auth(auth_req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate via Google id_token. Returns a JWT on success."""
    import os
    import traceback

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

    try:
        # Verify the token with Google
        # audience=GOOGLE_CLIENT_ID ensures the token was issued for our app
        idinfo = id_token.verify_oauth2_token(
            auth_req.id_token,
            google_requests.Request(),
            audience=GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,  # tolerate slight clock drift
        )

        # Verify the issuer
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid issuer")

        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")

        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create user automatically
            import secrets
            random_password = secrets.token_urlsafe(16)
            hashed = hash_password(random_password)
            user = User(
                name=name,
                age=30,  # Default parent values
                gender="Other",
                email=email,
                password=hashed
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token(data={"sub": str(user.user_id)})
        return TokenResponse(access_token=token, user=user)

    except ValueError as e:
        print(f"[Google Auth] Token verification FAILED: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )


# ── Protected: current user ────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the currently authenticated parent account and all associated data."""
    db.delete(current_user)  # cascades to children, sessions, reports, scores
    db.commit()


# ── Admin / utility ───────────────────────────────────────────────────────────

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),   # require auth
):
    """List all parent accounts. Requires a valid token."""
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get a specific user by ID. Requires a valid token."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user