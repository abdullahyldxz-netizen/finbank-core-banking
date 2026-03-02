"""
FinBank Unit Tests — Webhook Events

Verify that the event system correctly defines and publishes
all required webhook events:
- TransferCreated
- TransferCompleted
- AccountDebited
- AccountCredited
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock, call
from app.events.webhook import (
    WebhookEvent,
    publish_transfer_events,
)


# ═══════════════════════════════════════════
#  Event Type Constants
# ═══════════════════════════════════════════


class TestWebhookEventTypes:
    """All required event types must be defined (per assignment spec)."""

    def test_transfer_created(self):
        assert WebhookEvent.TRANSFER_CREATED == "TransferCreated"

    def test_transfer_completed(self):
        assert WebhookEvent.TRANSFER_COMPLETED == "TransferCompleted"

    def test_account_debited(self):
        assert WebhookEvent.ACCOUNT_DEBITED == "AccountDebited"

    def test_account_credited(self):
        assert WebhookEvent.ACCOUNT_CREDITED == "AccountCredited"

    def test_deposit_completed(self):
        assert WebhookEvent.DEPOSIT_COMPLETED == "DepositCompleted"

    def test_withdrawal_completed(self):
        assert WebhookEvent.WITHDRAWAL_COMPLETED == "WithdrawalCompleted"

    def test_account_created(self):
        assert WebhookEvent.ACCOUNT_CREATED == "AccountCreated"


# ═══════════════════════════════════════════
#  Webhook Sending (Non-blocking)
# ═══════════════════════════════════════════


class TestSendWebhook:
    """Webhook sender must be non-blocking and resilient."""

    @pytest.mark.asyncio
    async def test_successful_send(self):
        """Webhook sends event payload to configured URL."""
        with patch("app.events.webhook._send_webhook_with_retry", new_callable=AsyncMock) as mock_send, \
             patch("app.events.webhook.settings") as mock_settings, \
             patch("app.events.webhook.logger") as mock_logger:
            mock_settings.WEBHOOK_URL = "http://test:9000/webhook"
            mock_settings.WEBHOOK_TIMEOUT = 5
            mock_send.return_value = None

            from app.events.webhook import send_webhook
            await send_webhook("TestEvent", {"key": "value"})

            mock_send.assert_called_once()
            payload = mock_send.call_args[0][1]
            assert payload["event"] == "TestEvent"
            assert payload["payload"] == {"key": "value"}
            assert "timestamp" in payload

    @pytest.mark.asyncio
    async def test_failure_does_not_raise(self):
        """Webhook failure must not break the transaction (non-blocking)."""
        with patch("app.events.webhook._send_webhook_with_retry", new_callable=AsyncMock) as mock_send, \
             patch("app.events.webhook.settings") as mock_settings, \
             patch("app.events.webhook.logger") as mock_logger:
            mock_settings.WEBHOOK_URL = "http://test:9000/webhook"
            mock_settings.WEBHOOK_TIMEOUT = 5
            mock_send.side_effect = Exception("Network error")

            from app.events.webhook import send_webhook
            # Should NOT raise — webhook errors must be swallowed
            await send_webhook("TestEvent", {"key": "value"})


# ═══════════════════════════════════════════
#  Transfer Event Publishing (All 4 Required Events)
# ═══════════════════════════════════════════


class TestPublishTransferEvents:
    """A single transfer must fire all 4 required events in order."""

    @pytest.mark.asyncio
    @patch("app.events.webhook.send_webhook", new_callable=AsyncMock)
    async def test_publishes_four_events(self, mock_webhook):
        """Transfer publishes TransferCreated, AccountDebited, AccountCredited, TransferCompleted."""
        await publish_transfer_events(
            transfer_id="TXN-001",
            from_account="ACC-001",
            to_account="ACC-002",
            amount=5000.0,
            currency="TRY",
        )
        assert mock_webhook.call_count == 4

        event_names = [c.args[0] for c in mock_webhook.call_args_list]
        assert event_names == [
            "TransferCreated",
            "AccountDebited",
            "AccountCredited",
            "TransferCompleted",
        ]

    @pytest.mark.asyncio
    @patch("app.events.webhook.send_webhook", new_callable=AsyncMock)
    async def test_debit_event_has_source_account(self, mock_webhook):
        """AccountDebited event must reference the source account."""
        await publish_transfer_events(
            transfer_id="TXN-002",
            from_account="ACC-SRC",
            to_account="ACC-DST",
            amount=1000.0,
        )
        debit_call = mock_webhook.call_args_list[1]
        assert debit_call.args[1]["account_id"] == "ACC-SRC"

    @pytest.mark.asyncio
    @patch("app.events.webhook.send_webhook", new_callable=AsyncMock)
    async def test_credit_event_has_target_account(self, mock_webhook):
        """AccountCredited event must reference the target account."""
        await publish_transfer_events(
            transfer_id="TXN-003",
            from_account="ACC-SRC",
            to_account="ACC-DST",
            amount=1000.0,
        )
        credit_call = mock_webhook.call_args_list[2]
        assert credit_call.args[1]["account_id"] == "ACC-DST"
