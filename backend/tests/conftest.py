"""
FinBank Test Suite — Shared Fixtures & Configuration

Provides:
- Mock MongoDB database (mongomock or in-memory dicts)
- Mock Supabase auth
- Test client for FastAPI
- Common test data generators
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from fastapi.testclient import TestClient


# ── Test Data Generators ──


def make_user(
    user_id="test-user-001",
    email="test@finbank.com",
    role="customer",
    is_active=True,
    kyc_status="APPROVED",
):
    """Generate a mock user document."""
    return {
        "_id": "mongo-obj-id-001",
        "user_id": user_id,
        "email": email,
        "role": role,
        "is_active": is_active,
        "kyc_status": kyc_status,
        "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }


def make_account(
    account_id="ACC-001",
    user_id="test-user-001",
    account_number="1234567890",
    iban="TR000000000000001234567890",
    currency="TRY",
    status="active",
    account_type="checking",
):
    """Generate a mock account document."""
    return {
        "account_id": account_id,
        "user_id": user_id,
        "customer_id": "CUST-001",
        "account_number": account_number,
        "iban": iban,
        "account_type": account_type,
        "currency": currency,
        "status": status,
        "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }


def make_ledger_entry(
    account_id="ACC-001",
    entry_type="CREDIT",
    category="DEPOSIT",
    amount=1000.0,
    transaction_ref="DEP-12345678",
    created_by="test-user-001",
):
    """Generate a mock ledger entry."""
    import uuid
    return {
        "_id": f"mock-ledger-{uuid.uuid4().hex[:8]}",
        "entry_id": f"LED-{transaction_ref[-8:]}",
        "account_id": account_id,
        "type": entry_type,
        "category": category,
        "amount": amount,
        "transaction_ref": transaction_ref,
        "description": f"Test {category.lower()}",
        "created_at": datetime.now(timezone.utc),
        "created_by": created_by,
    }


# ── Mock Database ──


class MockCollection:
    """In-memory mock for MongoDB collection."""

    def __init__(self):
        self.data = []

    async def find_one(self, query):
        for doc in self.data:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                return doc.copy()
        return None

    async def insert_one(self, doc, session=None):
        doc_copy = doc.copy()
        if "_id" not in doc_copy:
            doc_copy["_id"] = f"mock-id-{len(self.data) + 1}"
        self.data.append(doc_copy)
        result = MagicMock()
        result.inserted_id = doc_copy["_id"]
        return result

    async def count_documents(self, query):
        count = 0
        for doc in self.data:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                count += 1
        return count

    def find(self, query=None):
        if query is None:
            query = {}
        results = []
        for doc in self.data:
            match = all(doc.get(k) == v for k, v in query.items())
            if match:
                results.append(doc.copy())
        return MockCursor(results)

    def aggregate(self, pipeline):
        """Simple aggregation mock for balance calculation."""
        results = []
        if pipeline and len(pipeline) >= 2:
            match_stage = pipeline[0].get("$match", {})
            matched = []
            for doc in self.data:
                m = all(doc.get(k) == v for k, v in match_stage.items())
                if m:
                    matched.append(doc)

            group_stage = pipeline[1].get("$group", {})
            if "$sum" in str(group_stage):
                total = sum(doc.get("amount", 0) for doc in matched)
                if matched:
                    results.append({"_id": None, "balance": total})

        return MockCursor(results)

    async def create_index(self, *args, **kwargs):
        pass


class MockCursor:
    """Mock for MongoDB cursor with chaining."""

    def __init__(self, data):
        self._data = data
        self._skip = 0
        self._limit = None

    def sort(self, *args, **kwargs):
        return self

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit = n
        return self

    async def to_list(self, length=None):
        data = self._data[self._skip:]
        if self._limit:
            data = data[:self._limit]
        if length:
            data = data[:length]
        return data


class MockDatabase:
    """In-memory mock MongoDB database."""

    def __init__(self):
        self.users = MockCollection()
        self.customers = MockCollection()
        self.accounts = MockCollection()
        self.ledger_entries = MockCollection()
        self.audit_logs = MockCollection()
        self.client = MockClient(self)


class MockSession:
    """Mock for MongoDB session."""

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    async def with_transaction(self, callback):
        """Execute callback directly (no real transaction)."""
        await callback(self)


class MockClient:
    """Mock for AsyncIOMotorClient."""

    def __init__(self, db):
        self._db = db

    async def start_session(self):
        return MockSession()


@pytest.fixture
def mock_db():
    """Provide a fresh mock database for each test."""
    return MockDatabase()


@pytest.fixture
def mock_user():
    """Provide a standard test user."""
    return make_user()


@pytest.fixture
def mock_admin_user():
    """Provide a test admin user."""
    return make_user(
        user_id="admin-001",
        email="admin@finbank.com",
        role="admin",
    )


@pytest.fixture
def mock_account():
    """Provide a standard test account."""
    return make_account()
