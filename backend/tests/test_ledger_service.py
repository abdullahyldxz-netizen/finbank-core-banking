"""
FinBank Unit Tests — Ledger Service (Core Financial Logic)

The ledger is the SINGLE SOURCE OF TRUTH for all financial data.
These tests verify:
- Append-only behavior
- Balance computation via aggregation
- Deposit / Withdrawal logic
- Transfer atomicity (debit + credit)
- Insufficient funds rejection
- Double-entry bookkeeping principles
"""
import pytest
import pytest_asyncio
from app.services.ledger_service import LedgerService
from app.core.exceptions import InsufficientFundsError
from tests.conftest import MockDatabase, make_ledger_entry


@pytest.fixture
def ledger():
    """Create a LedgerService with a mock database."""
    db = MockDatabase()
    return LedgerService(db)


@pytest.fixture
def funded_ledger():
    """Create a LedgerService with a pre-funded account (10,000 TRY)."""
    db = MockDatabase()
    # Pre-populate with a deposit
    db.ledger_entries.data.append(
        make_ledger_entry(
            account_id="ACC-001",
            entry_type="CREDIT",
            category="DEPOSIT",
            amount=10000.0,
            transaction_ref="DEP-INITIAL1",
        )
    )
    return LedgerService(db)


# ═══════════════════════════════════════════
#  Balance Computation
# ═══════════════════════════════════════════


class TestBalanceComputation:
    """Balance must always be computed from ledger entries, never stored."""

    @pytest.mark.asyncio
    async def test_zero_balance_empty_account(self, ledger):
        """New account with no entries has zero balance."""
        balance = await ledger.get_balance("ACC-EMPTY")
        assert balance == 0.0

    @pytest.mark.asyncio
    async def test_balance_after_deposit(self, funded_ledger):
        """Balance reflects deposit entry."""
        balance = await funded_ledger.get_balance("ACC-001")
        assert balance == 10000.0

    @pytest.mark.asyncio
    async def test_balance_multiple_entries(self):
        """Balance is the sum of all entries for an account."""
        db = MockDatabase()
        # Deposit 5000
        db.ledger_entries.data.append(
            make_ledger_entry(amount=5000.0, transaction_ref="DEP-001")
        )
        # Deposit 3000
        db.ledger_entries.data.append(
            make_ledger_entry(amount=3000.0, transaction_ref="DEP-002")
        )
        # Withdraw 1000 (negative amount in ledger)
        db.ledger_entries.data.append(
            make_ledger_entry(
                amount=-1000.0,
                entry_type="DEBIT",
                category="WITHDRAWAL",
                transaction_ref="WDR-001",
            )
        )
        ledger = LedgerService(db)
        balance = await ledger.get_balance("ACC-001")
        assert balance == 7000.0


# ═══════════════════════════════════════════
#  Deposit Operations
# ═══════════════════════════════════════════


class TestDeposit:
    """Deposit creates a CREDIT ledger entry."""

    @pytest.mark.asyncio
    async def test_deposit_creates_credit_entry(self, ledger):
        """Deposit creates a CREDIT entry with positive amount."""
        entry = await ledger.deposit(
            account_id="ACC-001",
            amount=5000.0,
            created_by="test-user-001",
            description="Initial deposit",
        )
        assert entry["type"] == "CREDIT"
        assert entry["category"] == "DEPOSIT"
        assert entry["amount"] == 5000.0
        assert entry["account_id"] == "ACC-001"

    @pytest.mark.asyncio
    async def test_deposit_generates_unique_ref(self, ledger):
        """Each deposit gets a unique transaction reference."""
        entry1 = await ledger.deposit("ACC-001", 100.0, "user-1")
        entry2 = await ledger.deposit("ACC-001", 200.0, "user-1")
        assert entry1["transaction_ref"] != entry2["transaction_ref"]
        assert entry1["transaction_ref"].startswith("DEP-")

    @pytest.mark.asyncio
    async def test_deposit_updates_balance(self, ledger):
        """Balance increases after deposit."""
        await ledger.deposit("ACC-001", 3000.0, "user-1")
        balance = await ledger.get_balance("ACC-001")
        assert balance == 3000.0


# ═══════════════════════════════════════════
#  Withdrawal Operations
# ═══════════════════════════════════════════


class TestWithdrawal:
    """Withdrawal creates a DEBIT ledger entry with negative amount."""

    @pytest.mark.asyncio
    async def test_withdrawal_creates_debit_entry(self, funded_ledger):
        """Withdrawal creates a DEBIT entry with negative amount."""
        entry = await funded_ledger.withdraw(
            account_id="ACC-001",
            amount=2000.0,
            created_by="test-user-001",
        )
        assert entry["type"] == "DEBIT"
        assert entry["category"] == "WITHDRAWAL"
        assert entry["amount"] == -2000.0

    @pytest.mark.asyncio
    async def test_insufficient_funds_rejected(self, ledger):
        """Withdrawal exceeding balance raises InsufficientFundsError."""
        with pytest.raises(InsufficientFundsError):
            await ledger.withdraw(
                account_id="ACC-001",
                amount=999999.0,
                created_by="test-user-001",
            )

    @pytest.mark.asyncio
    async def test_exact_balance_withdrawal(self, funded_ledger):
        """Withdrawal of exact balance succeeds."""
        entry = await funded_ledger.withdraw(
            account_id="ACC-001",
            amount=10000.0,
            created_by="test-user-001",
        )
        assert entry["amount"] == -10000.0
        balance = await funded_ledger.get_balance("ACC-001")
        assert balance == 0.0


# ═══════════════════════════════════════════
#  Transfer Operations (Double-Entry)
# ═══════════════════════════════════════════


class TestTransfer:
    """Transfer must create paired DEBIT + CREDIT entries (double-entry)."""

    @pytest.mark.asyncio
    async def test_transfer_creates_two_entries(self, funded_ledger):
        """Transfer creates exactly 2 ledger entries (debit + credit)."""
        initial_count = len(funded_ledger.collection.data)
        await funded_ledger.execute_transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-002",
            amount=3000.0,
            created_by="test-user-001",
        )
        new_entries = funded_ledger.collection.data[initial_count:]
        assert len(new_entries) == 2

    @pytest.mark.asyncio
    async def test_transfer_debit_credit_match(self, funded_ledger):
        """Debit amount must equal credit amount (double-entry)."""
        await funded_ledger.execute_transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-002",
            amount=5000.0,
            created_by="test-user-001",
        )
        entries = funded_ledger.collection.data[1:]  # Skip initial deposit
        debit = next(e for e in entries if e["type"] == "DEBIT")
        credit = next(e for e in entries if e["type"] == "CREDIT")
        assert abs(debit["amount"]) == credit["amount"]

    @pytest.mark.asyncio
    async def test_transfer_updates_both_balances(self, funded_ledger):
        """Source balance decreases, target balance increases."""
        await funded_ledger.execute_transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-002",
            amount=4000.0,
            created_by="test-user-001",
        )
        source_balance = await funded_ledger.get_balance("ACC-001")
        target_balance = await funded_ledger.get_balance("ACC-002")
        assert source_balance == 6000.0  # 10000 - 4000
        assert target_balance == 4000.0

    @pytest.mark.asyncio
    async def test_transfer_insufficient_funds(self, funded_ledger):
        """Transfer exceeding balance raises InsufficientFundsError."""
        with pytest.raises(InsufficientFundsError):
            await funded_ledger.execute_transfer(
                from_account_id="ACC-001",
                to_account_id="ACC-002",
                amount=50000.0,
                created_by="test-user-001",
            )

    @pytest.mark.asyncio
    async def test_transfer_returns_ref(self, funded_ledger):
        """Transfer returns a unique transaction reference."""
        ref = await funded_ledger.execute_transfer(
            from_account_id="ACC-001",
            to_account_id="ACC-002",
            amount=1000.0,
            created_by="test-user-001",
        )
        assert ref.startswith("TXN-")
        assert len(ref) == 12  # TXN- + 8 hex chars


# ═══════════════════════════════════════════
#  Ledger Query / Pagination
# ═══════════════════════════════════════════


class TestLedgerQuery:
    """Verify ledger entry querying with filters and pagination."""

    @pytest.mark.asyncio
    async def test_get_entries_empty(self, ledger):
        """Empty ledger returns no entries."""
        entries, total = await ledger.get_entries()
        assert total == 0
        assert entries == []

    @pytest.mark.asyncio
    async def test_get_entries_with_filter(self, funded_ledger):
        """Filter entries by account_id."""
        entries, total = await funded_ledger.get_entries(
            account_id="ACC-001"
        )
        assert total == 1
        assert entries[0]["account_id"] == "ACC-001"

    @pytest.mark.asyncio
    async def test_get_entries_pagination(self):
        """Pagination limits results correctly."""
        db = MockDatabase()
        # Add 5 entries
        for i in range(5):
            db.ledger_entries.data.append(
                make_ledger_entry(transaction_ref=f"DEP-{i:08d}")
            )
        ledger = LedgerService(db)
        entries, total = await ledger.get_entries(limit=2)
        assert total == 5
        assert len(entries) == 2
