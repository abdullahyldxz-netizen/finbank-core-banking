"""
FinBank Unit Tests — Custom Exceptions

Verify that domain-specific exceptions return correct HTTP status codes
and error messages, ensuring secure error responses per assignment requirements.
"""
import pytest
from app.core.exceptions import (
    InsufficientFundsError,
    AccountNotFoundError,
    CustomerNotFoundError,
    DuplicateTransactionError,
    AccountFrozenError,
    SameAccountTransferError,
    InvalidAmountError,
)


class TestInsufficientFundsError:
    """Financial transactions must reject insufficient balance."""

    def test_status_code(self):
        err = InsufficientFundsError()
        assert err.status_code == 400

    def test_message(self):
        err = InsufficientFundsError()
        assert "Insufficient funds" in err.detail


class TestAccountNotFoundError:
    """Missing account returns 404."""

    def test_status_code(self):
        err = AccountNotFoundError("ACC-999")
        assert err.status_code == 404

    def test_includes_account_id(self):
        err = AccountNotFoundError("ACC-999")
        assert "ACC-999" in err.detail

    def test_empty_account_id(self):
        err = AccountNotFoundError()
        assert "Account not found" in err.detail


class TestCustomerNotFoundError:
    """Missing customer returns 404."""

    def test_status_code(self):
        err = CustomerNotFoundError()
        assert err.status_code == 404


class TestDuplicateTransactionError:
    """Idempotency: duplicate transactions return 409 Conflict."""

    def test_status_code(self):
        err = DuplicateTransactionError()
        assert err.status_code == 409

    def test_message(self):
        err = DuplicateTransactionError()
        assert "Duplicate" in err.detail


class TestAccountFrozenError:
    """Frozen/closed accounts must be rejected."""

    def test_status_code(self):
        err = AccountFrozenError()
        assert err.status_code == 403


class TestSameAccountTransferError:
    """Transfer to same account must be rejected."""

    def test_status_code(self):
        err = SameAccountTransferError()
        assert err.status_code == 400

    def test_message(self):
        err = SameAccountTransferError()
        assert "same account" in err.detail.lower()


class TestInvalidAmountError:
    """Zero or negative amounts must be rejected."""

    def test_status_code(self):
        err = InvalidAmountError()
        assert err.status_code == 400
