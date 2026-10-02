
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import User
from .schemas import UserCreate, UserLogin, UserProfileUpdate
from .auth import hash_password, verify_password, create_access_token
from .dependencies import get_current_user
from fastapi import HTTPException


router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -----------------------------
# REGISTER
# -----------------------------
@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }


# -----------------------------
# LOGIN
# -----------------------------
@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(existing_user.id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


# -----------------------------
# GET CURRENT USER PROFILE
# -----------------------------
@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "target_role": current_user.target_role,
        "experience_level": current_user.experience_level,
        "preferred_location": current_user.preferred_location,
        "college": current_user.college,
        "graduation_year": current_user.graduation_year
    }


# -----------------------------
# UPDATE CURRENT USER PROFILE
# -----------------------------

@router.put("/me")
def update_my_profile(
    profile: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch the user using this route's database session
    user = db.query(User).filter(User.id == current_user.id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Update profile fields
    user.name = profile.name
    user.target_role = profile.target_role
    user.experience_level = profile.experience_level
    user.preferred_location = profile.preferred_location
    user.college = profile.college
    user.graduation_year = profile.graduation_year

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "target_role": user.target_role,
        "experience_level": user.experience_level,
        "preferred_location": user.preferred_location,
        "college": user.college,
        "graduation_year": user.graduation_year
    }