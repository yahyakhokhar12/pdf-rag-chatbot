"""
Authentication API endpoints.
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_token_pair, verify_token, hash_password, verify_password,
    validate_password_strength, create_password_reset_token, verify_password_reset_token,
)
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.workspace import Workspace, WorkspaceType
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserResponse, MessageResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Register a new user account."""
    # Validate password strength
    issues = validate_password_strength(request.password)
    if issues:
        raise HTTPException(status_code=400, detail="; ".join(issues))

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check if username already exists
    existing = await db.execute(select(User).where(User.username == request.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    # Create user
    user = User(
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        role=UserRole.USER,
    )
    db.add(user)
    await db.flush()

    # Create default personal workspace
    workspace = Workspace(
        name="Personal",
        type=WorkspaceType.PERSONAL,
        owner_id=user.id,
    )
    db.add(workspace)
    await db.flush()

    # Generate tokens
    tokens = create_token_pair(str(user.id), user.role.value)
    return TokenResponse(**tokens)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Authenticate user and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    tokens = create_token_pair(str(user.id), user.role.value)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Refresh the access token using a valid refresh token."""
    payload = verify_token(request.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    tokens = create_token_pair(str(user.id), user.role.value)
    return TokenResponse(**tokens)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Send a password reset email (logs to console in development)."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user:
        reset_token = create_password_reset_token(user.email)
        # In production, send email. For now, log to console.
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET TOKEN for {user.email}:")
        print(f"{reset_token}")
        print(f"{'='*60}\n")

    # Always return success to prevent email enumeration
    return MessageResponse(message="If the email exists, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Reset password using a valid reset token."""
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    issues = validate_password_strength(request.new_password)
    if issues:
        raise HTTPException(status_code=400, detail="; ".join(issues))

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user.hashed_password = hash_password(request.new_password)
    await db.flush()

    return MessageResponse(message="Password has been reset successfully.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Get current user profile."""
    return current_user
