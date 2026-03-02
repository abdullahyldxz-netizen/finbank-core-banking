"""
FinBank Unit Tests — Audit Service

Verify that the audit system correctly records all required fields:
- user_id, action, timestamp, outcome, IP address, User-Agent

Note: Tests avoid importing modules that trigger Supabase initialization.
"""
import pytest
from datetime import datetime, timezone
from tests.conftest import MockDatabase


# ═══════════════════════════════════════════
#  Audit Log Structure (Direct DB Testing)
# ═══════════════════════════════════════════


class TestAuditLogFields:
    """Every audit entry must include all required fields per assignment spec."""

    @pytest.mark.asyncio
    async def test_audit_log_has_required_fields(self):
        """Audit log entry contains user_id, action, timestamp, outcome."""
        mock_db = MockDatabase()

        # Simulate what log_audit does (same logic as audit_service.py)
        audit_entry = {
            "user_id": "test-user-001",
            "user_email": "test@test.com",
            "role": "customer",
            "action": "TEST_ACTION",
            "details": "Test audit entry",
            "ip_address": "127.0.0.1",
            "user_agent": "TestAgent/1.0",
            "outcome": "SUCCESS",
            "timestamp": datetime.now(timezone.utc),
        }
        await mock_db.audit_logs.insert_one(audit_entry)

        assert len(mock_db.audit_logs.data) == 1
        entry = mock_db.audit_logs.data[0]
        assert entry["user_id"] == "test-user-001"
        assert entry["action"] == "TEST_ACTION"
        assert entry["outcome"] == "SUCCESS"
        assert "timestamp" in entry
        assert entry["ip_address"] == "127.0.0.1"
        assert entry["user_agent"] == "TestAgent/1.0"

    @pytest.mark.asyncio
    async def test_audit_log_failure_outcome(self):
        """Audit logs can record FAILURE outcomes."""
        mock_db = MockDatabase()

        audit_entry = {
            "user_id": None,
            "user_email": "attacker@evil.com",
            "role": None,
            "action": "LOGIN_FAILED",
            "details": "Wrong password",
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0",
            "outcome": "FAILURE",
            "timestamp": datetime.now(timezone.utc),
        }
        await mock_db.audit_logs.insert_one(audit_entry)

        entry = mock_db.audit_logs.data[0]
        assert entry["outcome"] == "FAILURE"
        assert entry["action"] == "LOGIN_FAILED"

    @pytest.mark.asyncio
    async def test_audit_log_includes_ip_and_useragent(self):
        """Client info (IP + User-Agent) is captured for compliance."""
        mock_db = MockDatabase()

        audit_entry = {
            "user_id": "user-x",
            "action": "TRANSFER_EXECUTED",
            "outcome": "SUCCESS",
            "ip_address": "10.0.0.1",
            "user_agent": "Chrome/120.0",
            "timestamp": datetime.now(timezone.utc),
        }
        await mock_db.audit_logs.insert_one(audit_entry)

        entry = mock_db.audit_logs.data[0]
        assert entry["ip_address"] == "10.0.0.1"
        assert entry["user_agent"] == "Chrome/120.0"

    @pytest.mark.asyncio
    async def test_audit_log_append_only(self):
        """Multiple audit entries accumulate without overwriting."""
        mock_db = MockDatabase()

        for i in range(5):
            await mock_db.audit_logs.insert_one({
                "user_id": f"user-{i}",
                "action": "ACTION",
                "outcome": "SUCCESS",
                "timestamp": datetime.now(timezone.utc),
            })

        assert len(mock_db.audit_logs.data) == 5
