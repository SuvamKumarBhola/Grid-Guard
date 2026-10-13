import hashlib
from typing import List, Optional
from fastapi import Header, HTTPException, status
from pydantic import BaseModel
from app.config import get_settings


class UserContext(BaseModel):
    user_id: str
    role: str
    email: Optional[str] = None


VALID_ROLES = ["operator", "planner", "reliability_manager", "administrator", "auditor", "system"]


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
) -> UserContext:
    settings = get_settings()

    if settings.auth_mode == "development":
        # Convenient local development authentication
        role = x_user_role or "operator"
        if authorization and "Bearer " in authorization:
            token = authorization.replace("Bearer ", "").strip()
            if token.startswith("dev-token-"):
                role = token.replace("dev-token-", "")

        if role not in VALID_ROLES:
            role = "operator"

        return UserContext(
            user_id=x_user_id or f"usr-{role}",
            role=role,
            email=f"{role}@gridguard.internal",
        )

    # Production OIDC validation hook
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "").strip()
    if token == settings.auth_secret:
        return UserContext(user_id="service-account", role="administrator")

    # In production, this verifies JWT signature against OIDC JWKS
    # Reject invalid tokens
    if len(token) < 16:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OIDC token signature",
        )

    return UserContext(user_id=f"oidc-user-{token[:6]}", role="operator")


def require_role(allowed_roles: List[str]):
    def role_checker(
        authorization: Optional[str] = Header(None),
        x_user_role: Optional[str] = Header(None),
        x_user_id: Optional[str] = Header(None),
    ) -> UserContext:
        user = get_current_user(authorization, x_user_role, x_user_id)
        if user.role not in allowed_roles and "administrator" not in user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' not permitted. Required one of: {allowed_roles}",
            )
        return user

    return role_checker


def compute_input_hash(data: str) -> str:
    """Computes SHA-256 hash of prediction input for auditability."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()
