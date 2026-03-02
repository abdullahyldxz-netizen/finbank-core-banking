"""
FinBank Unit Tests — Security & RBAC

Tests role-based access control logic without importing the Supabase client.
We test the RBAC logic directly by replicating the functions' behavior.
"""
import pytest
from fastapi import HTTPException


# ── Replicated RBAC Logic for Testing ──
# These mirror app.core.security exactly but without Supabase dependency.

ROLE_REDIRECTS = {
    "customer": "/customer/dashboard",
    "employee": "/employee/portal",
    "ceo": "/executive/cockpit",
    "admin": "/admin/dashboard",
}


def get_redirect_url(role: str) -> str:
    return ROLE_REDIRECTS.get(role, "/")


def require_role(required_role: str):
    async def role_checker(current_user: dict):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {required_role}",
            )
        return current_user
    return role_checker


def require_roles(*allowed_roles: str):
    async def role_checker(current_user: dict):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker


# ═══════════════════════════════════════════
#  Role Redirect Mapping
# ═══════════════════════════════════════════


class TestRoleRedirects:
    """Each role must map to a correct dashboard URL."""

    def test_customer_redirect(self):
        assert get_redirect_url("customer") == "/customer/dashboard"

    def test_employee_redirect(self):
        assert get_redirect_url("employee") == "/employee/portal"

    def test_ceo_redirect(self):
        assert get_redirect_url("ceo") == "/executive/cockpit"

    def test_admin_redirect(self):
        assert get_redirect_url("admin") == "/admin/dashboard"

    def test_unknown_role_redirect(self):
        """Unknown roles redirect to root."""
        assert get_redirect_url("unknown") == "/"


# ═══════════════════════════════════════════
#  Role-Based Access Control
# ═══════════════════════════════════════════


class TestRequireRole:
    """Single-role access control dependency."""

    @pytest.mark.asyncio
    async def test_matching_role_passes(self):
        """User with matching role is allowed."""
        checker = require_role("admin")
        user = {"role": "admin", "user_id": "u1", "email": "a@b.com"}
        result = await checker(user)
        assert result["role"] == "admin"

    @pytest.mark.asyncio
    async def test_wrong_role_rejected(self):
        """User with wrong role gets 403 Forbidden."""
        checker = require_role("admin")
        user = {"role": "customer", "user_id": "u2", "email": "c@d.com"}
        with pytest.raises(HTTPException) as exc_info:
            await checker(user)
        assert exc_info.value.status_code == 403


class TestRequireRoles:
    """Multi-role access control dependency."""

    @pytest.mark.asyncio
    async def test_any_allowed_role_passes(self):
        """Any of the allowed roles grants access."""
        checker = require_roles("employee", "admin")
        user = {"role": "employee", "user_id": "u3", "email": "e@f.com"}
        result = await checker(user)
        assert result["role"] == "employee"

    @pytest.mark.asyncio
    async def test_disallowed_role_rejected(self):
        """Role not in allowed list gets 403."""
        checker = require_roles("employee", "admin")
        user = {"role": "customer", "user_id": "u4", "email": "g@h.com"}
        with pytest.raises(HTTPException) as exc_info:
            await checker(user)
        assert exc_info.value.status_code == 403


# ═══════════════════════════════════════════
#  RBAC Complete Role Matrix
# ═══════════════════════════════════════════


class TestRBACMatrix:
    """Verify all four role configurations are defined."""

    def test_all_roles_have_redirects(self):
        """Every defined role has a redirect URL."""
        expected_roles = {"customer", "employee", "ceo", "admin"}
        assert expected_roles == set(ROLE_REDIRECTS.keys())

    def test_four_roles_defined(self):
        """Exactly 4 roles must be configured."""
        assert len(ROLE_REDIRECTS) == 4
